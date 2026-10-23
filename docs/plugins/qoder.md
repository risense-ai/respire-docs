# Respire for Qoder

[respire-qoder](https://github.com/risense-ai/respire-qoder) is the Qoder port of the Dim adapter: it uses Qoder's plugin hooks to attach the respire engine to the agent loop — title-tier recall on every round, one-prefix store, a Stop storage check. See the [plugin overview](./index.md) for the shared runtime behavior, first-use steps and tuning reference.

## Install

### 1. Qoder plugin

From a directory:

```bash
qoder plugins install /absolute/path/to/respire-qoder
```

Or from a marketplace (the repository ships `.qoder-plugin/marketplace.json`):

```bash
qoder plugins marketplace add /absolute/path/to/respire-qoder
qoder plugins install respire-qoder@risense
```

After installing, run `/plugins reload` in a session or restart it. Qoder Desktop can also install from a local directory in the plugin settings; Desktop and CLI share the same plugin directory and manifests.

### 2. Engine (the agent can install it for you)

```bash
npm i -g @rsrsai/cli@latest
rsrs --version
```

Without global write permission, try:

```bash
npm config set prefix ~/.npm-global
npm i -g @rsrsai/cli@latest
```

The plugin probes for the engine every round; once installed, recall and store recover within the same session.

### 3. Register (first time)

Sign up at [rsrs.rs](https://rsrs.rs), then run `rsrs register`. Daily: `rsrs login`, `rsrs sync`, `rsrs status`.

## What happens in a session

| Moment | Behavior |
| --- | --- |
| `SessionStart` | Injects the memory ground rules; one-shot three-state probe — registration / first-day seeding / optional model; silent when ready |
| `UserPromptSubmit` | Automatic `rsrs recall --titles`: title-tier injection — score + short id + title only; the agent fetches full records with `rsrs show <id>`; unfiltered by default |
| Store prefixes | 「记：」 / 「存：」 / `remember:` → straight `rsrs remember … --importance important`; near-duplicates reported back as candidates for the model to decide |
| `Stop` | Storage check: a `decision: deny` JSON runs one extra round prompting the model to store this session's new facts; `stop_hook_active=true` releases the follow-up round |
| `/nomem` prefix | Recall skipped for the turn |
| `$skill:` prefix | Stripped before recall so skill names do not pollute the query |
| `skills/respire` | On-demand playbook; the skill documents, the hooks act |

## Differences from the Dim version

| Item | Dim | Qoder |
| --- | --- | --- |
| Manifest | `.codex-plugin/plugin.json` | `.qoder-plugin/plugin.json` |
| Plugin-root placeholder | `${CLAUDE_PLUGIN_ROOT}` | `${QODER_PLUGIN_ROOT}` |
| Config / log directory | plugin `hooks/` | `QODER_PLUGIN_DATA`, falling back to `hooks/` |
| Stop block | `{"decision":"block"}` | `{"decision":"deny"}` (Qoder documentation semantics) |
| Marketplace | `dim plugin marketplace` | Qoder local-directory install or marketplace |

## Tuning

Configuration priority: `RESPITE_CONFIG` environment variable → `$QODER_PLUGIN_DATA/respire.config.json` → `<plugin root>/hooks/respire.config.json`. Copy from the bundled example:

```bash
cp hooks/respire.config.example.json hooks/respire.config.json
```

Shared fields are documented in the [overview](./index.md#tuning). Qoder-specific: if you already wrote the respire instructions into `~/.qoder/rules` via `rsrs inject`, set `session_rules: false` to avoid double injection. Environment variables: `RESPIRE_BIN` (engine path), `RESPITE_RSRS` (legacy alias), `RESPITE_CONFIG`, `RESPITE_LOG`.

## Verify

```bash
python3 scripts/validate_plugin.py
bash tests/test_hooks.sh
```

Exercise the hook directly, independent of whether Qoder has loaded the plugin:

```bash
echo '{"hook_event_name":"UserPromptSubmit","prompt":"respire 记忆"}' \
  | python3 hooks/respire.py UserPromptSubmit
```

## Known limits

- Recall quality is bounded by the engine; cold-start window gives hook timeout 20s, recall 14s, probe 10s.
- **Not yet verified on a real Qoder install**: actual plugin loading and the Stop block effect in Qoder CLI/Desktop are unconfirmed; the hook scripts themselves have been exercised against real and stub engines. Qoder plugin mechanics follow the official docs: <https://docs.qoder.com/zh/cli/plugins-reference>, <https://docs.qoder.com/zh/cli/hooks-reference>.

Design notes live in the [repository README](https://github.com/risense-ai/respire-qoder#readme).
