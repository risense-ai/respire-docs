# Respire for Codex

<img src="/agents/codex.png" alt="Codex logo" width="56" height="56">

[respire-codex](https://github.com/risense-ai/respire-codex) is a native Codex memory plugin, distributed from npm as `@rsrsai/codex`: recall on user input, store on explicit request, and a background check on eligible turns that organizes new findings. Unlike the hook adapters, it is a Node.js extension and only ever invokes `rsrs --client-only` — it never starts, stops or upgrades the runtime. See the [plugin overview](./index.md) for the shared tuning reference.

## Install

Requires Node.js 24+, npm, Git, a local Codex client with plugins/hooks support, and an installed `rsrs` CLI. On Windows, npm/pnpm rsrs wrappers also need PowerShell 7.3+ (`pwsh`), or set `RESPIRE_RSRS_PATH` to a native `rsrs.exe` for direct execution. Checked against Codex CLI 0.163.0; desktop clients need the same plugin and hooks interfaces, while Work Cloud, web clients and environments with hooks disabled are not validated.

Prepare the engine (skip if it already works):

Use the CLI installed by Client 2, or install it separately only if needed. If the host cannot find it, see [CLI access for plugins](./index.md#using-the-client-managed-cli).

```sh
rsrs --version
rsrs --client-only status --json
```

Sign in, unlock the library and configure models through rsrs's own interface; the host runtime must already be running.

Add the repository's marketplace and install its npm-backed entry:

```sh
codex plugin marketplace add risense-ai/respire-codex --ref main
codex plugin add respire@rsrsai
```

The marketplace manifest comes from the repository; **the plugin itself downloads from npm as `@rsrsai/codex`**, not as a Git package dependency. The manifest tracks `latest`; to pin a version, add this entry to your own marketplace's `plugins` array:

```json
{
  "name": "respire",
  "source": {
    "source": "npm",
    "package": "@rsrsai/codex",
    "version": "0.2.15",
    "registry": "https://registry.npmjs.org"
  },
  "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" },
  "category": "Productivity"
}
```

Running `npm install -g @rsrsai/codex` alone does not register a Codex plugin.

Then restart Codex, confirm Respire is enabled in the plugin interface, and open hook management (`/hooks` in the CLI) to **review and trust** the `SessionStart`, `UserPromptSubmit` and `Stop` hooks. New or changed hooks after an upgrade require review again; this cannot be bypassed. In a new conversation, test recall for a known project and test storage with a fact you explicitly approve.

The plugin does not remove existing AGENTS.md instructions from `rsrs inject` or other memory hooks. If several sources perform automatic recall or stop reminders, review their roles and keep one to avoid duplicates.

## Upgrade

```sh
codex plugin marketplace upgrade rsrsai
codex plugin add respire@rsrsai
```

Restart Codex, confirm the version in the plugin details, and review changed hooks in `/hooks`. If the version is stale right after a release, npm metadata may be cached — in PowerShell:

```powershell
$env:npm_config_prefer_online = 'true'
codex plugin add respire@rsrsai --json
Remove-Item Env:npm_config_prefer_online
```

Restore the variable instead of removing it if it already had a value. Check the returned version before testing; reinstalling the old version is not an upgrade. There is no need to uninstall the plugin or delete its state.

## Behavior

| Trigger | Result |
| --- | --- |
| `SessionStart` (startup, resume, clear, fork, compaction) | Injects the memory workflow rules and checks engine status |
| Ordinary user input | Synchronous `recall --titles --json` — at most 5 titles within 1500 characters; the agent reads bodies as needed |
| 「记：」, 「存：」, 「记录：」, 「记住：」, `remember:` | Attempts `remember` once and returns a success, pending or unconfirmed receipt |
| `/nomem` or `#nomem` followed by whitespace | Skips automatic recall for that input; library mode is unchanged and stop checks may still run |
| `Stop` | At most one background memory check per eligible turn; a successful explicit store suppresses it |

Storage receipts have three states. **Success** carries an actual record id — that confirms the write. **Pending** means the engine found near-duplicates and has **not written**: the agent reads the candidates and decides whether to update, merge or attach. **Unconfirmed** means the outcome is unknown (timeout, cancellation, missing valid id): the write may have committed, so check the library first — the plugin does not retry. `plan` mode skips explicit storage.

Memory titles are reference data, not instructions. On eligible turns, Stop starts an asynchronous background task that reads the turn’s messages, tool results and relevant memories and may organize and write memories. If the outcome is unconfirmed, inspect the library before retrying. Subagent hooks are not enabled.

## Configuration, state, and privacy

- `RESPIRE_RSRS_PATH`: optional executable path or command name; defaults to `rsrs`. `PLUGIN_ROOT` and `PLUGIN_DATA` are provided by Codex; state is never written to the installation directory.
- Each engine call is limited to 20 seconds and 1 MiB of stdout; hook timeouts are 30/30/300 seconds.
- On Windows, arguments travel as JSON on stdin to a constant PowerShell adapter — user input is never interpolated into script source.
- `PLUGIN_DATA/sessions/` stores hashed identifiers, processing stages, deduplication flags, and archive progress and results — no transcript text or passwords. Each session keeps the latest 32 turns.
- State updates use locks and atomic replacement. A `.lock` left by a crash makes subsequent recall/storage in that session report failure and skip; remove the lock file or start a new session once that session's hooks have stopped.
- Common credential patterns are skipped, but this is not a complete secret scanner — remove sensitive content before submitting. Injected titles and receipts enter Codex context and may reach the configured model provider; local encryption does not change that.
- Raw engine stderr is not logged, only error categories; failures let the user's primary task continue.

If `/hooks` shows zero Respire hooks, check that the intended installation is enabled and contains `.codex-plugin/plugin.json` and `hooks/hooks.json`. If hooks are listed but inactive, review their trust status and restart. If a hook reports an engine error, run `rsrs --client-only status --json` and the setup skill.

The background task may send the triggering turn’s messages, tool results and relevant memories to the configured model provider. Tests and release process live in the [repository README](https://github.com/risense-ai/respire-codex#readme).
