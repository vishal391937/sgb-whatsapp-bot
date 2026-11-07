// =============================================
// Bot Flow — Conversation State Machine
// Stages: welcome → ask_name → ask_place
//         → ask_product → chat
// Fully trilingual: Kannada / Hindi / English
// Automatically sends product images & links
// =============================================

import {
  getState,
  setState,
  saveMessage,
  getConversationHistory,
  upsertLead,
  getLead,
} from "../database/db.js";

import {
  detectLanguage,
  isTopicAllowed,
  generateBotReply,
  extractLeadData,
  getTopicDenialMessage,
} from "../ai/engine.js";

import { sendWhatsAppMessage, sendWhatsAppImage } from "../whatsapp/sender.js";
import { SGB_PRODUCTS } from "../products/catalog.js";
import { syncLeadToSheets } from "../sheets/excelSync.js";

// Helper to find matching product in catalog
export function matchProduct(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  return SGB_PRODUCTS.find((p) => {
    return (
      t.includes(p.name.toLowerCase()) ||
      t.includes(p.kannada.toLowerCase()) ||
      t.includes(p.hindi.toLowerCase()) ||
      (p.engine && t.includes(p.engine.toLowerCase())) ||
      (t.includes("143") && p.name.includes("143R")) ||
      (t.includes("520") && p.name.includes("BC-520")) ||
      (t.includes("g45") && p.name.includes("G45L")) ||
      (t.includes("trolley") && p.name.includes("Trolley")) ||
      (t.includes("ಟ್ರಾಲಿ") && p.name.includes("Trolley")) ||
      (t.includes("ट्रॉली") && p.name.includes("Trolley")) ||
      (t.includes("tiller") && p.name.includes("Tiller")) ||
      (t.includes("ಟಿಲ್ಲರ್") && p.name.includes("Tiller")) ||
      (t.includes("weeder") && p.name.includes("Cycle Weeder")) ||
      (t.includes("ವೀಡರ್") && p.name.includes("Cycle Weeder")) ||
      (t.includes("wheel barrow") && p.name.includes("Wheel Barrow")) ||
      (t.includes("carry cart") && p.name.includes("Carry Cart"))
    );
  });
}

// ── Multi-language message templates ─────────────────
const MESSAGES = {
  welcome: {
    english: (name) =>
      `🌾 *Welcome to SGB Agro Industries!*\n\nHello${name ? " " + name : ""}! 👋 We make smart agricultural tools & machinery to make your farm work easier.\n\n📍 *Koppa, Karnataka* 🏡\n🌐 sgbagroindustries.com\n\nHere are our popular products 👇`,

    kannada: (name) =>
      `🌾 *SGB Agro Industries ಗೆ ಸ್ವಾಗತ!*\n\nನಮಸ್ಕಾರ${name ? " " + name : ""}! 👋 ನಾವು ನಿಮ್ಮ ಕೃಷಿ ಕೆಲಸವನ್ನು ಸುಲಭಗೊಳಿಸಲು ಸ್ಮಾರ್ಟ್ ಕೃಷಿ ಯಂತ್ರಗಳನ್ನು ತಯಾರಿಸುತ್ತೇವೆ.\n\n📍 ಕೊಪ್ಪ, ಕರ್ನಾಟಕ 🏡\n🌐 sgbagroindustries.com\n\nನಮ್ಮ ಪ್ರಮುಖ ಉತ್ಪನ್ನಗಳು 👇`,

    hindi: (name) =>
      `🌾 *SGB Agro Industries में आपका स्वागत है!*\n\nनमस्ते${name ? " " + name : ""}! 👋 हम आपकी खेती को आसान बनाने के लिए स्मार्ट कृषि मशीनें बनाते हैं।\n\n📍 कोप्पा, कर्नाटक 🏡\n🌐 sgbagroindustries.com\n\nहमारे प्रमुख उत्पाद 👇`,
  },

  ask_name: {
    english: "😊 May I know your *name* please?",
    kannada: "😊 ನಿಮ್ಮ *ಹೆಸರು* ತಿಳಿಸುವಿರಾ?",
    hindi: "😊 क्या मैं आपका *नाम* जान सकता हूँ?",
  },

  ask_place: {
    english: (name) =>
      `Nice to meet you, *${name}*! 🙏\n\nWhich *city/village/district* are you from?`,
    kannada: (name) =>
      `ನಿಮ್ಮನ್ನು ಭೇಟಿಯಾಗಿ ಸಂತೋಷ, *${name}*! 🙏\n\nನೀವು ಯಾವ *ಊರು/ಜಿಲ್ಲೆ*ಯಿಂದ ಬರುತ್ತೀರಿ?`,
    hindi: (name) =>
      `आपसे मिलकर खुशी हुई, *${name}*! 🙏\n\nआप किस *शहर/गांव/जिले* से हैं?`,
  },

  ask_product: {
    english: (place) =>
      `Great, *${place}*! 🌾\n\nWhich of our products are you *interested* in? Reply with a number, product name, or ask any question! 😊`,
    kannada: (place) =>
      `ಒಳ್ಳೆಯದು, *${place}*! 🌾\n\nನಮ್ಮ ಯಾವ ಉತ್ಪನ್ನದ ಬಗ್ಗೆ ನಿಮಗೆ *ಆಸಕ್ತಿ* ಇದೆ? ಹೆಸರು ಅಥವಾ ಸಂಖ್ಯೆ ಟೈಪ್ ಮಾಡಿ! 😊`,
    hindi: (place) =>
      `बढ़िया, *${place}*! 🌾\n\nआप हमारे किस उत्पाद में *रुचि* रखते हैं? नाम या नंबर टाइप करें या कुछ भी पूछें! 😊`,
  },

  lead_saved: {
    english: (product) =>
      `✅ Thank you! I've noted your interest in *${product}*.\n\nHere is the product detail & photo below! Feel free to ask any question. Our team will also contact you soon. 🙏`,
    kannada: (product) =>
      `✅ ಧನ್ಯವಾದ! ನಿಮ್ಮ *${product}* ಆಸಕ್ತಿಯನ್ನು ನೋಂದಾಯಿಸಲಾಗಿದೆ.\n\nಉತ್ಪನ್ನದ ಫೋಟೋ ಮತ್ತು ವಿವರಗಳು ಕೆಳಗಿವೆ! ಯಾವುದೇ ಮಾಹಿತಿ ಬೇಕಿದ್ದರೂ ಕೇಳಿ. ನಮ್ಮ ತಂಡ ಶೀಘ್ರದಲ್ಲೇ ಸಂಪರ್ಕಿಸುತ್ತದೆ. 🙏`,
    hindi: (product) =>
      `✅ धन्यवाद! *${product}* में आपकी रुचि नोट कर ली गई है।\n\nउत्पाद का फोटो और विवरण नीचे दिया गया है! कुछ भी पूछें, हमारी टीम जल्द ही संपर्क करेगी। 🙏`,
  },
};

// ── Product List Text ─────────────────────────────────
function buildProductList(language) {
  const lines = SGB_PRODUCTS.map((p, i) => {
    const localName =
      language === "kannada"
        ? p.kannada
        : language === "hindi"
        ? p.hindi
        : p.name;
    return `${i + 1}️⃣ *${localName}*`;
  });

  const footer = {
    english: "\nReply with a number or name to know more! 👆",
    kannada: "\nಸಂಖ್ಯೆ ಅಥವಾ ಹೆಸರು ಟೈಪ್ ಮಾಡಿ! 👆",
    hindi: "\nनंबर या नाम टाइप करें! 👆",
  };

  return lines.join("\n") + (footer[language] || footer.english);
}

// ── Main message handler ──────────────────────────────
export async function handleMessage(from, userText) {
  saveMessage(from, "user", userText);

  const state = getState(from);
  const lead = getLead(from) || {};

  let language = state.language;
  if (!language || language === "unknown") {
    language = await detectLanguage(userText);
  }

  // 1. Stage: WELCOME
  if (state.stage === "welcome") {
    setState(from, "ask_name", language);
    upsertLead({ whatsapp_number: from, language });

    const welcomeMsg =
      MESSAGES.welcome[language]?.(null) || MESSAGES.welcome.english(null);
    const productList = buildProductList(language);

    const welcomeFull = welcomeMsg + "\n\n" + productList;
    const nameAsk = MESSAGES.ask_name[language] || MESSAGES.ask_name.english;

    await sendWhatsAppMessage(from, welcomeFull);
    saveMessage(from, "bot", welcomeFull);
    await sendWhatsAppMessage(from, nameAsk);
    saveMessage(from, "bot", nameAsk);
    return;
  }

  // 2. Stage: ASK_NAME
  if (state.stage === "ask_name") {
    const name = await extractLeadData(userText, "person's name");
    if (name) {
      upsertLead({ whatsapp_number: from, name, language });
      setState(from, "ask_place", language);

      const reply =
        MESSAGES.ask_place[language]?.(name) ||
        MESSAGES.ask_place.english(name);
      await sendWhatsAppMessage(from, reply);
      saveMessage(from, "bot", reply);
    } else {
      const retry = {
        english: "😊 Sorry, I didn't catch that. Could you please tell me your *name*?",
        kannada: "😊 ಕ್ಷಮಿಸಿ, ತಿಳಿಯಲಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ *ಹೆಸರು* ತಿಳಿಸಿ?",
        hindi: "😊 माफ़ कीजिए, समझ नहीं आया। क्या आप अपना *नाम* बता सकते हैं?",
      };
      const msg = retry[language] || retry.english;
      await sendWhatsAppMessage(from, msg);
      saveMessage(from, "bot", msg);
    }
    return;
  }

  // 3. Stage: ASK_PLACE
  if (state.stage === "ask_place") {
    const place = await extractLeadData(userText, "city, village, town or district name");
    if (place) {
      upsertLead({ whatsapp_number: from, place, language });
      setState(from, "ask_product", language);

      const reply =
        MESSAGES.ask_product[language]?.(place) ||
        MESSAGES.ask_product.english(place);
      await sendWhatsAppMessage(from, reply);
      saveMessage(from, "bot", reply);
    } else {
      const retry = {
        english: "📍 Could you please share your *city or village name*?",
        kannada: "📍 ದಯವಿಟ್ಟು ನಿಮ್ಮ *ಊರು ಅಥವಾ ಜಿಲ್ಲೆ* ಹೆಸರು ತಿಳಿಸಿ?",
        hindi: "📍 कृपया अपने *शहर या गाँव का नाम* बताएं?",
      };
      const msg = retry[language] || retry.english;
      await sendWhatsAppMessage(from, msg);
      saveMessage(from, "bot", msg);
    }
    return;
  }

  // 4. Stage: ASK_PRODUCT
  if (state.stage === "ask_product") {
    const allowed = await isTopicAllowed(userText);
    if (!allowed) {
      const denial = getTopicDenialMessage(language);
      await sendWhatsAppMessage(from, denial);
      saveMessage(from, "bot", denial);
      return;
    }

    // Match catalog product
    let matched = matchProduct(userText);
    let productName = matched?.name;

    if (!productName) {
      productName = await extractLeadData(
        userText,
        "agricultural product or machine name the customer is interested in"
      );
      if (productName) {
        matched = matchProduct(productName);
      }
    }

    if (productName || matched) {
      const finalName = matched ? matched.name : productName;
      upsertLead({ whatsapp_number: from, interested_product: finalName, status: "interested" });
      setState(from, "chat", language);

      const reply =
        MESSAGES.lead_saved[language]?.(finalName) ||
        MESSAGES.lead_saved.english(finalName);
      await sendWhatsAppMessage(from, reply);
      saveMessage(from, "bot", reply);

      // Send official Product Image if matched!
      if (matched && matched.image) {
        const caption = `🌾 *${matched.name}*\n⚙️ ${matched.features.slice(0, 3).join(" • ")}\n🌐 ${matched.productUrl || "sgbagroindustries.com"}`;
        await sendWhatsAppImage(from, matched.image, caption);
        saveMessage(from, "bot", `[Image sent: ${matched.name}]`);
      }

      try {
        const updatedLead = getLead(from);
        await syncLeadToSheets(updatedLead);
      } catch (e) {
        console.warn("⚠️ Google Sheets sync failed:", e.message);
      }
    } else {
      await handleFreeChat(from, userText, language, lead, "ask_product");
    }
    return;
  }

  // 5. Stage: CHAT (Free AI Q&A)
  if (state.stage === "chat") {
    await handleFreeChat(from, userText, language, lead, "chat");
    return;
  }
}

// ── Free-form AI chat with topic guard + image sending ─
async function handleFreeChat(from, userText, language, lead, keepStage) {
  const allowed = await isTopicAllowed(userText);
  if (!allowed) {
    const denial = getTopicDenialMessage(language);
    await sendWhatsAppMessage(from, denial);
    saveMessage(from, "bot", denial);
    setState(from, keepStage, language);
    return;
  }

  const history = getConversationHistory(from, 15);
  const reply = await generateBotReply(userText, history, language, lead);

  await sendWhatsAppMessage(from, reply);
  saveMessage(from, "bot", reply);
  setState(from, keepStage, language);

  // If customer asked about a specific product in free chat, send its image!
  const matched = matchProduct(userText);
  if (matched && matched.image) {
    const caption = `🌾 *${matched.name}*\n⚙️ ${matched.features.slice(0, 3).join(" • ")}\n🌐 ${matched.productUrl || "sgbagroindustries.com"}`;
    await sendWhatsAppImage(from, matched.image, caption);
    saveMessage(from, "bot", `[Image sent: ${matched.name}]`);
  }
}
