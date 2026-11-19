# goalpulse-ledger-anchors

Daily public anchors for the GoalPulse live prediction ledger.

GoalPulse (goalpulse.io, by Innora.ai) records every pre-match club-football forecast its match pages show. Each forecast is frozen before kick-off into an append-only SHA-256 hash chain and graded after full time (1X2, handicap 1X2, over/under 2.5). The full ledger is published at:

- https://goalpulse.io/data/football-live-ledger.jsonl — raw lines, byte for byte
- https://goalpulse.io/data/football-live-ledger.json — summary, chain status and the same records
- Human-readable record: https://goalpulse.io/ai-track-record

Once a day this repository receives one small file with the newest head of that chain (sequence number and hash), pushed on the day it refers to. That gives anyone a public, dated reference point: any later copy of the ledger must reproduce the same hash at the same sequence number, or it has been changed.

What this repository does not claim: it does not make the ledger impossible to change. It makes a change detectable from the day an anchor is pushed onward.

## Layout

```
anchors/2026/11/2026-11-20.json
```

Each file:

```json
{
  "date": "2026-11-20",
  "seq": 8,
  "hash": "<64 hex characters>",
  "ledger": "https://goalpulse.io/data/football-live-ledger.jsonl"
}
```

## How the chain is built

- Every ledger line is one JSON object. Its `hash` is computed over the line **without** its own `hash` field (the "body").
- `canonical(body)` is JSON with object keys sorted at every level and no extra whitespace.
- `hash = sha256( prevHash + "\n" + canonical(body) )`, lowercase hex.
- The first line has `seq: 1` and a `prevHash` of 64 zeros; each following line has `seq` one higher and `prevHash` equal to the previous line's `hash`.
- A `forecast` line must have `capturedAt` earlier than `kickoff`.

## Verify

`verify.mjs` (Node.js 18+) downloads the ledger, rebuilds the chain and compares it with an anchor:

```
node verify.mjs anchors/2026/11/2026-11-20.json
```

## Notes

- Forecasts are statistical estimates for information only. GoalPulse does not sell tickets or wagers and does not link to bookmakers.
- License: see https://goalpulse.io/open-data#license.
