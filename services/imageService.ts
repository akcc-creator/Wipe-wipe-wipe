
import { GoogleGenAI } from '@google/genai';

// Initialize the client directly on the frontend.
// Note: In a production public app, you might want to proxy this, but for a demo/rehab tool, 
// client-side is much more reliable for image generation timeouts.
const getAIClient = () => {
  if (!process.env.API_KEY) {
    console.error("API Key is missing. Please set API_KEY in your .env file.");
    throw new Error("系統設定錯誤：找不到 API Key，請檢查環境變數。");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateThemeBackground = async (prompt: string): Promise<string | null> => {
  try {
    const ai = getAIClient();
    
    console.log("Generating image with prompt:", prompt);

    // Using gemini-2.5-flash-image for image generation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt + ". Photorealistic, high quality, vivid colors, 16:9 aspect ratio, cinematic lighting." }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      },
    });

    // Extract the base64 image data
    let imageBase64 = null;
    const parts = response.candidates?.[0]?.content?.parts;
    
    if (parts) {
      for (const part of parts) {
        if (part.inlineData) {
          imageBase64 = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageBase64) {
      console.warn("Model returned text instead of image.", response);
      return null;
    }

    return imageBase64;
  } catch (error: any) {
    console.error("Image generation failed:", error);
    // Return the error message to be handled by the UI if possible, or null
    if (error.message.includes("API Key")) {
        throw error; // Re-throw configuration errors
    }
    return null;
  }
};

export const generateRandomBackground = async (): Promise<string | null> => {
  // Expanded themes for maximum surprise
  const themes = [
    "A cute fluffy cat wearing sunglasses on a beach",
    "A futuristic cyberpunk city with neon lights and flying cars",
    "A delicious giant strawberry cake with whipped cream",
    "A magical dragon flying over a medieval castle",
    "A close-up of a colorful parrot in a jungle",
    "An astronaut floating in deep space with colorful nebula",
    "A cozy library filled with ancient magical books",
    "A steampunk locomotive train traveling through clouds",
    "A vibrant coral reef with a sea turtle",
    "A field of sunflowers with a blue sky",
    "A retro 80s synthwave sunset landscape",
    "A peaceful japanese zen garden with cherry blossoms",
    "A majestic hot air balloon festival over mountains",
    "A fantasy treehouse village glowing at night"
  ];
  
  const randomTheme = themes[Math.floor(Math.random() * themes.length)];
  const fullPrompt = `Create a high quality image of: ${randomTheme}. 16:9 aspect ratio, photorealistic OR artistic style.`;

  return generateThemeBackground(fullPrompt);
};
