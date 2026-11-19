// verify.mjs — check a GoalPulse ledger anchor against the published ledger.
// Usage: node verify.mjs anchors/2026/11/2026-11-20.json [ledger.jsonl]
// With a second argument the ledger is read from that file instead of being downloaded.
import crypto from 'node:crypto';
import fs from 'node:fs';

const canonical = (v) => (Array.isArray(v)
  ? `[${v.map(canonical).join(',')}]`
  : v && typeof v === 'object'
    ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(',')}}`
    : JSON.stringify(v ?? null));

const [anchorPath, ledgerPath] = process.argv.slice(2);
if (!anchorPath) { console.error('usage: node verify.mjs <anchor.json> [ledger.jsonl]'); process.exit(2); }
const anchor = JSON.parse(fs.readFileSync(anchorPath, 'utf8'));
const text = ledgerPath
  ? fs.readFileSync(ledgerPath, 'utf8')
  : await (await fetch(anchor.ledger || 'https://goalpulse.io/data/football-live-ledger.jsonl')).text();

let prev = '0'.repeat(64);
for (const raw of text.split('\n').filter((l) => l.trim())) {
  const { hash, ...body } = JSON.parse(raw);
  const h = crypto.createHash('sha256').update(`${prev}\n${canonical(body)}`).digest('hex');
  if (body.prevHash !== prev || h !== hash) { console.log(`chain breaks at seq ${body.seq}`); process.exit(1); }
  prev = hash;
  if (body.seq === anchor.seq) {
    const ok = hash === anchor.hash;
    console.log(ok ? `anchor ${anchor.date} matches: seq ${anchor.seq}` : `ANCHOR MISMATCH at seq ${anchor.seq}`);
    process.exit(ok ? 0 : 1);
  }
}
console.log(`seq ${anchor.seq} not in the ledger yet`);
process.exit(1);
