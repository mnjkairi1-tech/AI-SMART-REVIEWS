import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shopName, shopContextPrompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      You are an AI assistant helping a business owner generate feedback options for their customers.
      Business Name: ${shopName}
      Business Context / Owner Instructions: ${shopContextPrompt || 'A standard business.'}

      Generate exactly 15 short, punchy "What you liked" options (e.g., "Friendly Staff", "Clean Environment") 
      and exactly 15 short, punchy "What you didn't like" options (e.g., "Slow Service", "Too Noisy").
      Keep each option under 3-4 words. Make them highly relevant to the business context provided.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            liked: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "15 positive feedback options"
            },
            disliked: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "15 negative feedback options"
            }
          },
          required: ["liked", "disliked"]
        }
      }
    });
    
    const text = response.text;
    let options = { liked: [], disliked: [] };
    if (text) {
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      options = JSON.parse(cleanText);
    }

    return res.status(200).json(options);
    
  } catch (error: any) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: error.message || "Something went wrong in the backend" });
  }
}
