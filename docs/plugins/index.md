# Respire plugins

Respire provides a separate plugin for each host. Recall, storage, wrap-up and configuration differ by host; consult the host page. Plugins do not bundle the `rsrs` engine; install and prepare it using the [getting-started guide](../getting-started.md).

Select a host name for installation, usage, configuration and troubleshooting. Dim uses a letter placeholder; the other icons identify the host or its brand.

## Hosts

| Host | Repository | Install path | Manifest | Stop contract |
| --- | --- | --- | --- | --- |
| <img src="/agents/zcode.png" alt="" width="24" height="24"> [ZCode](./zcode.md) | [respire-zcode](https://github.com/risense-ai/respire-zcode) | Local marketplace source | `.claude-plugin/marketplace.json` | `{"decision":"block","reason":…}` |
| <img src="/agents/kimi.png" alt="" width="24" height="24"> [Kimi Code](./kimi.md) | [respire-kimi](https://github.com/risense-ai/respire-kimi) | `/plugins install` (GitHub or local path) | `kimi.plugin.json` | `hookSpecificOutput.permissionDecision: "deny"` |
| <img src="/agents/dimcode.svg" alt="" width="24" height="24"> [Dim](./dimcode.md) | [respire-dimcode](https://github.com/risense-ai/respire-dimcode) | `dim plugin marketplace` | `.codex-plugin/plugin.json` | `{"decision":"block","reason":…}` |
| <img src="/agents/qoder.png" alt="" width="24" height="24"> [Qoder](./qoder.md) | [respire-qoder](https://github.com/risense-ai/respire-qoder) | `qoder plugins install` | `.qoder-plugin/plugin.json` | `{"decision":"deny"}` |
| <img src="/agents/workbuddy.png" alt="" width="24" height="24"> [WorkBuddy](./workbuddy.md) | [respire-workbuddy](https://github.com/risense-ai/respire-workbuddy) | `install.sh` or the `codebuddy` CLI | `.codebuddy-plugin/marketplace.json` | `hookSpecificOutput.permissionDecision` |
| <img src="/agents/hermes.png" alt="" width="24" height="24"> [Hermes](./hermes.md) | [respire-hermes](https://github.com/risense-ai/respire-hermes) | Directory memory provider | `plugin.yaml` | reminder during a later prefetch |
| <img src="/agents/codex.png" alt="" width="24" height="24"> [Codex](./codex.md) | [respire-codex](https://github.com/risense-ai/respire-codex) | npm marketplace | `.codex-plugin/plugin.json` | asynchronous background check |
| <img src="/agents/pi.png" alt="" width="24" height="24"> [Pi](./pi.md) | [respire-pi](https://github.com/risense-ai/respire-pi) | `pi install npm:@rsrsai/pi` | `package.json` | background check after settlement |
| <img src="/agents/dsh.png" alt="" width="24" height="24"> [DSH](./dsh.md) | [respire-dsh](https://github.com/risense-ai/respire-dsh) | `plugin_manager` | `package.json` | at most one reminder per turn |
| <img src="/agents/magpie.svg" alt="" width="24" height="24"> [Magpie](./magpie.md) | [respire-magpie](https://github.com/risense-ai/respire-magpie) | `magpie plugin add` | `package.json` | background archive after response |

Per-host pages: [ZCode](./zcode.md) · [Kimi Code](./kimi.md) · [Dim](./dimcode.md) · [Qoder](./qoder.md) · [WorkBuddy](./workbuddy.md) · [Hermes](./hermes.md) · [Codex](./codex.md) · [Pi](./pi.md) · [DSH](./dsh.md) · [Magpie](./magpie.md)

Prepare the CLI and Runtime as described below, then sign in and unlock the library according to the host page. Some older adapters suggest installing `rsrs-cli` when the engine is missing; the user decides whether to run it.

## Using the client-managed CLI {#using-the-client-managed-cli}

Client 2 can install the CLI and Runtime from its **Updates** page without npm. The client does not necessarily add the executable to PATH, so an agent may not discover it automatically.

By default, the executable is under `~/.rsrs/client2/runtime/<version>/rsrs` (on Windows, `rsrs.exe`); replace `<version>` with the installed version. If `RSRS_DATA_DIR` is set for Client 2, use that directory instead of `~/.rsrs`. When entering a path in plugin settings, use the full absolute path; do not assume the plugin expands `~`. Alternatively, add the executable directory to the host’s PATH. Restart the host if needed, and verify its connection to the running Runtime. An update can change the versioned path, so check it again after updating.

Codex accepts `RESPIRE_RSRS_PATH`, Pi accepts `--respire-rsrs`, and DSH has `rsrsPath`. ZCode, Kimi, Qoder and Hermes support `RESPIRE_BIN`; Dim and WorkBuddy accept `RESPITE_RSRS` or their own `rsrs` setting. Environment variables must reach the host process. Magpie connects directly to the local HTTP Runtime and does not need a CLI path in its plugin settings.

## Tuning

The table applies to most Python hook adapters. Check each host page for its configuration location and supported fields; Hermes, Codex, Pi, DSH and Magpie use different configuration.

| Field | Default | Meaning |
| --- | --- | --- |
| `rsrs` | `""` | Engine path; empty = auto-detect (`PATH` → `~/.local/bin` → `~/.rsrs/bin`, host-specific extras) |
| `recall_threshold` | `0.0` | Recall score floor; **0 = off (the engine emits results unfiltered)** — set a positive value to enable filtering |
| `recall_limit` | `5` | Titles per round |
| `min_prompt_chars` | `2` | Prompts shorter than this skip recall |
| `session_rules` | `true` | Inject the SessionStart ground rules |
| `budget_chars` | `1500` | Total injection budget per round |
| `enabled` | `true` | Master switch; `false` silences the whole memory layer |
| `store_nudge_every` | `1` | Stop-check throttle: `1` = every round, `N` = every N rounds, `0` = off |
| `skip_prefixes` | Host-specific | Host-internal prompts (case-insensitive prefixes) that skip recall and store |
| `log` | `true` | Append one line per event to `hook.log` (rotated past 256 KB) |

Filtering is off by default on purpose: the noise is already bounded by the engine skip gate, the limit of 5 and the title tier. Lowering the threshold has historically rescued false negatives — a missed memory costs more than two extra title lines.

## Troubleshooting

Check `rsrs --version` and `rsrs --client-only status --json`, then confirm the plugin is loaded as described on its host page. Some Python hooks write query fragments to local `hook.log`; redaction is not a complete secret scanner, so protect the logs.

## Data safety

Recalled content and receipts may enter host context and reach the model provider. Local encryption does not change this; see each host page for background processing and data flows.
