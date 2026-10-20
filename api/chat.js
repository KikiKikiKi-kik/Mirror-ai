import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: message
    });

    return res.status(200).json({
      answer: response.text
    });

  } catch (error) {
    console.error("Mirror API error:", error);

    return res.status(500).json({
      error: "Mirror failed to generate a response."
    });
  }
}
