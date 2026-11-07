// =============================================
// WhatsApp Sender — Meta Cloud API
// Sends text & image messages to WhatsApp users
// =============================================

const WA_API_BASE = "https://graph.facebook.com/v19.0";

function isLocalTestSend() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (globalThis.__SGB_TEST_MODE__ === true) return true;
  return (
    !phoneNumberId ||
    !accessToken ||
    phoneNumberId === "your_phone_number_id_here" ||
    phoneNumberId === "test_mode" ||
    accessToken === "your_whatsapp_access_token_here" ||
    accessToken === "test_mode"
  );
}

export async function sendWhatsAppMessage(to, text) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken  = process.env.WHATSAPP_ACCESS_TOKEN;

  // Test/dev mode — print to terminal AND capture for web tester
  if (isLocalTestSend()) {
    console.log(`\n🤖 Bot:\n${text}\n${"─".repeat(55)}`);
    if (globalThis.__SGB_TEST_REPLIES__) {
      globalThis.__SGB_TEST_REPLIES__.push(text);
    }
    return { mock: true };
  }

  const url = `${WA_API_BASE}/${phoneNumberId}/messages`;

  const body = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text, preview_url: true },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`❌ WhatsApp send failed for ${to}: ${err}`);
    throw new Error(`WhatsApp API error: ${err}`);
  }

  const data = await res.json();
  console.log(`✅ Message sent to ${to} | msg_id: ${data.messages?.[0]?.id}`);
  return data;
}

// ── Send Product Image with Caption ──────────────────
export async function sendWhatsAppImage(to, imageUrl, caption = "") {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken  = process.env.WHATSAPP_ACCESS_TOKEN;

  if (isLocalTestSend()) {
    const formatted = `📷 [Image: ${imageUrl}]` + (caption ? `\n${caption}` : "");
    console.log(`\n🤖 Bot (Image):\n${formatted}\n${"─".repeat(55)}`);
    if (globalThis.__SGB_TEST_REPLIES__) {
      globalThis.__SGB_TEST_REPLIES__.push(formatted);
    }
    return { mock: true };
  }

  const url = `${WA_API_BASE}/${phoneNumberId}/messages`;

  const body = {
    messaging_product: "whatsapp",
    to,
    type: "image",
    image: {
      link: imageUrl,
      caption: caption || undefined
    }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`❌ WhatsApp image send failed for ${to}: ${err}`);
    // Fallback: send as text with link if image fails
    if (caption) {
      await sendWhatsAppMessage(to, `${caption}\n\n🖼️ View Image: ${imageUrl}`);
    }
    return { error: err };
  }

  const data = await res.json();
  console.log(`✅ Image sent to ${to} | msg_id: ${data.messages?.[0]?.id}`);
  return data;
}

// ── Send a quick-reply button message (optional) ──────
export async function sendWhatsAppButtons(to, bodyText, buttons) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken  = process.env.WHATSAPP_ACCESS_TOKEN;

  if (isLocalTestSend()) {
    console.log(`[DEV MODE - Buttons] To: ${to}\n${bodyText}`);
    return { mock: true };
  }

  const url = `${WA_API_BASE}/${phoneNumberId}/messages`;

  const body = {
    messaging_product: "whatsapp",
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: {
        buttons: buttons.map((btn, i) => ({
          type: "reply",
          reply: { id: `btn_${i}`, title: btn },
        })),
      },
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`❌ Button send failed: ${err}`);
  }

  return await res.json();
}
