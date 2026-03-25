import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
      return JSON.parse(text) as string[];
    }
    return [];
  } catch (error) {
    console.error("Error generating reviews:", error);
    throw new Error("Failed to generate reviews. Please try again.");
  }
}
