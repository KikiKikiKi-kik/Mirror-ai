import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is empty" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `
You are Mirror, a friendly AI assistant.
Answer clearly and naturally.

User:
${message}
      `
    });

    return res.status(200).json({
      answer: response.text
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Mirror could not answer."
    });
  }
}
