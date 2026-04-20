

// ==========================================
// 1. TEXT/VOICE INTENT ANALYZER
// ==========================================
export const analyzeIntent = async (userText: string) => {
  const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!API_KEY) {
    console.error("🚨 CRITICAL: API Key is undefined! Check your .env.local file.");
    return smartFallback(userText);
  }

  try {
   // 🛑 FIX 1: Changed to the correct 'gemini-1.5-flash' model
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // 🛑 FIX 2: Force Gemini to return perfect JSON so your app never crashes
        generationConfig: { responseMimeType: "application/json" },
        contents: [{
          parts: [{
            text: `
              You are a search assistant. Map the user's problem to a TRADE and LOCATION.
              Trades: Plumber, Electrician, Builder, Mechanic, Welder, Painter, Tiler, Carpenter, Locksmith.
              Examples: "Geyser burst in Tsakane" -> { "trade": "Plumber", "location": "Tsakane" }
              Return ONLY JSON.
              User: "${userText}"
            `
          }]
        }]
      })
    });

    if (!response.ok) throw new Error("API Error");

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) throw new Error("Empty AI response");

    return JSON.parse(aiText);
  } catch (error) {
    console.warn("⚠️ AI Failed. Switching to Smart Fallback.", error);
    return smartFallback(userText);
  }
};

// ==========================================
// 2. VISUAL QUOTING (IMAGE) ANALYZER
// ==========================================
export const analyzeImageIntent = async (base64Image: string, mimeType: string) => {
  const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!API_KEY) {
    console.error("🚨 CRITICAL: API Key is undefined! Check your .env.local file.");
    throw new Error("Missing API Key");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); 

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal, 
      body: JSON.stringify({
        // 🛑 FIX 3: Force JSON output for the vision model too
        generationConfig: { responseMimeType: "application/json" },
        contents: [{
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                // Strips the "data:image/jpeg;base64," prefix so the API doesn't crash
                data: base64Image.includes(',') ? base64Image.split(',')[1] : base64Image
              }
            },
            {
              text: `
                You are a master South African artisan inspector. 
                Look at this image and tell me:
                1. What is broken or needs fixing? (Short description, e.g. "Burnt wall socket")
                2. What TRADE is needed? (Choose ONLY from: Plumber, Electrician, Builder, Mechanic, Welder, Painter, Tiler, Carpenter, Locksmith, Appliance Repair).
                
                Format as JSON: { "trade": "string or null", "problem": "string", "success": true }
              `
            }
          ]
        }]
      })
    });

    clearTimeout(timeoutId); 

    if (!response.ok) {
      const errorText = await response.text();
      console.error("🛑 Gemini Camera API Error:", errorText);
      throw new Error("Failed to process image with AI.");
    }

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) throw new Error("Empty AI response");

    return JSON.parse(aiText);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error("Camera AI: 3G Network Timeout.");
      throw new Error("Network timeout. Image took too long to upload."); 
    }
    console.error("Camera AI Failed:", error);
    throw new Error(error.message || "Something went wrong.");
  }
};

// ==========================================
// 3. SMART FALLBACK
// ==========================================
const smartFallback = (text: string) => {
  const lower = text.toLowerCase();
  const locations = ['tsakane', 'springs', 'brakpan', 'kwathema', 'duduza', 'nigel', 'daveyton', 'benoni', 'boksburg', 'east rand'];
  let foundLocation = "";
  locations.forEach(l => { if (lower.includes(l)) foundLocation = l; });

  const mappings: Record<string, string> = {
      'plumber': 'Plumber', 'geyser': 'Plumber', 'leak': 'Plumber', 'burst': 'Plumber', 'pipe': 'Plumber',
      'electrician': 'Electrician', 'light': 'Electrician', 'power': 'Electrician', 'plug': 'Electrician', 'tripping': 'Electrician',
      'builder': 'Builder', 'roof': 'Builder', 'wall': 'Builder', 'cement': 'Builder',
      'mechanic': 'Mechanic', 'car': 'Mechanic', 'engine': 'Mechanic', 'brakes': 'Mechanic',
  };

  let foundTrade = "";
  for (const [key, value] of Object.entries(mappings)) {
      if (lower.includes(key)) { foundTrade = value; break; }
  }

  return { trade: foundTrade, location: foundLocation ? foundLocation.charAt(0).toUpperCase() + foundLocation.slice(1) : "" };
};
