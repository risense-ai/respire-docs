# Respire for Kimi Code

[respire-kimi](https://github.com/risense-ai/respire-kimi) installs the respire memory engine into Kimi Code through the standard `/plugins` flow: title-tier recall on every round, one-prefix store, Stop storage check. See the [plugin overview](./index.md) for the shared runtime behavior, first-use steps and tuning reference.

## Install

```bash
/plugins install https://github.com/risense-ai/respire-kimi
# or from a local path:
/plugins install /local/path/to/respire-kimi
```

Run `/reload` or open a new session (`/new`) to activate. The plugin is **user-level** — it lands in `$KIMI_CODE_HOME/plugins/managed/respire/` and applies to all your projects, not a single one.

Upgrade from the `/plugins` panel (update respire, or reinstall over it), then `/reload`.

When the engine (`rsrs`) is missing, the plugin hands `npm i -g @rsrsai/cli@latest` to the agent, which installs it; recall and store recover within the same session.

## What happens in a session

| Moment | Behavior |
| --- | --- |
| Whole session | `systemPromptPath` (SYSTEM.md) keeps the ground rules permanently in the system prompt: recall before answering, store before finishing, check memory on errors, secret-handling red lines |
| `SessionStart` (startup/resume) | Loads the `skills/respire` playbook skill and runs a one-shot state probe; guidance for engine-missing / not-signed-in / empty-library / model-missing states is written to a `.pending_nudge` state file (Kimi SessionStart output does not reach the model) and surfaced at the top of the first `UserPromptSubmit` |
| `UserPromptSubmit` | Automatic `rsrs recall --titles`: title-tier injection — score + short id + title only; slash-command tokens (`/skill:…`, `/respire:…`) are stripped before querying; unfiltered by default |
| Store prefixes | 「记：」 / 「存：」 / `remember:` → straight `rsrs remember … --importance important`; near-duplicates are reported back as candidates for the model to decide |
| `Stop` | Storage check: a `hookSpecificOutput.permissionDecision: "deny"` JSON runs one extra round prompting the model to store this session's new facts; `stop_hook_active=true` releases the follow-up round |
| `/nomem` prefix | Recall skipped for the turn |
| Slash commands | `/respire:recall <term>`, `/respire:store <content>`, `/respire:sync`; the skill itself loads via `/skill:respire:respire` |

## Enable and disable

| Level | How | Scope |
| --- | --- | --- |
| Single turn | `/nomem` prompt prefix | This turn's recall only |
| Master switch | `"enabled": false` in `respire.config.json` | Whole memory layer silent (recall / store / storage check) |
| Plugin level | `/plugins disable respire` | Kimi-side full off |

## First use

1. Register at [rsrs.rs](https://rsrs.rs), then `rsrs register`. Daily: `rsrs login`, `rsrs status`.
2. Import existing rules — paste this into a new session:

   > Import my existing Kimi Code rules and memories into respire: read, one by one — `~/.kimi-code/AGENTS.md` (user-level rules, if present), the `AGENTS.md` at the roots of your usual projects, and `~/.agents/skills/*/SKILL.md`; extract reusable facts, conventions, lessons and red lines (secrets, ID numbers, card numbers, private keys are always excluded — record only their location), deduplicate, then store them item by item with `rsrs remember` (`--importance important`, titles as fact sentences; when deduplication offers candidates, decide: attach or merge). Give me an inventory when done.

   An empty library gets the same nudge on day one, surfaced through the first prompt.
3. Optional model: `rsrs model install && rsrs model activate m3`.

## Tuning

Config file: `$KIMI_CODE_HOME/plugins/managed/respire/hooks/respire.config.json` (missing = all defaults; `/reload` or a new session applies changes). Shared fields are documented in the [overview](./index.md#tuning). Kimi-specific: `session_rules` controls the state probe and `.pending_nudge` guidance only — the ground rules themselves come from `systemPromptPath` and stay loaded all session.

## Uninstall

```text
/plugins remove respire
```

## Known limits

- **Real-machine install loading is not CI-verified**: the manifest and hook shapes are statically aligned with the official documentation (checked 2026-10-23); the actual loading path after `/plugins install` should be confirmed on your machine.
- The `SessionStart` matcher covers `startup|resume` only; after a long-session compaction, `/reload` or a new session restores the rules.
- Recall quality is bounded by the engine; cold-start window gives hook timeout 20s, recall 14s, probe 10s.

Tests and design notes live in the [repository README](https://github.com/risense-ai/respire-kimi#readme).
