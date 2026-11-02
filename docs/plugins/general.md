# Respire for Agent Plugins {#respire-for-agent-plugins}

[respire-general](https://github.com/risense-ai/respire-general) is the portable package for clients that support [Agent Plugins 1.0](https://agent-plugins.org/) but have no dedicated respire adapter. It exposes the memory layer through two standard components only: one Agent Skill and one MCP server. There are no host hooks and no host-specific manifest.

Use it when the client can load a skill and talk to MCP but does not provide a plugin hook lifecycle. When the client has a dedicated adapter, prefer that adapter: the hooks automate recall and storage instead of relying on the model to follow instructions.

## Package layout {#package-layout}

```text
respire-general/
├── plugin.json                 # Agent Plugins 1.0 manifest
├── mcp.json                    # node mcp/respire-mcp.mjs -> rsrs mcp
├── skills/respire/SKILL.md
├── mcp/respire-mcp.mjs
├── lib/inject.mjs
└── scripts/setup-inject.mjs
```

## Install {#install}

### 1. Engine {#_1-engine}

```bash
npm i -g @rsrsai/cli@latest
rsrs --version
```

Without global write permission:

```bash
npm config set prefix ~/.npm-global
npm i -g @rsrsai/cli@latest
```

### 2. Plugin {#_2-plugin}

Copy the whole `respire-general` directory into the client's local plugin root, or use the client's directory install command, then restart the session. The package contains no installer and does not install the engine.

### 3. Register {#_3-register}

Sign up at [rsrs.rs](https://rsrs.rs), then run `rsrs register` on the device. Daily use is `rsrs login`; `rsrs status` checks state.

## What the client gets {#what-the-client-gets}

| Component | Behavior |
|---|---|
| Skill `respire` | Tells the model when to recall, how to store, title rules, and safety boundaries |
| MCP `respire` | Starts `rsrs mcp` through a thin stdio bridge; exposes the memory tools (`memory_recall`, `memory_remember`, `memory_show`, ...) |
| No hooks | Recall and storage are agent-driven; there is no every-round automatic recall or Stop nudge |

The MCP bridge resolves the engine itself, including the Windows `.cmd` shim, so the client does not need to know how npm shims are launched.

## First-run inject for hookless hosts {#first-run-inject-for-hookless-hosts}

`rsrs inject` distributes the memory rules into a host instruction file (`CLAUDE.md`, `AGENTS.md`, `MEMORY.md`, ...). It is a one-time/refreshable file write, not a per-prompt hook.

```bash
node scripts/setup-inject.mjs --target auto
node scripts/setup-inject.mjs --target auto --check
```

The helper runs `rsrs inject --targets --json`, then:

1. `absent` or `stale` target → `rsrs inject --id <target>`;
2. `current` target → skip;
3. a successful inject is recorded in `inject-state.json` under the plugin data directory.

The MCP bridge performs the same check on first start when `auto_inject` is enabled (the default). It only acts when a host target is detected; mcode is skipped because `rsrs inject` has no mcode target. Disable it with `auto_inject: false`.

Configuration priority for the bridge and the setup helper:

1. `RESPITE_CONFIG`
2. `$PLUGIN_DATA/respire.config.json`
3. `$PLUGIN_ROOT/respire.config.json`

## Limits {#limits}

- Hooks are not part of Agent Plugins 1.0; the portable package cannot automate every turn.
- `rsrs inject` has no mcode target; mcode users should use the hooks package or a launcher with `--append-system-prompt-file`.
- Automatic inject writes a host instruction file; opt out with `auto_inject: false` if that is not desired.
- The MCP bridge needs `node` on the client's MCP `PATH`; the engine itself is a Node CLI.

## Verify {#verify}

```bash
node scripts/validate.mjs
node scripts/validate.mjs ../respire-minimax-code
node tests/run.mjs
```

The repository README documents the full checklist, including the inject tests and the MCP bridge test.
