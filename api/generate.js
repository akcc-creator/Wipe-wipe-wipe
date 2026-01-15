import { GoogleGenAI } from '@google/genai';

// Switch to Node.js runtime (remove 'edge' config) for better stability with the SDK
export default async function handler(request, response) {
  // Handle CORS if needed, though usually same-origin in Vercel
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt } = request.body; 

    if (!process.env.API_KEY) {
      console.error("Server Error: API_KEY is missing in environment variables.");
      return response.status(500).json({ error: 'Server configuration error: API Key missing.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    console.log("Attempting to generate image with prompt:", prompt);

    // Using gemini-2.5-flash-image
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt + ". Photorealistic, high quality, vivid colors, 16:9 aspect ratio." }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      },
    });

    // Extract the base64 image data
    let imageBase64 = null;
    const parts = result.candidates?.[0]?.content?.parts;
    
    if (parts) {
      for (const part of parts) {
        if (part.inlineData) {
          imageBase64 = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageBase64) {
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      console.warn("Model returned text instead of image:", text);
      return response.status(500).json({ error: 'Generation failed: Model returned text instead of image.' });
    }

    return response.status(200).json({ image: imageBase64 });

  } catch (error) {
    console.error("API Error Detailed:", error);
    const errorMessage = error.message || "Unknown server error";
    return response.status(500).json({ error: errorMessage });
  }
}