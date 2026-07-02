# Tarumak Studio — AI Search Experience Design
### Intent-understanding search built on Claude · Browser-first · Production-ready

**Companion code (all verified in this package):**
- `worker.js` — complete Cloudflare Worker (the only server component), unit-tested validation
- `ai-search.js` — client module, inert-by-default, syntax-verified
- `build-catalog.js` — catalog generator, **executed against the real data.js: 66 tools, ~3.7k tokens**
- `ai-catalog.json` — the generated catalog, ready to upload

This is the full design for feature F1 from the strategic blueprint (§6.3 there), now specified to implementation depth.

---

## 1. The Core Design Position

**AI search is a fallback layer, not a replacement layer.** Your existing local search (`matchTools()` + synonym map) is instant, free, offline, and already handles lookup-style queries well ("compress pdf", "qr code", "heic"). Replacing it with AI would make every keystroke slower and cost money to answer questions the site already answers for free.

The AI layer exists for exactly one gap: **intent-shaped queries** — where the user describes a *task* rather than naming a *tool*:

> "I want to remove the background and make the file smaller"
> "turn my photos into a single pdf"
> "get the text out of a screenshot"

Local keyword matching structurally cannot rank these (no tool is named "remove and make smaller"); a language model with the catalog in context answers them trivially. So:

| Layer | Fires | Cost | Latency |
|---|---|---|---|
| Local (`matchTools`) | Every keystroke, always | 0 | ~0ms |
| AI (Claude Haiku) | Only on explicit user action, only when the query looks like intent | ~fractions of a cent | 1–2s |

**Cost scales with confusion, not traffic.** A user who types "merge pdf" never touches the API.

---

## 2. Intent Taxonomy (what v1 handles, and what it deliberately doesn't)

| Intent class | Example | v1 behavior |
|---|---|---|
| **Tool lookup** | "pdf merger", "ocr" | Local search only — AI never offered |
| **Single-task intent** | "make my photo smaller" | AI → 1 tool + reason |
| **Multi-step intent** | "remove background and compress it" | AI → ordered workflow (numbered steps, connected visually) |
| **No-tool-exists** | "edit a video" | AI → honest empty + closest category link |
| Capability question | "will compressing lose quality?" | Out of scope for search — this is the tool-page assistant (F3), later |
| Troubleshooting | "why is my png blurry" | Out of scope — route to guides in a later iteration |

Keeping v1 to the first four classes keeps the prompt simple, the output contract strict, and the failure surface small.

---

## 3. Interaction Design (the states, exactly)

### State 1 — Typing (unchanged from today)
Local results render per keystroke exactly as they do now. The AI layer appends nothing for lookup-shaped queries. **The site's existing search must never feel different for users who never touch AI.**

### State 2 — The offer
When the query passes the intent heuristic (3+ words, OR a connective like "and/then/into/make it", OR zero local results and length ≥ 8 chars), one extra row appends *below* the local results:

```
┌──────────────────────────────────────────────────┐
│ [local result rows, exactly as today]            │
│ ─────────────────────────────────────────────    │
│ ✦ Ask AI: "remove the background and shrink it"  │
│                                        Enter ↵   │
└──────────────────────────────────────────────────┘
```

Cyan accent, sparkle glyph (stroke SVG, consistent with the site's icon language — no emoji). Pressing **Enter fires it only if the user hasn't arrow-keyed onto a local result** — the existing keyboard navigation keeps priority, so power users' muscle memory is never hijacked.

### State 3 — Thinking
The offer row swaps to a pulsing dot + "Understanding your request…". Target: under 2 seconds (Haiku + cached prompt). The pulse animation respects `prefers-reduced-motion`.

### State 4a — Single suggestion
```
│ AI SUGGESTION                                    │
│ Image Compressor   reduces file size, keeps…     │
│ Query text only — your files are never involved. │
```

### State 4b — Workflow (the differentiating moment)
```
│ AI SUGGESTED WORKFLOW                            │
│ ① Background Remover   removes the background    │
│    →                                             │
│ ② Image Compressor     then shrinks the file     │
│ Query text only — your files are never involved. │
```
Numbered cyan step badges with connecting arrows — visually a *plan*, not a list. Clicking any step opens that tool. This is the seed UI for the full Workflow Builder (F2): same JSON contract, so when F2 ships, this dropdown result gains a "Run as workflow" button with zero contract changes.

### State 4c — Honest empty
"No exact tool — browse closest category: **Image Tools**." Never a fabricated match. The fallback category comes from the model but is validated against the real category list.

### State 5 — Quota exhausted
"Daily AI searches used up — regular search still works, and everything resets tomorrow." Quiet, factual, never blocking. Local search is untouched.

### State 6 — Any failure (timeout, CDN, upstream error)
The AI zone silently empties. Local results remain. **AI is an enhancement that can never break search** — this is enforced structurally (the module appends to the dropdown; it never replaces or intercepts the site's own rendering).

### Privacy microcopy
Every AI result footer: *"Query text only — your files are never involved."* One line, every time. This is the brand promise extended into the AI era, stated at the exact moment a user might wonder.

---

## 4. Architecture

```
Browser
  ├─ keystroke → matchTools() → instant local results      (99% of interactions end here)
  └─ Enter on AI offer → POST {q} → Cloudflare Worker
                                        ├─ Origin check (site-only)
                                        ├─ KV quota: 20/IP/day  ← the real budget ceiling
                                        ├─ catalog (module cache → edge cache → /ai-catalog.json)
                                        ├─ Claude Haiku, system prompt CACHED (cache_control)
                                        ├─ parse + validate slugs against catalog   ← server layer
                                        └─ JSON back
              browser validates AGAIN via bySlug()          ← client layer
```

**Why two validation layers is not paranoia — evidence from this package's own tests:** while unit-testing the validator, the test author (with full project knowledge) wrote `merge-pdf` as a test slug. The real slug is `pdf-merger`. The validator correctly dropped it. That plausible-but-wrong guess is *precisely* the class of error a language model makes; it happened organically on the first attempt, and the defense caught it. `bySlug()` on the client throws on unknown slugs, making hallucinated tools structurally unrenderable.

**Why no vector DB / embeddings (restated from strategy, now with the real number):** the generated catalog is 14.8 KB ≈ 3.7k tokens. It fits whole in the system prompt; with prompt caching the full price is paid once and ~10% on cache hits. RAG infrastructure for a 66-item corpus would add latency, moving parts, and retrieval-miss failure modes to solve a problem that doesn't exist.

**Why the catalog is a fetched JSON, not baked into the Worker:** adding a tool = re-run `build-catalog.js`, upload one JSON file. The Worker never redeploys for catalog changes. The Worker edge-caches it for 1 hour.

**Model choice:** `claude-haiku-4-5`, temperature 0, max 400 tokens. Sub-2s, near-zero cost, and the task (constrained classification against a provided catalog) is squarely within a small model's competence. The workflow *builder* (F2, executing multi-step plans with parameters) is where Sonnet earns its cost — not here.

---

## 5. Contracts (exact)

**Request:** `POST /` `{"q": "remove the background and shrink it"}` (≤300 chars, truncated server-side)

**Response (success):**
```json
{
  "tools": [
    {"slug": "background-remover", "reason": "removes the background first"},
    {"slug": "image-compressor",  "reason": "then shrinks the file size"}
  ],
  "sequence": true,
  "fallback": null,
  "remaining": 17
}
```

**Response (errors):** `429 {"error":"quota"}` · `502 {"error":"upstream"}` / `{"error":"unparseable"}` · `504 {"error":"upstream_timeout"}` — the client maps *all* non-quota errors to silent degradation.

**System prompt:** in `worker.js` (`buildSystemPrompt`) — catalog-grounded, JSON-only, ≤3 tools, 8-word reasons, few-shot examples including the empty case. The catalog block carries `cache_control: {type:"ephemeral"}`.

---

## 6. Cost & Latency Budget

Per AI call (Haiku, catalog cached): ~3.7k cached input + ~50 fresh input + ~150 output → **order of hundredths of a US cent**. Verify against current pricing at docs.claude.com before launch, but the controlling number is the quota: **20 calls/IP/day means daily spend is bounded by `unique-IPs × 20 × per-call cost` no matter what** — and quota is only decremented on *successful* calls, so failures never burn a user's allowance.

Latency budget: Worker overhead ~10–30ms + Anthropic TTFT+generation ~800–1800ms (short output, temperature 0) → **under 2s perceived**, covered by the thinking state.

---

## 7. Rollout Plan

1. **Ship inert (this week, zero risk):** upload `ai-search.js` (AI_ENDPOINT empty — file does nothing), `ai-catalog.json`, add the script tag. Site behavior: byte-for-byte identical.
2. **Deploy Worker:** KV namespace + API key secret + `wrangler deploy` (runbook in worker.js header). Test with curl from allowed origin.
3. **Enable for yourself:** set AI_ENDPOINT, upload, test the four states live (intent query, lookup query, gibberish, quota by lowering DAILY_FREE_QUOTA to 2 temporarily).
4. **Watch week 1:** Worker analytics = calls/day, error rate, quota hits. If `unparseable` > ~2%, tighten the prompt's few-shots.
5. **Iterate the heuristic from data:** the offer-shown → offer-clicked ratio tells you if MIN_WORDS_FOR_AI is tuned right. (Requires the analytics fix from the strategy doc — another reason it's Phase 1 there.)

## 8. Success Metrics

| Metric | Target | Signal |
|---|---|---|
| AI offer click-through | >25% of offers shown | Heuristic precision — too low means offering on lookup queries |
| AI result → tool opened | >60% | Recommendation quality |
| Silent-failure rate | <2% of fires | Infra health |
| Quota-hit users | <5% of AI users | 20/day is right; if higher, it's Pro-tier demand evidence |
| p95 latency | <2.5s | Cached-prompt health |

---

## 9. What This Deliberately Isn't

No chat interface. No conversation memory. No per-keystroke AI. No embeddings. No streaming (the payload is ~150 tokens of JSON; streaming adds complexity to save ~300ms on something already under 2s). No server-side logging of query content beyond Cloudflare's defaults. Each of these is a decision, not an omission — the feature's job is to get a confused user to the right tool in one interaction, and everything that doesn't serve that got cut.
