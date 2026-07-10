const TELEGRAM_TOKEN = "8939570857:AAEgOw_G8LAPAZAIIbi4NueilJnbJkyUOd4";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("OK");
  const message = req.body?.message;
  if (!message?.text) return res.status(200).send("OK");

  try {
    // 💡 መፍትሄ: v1 ላይ በቀጥታ 'models/gemini-1.5-flash' ን ጥራ
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `አንተ የShalom Technology ረዳት ነህ። በአማርኛ መልስ። ደንበኛ፡ ${message.text}` }] }]
      })
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || `ስህተት ተፈጠረ: ${JSON.stringify(data.error || "unknown")}`;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: message.chat.id, text: reply })
    });
  } catch (e) {
    console.error(e);
  }
  return res.status(200).send("OK");
}