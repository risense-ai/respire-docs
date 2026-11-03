# memTools desktop companion

memTools is a Tauri 2 desktop quick-capture app for the local rsrs runtime. It is separate from the [desktop client](../client.md): the client manages a runtime and account, while memTools is a hotkey panel for writing and reviewing memories.

- Repository: <https://github.com/risense-ai/respire-memtool>
- Connection: MCP over HTTP (JSON-RPC 2.0) to `http://127.0.0.1:15169/mcp`
- Hotkey: `Ctrl+Alt+R` toggles the panel; `Esc` and the close button only hide it to the tray
- Window: drag any edge or corner to resize (minimum `360×400`); the panel remembers its size and position. Narrow windows move secondary graph controls into the **Display** menu and trim the legend; wide windows split the capture view into content and destination columns

## What it does

| Area | Behavior |
|---|---|
| Capture | Main area or diary, one of the 23 taxonomy roots, then a `type` (`context` / `decision` / `preference` / `task` / `emotion` / `time` / `skill`) |
| Duplicates | On a suspected duplicate it offers change / merge / attach / store-new, and backs up before destructive choices |
| Automation | Local rules for tier and tree, two recall rounds for duplicates, optional OpenAI-compatible endpoint for tier/tree; falls back to local rules with an explicit warning |
| Diary | Written as `importance=trivial`, skipping duplicate checks and tree attachment |
| Review | Recent memories, keyword search, semantic `rsrs recall`, reminders for `【触发】` dates, read-only 3D graph from `onememory.db` |
| Capture surfaces | System tray, browser extension, Windows selection bubble, Explorer "add to knowledge base" |
| Updating | Reads `update.json` from GitHub Releases, verifies SHA-256, self-replaces on Windows |

`memtools.exe --ai` opens the AI window directly.

## Install

Download from GitHub Releases: `memtools-<version>.exe` (portable), `.msi`, or the NSIS `.exe`. Release builds are unsigned, so Windows warns about an unknown publisher and macOS needs an explicit allow in System Settings.

On first start memTools checks for the `rsrs` command and installs the CLI through npm or pnpm when it is missing. The runtime itself still has to be running on port 15169; memTools never stops or restarts it unless you confirm the restart in the rsrs panel.

Configuration is read in this order:

1. `MEMTOOLS_CONFIG` environment variable
2. `%APPDATA%\com.memtools.desktop\config.toml` (macOS `~/Library/Application Support/...`, Linux `$XDG_CONFIG_HOME/...`)
3. `config.toml` next to the executable (portable)
4. Built-in defaults

## AI window and knowledge base

The AI window is a separate window (top-bar **AI** button) that both chats with a local agent CLI and ingests material into a knowledge base.

Layout of one ingested item:

```
<knowledge base root>/<year>/<month>/<topic>-<timestamp>/
  original/     source file or directory, unchanged
  <title>.md    organized Markdown
```

The agent writes the result into rsrs following the change / merge / attach / store-new rules, and records the file path plus device in the body.

### Agent sources

The source dropdown lists five entries and probes each one live:

| Source | Needed on the machine | Detection |
|---|---|---|
| opencode | `npm i -g opencode-ai` | `opencode --version`; models from `opencode models` |
| Qoder CLI | Qoder IDE (bundles `qodercli`) | `qodercli --version`, then `qodercli status` for the account line |
| Claude Code | `npm install -g @anthropic-ai/claude-code` | `claude --version`; runs as a `custom` agent |
| Codex CLI | `npm install -g @openai/codex` | `codex --version`; runs as a `custom` agent |
| Custom CLI | Any CLI that takes a prompt and prints the answer | `--version`, or accepted as-is when the configured binary exists |

When a source is missing or not logged in, selecting it expands an **install and configure** panel with the reason, the install command, the login steps, the parameters that will be used, the detected path, and a documentation link. The command can be copied with one click.

After installing, press **Detect again**, then **Bind**. Binding writes the choice to `knowledge_base.json`, which overrides `config.toml`.

Qoder's `qodercli` ships inside the IDE and is not on `PATH`, so a bare `qodercli` in PowerShell fails with "term is not recognized". Use the absolute path, or add the directory to `PATH`:

```powershell
& "D:\...\Qoder\resources\app\resources\bin\x86_64_windows\qodercli.exe"
# then type /login inside the interactive session
```

The login hint in the window carries the detected absolute path and the `& "…"` call syntax.

### Models

The model field is a free-text input backed by a suggestion list:

| Source | Model values |
|---|---|
| opencode | `provider/model`, for example `opencode/big-pickle`; the list comes from `opencode models` |
| Qoder CLI | `auto`, `efficient`, `gmodel`, `kmodel`, `lite`, `mmodel`, `performance`, `q35model`, `qmodel`, `ultimate` |
| Claude / Codex / custom | Whatever the CLI accepts; empty means the CLI default |

Switching sources clears the field, because the model vocabularies do not overlap.

### Driving a custom CLI

Claude Code and Codex CLI are bound as `kind = "custom"` with prefilled parameters. The same mechanism covers any other CLI:

```toml
[processor.agent]
kind = "custom"
bin = "crush"                                    # command name or absolute path
args = ["run", "--model", "{model}", "{prompt}"]  # one array element per argv
env = ["CI=1"]                                    # KEY=VALUE
models = ["claude-sonnet", "gpt-5"]               # optional model suggestions
output = "json"                                   # text | json | opencode-json | qoder-json
```

Placeholders: `{prompt}`, `{model}`, `{session}`, `{endpoint}`, `{workdir}`, `{agent}`. An element that becomes empty after substitution is dropped instead of being passed as an empty argument.

Output parsers:

| `output` | Expected stdout |
|---|---|
| `text` | Plain text; the whole stdout becomes the answer |
| `json` | One JSON object; reads `result`, `text`, `content`, `response`, `output`, then `message` |
| `opencode-json` | NDJSON event stream; takes the text of the last message |
| `qoder-json` | `{"type":"result","result":"…"}` |

The binding keeps the interface choice above `config.toml`: `knowledge_base.json` stores the source, binary, model, and — for custom sources — the argument template, environment, and output parser. Clearing a field falls back to `config.toml`.

## Platform notes

| Capability | Windows | macOS / Linux |
|---|---|---|
| Capture, review, search, reminders, graph, tray, hotkey | Yes | Yes |
| AI window and knowledge base ingest | Yes | Yes (native folder picker is Windows-only; type the path elsewhere) |
| Explorer right-click "add to knowledge base" | Yes | No |
| Selection bubble | Yes | No |
| Automatic update download and replace | Yes | Check only |

The browser extension talks to the local endpoint on port 17650; its token lives in `extension_token.txt` in the app config directory.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `runtime 不可达` | rsrs runtime is not listening on 15169; start it with `rsrs status` or the host application |
| A source shows **not ready** | Open that entry and follow the install panel: install, log in, **Detect again** |
| `xxx is not recognized as a cmdlet` | The CLI is not on `PATH`; use the absolute path from the panel, or add its directory to `PATH` and reopen the terminal |
| Binding succeeds but the first run fails | Re-check the version with **Detect again**, and confirm the model format (`provider/model` for opencode) |
| `config.toml` edits seem ignored | The AI window choice in `knowledge_base.json` wins; bind again after editing the file |
| Windows warns about an unknown publisher | Release builds are not code-signed |

## See also

- [CLI](../cli.md) for the memory commands the agent uses
- [Runtime RPC](../runtime-rpc.md) for the local protocol
- [Client](../client.md) for the separate Wails desktop client
