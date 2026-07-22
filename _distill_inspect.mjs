import { DatabaseSync } from "node:sqlite";
const db = new DatabaseSync("C:\\Users\\shifana\\.local\\share\\mimocode\\mimocode.db", { readOnly: true });

// User message content is in parts
console.log("=== SAMPLE USER MESSAGE PARTS ===");
const userParts = db.prepare(`
  SELECT p.id, p.message_id, p.data as raw
  FROM part p
  JOIN message m ON m.id = p.message_id
  WHERE json_extract(m.data, '$.role') = 'user'
    AND m.session_id IN (SELECT id FROM session WHERE directory LIKE '%bakkah%')
  ORDER BY m.time_created
  LIMIT 20
`).all();
for (const p of userParts) {
  const d = JSON.parse(p.raw);
  const text = d.text || d.content || JSON.stringify(d).slice(0, 200);
  console.log(`  [${p.message_id}] type=${d.type} text=${String(text).slice(0, 200)}`);
}

// Workflow patterns: consecutive read+edit+read+edit cycles on same file
console.log("\n=== WORKFLOW: READ-EDIT-VALIDATE CYCLES ===");
try {
  const cycles = db.prepare(`
    SELECT 
      json_extract(json_extract(p.data, '$.state.input'), '$.file_path') as fpath,
      count(CASE WHEN json_extract(p.data, '$.tool') = 'Read' THEN 1 END) as reads,
      count(CASE WHEN json_extract(p.data, '$.tool') = 'Edit' THEN 1 END) as edits,
      count(CASE WHEN json_extract(p.data, '$.tool') = 'Grep' THEN 1 END) as greps
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.tool') IN ('Read', 'Edit', 'Grep', 'Bash', 'Write')
      AND json_extract(json_extract(p.data, '$.state.input'), '$.file_path') IS NOT NULL
      AND m.session_id IN (SELECT id FROM session WHERE directory LIKE '%bakkah%')
      AND m.time_created > ?
    GROUP BY fpath
    HAVING (reads + edits) >= 5
    ORDER BY (reads + edits) DESC
    LIMIT 15
  `).all(Date.now() - 30 * 24 * 3600 * 1000);
  for (const c of cycles) {
    const short = (c.fpath || "").replace(/.*bakkah\\bakkah\\/, "");
    console.log(`  ${short}: ${c.reads}R/${c.edits}E/${c.greps}G`);
  }
} catch(e) { console.log("error:", e.message); }

// Check if there are any todo/task patterns that reveal repeated workflows
console.log("\n=== TODO PATTERNS ===");
try {
  const todos = db.prepare(`
    SELECT 
      json_extract(json_extract(p.data, '$.state.input'), '$.content') as content,
      count(*) as n
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(m.data, '$.role') = 'assistant'
      AND json_extract(p.data, '$.tool') = 'TodoWrite'
      AND m.session_id IN (SELECT id FROM session WHERE directory LIKE '%bakkah%')
      AND m.time_created > ?
    GROUP BY content
    ORDER BY n DESC
    LIMIT 15
  `).all(Date.now() - 30 * 24 * 3600 * 1000);
  for (const t of todos) {
    console.log(`  [${t.n}x] ${(t.content || "").slice(0, 150)}`);
  }
} catch(e) { console.log("error:", e.message); }

db.close();
