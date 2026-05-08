const Database = require('better-sqlite3');
const db = new Database('govfund.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_name TEXT,
    business_type TEXT,
    state TEXT,
    sector TEXT,
    revenue TEXT,
    age TEXT,
    score INTEGER,
    schemes_count INTEGER,
    schemes_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

function saveSearch(biz, result) {
  const stmt = db.prepare(`
    INSERT INTO searches (business_name, business_type, state, sector, revenue, age, score, schemes_count, schemes_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    biz.name || 'Unknown',
    biz.type,
    biz.state,
    biz.sector,
    biz.revenue,
    biz.age,
    result.agent1?.score ?? null,
    result.agent2?.schemes?.length ?? 0,
    JSON.stringify(result.agent2?.schemes ?? [])
  );
}

function getHistory() {
  return db.prepare(`
    SELECT id, business_name, business_type, state, sector, revenue, age, score, schemes_count, created_at
    FROM searches ORDER BY created_at DESC LIMIT 50
  `).all();
}

function getSearchById(id) {
  const row = db.prepare(`SELECT * FROM searches WHERE id = ?`).get(id);
  if (row) row.schemes = JSON.parse(row.schemes_json);
  return row;
}

module.exports = { saveSearch, getHistory, getSearchById };