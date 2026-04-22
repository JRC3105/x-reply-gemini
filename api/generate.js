export default async function handler(req, res) {
  const { tweetUrl } = req.body;
  
  try {
    const key = process.env.GEMINI_API_KEY;
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, 
      {
        method: 'POST',
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Reply Jepang untuk ${tweetUrl}` }] }]
        })
      }
    );
    
    const data = await response.json();
    
    // SIMPEL PARSING
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                  'AI belum siap 😅';
    
    res.json({ reply: reply.trim() });
    
  } catch(e) {
    res.json({ reply: 'Error: ' + e.message });
  }
}
