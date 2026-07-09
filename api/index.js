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
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text })
  });
}

async function forwardTelegram(fromChatId, messageId) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/forwardMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: OWNER_CHAT_ID, from_chat_id: fromChatId, message_id: messageId })
  });
}

async function askGemini(text) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: text }] }],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
    })
  });

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "ይቅርታ፣ አሁን መልስ መስጠት አልቻልኩም።";
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
    return res.status(200).send("OK");
  }
}
