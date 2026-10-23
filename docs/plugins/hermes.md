# Respire for Hermes Agent

[respire-hermes](https://github.com/risense-ai/respire-hermes) implements the [Memory Provider Plugins](https://hermes-agent.nousresearch.com/docs/developer-guide/memory-provider-plugin) contract, so Hermes shares the same local encrypted library as the other agents on this machine (ZCode, Kimi Code and friends). Unlike the hook adapters, it is a **directory provider**: Hermes calls it through the provider API rather than shell hooks. See the [plugin overview](./index.md) for the shared tuning reference.

## What it does

- **`prefetch` every turn**: recalls the title tier for the current query (score + short id + title, truncated to the budget); the agent reads full records with `respire_show`
- **`system_prompt_block`**: injects the usage rules plus a state probe (engine missing / not signed in / empty library / model missing — one section each, silent when ready)
- **Three tools**: `respire_recall` / `respire_show` / `respire_remember` (store-with-judgment: near-duplicates return candidates; the model decides to attach or force-write)
- Prompts starting with 「记：」 / 「存：」 / `remember:` are stored directly by the provider; `/nomem` disables automatic recall for the turn
- A turn-end check nudges storage only when the session produced something new
- fail-open: engine missing, timeout or parse failure degrade to an empty injection — the host turn is never blocked

It is a **wrapper-style provider with zero Python dependency footprint**: the engine is the npm-installed `rsrs` CLI called as a sidecar subprocess. The plugin root carries no `pyproject.toml` / `pip_dependencies`, so it enjoys the `HERMES_HOME` survival contract (`hermes update` leaves the directory alone). Note that the respire library itself is **user-level** — one library per person shared across all agents and Hermes profiles, by design, unlike Hermes' per-profile storage default. Hermes allows only one external memory provider at a time.

## Install

Prerequisites: Python 3.9+ (bundled with Hermes) and Node.js (for the engine sidecar).

```bash
# 1) Engine (skip if installed; verify with rsrs --version)
npm i -g @rsrsai/cli@latest
rsrs register --user <your name>   # first-device registration, sign up at https://rsrs.rs
# semantic recall (optional): rsrs model install && rsrs model activate m3

# 2) Plugin (either way)
bash scripts/install.sh                 # copies into $HERMES_HOME/plugins/respire/
# or manually: cp -R this directory (minus .git/dist) to ~/.hermes/plugins/respire/

# 3) Activate
hermes memory setup                     # pick respire in the wizard (asks only for the rsrs path; empty = auto-detect)
# or set memory.provider: respire in config and restart Hermes
```

Verify with `hermes respire status` (the subcommand exists only while this provider is active).

## Configuration

The wizard is minimal by design (`rsrs_path` only). Optional settings live in **`$HERMES_HOME/respire.json`** (see `respire.config.example.json`). The shared fields are documented in the [overview](./index.md#tuning); Hermes adds `auto_recall` (default `true` — `false` keeps only the tools). Environment variables: `RESPIRE_BIN` / `RESPITE_RSRS` (engine path), `RESPITE_CONFIG` (config file path), `RESPITE_LOG` (log path). Logs go to `$HERMES_HOME/respire/plugin.log`.

## Tools

| Tool | Arguments | Notes |
| --- | --- | --- |
| `respire_recall` | `query` (required), `limit` (default 8, ≤20) | Title-tier recall |
| `respire_show` | `id` (first 8 characters of the short id) | Full record plus upstream/downstream cause chain |
| `respire_remember` | `content` (required), `title`, `importance`, `parent`, `force` | Store with judgment; `pending` = candidates awaiting decision |

A read-only skill `respire:respire` (the full memory playbook) is also registered.

## Known limits

- **No real-machine E2E yet**: the contracts were taken item by item from the official memory-provider-plugin documentation (2026-10-23 edition); local verification used a structure-equivalent stub plus a real `rsrs` engine tool/prefetch/config loop (`tests/test_provider.py`). If real-machine behavior differs, the most likely spots are `get_tool_schemas()` (OpenAI function format, inferred) and `get_status_config()` (flat dict, inferred).
- The desktop settings-panel file (`config_schema.py`) has no published format; configure by editing `respire.json` for now.

Development and packaging live in the [repository README](https://github.com/risense-ai/respire-hermes#readme).
