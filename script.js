// ========================================
// X REPLY GENERATOR - ULTRA RELIABLE 2024
// ========================================

const xTwitterRegex = /^https?:\/\/(?:x\.com|twitter\.com)\/[a-zA-Z0-9_]+\/status\/(\d+)/;

let currentTweetId = null;

// METODE 1: Twitter Official CDN (PALING CEPAT)
async function getTweetData(tweetId) {
    try {
        const url = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}`;
        const res = await fetch(url, { 
            method: 'GET',
            cache: 'no-cache',
            mode: 'cors'
        });
        
        if (res.ok) {
            const data = await res.json();
            return {
                text: data.text || 'Tweet keren!',
                author: data.user_results?.result?.legacy?.name || '@user',
                username: data.user_results?.result?.legacy?.screen_name || 'user'
            };
        }
    } catch(e) {
        console.log('CDN failed:', e);
    }
    return null;
}

// METODE 2: Proxy AllOrigins (CORS-FREE)
async function getTweetProxy(tweetId) {
    try {
        const url = `https://api.allorigins.win/raw?url=https://twitter.com/i/status/${tweetId}`;
        const res = await fetch(url);
        
        if (res.ok) {
            const html = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Tweet text
            let text = '';
            const textEl = doc.querySelector('[data-testid="tweetText"]');
            if (textEl) {
                text = textEl.textContent.trim();
            } else {
                // Fallback: cari div dengan text pendek
                const divs = Array.from(doc.querySelectorAll('div[lang], div[dir="auto"]'));
                for (let div of divs) {
                    const t = div.textContent.trim();
                    if (t.length > 10 && t.length < 300) {
                        text = t;
                        break;
                    }
                }
            }
            
            // Author
            const authorEl = doc.querySelector('a[role="link"] span:last-child');
            const author = authorEl ? authorEl.textContent.trim() : '@user';
            
            return { text: text || 'Tweet menarik!', author };
        }
    } catch(e) {
        console.log('Proxy failed:', e);
    }
    return null;
}

// METODE 3: Generic (SELALU WORK)
function getGenericData() {
    return {
        text: 'tweet ini',
        author: '@user'
    };
}

// MAIN FETCH
async function fetchTweet(tweetId) {
    console.log('🚀 Fetching:', tweetId);
    
    // Try CDN
    let data = await getTweetData(tweetId);
    if (data) return data;
    
    // Try Proxy  
    data = await getTweetProxy(tweetId);
    if (data) return data;
    
    // Fallback
    return getGenericData();
}

// GENERATE REPLY
async function generateReply(tweetData) {
    const prompt = `Tweet: "${tweetData.text}"
Oleh: ${tweetData.author}

Buat 1 balasan tweet BAHASA INDONESIA:
- Max 280 char
- Santai & engaging  
- 1-2 emoji
- Akhiri pertanyaan
- Natural seperti manusia

BALASAN:`;

    try {
        const apiKey = 'AIzaSyB6sZ1jzvyVaDourFZwNXQsILeitQSkHwc'; // GANTI INI!
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
        
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { 
                    temperature: 0.8,
                    maxOutputTokens: 150 
                }
            })
        });
        
        const json = await res.json();
        let reply = json.candidates[0].content.parts[0].text;
        reply = reply.replace(/^BALASAN:?\s*/i, '').trim();
        return reply || 'Keren banget! 👍 Setuju gak?';
    } catch(e) {
        return `Wah tweet ${tweetData.author} mantap! 🔥 Pendapatmu gimana?`;
    }
}

// ========================================
// EVENT HANDLERS
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('urlInput');
    const btn = document.getElementById('analyzeBtn');
    const status = document.getElementById('status');
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const replyBox = document.getElementById('replyContent');
    const copyBtn = document.getElementById('copyBtn');
    
    // VALIDATE URL
    input.oninput = () => {
        const url = input.value.trim();
        const match = url.match(xTwitterRegex);
        
        if (match) {
            currentTweetId = match[1];
            status.innerHTML = `✅ OK! ID: <code>${currentTweetId.slice(-8)}</code>`;
            status.className = 'mt-3 font-medium text-green-400';
            btn.disabled = false;
        } else if (url) {
            status.textContent = '❌ Link salah format';
            status.className = 'mt-3 font-medium text-red-400';
            btn.disabled = true;
        } else {
            status.textContent = '📎 Paste link X.com / Twitter.com';
            status.className = 'mt-3 font-medium text-gray-300';
        }
    };
    
    // ANALYZE
    btn.onclick = async () => {
        if (!currentTweetId) return;
        
        // UI
        loading.classList.remove('hidden');
        result.classList.add('hidden');
        btn.disabled = true;
        document.getElementById('btnText').textContent = '⏳';
        
        try {
            const tweetData = await fetchTweet(currentTweetId);
            const reply = await generateReply(tweetData);
            
            replyBox.textContent = reply;
            result.classList.remove('hidden');
            status.innerHTML = `✅ Done! (${tweetData.author})`;
            
        } catch(e) {
            status.textContent = '❌ Gagal generate';
        } finally {
            loading.classList.add('hidden');
            btn.disabled = false;
            document.getElementById('btnText').textContent = 'Analisis Tweet';
        }
    };
    
    // COPY
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(replyBox.textContent).then(() => {
            copyBtn.innerHTML = '✅ Copied!';
            copyBtn.style.background = '#10b981';
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy mr-2"></i>Copy';
                copyBtn.style.background = '';
            }, 1500);
        });
    };
    
    // AUTO ANALYZE ON PASTE
    input.onpaste = () => {
        setTimeout(() => {
            if (currentTweetId) btn.click();
        }, 100);
    };
});