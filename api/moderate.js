
import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-3.5-flash-lite";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  const secret = process.env.MODERATION_SECRET;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!secret || !apiKey) {
    return res.status(500).json({
      success: false,
      error: "Server environment is incomplete"
    });
  }

  if (req.headers["x-moderation-secret"] !== secret) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized"
    });
  }

  const { title, description, category, game, price } = req.body || {};

  if (
    typeof title !== "string" ||
    typeof description !== "string" ||
    !title.trim() ||
    !description.trim()
  ) {
    return res.status(400).json({
      success: false,
      error: "Invalid listing"
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
Ты — модератор игрового маркетплейса LootPay.

Проверь объявление:
Заголовок: ${title}
Описание: ${description}
Категория: ${category || "Не указана"}
Игра: ${game || "Не указана"}
Цена: ${price || "Не указана"}

ТВОЯ ЗАДАЧА:

1. approved — обычное допустимое игровое объявление.
2. rejected — явное мошенничество, спам, вредоносные ссылки,
   попытки обмана, угрозы или запрещённые товары.
3. review — только если есть конкретные сомнения,
   которые нельзя разрешить по тексту объявления.

ВАЖНО:
- Игровой сленг разрешён.
- Эмодзи разрешены.
- Короткие описания разрешены.
- Необычные названия игровых предметов разрешены.
- Названия вроде LAVACA SATURNO SATURNITA допустимы.
- Фразы вроде "500 МЛН В ЧАС", "БАФФЫ: радуга"
  сами по себе не являются нарушением.
- Не отклоняй объявление только из-за ошибок или капса.
- Не отправляй нормальные игровые объявления на review.
- Не придумывай нарушения.

Верни только JSON:
{
  "decision": "approved",
  "reason": "Краткая причина"
}

Выбери decision строго из approved, rejected, review.
`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            decision: {
              type: "STRING",
              enum: ["approved", "rejected", "review"]
            },
            reason: {
              type: "STRING"
            }
          },
          required: ["decision", "reason"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");

    if (
      !["approved", "rejected", "review"].includes(result.decision)
    ) {
      throw new Error("Invalid AI decision");
    }

    return res.status(200).json({
      success: true,
      decision: result.decision,
      reason: String(result.reason || "Проверка завершена").slice(0, 500)
    });

  } catch (error) {
    console.error("Moderation error:", error);

    return res.status(500).json({
      success: false,
      error: "Moderation unavailable"
    });
  }
}
