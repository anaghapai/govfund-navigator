require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const { saveSearch, getHistory, getSearchById } = require('./database');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ============================================================
// LOAD SCHEMES DATABASE
// ============================================================
const SCHEMES_DB = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/schemes.json'), 'utf8')
);

// ============================================================
// POLICY MAPPING ENGINE
// ============================================================
function mapSchemes(biz) {
  return SCHEMES_DB.filter(sc => {
    const sectorOk = sc.sector.includes(biz.sector) || sc.sector.includes('Other');
    const targetOk = sc.target_group.includes(biz.type) || sc.target_group.includes('MSME');

    let revenueOk = true;
    if (sc.eligibility.revenue_cap) {
      if (sc.eligibility.revenue_cap === 'Under ₹5 Lakh' && biz.revenue !== 'Under ₹5 Lakh') revenueOk = false;
      if (sc.eligibility.revenue_cap === 'New projects only (not existing)' && biz.age !== 'Less than 1 year') revenueOk = false;
      if (sc.eligibility.revenue_cap === 'New greenfield enterprise only' && biz.age !== 'Less than 1 year') revenueOk = false;
    }

    let ageOk = true;
    if (sc.eligibility.years_in_operation && sc.eligibility.years_in_operation.length > 0) {
      ageOk = sc.eligibility.years_in_operation.includes(biz.age);
    }

    let genderOk = true;
    if (sc.eligibility.gender === 'Women only' && biz.type !== 'Women-led Business') {
      genderOk = false;
    }

    return (sectorOk || targetOk) && revenueOk && ageOk && genderOk;
  });
}

// ============================================================
// OPENROUTER HELPER
// ============================================================
async function callOpenRouter(prompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'GovFund Navigator'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-001',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.2
    })
  });

  const data = await response.json();
  if (!data.choices || !data.choices[0]) {
    throw new Error('No response from AI: ' + JSON.stringify(data));
  }

  let raw = data.choices[0].message.content.trim();
  raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  return raw;
}

// ============================================================
// AGENT 1 — Eligibility Scorer
// ============================================================
async function agent1(biz) {
  const prompt = `You are a government scheme eligibility expert for India.

BUSINESS PROFILE:
- Type: ${biz.type}
- State: ${biz.state}
- Annual Revenue: ${biz.revenue}
- Years in Operation: ${biz.age}
- Sector: ${biz.sector}
- Description: ${biz.desc || 'Not provided'}

Score this business 0-100 on overall eligibility for Indian government funding schemes.

Respond ONLY in valid JSON, no markdown, no backticks, no extra text:
{"score":<number 0-100>,"summary":"<2 sentence explanation>","strengths":["<strength 1>","<strength 2>"],"gaps":["<gap 1>","<gap 2>"]}`;

  const raw = await callOpenRouter(prompt);
  return JSON.parse(raw);
}

// ============================================================
// AGENT 2 — Scheme Matcher
// ============================================================
async function agent2(biz, filteredSchemes) {
  const schemesContext = JSON.stringify(filteredSchemes, null, 2);

  const prompt = `You are a government scheme eligibility expert for India.

BUSINESS PROFILE:
- Name: ${biz.name || 'Not provided'}
- Type: ${biz.type}
- State: ${biz.state}
- Annual Revenue: ${biz.revenue}
- Years in Operation: ${biz.age}
- Sector: ${biz.sector}
- Description: ${biz.desc || 'Not provided'}

PRE-FILTERED SCHEMES (ONLY use these, never invent any):
${schemesContext}

Pick the best matching schemes from the list above. Give each a matchScore 60-99.

STRICT RULES:
- Copy name, ministry, max_benefit, deadline, apply_url, documents, features EXACTLY from the data above.
- Never invent or modify any field.
- Only include schemes that genuinely fit.

Respond ONLY in valid JSON, no markdown, no backticks:
{"schemes":[{"id":"<id>","name":"<exact name>","ministry":"<exact ministry>","benefit":"<exact max_benefit>","deadline":"<exact deadline>","matchScore":<60-99>,"description":"<1-2 sentences why this fits>","documents":<exact documents array>,"applyUrl":"<exact apply_url>","features":<exact features array>}]}`;

  const raw = await callOpenRouter(prompt);
  return JSON.parse(raw);
}

// ============================================================
// AGENT 3 — Email Draft
// ============================================================
async function agent3(biz, scheme, requestedAmount) {
  const prompt = `Write a formal Indian government funding application email.

Business Name: ${biz.name || 'Our Business'}
Business Type: ${biz.type}
State: ${biz.state}
Sector: ${biz.sector}
Annual Revenue: ${biz.revenue}
Years in Operation: ${biz.age}
Scheme: ${scheme.name}
Ministry: ${scheme.ministry}
Maximum Benefit Available: ${scheme.benefit}
Amount Requested by Business: ${requestedAmount || scheme.benefit}
Business Description: ${biz.desc || 'Not provided'}

Include ALL of these sections:
1. Subject line
2. Formal greeting to the ministry
3. Introduction of the business
4. Why they qualify for this specific scheme
5. Specific funding amount being requested: ${requestedAmount || scheme.benefit}
6. How the funds will be used
7. Request for application consideration
8. Professional closing with business name

Respond ONLY in valid JSON, no markdown, no backticks:
{"subject":"<email subject>","body":"<full email with \\n for line breaks>"}`;

  try {
    const raw = await callOpenRouter(prompt);
    return JSON.parse(raw);
  } catch (e) {
    return {
      subject: `Application for ${scheme.name} — ${requestedAmount || scheme.benefit}`,
      body: `Dear Sir/Madam,\n\nWe, ${biz.name || 'our business'}, a ${biz.type} based in ${biz.state} wish to apply for ${scheme.name}.\n\nRequested amount: ${requestedAmount || scheme.benefit}\n\nThank you,\n${biz.name || 'Applicant'}`
    };
  }
}

// ============================================================
// EMAIL NOTIFICATION — AUTO SEND
// ============================================================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmailNotification(email, biz, schemes) {
  const schemeList = schemes.map((s, i) => `
    <div style="background:#f9f9f9; border-left:4px solid #c17f3e; padding:15px; margin-bottom:15px; border-radius:4px;">
      <h3 style="margin:0 0 8px 0; color:#1a1a1a">${i + 1}. ${s.name}</h3>
      <p style="margin:4px 0; color:#555">🏢 <strong>Ministry:</strong> ${s.ministry}</p>
      <p style="margin:4px 0; color:#555">💰 <strong>Funding:</strong> ${s.benefit}</p>
      <p style="margin:4px 0; color:#555">📅 <strong>Deadline:</strong> ${s.deadline || 'Ongoing'}</p>
      ${s.applyUrl ? `<a href="${s.applyUrl}" style="display:inline-block; margin-top:8px; padding:6px 14px; background:#c17f3e; color:white; border-radius:4px; text-decoration:none; font-size:0.85rem;">Apply Now →</a>` : ''}
    </div>
  `).join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto;">
      <div style="background:#1a1a2e; padding:30px; text-align:center; border-radius:8px 8px 0 0;">
        <h1 style="color:#c17f3e; margin:0;">🏛️ GovFund Navigator</h1>
        <p style="color:#aaa; margin:8px 0 0 0;">Your Eligibility Results Are Ready</p>
      </div>
      <div style="background:#ffffff; padding:30px; border-radius:0 0 8px 8px; border:1px solid #eee;">
        <p style="font-size:1.1rem;">Hello <strong>${biz.name || 'there'}</strong>! 👋</p>
        <p>Great news! We found <strong>${schemes.length} government funding schemes</strong> that match your business profile.</p>
        <hr style="border:none; border-top:1px solid #eee; margin:20px 0;"/>
        <h2 style="color:#1a1a2e; margin-bottom:15px;">Your Matched Schemes</h2>
        ${schemeList}
        <hr style="border:none; border-top:1px solid #eee; margin:20px 0;"/>
        <h3 style="color:#1a1a2e;">📋 Documents to Keep Ready</h3>
        <ul style="color:#555; line-height:1.8;">
          <li>Aadhaar Card + PAN Card</li>
          <li>Business Registration Certificate</li>
          <li>Bank Statements (last 6 months)</li>
          <li>GST Certificate (if applicable)</li>
          <li>Cancelled Cheque</li>
        </ul>
        <p style="color:#888; font-size:0.85rem; margin-top:30px;">
          This email was sent by GovFund Navigator — AI-powered government funding discovery for Indian businesses.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"GovFund Navigator" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🏛️ Your GovFund Results — ${schemes.length} Schemes Found for ${biz.name || 'Your Business'}`,
    html: html
  });
}

// ============================================================
// ROUTES
// ============================================================

app.post('/api/analyze', async (req, res) => {
  const { name, type, state, revenue, age, sector, desc, email } = req.body;

  if (!type || !state || !sector || !revenue || !age) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const biz = { name, type, state, revenue, age, sector, desc };

  try {
    const filtered = mapSchemes(biz);
    console.log(`Policy engine matched ${filtered.length} schemes for ${type}/${sector}/${state}`);

    const [a1, a2] = await Promise.all([
      agent1(biz),
      agent2(biz, filtered)
    ]);

    const result = { agent1: a1, agent2: a2 };

    try { saveSearch(biz, result); } catch (dbErr) { console.warn('DB save skipped:', dbErr.message); }

    // AUTO SEND EMAIL
    if (email && email.trim().includes('@')) {
      try {
        await sendEmailNotification(email.trim(), biz, a2.schemes);
        console.log('✅ Email sent to', email);
      } catch (emailErr) {
        console.warn('❌ Email send failed:', emailErr.message);
      }
    }

    res.json(result);
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/email-draft', async (req, res) => {
  const { biz, scheme, requestedAmount } = req.body;
  if (!biz || !scheme) return res.status(400).json({ error: 'Missing biz or scheme.' });
  try {
    const email = await agent3(biz, scheme, requestedAmount);
    res.json(email);
  } catch (err) {
    console.error('Email draft error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/history', async (req, res) => {
  try { res.json(getHistory()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/history/:id', async (req, res) => {
  try {
    const item = getSearchById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// START
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`GovFund running on http://localhost:${PORT}`));