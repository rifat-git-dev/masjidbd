/**
 * workers/chat-proxy.js — MasjidBD Gemini Chat Proxy
 *
 * Cloudflare Worker that sits between the browser and Google Gemini API.
 * The GEMINI_API_KEY secret is set in Cloudflare Workers → Settings → Variables.
 * It NEVER reaches the browser.
 *
 * Deploy:
 *   1. Copy this file to your Cloudflare Workers dashboard (or wrangler.toml)
 *   2. Add secret: wrangler secret put GEMINI_API_KEY
 *   3. The Worker handles requests at /api/chat
 *
 * Browser sends:
 *   POST /api/chat
 *   { "contents": [ { "role": "user", "parts": [{"text": "..."}] }, ... ] }
 *
 * Worker responds:
 *   { "text": "..." }  — or error JSON with status 500
 */

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

// System context injected before every conversation
const SYSTEM_INSTRUCTION = `You are MasjidBot, the official AI assistant for MasjidBD — Bangladesh's national mosque management platform. You help users find mosques, check prayer times, learn about Islamic practices, donate to mosques, and navigate the platform. You speak respectfully and warmly. Keep answers concise and helpful. If a question is unrelated to mosques, Islam, or Bangladesh, politely redirect back to mosque topics. Always respond in the same language the user uses (Bengali or English). Start greetings with "Assalamu Alaikum".`;

export default {
  async fetch(request, env) {

    // ── CORS pre-flight ─────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return corsResponse(null, 204);
    }

    // ── Only accept POST /api/chat ──────────────────────────
    const url = new URL(request.url);
    if (request.method !== 'POST' || !url.pathname.endsWith('/chat')) {
      return corsResponse(JSON.stringify({ error: 'Not found' }), 404);
    }

    // ── Parse browser request ───────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return corsResponse(JSON.stringify({ error: 'Invalid JSON body' }), 400);
    }

    const userContents = body?.contents;
    if (!Array.isArray(userContents) || userContents.length === 0) {
      return corsResponse(JSON.stringify({ error: 'Missing contents array' }), 400);
    }

    // ── Validate API key is configured ─────────────────────
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('[chat-proxy] GEMINI_API_KEY secret is not set');
      return corsResponse(JSON.stringify({ error: 'Chat service not configured' }), 503);
    }

    // ── Build Gemini request ────────────────────────────────
    const geminiPayload = {
      system_instruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }]
      },
      contents: userContents,
      generationConfig: {
        temperature:     0.7,
        topP:            0.9,
        maxOutputTokens: 512,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    };

    // ── Call Gemini ─────────────────────────────────────────
    let geminiRes;
    try {
      geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(geminiPayload),
      });
    } catch (networkErr) {
      console.error('[chat-proxy] Network error reaching Gemini:', networkErr);
      return corsResponse(JSON.stringify({ error: 'Could not reach Gemini API' }), 502);
    }

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error(`[chat-proxy] Gemini error ${geminiRes.status}:`, errText);
      return corsResponse(
        JSON.stringify({ error: `Gemini API error: ${geminiRes.status}` }),
        502
      );
    }

    // ── Parse Gemini response ───────────────────────────────
    let geminiData;
    try {
      geminiData = await geminiRes.json();
    } catch {
      return corsResponse(JSON.stringify({ error: 'Malformed Gemini response' }), 502);
    }

    const text =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ??
      'Sorry, I could not generate a response right now.';

    // ── Return to browser ───────────────────────────────────
    return corsResponse(JSON.stringify({ text }), 200);
  },
};

/* ─────────────────────────────────────────────
   Helper: JSON response with CORS headers
───────────────────────────────────────────── */
function corsResponse(body, status) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type':                'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
