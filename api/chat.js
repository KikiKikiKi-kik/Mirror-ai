import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: "Message is empty" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is missing"
    });
  }

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const stream = await ai.models.generateContentStream({
        model: "gemini-3.8-flash",
        contents: message
      });

      res.statusCode = 200;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("X-Accel-Buffering", "no");

      for await (const chunk of stream) {
        if (chunk.text) {
          res.write(chunk.text);
        }
      }

      return res.end();

    } catch (error) {
      console.error(`Gemini attempt ${attempt}:`, error);

      const status = error?.status;

      if (status === 503 && attempt < maxAttempts) {
        await sleep(1000 * Math.pow(2, attempt - 1));
        continue;
      }

      if (!res.headersSent) {
        return res.status(status === 503 ? 503 : 500).json({
          error: error.message || "Gemini request failed",
          status
        });
      }

      return res.end();
    }
  }
}
