import fetch from "node-fetch"; // 👈 የ fetch ግንኙነት አስተማማኝ እንዲሆን ተጨምሯል

const TELEGRAM_TOKEN = "8939570857:AAFiqS65nE0SY2cxj-J8oZSVcJMa2mOAkzM";
const GEMINI_API_KEY = "AQ.Ab8RN6JqkQmUF7cdv0dwwk-KFTHw6_gwmLV8MDFYVT_DE2IG9Q";
const OWNER_CHAT_ID = "1577576513";

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
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text })
    });
  } catch (e) {
    console.error("sendTelegram error:", e);
  }
}

async function forwardTelegram(fromChatId, messageId) {
  try {
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
  } catch (e) {
    console.error("forwardTelegram error:", e);
  }
}

async function askGemini(text) {
  try {
    // 🔗 ወደ አዲሱና አስተማማኙ የ Gemini 2.0 API endpoint ተቀይሯል
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const requestBody = {
      contents: [{ role: "user", parts: [{ text: text }] }],
      // ⚙️ የ System Instruction አወቃቀር ለቪ1ቤታ እንዲስማማ ተስተካክሏል
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    // 🔎 የጌሚኒ መልስ መምጣቱን ቼክ ማድረጊያ
    if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      return data.candidates[0].content.parts[0].text;
    }
    
    // ኤፒአዩ መልስ ካልሰጠ ሰርቨሩ ላይ ምን እንደመጣ ሎግ አድርጎ ለማየት
    console.error("Gemini API Unexpected Response:", JSON.stringify(data));
    return "ይቅርታ፣ ጥያቄዎን በደንብ አልተረዳሁትም። እባክዎ እንደገና ይጻፉልኝ! 🙏";
  } catch (e) {
    console.error("askGemini catch error:", e);
    return "የቴክኒክ ችግር አጋጥሟል፣ እባክዎ ጥቂት ቆይተው ይሞክሩ! 🛠️";
  }
}

export const config = {
  api: { bodyParser: true }
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).send("Marshalom AI Bot is running perfectly! 🤖🚀");
  }

  if (req.method !== "POST") {
    return res.status(200).send("OK");
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

    // 🎤 የድምጽ መልእክት ሲመጣ
    if (message.voice) {
      await forwardTelegram(chatId, message.message_id);
      await sendTelegram(OWNER_CHAT_ID, `🎤 አዲስ የድምጽ መልእክት!\n👤 ከ: ${firstName} (${username})`);
      await sendTelegram(chatId, "⏳ የድምጽ መልእክትዎን ተቀብለናል! ማርሻሎም በቅርቡ ያነጋግርዎታል! 😊");
      return res.status(200).send("OK");
    }

    // 💬 የጽሑፍ መልእክት ሲመጣ (እውነተኛ AI ምላሽ)
    if (message.text) {
      const text = message.text;
      
      // ጌሚኒን ጠይቆ ትክክለኛውን መልስ ያመጣል
      const aiReply = await askGemini(text);
      
      // ለደንበኛው ይመልሳል
      await sendTelegram(chatId, aiReply);
      
      // ላንተ (ለባለቤቱ) ኮፒ ይልክልሃል
      await sendTelegram(OWNER_CHAT_ID, `💬 ደንበኛ [${firstName} (${username})]: ${text}\n🤖 ቦት የመለሰው: ${aiReply}`);
    }

    return res.status(200).send("OK");
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(200).send("OK");
  }
}
