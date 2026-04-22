export default async function handler(req, res) {
  console.log('🐛 API HIT');

  if (req.method !== 'POST') {
    console.log('❌ Wrong method');
    return res.status(405).json({ error: 'POST required' });
  }

  const { tweetUrl } = req.body;
  console.log('📄 Tweet:', tweetUrl);

  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    console.log('🔑 API Key:', GEMINI_API_KEY ? 'OK' : 'MISSING');

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ reply: 'API Key belum diset di Vercel' });
    }

    const prompt = `buat reply dalam bahasa jepang yang natural, sesuai konteks dan tidak spam dari postingan berikut:

Tweet: ${tweetUrl}

Contoh: "面白い！😊"`;

    console.log('🌐 Calling Gemini...');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 60,
            topK: 40,
            topP: 0.95
          }
        })
      }
    );

    const rawData = await response.json();
    console.log('📊 Gemini raw:', JSON.stringify(rawData, null, 2));

    // 🛡️ BULLETPROOF PARSING
    let reply = 'なるほど！✨';

    if (rawData.candidates && 
        rawData.candidates[0] && 
        rawData.candidates[0].content && 
        rawData.candidates[0].content.parts && 
        rawData.candidates[0].content.parts[0] &&
        rawData.candidates[0].content.parts[0].text) {
      
      reply = rawData.candidates[0].content.parts[0].text.trim();
      console.log('✅ Parsed reply:', reply);
    } else {
      console.log('⚠️ No valid response, using fallback');
    }

    // Clean up
    reply = reply.replace(/\n/g, ' ').trim().slice(0, 100);

    console.log('🎉 FINAL:', reply);
    res.json({ reply });

  } catch (error) {
    console.error('💥 ERROR:', error.message);
    res.status(500).json({ reply: `Error: ${error.message}` });
  }
}
