# Respire for DeepSeek Harness

<img src="/agents/dsh.png" alt="DeepSeek Harness logo" width="56" height="56">

[respire-dsh](https://github.com/risense-ai/respire-dsh) is a native memory plugin for DeepSeek Harness.

## Install

Requires Node.js 24+, an installed `rsrs` CLI and a running host Runtime. The plugin README validates Harness 0.2.1-rc.2; other versions and a complete desktop conversation have not been verified. Prepare and unlock the engine first, then ask the Harness agent to use `plugin_manager`:

```json
{"action":"install_bundle","target":"@rsrsai/dsh"}
```

Restart Harness and confirm exactly one enabled `respire-memory` entry. A terminal npm install alone does not activate it. Remove an old `@rsrsai/respire-dsh` bundle through plugin management before installing the replacement. The [repository README](https://github.com/risense-ai/respire-dsh#readme) also describes a Discover market.

## Use

After restarting, open a new conversation and ask about an existing memory to check recall. To save a fact, start with “记：” or “remember:”; check the reported status and inspect the record when needed.

## Behavior and configuration

By default, the plugin recalls up to five titles on accepted user input; `recallLimit` can be set from 1 to 20. Prefixes `记：`, `存：`, `记录：`, `记住：`, and `remember:` request one write. A valid ID confirms a write; read-back checks the ID, title and content. Pending means nothing was written; a timeout or cancellation can be unconfirmed, so check the library before retrying. `/nomem` or `#nomem` skips automatic recall for that input. A successful explicit store suppresses the bounded stop reminder.

Configure the installed `respire-memory` row in the Harness patch layer. Defaults: `enabled: true`, `rsrsPath: rsrs`, `recallLimit: 5`, `recallThreshold: 0`, `budgetChars: 1500`, `minPromptChars: 2`, `storeNudgeEvery: 1`, and `timeoutMs: 20000`. Set `storeNudgeEvery: 0` to disable reminders. The config row replaces the whole plugin config.

If Client 2 manages the CLI, set `rsrsPath` to the executable’s absolute path. See the [plugin overview](./index.md#using-the-client-managed-cli) for its location; check the path again after updating the client-managed CLI.

## Privacy and troubleshooting

Titles and receipts enter persistent model-visible messages and may reach the model provider. Credential detection is best-effort; remove secrets before submitting. The plugin does not manage the runtime or accounts. If recall fails, check `rsrs --version` and `rsrs --client-only status --json` in the Harness execution environment. Disable or remove the plugin through Harness plugin management.
