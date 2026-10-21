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
    const {
      message,
      mode = "normal",
      image = null,
      history = []
    } = req.body || {};
    if (
      (!message || !message.trim()) &&
      !image
    ) {
      return res.status(400).json({
        error: "Message or image is required"
      });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing"
      });
    }
    const isCodeMode =
      mode === "code";
    const systemInstruction =
      isCodeMode
        ? `
Ты — Mirror Code, режим Mirror для программирования.
Твоя главная задача — помогать писать,
исправлять, объяснять и улучшать код.
Учитывай предыдущие сообщения текущего диалога.
Если пользователь ссылается на то, что обсуждалось ранее,
используй историю разговора и не проси повторять информацию,
если она уже есть в истории.
Если пользователь отправил изображение,
внимательно изучи его.
Это может быть:
- скриншот ошибки;
- код;
- интерфейс программы;
- схема;
- задание;
- фотография экрана.
Если на изображении есть текст,
используй его при ответе.
Правила Mirror Code:
1. Если пользователь просит написать файл целиком —
   выдавай полный готовый файл.
2. Не сокращай код словами вроде:
   "остальной код без изменений",
   "и так далее".
3. Если для решения нужен большой объём кода,
   можешь давать длинный ответ.
4. Старайся выдавать код,
   который можно сразу скопировать.
5. Если пользователь прислал ошибку
   или скриншот ошибки,
   сначала определи причину,
   затем предложи исправление.
6. Если пользователь просит изменить файл
   и контекста достаточно,
   возвращай полный обновлённый файл.
7. Для кода используй Markdown-блоки
   с указанием языка.
8. Отвечай на языке пользователя.
`
        : `
Ты — Mirror, полезный универсальный ИИ-ассистент.
Отвечай понятно, естественно и по существу.
Учитывай предыдущие сообщения текущего диалога.
Если пользователь пишет что-то вроде:
- "а почему?";
- "а он?";
- "сделай ещё";
- "я про того человека";
- "а второй вариант?";
- "помнишь, что я говорил?";
используй историю текущего разговора.
Не спрашивай пользователя повторно,
о чём шёл разговор,
если необходимая информация уже есть в истории.
Если пользователь отправил изображение,
внимательно проанализируй его.
Ты можешь:
- описывать изображения;
- читать текст с изображений;
- анализировать фотографии;
- объяснять содержимое скриншотов;
- помогать с заданиями на фотографиях;
- распознавать объекты, интерфейсы и схемы.
Не выдумывай то,
чего нельзя уверенно определить по изображению.
Если изображение нечёткое
или информации недостаточно,
скажи об этом.
Обычно не превышай примерно 1000 слов.
Если вопрос простой —
отвечай значительно короче.
Не растягивай ответ
только ради достижения лимита.
Отвечай на языке пользователя.
`;
    const maxOutputTokens =
      isCodeMode
        ? 10000
        : 4000;
    /*
      =========================
      ИСТОРИЯ ДИАЛОГА
      =========================
      Берём последние 30 сообщений,
      чтобы не отправлять огромный чат
      при каждом запросе.
    */
    const safeHistory =
      Array.isArray(history)
        ? history.slice(-30)
        : [];
    const contents = [];
    /*
      Добавляем старые сообщения.
    */
    for (const item of safeHistory) {
      if (!item) {
        continue;
      }
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
        Старые картинки специально
        повторно не отправляем.
        Иначе запросы могут стать
        слишком тяжёлыми.
        Текстовые ответы Mirror на эти
        изображения всё равно остаются
        в истории.
      */
      if (parts.length > 0) {
        contents.push({
          role: role,
          parts: parts
        });
      }
    }
    /*
      =========================
      НОВОЕ СООБЩЕНИЕ
      =========================
    */
    const currentParts = [];
    if (
      message &&
      message.trim()
    ) {
      currentParts.push({
        text: message.trim()
      });
    }
    /*
      Добавляем текущую картинку.
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
      const commaIndex =
        image.indexOf(",");
      if (commaIndex === -1) {
        return res.status(400).json({
          error: "Invalid image data"
        });
      }
      const header =
        image.slice(
          0,
          commaIndex
        );
      const base64Data =
        image.slice(
          commaIndex + 1
        );
      const mimeMatch =
        header.match(
          /^data:(image\/[^;]+);base64$/
        );
      if (!mimeMatch) {
        return res.status(400).json({
          error: "Invalid image MIME type"
        });
      }
      const mimeType =
        mimeMatch[1];
      currentParts.push({
        inlineData: {
          mimeType:
            mimeType,
          data:
            base64Data
        }
      });
    }
    contents.push({
      role: "user",
      parts:
        currentParts
    });
    /*
      =========================
      GEMINI
      =========================
    */
    const stream =
      await ai.models.generateContentStream({
        model:
          "gemini-3.5-flash-lite",
        contents:
          contents,
        config: {
          systemInstruction:
            systemInstruction,
          maxOutputTokens:
            maxOutputTokens
        }
      });
    /*
      =========================
      STREAM
      =========================
    */
    res.statusCode =
      200;
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
    for await (
      const chunk of stream
    ) {
      if (chunk.text) {
        res.write(
          chunk.text
        );
      }
    }
    res.end();
  } catch (error) {
    console.error(
      "Gemini error:",
      error
    );
    if (!res.headersSent) {
      return res.status(500).json({
        error:
          error.message ||
          "Gemini request failed",
        status:
          error.status ||
          null
      });
    }
    res.end();
  }
}
