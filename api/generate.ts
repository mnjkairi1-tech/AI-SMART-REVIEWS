import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  // Sirf POST requests allow karenge
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Frontend se data receive kar rahe hain
    const { shopName, shopType, keywords, rating, categories, shopContextPrompt } = req.body;

    // Vercel ke environment variables se API key uthayenge (Backend me safe hai)
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel Settings' });
    }

    // Gemini Client initialize kar rahe hain
    const ai = new GoogleGenAI({ apiKey });

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
      Selected Categories: ${categories && categories.length > 0 ? categories.join(", ") : "General experience"}
      Business Context / Owner Instructions: ${shopContextPrompt || 'No specific instructions provided.'}

      Generate exactly 10 unique, natural-sounding, and helpful reviews that the customer can copy and paste.
      
      CRITICAL RULES:
      1. Tone: ${toneInstruction}
      2. Length: Short (1-3 sentences maximum).
      3. Variety: Every review MUST be completely different. Do NOT repeat the same phrases or lines.
      4. Human-like: Make them sound like real people wrote them (use casual language, occasional exclamation marks, very natural phrasing).
      5. Context: Incorporate the selected categories and the Business Context/Owner Instructions to make the reviews highly specific and relevant to this exact shop.
    `;

    // Gemini API ko call kar rahe hain (Backend se)
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
    let reviews = [];
    if (text) {
      const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      reviews = JSON.parse(cleanText);
    }

    // Frontend ko reviews wapas bhej rahe hain
    return res.status(200).json({ reviews });
    
  } catch (error: any) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: error.message || "Something went wrong in the backend" });
  }
}
