// File: /api/proxy.js
// هذا هو الإصدار الجديد الذي يعمل كخادم ويب مستمر (متوافق مع Render)

import http from 'http';

// هذه هي نفس الدالة التي تعالج الطلب، لم تتغير
async function handleProxyRequest(incomingRequest) {
    const targetUrl = "https://api.chatanywhere.tech/v1/chat/completions";
    try {
        const proxyResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.GPT_PROXY_KEY}`
            },
            body: JSON.stringify(incomingRequest)
        });
        return {
            status: proxyResponse.status,
            data: await proxyResponse.json()
        };
    } catch (error) {
        return {
            status: 500,
            data: { error: 'Proxy failed', details: error.message }
        };
    }
}

// --- ▼▼▼▼▼ هذا هو الجزء الجديد الذي يحول الكود إلى خادم ▼▼▼▼▼ ---

// إنشاء خادم ويب
const server = http.createServer(async (req, res) => {
    // إذا كان الطلب موجهاً إلى المسار الصحيح وبطريقة POST
    if (req.url === '/' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const incomingBody = JSON.parse(body);
                const result = await handleProxyRequest(incomingBody);
                
                res.writeHead(result.status, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result.data));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Invalid JSON in request body" }));
            }
        });
    } else {
        // لأي طلب آخر، نرسل رسالة ترحيب بسيطة
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('GPT Proxy is running. Send POST requests to the root path.');
    }
});

// تحديد المنفذ الذي سيستمع عليه الخادم
// Render يوفر متغير البيئة PORT تلقائياً
const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
// --- ▲▲▲▲▲ نهاية الجزء الجديد ▲▲▲▲▲ ---
