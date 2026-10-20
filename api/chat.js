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

Не выдумывай то, чего нельзя уверенно определить
по изображению.

Если изображение нечёткое или информации недостаточно,
скажи об этом.

Обычно не превышай примерно 1000 слов,
но если для нормального ответа нужно больше —
можешь ответить подробнее.

Если вопрос простой — отвечай значительно короче.

Не растягивай ответ только ради достижения лимита.

Отвечай на языке пользователя.
`;


    /*
      Лимит ответа.
    */

    const maxOutputTokens =
      isCodeMode
        ? 10000
        : 4000;


    /*
      Формируем содержимое запроса.
    */

    const contents = [];


    /*
      Текст пользователя.
    */

    if (message && message.trim()) {

      contents.push({
        text: message.trim()
      });

    }


    /*
      Изображение.
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
      Запускаем Gemini.
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
      Потоковый ответ.
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
      Отправляем текст постепенно.
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
