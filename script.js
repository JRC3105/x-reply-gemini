class XReplyGenerator {
    constructor() {
        this.apiKey = 'AIzaSyB6sZ1jzvyVaDourFZwNXQsILeitQSkHwc'; // Ganti dengan API Key Gemini Anda
        this.init();
    }

    init() {
        this.urlInput = document.getElementById('xUrl');
        this.generateBtn = document.getElementById('generateBtn');
        this.loading = document.getElementById('loading');
        this.result = document.getElementById('result');
        this.replyText = document.getElementById('replyText');
        this.copyBtn = document.getElementById('copyBtn');
        this.error = document.getElementById('error');
        this.charCount = document.getElementById('charCount');

        this.generateBtn.addEventListener('click', () => this.generateReply());
        this.copyBtn.addEventListener('click', () => this.copyReply());
        this.replyText.addEventListener('input', () => this.updateCharCount());

        // Enter key support
        this.urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.generateReply();
        });
    }

    async generateReply() {
        const url = this.urlInput.value.trim();
        
        if (!url) {
            this.showError('Masukkan link postingan X terlebih dahulu!');
            return;
        }

        if (!this.isValidXUrl(url)) {
            this.showError('Link X tidak valid! Contoh: https://x.com/username/status/123456789');
            return;
        }

        this.resetUI();
        this.showLoading();

        try {
            const tweetContent = await this.extractTweetContent(url);
            const reply = await this.callGemini(tweetContent);
            this.displayResult(reply);
        } catch (error) {
            console.error('Error:', error);
            this.showError('Terjadi kesalahan: ' + error.message);
        }
    }

    isValidXUrl(url) {
        const pattern = /^https?:\/\/(x\.com|twitter\.com)\/[a-zA-Z0-9_]+\/status\/[0-9]+/;
        return pattern.test(url);
    }

    async extractTweetContent(url) {
        try {
            // Menggunakan Twitter/X oEmbed API (tidak perlu API key)
            const tweetId = url.match(/status\/(\d+)/)?.[1];
            if (!tweetId) throw new Error('Tweet ID tidak ditemukan');

            const response = await fetch(
                `https://api.twitter.com/2/tweets?ids=${tweetId}&tweet.fields=text,author_id,created_at`,
                {
                    headers: {
                        'Authorization': `Bearer YOUR_TWITTER_BEARER_TOKEN` // Opsional, bisa pakai scraping sederhana
                    }
                }
            );

            if (!response.ok) {
                // Fallback: return URL saja untuk prompt
                return `Analisis tweet dari link ini: ${url}`;
            }

            const data = await response.json();
            return data.data?.[0]?.text || `Tweet dari: ${url}`;
        } catch (error) {
            // Fallback sederhana
            return `Buat reply untuk tweet dari link ini: ${url}`;
        }
    }

    async callGemini(tweetContent) {
        const prompt = `Buat reply dalam bahasa Jepang yang sesuai konteks tweet ini, natural dan tidak spam. Tweet: "${tweetContent}"

Requirements:
- Bahasa Jepang yang natural dan conversational
- Sesuai konteks tweet
- Tidak terlalu panjang (maksimal 100 karakter)
- Tidak seperti spam atau bot
- Gunakan emoji secukupnya
- Buat seperti orang Jepang asli yang sedang reply di X/Twitter`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 100,
                    }
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Tidak dapat generate reply';
    }

    displayResult(reply) {
        this.hideLoading();
        this.replyText.value = reply;
        this.updateCharCount();
        this.result.classList.remove('hidden');
        this.replyText.focus();
        this.replyText.select();
    }

    copyReply() {
        this.replyText.select();
        document.execCommand('copy');
        this.copyBtn.textContent = '✅ Tersalin!';
        setTimeout(() => {
            this.copyBtn.textContent = '📋 Copy';
        }, 2000);
    }

    updateCharCount() {
        const length = this.replyText.value.length;
        this.charCount.textContent = `${length} karakter`;
    }

    resetUI() {
        this.result.classList.add('hidden');
        this.error.classList.add('hidden');
        this.generateBtn.disabled = true;
    }

    showLoading() {
        this.loading.classList.remove('hidden');
    }

    hideLoading() {
        this.loading.classList.add('hidden');
        this.generateBtn.disabled = false;
    }

    showError(message) {
        this.error.textContent = message;
        this.error.classList.remove('hidden');
        this.generateBtn.disabled = false;
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new XReplyGenerator();
});