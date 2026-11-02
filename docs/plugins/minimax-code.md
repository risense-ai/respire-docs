# Respire for MiniMax Code {#respire-for-minimax-code}

[respire-minimax-code](https://github.com/risense-ai/respire-minimax-code) attaches the respire engine to [MiniMax Code](https://github.com/MiniMax-AI/minimax-code) 0.4.0 and later through the official **MiniMax Plugin V1** format (`.minimax-plugin/`). It ships an Agent Skill, a stdio MCP server, and three lifecycle hooks: `SessionStart`, `UserPromptSubmit`, and `Stop`.

The package targets mcode 0.4.0+. It was verified against mcode 0.6.12 and 0.7.4. mcode 0.3.x is not supported: that line reads the portable root manifest, which ignores hooks.

## Package layout {#package-layout}

```text
respire-minimax-code/
├── .minimax-plugin/plugin.json   # schemaVersion 1: icon, category, mcp, skills, hooks
├── icon.png
├── respire.mcp.json              # node ./mcp/respire-mcp.mjs -> rsrs mcp
├── hooks/respire-hooks.json
├── hooks/scripts/respire-hook.mjs
├── mcp/respire-mcp.mjs
└── skills/respire/SKILL.md
```

## Install {#install}

### 1. Engine {#_1-engine}

```bash
npm i -g @rsrsai/cli@latest
rsrs --version
```

### 2. Plugin {#_2-plugin}

Put the `respire-minimax-code` directory under the active mcode profile's local plugin directory, then refresh `/plugins`:

```bash
mcode plugin marketplace list
mcode plugin list --available --marketplace local
```

The package can also be submitted to the official Marketplace as a V1 plugin; local installation does not require that review.

### 3. Register {#_3-register}

Sign up at [rsrs.rs](https://rsrs.rs), then run `rsrs register` on the device. Daily use is `rsrs login`; `rsrs status` checks state.

## Session behavior {#session-behavior}

| Moment | Behavior |
|---|---|
| `SessionStart` | Injects the memory ground rules and probes status once: not signed in, nearly empty library, or missing optional model; silent when ready |
| `UserPromptSubmit` | Runs `rsrs recall --titles` and injects the title tier — score, 8-character short id, title; the agent reads full records on demand. If the semantic recall budget expires, the adapter falls back to `rsrs diary --contains` (important records only) |
| Store prefixes | 「记：」/「存：」/ `remember:` → `rsrs remember … --importance important`; near-duplicates are returned as candidates for the model to decide |
| `Stop` | Storage check: `{"decision":"block","reason":…}` requests one extra round; `stop_hook_active=true` releases it |
| `/nomem` | Skips recall for the turn |
| `$skill:` | Stripped before recall so skill names do not pollute the query |

The hook parser caps one handler at 10 seconds. The adapter uses 3.5s for the semantic attempt, 7.5s for the whole recall (including lexical fallback), 5s for status, and 8s for store. Failures never block the session: the hook exits 0; recall and status degrade to silence, and a missing engine on store returns the install command.

## Configuration {#configuration}

Priority:

1. `RESPITE_CONFIG`
2. `$PLUGIN_DATA/respire.config.json`
3. `$PLUGIN_ROOT/respire.config.json`

Shared fields are documented in the [plugin overview](./index.md#tuning). MiniMax-specific notes:

- `store_force: true` skips judge-then-store for the `记：` shortcut when a large library makes dedup slow; the receipt states that dedup was skipped.
- `semantic_timeout_ms` controls the semantic attempt; the lexical fallback is capped by the overall 7.5s budget.
- `auto_inject` is irrelevant to mcode: `rsrs inject` has no mcode target.

## Verify {#verify}

```bash
node ../respire-general/scripts/validate.mjs .
node ../respire-general/tests/run.mjs --check
```

Official Marketplace validation runs through mcode's plugin tooling; local loading does not require that review. The package-level checks are listed above.

## Known limits {#known-limits}

- **0.4.0+ only.** mcode 0.3.x uses the portable root manifest, which ignores hooks.
- **Community registry.** The `MiniMax-Code-Plugins` validator requires a root `plugin.json`; the V1 package targets the official Marketplace instead. The portable `respire-general` package is the one suitable for the community registry.
- **Official listing.** A `v0.3.0` release is published on GitHub. Issue [#580](https://github.com/MiniMax-AI/minimax-code/issues/580) tracks the official submission path, and the package has not been added to the official catalog.
- **No model required.** Registration, login, sync and lexical recall work without BGE-M3; the model is an optional enhancement.

See the [repository README](https://github.com/risense-ai/respire-minimax-code#readme) for the full test log and design notes.
