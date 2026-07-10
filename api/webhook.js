const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "8939570857:AAEgOw_G8LAPAZAIIbi4NueilJnbJkyUOd4";
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || "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";
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
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text })
    });
  } catch(e) { console.error(e); }
}

async function forwardTelegram(fromChatId, messageId) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/forwardMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: OWNER_CHAT_ID, from_chat_id: fromChatId, message_id: messageId })
    });
  } catch(e) { console.error(e); }
}

async function askClaude(text) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: text }]
      })
    });
    const data = await response.json();
    if (data && data.content && data.content[0]) return data.content[0].text;
    return "ይቅርታ፣ እንደገና ይሞክሩ! 🙏";
  } catch(e) {
    console.error(e);
    return "ይቅርታ፣ እንደገና ይሞክሩ! 🙏";
  }
}

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method === "GET") return res.status(200).send("Marshalom AI Bot is running! 🤖");
  if (req.method !== "POST") return res.status(200).send("OK");
  try {
    const update = req.body;
    if (!update || !update.message) return res.status(200).send("OK");
    const message = update.message;
    const chatId = message.chat.id;
    const firstName = message.from?.first_name || "ደንበኛ";
    const username = message.from?.username ? `@${message.from.username}` : "N/A";
    if (message.voice) {
      await forwardTelegram(chatId, message.message_id);
      await sendTelegram(OWNER_CHAT_ID, `🎤 ድምጽ!\n👤 ${firstName} (${username})`);
      await sendTelegram(chatId, "⏳ ድምጽ መልእክትዎን ተቀብለናል!\nባለቤቱ በቅርቡ ይደውሉልዎታል! 😊");
      return res.status(200).send("OK");
    }
    if (message.text) {
      const aiReply = await askClaude(message.text);
      await sendTelegram(chatId, aiReply);
      await sendTelegram(OWNER_CHAT_ID, `💬 ደንበኛ ጻፈ: ${message.text}\n👤 ${firstName} (${username})`);
    }
    return res.status(200).send("OK");
  } catch(err) {
    console.error(err);
    return res.status(200).send("OK");
  }
}
