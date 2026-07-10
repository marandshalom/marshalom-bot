const TELEGRAM_TOKEN = "8939570857:AAEgOw_G8LAPAZAIIbi4NueilJnbJkyUOd4";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("OK");
  const message = req.body?.message;
  if (!message?.text) return res.status(200).send("OK");

  try {
    // 1. መጀመሪያ ያለውን የሞዴል ዝርዝር እንጠይቅ
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
    const listData = await listRes.json();
    
    // 2. የሚገኙትን ሞዴሎች ስም ብቻ እናውጣ
    const modelNames = listData.models ? listData.models.map(m => m.name).join(", ") : "ምንም ሞዴል አልተገኘም";

    // 3. ዝርዝሩን ለቴሌግራም ላክ
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        chat_id: message.chat.id, 
        text: `🤖 ያንተ የኤፒአይ ቁልፍ የሚያያቸው ሞዴሎች እነዚህ ናቸው፦\n\n${modelNames}` 
      })
    });
  } catch (e) {
    console.error(e);
  }
  return res.status(200).send("OK");
}