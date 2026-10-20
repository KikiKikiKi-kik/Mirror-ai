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

    const interaction = await ai.interactions.create({
      model: "gemini-3.8-flash",
      input: message
    });

    return res.status(200).json({
      answer: interaction.output_text
    });

  } catch (error) {
    console.error("Gemini error:", error);

    return res.status(500).json({
      error: error.message || "Gemini request failed"
    });
  }
}
