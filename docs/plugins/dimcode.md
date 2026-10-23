# Respire for Dim

[respire-dimcode](https://github.com/risense-ai/respire-dimcode) installs the respire memory engine into Dim agent through the standard plugin marketplace: title-tier recall on every round, one-prefix store, Stop storage check. See the [plugin overview](./index.md) for the shared runtime behavior, first-use steps and tuning reference.

## Install

```bash
git clone https://github.com/risense-ai/respire-dimcode.git && cd respire-dimcode
python3 scripts/validate_plugin.py                     # self-check: structure / manifest / hooks / secret scan
dim plugin marketplace add .agents/plugins/marketplace.json
dim plugin install respire@risense
```

Upgrade by pulling the source repository and reinstalling:

```bash
git pull
dim plugin marketplace upgrade risense     # refresh the registered source — the marketplace loads the registration-time snapshot
dim plugin install respire@risense --overwrite
```

If you customized `hooks/respire.config.json`, copy it back from the old directory afterwards (old defaults do not upgrade automatically). Installs to `~/.dimcode/v2/plugins/respire/` (CN distribution; Global uses `~/.dim/v2/plugins/`, source runs default to `~/.agents/plugins/` — copied installs, so source edits require reinstalling).

Verify:

```bash
ls ~/.dimcode/v2/plugins/respire                 # .codex-plugin, hooks, skills all present
echo '{"prompt":"respire 测试"}' | python3 ~/.dimcode/v2/plugins/respire/hooks/respire.py UserPromptSubmit
```

Two Dim quirks worth knowing (verified against source): `dim` has **no** `plugin list` subcommand, and `dim hooks list` shows only project/user config, **not plugin hooks** — an empty list does not mean the hook is off. Check the plugin body in the TUI / Desktop plugin page; effectiveness is confirmed by a new session.

When the engine (`rsrs`) is missing, the plugin injects `npm i -g @rsrsai/cli@latest` into the session; effective from the next session.

## What happens in a session

| Moment | Behavior |
| --- | --- |
| `SessionStart` | Injects the memory ground rules (effective for the whole session and subagents); one-shot three-state probe — registration / first-day seeding / optional model; silent when ready |
| `UserPromptSubmit` | Automatic `rsrs recall --titles`: title-tier injection — score + short id + title only; full records come with cause chains via `rsrs show <id>`; unfiltered by default |
| Store prefixes | 「记：」 / 「存：」 / `remember:` → straight `rsrs remember … --importance important`; near-duplicates reported back as candidates for the model to decide |
| `Stop` | Storage check: `block` + reason runs one extra round prompting the model to store this session's new facts; `stop_hook_active=true` releases the follow-up round |
| `/nomem` prefix | Recall skipped for the turn |
| `$skill:` prefix | Stripped before recall so skill names do not pollute the query |
| `skills/respire` | On-demand playbook; the skill documents, the hooks act |

## Enable and disable

| Level | How | Scope |
| --- | --- | --- |
| Single turn | `/nomem` prompt prefix | This turn's recall only |
| Master switch | `"enabled": false` in `respire.config.json` | Whole memory layer silent (rules / recall / store) |
| Component level | The Dim plugin page toggles respire's **hook components** individually (`skill` / `hook` / `mcp` are native) | Dim-side off |

## First use

1. Register at [rsrs.rs](https://rsrs.rs), then `rsrs register`. Daily: `rsrs login`, `rsrs status`.
2. Import existing rules — paste this into a new Dim session:

   > Import my existing Dim rules and memories into respire: read, one by one — `~/AGENTS.md` (home-directory rules, if present), the `AGENTS.md` at the roots of your usual projects, `~/.dimcode/v2/skills/*/SKILL.md`, `~/.dimcode/v2/hooks.json`, and the md files under `~/.dimcode/v2/notes/` and `plan-drafts/`; extract reusable facts, conventions, lessons and red lines (secrets, ID numbers, card numbers, private keys are always excluded — record only their location), deduplicate, then store them item by item with `rsrs remember` (`--importance important`, titles as fact sentences; when deduplication offers candidates, decide: attach or merge). Give me an inventory when done.

   An empty library gets the same nudge on day one.
3. Optional model: `rsrs model install && rsrs model activate m3`.

## Tuning

Config file: `~/.dimcode/v2/plugins/respire/hooks/respire.config.json` (missing = all defaults; new sessions apply changes). Shared fields are documented in the [overview](./index.md#tuning).

## Uninstall

`dim` has no `plugin uninstall` subcommand (verified against source) — uninstall by moving, and the target **must be outside the plugins root** (a leftover directory with a manifest inside the root keeps loading as a plugin, double-running the hooks):

```bash
mv ~/.dimcode/v2/plugins/respire ~/.dimcode/v2/plugins-backup/respire.removed-$(date +%s)
```

## Known limits

- Recall quality is bounded by the engine; cold-start window gives hook timeout 20s, recall 14s, probe 10s.
- **PostCompact cannot re-inject** (the Dim protocol event is side-effect only): after a long-session compaction, start a new session to restore the rules.
- Effective from new sessions; running sessions do not hot-reload.

Tests and design notes live in the [repository README](https://github.com/risense-ai/respire-dimcode#readme).
