/**
 * wall.js — Community Wall
 * Handles posts, reactions, comments, compose, categories
 */

import { $, $$, el, showToast, randId } from './utils.js';

/* ─────────────────────────────────────────────
   State
───────────────────────────────────────────── */
let currentCategory = 'all';
let currentSort     = 'recent';
let currentUser     = null; // Set by dashboard/auth
let posts           = [];

/* ─────────────────────────────────────────────
   Demo posts data
───────────────────────────────────────────── */
const DEMO_POSTS = [
  {
    id: 'p1',
    type: 'announcement',
    category: 'announcement',
    author: { name: 'Baitul Mukarram Mosque', role: 'Imam', avatar: '🕌', verified: true },
    mosque: 'Baitul Mukarram',
    district: 'Dhaka',
    time: new Date(Date.now() - 2 * 3600000),
    title: 'Jumu\'ah Khutbah Today',
    content: 'Today\'s Jumu\'ah khutbah will be on the topic of "Patience and Gratitude in Difficult Times". All brothers are requested to arrive 15 minutes early for Sunnah prayers. May Allah accept our worship. آمین',
    arabicQuote: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
    arabicQuoteRef: 'Al-Baqarah 2:153',
    reactions: { liked: 124, amen: 89, mashaAllah: 210 },
    userReaction: null,
    comments: [
      { id: 'c1', author: 'Brother Karim', role: 'Member', time: new Date(Date.now() - 1800000), text: 'JazakAllah Khair! Looking forward to it.', isUser: false },
      { id: 'c2', author: 'You', role: 'Volunteer', time: new Date(Date.now() - 900000), text: 'Alhamdulillah, will be there!', isUser: true },
    ],
    showComments: false,
    pinned: true,
  },
  {
    id: 'p2',
    type: 'event',
    category: 'event',
    author: { name: 'Sylhet Islamic Centre', role: 'Admin', avatar: '🌙', verified: true },
    mosque: 'Sylhet Islamic Centre',
    district: 'Sylhet',
    time: new Date(Date.now() - 5 * 3600000),
    title: 'Quran Hifz Program — Registration Open',
    content: 'We are accepting registrations for our new Quran Hifz batch starting next month. Open for ages 8–16. Classes will be held Mon–Fri, 4 PM–6 PM. Limited seats available — register now!',
    event: {
      date: new Date(Date.now() + 30 * 86400000),
      location: 'Sylhet Islamic Centre Hall, Zindabazar',
      seats: 25,
      seatsLeft: 8,
    },
    reactions: { liked: 67, amen: 34, mashaAllah: 91 },
    userReaction: null,
    comments: [],
    showComments: false,
    pinned: false,
  },
  {
    id: 'p3',
    type: 'post',
    category: 'community',
    author: { name: 'Sister Fatima', role: 'Volunteer', avatar: '👩', verified: false },
    mosque: 'Rajshahi Central Mosque',
    district: 'Rajshahi',
    time: new Date(Date.now() - 8 * 3600000),
    title: '',
    content: 'Alhamdulillah, our mosque completed the Ramadan food distribution drive! We served 500 families in Rajshahi district. Jazakallah Khair to all volunteers who gave their time. May Allah reward you all.',
    image: null,
    reactions: { liked: 203, amen: 156, mashaAllah: 342 },
    userReaction: 'mashaAllah',
    comments: [
      { id: 'c3', author: 'Imam Hassan', role: 'Imam', time: new Date(Date.now() - 7200000), text: 'MashaAllah! This is the spirit of our ummah.', isUser: false },
    ],
    showComments: false,
    pinned: false,
  },
  {
    id: 'p4',
    type: 'dua',
    category: 'dua',
    author: { name: 'Chittagong Grand Mosque', role: 'Imam', avatar: '☪️', verified: true },
    mosque: 'Chittagong Grand Mosque',
    district: 'Chittagong',
    time: new Date(Date.now() - 12 * 3600000),
    title: 'Daily Dua — For Protection',
    content: 'Morning dua for the protection of our families and nation. Please share with your loved ones.',
    arabicQuote: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    arabicQuoteRef: 'Abu Dawud — Morning Protection Dua',
    reactions: { liked: 445, amen: 389, mashaAllah: 512 },
    userReaction: 'amen',
    comments: [],
    showComments: false,
    pinned: false,
  },
  {
    id: 'p5',
    type: 'lost',
    category: 'lost-found',
    author: { name: 'Brother Arif', role: 'Member', avatar: '👤', verified: false },
    mosque: 'Baitul Mukarram',
    district: 'Dhaka',
    time: new Date(Date.now() - 24 * 3600000),
    title: 'Lost: Prayer Mat after Isha',
    content: 'I left my grey and green prayer mat at Baitul Mukarram Mosque after Isha prayer last night. It has a small golden embroidery at the top. If found, please contact the mosque office. JazakAllah.',
    reactions: { liked: 12, amen: 8, mashaAllah: 3 },
    userReaction: null,
    comments: [],
    showComments: false,
    pinned: false,
  },
];

/* ─────────────────────────────────────────────
   Init
───────────────────────────────────────────── */
function buildWallLayout() {
  const page = document.getElementById('page-wall');
  if (!page || page.querySelector('.wall-page')) return;
  page.innerHTML = `
<div class="wall-page">

  <div class="wall-header">
    <h1 class="wall-title">🌐 Community Wall</h1>
    <p class="wall-sub">Announcements, events and duas from mosques across Bangladesh</p>
  </div>

  <!-- Compose -->
  <div class="wall-compose-area" id="wall-compose-area">
    <input id="wall-compose-input" class="wall-compose-input" type="text" placeholder="Share with the community…" />
    <div class="wall-compose-expand" id="wall-compose-expand" style="display:none">
      <input  id="wc-title"   class="wc-input" type="text"     placeholder="Title (optional)" />
      <textarea id="wc-content" class="wc-textarea"             placeholder="Write your post…" rows="4"></textarea>
      <div class="wc-row">
        <select id="wc-category" class="wc-select">
          <option value="community">Community</option>
          <option value="announcement">Announcement</option>
          <option value="event">Event</option>
          <option value="dua">Du'a Request</option>
          <option value="education">Education</option>
        </select>
        <button id="wall-compose-submit" class="btn btn-primary btn-sm">Post</button>
      </div>
    </div>
  </div>

  <!-- Filters -->
  <div class="wall-toolbar">
    <div class="wall-cats" role="group">
      <button class="wall-cat-btn active" data-cat="all">All</button>
      <button class="wall-cat-btn" data-cat="announcement">📢 Announcements</button>
      <button class="wall-cat-btn" data-cat="event">📅 Events</button>
      <button class="wall-cat-btn" data-cat="dua">🤲 Du'a</button>
      <button class="wall-cat-btn" data-cat="education">📚 Education</button>
      <button class="wall-cat-btn" data-cat="community">🤝 Community</button>
    </div>
    <div class="wall-sort">
      <button class="wall-sort-btn active" data-sort="recent">Recent</button>
      <button class="wall-sort-btn" data-sort="popular">Popular</button>
    </div>
    <div class="wall-count">
      <span id="wall-post-count">0</span> posts
    </div>
  </div>

  <!-- Feed -->
  <ul class="wall-feed" id="wall-feed"></ul>

</div>`;
}

export function initWall() {
  buildWallLayout();
  posts = [...DEMO_POSTS]; // In prod: fetch from Supabase
  renderWall();
  bindWallControls();
}

/* ─────────────────────────────────────────────
   Render full wall
───────────────────────────────────────────── */
function renderWall() {
  const feed = $('#wall-feed');
  if (!feed) return;

  let filtered = posts.filter(p =>
    currentCategory === 'all' || p.category === currentCategory
  );

  if (currentSort === 'popular') {
    filtered.sort((a, b) =>
      (b.reactions.liked + b.reactions.amen + b.reactions.mashaAllah) -
      (a.reactions.liked + a.reactions.amen + a.reactions.mashaAllah)
    );
  } else {
    // recent + pinned first
    filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.time - a.time;
    });
  }

  feed.innerHTML = filtered.map(renderPost).join('');
  updatePostCount(filtered.length);
}

/* ─────────────────────────────────────────────
   Render single post card
───────────────────────────────────────────── */
function renderPost(post) {
  const timeAgo = formatTimeAgo(post.time);
  const r = post.reactions;

  const categoryLabel = {
    announcement: 'Announcement', event: 'Event', community: 'Community',
    dua: 'Dua', 'lost-found': 'Lost & Found', volunteer: 'Volunteer',
  }[post.category] || post.category;

  const categoryColor = {
    announcement: 'var(--c-forest-600)',
    event:        'var(--c-gold-600)',
    community:    'var(--c-blue-600)',
    dua:          'var(--c-purple-600)',
    'lost-found': 'var(--c-red-600)',
    volunteer:    'var(--c-green-600)',
  }[post.category] || 'var(--c-forest-600)';

  return `
    <article class="wall-post" data-post-id="${post.id}">
      <!-- Header -->
      <div class="wp-header">
        <div class="wp-avatar">${post.author.avatar}</div>
        <div class="wp-meta">
          <div class="wp-author">
            ${post.author.name}
            ${post.author.verified ? '<span class="wp-verified">✓</span>' : ''}
          </div>
          <div class="wp-submeta">
            <span class="wp-role">${post.author.role}</span>
            <span class="wp-sep">·</span>
            <span class="wp-time">${timeAgo}</span>
            <span class="wp-sep">·</span>
            <span class="wp-mosque">🕌 ${post.mosque}</span>
          </div>
        </div>
        <div class="wp-badges">
          ${post.pinned ? '<span class="wp-pin">📌 Pinned</span>' : ''}
          <span class="wp-category" style="background:${categoryColor}20; color:${categoryColor}">
            ${categoryLabel}
          </span>
        </div>
      </div>

      <!-- Body -->
      <div class="wp-body">
        ${post.title ? `<h3 class="wp-title">${post.title}</h3>` : ''}
        <p class="wp-content">${post.content}</p>

        <!-- Arabic Quote -->
        ${post.arabicQuote ? `
          <div class="wp-arabic-block">
            <p class="wp-arabic-text" dir="rtl">${post.arabicQuote}</p>
            ${post.arabicQuoteRef ? `<p class="wp-arabic-ref">${post.arabicQuoteRef}</p>` : ''}
          </div>` : ''}

        <!-- Event card -->
        ${post.event ? renderEventCard(post.event) : ''}

        <!-- Image -->
        ${post.image ? `<img src="${post.image}" alt="" class="wp-image" loading="lazy">` : ''}
      </div>

      <!-- Reactions -->
      <div class="wp-reactions">
        <button class="wp-react-btn ${post.userReaction === 'liked' ? 'liked' : ''}"
          onclick="window._wallReact('${post.id}','liked')">
          ❤️ ${r.liked}
        </button>
        <button class="wp-react-btn ${post.userReaction === 'amen' ? 'amen' : ''}"
          onclick="window._wallReact('${post.id}','amen')">
          🤲 Ameen ${r.amen}
        </button>
        <button class="wp-react-btn ${post.userReaction === 'mashaAllah' ? 'mashaall' : ''}"
          onclick="window._wallReact('${post.id}','mashaAllah')">
          ✨ MashaAllah ${r.mashaAllah}
        </button>
        <button class="wp-react-btn wp-comment-toggle"
          onclick="window._wallToggleComments('${post.id}')">
          💬 ${post.comments.length}
        </button>
        <button class="wp-react-btn wp-share"
          onclick="window._wallShare('${post.id}')">
          🔗 Share
        </button>
      </div>

      <!-- Comments -->
      <div class="wp-comments ${post.showComments ? 'show' : ''}" id="comments-${post.id}">
        ${post.comments.map(renderComment).join('')}
        <div class="wp-comment-compose">
          <input class="wp-comment-input"
            placeholder="Add a comment…"
            onkeydown="if(event.key==='Enter')window._wallAddComment('${post.id}',this)"
          />
          <button class="wp-comment-send"
            onclick="window._wallAddComment('${post.id}',this.previousElementSibling)">
            Send
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderComment(comment) {
  return `
    <div class="wp-comment ${comment.isUser ? 'user-comment' : ''}">
      <div class="wpc-body">
        <span class="wpc-author">${comment.author}</span>
        <span class="wpc-role">${comment.role}</span>
        <p class="wpc-text">${comment.text}</p>
        <span class="wpc-time">${formatTimeAgo(comment.time)}</span>
      </div>
    </div>
  `;
}

function renderEventCard(event) {
  const d   = event.date;
  const pct = Math.round(((event.seats - event.seatsLeft) / event.seats) * 100);
  return `
    <div class="wp-event-card">
      <div class="wp-event-date">
        <span class="wed-day">${d.getDate()}</span>
        <span class="wed-mon">${d.toLocaleString('en', { month: 'short' })}</span>
      </div>
      <div class="wp-event-info">
        <p class="wei-location">📍 ${event.location}</p>
        <div class="wei-seats">
          <div class="wei-bar" style="--pct:${pct}%"></div>
          <span>${event.seatsLeft} seats left</span>
        </div>
      </div>
      <button class="btn btn-primary btn-sm">Register</button>
    </div>
  `;
}

/* ─────────────────────────────────────────────
   Controls — categories, sort
───────────────────────────────────────────── */
function bindWallControls() {
  // Category buttons
  $$('.wall-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.wall-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.cat || 'all';
      renderWall();
    });
  });

  // Sort buttons
  $$('.wall-sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.wall-sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.dataset.sort || 'recent';
      renderWall();
    });
  });

  // Compose box
  const composeInput = $('#wall-compose-input');
  if (composeInput) {
    composeInput.addEventListener('click', () => openCompose());
  }

  // Compose modal submit
  const composeBtn = $('#wall-compose-submit');
  if (composeBtn) {
    composeBtn.addEventListener('click', submitPost);
  }
}

function updatePostCount(n) {
  const el_ = $('#wall-post-count');
  if (el_) el_.textContent = `${n} post${n !== 1 ? 's' : ''}`;
}

/* ─────────────────────────────────────────────
   Reactions (global)
───────────────────────────────────────────── */
window._wallReact = function(postId, type) {
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  if (post.userReaction === type) {
    // Un-react
    post.reactions[type]--;
    post.userReaction = null;
  } else {
    // Switch reaction
    if (post.userReaction) post.reactions[post.userReaction]--;
    post.reactions[type]++;
    post.userReaction = type;
  }
  renderWall();
};

window._wallToggleComments = function(postId) {
  const post = posts.find(p => p.id === postId);
  if (!post) return;
  post.showComments = !post.showComments;
  const section = $(`#comments-${postId}`);
  if (section) section.classList.toggle('show', post.showComments);
};

window._wallAddComment = function(postId, input) {
  const text = input?.value?.trim();
  if (!text) return;
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  post.comments.push({
    id:     randId(),
    author: 'You',
    role:   'Member',
    time:   new Date(),
    text,
    isUser: true,
  });
  input.value = '';
  renderWall();
  // Re-open comments
  const section = $(`#comments-${postId}`);
  if (section) section.classList.add('show');
  showToast('Comment posted');
};

window._wallShare = function(postId) {
  const post = posts.find(p => p.id === postId);
  if (!post) return;
  const text = `${post.author.name}: ${post.content.slice(0, 100)}… | MasjidBD`;
  if (navigator.share) {
    navigator.share({ title: 'MasjidBD Wall Post', text, url: window.location.href });
  } else {
    navigator.clipboard.writeText(text).then(() => showToast('Copied!'));
  }
};

/* ─────────────────────────────────────────────
   Compose
───────────────────────────────────────────── */
function openCompose() {
  // Simple inline compose expansion
  const area = $('#wall-compose-area');
  if (area) area.classList.add('expanded');
}

function submitPost() {
  const title   = $('#wc-title')?.value?.trim();
  const content = $('#wc-content')?.value?.trim();
  const cat     = $('#wc-category')?.value || 'community';

  if (!content) {
    showToast('Please write something!', 'error');
    return;
  }

  const newPost = {
    id:       randId(),
    type:     'post',
    category: cat,
    author:   { name: 'You', role: 'Member', avatar: '👤', verified: false },
    mosque:   'My Mosque',
    district: 'Dhaka',
    time:     new Date(),
    title:    title || '',
    content:  content,
    reactions:    { liked: 0, amen: 0, mashaAllah: 0 },
    userReaction: null,
    comments: [],
    showComments: false,
    pinned: false,
  };

  posts.unshift(newPost);
  renderWall();
  showToast('Post published!');

  // Reset compose
  if ($('#wc-title'))   $('#wc-title').value   = '';
  if ($('#wc-content')) $('#wc-content').value = '';
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function formatTimeAgo(date) {
  const diffMs  = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}
