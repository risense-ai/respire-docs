# Respire for OpenClaw

[respire-openclaw](https://github.com/risense-ai/respire-openclaw) installs the respire memory engine into [OpenClaw](https://docs.openclaw.ai) as a native TypeScript plugin: title-tier recall injected before every turn, seven rsrs tools for the agent, judge-then-store receipts. See the [plugin overview](./index.md) for the shared runtime behavior, first-use steps and tuning reference.

## Install

```bash
# from a local checkout (dev):
git clone https://github.com/risense-ai/respire-openclaw.git
cd respire-openclaw && npm install && npm run build
openclaw plugins install --link ./respire-openclaw

# or from GitHub:
openclaw plugins install git:github.com/risense-ai/respire-openclaw
```

The engine (`rsrs`) is discovered automatically (`npm i -g rsrs-cli@latest` when missing — the plugin hands the command to the agent and recovers within the same session).

### Enable conversation hooks

The per-turn recall hook is a prompt-modifying conversation hook, so OpenClaw requires explicit permission for non-bundled plugins. In `openclaw.json`:

```json5
{
  plugins: {
    entries: {
      respire: {
        enabled: true,
        hooks: { allowConversationAccess: true },
        config: {},
      },
    },
  },
}
```

Then verify with `openclaw plugins inspect respire --runtime --json`. Hook permission key names follow docs.openclaw.ai/plugins/hooks (checked 2026-11); if your version rejects the key, consult that page for the current schema.

## What happens in a session

| Moment | Behavior |
| --- | --- |
| First prompt of a session | Compact respire rules injected as system context, plus a one-shot engine probe: engine-missing / not-signed-in / empty-library / model-missing guidance (probe cached with `status_ttl_ms`) |
| Every turn (`before_prompt_build`) | Automatic `rsrs recall --titles`: title-tier injection — score + short id + title only, budgeted; slash-command tokens are stripped before querying; unfiltered by default |
| Store prefixes | 「记：」/「存：」/「记住：」/`remember:`/`store:` → nothing is written by the plugin; a pending-placement handoff tells the model to judge (update > merge > attach > new) and store via the tools or the CLI |
| Agent tools | `respire_recall` / `respire_show` / `respire_chain` / `respire_remember` / `respire_update` / `respire_attach` / `respire_status`; `important` without a verified parent never writes |
| `/nomem` prefix | Recall skipped for the turn |
| Slash commands | `/respire-recall <query>`, `/respire-status`, `/respire-sync` |

## Enable and disable

| Level | How | Scope |
| --- | --- | --- |
| Single turn | `/nomem` prompt prefix | This turn's recall only |
| Recall switch | `"recall_enabled": false` in the plugin config | Tools/commands/rules stay, auto recall stops |
| Master switch | `"enabled": false` in the plugin config | Whole memory layer silent |
| Plugin level | `openclaw plugins disable respire` | OpenClaw-side full off |

## First use

1. Register at [rsrs.rs](https://rsrs.rs), then run `rsrs register` on the gateway machine. Daily: `rsrs login`, `rsrs status`.
2. Import existing rules — ask the agent on any OpenClaw-connected surface:

   > Import my existing rules and memories into respire: read, one by one — `~/AGENTS.md`, the `AGENTS.md` at the roots of your usual projects, and `~/.agents/skills/*/SKILL.md`; extract reusable facts, conventions, lessons and red lines (secrets, ID numbers, card numbers, private keys are always excluded — record only their location), deduplicate, then store them item by item with `respire_remember` (importance `important` with a verified parent, titles as fact sentences). Give me an inventory when done.

   An empty library gets the same nudge on day one, injected with the session rules.
3. Optional model: `rsrs model install && rsrs model activate m3`.

## Tuning

Config: `plugins.entries.respire.config` in `openclaw.json` (validated against the manifest `configSchema`; reload the plugin after changes). Shared fields are documented in the [overview](./index.md#tuning). OpenClaw-specific keys: `recall_enabled` (auto recall off, tools and rules stay) and `status_ttl_ms` (probe cache lifetime).

## Uninstall

```text
openclaw plugins remove respire
```

## Known limits

- **No Stop-phase storage check** — OpenClaw has no blocking end-of-turn hook, so the family's one-extra-round nudge does not exist here; the rules block carries the "store before finishing" duty instead. Store when the turn produced facts.
- **No PreToolUse write guard** — the write guards live inside the tools themselves. Raw `rsrs remember` calls from the agent's shell bypass the plugin guard by design; engine-side policy still applies.
- **Real-gateway loading is not CI-verified**: manifest and API shapes are statically aligned with docs.openclaw.ai (checked 2026-11); verify on your gateway with `openclaw plugins inspect respire --runtime --json`.
- The prompt-injection permission requires `hooks.allowConversationAccess` in your `openclaw.json`; without it the tools and commands still work but per-turn recall stays off.

Tests and design notes live in the [repository README](https://github.com/risense-ai/respire-openclaw#readme).
