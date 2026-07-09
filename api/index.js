const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID;

const SYSTEM_PROMPT = `አንተ "Marshalom AI" ነህ — የ Shalom Technology ኦፊሴላዊ ዲጂታል ረዳት።
የቢዝነሱ ባለቤት ስም ማርሻሎም ነው።
ቋንቋ: ደንበኛው በምን ቋንቋ ቢጽፍ በዚያው ምላሽ ስጥ። ፈጽሞ ቋንቋ አትቀይር።
ስብዕና: ተፈጥሯዊ፣ ሙቀት ያለው፣ ወዳጃዊ ሁን።
አገልግሎቶቻችን: CCTV ካሜራ ገጠማና ጥገና፣ የኔትወርክ ገጠማ፣ የኦንላይን ገበያ።
ስለ ዋጋ: ምንም ቁጥር አትጥቀስ። "ዝርዝሩን ንገረኝ — ምርጥ ዋጋ እናዘጋጅልሃለን" በል።
ሁሉም ሲሟላ: "ማርሻሎም በቅርቡ ይደውልልሃል"በል።`;

async function sendTelegram(chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text })
    });
  } catch (e) {
    console.error("Telegram send error:", e);
  }
}

async function forwardTelegram(fromChatId, messageId) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/forwardMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: OWNER_CHAT_ID, from_chat_id: fromChatId, message_id: messageId })
    });
  } catch (e) {
    console.error("Telegram forward error:", e);
  }
}

async function askGemini(text) {
  try {
    // ⚠️ እዚህ ጋር የጌሚኒ ሊንክ ወደ v1 እና gemini-1.5-flash ተስተካክሏል (404 ኤረሩን ያጠፋዋል)
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: text }] }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API Error:", response.status, errText);
      return "ይቅርታ፣ አሁን ከጌሚኒ ጋር መገናኘት አልቻልኩም።";
    }

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "ይቅርታ፣ አሁን መልስ መስጠት አልቻልኩም።";
  } catch (err) {
    console.error("Gemini Error:", err);
    return "ይቅርታ፣ በቴክኒክ ምክንያት አሁን መልስ መስጠት አልቻልኩም።";
  }
}

export default async function handler(req, res) {
  if (req.method === "GET") return res.status(200).send("Bot Running");

  try {
    const update = req.body;
    if (!update || !update.message) return res.status(200).send("OK");

    const message = update.message;
    const chatId = message.chat.id;

    if (message.voice) {
      await forwardTelegram(chatId, message.message_id);
      await sendTelegram(chatId, "⏳ የድምጽ መልእክትዎን ተቀብለናል! ማርሻሎም በቅርቡ ያነጋግርዎታል! 😊");
      return res.status(200).send("OK");
    }

    if (message.text) {
      const aiReply = await askGemini(message.text.trim());
      await sendTelegram(chatId, aiReply);
      await sendTelegram(OWNER_CHAT_ID, `💬 ደንበኛ: ${message.text}\n🤖 ቦት: ${aiReply}`);
    }

    return res.status(200).send("OK");
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(200).send("OK");
  }
}
