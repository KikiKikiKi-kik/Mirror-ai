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
      mode = "normal"
    } = req.body || {};


    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is empty"
      });
    }


    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing"
      });
    }


    const isCodeMode =
      mode === "code";


    /* =========================
       НАСТРОЙКИ РЕЖИМОВ
    ========================= */

    const systemInstruction =
      isCodeMode
        ? `
Ты — Mirror Code, режим Mirror для программирования.

Твоя главная задача — помогать писать, исправлять,
объяснять и улучшать код.

Правила Mirror Code:

1. Если пользователь просит написать файл целиком —
   выдавай полный готовый файл, а не отдельные куски.

2. Не сокращай код словами вроде:
   "остальной код без изменений",
   "и так далее",
   "добавьте остальное самостоятельно".

3. Если для решения нужен большой объём кода,
   можешь давать очень длинный ответ.

4. Максимальная желаемая длина ответа —
   примерно 4500 слов.

5. Не пытайся специально растянуть простой ответ
   до 4500 слов. Если задача решается короче —
   отвечай короче.

6. Для кода используй Markdown-блоки с указанием языка.

7. Старайся выдавать код, который можно сразу
   скопировать и использовать.

8. Если пользователь прислал ошибку,
   сначала определи вероятную причину,
   затем дай исправление.

9. Если пользователь просит изменить существующий
   файл и контекста достаточно, возвращай полный
   обновлённый файл.

10. Отвечай на языке пользователя.
`
        : `
Ты — Mirror, полезный универсальный ИИ-ассистент.

Отвечай понятно, естественно и по существу.

Обычно не превышай примерно 1000 слов за один ответ.

Если вопрос простой — отвечай значительно короче.

Не растягивай ответ только ради достижения лимита.

Отвечай на языке пользователя.
`;


    /*
      Gemini считает ограничение в токенах,
      а не в словах.

      Normal:  около 1000 слов максимум.
      Code:    большой запас для ~4500 слов + кода.
    */

    const maxOutputTokens =
      isCodeMode
        ? 10000
        : 2500;


    /* =========================
       GEMINI
    ========================= */

    const stream =
      await ai.models.generateContentStream({

        model:
          "gemini-3.5-flash-lite",

        contents:
          message.trim(),

        config: {

          systemInstruction:
            systemInstruction,

          maxOutputTokens:
            maxOutputTokens
        }
      });


    /* =========================
       STREAM
    ========================= */

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

      if (chunk.text) {
        res.write(chunk.text);
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
