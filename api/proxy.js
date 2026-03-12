// File: /api/proxy.js
// الإصدار النهائي مع معالجة أفضل لمتغيرات البيئة

import http from 'http';

// --- ▼▼▼▼▼ هذا هو التعديل الوحيد ▼▼▼▼▼ ---
// نقرأ المفتاح من متغيرات البيئة ونخزنه في متغير
const API_KEY = process.env.GPT_PROXY_KEY;
// --- ▲▲▲▲▲ نهاية التعديل ▲▲▲▲▲ ---

async function handleProxyRequest(incomingRequest) {
    const targetUrl = "https://api.chatanywhere.tech/v1/chat/completions";
    try {
        // التأكد من وجود المفتاح قبل إرسال الطلب
        if (!API_KEY) {
            console.error("CRITICAL: GPT_PROXY_KEY is not defined in the environment!");
            return {
                status: 500,
                data: { error: 'Server Configuration Error: API Key is missing.' }
            };
        }

        const proxyResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}` // نستخدم المتغير الذي قرأناه في الأعلى
            },
            body: JSON.stringify(incomingRequest)
        });
        
        const responseData = await proxyResponse.json();

        // إضافة رسالة تشخيصية في السجلات
        if (!proxyResponse.ok) {
            console.error("Error from target API:", JSON.stringify(responseData));
        }

        return {
            status: proxyResponse.status,
            data: responseData
        };
    } catch (error) {
        console.error("Proxy fetch error:", error.message);
        return {
            status: 500,
            data: { error: 'Proxy failed', details: error.message }
        };
    }
}

// خادم الويب (يبقى كما هو)
const server = http.createServer(async (req, res) => {
    if (req.url === '/' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
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
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(`GPT Proxy is running. API Key Loaded: ${API_KEY ? 'Yes' : 'No'}`);
    }
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}. API Key Loaded: ${API_KEY ? 'Yes' : 'No'}`);
});
