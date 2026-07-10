async function askGemini(text) {
  try {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const combinedPrompt = `${SYSTEM_PROMPT}\n\nእባክህ በሚከተለው የደንበኛ ጥያቄ መሰረት በአማርኛ ብቻ ምላሽ ስጥ፦ ${text}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: combinedPrompt }] }]
      })
    });
    
    const data = await response.json();
    if (data && data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    }
    
    // ይህ ነው የጠየቅከው ሙሉ ጽሁፍ
    return "🌟 ማርሻሎም (Marshalom) የቴክኖሎጂ ረዳት 🌟\nሰላም! መልእክትዎን ስላደረሱን እናመሰግናለን። 🙏\nአሁን ላይ እጅግ በጣም ብዙ ጥያቄዎችን በማስተናገድ ላይ ስለሆንን፣ ትክክለኛ ምላሽ ለእርስዎ ለመስጠት የ Shalom Technology የቴክኖሎጂ አገልግሎት ቡድን ቀጥተኛ ፍቃድ በመጠበቅ ላይ እገኛለሁ። ⏳\nአትጨነቁ! መልእክትዎ በአስተማማኝ ሁኔታ ተይዟል። 🤝✨\n⚠️ ጉዳይዎ አስቸኳይ ከሆነ፣ ይህን ቅጽ በመከተል ይላኩልን፦\n\nአስቸኳይ ብለው ይጻፉ።\nየችግሩን ወይም የጥያቄዎን ዝርዝር በአጭሩ ይግለጹ።\n(ምሳሌ፦ አስቸኳይ፣ ካሜራዬ አይሰራም ወይም አስቸኳይ፣ ሌላ ጉዳይ) 🚨\nማሳሰቢያ፦ ይህንን መልእክት ሲልኩ ማርሻሎም በቀጥታ በግል ስልኩ የጽሁፍ መልእክት (SMS) ደርሶት፣ በአጭር ጊዜ ውስጥ እራሱ ይደውልልዎታል! 📱";
  } catch(e) {
    console.error("askGemini error:", e);
    return "🌟 ማርሻሎም (Marshalom) የቴክኖሎጂ ረዳት 🌟\nሰላም! መልእክትዎን ስላደረሱን እናመሰግናለን። 🙏\nአሁን ላይ እጅግ በጣም ብዙ ጥያቄዎችን በማስተናገድ ላይ ስለሆንን፣ ትክክለኛ ምላሽ ለእርስዎ ለመስጠት የ Shalom Technology የቴክኖሎጂ አገልግሎት ቡድን ቀጥተኛ ፍቃድ በመጠበቅ ላይ እገኛለሁ። ⏳\nአትጨነቁ! መልእክትዎ በአስተማማኝ ሁኔታ ተይዟል። 🤝✨\n⚠️ ጉዳይዎ አስቸኳይ ከሆነ፣ ይህን ቅጽ በመከተል ይላኩልን፦\n\nአስቸኳይ ብለው ይጻፉ።\nየችግሩን ወይም የጥያቄዎን ዝርዝር በአጭሩ ይግለጹ።\n(ምሳሌ፦ አስቸኳይ፣ ካሜራዬ አይሰራም ወይም አስቸኳይ፣ ሌላ ጉዳይ) 🚨\nማሳሰቢያ፦ ይህንን መልእክት ሲልኩ ማርሻሎም በቀጥታ በግል ስልኩ የጽሁፍ መልእክት (SMS) ደርሶት፣ በአጭር ጊዜ ውስጥ እራሱ ይደውልልዎታል! 📱";
  }
}
