// File: /api/proxy.js
// --- الإصدار النهائي الذي يدعم النصوص والصور بشكل صحيح ---

import http from 'http';

const API_KEY = process.env.GPT_PROXY_KEY;

async function handleProxyRequest(incomingRequest) {
    let targetUrl;
    let requestBody = { ...incomingRequest };

    // --- ▼▼▼▼▼ هذا هو التصحيح النهائي للشرط ▼▼▼▼▼ ---
    // 1. نتحقق مما إذا كان اسم النموذج يشير إلى أنه نموذج صور
    const isImageModel = incomingRequest.model && (
        incomingRequest.model.startsWith('dall-e') || 
        incomingRequest.model.includes('image')
    );

    if (isImageModel) {
        // هذا طلب توليد صورة
        targetUrl = "https://api.chatanywhere.tech/v1/images/generations";
        console.log(`Routing image model '${incomingRequest.model}' to Image Generation API...`);
    } else {
        // هذا طلب محادثة نصية (الوضع الافتراضي)
        targetUrl = "https://api.chatanywhere.tech/v1/chat/completions";
        console.log(`Routing chat model '${incomingRequest.model}' to Chat Completions API...`);
    }
    // --- ▲▲▲▲▲ نهاية التصحيح النهائي للشرط ▲▲▲▲▲ ---

    try {
        if (!API_KEY) {
            throw new Error("CRITICAL: GPT_PROXY_KEY is not defined in the environment!");
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
            console.error(`Error from target API (${targetUrl}):`, JSON.stringify(responseData));
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
