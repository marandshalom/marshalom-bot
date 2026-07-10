async function askGemini(text) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    // ማስተካከያ፡ ለጌሚኒ መመሪያውን በግልጽ እንዲረዳው አወቃቀሩን አስተካክለነዋል
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${SYSTEM_PROMPT}\n\nአሁን ደንበኛው የመጣው ደግሞ ይህንን ብሎ ነው፡ "${text}"` }]
          }
        ]
      })
    });
    
    const data = await response.json();
    console.log("Gemini raw response:", JSON.stringify(data));
    
    if (data && data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    }
    
    if (data && data.error) {
      console.error("Gemini API Error Detail:", data.error.message);
    }
    return "ይቅርታ፣ መስመሩ ስለተጨናነቀ ነው፤ እባክህ ጥቂት ቆይተህ እንደገና ሞክር! 🙏";
  } catch(e) {
    console.error("askGemini error:", e);
    return "ይቅርታ፣ መስመሩ ስለተጨናነቀ ነው፤ እባክህ ጥቂት ቆይተህ እንደገና ሞክር! 🙏";
  }
}