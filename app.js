const OPENROUTER_API_KEY = "YOUR_KEY_HERE";

// ----------- AGENT 1: ELIGIBILITY SCORER -----------
async function runAgent1(businessData) {
  const prompt = `
You are a government funding eligibility expert for India.

Analyze this business and give an eligibility score out of 100 for Indian government funding schemes.

Business Details:
- Name: ${businessData.name}
- Type: ${businessData.type}
- State: ${businessData.state}
- Annual Revenue: ${businessData.revenue}
- Years in Operation: ${businessData.age}
- Sector: ${businessData.sector}
- Description: ${businessData.desc}

Respond in this exact JSON format only, no extra text:
{
  "score": <number 0-100>,
  "summary": "<2 sentence summary of why this score>",
  "strengths": ["<strength1>", "<strength2>"],
  "gaps": ["<gap1>", "<gap2>"]
}
`;

  const response = await callOpenRouter(prompt);
  return JSON.parse(response);
}

// ----------- AGENT 2: SCHEME MATCHER -----------
async function runAgent2(businessData, agent1Result) {
  const prompt = `
You are an expert in Indian government funding schemes (central and state level).

Based on this business profile AND its eligibility analysis, recommend the top 5 most relevant government schemes.

Business Details:
- Name: ${businessData.name}
- Type: ${businessData.type}
- State: ${businessData.state}
- Annual Revenue: ${businessData.revenue}
- Years in Operation: ${businessData.age}
- Sector: ${businessData.sector}
- Description: ${businessData.desc}

Eligibility Score from Agent 1: ${agent1Result.score}/100
Agent 1 Strengths: ${agent1Result.strengths.join(", ")}
Agent 1 Gaps: ${agent1Result.gaps.join(", ")}

Respond in this exact JSON format only, no extra text:
{
  "schemes": [
    {
      "name": "<Official scheme name>",
      "ministry": "<Ministry or department>",
      "benefit": "<What funding/benefit they get e.g. ₹10L subsidy>",
      "matchScore": <number 60-99>,
      "description": "<2 sentence explanation of why this matches>",
      "documents": ["<doc1>", "<doc2>", "<doc3>", "<doc4>", "<doc5>"]
    }
  ]
}

Use real Indian government schemes like PMEGP, Mudra, Startup India, WEP, NABARD, MSME schemes, state-specific schemes for ${businessData.state}, etc.
`;

  const response = await callOpenRouter(prompt);
  return JSON.parse(response);
}

// ----------- OPENROUTER CALLER WITH FALLBACK -----------
async function callOpenRouter(prompt) {
  const models = [
    "google/gemini-2.0-flash-001",
    "meta-llama/llama-3.3-70b-instruct",
    "mistralai/mistral-7b-instruct"
  ];

  for (const model of models) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://govfundnavigator.in",
          "X-Title": "GovFund Navigator"
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const text = data.choices[0].message.content.trim();

      // Strip markdown code fences if present
      const clean = text.replace(/```json|```/g, "").trim();
      return clean;

    } catch (err) {
      console.warn(`Model ${model} failed:`, err.message);
      // Try next model
    }
  }

  throw new Error("All models failed. Check your API key.");
}

// ----------- MAIN ORCHESTRATOR -----------
async function runAgents() {
  // Collect form data
  const businessData = {
    name: document.getElementById("biz-name").value.trim(),
    type: document.getElementById("biz-type").value,
    state: document.getElementById("biz-state").value,
    revenue: document.getElementById("biz-revenue").value,
    age: document.getElementById("biz-age").value,
    sector: document.getElementById("biz-sector").value,
    desc: document.getElementById("biz-desc").value.trim()
  };

  // Basic validation
  if (!businessData.type || !businessData.state || !businessData.sector) {
    alert("Please fill in all required fields.");
    return;
  }

  showStep("step-loading");

  try {
    // AGENT 1
    const at1 = document.getElementById("at1");
    const at2 = document.getElementById("at2");
    at1.classList.add("active");
    document.getElementById("loading-text").textContent = "Agent 1 is scoring your eligibility...";

    const agent1Result = await runAgent1(businessData);

    at1.classList.remove("active");
    at1.classList.add("done");
    at2.classList.add("active");
    document.getElementById("loading-text").textContent = "Agent 2 is finding your best schemes...";

    // AGENT 2
    const agent2Result = await runAgent2(businessData, agent1Result);

    at2.classList.remove("active");
    at2.classList.add("done");

    // RENDER RESULTS
    renderResults(agent1Result, agent2Result);
    showStep("step-results");

  } catch (err) {
    alert("Something went wrong: " + err.message + "\n\nCheck your API key in app.js");
    showStep("step-form");
  }
}

// ----------- RENDER RESULTS -----------
function renderResults(agent1, agent2) {
  // Score
  document.getElementById("score-display").textContent = agent1.score;
  document.getElementById("score-summary").textContent = agent1.summary;
  setTimeout(() => {
    document.getElementById("score-bar").style.width = agent1.score + "%";
  }, 100);

  // Schemes
  const container = document.getElementById("schemes-container");
  container.innerHTML = "";

  agent2.schemes.forEach((scheme, i) => {
    const card = document.createElement("div");
    card.className = "scheme-card";
    card.innerHTML = `
      <div class="scheme-header" onclick="toggleScheme(${i})">
        <div>
          <div class="scheme-name">${scheme.name}</div>
          <div class="scheme-meta">${scheme.ministry} · ${scheme.benefit}</div>
        </div>
        <div class="scheme-badge">${scheme.matchScore}% match</div>
      </div>
      <div class="scheme-body" id="scheme-body-${i}">
        <div class="scheme-desc">${scheme.description}</div>
        <div class="checklist-title">📄 Documents Required</div>
        <ul class="checklist">
          ${scheme.documents.map(d => `<li>${d}</li>`).join("")}
        </ul>
      </div>
    `;
    container.appendChild(card);
  });

  // Auto-open first scheme
  setTimeout(() => toggleScheme(0), 300);
}

function toggleScheme(i) {
  const body = document.getElementById(`scheme-body-${i}`);
  body.classList.toggle("open");
}

// ----------- UI HELPERS -----------
function showStep(id) {
  ["step-form", "step-loading", "step-results"].forEach(s => {
    document.getElementById(s).classList.remove("active");
  });
  document.getElementById(id).classList.add("active");
}

function resetApp() {
  // Reset agent indicators
  document.getElementById("at1").className = "agent-step";
  document.getElementById("at2").className = "agent-step";
  showStep("step-form");
}