require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
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
// POLICY MAPPING ENGINE — filters before AI sees anything
// ============================================================
function mapSchemes(biz) {
  return SCHEMES_DB.filter(sc => {
    // Sector match
    const sectorOk = sc.sector.includes(biz.sector) || sc.sector.includes('Other');

    // Target group match
    const targetOk = sc.target_group.includes(biz.type) || sc.target_group.includes('MSME');

    // Revenue filter
    let revenueOk = true;
    if (sc.eligibility.revenue_cap) {
      if (sc.eligibility.revenue_cap === 'Under ₹5 Lakh' && biz.revenue !== 'Under ₹5 Lakh') revenueOk = false;
      if (sc.eligibility.revenue_cap === 'New projects only (not existing)' && biz.age !== 'Less than 1 year') revenueOk = false;
      if (sc.eligibility.revenue_cap === 'New greenfield enterprise only' && biz.age !== 'Less than 1 year') revenueOk = false;
    }

    // Age/years filter
    let ageOk = true;
    if (sc.eligibility.years_in_operation && sc.eligibility.years_in_operation.length > 0) {
      ageOk = sc.eligibility.years_in_operation.includes(biz.age);
    }

    // Gender filter
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
// AGENT 2 — Scheme Matcher (uses pre-filtered schemes only)
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
async function agent3(biz, scheme) {
  const prompt = `Write a formal Indian government funding application email.

Business Name: ${biz.name || 'Our Business'}
Business Type: ${biz.type}
State: ${biz.state}
Sector: ${biz.sector}
Scheme: ${scheme.name}
Ministry: ${scheme.ministry}
Benefit: ${scheme.benefit}

Include: subject line, formal greeting, business intro, why they qualify, request for consideration, professional closing.

Respond ONLY in valid JSON, no markdown, no backticks:
{"subject":"<email subject>","body":"<full email with \\n for line breaks>"}`;

  try {
    const raw = await callOpenRouter(prompt);
    return JSON.parse(raw);
  } catch (e) {
    // Fallback if JSON parse fails
    return {
      subject: `Application for ${scheme.name}`,
      body: `Dear Sir/Madam,\n\nWe wish to apply for the ${scheme.name} offered by ${scheme.ministry}.\n\nOur business (${biz.type}) based in ${biz.state} operates in the ${biz.sector} sector and meets the eligibility criteria for this scheme.\n\nWe kindly request you to consider our application.\n\nThank you,\n${biz.name || 'Applicant'}`
    };
  }
}

// ============================================================
// ROUTES
// ============================================================

app.post('/api/analyze', async (req, res) => {
  const { name, type, state, revenue, age, sector, desc } = req.body;

  if (!type || !state || !sector || !revenue || !age) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const biz = { name, type, state, revenue, age, sector, desc };

  try {
    // Step 1: Filter schemes with policy engine (no AI needed)
    const filtered = mapSchemes(biz);
    console.log(`Policy engine matched ${filtered.length} schemes for ${type}/${sector}/${state}`);

    // Step 2: Run eligibility scorer and scheme matcher in parallel
    const [a1, a2] = await Promise.all([
      agent1(biz),
      agent2(biz, filtered)
    ]);

    const result = { agent1: a1, agent2: a2 };

    // Step 3: Save to history
    try {
      saveSearch(biz, result);
    } catch (dbErr) {
      console.warn('DB save skipped:', dbErr.message);
    }

    res.json(result);
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/email-draft', async (req, res) => {
  const { biz, scheme } = req.body;
  if (!biz || !scheme) return res.status(400).json({ error: 'Missing biz or scheme.' });

  try {
    const email = await agent3(biz, scheme);
    res.json(email);
  } catch (err) {
    console.error('Email draft error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    res.json(getHistory());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/history/:id', async (req, res) => {
  try {
    const item = getSearchById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// START
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`GovFund running on http://localhost:${PORT}`));