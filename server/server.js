require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { saveSearch, getHistory, getSearchById } = require('./database');

const app = express();

// ============================================================
// SECURITY: Rate limiting (no extra package needed)
// ============================================================
const rateLimitMap = new Map();

function rateLimit(maxRequests, windowMs) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!rateLimitMap.has(ip)) rateLimitMap.set(ip, []);
    const requests = rateLimitMap.get(ip).filter(t => t > windowStart);
    requests.push(now);
    rateLimitMap.set(ip, requests);

    if (requests.length > maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Please wait a moment and try again.'
      });
    }
    next();
  };
}

// Clean up old entries every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - 60000;
  for (const [ip, times] of rateLimitMap) {
    const fresh = times.filter(t => t > cutoff);
    if (fresh.length === 0) rateLimitMap.delete(ip);
    else rateLimitMap.set(ip, fresh);
  }
}, 5 * 60 * 1000);

// ============================================================
// SECURITY: Input validation
// ============================================================
const VALID_TYPES = ['Startup','Women-led Business','NGO','Rural Enterprise','MSME','Self Help Group'];
const VALID_STATES = ['Karnataka','Maharashtra','Tamil Nadu','Uttar Pradesh','Rajasthan','Gujarat','Delhi','West Bengal','Telangana','Kerala','Punjab','Haryana','Madhya Pradesh','Bihar','Odisha'];
const VALID_REVENUES = ['Under ₹5 Lakh','₹5L – ₹10 Lakh','₹10L – ₹20 Lakh','₹20 Lakh+'];
const VALID_AGES = ['Less than 1 year','1–3 years','3–5 years','More than 5 years'];
const VALID_SECTORS = ['Agriculture','Technology','Manufacturing','Textile','Healthcare','Education','Food Processing','Handicrafts','Renewable Energy','Other'];

function validateBizInput(body) {
  const errors = [];

  if (body.name && typeof body.name !== 'string') errors.push('Invalid name');
  if (body.name && body.name.length > 100) errors.push('Name too long');

  if (!body.type || !VALID_TYPES.includes(body.type)) errors.push('Invalid business type');
  if (!body.state || !VALID_STATES.includes(body.state)) errors.push('Invalid state');
  if (!body.revenue || !VALID_REVENUES.includes(body.revenue)) errors.push('Invalid revenue range');
  if (!body.age || !VALID_AGES.includes(body.age)) errors.push('Invalid age');
  if (!body.sector || !VALID_SECTORS.includes(body.sector)) errors.push('Invalid sector');

  if (body.desc && typeof body.desc !== 'string') errors.push('Invalid description');
  if (body.desc && body.desc.length > 500) errors.push('Description too long (max 500 chars)');

  // Reject unexpected fields
  const allowed = ['name','type','state','revenue','age','sector','desc'];
  const extra = Object.keys(body).filter(k => !allowed.includes(k));
  if (extra.length > 0) errors.push(`Unexpected fields: ${extra.join(', ')}`);

  return errors;
}

function sanitize(str) {
  if (!str) return '';
  return String(str).trim().replace(/[<>]/g, '');
}

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors({ origin: ['http://localhost:3000'] }));
app.use(express.json({ limit: '10kb' })); // SECURITY: reject huge payloads
app.use(express.static(path.join(__dirname, '../public')));

// SECURITY: Remove fingerprinting header
app.disable('x-powered-by');

// ============================================================
// AI LAYER
// ============================================================
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GOOGLE_TRANSLATE_KEY = process.env.GOOGLE_TRANSLATE_KEY; // optional

if (!OPENROUTER_API_KEY) {
  console.error('ERROR: OPENROUTER_API_KEY not set in .env');
  process.exit(1);
}

const MODELS = [
  'google/gemini-2.0-flash-001',
  'meta-llama/llama-3.3-70b-instruct',
  'mistralai/mistral-7b-instruct'
];

async function callOpenRouter(prompt) {
  for (const model of MODELS) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://govfundnavigator.in',
          'X-Title': 'GovFund Navigator'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 2000
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const text = data.choices[0].message.content.trim();
      return text.replace(/```json|```/g, '').trim();
    } catch (err) {
      console.warn(`Model ${model} failed:`, err.message);
    }
  }
  throw new Error('All AI models failed. Please try again.');
}

// ============================================================
// AGENT 1: Eligibility Scorer
// ============================================================
async function agent1(biz) {
  const prompt = `You are a government funding eligibility expert for India.
Analyze this business and give an eligibility score out of 100.

Business:
- Type: ${biz.type}
- State: ${biz.state}
- Revenue: ${biz.revenue}
- Age: ${biz.age}
- Sector: ${biz.sector}
- Description: ${biz.desc}

Respond ONLY in this exact JSON, no extra text:
{
  "score": <0-100>,
  "summary": "<2 sentence summary>",
  "strengths": ["<s1>","<s2>","<s3>"],
  "gaps": ["<g1>","<g2>"]
}`;
  return JSON.parse(await callOpenRouter(prompt));
}

// ============================================================
// AGENT 2: Scheme Matcher
// ============================================================
async function agent2(biz, a1) {
  const prompt = `You are an expert in Indian government funding schemes.
Recommend top 5 schemes for this business.

Business: ${biz.type}, ${biz.state}, ${biz.revenue}, ${biz.age}, ${biz.sector}
Description: ${biz.desc}
Eligibility Score: ${a1.score}/100
Strengths: ${a1.strengths.join(', ')}
Gaps: ${a1.gaps.join(', ')}

Respond ONLY in this exact JSON, no extra text:
{
  "schemes": [
    {
      "name": "<Official scheme name>",
      "ministry": "<Ministry>",
      "benefit": "<What they get>",
      "matchScore": <60-99>,
      "description": "<2 sentences why this matches>",
      "deadline": "<Ongoing or Month Year>",
      "applyUrl": "<official gov url>"
    }
  ]
}`;
  return JSON.parse(await callOpenRouter(prompt));
}

// ============================================================
// AGENT 3: Document Checklist Generator
// ============================================================
async function agent3(biz, schemes) {
  const schemeNames = schemes.map(s => s.name).join(', ');
  const prompt = `You are a document expert for Indian government schemes.
For each scheme, list exactly what documents are needed to apply.

Business: ${biz.type}, ${biz.state}, ${biz.sector}, ${biz.revenue}
Schemes: ${schemeNames}

Respond ONLY in this exact JSON, no extra text:
{
  "checklists": [
    {
      "schemeName": "<exact scheme name>",
      "documents": ["<doc1>","<doc2>","<doc3>","<doc4>","<doc5>","<doc6>"]
    }
  ]
}`;
  return JSON.parse(await callOpenRouter(prompt));
}

// ============================================================
// AGENT 4: Email Draft Generator
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

Respond ONLY in this exact JSON, no extra text:
{
  "subject": "<email subject>",
  "body": "<full email body with line breaks as \\n>"
}`;
  return JSON.parse(await callOpenRouter(prompt));
}

// ============================================================
// ROUTES
// ============================================================

// Main analysis endpoint — rate limited to 10 requests per minute per IP
app.post('/api/analyze', rateLimit(10, 60000), async (req, res) => {
  // Validate input
  const errors = validateBizInput(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join('. ') });
  }

  // Sanitize
  const biz = {
    name: sanitize(req.body.name),
    type: req.body.type,
    state: req.body.state,
    revenue: req.body.revenue,
    age: req.body.age,
    sector: req.body.sector,
    desc: sanitize(req.body.desc)
  };

  try {
    const a1 = await agent1(biz);
    const a2 = await agent2(biz, a1);
    const a3 = await agent3(biz, a2.schemes);

    // Merge checklists into schemes
    a2.schemes = a2.schemes.map(scheme => {
      const cl = a3.checklists.find(c => c.schemeName === scheme.name);
      return { ...scheme, documents: cl ? cl.documents : [] };
    });

    saveSearch({
      business_name: biz.name || 'Unnamed',
      business_type: biz.type,
      state: biz.state,
      sector: biz.sector,
      score: a1.score,
      schemes: a2.schemes
    });

    res.json({ agent1: a1, agent2: a2 });
  } catch (err) {
    console.error('Analysis error:', err.message);
    res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
});

// Email draft endpoint — rate limited to 5 per minute per IP
app.post('/api/email-draft', rateLimit(5, 60000), async (req, res) => {
  const { biz, scheme } = req.body;
  if (!biz || !scheme) return res.status(400).json({ error: 'Missing biz or scheme' });

  const errors = validateBizInput(biz);
  if (errors.length > 0) return res.status(400).json({ error: errors.join('. ') });

  try {
    const draft = await agent4(biz, scheme);
    res.json(draft);
  } catch (err) {
    console.error('Email draft error:', err.message);
    res.status(500).json({ error: 'Could not generate email. Please try again.' });
  }
});

// Translate endpoint — uses Google Translate API
app.post('/api/translate', rateLimit(20, 60000), async (req, res) => {
  const { text, target } = req.body;
  if (!text || !target) return res.status(400).json({ error: 'Missing text or target' });
  if (!['hi', 'kn', 'en'].includes(target)) return res.status(400).json({ error: 'Invalid language' });
  if (typeof text !== 'string' || text.length > 5000) return res.status(400).json({ error: 'Text too long' });

  // If no Google key, use AI translation as fallback
  if (!GOOGLE_TRANSLATE_KEY) {
    try {
      const langName = target === 'hi' ? 'Hindi' : target === 'kn' ? 'Kannada' : 'English';
      const prompt = `Translate the following text to ${langName}. Return ONLY the translated text, nothing else:\n\n${text}`;
      const translated = await callOpenRouter(prompt);
      return res.json({ translatedText: translated });
    } catch (err) {
      return res.status(500).json({ error: 'Translation failed' });
    }
  }

  // Use Google Translate API
  try {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, target, format: 'text' })
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    res.json({ translatedText: data.data.translations[0].translatedText });
  } catch (err) {
    console.error('Translation error:', err.message);
    res.status(500).json({ error: 'Translation failed' });
  }
});

// History endpoints — rate limited
app.get('/api/history', rateLimit(30, 60000), (req, res) => {
  res.json(getHistory());
});

app.get('/api/history/:id', rateLimit(30, 60000), (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
  const row = getSearchById(id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  row.schemes = JSON.parse(row.schemes_json);
  res.json(row);
});

app.listen(3000, () => console.log('✅ GovFund Navigator → http://localhost:3000'));