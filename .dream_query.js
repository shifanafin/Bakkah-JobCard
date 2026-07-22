const {DatabaseSync} = require('node:sqlite');
const db = new DatabaseSync('C:/Users/shifana/.local/share/mimocode/mimocode.db', {readOnly: true});

const projectId = '460a2bd9-6abe-46c6-b3b8-27d69c856fa3';
const excludeSessions = [
  'ses_090e5ca6effenSZlz6DzeNrKpM',
  'ses_090e5ca67ffed1aph5E6LWsUmE',
  'ses_090e5cab1ffeac1DnwfKdeYA6B',
];
const placeholders = excludeSessions.map(() => '?').join(',');

// First check what tool names exist
const toolNames = db.prepare(`
  SELECT DISTINCT json_extract(p.data, '$.tool') as tool_name, COUNT(*) as cnt
  FROM message m
  JOIN part p ON p.message_id = m.id
  WHERE m.session_id IN (SELECT id FROM session WHERE project_id = ?)
    AND m.session_id NOT IN (${placeholders})
    AND json_extract(m.data, '$.role') = 'assistant'
    AND json_extract(p.data, '$.type') = 'tool'
  GROUP BY tool_name
  ORDER BY cnt DESC
`).all(projectId, ...excludeSessions);

console.log("=== TOOL NAMES ===");
toolNames.forEach(t => console.log(`  ${t.tool_name}: ${t.cnt}`));

// Now get Write/Edit/Bash (capitalized)
console.log("\n=== WRITE/EDIT/BASH CALLS ===\n");

const rows = db.prepare(`
  SELECT m.session_id, m.time_created, p.data as raw_part
  FROM message m
  JOIN part p ON p.message_id = m.id
  WHERE m.session_id IN (SELECT id FROM session WHERE project_id = ?)
    AND m.session_id NOT IN (${placeholders})
    AND json_extract(m.data, '$.role') = 'assistant'
    AND json_extract(p.data, '$.type') = 'tool'
    AND json_extract(p.data, '$.tool') IN ('Write', 'Edit', 'Bash')
  ORDER BY m.time_created DESC
  LIMIT 150
`).all(projectId, ...excludeSessions);

let count = 0;
for (const row of rows) {
  try {
    const part = JSON.parse(row.raw_part);
    count++;
    const dt = new Date(row.time_created).toISOString().split('T')[0];
    const input = part.state?.input || {};
    
    if (part.tool === 'Write') {
      const fp = input.file_path || '';
      const preview = (input.content || '').replace(/\n/g, ' ').substring(0, 120);
      console.log(`[${dt}] WRITE ${fp}`);
      console.log(`  ${preview}`);
    } else if (part.tool === 'Edit') {
      const fp = input.file_path || '';
      const oldS = (input.old_string || '').replace(/\n/g, ' ').substring(0, 100);
      const newS = (input.new_string || '').replace(/\n/g, ' ').substring(0, 100);
      console.log(`[${dt}] EDIT ${fp}`);
      console.log(`  old: ${oldS}`);
      console.log(`  new: ${newS}`);
    } else if (part.tool === 'Bash') {
      const cmd = (input.command || '').replace(/\n/g, ' ').substring(0, 200);
      console.log(`[${dt}] BASH: ${cmd}`);
    }
    console.log();
  } catch (e) {
    // skip
  }
}
console.log(`\nTotal: ${count}`);

db.close();
