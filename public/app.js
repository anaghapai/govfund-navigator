// ════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════
let currentLang = 'en';
let currentBiz = {};
let currentResults = null;
let currentEmailScheme = null;
window._schemes = [];

// Weekly upload cap
const WEEKLY_LIMIT = 7;
const WEEK_KEY = 'gfn_week_' + getWeekId();

function getWeekId() {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  return d.getFullYear() + '_' + Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
}
function getWeekUploads() { return parseInt(localStorage.getItem(WEEK_KEY) || '0'); }
function incWeekUploads() { localStorage.setItem(WEEK_KEY, getWeekUploads() + 1); }

// ════════════════════════════════════════════
// SAMPLE STORIES DATA (pre-loaded)
// ════════════════════════════════════════════
const SAMPLE_STORIES = [
  {
    name: "Meena Devi",
    location: "Barmer, Rajasthan",
    bizType: "Handicrafts",
    scheme: "PMEGP",
    amount: "₹4,80,000",
    text: "I had no idea this scheme existed. After using GovFund Navigator I got the checklist, submitted my application and got ₹4.8L within 3 months. My embroidery business now employs 6 women.",
    photo: "hero2.jpg",
    week: true
  },
  {
    name: "Ranjit Singh",
    location: "Ludhiana, Punjab",
    bizType: "Dairy",
    scheme: "NABARD Dairy Loan",
    amount: "₹2,20,000",
    text: "Bought 4 more cows and a milk cooler with the NABARD subsidy. My income doubled in 8 months. The document checklist saved me 3 trips to the bank.",
    photo: "hero3.jpg",
    week: true
  },
  {
    name: "Lakshmi SHG",
    location: "Tumkur, Karnataka",
    bizType: "Self Help Group",
    scheme: "Udyogini Scheme",
    amount: "₹1,00,000",
    text: "Our group of 12 women got the Karnataka Udyogini grant. We now run a pickle and papad unit selling to 3 districts. Total turnover ₹18L this year.",
    photo: "hero1.jpg",
    week: true
  },
  {
    name: "Arjun Textiles",
    location: "Surat, Gujarat",
    bizType: "Manufacturing",
    scheme: "TUFS Subsidy",
    amount: "₹8,50,000",
    text: "The TUFS subsidy helped us upgrade 4 looms. Production doubled and we got an export order from a Dubai buyer last quarter.",
    photo: "story4.jpg",
    week: false
  },
  {
    name: "Priya Goswami",
    location: "Guwahati, Assam",
    bizType: "Food Processing",
    scheme: "PM FME Scheme",
    amount: "₹3,60,000",
    text: "I was selling bamboo shoot pickle from home. With the PM FME subsidy I set up a proper unit with FSSAI license. Now supplying to 2 supermarket chains.",
    photo: "story5.jpg",
    week: false
  }
];

// ════════════════════════════════════════════
// LANGUAGE
// ════════════════════════════════════════════
const T = {
  en: {
    heroTitle: 'Find funding<br/><em>you actually qualify for</em>',
    heroSub: 'Thousands of crores go unclaimed every year. Your business may qualify for free grants, subsidies, and low-interest loans — find out in 30 seconds.',
    formTitle: 'Tell us about your business',
    lblName: 'Business Name', lblType: 'Business Type', lblState: 'State',
    lblRevenue: 'Annual Revenue', lblAge: 'Years in Operation', lblSector: 'Sector',
    lblDesc: 'Describe your business', btnText: '🚀 Analyze My Eligibility',
    navFind: 'Find Schemes', navStories: 'Stories', navHistory: 'History'
  },
  hi: {
    heroTitle: 'वो फंडिंग पाएं<br/><em>जिसके लिए आप वास्तव में पात्र हैं</em>',
    heroSub: 'हर साल हजारों करोड़ का फंड अनक्लेम्ड रहता है। आपका व्यवसाय अनुदान और सब्सिडी के लिए पात्र हो सकता है।',
    formTitle: 'अपने व्यवसाय के बारे में बताएं',
    lblName: 'व्यवसाय का नाम', lblType: 'व्यवसाय प्रकार', lblState: 'राज्य',
    lblRevenue: 'वार्षिक राजस्व', lblAge: 'संचालन के वर्ष', lblSector: 'क्षेत्र',
    lblDesc: 'व्यवसाय विवरण', btnText: '🚀 पात्रता जाँचें',
    navFind: 'योजनाएं खोजें', navStories: 'कहानियां', navHistory: 'इतिहास'
  },
  kn: {
    heroTitle: 'ನಿಮಗೆ ಅರ್ಹವಾದ<br/><em>ಧನಸಹಾಯ ಹುಡುಕಿ</em>',
    heroSub: 'ಪ್ರತಿ ವರ್ಷ ಸಾವಿರಾರು ಕೋಟಿ ರೂಪಾಯಿ ಕ್ಲೈಮ್ ಆಗದೇ ಉಳಿಯುತ್ತದೆ. ನಿಮ್ಮ ವ್ಯವಹಾರ ಅನುದಾನ ಮತ್ತು ಸಬ್ಸಿಡಿಗೆ ಅರ್ಹವಾಗಿರಬಹುದು.',
    formTitle: 'ನಿಮ್ಮ ವ್ಯವಹಾರದ ಬಗ್ಗೆ ಹೇಳಿ',
    lblName: 'ವ್ಯವಹಾರದ ಹೆಸರು', lblType: 'ವ್ಯವಹಾರ ಪ್ರಕಾರ', lblState: 'ರಾಜ್ಯ',
    lblRevenue: 'ವಾರ್ಷಿಕ ಆದಾಯ', lblAge: 'ಕಾರ್ಯಾಚರಣೆ ವರ್ಷಗಳು', lblSector: 'ಕ್ಷೇತ್ರ',
    lblDesc: 'ವ್ಯವಹಾರ ವಿವರಣೆ', btnText: '🚀 ಅರ್ಹತೆ ತಪಾಸಿಸಿ',
    navFind: 'ಯೋಜನೆಗಳು', navStories: 'ಕಥೆಗಳು', navHistory: 'ಇತಿಹಾಸ'
  }
};

function setLang(lang) {
  currentLang = lang;
  ['en','hi','kn'].forEach(l => {
    document.getElementById('lang-' + l).classList.toggle('active', l === lang);
  });
  const t = T[lang];
  document.getElementById('hero-title').innerHTML = t.heroTitle;
  document.getElementById('hero-sub').textContent = t.heroSub;
  document.getElementById('lbl-name').textContent = t.lblName;
  document.getElementById('lbl-type').textContent = t.lblType;
  document.getElementById('lbl-state').textContent = t.lblState;
  document.getElementById('lbl-revenue').textContent = t.lblRevenue;
  document.getElementById('lbl-age').textContent = t.lblAge;
  document.getElementById('lbl-sector').textContent = t.lblSector;
  document.getElementById('lbl-desc').textContent = t.lblDesc;
  document.getElementById('btn-text').textContent = t.btnText;
  document.getElementById('nav-home').textContent = t.navFind;
  document.getElementById('nav-stories').textContent = t.navStories;
  document.getElementById('nav-history').textContent = t.navHistory;
  if (currentResults && lang !== 'en') translateSummary(lang);
}

async function translateSummary(lang) {
  const el = document.getElementById('score-summary');
  if (!el || !el.dataset.original) return;
  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: el.dataset.original, target: lang })
    });
    const data = await res.json();
    if (data.translatedText) el.textContent = data.translatedText;
  } catch(e) {}
}

// ════════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════════
function showPage(page) {
  ['home','stories','history'].forEach(p => {
    document.getElementById('page-' + p).classList.toggle('hidden', p !== page);
    const btn = document.getElementById('nav-' + (p === 'home' ? 'home' : p));
    if (btn) btn.classList.toggle('active', p === page);
  });
  if (page === 'stories') loadStoriesPage();
  if (page === 'history') loadHistory();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ════════════════════════════════════════════
// CHAR COUNTERS
// ════════════════════════════════════════════
document.getElementById('biz-desc').addEventListener('input', function() {
  document.getElementById('char-count').textContent = this.value.length;
});
document.getElementById('story-text').addEventListener('input', function() {
  document.getElementById('story-char').textContent = this.value.length;
});

// ════════════════════════════════════════════
// ANALYSIS FLOW
// ════════════════════════════════════════════
// Replace your existing runAnalysis() function with this one

async function runAnalysis() {
  currentBiz = {
    name: document.getElementById('biz-name').value.trim(),
    type: document.getElementById('biz-type').value,
    state: document.getElementById('biz-state').value,
    revenue: document.getElementById('biz-revenue').value,
    age: document.getElementById('biz-age').value,
    sector: document.getElementById('biz-sector').value,
    desc: document.getElementById('biz-desc').value.trim()
  };

  if (!currentBiz.type || !currentBiz.state || !currentBiz.sector || !currentBiz.revenue || !currentBiz.age) {
    alert('Please fill in all required fields.');
    return;
  }

  hide('step-form');
  show('step-loading');
  hide('step-results');

  const fill = document.getElementById('loading-fill');
  const msg  = document.getElementById('loading-msg');

  // Simple clean progress — no agent box clutter
  const steps = [
    { pct: 20, text: 'Reading your business profile...' },
    { pct: 45, text: 'Checking eligibility against scheme database...' },
    { pct: 70, text: 'Matching real government schemes...' },
    { pct: 88, text: 'Building document checklist...' }
  ];

  fill.style.transition = 'none';
  fill.style.width = '0%';

  let si = 0;
  const anim = setInterval(() => {
    if (si < steps.length) {
      fill.style.transition = 'width 2.5s ease';
      fill.style.width = steps[si].pct + '%';
      msg.textContent = steps[si].text;
      si++;
    }
  }, 2600);

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentBiz)
    });
    clearInterval(anim);

    if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Server error'); }
    const data = await res.json();
    currentResults = data;

    fill.style.transition = 'width 0.4s ease';
    fill.style.width = '100%';
    msg.textContent = '✓ Done — found ' + data.agent2.schemes.length + ' matching schemes';

    await new Promise(r => setTimeout(r, 600));
    renderResults(data.agent1, data.agent2);
    hide('step-loading');
    show('step-results');

  } catch(err) {
    clearInterval(anim);
    alert('Error: ' + err.message);
    show('step-form');
    hide('step-loading');
  }
}

// ════════════════════════════════════════════
// RENDER RESULTS
// ════════════════════════════════════════════
function renderResults(a1, a2) {
  // Score ring
  const offset = 314 - (a1.score / 100) * 314;
  document.getElementById('score-num').textContent = a1.score;
  const sumEl = document.getElementById('score-summary');
  sumEl.textContent = a1.summary;
  sumEl.dataset.original = a1.summary;

  setTimeout(() => {
    const c = document.getElementById('score-circle');
    c.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)';
    c.style.strokeDashoffset = offset;
  }, 150);

  document.getElementById('strengths-row').innerHTML = (a1.strengths||[]).map(s => `<span class="tag">✓ ${s}</span>`).join('');
  document.getElementById('gaps-row').innerHTML = (a1.gaps||[]).map(g => `<span class="tag">⚠ ${g}</span>`).join('');

  const list = document.getElementById('schemes-list');
  document.getElementById('schemes-count').textContent = `${a2.schemes.length} schemes found`;
  list.innerHTML = '';
  window._schemes = a2.schemes;

  a2.schemes.forEach((sc, i) => {
    const isOngoing = !sc.deadline || sc.deadline.toLowerCase().includes('ongoing');
    const deadlineClass = isOngoing ? 'deadline-badge ongoing' : 'deadline-badge';
    const deadlineText = isOngoing ? '🟢 Ongoing' : `📅 ${sc.deadline}`;

    const docs = (sc.documents || []).map(d =>
      `<li><input type="checkbox"/> ${d}</li>`
    ).join('');

    const card = document.createElement('div');
    card.className = 'scheme-card' + (i === 0 ? ' open' : '');
    card.innerHTML = `
      <div class="scheme-header" onclick="toggleScheme(this)">
        <div class="scheme-left">
          <div class="scheme-name">${sc.name}</div>
          <div class="scheme-meta">${sc.ministry} · <span class="scheme-benefit">${sc.benefit}</span></div>
        </div>
        <div class="scheme-right">
          <span class="${deadlineClass}">${deadlineText}</span>
          <span class="match-badge">${sc.matchScore}% match</span>
          <span class="chevron">▼</span>
        </div>
      </div>
      <div class="scheme-body">
        <p class="scheme-desc">${sc.description}</p>
        <div class="scheme-actions">
          <button class="action-btn" onclick="copyDocs(this,${i})">📋 Copy Checklist</button>
          <button class="action-btn email-action" onclick="openEmailModal(${i})">📧 Draft Application Email</button>
          ${sc.applyUrl ? `<a class="action-btn" href="${sc.applyUrl}" target="_blank" rel="noopener">🔗 Official Website</a>` : ''}
        </div>
        <div class="docs-section-title">📄 Documents Required</div>
        <ul class="checklist">${docs}</ul>
        <div class="scheme-footer">
          <span class="footer-deadline">Deadline: ${sc.deadline || 'Ongoing'}</span>
          ${sc.applyUrl ? `<a class="apply-link" href="${sc.applyUrl}" target="_blank" rel="noopener">Apply Now →</a>` : ''}
        </div>
      </div>
    `;
    list.appendChild(card);
  });

  if (currentLang !== 'en') translateSummary(currentLang);
}

function toggleScheme(hdr) { hdr.parentElement.classList.toggle('open'); }

function copyDocs(btn, i) {
  const sc = window._schemes[i];
  const text = `Documents for ${sc.name}:\n` + (sc.documents||[]).map((d,j)=>`${j+1}. ${d}`).join('\n');
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✓ Copied!';
    setTimeout(() => btn.textContent = '📋 Copy Checklist', 2000);
  });
}

// ════════════════════════════════════════════
// EMAIL MODAL
// ════════════════════════════════════════════
function openEmailModal(idx) {
  currentEmailScheme = window._schemes[idx];
  show('email-modal');
  show('email-loading-state');
  hide('email-ready-state');
  generateEmail();
}

async function generateEmail() {
  try {
    const res = await fetch('/api/email-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ biz: currentBiz, scheme: currentEmailScheme })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    document.getElementById('email-subject').textContent = data.subject;
    document.getElementById('email-body').textContent = data.body;
    window._emailData = data;
    hide('email-loading-state');
    show('email-ready-state');
  } catch(err) {
    document.getElementById('email-loading-state').innerHTML = `<p style="color:var(--red-soft);text-align:center;padding:1rem">Failed to generate. Please try again.</p>`;
  }
}

function closeEmailModal() { hide('email-modal'); }
function handleModalClick(e) { if (e.target === e.currentTarget) closeEmailModal(); }

function copyEmail() {
  if (!window._emailData) return;
  const text = `Subject: ${window._emailData.subject}\n\n${window._emailData.body}`;
  navigator.clipboard.writeText(text).then(() => {
    document.querySelector('.email-copy-btn').textContent = '✓ Copied!';
    setTimeout(() => document.querySelector('.email-copy-btn').textContent = '📋 Copy', 2000);
  });
}

function openMailto() {
  if (!window._emailData) return;
  window.open(`mailto:?subject=${encodeURIComponent(window._emailData.subject)}&body=${encodeURIComponent(window._emailData.body)}`);
}

// ════════════════════════════════════════════
// STORIES
// ════════════════════════════════════════════
function renderStoryCard(story) {
  const fallback = 'hero1.jpg';
  return `
    <div class="story-card">
      <div class="story-photo-wrap" style="background-image: url('${story.photo || fallback}')">
        <span class="story-amount-tag">${story.amount}</span>
      </div>
      <div class="story-card-body">
        <div class="story-card-name">${story.name}</div>
        <div class="story-card-loc">📍 ${story.location}</div>
        <div class="story-card-scheme">${story.scheme}</div>
        <div class="story-card-text">"${story.text.substring(0, 140)}${story.text.length > 140 ? '...' : ''}"</div>
      </div>
    </div>
  `;
}

function loadStoriesHome() {
  const strip = document.getElementById('home-stories-strip');
  const preview = SAMPLE_STORIES.slice(0, 3);
  strip.innerHTML = preview.map(renderStoryCard).join('');
}

function loadStoriesPage() {
  const grid = document.getElementById('stories-grid');
  // Merge sample + user uploaded
  const userStories = JSON.parse(localStorage.getItem('gfn_stories') || '[]');
  const all = [...SAMPLE_STORIES, ...userStories].slice(0, 21); // max 21 shown
  grid.innerHTML = all.map(renderStoryCard).join('');

  // Slots
  const used = getWeekUploads();
  const remaining = WEEKLY_LIMIT - used;
  const slotsEl = document.getElementById('slots-remaining');
  if (slotsEl) {
    slotsEl.textContent = remaining > 0
      ? `${remaining} of ${WEEKLY_LIMIT} slots remaining this week`
      : 'This week\'s slots are full. Come back next week!';
  }
}

function previewPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById('photo-preview');
    preview.src = e.target.result;
    show('photo-preview');
  };
  reader.readAsDataURL(file);
}

async function submitStory() {
  const used = getWeekUploads();
  if (used >= WEEKLY_LIMIT) {
    alert(`This week's ${WEEKLY_LIMIT} story slots are full. Come back next week!`);
    return;
  }

  const name = document.getElementById('story-name').value.trim();
  const location = document.getElementById('story-location').value.trim();
  const bizType = document.getElementById('story-biztype').value;
  const scheme = document.getElementById('story-scheme').value.trim();
  const amount = document.getElementById('story-amount').value.trim();
  const text = document.getElementById('story-text').value.trim();

  if (!name || !location || !scheme || !text) {
    alert('Please fill in Name, Location, Scheme, and Your Story at minimum.');
    return;
  }

  const btn = document.getElementById('submit-text');
  btn.textContent = 'Submitting...';

  const photoInput = document.getElementById('story-photo');
  let photoData = null;

  if (photoInput.files[0]) {
    photoData = await new Promise(res => {
      const reader = new FileReader();
      reader.onload = e => res(e.target.result);
      reader.readAsDataURL(photoInput.files[0]);
    });
  }

  const story = {
    name, location, bizType, scheme,
    amount: amount ? '₹' + amount.replace('₹','') : '',
    text,
    photo: photoData || 'hero1.jpg',
    week: true,
    submittedAt: new Date().toISOString()
  };

  // Save locally
  const existing = JSON.parse(localStorage.getItem('gfn_stories') || '[]');
  existing.unshift(story);
  localStorage.setItem('gfn_stories', JSON.stringify(existing.slice(0, 50)));
  incWeekUploads();

  btn.textContent = '✓ Story Submitted!';
  setTimeout(() => {
    btn.textContent = 'Submit My Story';
    document.getElementById('story-name').value = '';
    document.getElementById('story-location').value = '';
    document.getElementById('story-scheme').value = '';
    document.getElementById('story-amount').value = '';
    document.getElementById('story-text').value = '';
    document.getElementById('story-char').textContent = '0';
    hide('photo-preview');
    loadStoriesPage();
    document.getElementById('stories-grid').scrollIntoView({ behavior: 'smooth' });
  }, 1500);
}

// ════════════════════════════════════════════
// HISTORY
// ════════════════════════════════════════════
async function loadHistory() {
  const list = document.getElementById('history-list');
  list.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem">Loading...</p>';
  try {
    const res = await fetch('/api/history');
    const data = await res.json();
    if (!data.length) {
      list.innerHTML = '<div class="empty-state"><p style="font-size:2rem;margin-bottom:0.5rem">📭</p><p>No analyses yet. Go find your schemes!</p></div>';
      return;
    }
    list.innerHTML = data.map(row => `
      <div class="history-card">
        <div>
          <div class="history-name">${row.business_name || 'Unnamed'}</div>
          <div class="history-meta">${row.business_type} · ${row.state} · ${row.sector} · ${new Date(row.created_at).toLocaleDateString('en-IN')}</div>
        </div>
        <div class="history-score">${row.score}</div>
      </div>
    `).join('');
  } catch {
    list.innerHTML = '<p style="color:var(--muted);text-align:center">Could not load history.</p>';
  }
}

// ════════════════════════════════════════════
// UTILS
// ════════════════════════════════════════════
function show(id) { document.getElementById(id).classList.remove('hidden'); }
function hide(id) { document.getElementById(id).classList.add('hidden'); }

function resetAgentBoxes() {
  ['pv1','pv2','pv3','pv4'].forEach(id => document.getElementById(id).className = 'agent-box');
  ['ps1','ps2','ps3'].forEach(id => document.getElementById(id).textContent = 'Waiting');
  document.getElementById('ps4').textContent = 'On Demand';
}

function resetApp() {
  hide('step-results');
  show('step-form');
  document.getElementById('score-circle').style.strokeDashoffset = '314';
  resetAgentBoxes();
  currentResults = null;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ════════════════════════════════════════════
// INIT
// ════════════════════════════════════════════
loadStoriesHome();