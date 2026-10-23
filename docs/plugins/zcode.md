# Respire for ZCode

[respire-zcode](https://github.com/risense-ai/respire-zcode) installs the respire memory engine into ZCode through the standard plugin marketplace: title-tier recall on every round, one-prefix store, Stop storage check. See the [plugin overview](./index.md) for the shared runtime behavior, first-use steps and tuning reference.

## Install

The plugin ships without an install script and follows the ZCode marketplace flow from a local directory source:

```bash
git clone https://github.com/risense-ai/respire-zcode.git && cd respire-zcode
python3 scripts/validate_plugin.py                     # self-check: structure / manifest / hooks / secret scan
```

Then in the ZCode client:

1. **Plugin marketplace → Add → Add marketplace**: paste the cloned repository directory (marketplace root = repository root, manifest at `.claude-plugin/marketplace.json`).
2. **Personal → risense-zcode → respire → Install**.
3. Start a **new session** — the SessionStart rules injection confirms the hook is live.

The marketplace doubles as the manager: **Settings → Plugins** enables, disables or removes the plugin; removing the marketplace source (Plugin marketplace → Marketplace sources → risense-zcode) removes everything. When the engine (`rsrs`) is missing, the plugin injects the install command (`npm i -g @rsrsai/cli@latest`) into the session and the agent installs it — recovery is same-session once detection turns ready.

## What happens in a session

| Moment | Behavior |
| --- | --- |
| `SessionStart` | Injects the memory ground rules; one-shot three-state probe — registration guidance when not signed in, first-day seeding when the library has fewer than 10 records, optional model install when BGE-M3 is missing; silent when ready |
| `UserPromptSubmit` | Automatic `rsrs recall --titles`: title-tier injection — score + 8-character short id + title only; the agent fetches full records with `rsrs show <id>`; unfiltered by default (noise bounded by the engine skip gate, limit 5, title tier) |
| Store prefixes | 「记：」 / 「存：」 / `remember:` → straight `rsrs remember … --importance important`; near-duplicates are reported back as candidates for the model to decide |
| `Stop` | Storage check: `{"decision":"block","reason":…}` runs one extra round prompting the model to store this session's new facts; `stop_hook_active=true` releases the follow-up round (ZCode itself caps extensions at three) |
| `/nomem` prefix | Recall skipped for the turn |
| `skills/respire` | On-demand playbook (recall / remember / show / forget / sync); the skill documents, the hooks act |

## ZCode protocol notes

Three substantive differences from the sibling adapters, verified against the ZCode runtime source:

1. **Output channel is JSON, not plain text.** ZCode accepts only hook stdout that starts with `{` and passes a strict schema — plain text is silently dropped and invalid JSON fails the hook. All injections therefore go through a top-level `{"additionalContext": "…"}` (consumed on SessionStart, UserPromptSubmit and Stop alike).
2. **Stop block decisions are the `approve|block` enum.** Use `{"decision":"block","reason":…}`; the `"deny"` value used by the Qoder adapter fails the ZCode schema.
3. **Data directory is `ZCODE_PLUGIN_DATA`** (probe chain `RESPITE_DATA` → `ZCODE_PLUGIN_DATA` → script directory); stdin carries the full event fields (`prompt` / `stop_hook_active` / `hook_event_name`), with argv → stdin → `ZCODE_HOOK_EVENT` as the event fallback chain.

## First use

1. Register at [rsrs.rs](https://rsrs.rs), then `rsrs register`. Daily: `rsrs login`, `rsrs status`.
2. Import existing rules — paste this into a new ZCode session:

   > Import my existing local rules and memories into respire: read, one by one — `~/.zcode/AGENTS.md` (home-directory rules, if present), the workspace-root and per-project `AGENTS.md` files, and `~/.agents/skills/*/SKILL.md`; extract reusable facts, conventions, lessons and red lines (secrets, ID numbers, card numbers, private keys are always excluded — record only their location), deduplicate, then store them item by item with `rsrs remember` (`--importance important`, titles as fact sentences; when deduplication offers candidates, decide: attach or merge). Give me an inventory when done.

   An empty library gets the same nudge injected on day one.
3. Optional model: `rsrs model install && rsrs model activate m3`.

## Tuning

Config file: `hooks/respire.config.json` inside the installed plugin (missing = all defaults; new sessions pick up changes). The shared fields are documented in the [overview](./index.md#tuning); the ZCode adapter adds `skip_prefixes` for host-internal prompts such as automated recaps.

## Uninstall

**Settings → Plugins** → disable or remove respire; or delete the marketplace source (Plugin marketplace → Marketplace sources → risense-zcode) to remove everything at once.

## Known limits

- Recall quality is bounded by the engine — on vocabulary gaps, re-query with synonyms or broader terms.
- Cold-start window: hook timeout 20s, recall 14s, probe 10s; failed probes surface diagnostics at session start.
- ZCode caps Stop extensions at three per session; this layer nudges at most once per round.
- Install and update apply to new sessions only.

Tests and release process live in the [repository README](https://github.com/risense-ai/respire-zcode#readme).
