// File: /api/proxy.js
// --- الإصدار المطور الذي يدعم النصوص والصور ---

import http from 'http';

const API_KEY = process.env.GPT_PROXY_KEY;

// --- ▼▼▼▼▼ هذا هو التعديل الجوهري ▼▼▼▼▼ ---
async function handleProxyRequest(incomingRequest) {
    let targetUrl;
    let requestBody = { ...incomingRequest }; // نسخة من الطلب

    // 1. نحدد نوع الطلب (نص أم صورة)
    if (incomingRequest.model && incomingRequest.model.startsWith('dall-e')) {
        // هذا طلب توليد صورة
        targetUrl = "https://api.chatanywhere.tech/v1/images/generations";
        console.log("Routing to Image Generation API...");
    } else {
        // هذا طلب محادثة نصية (الوضع الافتراضي)
        targetUrl = "https://api.chatanywhere.tech/v1/chat/completions";
        console.log("Routing to Chat Completions API...");
    }
    // --- ▲▲▲▲▲ نهاية التعديل الجوهري ▲▲▲▲▲ ---

    try {
        if (!API_KEY) {
            console.error("CRITICAL: GPT_PROXY_KEY is not defined in the environment!");
            return { status: 500, data: { error: 'Server Configuration Error: API Key is missing.' } };
        }

        const proxyResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(requestBody)
        });
        
        const responseData = await proxyResponse.json();

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
        res.end(`Smart Proxy is running. Supports Text & Images. API Key Loaded: ${API_KEY ? 'Yes' : 'No'}`);
    }
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}. API Key Loaded: ${API_KEY ? 'Yes' : 'No'}`);
});
