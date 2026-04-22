const tweetUrlInput = document.getElementById('tweetUrl');
const apiKeyInput = document.getElementById('apiKey');
const generateBtn = document.querySelector('.generate-btn');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const replyBox = document.getElementById('replyBox');
const errorDiv = document.getElementById('error');
let useCustomApi = false;
let customApiKey = '';

// GANTI INI DENGAN API KEY GEMINI KAMU!
const PUBLIC_API_KEY = 'AIzaSyBO5IP0EusMN3fZ8F8K2rGqC7oKkYq3z4w'; 

async function generateReply() {
    const tweetUrl = tweetUrlInput.value.trim();
    
    if (!tweetUrl) {
        showError('Masukkan link postingan X!');
        return;
    }

    hideAll();
    showLoading();

    try {
        const tweetText = await getTweetText(tweetUrl);
        const apiKey = useCustomApi ? customApiKey : PUBLIC_API_KEY;
        const reply = await callGemini(tweetText, apiKey);
        showResult(reply);
    } catch (error) {
        showError(error.message);
    }
}

async function getTweetText(url) {
    try {
        // Nitter fallback (paling reliable & gratis)
        const nitterUrl = url.replace('twitter.com', 'nitter.net').replace('x.com', 'nitter.net');
        const response = await fetch(nitterUrl);
        const html = await response.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Extract tweet text
        let tweetText = doc.querySelector('.tweet-content')?.textContent?.trim() ||
                       doc.querySelector('[data-testid="tweetText"]')?.textContent?.trim() ||
                       'Tweet content tidak terbaca';
        
        if (tweetText.length > 200) tweetText = tweetText.substring(0, 200) + '...';
        
        return tweetText || `Tweet dari: ${url}`;
    } catch {
        return `Tweet dari link: ${url}`;
    }
}

async function callGemini(tweetText, apiKey) {
    const prompt = `Buat reply dalam bahasa Jepang yang natural, sesuai konteks tweet ini, dan tidak spam. Tweet: "${tweetText}"\n\nReply:`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 150,
            }
        })
    });

    if (!response.ok) throw new Error('API Error. Cek API Key atau coba lagi.');

    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
}

function showLoading() {
    loading.style.display = 'block';
    generateBtn.disabled = true;
    generateBtn.textContent = '⏳ Menghasilkan...';
}

function showResult(reply) {
    hideAll();
    replyBox.textContent = reply;
    result.style.display = 'block';
    generateBtn.disabled = false;
    generateBtn.textContent = '🚀 Generate Lagi';
}

function showError(message) {
    hideAll();
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    generateBtn.disabled = false;
    generateBtn.textContent = '🚀 Coba Lagi';
}

function hideAll() {
    loading.style.display = 'none';
    result.style.display = 'none';
    errorDiv.style.display = 'none';
}

function copyReply() {
    navigator.clipboard.writeText(replyBox.textContent).then(() => {
        const btn = document.querySelector('.copy-btn');
        btn.textContent = '✅ Tersalin!';
        setTimeout(() => btn.textContent = '📋 Copy Reply', 2000);
    });
}

function toggleApiKey() {
    const apiSection = document.getElementById('apiSection');
    apiSection.classList.toggle('show');
    if (apiSection.classList.contains('show')) {
        customApiKey = apiKeyInput.value.trim();
        useCustomApi = !!customApiKey;
    }
}

// Enter support
tweetUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') generateReply();
});