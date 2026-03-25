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
      throw new Error("Gemini API key is missing. Please configure VITE_GEMINI_API_KEY in your environment variables.");
    }
    
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export async function generateReviews(shopName: string, shopType: string, keywords: string[], rating: number, categories: string[]) {
  let toneInstruction = "";
  if (rating === 5) {
    toneInstruction = "Strong positive tone, enthusiastic and highly recommending.";
  } else if (rating === 4) {
    toneInstruction = "Slightly realistic positive tone, very good but sounds like a balanced human perspective.";
  } else if (rating === 3) {
    toneInstruction = "Balanced tone, mentioning it was okay/good but nothing extraordinary.";
  } else {
    toneInstruction = "Constructive criticism.";
  }

  const prompt = `
    You are an AI assistant helping a customer write a Google review for a business.
    Business Name: ${shopName}
    Business Type: ${shopType}
    Business Keywords: ${keywords.join(", ")}
    Customer Rating: ${rating} out of 5 stars
    Selected Categories: ${categories.length > 0 ? categories.join(", ") : "General experience"}

    Generate exactly 10 unique, natural-sounding, and helpful reviews that the customer can copy and paste.
    
    CRITICAL RULES:
    1. Tone: ${toneInstruction}
    2. Length: Short (1-3 sentences maximum).
    3. Variety: Every review MUST be completely different. Do NOT repeat the same phrases or lines.
    4. Human-like: Make them sound like real people wrote them (use casual language, occasional exclamation marks, very natural phrasing).
    5. Context: Incorporate the selected categories if provided.
  `;

  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            description: "A generated review text."
          }
        }
      }
    });
    
    const text = response.text;
    if (text) {
      // Strip markdown code blocks if present
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanText) as string[];
    }
    return [];
  } catch (error: any) {
    console.error("Error generating reviews:", error);
    throw new Error(error?.message || "Failed to generate reviews. Please try again.");
  }
}
