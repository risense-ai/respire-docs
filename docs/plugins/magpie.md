# Respire for Magpie

<img src="/agents/magpie.svg" alt="Magpie logo" width="56" height="56">

[respire-magpie](https://github.com/risense-ai/respire-magpie) connects Magpie to a local Respire HTTP Runtime and can organize completed turns in a separate background worker.

## Install

Requires Magpie 0.1.1273+, Bun 1.3.6+, and an installed, running and unlocked Respire HTTP Runtime. The plugin README recommends Magpie 0.1.2208+ for local agent origin detection; settings hot reload requires 0.1.1531+. These host version claims have not been independently verified here.

Before installing, confirm in Client 2 Overview or Diagnostics that the local Runtime is connected, and make sure the library is unlocked. The Magpie plugin connects to Runtime over HTTP; it does not require `rsrs` to be available in the terminal. If you use a standalone CLI, you can also check with `rsrs --client-only status --json`.

```sh
magpie plugin add @rsrsai/magpie
```

Configure the Runtime and archive model in the plugin page. Saving settings does not test connectivity. A local install may point to a complete plugin directory; keep that directory in place. See the [repository README](https://github.com/risense-ai/respire-magpie#readme).

## Use

Enable the required options on the plugin page, then open a new conversation and ask about an existing memory to check recall. When saving a fact, check the background result; if it is unconfirmed, inspect the library before retrying.

## Behavior and configuration

Only `local` and `magpie-key` origins are accepted. The plugin reads policy and relevant memory before a response. Explicit storage is pending until background processing completes; pending is not a write receipt. `/nomem` and `#nomem` skip current recall only; enabled background `archive` or `capture` can still run.

`archive` defaults to true and requires `generationBaseUrl` and `generationModel`. After an eligible response, a separate worker may save a process diary and organize new facts. `capture` defaults to false; `readOnly` disables this plugin's writes. Runtime defaults to `http://127.0.0.1:15169` and accepts only literal loopback addresses. Remote generation endpoints require HTTPS. Other settings and bounds are listed in the README.

## Privacy and troubleshooting

Archive sends turn messages, tool content and relevant memories to the configured generation provider and may incur model usage. Set credentials in the host environment; `authorizationEnv` stores the variable name only. Encrypted state and backups default to `~/.rsrs/magpie`, but the encryption key is stored in the same directory. Protect the entire directory.

A disabled or removed plugin cannot immediately notify an already detached worker. The worker checks control before new generation and writes and has a 280-second budget. Unconfirmed writes are not automatically retried. The host does not expose real SessionStart, resume or compaction events, and queueing cannot recover a completion notification lost before enqueue. When unavailable, check Client 2 connection status and the plugin settings; standalone CLI users can also run `rsrs --client-only status --json`.
