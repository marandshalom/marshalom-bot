const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "8939570857:AAFiqS65nE0SY2cxj-J8oZSVcJMa2mOAkzM";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AQ.Ab8RN6IMGvbBm7Uyq1IQufLZiJWASX_g7tVsl3Hd2QQ_JlRLXg";
const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID || "1577576513";

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
ሁሉም ሲሟላ: "ማርሻሎም በቅርቡ ይደውልልሃል"`;

async function sendTelegram(chatId, text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text })
  });
}

async function forwardTelegram(chatId, messageId) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/forwardMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: OWNER_CHAT_ID,
      from_chat_id: chatId,
      message_id: messageId
    })
  });
}

async function askGemini(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: text }] }]
    })
  });
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).send("Marshalom AI Bot is running! 🤖");
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  try {
    const update = req.body;
    if (!update.message) {
      return res.status(200).send("OK");
    }

    const message = update.message;
    const chatId = message.chat.id;
    const firstName = message.from?.first_name || "ደንበኛ";
    const username = message.from?.username ? `@${message.from.username}` : "N/A";

    // Handle voice message
    if (message.voice) {
      await forwardTelegram(chatId, message.message_id);
      await sendTelegram(OWNER_CHAT_ID, `🎤 ድምጽ መልእክት!\n👤 ${firstName} (${username})`);
      await sendTelegram(chatId, "⏳ ድምጽ መልእክትዎን ተቀብለናል!\nባለቤቱ በቅርቡ ይደውሉልዎታል! 😊");
      return res.status(200).send("OK");
    }

    // Handle text message
    if (message.text) {
      const text = message.text;
      try {
        const aiReply = await askGemini(text);
        await sendTelegram(chatId, aiReply);
        await sendTelegram(OWNER_CHAT_ID, `💬 ደንበኛ ጻፈ: ${text}\n👤 ${firstName} (${username})`);
      } catch (err) {
        await sendTelegram(chatId, "ይቅርታ፣ እንደገና ይሞክሩ! 🙏");
        await sendTelegram(OWNER_CHAT_ID, `⚠️ Error: ${err.message}`);
      }
    }

    return res.status(200).send("OK");
  } catch (err) {
    console.error("Error:", err);
    return res.status(200).send("OK");
  }
}
