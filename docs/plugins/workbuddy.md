# Respire for WorkBuddy

[respire-workbuddy](https://github.com/risense-ai/respire-workbuddy) installs the respire memory engine into WorkBuddy agent through the standard plugin marketplace: title-tier recall on every round, one-prefix store, Stop storage check. See the [plugin overview](./index.md) for the shared runtime behavior, first-use steps and tuning reference.

## Install

One line, no clone (straight from the GitHub marketplace source):

```bash
curl -fsSL https://raw.githubusercontent.com/risense-ai/respire-workbuddy/main/install.sh | bash
```

Or clone and run the installer — it locates the `codebuddy` CLI bundled with the WorkBuddy desktop app (set `CODEBUDDY_BIN=/path/to/codebuddy` for unusual locations), registers the marketplace, installs the plugin and verifies the registry and cache:

```bash
git clone https://github.com/risense-ai/respire-workbuddy.git && cd respire-workbuddy
bash install.sh                # install; upgrades if already installed
bash install.sh --github       # force the GitHub remote marketplace (ignore the local clone)
bash install.sh --uninstall    # uninstall (keeps the marketplace registration for easy reinstall)
```

Upgrading is just rerunning any install command — the git-backed marketplace pulls origin with `marketplace update` before `plugin update`.

**Fully quit and restart WorkBuddy after installing; effective from the next session.** Writing while WorkBuddy runs can be overwritten by its in-memory state — if it did not take effect after a restart, quit WorkBuddy and run the script again.

Manual fallback when the script fails:

```bash
codebuddy plugin marketplace add <absolute path to this repo> --name risense-workbuddy
codebuddy plugin install respire@risense-workbuddy
```

Repository layout is the standard two levels: `.codebuddy-plugin/marketplace.json` at the root is the marketplace manifest; the plugin body lives in `plugins/respire/` (its `.codebuddy-plugin/plugin.json` is the plugin manifest). Installs to `~/.workbuddy/plugins/cache/risense-workbuddy/respire/<version>/` (the WorkBuddy standard cache, auto-updated with the marketplace).

Verify:

```bash
ls ~/.workbuddy/plugins/cache/risense-workbuddy/respire/*/    # .codebuddy-plugin, hooks, skills all present
echo '{"prompt":"respire 测试"}' | python3 ~/.workbuddy/plugins/cache/risense-workbuddy/respire/*/hooks/respire.py UserPromptSubmit
```

When the engine (`rsrs`) is missing, the plugin injects `npm i -g @rsrsai/cli@latest` into the session; effective from the next session.

## What happens in a session

| Moment | Behavior |
| --- | --- |
| `SessionStart` | Injects the memory ground rules (whole session); one-shot three-state probe — registration / first-day seeding / optional model; silent when ready |
| `UserPromptSubmit` | Automatic `rsrs recall --titles`: title-tier injection — score + short id + title only; full records come with cause chains via `rsrs show <id>`; unfiltered by default |
| Store prefixes | 「记：」 / 「存：」 / `remember:` → straight `rsrs remember … --importance important`; near-duplicates reported back as candidates for the model to decide |
| `Stop` | Storage check: one extra round prompting the model to store this session's new facts; `stop_hook_active=true` releases the follow-up round |
| `/nomem` prefix | Recall skipped for the turn |
| `skills/respire` | On-demand playbook; the skill documents, the hooks act |

## Enable and disable

| Level | How | Scope |
| --- | --- | --- |
| Single turn | `/nomem` prompt prefix | This turn's recall only |
| Master switch | `"enabled": false` in `respire.config.json` | Whole memory layer silent (rules / recall / store) |
| Component level | The WorkBuddy plugin page toggles respire's **hook components** individually (`skill` / `hook` / `mcp` are native) | WorkBuddy-side off |

## First use

1. Register at [rsrs.rs](https://rsrs.rs), then `rsrs register`. Daily: `rsrs login`, `rsrs status`.
2. Import existing rules — paste this into a new WorkBuddy session:

   > Import my existing WorkBuddy rules and memories into respire: read, one by one — `~/.workbuddy/SOUL.md`, `~/.workbuddy/USER.md`, the `AGENTS.md`/`CODEBUDDY.md` at the roots of your usual projects, and `.workbuddy/skills/*/SKILL.md`; extract reusable facts, conventions, lessons and red lines (secrets, ID numbers, card numbers, private keys are always excluded — record only their location), deduplicate, then store them item by item with `rsrs remember` (`--importance important`, titles as fact sentences; when deduplication offers candidates, decide: attach or merge). Give me an inventory when done.

   An empty library gets the same nudge on day one.
3. Optional model: `rsrs model install && rsrs model activate m3`.

## Tuning

Config file: `~/.workbuddy/plugins/cache/risense-workbuddy/respire/<version>/hooks/respire.config.json` (missing = all defaults; new sessions apply changes). Shared fields are documented in the [overview](./index.md#tuning); this adapter adds `skip_prefixes` for host-internal prompts such as automated recaps.

## Uninstall

Prefer `bash install.sh --uninstall` (goes through the official CLI, registry stays clean). Move-based fallback when the CLI fails — the target **must be outside the plugins root** (a leftover directory with a manifest inside the root keeps loading as a plugin, double-running the hooks):

```bash
mv ~/.workbuddy/plugins/cache/risense-workbuddy/respire ~/.workbuddy/plugins-backup/respire.removed-$(date +%s)
codebuddy plugin uninstall respire@risense-workbuddy
```

## Known limits

- Recall quality is bounded by the engine; cold-start window gives hook timeout 20s, recall 14s, probe 10s.
- **PostCompact cannot re-inject** (the protocol event is side-effect only): after a long-session compaction, start a new session to restore the rules.
- No confirmed GUI install entry; use the script or the CLI. If your build has one (plugin page → marketplace → add local marketplace), it works too.

Tests and design notes live in the [repository README](https://github.com/risense-ai/respire-workbuddy#readme).
