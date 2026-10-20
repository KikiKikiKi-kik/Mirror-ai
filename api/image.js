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
    const { prompt } = req.body || {};

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        error: "Промпт пустой"
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing"
      });
    }

    const interaction =
      await ai.interactions.create({
        model: "gemini-nano-banana-2.1",
        input: prompt.trim(),
        response_format: {
          type: "image",
          aspect_ratio: "1:1",
          image_size: "1K"
        }
      });

    if (!interaction.output_image) {
      throw new Error(
        "Модель не вернула изображение"
      );
    }

    return res.status(200).json({
      image:
        interaction.output_image.data,
      mimeType:
        interaction.output_image.mime_type ||
        "image/png"
    });

  } catch (error) {
    console.error(
      "Image generation error:",
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        "Не удалось создать изображение"
    });
  }
}
