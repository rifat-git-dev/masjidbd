/**
 * chat.js — MasjidBD AI Assistant (Gemini via Cloudflare Worker proxy)
 *
 * Architecture:
 *   Browser → Cloudflare Worker (CHAT_WORKER_URL) → Google Gemini API
 *   The API key never reaches the browser; it lives in the Worker env var.
 *
 * To deploy the Worker:
 *   1. Create a Worker at Cloudflare Dashboard
 *   2. Paste the Worker code from /workers/chat-proxy.js
 *   3. Add secret: GEMINI_API_KEY = <your key>
 *   4. Set CHAT_WORKER_URL in your Cloudflare Pages env vars
 */

import { $, $$, el, showToast } from './utils.js';
import { ENV } from './config.js';

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const WORKER_URL     = ENV.CHAT_WORKER_URL || '';
const MAX_HISTORY    = 20; // messages to keep in context
const TYPING_DELAY_MS = 800;

const QUICK_REPLIES = [
  'Prayer times today',
  'Nearest mosque',
  'How to calculate Zakat?',
  'Qibla direction',
  'Isha time in Dhaka',
];

const SYSTEM_PROMPT = `You are MasjidBot, the AI assistant for MasjidBD — Bangladesh's national mosque management platform.
You help Muslims in Bangladesh with:
- Islamic knowledge (fiqh, Quran, Hadith — Sunni/Hanafi school)
- Prayer times and calculation (IFB method for Bangladesh)
- Mosque information across all 64 districts
- Zakat calculation guidance
- Islamic calendar and events
- Community announcements

Always respond respectfully. Begin responses with "Assalamu Alaikum" for greetings.
Keep answers concise and practical. If unsure, recommend consulting a local scholar.
Respond in the same language the user writes in (English or Bengali).
Do not answer questions unrelated to Islam, mosques, or the MasjidBD platform.`;

/* ─────────────────────────────────────────────
   State
───────────────────────────────────────────── */
let chatHistory = []; // {role: 'user'|'model', parts: [{text}]}
let isTyping    = false;
let chatOpen    = false;

/* ─────────────────────────────────────────────
   Init
───────────────────────────────────────────── */
export function initChat() {
  bindChatFAB();
  renderQuickReplies();
  // Show welcome message
  setTimeout(() => {
    appendBotMessage('Assalamu Alaikum! 🌙 I\'m MasjidBot. How can I help you today?\n\nYou can ask me about prayer times, mosques, Islamic knowledge, or anything about MasjidBD.');
  }, 500);
}

/* ─────────────────────────────────────────────
   FAB + window toggle
───────────────────────────────────────────── */
function bindChatFAB() {
  const fab    = $('#chat-fab');
  const window_ = $('#chat-window');
  const closeBtn = $('#chat-close');
  const sendBtn  = $('#chat-send-btn');
  const input    = $('#chat-input');

  if (fab) {
    fab.addEventListener('click', () => {
      chatOpen = !chatOpen;
      if (window_) window_.classList.toggle('open', chatOpen);
      if (chatOpen) {
        setTimeout(() => input?.focus(), 100);
        // Scroll to bottom
        scrollChatBottom();
      }
      // Update FAB icon
      fab.innerHTML = chatOpen
        ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>'
        : '🤖';
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      chatOpen = false;
      if (window_) window_.classList.remove('open');
      if (fab) fab.innerHTML = '🤖';
    });
  }

  if (sendBtn) sendBtn.addEventListener('click', handleSend);

  if (input) {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
    // Auto-resize textarea
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });
  }
}

/* ─────────────────────────────────────────────
   Quick replies
───────────────────────────────────────────── */
function renderQuickReplies() {
  const container = $('#chat-quick-replies');
  if (!container) return;

  container.innerHTML = QUICK_REPLIES.map(q => `
    <button class="chat-qr-chip" onclick="window._chatQuickReply('${q}')">
      ${q}
    </button>
  `).join('');
}

window._chatQuickReply = function(text) {
  const input = $('#chat-input');
  if (input) { input.value = text; }
  handleSend();
};

/* ─────────────────────────────────────────────
   Handle send
───────────────────────────────────────────── */
async function handleSend() {
  const input = $('#chat-input');
  const text  = input?.value?.trim();
  if (!text || isTyping) return;

  input.value = '';
  input.style.height = 'auto';

  // Append user message
  appendUserMessage(text);

  // Hide quick replies after first message
  const qr = $('#chat-quick-replies');
  if (qr) qr.style.display = 'none';

  // Show typing indicator
  showTyping();

  // Send to Gemini (via Worker or direct fallback)
  try {
    const reply = await sendToGemini(text);
    hideTyping();
    appendBotMessage(reply);
  } catch (err) {
    hideTyping();
    appendBotMessage('Sorry, I\'m having trouble connecting right now. Please try again. 🙏');
    console.error('Chat error:', err);
  }
}

/* ─────────────────────────────────────────────
   Gemini API call (via Cloudflare Worker)
───────────────────────────────────────────── */
async function sendToGemini(userText) {
  // Add to history
  chatHistory.push({ role: 'user', parts: [{ text: userText }] });

  // Trim history
  if (chatHistory.length > MAX_HISTORY) {
    chatHistory = chatHistory.slice(-MAX_HISTORY);
  }

  if (!WORKER_URL) {
    // Demo fallback (no Worker configured)
    return getDemoReply(userText);
  }

  const payload = {
    contents: chatHistory,
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    generationConfig: {
      temperature:     0.7,
      maxOutputTokens: 512,
      topP:            0.95,
    },
  };

  const res = await fetch(WORKER_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Worker returned ${res.status}`);
  }

  const data = await res.json();

  // Gemini response structure:
  // { candidates: [{ content: { parts: [{ text }] } }] }
  const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  if (replyText) {
    chatHistory.push({ role: 'model', parts: [{ text: replyText }] });
  }

  return replyText || 'JazakAllah Khair for your question. Please try again.';
}

/* ─────────────────────────────────────────────
   Demo reply fallback (when Worker not configured)
───────────────────────────────────────────── */
function getDemoReply(text) {
  const lower = text.toLowerCase();

  if (lower.includes('prayer') || lower.includes('salat') || lower.includes('namaz') || lower.includes('salah')) {
    return 'The five daily prayers in Islam are: Fajr, Dhuhr, Asr, Maghrib, and Isha. In Dhaka, today\'s Fajr is approximately at 4:45 AM and Isha at 9:15 PM (calculated using the IFB method). Check the Prayer Times tab for your exact district! 🕌';
  }
  if (lower.includes('zakat')) {
    return 'Zakat is one of the Five Pillars of Islam. It is obligatory on Muslims who possess wealth above the nisab (threshold — currently ~87.48g gold or ~612.36g silver) for a lunar year. The rate is 2.5% of eligible wealth. You can use our Zakat calculator in the dashboard. 📊';
  }
  if (lower.includes('qibla') || lower.includes('kaaba') || lower.includes('mecca')) {
    return 'The Qibla direction from Dhaka is approximately 278° (slightly north of west). Go to the Prayer Times tab and use the Qibla Compass for your exact location. 🧭';
  }
  if (lower.includes('mosque') || lower.includes('masjid')) {
    return 'MasjidBD has information on thousands of mosques across all 64 districts of Bangladesh! Go to the Map tab to find the nearest mosque to you. 🗺️';
  }
  if (lower.includes('ramadan') || lower.includes('ramzan')) {
    return 'Ramadan is the blessed 9th month of the Islamic (Hijri) calendar. In Bangladesh, the IFB (Islamic Foundation Bangladesh) announces the start of Ramadan based on moon sighting. MasjidBD will display Ramadan timings automatically! 🌙';
  }
  if (lower.includes('salam') || lower.includes('hello') || lower.includes('hi')) {
    return 'Wa Alaikum Assalam wa Rahmatullahi wa Barakatuh! 🌟 Welcome to MasjidBD. How can I assist you today? You can ask me about prayer times, mosques, Islamic knowledge, or the MasjidBD platform.';
  }
  if (lower.includes('isha') || lower.includes('fajr') || lower.includes('dhuhr') || lower.includes('asr') || lower.includes('maghrib')) {
    return 'For accurate prayer times in your district, please check the Prayer Times tab. MasjidBD uses the IFB astronomical formula (Fajr 15°, Isha 15°, Shafi Asr) for all 64 districts of Bangladesh. 🕌';
  }

  return 'JazakAllah Khair for your question! 🤲 I\'m MasjidBot, your Islamic and mosque information assistant. You can ask me about prayer times, mosques, Zakat, Qibla, Islamic calendar, and more.\n\n*(This is a demo response. Connect the Gemini API via Cloudflare Worker for full AI functionality.)*';
}

/* ─────────────────────────────────────────────
   DOM helpers — message rendering
───────────────────────────────────────────── */
function appendUserMessage(text) {
  const msgs = $('#chat-messages');
  if (!msgs) return;

  const div = document.createElement('div');
  div.className = 'chat-msg user';
  div.innerHTML = `
    <div class="chat-bubble">${escapeHtml(text)}</div>
  `;
  msgs.appendChild(div);
  scrollChatBottom();
}

function appendBotMessage(text) {
  const msgs = $('#chat-messages');
  if (!msgs) return;

  const div = document.createElement('div');
  div.className = 'chat-msg bot';
  div.innerHTML = `
    <div class="chat-avatar">🤖</div>
    <div class="chat-bubble">${markdownToHtml(text)}</div>
  `;
  msgs.appendChild(div);
  scrollChatBottom();
}

function showTyping() {
  isTyping = true;
  const msgs = $('#chat-messages');
  if (!msgs) return;

  const div = document.createElement('div');
  div.className = 'chat-msg bot';
  div.id = 'chat-typing';
  div.innerHTML = `
    <div class="chat-avatar">🤖</div>
    <div class="chat-typing">
      <span></span><span></span><span></span>
    </div>
  `;
  msgs.appendChild(div);
  scrollChatBottom();
}

function hideTyping() {
  isTyping = false;
  const typing = $('#chat-typing');
  if (typing) typing.remove();
}

function scrollChatBottom() {
  const msgs = $('#chat-messages');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
}

/* ─────────────────────────────────────────────
   Text helpers
───────────────────────────────────────────── */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

function markdownToHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Newlines
    .replace(/\n/g, '<br>');
}

export { chatHistory };
