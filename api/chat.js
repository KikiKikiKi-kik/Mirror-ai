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
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is missing"
    });
  }
  try {
    const {
      message = "",
      mode = "normal",
      image = null,
      history = []
    } = req.body || {};
    if (!message.trim() && !image) {
      return res.status(400).json({
        error: "Message or image is required"
      });
    }
    const isCodeMode = mode === "code";
    const systemInstruction = isCodeMode
      ? `
Ты — Mirror Code, режим Mirror для программирования.
Помогай писать, исправлять, объяснять и улучшать код.
Учитывай предыдущие сообщения текущего диалога.
Если пользователь ссылается на предыдущий контекст,
используй историю и не проси повторять уже известную информацию.
Если пользователь отправил изображение:
- внимательно изучи его;
- распознавай текст;
- анализируй скриншоты;
- анализируй ошибки;
- анализируй интерфейсы и код.
Правила:
1. Если пользователь просит полный файл — давай полный файл.
2. Не сокращай код словами "остальной код без изменений".
3. Код должен быть готов к копированию.
4. Если есть ошибка, сначала определи причину.
5. Отвечай на языке пользователя.
`
      : `
Ты — Mirror, полезный универсальный ИИ-ассистент.
Отвечай понятно, естественно и по существу.
Учитывай историю текущего диалога.
Если пользователь говорит "а почему?", "а он?",
"сделай ещё", "я про того человека" и т.п.,
используй предыдущие сообщения.
Если пользователь отправил изображение:
- внимательно проанализируй его;
- можешь читать текст;
- можешь описывать изображение;
- можешь анализировать фотографии;
- можешь анализировать скриншоты.
Не выдумывай то, чего нельзя определить по изображению.
Если вопрос простой — отвечай коротко.
Обычно не превышай примерно 1000 слов.
Отвечай на языке пользователя.
`;
    /*
      Берём только последние 12 сообщений.
      Этого достаточно для обычного диалога
      и заметно уменьшает размер запроса.
    */
    const safeHistory = Array.isArray(history)
      ? history.slice(-12)
      : [];
    const contents = [];
    for (const item of safeHistory) {
      if (!item) continue;
      const role =
        item.role === "assistant"
          ? "model"
          : "user";
      const parts = [];
      if (
        typeof item.content === "string" &&
        item.content.trim()
      ) {
        parts.push({
          text: item.content.trim()
        });
      }
      /*
        Старые фотографии пока не отправляем повторно.
        Они всё равно сохраняются в интерфейсе.
      */
      if (parts.length > 0) {
        contents.push({
          role,
          parts
        });
      }
    }
    /*
      Текущее сообщение
    */
    const currentParts = [];
    if (message.trim()) {
      currentParts.push({
        text: message.trim()
      });
    }
    /*
      Текущая фотография
    */
    if (image) {
      if (
        typeof image !== "string" ||
        !image.startsWith("data:image/")
      ) {
        return res.status(400).json({
          error: "Invalid image format"
        });
      }
      const commaIndex = image.indexOf(",");
      if (commaIndex === -1) {
        return res.status(400).json({
          error: "Invalid image data"
        });
      }
      const header = image.slice(0, commaIndex);
      const base64Data = image.slice(commaIndex + 1);
      const mimeMatch = header.match(
        /^data:(image\/[^;]+);base64$/
      );
      if (!mimeMatch) {
        return res.status(400).json({
          error: "Invalid image MIME type"
        });
      }
      currentParts.push({
        inlineData: {
          mimeType: mimeMatch[1],
          data: base64Data
        }
      });
    }
    contents.push({
      role: "user",
      parts: currentParts
    });
    /*
      Gemini
    */
    const stream =
      await ai.models.generateContentStream({
        model: "gemini-3.5-flash-lite",
        contents,
        config: {
          systemInstruction,
          maxOutputTokens: isCodeMode
            ? 7000
            : 2500
        }
      });
    /*
      Streaming response
    */
    res.statusCode = 200;
    res.setHeader(
      "Content-Type",
      "text/plain; charset=utf-8"
    );
    res.setHeader(
      "Cache-Control",
      "no-cache, no-transform"
    );
    res.setHeader(
      "X-Accel-Buffering",
      "no"
    );
    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        res.write(text);
      }
    }
    res.end();
  } catch (error) {
    console.error("Gemini error:", error);
    /*
      Важно:
      теперь реальная ошибка Gemini будет видна
      в ответе API и в логах Vercel.
    */
    const status =
      Number(error?.status) >= 400 &&
      Number(error?.status) < 600
        ? Number(error.status)
        : 500;
    const message =
      error?.message ||
      "Gemini request failed";
    if (!res.headersSent) {
      return res.status(status).json({
        error: message,
        status
      });
    }
    res.end();
  }
}
