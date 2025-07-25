// To run this script, you need to install axios and https-proxy-agent:
// npm install axios https-proxy-agent

const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { Writable } = require('stream');

// --- User Provided Data ---
const SESSION_TOKEN = 'Xjj8_qHihBmNZMJuFNIjUc3A15QhPDGS4FT3Y5GF3r9x'; // Using the first part of the provided session
const PROXY_URL = null; // Set to null or your proxy URL to enable/disable

// --- Helper Functions ---

// Creates a base set of headers, mimicking the Go implementation
function getBaseHeaders() {
    return {
        'accept': '*/*',
        'accept-language': 'zh-CN,zh;q=0.9',
        'content-type': 'application/json',
        'origin': 'https://console.groq.com',
        'referer': 'https://console.groq.com/',
        'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
    };
}

// Generates the refresh token for Stytch authentication
function generateRefreshToken(apiKey) {
    const prefix = "public-token-live-26a89f59-09f8-48be-91ff-ce70e6000cb5:" + apiKey;
    return Buffer.from(prefix).toString('base64');
}

// --- API Call Functions ---

// 1. Get Session Token from Stytch
async function getSessionToken(apiKey, proxyUrl) {
    console.log('[1. getSessionToken] - Starting authentication with Stytch...');
    const url = 'https://api.stytch.com/sdk/v1/sessions/authenticate';
    const headers = {
        ...getBaseHeaders(),
        'authorization': `Basic ${generateRefreshToken(apiKey)}`,
        'x-sdk-client': 'eyJldmVudF9pZCI6ImV2ZW50LWlkLTRiOGY2ZjllLWZiMzktNGQwMi04ZTdkLTQ0ZmZkODQxMGQ4NiIsImFwcF9zZXNzaW9uX2lkIjoiYXBwLXNlc3Npb24taWQtZmQ3ZmMzMzgtOGEwOC00Mzc5LWI3ODMtNjFjYjczOTIyNDM3IiwicGVyc2lzdGVudF9pZCI6InBlcnNpc3RlbnQtaWQtYThjOTkxOTQtOTcwNi00Nzk2LTg0ZGUtZDM5MTIyMzFlNTA3IiwiY2xpZW50X3NlbnRfYXQiOiIyMDI1LTA3LTI1VDA3OjAwOjQzLjkyOFoiLCJ0aW1lem9uZSI6IkFzaWEvU2hhbmdoYWkiLCJzdHl0Y2hfdXNlcl9pZCI6InVzZXItbGl2ZS01NTc2MTIyYi00OTdhLTQ0ZmEtYTY1Zi01NTAzYmI3OTgzODUiLCJzdHl0Y2hfc2Vzc2lvbl9pZCI6InNlc3Npb24tbGl2ZS00ZmRiMWViYi1iNTg5LTRiMzctODkxMy0zM2E4ZTczNTAzMGMiLCJhcHAiOnsiaWRlbnRpZmllciI6ImNvbnNvbGUuZ3JvcS5jb20ifSwic2RrIjp7ImlkZW50aWZpZXIiOiJTdHl0Y2guanMgSmF2YXNjcmlwdCBTREsiLCJ2ZXJzaW9uIjoiNS4yNC42In19',
        'x-sdk-parent-host': 'https://console.groq.com',
        'sec-fetch-site': 'cross-site',
    };

    const config = {
        headers,
        // proxy: false is needed for HttpsProxyAgent to work with axios < v1.0
    };
    if (proxyUrl) {
        console.log('[1. getSessionToken] - Using proxy:', proxyUrl);
        config.httpsAgent = new HttpsProxyAgent(proxyUrl);
    }


    try {
        console.log(`[1. getSessionToken] - Making POST request to: ${url}`);
        console.log('[1. getSessionToken] - Headers:', JSON.stringify(headers, null, 2));
        const response = await axios.post(url, {}, config);
        console.log('[1. getSessionToken] - Stytch authentication successful. Status:', response.status);
        
        const sessionJwt = response.data.data.session_jwt;
        if (!sessionJwt) {
            throw new Error('session_jwt not found in Stytch response');
        }
        console.log('[1. getSessionToken] - Successfully retrieved session JWT.');
        return sessionJwt;
    } catch (error) {
        console.error('[1. getSessionToken] - Error authenticating with Stytch:');
        if (error.response) {
            console.error('  Status:', error.response.status);
            console.error('  Headers:', JSON.stringify(error.response.headers, null, 2));
            console.error('  Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('  Error message:', error.message);
        }
        throw error;
    }
}

// 2. Get Organization ID from Groq
async function getOrganizationId(sessionJwt, proxyUrl) {
    console.log('\n[2. getOrganizationId] - Starting organization ID retrieval...');
    const url = 'https://api.groq.com/platform/v1/user/profile';
    const headers = {
        ...getBaseHeaders(),
        'authorization': `Bearer ${sessionJwt}`,
    };

    const config = {
        headers,
    };
    if (proxyUrl) {
        console.log('[2. getOrganizationId] - Using proxy:', proxyUrl);
        config.httpsAgent = new HttpsProxyAgent(proxyUrl);
    }


    try {
        console.log(`[2. getOrganizationId] - Making GET request to: ${url}`);
        console.log('[2. getOrganizationId] - Headers:', JSON.stringify(headers, null, 2));
        const response = await axios.get(url, config);
        console.log('[2. getOrganizationId] - Organization ID retrieval successful. Status:', response.status);

        const orgId = response.data.user.orgs.data[0].id;
        if (!orgId) {
            throw new Error('Organization ID not found in Groq profile response');
        }
        console.log(`[2. getOrganizationId] - Successfully retrieved organization ID: ${orgId}`);
        return orgId;
    } catch (error) {
        console.error('[2. getOrganizationId] - Error retrieving organization ID:');
        if (error.response) {
            console.error('  Status:', error.response.status);
            console.error('  Headers:', JSON.stringify(error.response.headers, null, 2));
            console.error('  Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('  Error message:', error.message);
        }
        throw error;
    }
}

// 3. Perform Chat Completion
async function chatCompletions(sessionJwt, organizationId, proxyUrl) {
    console.log('\n[3. chatCompletions] - Starting chat completions request...');
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const headers = {
        ...getBaseHeaders(),
        'authorization': `Bearer ${sessionJwt}`,
        'groq-organization': organizationId,
    };
    
    const body = {
        model: 'llama3-8b-8192', // Or any other available model
        messages: [
            { role: 'user', content: '你好，请用中文介绍一下你自己。' }
        ],
        stream: true,
    };

    const config = {
        headers,
        responseType: 'stream',
    };
    if (proxyUrl) {
        console.log('[3. chatCompletions] - Using proxy:', proxyUrl);
        config.httpsAgent = new HttpsProxyAgent(proxyUrl);
    }


    try {
        console.log(`[3. chatCompletions] - Making POST request to: ${url}`);
        console.log('[3. chatCompletions] - Headers:', JSON.stringify(headers, null, 2));
        console.log('[3. chatCompletions] - Body:', JSON.stringify(body, null, 2));
        const response = await axios.post(url, body, config);
        console.log('[3. chatCompletions] - Chat completions request successful. Status:', response.status);
        console.log('[3. chatCompletions] - Response Headers:', JSON.stringify(response.headers, null, 2));

        console.log('\n--- Streaming Response ---');
        response.data.pipe(process.stdout);

        return new Promise((resolve, reject) => {
            response.data.on('end', resolve);
            response.data.on('error', reject);
        });

    } catch (error) {
        console.error('\n[3. chatCompletions] - Error during chat completions:');
        if (error.response) {
            // If the response is a stream, we need to handle it differently
            if (error.response.data.readable) {
                 console.error('  Status:', error.response.status);
                 console.error('  Headers:', JSON.stringify(error.response.headers, null, 2));
                 console.error('  Stream Error:');
                 error.response.data.pipe(new Writable({
                    write(chunk, encoding, callback) {
                        console.error(chunk.toString());
                        callback();
                    }
                 }));
            } else {
                console.error('  Status:', error.response.status);
                console.error('  Headers:', JSON.stringify(error.response.headers, null, 2));
                console.error('  Data:', JSON.stringify(error.response.data, null, 2));
            }
        } else {
            console.error('  Error message:', error.message);
        }
        throw error;
    }
}

// --- Main Execution ---
async function main() {
    try {
        console.log('--- Starting Groq API Test Script ---');
        console.log(`Using SESSION_TOKEN starting with: ${SESSION_TOKEN.substring(0, 5)}...`);
        if (PROXY_URL) {
            console.log(`Using PROXY_URL: ${PROXY_URL}`);
        } else {
            console.log('Proxy is DISABLED.');
        }
        
        // Step 1: Authenticate and get session JWT
        const sessionJwt = await getSessionToken(SESSION_TOKEN, PROXY_URL);
        
        // Step 2: Get Organization ID
        const organizationId = await getOrganizationId(sessionJwt, PROXY_URL);

        // Step 3: Call Chat Completions
        await chatCompletions(sessionJwt, organizationId, PROXY_URL);
        
        console.log('\n\n--- Script finished successfully! ---');
    } catch (error) {
        console.error('\n\n--- Script failed! ---');
        // The detailed error is logged in the respective function
    }
}

main(); 