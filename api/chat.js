import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is empty"
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing in Vercel"
      });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: message
    });

    return res.status(200).json({
      answer: response.text
    });

  } catch (error) {
    console.error("FULL GEMINI ERROR:", error);

    return res.status(500).json({
      error: error.message || "Unknown Gemini error",
      status: error.status || null
    });
  }
}
