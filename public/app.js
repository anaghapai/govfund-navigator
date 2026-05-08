// ============================================================
// STATE
// ============================================================
let currentLang = 'en';
let currentBiz = {};
let currentResults = null;
let currentEmailScheme = null;

// ============================================================
// LANGUAGE SYSTEM
// ============================================================
const TRANSLATIONS = {
  en: {
    heroTitle: 'Find schemes you <span class="highlight">actually qualify for</span>',
    heroSub: 'Answer 6 questions. Get eligibility score + top schemes + document checklist + email draft.',
    formTitle: 'Your Business Profile',
    lblName: 'Business Name', lblType: 'Business Type', lblState: 'State',
    lblRevenue: 'Annual Revenue', lblAge: 'Years in Operation', lblSector: 'Sector',
    lblDesc: 'Business Description', btnText: 'Analyze My Eligibility',
    navAnalyze: 'Analyze', navHistory: 'History'
  },
  hi: {
    heroTitle: 'वो योजनाएं खोजें जिनके लिए आप <span class="highlight">वास्तव में पात्र हैं</span>',
    heroSub: '6 सवालों के जवाब दें। पात्रता स्कोर + शीर्ष योजनाएं + दस्तावेज़ सूची + ईमेल ड्राफ्ट पाएं।',
    formTitle: 'आपका व्यवसाय प्रोफ़ाइल',
    lblName: 'व्यवसाय का नाम', lblType: 'व्यवसाय प्रकार', lblState: 'राज्य',
    lblRevenue: 'वार्षिक राजस्व', lblAge: 'संचालन के वर्ष', lblSector: 'क्षेत्र',
    lblDesc: 'व्यवसाय विवरण', btnText: '🚀 पात्रता विश्लेषण करें',
    navAnalyze: 'विश्लेषण', navHistory: 'इतिहास'
  },
  kn: {
    heroTitle: 'ನೀವು <span class="highlight">ನಿಜವಾಗಿಯೂ ಅರ್ಹರಾಗಿರುವ</span> ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಿ',
    heroSub: '6 ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ. ಅರ್ಹತಾ ಸ್ಕೋರ್ + ಯೋಜನೆಗಳು + ದಾಖಲೆ ಪಟ್ಟಿ + ಇಮೇಲ್ ಡ್ರಾಫ್ಟ್ ಪಡೆಯಿರಿ.',
    formTitle: 'ನಿಮ್ಮ ವ್ಯವಹಾರ ಪ್ರೊಫೈಲ್',
    lblName: 'ವ್ಯವಹಾರದ ಹೆಸರು', lblType: 'ವ್ಯವಹಾರ ಪ್ರಕಾರ', lblState: 'ರಾಜ್ಯ',
    lblRevenue: 'ವಾರ್ಷಿಕ ಆದಾಯ', lblAge: 'ಕಾರ್ಯಾಚರಣೆ ವರ್ಷಗಳು', lblSector: 'ಕ್ಷೇತ್ರ',
    lblDesc: 'ವ್ಯವಹಾರ ವಿವರಣೆ', btnText: '🚀 ಅರ್ಹತೆ ವಿಶ್ಲೇಷಿಸಿ',
    navAnalyze: 'ವಿಶ್ಲೇಷಣೆ', navHistory: 'ಇತಿಹಾಸ'
  }
};

function setLang(lang) {
  currentLang = lang;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('lang-' + lang).classList.add('active');

  const t = TRANSLATIONS[lang];
  document.getElementById('hero-title').innerHTML = t.heroTitle;
  document.getElementById('hero-sub').textContent = t.heroSub;
  document.getElementById('form-title').textContent = t.formTitle;
  document.getElementById('lbl-name').textContent = t.lblName;
  document.getElementById('lbl-type').textContent = t.lblType;
  document.getElementById('lbl-state').textContent = t.lblState;
  document.getElementById('lbl-revenue').textContent = t.lblRevenue;
  document.getElementById('lbl-age').textContent = t.lblAge;
  document.getElementById('lbl-sector').textContent = t.lblSector;
  document.getElementById('lbl-desc').textContent = t.lblDesc;
  document.getElementById('btn-text').textContent = t.btnText;
  document.getElementById('nav-home').textContent = t.navAnalyze;
  document.getElementById('nav-history').textContent = t.navHistory;

  // If results are showing, translate them via API
  if (currentResults && lang !== 'en') translateResults(lang);
}

async function translateResults(lang) {
  const summary = document.getElementById('score-summary');
  if (!summary || !summary.dataset.original) return;

  try {
    summary.classList.add('translating');
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: summary.dataset.original, target: lang })
    });
    const data = await res.json();
    if (data.translatedText) summary.textContent = data.translatedText;
    summary.classList.remove('translating');
  } catch (e) {
    summary.classList.remove('translating');
  }
}

// ============================================================
// NAVIGATION
// ============================================================
function showPage(page) {
  document.getElementById('page-home').classList.toggle('hidden', page !== 'home');
  document.getElementById('page-history').classList.toggle('hidden', page !== 'history');
  document.getElementById('nav-home').classList.toggle('active', page === 'home');
  document.getElementById('nav-history').classList.toggle('active', page === 'history');
  if (page === 'history') loadHistory();
}

// ============================================================
// CHAR COUNTER
// ============================================================
document.getElementById('biz-desc').addEventListener('input', function() {
  document.getElementById('char-count').textContent = this.value.length;
});

// ============================================================
// MAIN ANALYSIS FLOW
// ============================================================
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

  show('step-loading'); hide('step-form'); hide('step-results');

  const steps = [
    { pv: 'pv1', ps: 'ps1', msg: 'Agent 1 scoring your eligibility...' },
    { pv: 'pv2', ps: 'ps2', msg: 'Agent 2 finding matching schemes...' },
    { pv: 'pv3', ps: 'ps3', msg: 'Agent 3 generating document checklists...' }
  ];

  // Animate agents sequentially while waiting
  let stepIdx = 0;
  const animInterval = setInterval(() => {
    if (stepIdx > 0) {
      document.getElementById(steps[stepIdx-1].pv).classList.remove('active');
      document.getElementById(steps[stepIdx-1].pv).classList.add('done');
      document.getElementById(steps[stepIdx-1].ps).textContent = '✓ Done';
    }
    if (stepIdx < steps.length) {
      document.getElementById(steps[stepIdx].pv).classList.add('active');
      document.getElementById('loading-msg').textContent = steps[stepIdx].msg;
      document.getElementById(steps[stepIdx].ps).textContent = 'Running...';
      stepIdx++;
    }
  }, 4000);

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(currentBiz)
    });

    clearInterval(animInterval);

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Request failed');
    }

    const data = await res.json();
    currentResults = data;

    // Mark all done
    steps.forEach(s => {
      document.getElementById(s.pv).classList.remove('active');
      document.getElementById(s.pv).classList.add('done');
    });
    document.getElementById('pv4').style.borderColor = 'var(--accent)';
    document.getElementById('ps4').textContent = 'Ready on demand';
    document.getElementById('ps3').textContent = '✓ Done';
    document.getElementById('loading-msg').textContent = 'All agents complete!';

    await new Promise(r => setTimeout(r, 600));

    renderResults(data.agent1, data.agent2);
    hide('step-loading');
    show('step-results');

  } catch (err) {
    clearInterval(animInterval);
    alert('Error: ' + err.message);
    show('step-form');
    hide('step-loading');
    resetAgentVisuals();
  }
}

// ============================================================
// RENDER RESULTS
// ============================================================
function renderResults(a1, a2) {
  // Score ring
  const circumference = 314;
  const offset = circumference - (a1.score / 100) * circumference;
  document.getElementById('score-num').textContent = a1.score;

  const summaryEl = document.getElementById('score-summary');
  summaryEl.textContent = a1.summary;
  summaryEl.dataset.original = a1.summary;

  setTimeout(() => {
    const circle = document.getElementById('score-circle');
    circle.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)';
    circle.style.strokeDashoffset = offset;
  }, 100);

  // Tags
  document.getElementById('strengths-row').innerHTML = (a1.strengths||[]).map(s => `<span class="tag">✓ ${s}</span>`).join('');
  document.getElementById('gaps-row').innerHTML = (a1.gaps||[]).map(g => `<span class="tag">⚠ ${g}</span>`).join('');

  // Schemes
  const list = document.getElementById('schemes-list');
  document.getElementById('schemes-count').textContent = `${a2.schemes.length} schemes found`;
  list.innerHTML = '';
  window._schemes = a2.schemes;

  a2.schemes.forEach((scheme, i) => {
    const card = document.createElement('div');
    card.className = 'scheme-card' + (i === 0 ? ' open' : '');
    card.innerHTML = `
      <div class="scheme-header" onclick="toggleScheme(this)">
        <div class="scheme-left">
          <div class="scheme-name">${scheme.name}</div>
          <div class="scheme-meta">${scheme.ministry} · <strong style="color:var(--green)">${scheme.benefit}</strong></div>
        </div>
        <div class="scheme-right">
          <span class="match-badge">${scheme.matchScore}% match</span>
          <span class="chevron">▼</span>
        </div>
      </div>
      <div class="scheme-body">
        <p class="scheme-desc">${scheme.description}</p>
        <div class="scheme-actions">
          <button class="copy-btn" onclick="copyDocs(this,${i})">📋 Copy Checklist</button>
          <button class="email-btn" onclick="openEmailModal(${i})">📧 Draft Application Email</button>
        </div>
        <div class="docs-header">
          <span class="docs-title">📄 Documents Required</span>
        </div>
        <ul class="checklist" id="docs-${i}">
          ${(scheme.documents||[]).map(d => `<li><input type="checkbox"/> ${d}</li>`).join('')}
        </ul>
        <div class="scheme-footer">
          <span class="deadline-tag">🗓 ${scheme.deadline || 'Ongoing'}</span>
          ${scheme.applyUrl ? `<a class="apply-link" href="${scheme.applyUrl}" target="_blank" rel="noopener">Apply Now →</a>` : ''}
        </div>
      </div>
    `;
    list.appendChild(card);
  });

  // Translate if non-English
  if (currentLang !== 'en') translateResults(currentLang);
}

function toggleScheme(header) {
  header.parentElement.classList.toggle('open');
}

function copyDocs(btn, i) {
  const docs = window._schemes[i].documents || [];
  const text = `Documents for ${window._schemes[i].name}:\n` + docs.map((d,j) => `${j+1}. ${d}`).join('\n');
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✓ Copied!';
    setTimeout(() => btn.textContent = '📋 Copy Checklist', 2000);
  });
}

// ============================================================
// EMAIL MODAL (Agent 4)
// ============================================================
function openEmailModal(schemeIdx) {
  currentEmailScheme = window._schemes[schemeIdx];
  show('email-modal');
  show('email-loading');
  hide('email-content');
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

    hide('email-loading');
    show('email-content');
  } catch (err) {
    hide('email-loading');
    document.getElementById('email-modal').querySelector('.modal-box').innerHTML += `<p style="color:var(--accent);text-align:center;padding:1rem">Failed to generate email. Try again.</p>`;
  }
}

function closeEmailModal() {
  hide('email-modal');
}

function copyEmail() {
  if (!window._emailData) return;
  const text = `Subject: ${window._emailData.subject}\n\n${window._emailData.body}`;
  navigator.clipboard.writeText(text).then(() => {
    document.querySelector('.btn-copy-email').textContent = '✓ Copied!';
    setTimeout(() => document.querySelector('.btn-copy-email').textContent = '📋 Copy Email', 2000);
  });
}

function openMailto() {
  if (!window._emailData) return;
  const subject = encodeURIComponent(window._emailData.subject);
  const body = encodeURIComponent(window._emailData.body);
  window.open(`mailto:?subject=${subject}&body=${body}`);
}

// ============================================================
// HISTORY
// ============================================================
async function loadHistory() {
  const list = document.getElementById('history-list');
  list.innerHTML = '<p style="color:var(--muted2);text-align:center;padding:2rem">Loading...</p>';
  try {
    const res = await fetch('/api/history');
    const data = await res.json();
    if (!data.length) {
      list.innerHTML = '<div class="empty-state"><p style="font-size:2rem;margin-bottom:0.75rem">📭</p><p>No searches yet. Go analyze a business!</p></div>';
      return;
    }
    list.innerHTML = data.map(row => `
      <div class="history-card">
        <div>
          <div class="history-name">${row.business_name || 'Unnamed Business'}</div>
          <div class="history-meta">${row.business_type} · ${row.state} · ${row.sector} · ${new Date(row.created_at).toLocaleDateString('en-IN')}</div>
        </div>
        <div class="history-score">${row.score}</div>
      </div>
    `).join('');
  } catch {
    list.innerHTML = '<p style="color:var(--muted2);text-align:center">Could not load history.</p>';
  }
}

// ============================================================
// UTILS
// ============================================================
function show(id) { document.getElementById(id).classList.remove('hidden'); }
function hide(id) { document.getElementById(id).classList.add('hidden'); }

function resetAgentVisuals() {
  ['pv1','pv2','pv3','pv4'].forEach(id => {
    document.getElementById(id).className = 'pv-step';
  });
  ['ps1','ps2','ps3'].forEach(id => {
    document.getElementById(id).textContent = 'Waiting...';
  });
  document.getElementById('ps4').textContent = 'Ready after';
}

function resetApp() {
  hide('step-results');
  show('step-form');
  document.getElementById('score-circle').style.strokeDashoffset = '314';
  resetAgentVisuals();
  currentResults = null;
}

// Close modal on backdrop click
document.getElementById('email-modal').addEventListener('click', function(e) {
  if (e.target === this) closeEmailModal();
});