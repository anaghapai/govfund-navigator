require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { saveSearch, getHistory, getSearchById } = require('./database');

const app = express();

// ============================================================
// SETUP
// ============================================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const SCHEMES_DB = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/schemes.json'), 'utf8')
);

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
      max_tokens: 2000
    })
  });

  const data = await response.json();

  if (!data.choices || !data.choices[0]) {
    throw new Error('No response from AI: ' + JSON.stringify(data));
  }

  let raw = data.choices[0].message.content.trim();
  raw = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  return raw;
}

// ============================================================
// AGENT 1 — Eligibility Scorer
// ============================================================
async function agent1(biz) {
  const prompt = `You are a government scheme eligibility expert for India.

BUSINESS PROFILE:
- Name: ${biz.name || 'Not provided'}
- Type: ${biz.type}
- State: ${biz.state}
- Annual Revenue: ${biz.revenue}
- Years in Operation: ${biz.age}
- Sector: ${biz.sector}
- Description: ${biz.desc || 'Not provided'}

Score this business 0-100 on overall eligibility for Indian government funding schemes.

Respond ONLY in valid JSON, no markdown, no backticks:
{"score":<number 0-100>,"summary":"<2 sentence explanation>","strengths":["<strength 1>","<strength 2>"],"gaps":["<gap 1>","<gap 2>"]}`;

  const raw = await callOpenRouter(prompt);
  return JSON.parse(raw);
}

// ============================================================
// AGENT 2 — Scheme Matcher
// ============================================================
async function agent2(biz) {
  const relevantSchemes = SCHEMES_DB.filter(sc => {
    const sectorMatch = sc.sector.includes(biz.sector) || sc.sector.includes('Other');
    const targetMatch = sc.target_group.includes(biz.type) || sc.target_group.includes('MSME');
    return sectorMatch || targetMatch;
  });

  const schemesContext = JSON.stringify(relevantSchemes, null, 2);

  const prompt = `You are a government scheme eligibility expert for India.

BUSINESS PROFILE:
- Name: ${biz.name || 'Not provided'}
- Type: ${biz.type}
- State: ${biz.state}
- Annual Revenue: ${biz.revenue}
- Years in Operation: ${biz.age}
- Sector: ${biz.sector}
- Description: ${biz.desc || 'Not provided'}

REAL GOVERNMENT SCHEMES DATABASE (use ONLY these, never invent):
${schemesContext}

Identify which schemes this business qualifies for. For each match give a match percentage.

STRICT RULES:
- ONLY recommend schemes from the database above. Never invent scheme names, amounts, or documents.
- If a scheme's eligibility criteria clearly don't match, exclude it.
- Documents list must come exactly from the database.
- Deadlines must be copied exactly from the database.
- Apply URLs must be copied exactly from the database.

Respond ONLY in valid JSON, no markdown, no backticks:
{"schemes":[{"id":"<scheme id>","name":"<exact name>","ministry":"<exact ministry>","benefit":"<exact max_benefit>","deadline":"<exact deadline>","matchScore":<60-99>,"description":"<why this fits, 1-2 sentences>","documents":<exact documents array>,"applyUrl":"<exact apply_url>","features":<exact features array>}]}`;

  const raw = await callOpenRouter(prompt);
  return JSON.parse(raw);
}

// ============================================================
// AGENT 4 — Email Draft
// ============================================================
async function agent4(biz, scheme) {
  const prompt = `You are an expert at writing government funding application emails in India.
Write a professional application email for this scheme.

Business Name: ${biz.name || 'Our Business'}
Business Type: ${biz.type}
State: ${biz.state}
Sector: ${biz.sector}
Scheme: ${scheme.name}
Ministry: ${scheme.ministry}
Benefit: ${scheme.benefit}

Write a formal, ready-to-send email. Include:
- Subject line
- Formal greeting
- Introduction of business
- Why they qualify
- Request for application consideration
- Professional closing

IMPORTANT: Respond ONLY in valid JSON. No markdown, no backticks, no extra text.
Use \\n for line breaks inside the body string.
Format:
{"subject":"<email subject>","body":"<full email body>"}`;

  try {
    const raw = await callOpenRouter(prompt);
    return JSON.parse(raw);
  } catch (e) {
    // Fallback: extract subject and body manually
    const raw = await callOpenRouter(prompt);
    const subjectMatch = raw.match(/"subject"\s*:\s*"([^"]+)"/);
    const bodyMatch = raw.match(/"body"\s*:\s*"([\s\S]+?)"\s*\}/);
    if (subjectMatch && bodyMatch) {
      return {
        subject: subjectMatch[1],
        body: bodyMatch[1].replace(/\\n/g, '\n')
      };
    }
    return {
      subject: `Application for ${scheme.name}`,
      body: raw
    };
  }
}

// ============================================================
// ROUTES
// ============================================================

// Main analyze route
app.post('/api/analyze', async (req, res) => {
  const { name, type, state, revenue, age, sector, desc } = req.body;

  if (!type || !state || !sector || !revenue || !age) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const biz = { name, type, state, revenue, age, sector, desc };

  try {
    const [a1, a2] = await Promise.all([agent1(biz), agent2(biz)]);
    const result = { agent1: a1, agent2: a2 };

    // Save to history
    await saveSearch(biz, result);

    res.json(result);
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Email draft route
app.post('/api/email-draft', async (req, res) => {
  const { biz, scheme } = req.body;

  if (!biz || !scheme) {
    return res.status(400).json({ error: 'Missing biz or scheme.' });
  }

  try {
    const email = await agent4(biz, scheme);
    res.json(email);
  } catch (err) {
    console.error('Email draft error:', err);
    res.status(500).json({ error: err.message });
  }
});

// History routes
app.get('/api/history', async (req, res) => {
  try {
    const history = await getHistory();
    res.json(history);
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/history/:id', async (req, res) => {
  try {
    const item = await getSearchById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    console.error('History fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// START
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`GovFund running on http://localhost:${PORT}`));