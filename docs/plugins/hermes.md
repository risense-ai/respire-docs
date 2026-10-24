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

## Import existing memory

Hermes' built-in memory and an external provider **coexist**: after switching to respire, `MEMORY.md` / `USER.md` are still injected into the system prompt, but respire's `prefetch` does not read them. Pick the path that matches where the old memory lives.

### Built-in memory

`MEMORY.md` (agent notes) and `USER.md` (user profile) live in `$HERMES_HOME/memories/`, or `$HERMES_HOME/profiles/<name>/memories/` for a named profile. Entries are separated by `§`; the two files are capped at 2,200 and 1,375 characters.

The recommended path is to let Hermes migrate them in a fresh session, so `respire_remember` handles dedup and causal attachment:

> Read `$HERMES_HOME/memories/MEMORY.md` and `USER.md`, split each file into entries on `§`, and store each entry with `respire_remember`:
> - one factual "subject + action + result" title per entry, `importance=important`;
> - keep each fact intact; do not merge different facts into one entry;
> - on a `pending` result (similar candidates), decide first: attach with `parent` for the same fact, or `force` a new entry for a different fact;
> - finish by spot-checking 2-3 entries with `respire_recall`.

You can also write entries from the shell (note that `rsrs remember` defaults to `trivial`, so pass `important` explicitly):

```bash
rsrs remember "<entry>" --title "<fact-sentence title>" --importance important
```

For larger sets, `rsrs import <file.json>` takes a JSON array (use `rsrs export` output as the format sample; run `rsrs audit` afterwards to check for duplicates). Keep the built-in entries for a while after importing: confirm respire recall is reliable before trimming them, or the two copies will drift apart.

### Hermes session history

`rsrs extract` supports Hermes natively, but it extracts **session records**, not `MEMORY.md`:

```bash
rsrs extract --targets                       # confirm the hermes source is detected
rsrs extract --id hermes --dry-run           # preview
rsrs extract --id hermes --since 90d --limit 50
```

Each session becomes one memory (title `Hermes session <first request>`, body in the 【cause】【action】【result】 form) and lands as a root; tidy afterwards with `rsrs audit`, `rsrs candidates` and `rsrs tree-cure`. `--since` / `--limit` bound the run, and repeated runs skip unchanged sessions by source fingerprint.

### Other memory providers

Hermes has no cross-provider migration API: switching only deactivates the old provider, and its data stays on that service. Export from the old provider first (for example Honcho's conclusions / profile), turn it into the JSON array accepted by `rsrs import`, or have the agent read it in-session and call `respire_remember` per entry. `rsrs share-import` is only for rsrs subtree sharing, not a general importer.

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
- The optional `on_memory_write` hook is not implemented: entries added or changed through Hermes' built-in `memory` tool are not mirrored into rsrs automatically. Migrate them with [Import existing memory](#import-existing-memory); long-term automatic sync would require adding that hook.

Development and packaging live in the [repository README](https://github.com/risense-ai/respire-hermes#readme).
