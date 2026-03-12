// هذا هو كود الجسر الذي سيعمل على Vercel
// File: /api/proxy.js

export default async function handler(request, response) {
    // التأكد من أن الطلب هو POST
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    // قراءة الطلب القادم من بوت Cloudflare
    const incomingBody = request.body;

    // عنوان خدمة ChatAnywhere
    const targetUrl = "https://api.chatanywhere.tech/v1/chat/completions";

    try {
        // تمرير الطلب كما هو إلى ChatAnywhere
        const proxyResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // استخدام مفتاح الـ API المخزن في Vercel
                'Authorization': `Bearer ${process.env.GPT_PROXY_KEY}`
            },
            body: JSON.stringify(incomingBody)
        });

        // قراءة الرد من ChatAnywhere
        const data = await proxyResponse.json();

        // إعادة إرسال الرد إلى بوت Cloudflare
        response.status(proxyResponse.status).json(data);

    } catch (error) {
        response.status(500).json({ error: 'Proxy failed', details: error.message });
    }
}
