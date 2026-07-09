import fetch from "node-fetch";

// 🔐 የደኅንነት ቁልፎች ከ Environment Variables ብቻ ይነበባሉ
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

// 🛠️ ቁልፎች በሰርቨሩ ላይ መኖራቸውን አስቀድሞ ማረጋገጫ (ካልኖሩ እዚህ ላይ ይቆማል)
if (!TELEGRAM_TOKEN || !GEMINI_API_KEY || !OWNER_CHAT_ID) {
  throw new Error("CRITICAL ERROR: Missing essential Environment Variables! Stopping deployment.");
}

async function sendTelegram(chatId, text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Telegram API Error [Status ${response.status}]: ${errorData}`);
  }
}

async function forwardTelegram(fromChatId, messageId) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/forwardMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: OWNER_CHAT_ID,
      from_chat_id: fromChatId,
      message_id: messageId
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Telegram Forward Error [Status ${response.status}]: ${errorData}`);
  }
}

async function askGemini(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: text }] }],
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Gemini API Error [Status ${response.status}]: ${errorData}`);
  }

  const data = await response.json();
  if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }
  
  throw new Error("Gemini API returned an unexpected or empty structure.");
}

export const config = {
  api: { bodyParser: true }
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).send("Marshalom AI Bot is secured and running! 🤖🛡️");
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const update = req.body;
    if (!update || !update.message) {
      return res.status(200).send("OK");
    }

    const message = update.message;
    const chatId = message.chat.id;
    const firstName = message.from?.first_name || "ደንበኛ";
    const username = message.from?.username ? `@${message.from.username}` : "N/A";

    // 🔊 የድምፅ መልእክት አያያዝ
    if (message.voice) {
      try {
        await forwardTelegram(chatId, message.message_id);
        await sendTelegram(OWNER_CHAT_ID, `🎤 አዲስ የድምጽ መልእክት!\n👤 ከ: ${firstName} (${username})`);
        await sendTelegram(chatId, "⏳ የድምጽ መልእክትዎን ተቀብለናል! ማርሻሎም በቅርቡ ያነጋግርዎታል! 😊");
      } catch (forwardError) {
        console.error("Forwarding audio failed:", forwardError);
        await sendTelegram(chatId, "ይቅርታ፣ የድምፅ መልእክትዎን ለባለቤቱ ማስተላለፍ አልተሳካም። እባክዎ በጽሑፍ ይሞክሩ። 🙏");
      }
      return res.status(200).send("OK");
    }

    // 💬 የጽሑፍ መልእክት አያያዝ
    if (message.text && message.text.trim().length > 0) {
      const text = message.text.trim();

      if (text.length > 2000) {
        await sendTelegram(chatId, "ይቅርታ፣ የላኩት መልእክት በጣም ረጅም ነው። እባክዎ አሳጥረው ይጻፉልኝ። 🙏");
        return res.status(200).send("OK");
      }

      try {
        const aiReply = await askGemini(text);
        await sendTelegram(chatId, aiReply);
        await sendTelegram(OWNER_CHAT_ID, `💬 ደንበኛ [${firstName} (${username})]: ${text}\n🤖 ቦት የመለሰው: ${aiReply}`);
        
      } catch (aiError) {
        console.error("AI/Telegram Processing Error:", aiError);
        await sendTelegram(chatId, "ይቅርታ፣ ጥያቄዎን ለማስተናገድ ትንሽ የቴክኒክ መስተጓጎል አጋጥሞኛል። እባክዎ ከጥቂት ደቂቃዎች ወደ ፊት ሞክሩ። 🙏");
      }
    }

    return res.status(200).send("OK");
  } catch (err) {
    console.error("Global Handler Error:", err);
    return res.status(500).send("Internal Server Error");
  }
}
