# memTools 桌面小工具 {#memtools-desktop-companion}

memTools 是基于 Tauri 2 的桌面快捷记录工具，面向本机 rsrs runtime。它和[桌面客户端](../client.md)是两件事：客户端负责管理 runtime 与账号，memTools 是随手记与回看的热键小窗。

- 仓库：<https://github.com/risense-ai/respire-memtool>
- 连接方式：MCP over HTTP（JSON-RPC 2.0），默认 `http://127.0.0.1:15169/mcp`
- 热键：`Ctrl+Alt+R` 唤起或隐藏小窗；`Esc` 与关闭按钮只隐藏到托盘

## 能做什么 {#what-it-does}

| 方面 | 行为 |
|---|---|
| 记录 | 主区或日记，从 23 个分类树根里选挂点，再选 `type`（`context` / `decision` / `preference` / `task` / `emotion` / `time` / `skill`） |
| 判重 | 命中疑似重复时给「改 / 并 / 挂 / 存新条」，破坏性操作前自动备份 |
| 自动化 | 本地规则判档判树、两轮 recall 判重；可选兼容 OpenAI 的端点辅助，失败会明确告警并回退本地规则 |
| 日记 | 以 `importance=trivial` 直接落库，跳过判重与挂树 |
| 回看 | 最近记忆、关键词搜索、`rsrs recall` 语义搜索、`【触发】` 日期提醒、只读 3D 图谱（读 `onememory.db`） |
| 入口 | 系统托盘、浏览器扩展、Windows 划词悬浮、资源管理器右键「添加到知识库」 |
| 更新 | 读 GitHub Releases 的 `update.json`，校验 SHA-256，Windows 上自替换重启 |

`memtools.exe --ai` 可直接打开 AI 窗口。

## 安装 {#install}

从 GitHub Releases 下载 `memtools-<version>.exe`（免安装）、`.msi` 或 NSIS `.exe`。发布包未做代码签名，Windows 会提示“未知发布者”，macOS 需在系统设置里允许打开。

首次启动会检测 `rsrs` 命令，缺失时用 npm / pnpm 全局安装 CLI。runtime 仍需自己在 15169 端口运行；只有你在 rsrs 面板点「确认重启」后，memTools 才会代为重启。

配置文件按以下顺序查找：

1. 环境变量 `MEMTOOLS_CONFIG`
2. `%APPDATA%\com.memtools.desktop\config.toml`（macOS 为 `~/Library/Application Support/...`，Linux 为 `$XDG_CONFIG_HOME/...`）
3. 可执行文件同目录的 `config.toml`（便携模式）
4. 内置默认值

## AI 窗口与知识库 {#ai-window-and-knowledge-base}

AI 窗口是独立窗口（顶栏 **AI** 按钮打开），既能和本机 agent CLI 对话，也能把素材整理进知识库。

一条资料的落盘结构：

```
<knowledge base root>/<year>/<month>/<topic>-<timestamp>/
  original/     source file or directory, unchanged
  <title>.md    organized Markdown
```

整理完成后由 agent 按 rsrs 的「改 / 并 / 挂 / 存」规范写入记忆，正文里带上文件路径与设备。

### 来源（agent） {#agent-sources}

来源下拉有五个选项，每一项都会实时探测：

| 来源 | 机器上需要有什么 | 探测方式 |
|---|---|---|
| opencode | `npm i -g opencode-ai` | `opencode --version`；模型来自 `opencode models` |
| Qoder CLI | Qoder IDE（自带 `qodercli`） | `qodercli --version`，再用 `qodercli status` 看账号行 |
| Claude Code | `npm install -g @anthropic-ai/claude-code` | `claude --version`；按 `custom` 方式驱动 |
| Codex CLI | `npm install -g @openai/codex` | `codex --version`；按 `custom` 方式驱动 |
| 自定义 CLI | 任何能接收 prompt、把回答打到 stdout 的命令 | `--version`，或只确认可执行文件存在 |

选中没装或没登录的来源，下方会展开「安装与配置」面板：未就绪原因、安装命令、登录步骤、将使用的参数、探测到的路径、文档链接，命令可一键复制。

装好后点「重新检测」，再点「绑定」。绑定结果写入 `knowledge_base.json`，优先于 `config.toml`。

Qoder 的 `qodercli` 藏在 IDE 目录里，不在 `PATH` 上，PowerShell 直接敲 `qodercli` 会报「无法识别」。用绝对路径，或把目录加进 `PATH`：

```powershell
& "D:\...\Qoder\resources\app\resources\bin\x86_64_windows\qodercli.exe"
# then type /login inside the interactive session
```

窗口里的登录提示会带上探测到的绝对路径与 `& "…"` 调用写法。

### 模型 {#models}

模型框可以手填，也会给候选列表：

| 来源 | 模型取值 |
|---|---|
| opencode | `provider/model`，例如 `opencode/big-pickle`；候选来自 `opencode models` |
| Qoder CLI | `auto`、`efficient`、`gmodel`、`kmodel`、`lite`、`mmodel`、`performance`、`q35model`、`qmodel`、`ultimate` |
| Claude / Codex / 自定义 | 该 CLI 自己认的值；留空即用 CLI 默认 |

切换来源会清空模型框，因为几家的模型写法不互通。

### 驱动自定义 CLI {#driving-a-custom-cli}

Claude Code 与 Codex CLI 就是以 `kind = "custom"` 绑定、参数预填好的。同一套机制可用于任意 CLI：

```toml
[processor.agent]
kind = "custom"
bin = "crush"                                    # command name or absolute path
args = ["run", "--model", "{model}", "{prompt}"]  # one array element per argv
env = ["CI=1"]                                    # KEY=VALUE
models = ["claude-sonnet", "gpt-5"]               # optional model suggestions
output = "json"                                   # text | json | opencode-json | qoder-json
```

占位符：`{prompt}`、`{model}`、`{session}`、`{endpoint}`、`{workdir}`、`{agent}`。替换后变成空串的元素会被丢弃，不会当成空参数传下去。

输出解析：

| `output` | 期望的 stdout |
|---|---|
| `text` | 纯文本，整段 stdout 就是回答 |
| `json` | 单个 JSON 对象，依次取 `result`、`text`、`content`、`response`、`output`、`message` |
| `opencode-json` | NDJSON 事件流，取最后一条 message 的文本 |
| `qoder-json` | `{"type":"result","result":"…"}` |

界面选择优先于 `config.toml`：`knowledge_base.json` 会记录来源、可执行文件、模型，以及自定义来源的参数模板、环境变量与输出解析；字段留空则回落到 `config.toml`。

## 平台差异 {#platform-notes}

| 能力 | Windows | macOS / Linux |
|---|---|---|
| 记录、回看、搜索、提醒、图谱、托盘、热键 | 支持 | 支持 |
| AI 窗口与知识库入库 | 支持 | 支持（原生目录选择框仅 Windows，其他平台手填路径） |
| 资源管理器右键「添加到知识库」 | 支持 | 不支持 |
| 划词悬浮 | 支持 | 不支持 |
| 自动下载并替换更新 | 支持 | 仅检查 |

浏览器扩展通过本机 17650 端口提交内容，令牌存放在应用配置目录的 `extension_token.txt`。

## 排查 {#troubleshooting}

| 现象 | 原因与处理 |
|---|---|
| 显示 `runtime 不可达` | rsrs runtime 没在 15169 监听；用 `rsrs status` 或宿主应用启动它 |
| 某个来源显示「未就绪」 | 点开该项按安装面板操作：装 → 登录 → 重新检测 |
| 提示「无法将 xxx 项识别为 cmdlet」（`xxx is not recognized as a cmdlet`） | 该 CLI 不在 `PATH`；用面板给的绝对路径，或把目录加进 `PATH` 后重开终端 |
| 绑定成功但第一次跑就失败 | 先「重新检测」确认版本，再核对模型写法（opencode 要 `provider/model`） |
| 改了 `config.toml` 却不生效 | `knowledge_base.json` 里的界面选择优先；改完文件后重新点「绑定」 |
| Windows 提示未知发布者 | 发布包没有代码签名 |

## 相关 {#see-also}

- [CLI](../cli.md)：agent 整理时调用的记忆命令
- [Runtime RPC](../runtime-rpc.md)：本机协议
- [客户端](../client.md)：另一套 Wails 桌面客户端
