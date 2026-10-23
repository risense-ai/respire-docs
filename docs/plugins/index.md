# Respire plugins

Respire ships one plugin family with a thin adapter per host: every plugin hooks the [respire engine](../getting-started.md) (CLI name `rsrs`) into an agent loop — title-tier recall on every round, one-prefix store, and a Stop storage check. Local-first, encrypted on device, last-writer-wins sync in the cloud.

The plugins share one runtime design:

| Moment | Behavior |
| --- | --- |
| Session start | Injects the memory ground rules and runs a one-shot probe: not signed in → registration guidance; library nearly empty → first-day seeding guidance; missing model → optional model install (silent when everything is ready) |
| Every prompt | Runs `rsrs recall --titles` and injects the title tier — score, 8-character short id and title; the agent pulls full records with `rsrs show <id>` on demand |
| Prompt starts with the store prefixes | Prompts starting with 「记：」, 「存：」 or `remember:` are stored directly via `rsrs remember … --importance important`; when the engine flags a near-duplicate the plugin reports the candidates and lets the model decide (attach or force-write) |
| Stop (agent finished) | Storage check: one extra round nudges the model to store the new facts, decisions and lessons of this session; plain chat ends without a nudge. Guarded against loops and throttled by `store_nudge_every` |
| Prompt starts with `/nomem` | Recall is skipped for that turn |

**Models are optional.** Registration, login, sync and recall work without any on-device model — the engine falls back to lexical retrieval. BGE-M3 is a pure enhancement: install it with `rsrs model install && rsrs model activate m3` when you want stronger semantic recall. Missing models never block or error.

## Hosts

| Host | Repository | Install path | Manifest | Stop contract |
| --- | --- | --- | --- | --- |
| ZCode | [respire-zcode](https://github.com/risense-ai/respire-zcode) | Local marketplace source | `.claude-plugin/marketplace.json` | `{"decision":"block","reason":…}` |
| Kimi Code | [respire-kimi](https://github.com/risense-ai/respire-kimi) | `/plugins install` (GitHub or local path) | `kimi.plugin.json` | `hookSpecificOutput.permissionDecision: "deny"` |
| Dim | [respire-dimcode](https://github.com/risense-ai/respire-dimcode) | `dim plugin marketplace` | `.codex-plugin/plugin.json` | `{"decision":"block","reason":…}` |
| Qoder | [respire-qoder](https://github.com/risense-ai/respire-qoder) | `qoder plugins install` | `.qoder-plugin/plugin.json` | `{"decision":"deny"}` |
| WorkBuddy | [respire-workbuddy](https://github.com/risense-ai/respire-workbuddy) | `install.sh` or the `codebuddy` CLI | `.codebuddy-plugin/marketplace.json` | `hookSpecificOutput.permissionDecision` |
| Hermes | [respire-hermes](https://github.com/risense-ai/respire-hermes) | Directory memory provider | `plugin.yaml` | turn-end check via the provider API |

Per-host pages: [ZCode](./zcode.md) · [Kimi Code](./kimi.md) · [Dim](./dimcode.md) · [Qoder](./qoder.md) · [WorkBuddy](./workbuddy.md) · [Hermes](./hermes.md)

The engine is the same everywhere. Installing a plugin never installs the engine: when `rsrs` is missing the plugin hands `npm i -g @rsrsai/cli@latest` to the agent, which installs it inside the session — no manual step required. Registration works once per machine: sign up at [rsrs.rs](https://rsrs.rs), then run `rsrs register`; daily use is `rsrs login` (browser authorization) and `rsrs status` to check state. Auto-sync stays on; `rsrs sync` forces a round.

## First use

1. **Register and sign in.** Create an account at [rsrs.rs](https://rsrs.rs), then run `rsrs register` on the device. Works fully without a model.
2. **Import existing rules and memories (one-off, LLM-extracted).** Start a session in the host and paste the import prompt from the host page — it walks the agent through your `AGENTS.md` files and skill files, extracts reusable facts, conventions and red lines (secrets excluded — only their location is recorded), deduplicates, and stores everything with `rsrs remember`.
3. **Optional: the on-device model.** `rsrs model install && rsrs model activate m3` for stronger semantic recall. Skip it and everything still works.

## Tuning

Every adapter reads the same configuration file, `respire.config.json`, next to its hooks (create it from the bundled `respire.config.example.json`; changes apply to new sessions and never touch login state):

| Field | Default | Meaning |
| --- | --- | --- |
| `rsrs` | `""` | Engine path; empty = auto-detect (`PATH` → `~/.local/bin` → `~/.rsrs/bin`, host-specific extras) |
| `recall_threshold` | `0.0` | Recall score floor; **0 = off (the engine emits results unfiltered)** — set a positive value to enable filtering |
| `recall_limit` | `5` | Titles per round |
| `min_prompt_chars` | `2` | Prompts shorter than this skip recall |
| `session_rules` | `true` | Inject the SessionStart ground rules |
| `budget_chars` | `1500` | Total injection budget per round |
| `enabled` | `true` | Master switch; `false` silences the whole memory layer |
| `store_nudge_every` | `1` | Stop-check throttle: `1` = every round, `N` = every N rounds, `0` = off |
| `skip_prefixes` | `[]` | Host-internal prompts (case-insensitive prefixes) that skip recall and store |
| `log` | `true` | Append one line per event to `hook.log` (rotated past 256 KB) |

Filtering is off by default on purpose: the noise is already bounded by the engine skip gate, the limit of 5 and the title tier. Lowering the threshold has historically rescued false negatives — a missed memory costs more than two extra title lines.

## Troubleshooting

- **Hooks apply to new sessions.** After installing or updating a plugin, start a new session; running sessions do not hot-reload (Kimi Code: `/reload`).
- **Cold-start window.** Engine cold start plus model load measured 7s+, hence hook timeouts of 20s. A failed probe surfaces diagnostics at session start instead of failing silently.
- **Recall quality is bounded by the engine.** On vocabulary gaps BGE-M3 may miss a real record; the ground rules tell the model to re-query with synonyms, broader terms or English words.
- **Every event leaves a trace.** `hook.log` in the data directory records one line per event (timestamp, event, output size, duration, query summary) — read it to judge whether recall "works".

## Data safety

The library is local; a fresh configuration is offline mode (no network, no account — recall and store work, writes queue locally and sync after login). Only ciphertext reaches the cloud: records are encrypted on the device before upload, and the server never holds account decryption keys. Enterprises can self-host the sync server ([server deployment](../server-deployment.md)) so data never leaves the network.
