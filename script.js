// X/Twitter URL Regex - SUPPORT x.com DAN twitter.com
const xTwitterRegex = /^https?:\/\/(x\.com|twitter\.com)\/[a-zA-Z0-9_]+\/status\/(\d+)/;

const nitterInstances = [
    'https://nitter.net',
    'https://nitter.1d4.us',
    'https://nitter.privacydev.net',
    'https://nitter.kavin.rocks',
    'https://nitter.poast.org'
];

let currentTweetData = null;

// Extract Tweet ID dari URL
function extractTweetId(url) {
    const match = url.match(xTwitterRegex);
    return match ? match[2] : null;
}

// Parse tweet content dari Nitter HTML
function parseTweetHtml(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const tweetContent = doc.querySelector('div.tweet-content')?.textContent?.trim() ||
                        doc.querySelector('[data-testid="tweetText"]')?.textContent?.trim() ||
                        'Tidak dapat membaca konten tweet';
    
    const author = doc.querySelector('span.username-or-displayname')?.textContent?.trim() ||
                  doc.querySelector('[data-testid="User-Name"]')?.textContent?.trim() ||
                  'Unknown User';
    
    return {
        content: tweetContent,
        author: author,
        rawHtml: html
    };
}

// Fetch tweet via Nitter
async function fetchTweet(tweetId) {
    for (const instance of nitterInstances) {
        try {
            console.log(`Trying ${instance}/${tweetId}`);
            const response = await fetch(`${instance}/${tweetId}`);
            if (response.ok) {
                const html = await response.text();
                const tweetData = parseTweetHtml(html);
                console.log('Tweet fetched successfully:', tweetData);
                return tweetData;
            }
        } catch (error) {
            console.log(`Failed ${instance}:`, error.message);
            continue;
        }
    }
    throw new Error('Semua Nitter instance gagal. Coba lagi nanti.');
}

// Generate reply menggunakan Gemini API
async function generateReply(tweetData) {
    const prompt = `Buat balasan tweet yang cerdas, menarik, dan engaging untuk tweet ini:

TWEET: "${tweetData.content}"
AUTHOR: ${tweetData.author}

Aturan:
1. Bahasa Indonesia yang natural
2. Maksimal 280 karakter
3. Menarik perhatian dan memancing interaksi
4. Positif dan membangun
5. Tambahkan 1-2 emoji relevan
6. Akhiri dengan pertanyaan atau call-to-action

Balasan:`;

    try {
        // Ganti dengan API key Gemini Anda
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_GEMINI_API_KEY', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.8,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 200,
                }
            })
        });

        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
        console.error('Gemini API Error:', error);
        return 'Wah, tweet ini menarik banget! 👍 Apa pendapatmu tentang ini?';
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    const urlInput = document.getElementById('urlInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const status = document.getElementById('status');
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const replyContent = document.getElementById('replyContent');
    const copyBtn = document.getElementById('copyBtn');
    const btnText = document.getElementById('btnText');
    const btnIcon = document.getElementById('btnIcon');

    // Real-time URL validation
    urlInput.addEventListener('input', function() {
        const url = this.value.trim();
        const tweetId = extractTweetId(url);
        
        if (tweetId) {
            status.textContent = `✅ Valid! Tweet ID: ${tweetId.slice(-8)}`;
            status.className = 'mt-3 font-medium text-green-400';
            analyzeBtn.disabled = false;
        } else if (url) {
            status.textContent = '❌ Link X/Twitter tidak valid';
            status.className = 'mt-3 font-medium text-red-400';
            analyzeBtn.disabled = true;
        } else {
            status.textContent = 'Paste link X/Twitter...';
            status.className = 'mt-3 font-medium text-gray-300';
            analyzeBtn.disabled = true;
        }
    });

    // Analyze button
    analyzeBtn.addEventListener('click', async function() {
        const url = urlInput.value.trim();
        const tweetId = extractTweetId(url);
        
        if (!tweetId) return;

        // Show loading
        loading.classList.remove('hidden');
        result.classList.add('hidden');
        analyzeBtn.disabled = true;
        btnText.textContent = 'Menganalisis...';
        btnIcon.className = 'fas fa-spinner loading-spinner ml-2';

        try {
            // 1. Fetch tweet
            currentTweetData = await fetchTweet(tweetId);
            
            // 2. Generate reply
            const reply = await generateReply(currentTweetData);
            
            // 3. Show result
            replyContent.textContent = reply;
            result.classList.remove('hidden');
            
        } catch (error) {
            status.textContent = `Error: ${error.message}`;
            status.className = 'mt-3 font-medium text-red-400';
        } finally {
            loading.classList.add('hidden');
            analyzeBtn.disabled = false;
            btnText.textContent = 'Analisis Tweet';
            btnIcon.className = 'fas fa-magic ml-2';
        }
    });

    // Copy button
    copyBtn.addEventListener('click', function() {
        const text = replyContent.textContent;
        navigator.clipboard.writeText(text).then(() => {
            const original = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Copied!';
            copyBtn.classList.add('bg-green-600');
            setTimeout(() => {
                copyBtn.innerHTML = original;
                copyBtn.classList.remove('bg-green-600');
            }, 2000);
        });
    });

    // Paste detection
    urlInput.addEventListener('paste', function() {
        setTimeout(() => {
            const url = this.value.trim();
            const tweetId = extractTweetId(url);
            if (tweetId) {
                analyzeBtn.click();
            }
        }, 100);
    });
});