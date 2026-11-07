// =============================================
// AI Engine — Google Gemini Integration
// Features:
//  - Language detection (Kannada/Hindi/English)
//  - Topic guard (SGB only)
//  - Product Q&A
//  - Lead data extraction
// =============================================

import { COMPANY_INFO, SGB_PRODUCTS } from "../products/catalog.js";

// Models to try in order (automatic fallback if one is busy/503)
const CANDIDATE_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-3.5-flash-lite",
  "gemini-flash-latest",
  "gemini-3.8-flash",
  "gemini-2.5-pro",
];

// ── Shared fetch helper with fallback ─────────────────
async function callGemini(prompt, temperature = 0.4) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error("GEMINI_API_KEY not set in .env file");
  }

  let lastError = null;

  for (const model of CANDIDATE_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens: 600,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) return text;
      } else {
        const err = await response.text();
        lastError = new Error(`Model ${model} (${response.status}): ${err}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini models failed to respond");
}

// ── 1. Detect language of incoming message ────────────
export async function detectLanguage(message) {
  const prompt = `
Detect the language of this message. Reply with ONLY one word: "kannada", "hindi", or "english".

Message: "${message}"
  `.trim();

  try {
    const result = await callGemini(prompt, 0.1);
    const lang = result.toLowerCase().trim();
    if (["kannada", "hindi", "english"].includes(lang)) return lang;
    return "english";
  } catch {
    return "english";
  }
}

// ── 2. Topic Guard — is message related to SGB? ───────
export async function isTopicAllowed(message) {
  const productNames = SGB_PRODUCTS.map((p) => p.name).join(", ");
  const prompt = `
You are a topic classifier for SGB Agro Industries customer support.

Allowed topics ONLY:
- SGB company information (location, about, contact)
- SGB products: ${productNames}
- Agricultural machinery questions related to these products
- Pricing, availability, usage of above products
- Greetings and basic customer queries

Is the following customer message related to any of the above allowed topics?
Reply with ONLY: "yes" or "no"

Customer message: "${message}"
  `.trim();

  try {
    const result = await callGemini(prompt, 0.1);
    return result.toLowerCase().includes("yes");
  } catch {
    return true; // fail open — allow if check fails
  }
}

// ── 3. Main AI response generator ────────────────────
export async function generateBotReply(userMessage, conversationHistory, language, leadData) {
  const productCatalog = SGB_PRODUCTS.map(
    (p) =>
      `- ${p.name} (${p.engine || "Manual"}): ${p.uses}. Features: ${p.features.join(", ")}.`
  ).join("\n");

  // Build history context (last 10 turns)
  const historyText = conversationHistory
    .slice(-10)
    .map((m) => `${m.role === "user" ? "Customer" : "Bot"}: ${m.message}`)
    .join("\n");

  const languageInstruction =
    language === "kannada"
      ? "You MUST respond ONLY in Kannada language (ಕನ್ನಡ). Do not use English except for product names."
      : language === "hindi"
      ? "You MUST respond ONLY in Hindi language (हिंदी). Do not use English except for product names."
      : "Respond in clear, simple English.";

  const prompt = `
You are a friendly WhatsApp sales assistant for SGB Agro Industries, a company in Koppa, Karnataka that makes agricultural machinery.

LANGUAGE RULE: ${languageInstruction}

STRICT TOPIC RULE:
- You ONLY answer questions about SGB Agro Industries and its products.
- If asked ANYTHING else (politics, sports, general knowledge, other companies, personal topics, etc.), politely decline and redirect.
- Example decline in English: "I can only help you with SGB Agro Industries products. 😊 What would you like to know about our machines?"

COMPANY:
Name: SGB Agro Industries
Location: Koppa, Karnataka, India
Website: sgbagroindustries.com

PRODUCTS CATALOG:
${productCatalog}

KNOWN CUSTOMER INFO:
Name: ${leadData?.name || "Not collected yet"}
Place: ${leadData?.place || "Not collected yet"}
Interested Product: ${leadData?.interested_product || "Not collected yet"}

CONVERSATION HISTORY:
${historyText || "No previous messages."}

CURRENT CUSTOMER MESSAGE: "${userMessage}"

INSTRUCTIONS:
- Be warm, friendly, and helpful.
- Keep replies SHORT (max 5-6 lines for WhatsApp).
- Use relevant emojis (🌾🚜✅).
- If customer shows interest in a product, encourage them to share more details.
- Never make up prices — say "Contact us for pricing" instead.

Your reply:
  `.trim();

  return await callGemini(prompt, 0.5);
}

// ── 4. Extract lead data from message ─────────────────
export async function extractLeadData(message, field) {
  const prompt = `
Extract the customer's ${field} from this WhatsApp message.
Reply with ONLY the extracted value. If not found, reply "null".

Message: "${message}"
Extracting: ${field}
  `.trim();

  try {
    const result = await callGemini(prompt, 0.1);
    return result.trim() === "null" ? null : result.trim();
  } catch {
    return null;
  }
}

// ── 5. Denial messages per language ──────────────────
export function getTopicDenialMessage(language) {
  const messages = {
    kannada:
      "🙏 ಕ್ಷಮಿಸಿ, ನಾನು ಕೇವಲ SGB Agro Industries ಉತ್ಪನ್ನಗಳ ಬಗ್ಗೆ ಮಾಹಿತಿ ನೀಡಬಲ್ಲೆ. ನಮ್ಮ ಯಂತ್ರಗಳ ಬಗ್ಗೆ ಏನಾದರೂ ತಿಳಿಯಬೇಕೇ? 🌾",
    hindi:
      "🙏 माफ़ कीजिए, मैं केवल SGB Agro Industries के उत्पादों के बारे में जानकारी दे सकता हूँ। क्या आप हमारी कृषि मशीनों के बारे में जानना चाहते हैं? 🌾",
    english:
      "🙏 Sorry, I can only assist with SGB Agro Industries products and services. Would you like to know about our agricultural machines? 🌾",
  };
  return messages[language] || messages.english;
}

