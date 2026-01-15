
import { GoogleGenAI } from '@google/genai';

// === GENERATION STRATEGY ===
// 1. If API_KEY is present in client bundle -> Use Client-Side SDK (Fastest, works on static hosts/local).
// 2. If API_KEY is missing -> Try /api/generate endpoint (For Vercel deployments where key is server-side only).
// 3. If both fail -> Throw specific error to UI.

export interface GenerationResult {
  url: string;
  source: 'AI' | 'FALLBACK';
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateClientSide = async (prompt: string): Promise<string | null> => {
  // Debug Logging
  if (!process.env.API_KEY) {
    console.warn("❌ Client-Side: API_KEY is missing in process.env");
    return null;
  } else {
    console.log("✅ Client-Side: API_KEY found. Length:", process.env.API_KEY.length);
  }
  
  console.log("Generating with Client-Side SDK (Imagen 3)...");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Switch to Imagen 3 (imagen-3.0-generate-001) using generateImages API
  // This helps bypass the quota limits often hit by gemini-2.5-flash-image
  const response = await ai.models.generateImages({
    model: 'imagen-3.0-generate-001',
    prompt: prompt + ". Photorealistic, 8k resolution, highly detailed, vivid colors, 16:9 aspect ratio, cinematic lighting.",
    config: {
      numberOfImages: 1,
      aspectRatio: '16:9',
      outputMimeType: 'image/jpeg'
    }
  });

  const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
  if (imageBytes) {
    return `data:image/jpeg;base64,${imageBytes}`;
  }
  return null;
};

const generateServerSide = async (prompt: string): Promise<string | null> => {
  console.log("Generating with Server-Side Proxy...");
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    
    // Handle HTML response (common when hitting 404 on Vite dev server or Vercel routing issues)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      throw new Error("Server endpoint unreachable. Please check Vercel API function logs.");
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Server generation failed');
    }
    return data.image;
  } catch (e: any) {
    console.warn("Server-side generation error:", e);
    throw e;
  }
};

const attemptGeneration = async (
  genFunc: () => Promise<string | null>, 
  maxRetries = 3
): Promise<string | null> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (i > 0) console.log(`Retry attempt ${i + 1}/${maxRetries}...`);
      const result = await genFunc();
      if (result) return result;
    } catch (error: any) {
      console.warn(`Attempt ${i + 1} failed:`, error.message);
      
      // Stop retrying if it's a configuration error (missing key/endpoint)
      if (error.message.includes("not found") || error.message.includes("API_KEY") || error.message.includes("Missing")) {
        throw error;
      }
      
      if (i === maxRetries - 1) throw error;
      
      // Backoff: 2s, 4s, 8s
      const waitTime = 2000 * Math.pow(2, i); 
      await delay(waitTime);
    }
  }
  return null;
};

export const generateThemeBackground = async (prompt: string): Promise<GenerationResult | null> => {
  try {
    let imageUrl: string | null = null;
    
    // Check if we have the key directly available
    const hasClientKey = !!process.env.API_KEY;

    // Strategy: Prefer Client Side on Vercel Hobby (avoids 10s server timeout)
    imageUrl = await attemptGeneration(async () => {
      if (hasClientKey) {
        return await generateClientSide(prompt);
      } else {
        return await generateServerSide(prompt);
      }
    });

    if (!imageUrl) throw new Error("No image data returned.");

    return {
        url: imageUrl,
        source: 'AI'
    };

  } catch (error: any) {
    console.error("AI Generation Failed:", error);
    throw error; // Propagate to App.tsx for the error modal
  }
};

export const generateRandomBackground = async (): Promise<GenerationResult | null> => {
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
