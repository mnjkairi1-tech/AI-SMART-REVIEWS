import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAIClient() {
  if (!aiClient) {
    // DEBUG: Log all available env variables
    console.log("DEBUG: All env variables:", (import.meta as any).env);
    
    // In Vite production, import.meta.env is replaced at build time.
    let apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    
    // Fallback to process.env if available (for local dev/custom setups)
    if (!apiKey && typeof process !== 'undefined' && process.env.GEMINI_API_KEY) {
      apiKey = process.env.GEMINI_API_KEY;
    }
      
    // Clean up the API key just in case it has quotes or whitespace
    if (apiKey) {
      apiKey = apiKey.trim().replace(/^["']|["']$/g, '');
    }
      
    if (!apiKey) {
      console.error("Gemini API Key is missing!");
      const env = (import.meta as any).env || {};
      throw new Error("Gemini API key is missing. Please configure VITE_GEMINI_API_KEY in your Vercel environment variables. Available env keys: " + Object.keys(env).join(", "));
    }
    
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export async function generateReviews(shopName: string, shopType: string, rating: number, categories: string[], shopContextPrompt?: string) {
  try {
    // Ab hum direct Gemini ko call nahi kar rahe, balki apne Vercel backend ko call kar rahe hain
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shopName,
        shopType,
        rating,
        categories,
        shopContextPrompt
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to generate reviews from backend.");
    }

    return data.reviews || [];
  } catch (error: any) {
    console.error("Error generating reviews:", error);
    throw new Error(error?.message || "Failed to generate reviews. Please try again.");
  }
}

export async function generateDynamicOptions(shopName: string, shopContextPrompt?: string) {
  try {
    const response = await fetch('/api/generateOptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shopName,
        shopContextPrompt
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to generate options from backend.");
    }

    return data;
  } catch (error: any) {
    console.error("Error generating options:", error);
    // Fallback options if API fails
    return {
      liked: ['Friendly Staff', 'Clean Environment', 'Great Service', 'Good Quality', 'Fast Service', 'Nice Atmosphere', 'Tasty Food', 'Good Value', 'Professional', 'Helpful'],
      disliked: ['Slow Service', 'Dirty', 'Rude Staff', 'Poor Quality', 'Expensive', 'Noisy', 'Bad Taste', 'Unprofessional', 'Unhelpful', 'Crowded']
    };
  }
}
