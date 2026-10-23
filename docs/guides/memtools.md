# memTools desktop capture {#memtools-desktop-capture}

memTools is an optional Windows companion for Respire. It stays in the system tray, opens a small window on a global hotkey, and writes a thought, fact, decision or diary entry into the local rsrs library through the loopback runtime. It also captures selected text from any application, offers one-click save targets, can pre-process text with a model or a local agent, scans `【触发】` dates for due reminders, and renders the library as a 3D point cloud. A Chrome and Edge extension saves web selections into the same library.

This page describes memTools `0.5.1` (commit `1b7ed18`). Statements were checked against the source of that version; the interface was not re-tested end to end. Labels, tree counts and ports follow the running build and the local library.

memTools is a client only. It never starts, stops, copies or upgrades the runtime. See [Host runtime and upgrades](../runtime.md) for the runtime itself and [CLI commands](../cli.md) for the command line.

## Capabilities and scope {#capabilities-and-scope}

| Capability | Entry point | Result |
| --- | --- | --- |
| Capture to the main area | Window → record → main area → choose a tree → submit | Writes with `importance = important` under the chosen root |
| Capture a diary entry | Window → record → diary → submit | Writes with `importance = trivial` and joins the daily trail |
| Three-part template | Window → three-part template | Builds a body with `【前因】【行为】【后果】` |
| Automation | Footer toggle | Classifies, de-duplicates and picks a tree before writing |
| Model classification | `automation.mode` and `[automation.llm]` | The model decides importance, tree and title; falls back to local rules |
| Content processing | Record view → process | Summarize, structure, title, translate, extract or polish |
| Processing source | Task bar → source | Model, opencode, Qoder or off; takes effect on click |
| Quick targets | Header, selection panel, extension menu | One-click save to a frequent destination (up to 8, first is preferred) |
| Selection capture | Drag or double-click in any application | Popup next to the cursor saves the text or opens the window prefilled |
| Duplicate handling | Candidate list on submit | Update, merge, attach or create |
| Recent memories | Header → recent | Newest first, with tree filtering |
| Search | Header → search | Semantic search or an exact id prefix |
| Due reminders | Header → reminders and badge | Overdue, today, upcoming and later groups |
| 3D memory graph | Header → graph | Read-only point cloud with hover focus and live updates |
| Web capture | Chrome and Edge extension | Saves by quick target, optionally after processing |
| Self update | Footer → update | Check, download, SHA-256 verify and restart |
| Sync badge | Footer | Offline state, pending count and conflicts |
| Tray resident | System tray | Hotkey, selection and extension keep working after the window closes |

Deliberately out of scope:

- Starting, stopping, copying or upgrading the rsrs service. When the runtime is unreachable, memTools reports it and leaves the lifecycle to the host.
- Using `--direct`. Every call goes through the loopback HTTP endpoint.
- Building shell command strings. rsrs and agents are invoked with argument arrays.
- Updating or merging automatically in the browser extension. A near duplicate degrades to an attach and asks the user to confirm in the window.
- Guessing absolute dates for tasks.
- Full isolation for the agent tier. Content handed to a tool-enabled agent can still trigger tools.
- Graphical version history for memories. Updates and merges are irreversible; only backups help.

## Prerequisites {#prerequisites}

### Required environment {#required-environment}

| Item | Requirement | Check |
| --- | --- | --- |
| Operating system | Windows 10 or 11 x64 | `winver` |
| WebView2 | Usually included; install the Microsoft Edge WebView2 Runtime if missing | Installed apps |
| rsrs runtime | Local, default `http://127.0.0.1:15169` | `rsrs --client-only status` |
| Port 15169 | Free | `Get-NetTCPConnection -LocalPort 15169` |
| Port 17650 | Extension endpoint, configurable | `Get-NetTCPConnection -LocalPort 17650` |
| Permissions | Standard user; no administrator rights | — |

In a restricted or sandboxed environment, always pass `--client-only` to the CLI. memTools does not manage the service lifecycle.

### Optional capabilities {#optional-capabilities}

| Capability | Requires | Default |
| --- | --- | --- |
| Content processing (model) | An OpenAI-compatible `/v1/chat/completions` endpoint | `http://127.0.0.1:8125/v1/chat/completions`, model `qwen3:8b` |
| Content processing (agent) | `opencode` or `qodercli` on `PATH` | Auto-detected |
| Model classification | The same endpoint; `automation.mode` set to `high-quality` or `memory-gateway` | `local-fallback` |
| Self update | A reachable `update.json` | `http://127.0.0.1:17651/update.json` |
| 3D graph | `onememory.db` and `core-index` in the data directory | Taken from runtime `status.data_dir` |
| Selection capture | None; may conflict with other selection tools | Enabled at startup |

### Source build requirements {#source-build-requirements}

| Item | Requirement | Purpose |
| --- | --- | --- |
| Node.js | LTS, 20 or newer recommended | Front-end build and npm scripts |
| npm | Bundled with Node.js | Dependencies |
| Rust | Stable MSVC toolchain | Tauri backend |
| Visual Studio Build Tools | Desktop development with C++ | MSVC linker |
| Tauri CLI | Declared in `devDependencies` | Invoked through `npm run tauri` |

## Install and start {#install-and-start}

### Run a prebuilt executable {#run-a-prebuilt-executable}

1. Obtain `memtools.exe`; a source build places it at `src-tauri/target/release/memtools.exe`.
2. Double-click it. Expected: no window appears and the tray icon shows up.
3. Press `Ctrl+Alt+R`. Expected: the window opens at its last position or in the centre.
4. Check the runtime dot in the footer. Expected: green when rsrs is reachable, grey or red otherwise.

> The window starts hidden (`visible = false`). This is normal and not a failed start.

### Build from source {#build-from-source}

```powershell
cd <repo>
npm install
npm run tauri dev
npm run tauri build -- --no-bundle
```

The executable is written to `src-tauri/target/release/memtools.exe`. Do not distribute `cargo build --release` output: it lacks the `custom-protocol` feature and loads the development server, which can open a blank window.

### Startup checks {#startup-checks}

- [ ] `memtools.exe` appears in Task Manager.
- [ ] The tray icon is present with the tooltip `memTools · rsrs 记忆`.
- [ ] `Ctrl+Alt+R` shows and hides the window.
- [ ] The runtime dot is green, or recent memories refresh.
- [ ] The console shows `浏览器扩展端点已启动 http://127.0.0.1:<port>` when the extension endpoint is enabled.
- [ ] Selecting at least two characters in another application shows the `记` icon.

### Hide, exit and single instance {#hide-exit-and-single-instance}

| Action | Behavior |
| --- | --- |
| `—` or `✕` in the title bar | Hides to the tray; the process keeps running |
| `Esc` | Hides to the tray |
| Tray left click | Shows or hides the window |
| Tray right click → `显示面板` | Shows the window |
| Tray right click → `划词悬浮` | Toggles selection capture |
| Tray right click → `退出 memTools` | Exits the process |
| Starting the executable again | Wakes the existing window instead of starting a second process |

> Closing the window does not stop the hotkey, selection capture or the extension endpoint. Use the tray menu to exit.

## Interface overview {#interface-overview}

### Main window {#main-window}

| Region | Content | Notes |
| --- | --- | --- |
| Title bar | `memTools`, `rsrs 记忆`, `—`, `✕` | The whole bar drags the window; the buttons work |
| View switcher | record, recent memories, search, reminders, quick targets, graph | Switching views does not interrupt the record view |
| Input mode | free text, three-part template | The template splits cause, action and effect |
| Input | Multi-line text box | Limit 8000 characters |
| Input hint | `Ctrl+Enter 提交 · Esc 关闭` | Character count on the left, process button on the right |
| Processing bar | Source and six tasks | Model, opencode, Qoder or off |
| Save destination | Main area (`important`) or diary (`trivial`) | Layer one |
| Tree | Roots read from the runtime | Layer two, main area only |
| Type | `context`, `decision`, `preference`, `task`, `emotion`, `time`, `skill` | Layer three, optional, default `context` |
| Result | Success details or an error | The window stays open on failure |
| Footer | Automation, update, extension, sync badge, runtime dot | Layers one to three hide while automation is on |

### Selection panel {#selection-panel}

| State | Content |
| --- | --- |
| Collapsed | A 40×40 `记` icon, topmost, without focus and absent from Alt+Tab |
| Expanded | 280 pixels wide and 140 to 640 pixels tall: selection preview, source window, count and a vertical target list |
| Actions | Click a target to save; the last item opens the window prefilled; `×`, `Esc` or a click outside closes it |

## Capture a memory {#capture-a-memory}

Manual capture suits the case where the destination is already known.

### Capture to the main area {#capture-to-the-main-area}

Use it for reusable conclusions, decisions, configuration, procedures and failure notes.

1. Press `Ctrl+Alt+R`; focus lands in the input box.
2. Enter the body and include `【前因】【行为】【后果】` when possible.
3. Under save destination choose **main area**.
4. Choose a tree under tree root. Roots are grouped by human and AI domains.
5. Optionally choose a type; the default is `context`.
6. Press `Ctrl+Enter`.
7. Check the result panel for `action`, `id`, attach point, path and title.

The number and names of trees come from the runtime; a fresh library usually has 23.

Rules:

- The main area requires a tree. Submitting without one is rejected.
- The entry is written with `importance = important`.
- When markers are missing, they are derived from the paragraph structure:
  - one paragraph becomes `【行为】` with a warning;
  - two paragraphs become `【前因】` and `【行为】`;
  - three or more paragraphs become `【前因】`, `【行为】` and `【后果】`.
- Marker filling only adds markers; it never rewrites facts.
- The title is generated by the program and cannot be edited in the window.
- The result shows a path such as `root / … / this entry` so the attach point can be checked.

### Capture to the diary {#capture-to-the-diary}

Use it for what happened today, transient notes and activity trails.

1. Press `Ctrl+Alt+R`.
2. Write one clear sentence: who, when, where and what, ideally 20 to 60 characters.
3. Under save destination choose **diary**.
4. Press `Ctrl+Enter`.
5. The attach point reads `（日记，并入当日轨迹）`.

The entry is written with `importance = trivial`, skips tree selection and joins the daily trail. Reminder scanning skips diary entries.

### Use the three-part template {#use-the-three-part-template}

Use it to force a main-area entry into cause, action and effect.

1. Select **three-part template** in the input mode.
2. Fill the fields:
   - `【前因】`: background or cause, optional;
   - `【行为】`: what was done, required;
   - `【后果】`: result or conclusion, optional.
3. Choose the main area, a tree and a type.
4. Press `Ctrl+Enter`; the three fields are joined into a marked body.

> Submitting with an empty `【行为】` is rejected with `【行为】为空`.

### Title generation {#title-generation}

Titles are generated by `automation::build_title`:

1. Prefer the `【行为】` section, then `【前因】`, then the whole body.
2. Skip the `【触发】` line.
3. Strip a leading date or time token such as `2026-10-17` or `10:20`.
4. Cut at the first sentence end mark `。！？；;` or at 24 characters, never across sentences.
5. Fall back to `未命名记忆` when empty.

> Write the event in the title; do not use a tree name as the title.

### Trigger lines for tasks {#trigger-lines-for-tasks}

With type `task`:

1. An amber `【触发】` field appears above the input.
2. Enter a confirmed date, preferably `YYYY-MM-DD`, or a verifiable prerequisite.
3. Submitting without it returns `needs_trigger` and focuses the field. The program never guesses a date.
4. A value without `YYYY-MM-DD` is still saved, with a warning to confirm the prerequisite.

```text
【前因】需要在月底前完成记忆库整理
【行为】安排批量整理散根
【后果】待执行
【触发】2026-10-31
```

A task with a confirmed date enters the reminder scan.

### Input limits {#input-limits}

| Situation | Behavior |
| --- | --- |
| Empty content | Rejected with a prompt to enter content |
| More than 8000 characters | Rejected with a prompt to split the entry |
| Main area without a tree | Rejected with a prompt to select a tree |
| Empty `【行为】` in the template | Rejected |
| rsrs plugin hook timeout warning | Treated as non-fatal; the write usually succeeded |
| Runtime unreachable | Connection error; the window stays open and no service is started |
| Candidate list returned | Not saved yet; choose one of the duplicate actions |

## Duplicate candidates {#duplicate-candidates}

When rsrs returns similar candidates without writing, the result panel lists them and requires one action.

### Choose an action {#choose-an-action}

| Choice | Behavior | Notes |
| --- | --- | --- |
| Update | Rewrites the selected candidate | Single selection, first by default; backs up the original and reads it back |
| Merge | Merges all selected candidates into a new entry | Backs up every candidate and its children; check for orphan children |
| Attach | Creates the current content as a child of the selected candidate | Uses the first selected candidate |
| Create | Creates a new entry under a chosen tree | Only when nothing fits |

### Duplicate safety rules {#duplicate-safety-rules}

- A candidate must be selected before update, merge or attach; otherwise the panel reports `未选择候选`.
- Merge uses every selected candidate; update and attach use the first one.
- Create does not depend on candidates but requires a tree.
- Destructive choices are never silent; backups go to `{app_config_dir}/backups`.
- A candidate list is not a success. The entry exists only after a choice is applied.
- The automation attach branch also shows the local tree around the target (`memory_tree --outline`, depth 1, at most 8 nodes).

## Automation {#automation}

Automation suits the case where the user only wants to drop content in and let the tool decide where it belongs.

### Enable automation {#enable-automation}

1. Turn on the footer toggle; save destination, tree and type are hidden.
2. Optionally enter a project name or keywords in the hint box to sharpen duplicate detection.
3. Enter the body and press `Ctrl+Enter`.
4. Without confirmation the entry is written and the branch, id and attach point are shown; otherwise the candidate list appears.

> The default is `automation.mode = "local-fallback"`: classification and tree choice use local rules and duplicate detection uses the local rsrs model. `high-quality` and `memory-gateway` additionally call `[automation.llm]`.

### Automation pipeline {#automation-pipeline}

| Stage | Rule |
| --- | --- |
| Classification | `important` when the body has all three markers, matches keywords such as `结论`, `决策`, `修复`, `配置` or `命令`, or reaches 120 characters. Otherwise `trivial` when it starts with `【` plus a digit or matches diary words such as `日记`, `今天` or `随手`. Otherwise `important` at 60 characters or more, else `trivial` |
| Diary shortcut | A `trivial` result goes straight to the diary without duplicate detection or tree choice |
| Marker fill | An `important` result without markers receives markers derived from paragraphs |
| Duplicate detection | Up to two recall rounds. With a hint, round one is the hint plus the first 30 characters and round two is the first 40 characters. Without a hint, round one is the first 40 characters and round two is the last 40 characters when the body is longer than 40. At most three candidates per round, de-duplicated and sorted by similarity |
| Tree choice | Keyword bigrams are scored against the names and descriptions of the tree roots; an exact name hit adds 5 points |

### Branches and thresholds {#branches-and-thresholds}

| Condition | Branch | Behavior | Confirmation |
| --- | --- | --- | --- |
| Classification is `trivial` | journal | Writes a diary entry in one step | No |
| Top similarity ≥ `dup_threshold` (default `0.85`) | confirm | Returns candidates and requires update, merge, attach or create | Yes |
| Top similarity ≥ `attach_threshold` (default `0.70`) | attach | Attaches under the most similar entry as `context` | No |
| No similar entry and a tree is found | create | Creates under that tree as `context` | No |
| No similar entry and no tree is found | confirm | Requires a manual tree choice | Yes |

Destructive branches are protected:

| Branch | Protection |
| --- | --- |
| Update | Reads and backs up the original under `{app_config_dir}/backups`, then reads it back and fails on a content mismatch |
| Merge | Backs up every candidate's content and children before merging |
| Attach, create, diary | Non-destructive; executed automatically |

Backup files are named `memtools-backup-<tag>-<millisecond timestamp>.json`. The local library has no version history, so verify that a merge did not leave orphan children.

### Model-assisted classification {#model-assisted-classification}

Set `automation.mode` to `high-quality` or `memory-gateway` and configure `[automation.llm]`:

```toml
[automation]
mode = "high-quality"

[automation.llm]
enabled = true
endpoint = "http://127.0.0.1:8125/v1/chat/completions"
model = "qwen3:8b"
api_key = ""
timeout_secs = 60
```

Behavior:

- A single call returns `importance`, `tree`, `title` and `reason`.
- Only valid importance values, tree names from the roots and 2 to 40 character titles are accepted. JSON fences and surrounding prose are stripped.
- Duplicate detection still uses rsrs semantic recall, and update or merge still needs confirmation.
- A failed or disabled model produces an explicit warning and falls back to local rules. The result label reads `判档：模型` or `判档：本地`.

### Automation boundaries {#automation-boundaries}

- Classification and tree choice are keyword rules or model output, not deep semantic reasoning. Ambiguous content can land in the wrong place; use manual capture for critical entries.
- Local duplicate detection chooses only among candidates returned by rsrs semantic recall.
- Automation does not guarantee that no new root appears: when no tree can be chosen it asks the user instead of creating one silently.
- Attach and update mark the adopted candidate as `good`; a new entry marks unadopted candidates as `bad`. This self-evaluation is best effort and is skipped when the candidate has left `query_log`.

## Quick targets {#quick-targets}

A quick target is an ordered, user-defined save destination. The first entry is the most preferred. The window, the selection panel and the extension share one list.

### Target types {#target-types}

| `kind` | Meaning | Write behavior |
| --- | --- | --- |
| `journal` | One-step diary | `importance = trivial`, no tree |
| `tree` | Attach to a node | `--title --parent <parent> --type <type> --importance <importance>` |
| `auto` | Automatic classify | Classify, de-duplicate, choose a tree, then act |

`parent` accepts a tree name such as `AI-domain`, a memory id, or a memory title.

### Manage targets {#manage-targets}

In the window, open header → `快捷目标`:

1. Add a target with `新增目标`.
2. Enter a display name of up to 24 characters and choose a type.
3. For `tree`, fill `parent` from the current trees and choose type and importance.
4. Reorder with the up and down buttons; the first entry is preferred.
5. Save, or restore the defaults: diary and automatic classification.

The extension options page edits the same list under the quick targets card.

Limits:

- At most 8 targets.
- `id` must be unique; `tree` requires `parent`.
- A `journal` target always uses `trivial`; a `tree` target defaults to `context` and `important`.
- The single source of truth is `{app_config_dir}/targets.json`. The extension's `chrome.storage.local` is only an offline cache.
- The extension menu refreshes every 10 minutes and falls back to the cache or a built-in list when memTools is unreachable.
- In `POST /remember`, `target_id` takes precedence over the legacy `mode`.

### Where targets appear {#where-targets-appear}

| Place | Appearance |
| --- | --- |
| Selection panel | One vertical list, the first target carries a `优先` badge, followed by `在 memTools 中选择…` |
| Extension menu | A submenu in target order with ① on the first entry, then `梳理后保存（AI 总结）`, `在 memTools 中选择…` and `打开 memTools` |
| Main window | Manual mode keeps destination, tree and type; quick targets are optional |

## Content processing {#content-processing}

Processing turns rough notes into a memory-shaped entry before it is stored. It does not open a chat window and does not change existing memories.

### Processing sources {#processing-sources}

| Tier | Source | Good for | Default |
| --- | --- | --- | --- |
| One | An OpenAI-compatible endpoint | Summarize, structure, title, translate, extract, polish | Yes |
| Two | A local headless agent CLI (opencode or Qoder) | Tasks that need the agent's tools or skills | No |

Switch under record → `梳理` → `来源` → **model**, **opencode**, **Qoder** or **off**. The change applies immediately without a restart.

- The choice is stored in `%APPDATA%\com.memtools.desktop\processor.json` and overlays `config.toml`.
- `config.toml` keeps defaults and advanced parameters such as `bin`, timeouts, work directory and tool lists.
- Choosing off is equivalent to `enabled = false`; choosing any source restores processing.
- Choosing an agent probes the CLI and reports `opencode 可用：<path>（version）` or a concrete failure reason.

### Processing tasks {#processing-tasks}

| Task | Key | Description |
| --- | --- | --- |
| Summarize as a memory | `summarize` | Produces an entry with `【前因】【行为】【后果】` |
| Structure | `structure` | Reorganizes by fields or sections |
| Title | `title` | A 2 to 60 character event title |
| Translate | `translate` | Target language from `lang`, default Chinese |
| Extract | `extract` | Returns a list of key points |
| Polish | `polish` | Rewrites without changing facts |

Chinese aliases such as `总结`, `标题` and `润色` are accepted by the HTTP layer.

### Processing workflows {#processing-workflows}

In the window:

1. Open record and enter or paste content.
2. Click `梳理`.
3. Confirm the source.
4. Click a task; the button shows a busy state.
5. The result replaces the input. A failure shows the reason and leaves the input untouched.
6. Store manually or through automation.

From the extension, choose `梳理后保存（AI 总结）`:

1. The selection is processed with `summarize`.
2. The result is stored through `auto` classification.
3. The notification title carries `（AI 梳理）`.
4. The timeout is 120 seconds instead of the usual 45.
5. A processing failure returns 502 or 503 and never stores the raw selection silently.

### Processing HTTP endpoints {#processing-http-endpoints}

`POST /process` processes without writing:

```json
{
  "content": "text to process",
  "task": "summarize",
  "lang": "中文"
}
```

The response contains `content`, `task`, `source` (`llm`, `opencode` or `qoder`) and `message`.

`POST /remember` accepts a `process` field to process first and then store:

```json
{
  "text": "original content",
  "target_id": "auto",
  "process": "summarize",
  "url": "https://example.com/page",
  "page_title": "page title"
}
```

| Situation | HTTP |
| --- | --- |
| Source disabled, off, unconfigured or agent not found | 503 |
| Unknown task or invalid JSON | 400 |
| Empty `/remember` text or processed content above 8000 characters | 400 |
| Model or agent call failed | 502 |
| Timeout, 240 seconds by default for an agent | 504 |
| Request body above 256 KB | 413 |

`/process` content checks such as empty content or `max_chars` surface as 502; `/remember` re-checks length before writing.

### Processing configuration {#processing-configuration}

```toml
[processor]
enabled = true
endpoint = "http://127.0.0.1:8125/v1/chat/completions"
model = "qwen3:8b"
api_key = ""
timeout_secs = 120
max_chars = 8000
agent_endpoint = ""

[processor.agent]
enabled = false
kind = "opencode"
bin = ""
model = ""
agent = ""
timeout_secs = 240
workdir = ""
pure = true
max_turns = 0
allowed_tools = ""
disallowed_tools = ""
extra_args = []
token = ""
token_env = ""
```

Prompts can be overridden per task and support `{content}` and `{lang}`:

```toml
[processor.prompts]
summarize = '''Summarize the content into an entry with 【前因】【行为】【后果】: {content}'''
```

### Agent safety {#agent-safety}

- Agents run as a child process with an argument array, never through a shell string, and without a console window on Windows.
- The default work directory is `{temp}/memtools-agent`, so the agent does not pick up the memTools repository or its `AGENTS.md`.
- opencode runs with `--pure` by default and can be further restricted with `--agent`.
- Qoder can be restricted with `max_turns`, `allowed_tools` and `disallowed_tools`.
- A timeout kills the process and returns 504; a missing or disabled agent returns 503; an agent error returns 502.
- Even with these limits the agent can execute tools. Do not send sensitive content to tier two.

## Reminders {#reminders}

Reminders are a UI-side scan, not a background service of the rsrs CLI.

### Reminder requirements {#reminder-requirements}

An entry must be non-diary and contain a verifiable `【触发】` line:

```text
【触发】2026-10-31
```

Only confirmed `YYYY-MM-DD` values count. Entries containing `无日期条件`, `待定`, `待确认`, `看情况` or `再议` are skipped, as are diary entries and entries that already carry `【完成】` or `【已完成】`.

### Reminder scanning {#reminder-scanning}

1. Open header → `提醒`. The badge counts overdue and today entries.
2. Groups are overdue, due today, upcoming within `reminder.soon_days` and later.
3. Each row shows the trigger date, title and remaining or elapsed days; click to expand.

The scan window starts at 200 entries, doubles on demand up to 1600, and reports `可能不全` at the cap.

### Reminder ignore and complete {#reminder-ignore-and-complete}

| Action | Behavior |
| --- | --- |
| Ignore | Records the current trigger date for that id in `{app_config_dir}/reminders/reminders.json`; a changed date makes the entry reappear |
| Complete | Backs up the body, appends `【完成】YYYY-MM-DD` through `memory_update` and reads it back; the scanner then skips it |

Remove the `【完成】` line to restore the reminder.

### Reminder background scan {#reminder-background}

- The first scan runs 8 seconds after startup, then every `reminder.interval_minutes`, 30 minutes by default.
- It updates the tray tooltip and broadcasts `reminders://due` to the window.
- The scan only reads rsrs data; ignore state lives in memTools' own configuration directory.
- There are no popups or sounds, only the tray tooltip and the badge.

## Memory graph {#memory-graph}

The graph renders the whole library as an interactive 3D point cloud and is strictly read-only.

### Graph data source {#graph-data-source}

- It opens `onememory.db` in the rsrs data directory read-only, safe with WAL.
- It reads `memories`, `core_artifacts`, `recall_pairs`, `entry_audit` and `query_log`.
- It decompresses m3 1024-dimensional vectors from `core-index` and projects them to 3D with deterministic PCA.
- The cache lives in `{app_config_dir}/graph/`: `basis.json` freezes the layout and `vectors.f32` stores vectors incrementally, so new memories do not reshuffle the layout.
- The data directory comes from runtime `status.summary.data_dir`; without a runtime it falls back to `RSRS_DATA_DIR`, then `~/.rsrs`, then the most recently modified library under `~/.rsrs/accounts/*`.

### Graph visual encoding {#graph-visual-encoding}

| Visual | Meaning |
| --- | --- |
| Hue | Tree root, spaced by the golden angle, with slight branch variation |
| Size | Recall heat |
| Opacity and glow | Importance |
| Shape | `kind` |
| Solid line | Parent-child relationship |
| Other line | Recall co-occurrence |

### Graph interaction {#graph-interaction}

| Action | Effect |
| --- | --- |
| Drag | Rotate |
| Wheel | Zoom |
| Hover | Focus after 50 ms and light up neighbours with a multi-source BFS |
| Click | Lock the focus; click empty space to release |
| Toolbar | Fit, auto-rotate, recompute PCA layout, reload the snapshot |
| Open graph | Enlarges the window; leaving restores it |
| Node details | Title, category, importance, recall count and a body preview; copy the id or jump to search |

The display menu offers non-focused transparency, 1 to 6 lit layers (default 3) and 1 to 500 nodes (default 20). When a layer does not fit, one layer fewer is shown so a single hub cannot light the whole tree.

A built-in `brain2.container.ply` with about 150000 points is voxelized to a real container volume. Nodes are mapped proportionally and pulled towards the centre until they are contained. The container toggle restores the plain PCA coordinates.

### Graph live updates {#graph-live-updates}

- Every 900 ms it polls `entry_audit` (create, update, delete, restore, purge), `query_log` (recall) and `memories.updated_at`.
- No Node bridge and no `plugins.json` hook are needed.
- Writes from memTools, opencode, MCP, the CLI and cloud sync are all visible.
- Recall candidates light up for 6 seconds.

### Graph boundaries {#graph-boundaries}

- The first build is slower on a large library; the cache speeds up later starts.
- The graph is read-only. Update, merge and delete belong to the window or the CLI.
- It depends on rsrs vector artifacts; without `core-index` it can only lay out by metadata and the semantics weaken.
- With no runtime and no discoverable data directory it shows an empty state.

## Browser extension {#browser-extension}

### Extension install {#extension-install}

1. Start memTools and confirm the tray icon.
2. Click `扩展` in the footer to see the port and token, then copy the token.
3. Open `chrome://extensions` in Chrome or Edge.
4. Enable developer mode.
5. Choose `加载已解压的扩展程序` and select the `extension` directory of the memTools repository.
6. Open the extension options, enter the port and token, save and test the connection.

> Clicking the toolbar icon opens the options page; there is no popup.

### Extension daily use {#extension-daily-use}

1. Select text on a page.
2. Right-click and choose `保存到 memTools`.
3. Pick a quick target or `梳理后保存（AI 总结）`.
4. Read the system notification:
   - success shows the destination, title and the first 8 characters of the id;
   - a suspected duplicate reports that it was attached and asks for a check in the window;
   - a processing failure returns 502 or 503 and does not store the raw text;
   - other failures show the HTTP status or reason.

The body receives a source line, `来源：《page title》URL`. The URL is truncated to 2000 characters and the line is omitted when there is no URL.

### Extension endpoint {#extension-endpoint}

| Item | Description |
| --- | --- |
| Listen address | `127.0.0.1` only, port `17650` by default |
| Authentication | `X-MemTools-Token` or `Authorization: Bearer <token>` |
| Routes | `GET /health`, `GET /targets`, `PUT /targets`, `POST /open`, `POST /remember`, `POST /process`, `GET /agent`, `GET /`, `OPTIONS` with 204 |
| Request body | 256 KB maximum |
| Body length | 8000 characters maximum |
| Mode | `journal` or `auto`, default `auto`; `target_id` wins when present |
| Timeouts | 45 seconds for the extension, 120 seconds for `process` |
| Errors | 401 unauthorized, 400 invalid JSON, empty content or unknown mode, 413 body too large, 502 write failed, 503 processing disabled, 504 agent timeout |

```json
{
  "text": "selected text to save",
  "target_id": "t1",
  "process": "summarize",
  "url": "https://example.com/page",
  "page_title": "page title",
  "title": "optional custom title"
}
```

`GET /targets` returns the target list and the trees. `PUT /targets` replaces the list with `{"targets":[...]}`. Tree reads are cached for 300 seconds with a 1.5 second fetch timeout and a 120 second background warm-up; when the runtime is down, `/targets` still answers quickly and returns an empty `taxonomy`.

Automatic mode never updates or merges from the extension. A high-similarity hit degrades to an attach and sets `needs_confirm`. When there is no similar entry and no tree can be chosen, the request fails and asks the user to pick a tree in the window.

### Extension token and port {#extension-token-and-port}

Token precedence:

1. A fixed `[extension] token` in `config.toml`;
2. An existing `%APPDATA%\com.memtools.desktop\extension_token.txt`;
3. Otherwise a 32-character hexadecimal token generated on first start and written to that file.

To rotate the token, exit memTools, delete the file or set a new fixed token, restart, then update the extension options and test again. Disable the endpoint with `[extension] enabled = false` and a restart.

### Extension security {#extension-security}

- The endpoint binds to loopback only. Except for the `OPTIONS` preflight, every route including `/health` requires the token.
- CORS is permissive so extension pages can call the endpoint, but writes still need the token.
- A leaked token equals local write access. Never commit it, paste it into chat or show it in a screenshot.
- `extension.pem` is a CRX signing key and `extension.crx` is a packaged build; do not distribute them publicly.

## Recent and search {#recent-and-search}

### Recent memories {#recent-memories}

1. Open header → `最近记忆`.
2. Set a count from 1 to 200; the default is 20.
3. Refresh; entries are sorted by `updated_at` descending.
4. Click a category chip to filter, or `全部` to clear it.
5. Click an entry to expand it.

Each row shows title, update time, `kind` and `importance`. Because `memory_list` cannot filter by category, the program collects the subtree ids and filters a recent window. The window starts at `max(200, count × 10)`, grows by multiples up to 2000 and reports `可能不全` at the cap. A short response means the end of the library, so the window does not grow further.

### Search modes {#search-modes}

The search view uses one box for two modes.

Semantic search:

1. Enter natural language such as `托盘 关闭`.
2. Set a count from 1 to 100; the default is 20.
3. Search. Results show a similarity percentage, and entries carrying `superseded_by` display `已被 xx 取代 · 点击查看新条`.

Id search:

1. Enter an 8-character prefix or a full UUID such as `bd22ad3a`.
2. Search. The exact entry is shown with its ancestor path and a body preview on hover.
3. An id must be 8 to 36 characters, contain only hexadecimal characters or hyphens and have at least 8 hexadecimal characters.

Input that does not look like an id falls back to semantic search instead of reporting a format error. Empty queries, missing ids and runtime failures each have their own message.

## Update and sync {#update-and-sync}

### Updates {#updates}

1. The client fetches `update.json` from `[update] endpoint`, with fields `version`, `notes`, `url`, `sha256`, `size` and `mandatory`.
2. Numeric versions such as `v1.0.0` and `1.0.0-beta` are compared.
3. The new executable is downloaded with `update://progress` events.
4. SHA-256 is verified.
5. The new executable starts as `--apply-update <target>`, waits up to 60 seconds for the old process to exit, replaces the file and restarts.

| Setting | Default | Meaning |
| --- | --- | --- |
| `update.enabled` | `true` | Enable update checks |
| `update.endpoint` | `http://127.0.0.1:17651/update.json` | Manifest address |
| `update.check_on_start` | `true` | Check silently once at startup |

Local publishing:

```powershell
npm run update:publish -- "release notes"
npm run update:serve
```

The update targets a standalone executable and the directory must be writable, so `Program Files` needs administrator rights. The manifest is unsigned; use HTTPS and add signature verification before public distribution. If the target stays locked for more than 60 seconds, the updater gives up and logs to `%APPDATA%\com.memtools.desktop\update\apply.log`.

Manual replacement is also possible: exit from the tray first so the file is not locked.

### Sync badge {#sync-badge}

The footer parses `status.summary` from rsrs: `offline`, `autosync`, `sync_live.pending`, `conflicts` and `sync_scheduler.last_success_unix`.

| State | Badge |
| --- | --- |
| Offline | `离线 · N 待同步` in amber |
| Online with a backlog | `N 待同步` |
| Conflicts | Conflict count added |
| Healthy | Hidden |

The tooltip reads `离线不丢：本地已落库，rsrs 下次 sync 自动补传`. It refreshes every 60 seconds and when the window wakes.

## Configuration {#configuration}

### Config file {#config-file}

The file is `<repo>/src-tauri/config.toml` and changes take effect after a restart. The one exception is `processor.json`, which the interface writes and which applies immediately.

> memTools reads `src-tauri/config.toml` from the project path recorded at build time. A copied executable without the source tree falls back to built-in defaults. Edit the file on the build machine and restart, or rebuild.

The initial window size in `tauri.conf.json` is overridden by `[window] width` and `height` in `config.toml`.

### Settings reference {#settings-reference}

**Window, hotkey and runtime**

| Setting | Default | Meaning |
| --- | --- | --- |
| `hotkey.register` | `Ctrl+Alt+R` | Global hotkey in Tauri syntax |
| `window.width` | `480` | Window width in pixels |
| `window.height` | `560` | Window height in pixels |
| `window.always_on_top` | `true` | Keep the window on top |
| `window.decorations` | `false` | Borderless window drawn by the front end |
| `window.transparent` | `true` | Transparent blurred background |
| `window.remember_position` | `true` | Restore the last position |
| `window.submit_close` | `true` | Hide about 1.2 seconds after a successful submit |
| `rsrs.base_url` | `http://127.0.0.1:15169` | Runtime address |
| `rsrs.mcp_path` | `mcp` | MCP over HTTP path, called as `POST {base_url}/{mcp_path}` |
| `rsrs.timeout_secs` | `5` | Fast probe timeout for status and taxonomy |
| `rsrs.op_timeout_secs` | `30` | Slow operation timeout for remember, recall, update, attach, show and tree |
| `rsrs.tools.*` | `memory_*` | MCP tool name mapping |

**Automation**

| Setting | Default | Meaning |
| --- | --- | --- |
| `automation.enabled` | `false` | Initial state of the automation toggle |
| `automation.mode` | `local-fallback` | `local-fallback`, `high-quality` or `memory-gateway` |
| `automation.recall_rounds` | `2` | Duplicate detection rounds |
| `automation.recall_limit` | `3` | Candidates per round |
| `automation.dup_threshold` | `0.85` | At or above this, treat as a duplicate and confirm |
| `automation.attach_threshold` | `0.70` | At or above this, attach automatically |
| `automation.llm.enabled` | `false` | Call the model for classification, ignored in `local-fallback` |
| `automation.llm.endpoint` | `http://127.0.0.1:8125/v1/chat/completions` | OpenAI-compatible endpoint |
| `automation.llm.model` | `qwen3:8b` | Model name |
| `automation.llm.api_key` | empty | Empty sends no `Authorization` header |
| `automation.llm.timeout_secs` | `60` | Model call timeout |

**Reminders, extension and updates**

| Setting | Default | Meaning |
| --- | --- | --- |
| `reminder.enabled` | `true` | Enable the due scan |
| `reminder.interval_minutes` | `30` | Background scan interval |
| `reminder.soon_days` | `7` | Days counted as upcoming |
| `extension.enabled` | `true` | Start the extension endpoint |
| `extension.port` | `17650` | Bound to `127.0.0.1` only |
| `extension.token` | empty | Empty generates `extension_token.txt` |
| `update.enabled` | `true` | Enable update checks |
| `update.endpoint` | `http://127.0.0.1:17651/update.json` | Manifest address |
| `update.check_on_start` | `true` | Check once at startup |

**Selection capture**

| Setting | Default | Meaning |
| --- | --- | --- |
| `selection.enabled` | `true` | Enable selection capture at startup |
| `selection.min_chars` | `2` | Minimum characters for the icon |
| `selection.max_chars` | `4000` | Maximum characters, above which it is ignored |
| `selection.drag_threshold_px` | `8` | Drag distance in physical pixels |
| `selection.capture_timeout_ms` | `600` | Wait for the clipboard after `Ctrl+C` |
| `selection.double_click` | `true` | Show the icon on double-click as well |
| `selection.offset_px` | `14` | Icon offset from the cursor |

**Processing**

| Setting | Default | Meaning |
| --- | --- | --- |
| `processor.enabled` | `true` | Enable processing; off makes `/process` return 503 |
| `processor.endpoint` | `http://127.0.0.1:8125/v1/chat/completions` | Endpoint for processing, independent of automation |
| `processor.model` | `qwen3:8b` | Model name |
| `processor.api_key` | empty | Empty sends no `Authorization` header |
| `processor.timeout_secs` | `120` | Model call timeout |
| `processor.max_chars` | `8000` | Input limit for the model |
| `processor.prompts.*` | built-in | Per-task prompt override with `{content}` and `{lang}` |
| `processor.agent_endpoint` | empty | Non-empty enables tier two through `--attach` |
| `processor.agent.enabled` | `false` | True enables the agent tier |
| `processor.agent.kind` | `opencode` | `opencode` or `qoder` |
| `processor.agent.bin` | empty | Executable path; empty auto-detects |
| `processor.agent.model` | empty | opencode uses `provider/model`; Qoder uses `auto`, `efficient` and similar |
| `processor.agent.agent` | empty | opencode `--agent` |
| `processor.agent.timeout_secs` | `240` | Agent timeout; a timeout returns 504 |
| `processor.agent.workdir` | empty | Empty uses `{temp}/memtools-agent` |
| `processor.agent.pure` | `true` | opencode `--pure` skips external plugins |
| `processor.agent.max_turns` | `0` | Qoder `--max-turns`; zero omits the flag |
| `processor.agent.allowed_tools` / `disallowed_tools` | empty | Qoder tool allow and deny lists |
| `processor.agent.token` / `token_env` | empty | Token and its environment variable, `QODER_PERSONAL_ACCESS_TOKEN` for Qoder |
| `processor.agent.extra_args` | `[]` | Extra arguments passed through |

To change the hotkey:

```toml
[hotkey]
register = "Ctrl+Shift+M"
```

Restart after saving. If another program holds the hotkey, registration fails and is logged; the tray still opens the window.

### Runtime data files {#runtime-files}

| File | Content | Written by |
| --- | --- | --- |
| `%APPDATA%\com.memtools.desktop\targets.json` | Quick targets | Window and extension options |
| `%APPDATA%\com.memtools.desktop\processor.json` | Processing source | Window process → source |
| `%APPDATA%\com.memtools.desktop\reminders\reminders.json` | Ignored reminders | Reminder view |
| `%APPDATA%\com.memtools.desktop\graph\` | `basis.json` and `vectors.f32` | Graph view |
| `%APPDATA%\com.memtools.desktop\backups\` | Backups before update or merge | Automation and quick targets |
| `%APPDATA%\com.memtools.desktop\update\` | Downloads and `apply.log` | Updater |

## Data and security {#data-and-security}

### Local paths {#local-paths}

On Windows `app_config_dir` is `%APPDATA%\com.memtools.desktop\`.

| Path | Purpose | Sensitivity |
| --- | --- | --- |
| `extension_token.txt` | Extension token | Sensitive; never commit or share |
| `window_state.json` | Last window position | No |
| `backups\memtools-backup-*.json` | Backups before update or merge | Contains memory bodies; internal |
| `targets.json` | Quick targets | Contains attachment names; internal |
| `processor.json` | Processing source | No secrets |
| `reminders\reminders.json` | Ignored reminders | No |
| `graph\` | Layout and vector cache | Contains vectors; internal |
| `update\` | Update packages and `apply.log` | No |
| `<repo>/src-tauri/config.toml` | Runtime configuration | Sensitive when a fixed token or API key is set |
| `<repo>/extension.pem` | CRX signing key | Sensitive; never distribute |
| `<repo>/extension.crx` | Packaged extension | Do not distribute publicly |

Memory bodies live in the rsrs `data_dir` (`onememory.db` and related files) and are managed by rsrs. memTools does not copy the library; the graph opens it read-only.

### Network and authentication {#network-and-authentication}

| Item | Description |
| --- | --- |
| rsrs connection | Loopback only, `http://127.0.0.1:15169/mcp` |
| Extension endpoint | Loopback only, `127.0.0.1:17650` by default |
| Extension authentication | `X-MemTools-Token` or `Authorization: Bearer` |
| Model and agent | Processing and model classification send content to the configured endpoint or local agent, which may be on a LAN or the public internet |
| Updates | Local by default; use HTTPS for public hosts |
| Remote access | Not supported; do not map the ports to the internet |
| Service lifecycle | memTools never starts, stops, copies or upgrades rsrs |

### Backup and rollback {#backup-and-rollback}

- Update backs up the original JSON to `backups/memtools-backup-<8-char id>-<timestamp>.json`.
- Merge backs up `id`, `title`, `children` and `content` for every candidate.
- The reminder complete action backs up the body before appending `【完成】` and verifies the read-back.
- To roll back, restore the body from the backup with `rsrs update`, or `remember` again and fix the attach point. Re-attach orphan children after a merge.

> The local library has no version history; update and merge are irreversible. Back up first.

### Sensitive data {#sensitive-data}

- Keep `extension_token.txt`, `extension.pem` and any `config.toml` containing a token or API key out of repositories.
- Mask tokens, URL parameters and account details before taking screenshots.
- Check memory content for personal or internal information before quoting it in documents, issues or chat.
- Confirm that content may be sent to a local agent before using tier two, and that the endpoint is trusted before using a model.

## Troubleshooting {#troubleshooting}

| Symptom | Likely cause | Action |
| --- | --- | --- |
| No window after launch | The window starts hidden | Press `Ctrl+Alt+R` or click the tray icon |
| Hotkey does nothing | Another program holds it, or registration failed | Change `hotkey.register`, restart, or use the tray |
| No tray icon | Tray creation failed or Windows hides it | Look for `建立系统托盘失败` in the log and check the overflow area |
| The process stays after closing | Closing only hides to the tray | Tray → `退出 memTools` |
| `runtime 不可达` | Runtime down, wrong port or blocked by a firewall | Start the runtime through the host, check `rsrs.base_url` and port 15169 |
| `鉴权失败` | Non-loopback access or a token mismatch | Check the rsrs token configuration; loopback needs none by default |
| A candidate list appears | rsrs found similar entries and did not write | Select a candidate and update, merge or attach, or create under a tree |
| Main-area submit is rejected | No tree selected | Select a tree or switch to the diary |
| The task asks for `【触发】` | Type `task` without a trigger | Enter `YYYY-MM-DD` or a verifiable prerequisite |
| Content is rejected | More than 8000 characters | Split it into several entries |
| The window is blank | A `cargo build --release` development build or a WebView2 problem | Use `npm run tauri build -- --no-bundle` and repair WebView2 |
| Hook timeout in the log | A slow rsrs plugin hook | It is non-fatal; wait for the write, whose timeout is 30 seconds |
| Extension returns 401 | Wrong or missing token | Copy the token from the extension panel and retest |
| Extension cannot connect | memTools is not running, the port differs or the endpoint is disabled | Start memTools and match `[extension] port` and `enabled` |
| Extension menu is missing | The extension was not reloaded | Reload it from the extensions page |
| Extension targets are stale | The menu refreshes every 10 minutes | Save targets, wait, or reload the extension |
| Extension asks for verification | A near duplicate was attached automatically | Search for the entry in the window and decide whether to update or merge |
| Extension finds no category | The text is too short or has no signal | Save manually in the window or add clearer content |
| Extension endpoint fails to start | Port 17650 is taken | Change `[extension] port` and the extension options, or free the port |
| No selection icon | Capture is off, the selection is too short, or the app uses `Ctrl+Shift+C` | Enable it from the tray, select at least two characters, try a normal editor |
| The icon is in the wrong place | A multi-monitor or scaling edge case | It is clamped to the work area; adjust `selection.offset_px` |
| Selection capture fails | The target application does not support `Ctrl+C` | Use `在 memTools 中选择…` and paste manually |
| The clipboard changed | The original clipboard was an image or file | Known limit; save important clipboard content first |
| Saving a quick target fails | More than 8 targets, a duplicate `id` or a missing parent | Remove entries, change the id or add `parent` |
| The two target lists disagree | The extension cache is stale | Trust memTools and wait 10 minutes or reload the extension |
| Process reports it is disabled | The source is off or the endpoint is empty | Choose model, opencode or Qoder under source |
| Process returns 503 | The endpoint is unconfigured or the agent is disabled | Check `[processor] endpoint` or select an agent source |
| Process returns 502 | The model is down, the name is wrong or the agent is logged out | Start the model, check `model`, run `qodercli /login` |
| Process returns 504 | Agent cold start exceeded the timeout | Increase `processor.agent.timeout_secs` |
| Processing hangs | The model is slow or the agent is running tools | Wait for the timeout or switch to the model source |
| No reminders | Not a task, no trigger, no date, a diary entry or completed | Add `【触发】YYYY-MM-DD` and check `importance` |
| Reminder list says `可能不全` | The scan reached its 1600 cap | Narrow the scope or use search |
| Reminder completion fails | Runtime unreachable or backup or update failed | Check the runtime and retry |
| An ignored reminder reappears | Its trigger date changed | Ignore it again |
| The graph is empty | `onememory.db` is missing or the data directory is unknown | Set `RSRS_DATA_DIR` or start the runtime |
| The graph is slow | Too many nodes or too high a layer or node limit | Lower the lit layers and node limit |
| The update check fails | `update.json` is unreachable or malformed | Check `[update] endpoint` and test with `npm run update:serve` |
| The update cannot replace the file | The executable is locked, the directory is read-only or 60 seconds passed | Close other instances, use a writable directory, retry, and check `apply.log` |
| The footer keeps showing pending sync | rsrs is offline or has a backlog | The entry is stored locally; wait for the next sync |
| A `config.toml` change is ignored | Configuration is read at startup and a portable executable may not find it | Restart and check the executable and source layout |
| Recent category results are sparse | Filtering depends on a sampling window | Raise the count or use `全部` or search |
| An id search finds nothing | The input is not 8 to 36 hexadecimal characters, or the prefix is shared | Use a full UUID or a longer prefix |

## Acceptance checklist {#acceptance-checklist}

- [ ] `Ctrl+Alt+R` shows and hides the window with focus in the input box.
- [ ] A main-area entry appears under the chosen root in recent memories, with its path.
- [ ] A diary entry reads `并入当日轨迹` and is absent from the trees.
- [ ] The template accepts only `【行为】` and rejects an empty `【行为】`.
- [ ] A task without a trigger is asked for one and no date is guessed.
- [ ] Automation stores a diary entry in one step and attaches or creates an important entry.
- [ ] A candidate list never reports success before a choice.
- [ ] Update and merge create backups and the read-back matches.
- [ ] Quick targets can be added, edited, deleted and reordered, up to 8, and the order matches the selection panel and extension.
- [ ] Selecting at least two characters shows `记`; a target saves; prefilling works.
- [ ] Processing switches sources, all six tasks return, and a failure leaves the input intact.
- [ ] Extension processing notifications carry `（AI 梳理）` and a failure does not store the raw text.
- [ ] Reminder groups are correct and ignore and complete work.
- [ ] The graph loads, focuses on hover, toggles the container, changes layers and nodes, and updates live.
- [ ] Recent counts, filtering and expansion work.
- [ ] Search handles semantics and an 8-character id prefix and marks `superseded_by`.
- [ ] Tray left click toggles, and the tray menu shows, exits and toggles selection capture.
- [ ] A second launch does not create a second process.
- [ ] The extension connection test passes and a target save works; a wrong token returns 401.
- [ ] Disabling the extension endpoint breaks only the extension, not the window.
- [ ] Updates check, show progress, verify and restart, and `apply.log` is written.
- [ ] The sync badge shows offline pending and disappears after recovery.

## Limits and red lines {#limits-and-red-lines}

### Red lines {#red-lines}

1. Do not start, stop, copy or upgrade the rsrs service.
2. Do not use `--direct`.
3. Do not build shell strings to call rsrs or an agent.
4. Never treat a duplicate candidate as success; apply one action or report failure.
5. Never store raw content or use `--force` without checking; attach or merge into an existing same-topic entry.
6. Never merge without checking children and taking a backup.
7. Never update a long entry without a backup.
8. Never guess an absolute date.
9. Never treat the agent tier as a pure text function; it can execute tools.

### Known limits {#known-limits}

- Configuration depends on the source path recorded at build time, so a portable executable may fall back to defaults.
- In `local-fallback`, classification and tree choice are local keyword rules, not a semantic model.
- Model classification falls back to local rules on failure, and the fallback keeps the rule limits.
- Quick targets are limited to 8 with a 24-character label.
- The extension endpoint is loopback only and does not support remote devices.
- The extension is not published to browser stores and needs developer mode.
- Selection capture simulates `Ctrl+C`, so terminals and other custom-copy applications may not work.
- Reminders are a UI scan, not a system service, and stop at 1600 entries.
- The local library has no version history; update and merge are irreversible.
- The graph cannot edit or delete memories.
- The update manifest is unsigned; public distribution needs HTTPS and signature checks.
- The agent tier reports a missing or logged-out agent clearly and does not fall back to the model.

## Quick reference {#quick-reference}

### Commands {#commands}

| Purpose | Command |
| --- | --- |
| Check the runtime | `rsrs --client-only status` |
| List trees | `rsrs --client-only taxonomy --list --json` |
| Show a memory | `rsrs --client-only show <id> --json` |
| Unit tests | `cd <repo>/src-tauri && cargo test --lib` |
| Development mode | `npm run tauri dev` |
| Release build | `npm run tauri build -- --no-bundle` |
| Read-only recent | `cargo run --example recent -- 全部 5` |
| Read-only search | `cargo run --example search -- "关键词" 5` |
| Reminder scan | `cargo run --example reminders_probe -- 12` |
| Graph snapshot | `cargo run --example graph_probe` |
| Processing dry run | `cargo run --example process_probe -- --mock` |
| Agent probe | `cargo run --example agent_probe -- --kind opencode --probe` |
| Extension smoke test | `cargo run --example extension_server` |
| Publish an update | `npm run update:publish -- "release notes"` |
| Local update server | `npm run update:serve` |

The unit suite covers title generation, marker filling, recent filtering, id detection, extension tokens and source lines, version comparison and manifests, reminder dates and ignore state, model output filtering, processing tasks and error codes, agent arguments and output parsing, processing source overlay and quick target storage. Examples in this page use placeholder ids; replace them with your own.

### Glossary {#glossary}

| Term | Meaning |
| --- | --- |
| rsrs and Respire | The local-first AI memory system with a CLI and a local runtime |
| Runtime | The resident local service, `127.0.0.1:15169` by default |
| Main area | Entries with `importance = important` that require a tree |
| Diary | Entries with `importance = trivial` that skip the tree |
| Tree root | The built-in category nodes, usually 23, split into human and AI domains |
| Classification | Deciding between the main area and the diary |
| Duplicate detection | Semantic recall to find similar entries |
| Tree choice | Picking an attachment point by keyword overlap or model output |
| Candidate list | Similar entries returned without a write, requiring a choice |
| Three markers | `【前因】【行为】【后果】` |
| `needs_confirm` | A destructive branch awaits the user |
| Quick target | An ordered save destination of kind `journal`, `tree` or `auto` |
| Selection capture | The global `记` icon and save panel for selected text |
| Tier one and tier two | Processing through a model endpoint and through a headless agent |
| Source | The model or agent used for processing |
| Container | The brain point-cloud volume used by the graph |
