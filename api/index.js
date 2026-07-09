import fetch from "node-fetch";

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID;

const SYSTEM_PROMPT = `አንተ "Marshalom AI" ነህ — የ Shalom Technology ኦፊሴላዊ ዲጂታል ረዳት።
የቢዝነሱ ባለቤት ስም ማርሻሎም ነው።
ቋንቋ: ደንበኛው በምን ቋንቋ ቢጽፍ (አማርኛ፣ እንግሊዝኛ፣ ኦሮምኛ፣ ትግርኛ) በዚያው ምላሽ ስጥ። ፈጽሞ ቋንቋ አትቀይር።
ስብዕና: ተፈጥሯዊ፣ ሙቀት ያለው፣ ወዳጃዊ ሁን። እንደ ሮቦት አትመልስ።
አገልግሎቶቻችን:
1. CCTV ካሜራ ገጠማ — ለማንኛውም ቦታ
2. CCTV ካሜራ ጥገና — ለማንኛውም ቦታ
3. የኔትወርክ ገጠማ — ለማንኛውም ቦታ
4. የኦንላይን ገበያ ምርቶች ማድረስ
ስለ ዋጋ: ምንም ቁጥር አትጥቀስ። "ዝርዝሩን ንገረኝ — ምርጥ ዋጋ እናዘጋጅልሃለን" በል።
ሁሉም ሲሟላ: "ማርሻሎም በቅርቡ ይደውልልሃል"በል።`;

async function sendTelegram(chatId, text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text })
  });
}

async function forwardTelegram(fromChatId, messageId) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/forwardMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: OWNER_CHAT_ID,
      from_chat_id: fromChatId,
      message_id: messageId
    })
  });
}

async function askGemini(text) {
  // እጅግ አስተማማኝ እና የተረጋጋው የጌሚኒ ሊንክ አወቃቀር
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: text }] }],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API Error Detail:", errorText);
    throw new Error("Gemini API Bad Status");
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "ይቅርታ፣ አሁን መልስ መስጠት አልቻልኩም።";
}

export const config = {
  api: { bodyParser: true }
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).send("Marshalom Bot Running");
  }

  try {
    const update = req.body;
    if (!update || !update.message) {
      return res.status(200).send("OK");
    }

    const message = update.message;
    const chatId = message.chat.id;
    const firstName = message.from?.first_name || "Customer";

    if (message.voice) {
      try {
        await forwardTelegram(chatId, message.message_id);
        await sendTelegram(OWNER_CHAT_ID, `🎤 New voice message from ${firstName}`);
        await sendTelegram(chatId, "⏳ የድምጽ መልእክትዎን ተቀብለናል! ማርሻሎም በቅርቡ ያነጋግርዎታል! 😊");
      } catch (err) {
        console.error("Voice forward error", err);
      }
      return res.status(200).send("OK");
    }

    if (message.text) {
      const text = message.text.trim();
      try {
        const aiReply = await askGemini(text);
        await sendTelegram(chatId, aiReply);
        await sendTelegram(OWNER_CHAT_ID, `💬 Customer: ${text}\n🤖 Bot: ${aiReply}`);
      } catch (aiError) {
        console.error("Gemini integration error:", aiError);
        await sendTelegram(chatId, "ይቅርታ፣ ጥያቄዎን ለማስተናገድ ትንሽ የቴክኒክ መስተጓጎል አጋጥሞኛል። እባክዎ ከጥቂት ደቂቃዎች ወደ ፊት ሞክሩ። 🙏");
      }
    }

    return res.status(200).send("OK");
  } catch (globalError) {
    console.error("Global crash handler:", globalError);
    return res.status(200).send("OK");
  }
}
