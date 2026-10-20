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
      image = null
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
Если пользователь отправил изображение,
внимательно проанализируй его.
Ты можешь:
- описывать изображения;
- читать текст с изображений;
- анализировать фотографии;
- объяснять содержимое скриншотов;
- помогать с заданиями на фотографиях;
- распознавать объекты, интерфейсы и схемы.
У тебя есть доступ к Google Search.
Самостоятельно решай, когда поиск в интернете
действительно нужен.
Используй поиск, если:
- пользователь спрашивает о человеке,
  компании, игре, сайте или другом объекте,
  о котором у тебя недостаточно информации;
- информация могла недавно измениться;
- пользователь спрашивает "кто это?",
  "что это?",
  "где это?",
  "сколько сейчас стоит?",
  "что сейчас происходит?";
- для ответа нужны актуальные данные;
- пользователь явно просит найти информацию
  в интернете.
Не используй поиск для каждого простого вопроса.
Если ты уже уверенно знаешь ответ
и актуальная информация не нужна —
отвечай без поиска.
Если используешь поиск,
опирайся на найденную информацию
и не выдумывай факты.
Если пользователь прислал фотографию
и спрашивает, кто изображён,
не утверждай личность человека
только по лицу.
Если по изображению нельзя уверенно
определить человека, скажи об этом.
Если дополнительная информация о человеке
есть в интернете, используй её только
при наличии подходящего контекста.
Обычно не превышай примерно 1000 слов,
но если для нормального ответа нужно больше —
можешь ответить подробнее.
Если вопрос простой —
отвечай значительно короче.
Не растягивай ответ только ради достижения лимита.
Отвечай на языке пользователя.
`;
    const maxOutputTokens =
      isCodeMode
        ? 10000
        : 4000;
    /*
      Формируем содержимое.
    */
    const contents = [];
    if (message && message.trim()) {
      contents.push({
        text: message.trim()
      });
    }
    /*
      Добавляем изображение.
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
      contents.push({
        inlineData: {
          mimeType:
            mimeType,
          data:
            base64Data
        }
      });
    }
    /*
      Настройки Gemini.
    */
    const config = {
      systemInstruction:
        systemInstruction,
      maxOutputTokens:
        maxOutputTokens
    };
    /*
      Google Search включаем
      только для обычного Mirror.
    */
    if (!isCodeMode) {
      config.tools = [
        {
          googleSearch: {}
        }
      ];
    }
    /*
      Запускаем потоковую генерацию.
    */
    const stream =
      await ai.models.generateContentStream({
        model:
          "gemini-3.5-flash-lite",
        contents:
          contents,
        config:
          config
      });
    /*
      Настраиваем поток.
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
    /*
      Отправляем ответ постепенно.
    */
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
