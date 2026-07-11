const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "8939570857:AAEgOw_G8LAPAZAIIbi4NueilJnbJkyUOd4";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const OWNER_CHAT_ID = process.env.OWNER_CHAT_ID || "1577576513";

// ––––– SYSTEM PROMPT –––––
const SYSTEM_PROMPT = `አንተ "Marshalom AI" ነህ — የ Shalom Technology ኦፊሴላዊ ዲጂታል ረዳት።
የቢዝነሱ ባለቤት ስም ማርሻሎም ነው።
ቋንቋ: ደንበኛው በምን ቋንቋ ቢጽፍ በዚያው ምላሽ ስጥ። ፈጽሞ ቋንቋ አትቀይር።
ስብዕና: ተፈጥሯዊ፣ ሙቀት ያለው፣ ወዳጃዊ ሁን። ደንበኛው ብዙ ቢናገር ሙሉ መረጃ ስብስብ።
አገልግሎቶቻችን: CCTV ካሜራ (ገጠማ/ጥገና), የኔትወርክ ገጠማ, የኦንላይን ገበያ ምርቶች ማድረስ።
ስለ ዋጋ: "ዝርዝሩን ንገረኝ — ላንተ ምርጥ ዋጋ እና ቅናሽ እናዘጋጅልሃለን" በል።`;

// ––––– HELPER: Customer info –––––
function formatCustomerInfo(user) {
  let name = user.first_name || '';
  if (user.last_name) name += ' ' + user.last_name;
  let info = `👤 Customer: ${name}`;
  if (user.username) info += ` (@${user.username})`;
  info += `\n🆔 User ID: ${user.id}`;
  info += `\n🔗 Profile: tg://user?id=${user.id}`;
  return info;
}

// ––––– TELEGRAM HELPERS –––––
async function sendTelegram(chatId, text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
    if (!res.ok) console.error('sendTelegram failed:', res.status, await res.text());
  } catch (e) {
    console.error('sendTelegram exception:', e);
  }
}

async function forwardTelegram(fromChatId, messageId) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/forwardMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: OWNER_CHAT_ID, from_chat_id: fromChatId, message_id: messageId })
    });
    if (!res.ok) console.error('forwardTelegram failed:', res.status, await res.text());
  } catch (e) {
    console.error('forwardTelegram exception:', e);
  }
}

// ––––– GEMINI –––––
async function askGemini(text) {
  if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY missing – fallback busy.');
    return 'busy';
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${text}` }] }] })
    });
    const data = await res.json();
    if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
    return 'busy';
  } catch (e) {
    return 'busy';
  }
}

// ––––– HANDLER –––––
export default async function handler(req, res) {
  if (req.method === 'GET') return res.status(200).send('Marshalom AI Bot is running! 🤖');
  if (req.method !== 'POST') return res.status(200).send('OK');

  try {
    const update = req.body;
    if (!update || !update.message) return res.status(200).send('OK');
    const { message } = update;
    const chatId = message.chat.id;
    const isOwner = String(chatId) === String(OWNER_CHAT_ID);

    // –––– OWNER REPLIES ––––
    if (isOwner) {
      if (message.reply_to_message) {
        const replied = message.reply_to_message;
        let targetChatId = null;
        if (replied.forward_from) targetChatId = replied.forward_from.id;
        else if (replied.forward_from_chat) targetChatId = replied.forward_from_chat.id;
        if (targetChatId && message.text) {
          await sendTelegram(targetChatId, `📩 Reply from Owner:\n${message.text}`);
          await sendTelegram(OWNER_CHAT_ID, '✅ Your reply was sent.');
        } else {
          await sendTelegram(OWNER_CHAT_ID, 'ℹ️ Reply to a forwarded customer message.');
        }
        return res.status(200).send('OK');
      }
      // Owner normal message – ignore or show help
      if (message.text === '/start') {
        await sendTelegram(OWNER_CHAT_ID, '👋 You are the owner. Reply to forwarded messages to answer customers.');
      }
      return res.status(200).send('OK');
    }

    // –––– CUSTOMER MESSAGES ––––

    // /test command – quick test
    if (message.text === '/test') {
      await forwardTelegram(chatId, message.message_id);
      const testReply = '✅ Test reply – your message was received!';
      await sendTelegram(chatId, testReply);
      await sendTelegram(OWNER_CHAT_ID, `${formatCustomerInfo(message.from)}\n\n🧪 /test command\n🤖 Reply: ${testReply}`);
      return res.status(200).send('OK');
    }

    // /start
    if (message.text === '/start') {
      await forwardTelegram(chatId, message.message_id);
      const welcome = '🔄 TEST VERSION – if you see this, the bot is updated!\n\n✨ እንኳን ደህና መጡ ወደ ማርሻሎም (Marshalom)! ✨\n📢 ቻናላችንን ይቀላቀሉ፡ https://t.me/cctvcamera2018 \n📞 ለበለጠ መረጃ፡ 0931556590';
      await sendTelegram(chatId, welcome);
      await sendTelegram(OWNER_CHAT_ID, `${formatCustomerInfo(message.from)}\n\n📝 /start\n🤖 Reply: ${welcome}`);
      return res.status(200).send('OK');
    }

    // Voice
    if (message.voice) {
      await forwardTelegram(chatId, message.message_id);
      const reply = '⏳ መልእክትዎ ደርሷል፣ ማርሻሎም በቅርቡ ይደውልልዎታል!';
      await sendTelegram(chatId, reply);
      await sendTelegram(OWNER_CHAT_ID, `${formatCustomerInfo(message.from)}\n\n🎤 Voice\n🤖 Reply: ${reply}`);
      return res.status(200).send('OK');
    }

    // Text (regular question)
    if (message.text) {
      await forwardTelegram(chatId, message.message_id);
      const aiReply = await askGemini(message.text);
      let finalReply = aiReply;
      if (aiReply === 'busy') {
        finalReply = '🌟 ማርሻሎም (Marshalom) የቴክኖሎጂ ረዳት 🌟\nሰላም! መልእክትዎን ስላደረሱን እናመሰግናለን። 🙏\nአሁን ላይ እጅግ በጣም ብዙ ጥያቄዎችን በማስተናገድ ላይ ስለሆንን፣ ትክክለኛ ምላሽ ለእርስዎ ለመስጠት የ Shalom Technology ፍቃድ በመጠበቅ ላይ እገኛለሁ። ⏳\nአትጨነቁ! መልእክትዎ በአስተማማኝ ሁኔታ ተይዟል። 🤝✨\n⚠️ ጉዳይዎ አስቸኳይ ከሆነ፣ ይህን ቅጽ በመከተል ይላኩልን፦\n\nአስቸኳይ ብለው ይጻፉ።\nየችግሩን ወይም የጥያቄዎን ዝርዝር በአጭሩ ይግለጹ።\n(ምሳሌ፦ አስቸኳይ፣ ካሜራዬ አይሰራም ወይም ሌላ... ) 🚨\nማሳሰቢያ፦ ይህንን የእርሶን ጉዳይ በመረዳት በቀጥታ ወደ ማርሻሎም የግል (SMS) እልካለው ። ደርሶት፣ በአጭር ጊዜ ውስጥ እራሱ ይደውልልዎታል! 📱';
      }
      await sendTelegram(chatId, finalReply);
      await sendTelegram(OWNER_CHAT_ID, `${formatCustomerInfo(message.from)}\n\n💬 Question: ${message.text}\n🤖 Reply: ${finalReply}`);
      return res.status(200).send('OK');
    }

    return res.status(200).send('OK');
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(200).send('OK');
  }
}