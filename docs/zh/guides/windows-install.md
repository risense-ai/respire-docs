# 在 Windows 上安装 rsrs {#installing-rsrs-on-windows}

## 推荐：安装桌面客户端 {#install-the-desktop-client}

桌面客户端提供图形界面，适合首次使用。Windows 需要 Windows 10 或更高版本，以及 Microsoft Edge WebView2 Runtime。

1. 打开 [Client 2 发布页](https://github.com/risense-ai/respire-client2/releases/latest)，下载与处理器匹配的文件：x64 选择 `respire-windows-amd64.exe`，ARM64 选择 `respire-windows-arm64.exe`。
2. 将文件放在可写入的固定目录中，然后运行。桌面客户端不需要 Node.js、npm、Go 或 Rust。
3. 如果尚未连接 Runtime，打开客户端的“更新”页，选择“下载并安装”，并检查结果。桌面端与 CLI 分别发布，因此客户端安装包存在不代表匹配的 Runtime 一定可用。
4. 按[快速开始](../getting-started.md#sign-in-or-create-a-local-library)登录或创建本地记忆库，再连接 Agent 并创建第一条记忆。

下方是 CLI 备选方案，适合需要在终端操作的用户。

## rsrs 是什么 {#what-rsrs-is}

Respire（通过 `rsrs` 命令调用）是一个本地优先、端到端加密的跨设备和 AI 应用程序的内存系统。在一台机器上书写的记忆可以通过加密同步在另一台设备或工具中复用。CLI 是一个轻量级客户端，连接到本地运行时。

| 设置 | 默认值 |
| --- | --- |
| API 服务器 | `https://api.rsrs.rs` |
| 数据目录 | `~/.rsrs`（Windows: `C:\Users\<user>\.rsrs`） |
| 控制台 | `https://dash.rsrs.rs` |
| 本地运行时 | `http://127.0.0.1:15169` |

安装的可执行文件帮助信息是权威来源。通过 `rsrs --version`、`rsrs --help` 和 `rsrs prompt --json` 确认可用命令和选项。

## 先决条件 {#prerequisites}

以下条件只适用于本页的 CLI 安装步骤，不是使用桌面客户端的要求。

- Node.js LTS（包含 npm）
- 一个包管理器：pnpm（推荐）或 npm
- Windows PowerShell 用于本指南中的命令

## 安装 CLI {#install-the-cli}

安装 `rsrs-cli`。

### 使用 pnpm 安装 {#install-with-pnpm}

当 pnpm 全局 bin 目录未配置时，安装会因 `ERR_PNPM_NO_GLOBAL_BIN_DIR` 失败。在安装前指向已存在于 PATH 中的 npm 目录。

```powershell
pnpm config set global-bin-dir "C:\Users\<user>\AppData\Roaming\npm"
pnpm config set global-dir "C:\Users\<user>\AppData\Local\pnpm\global"

# Install the default release.
pnpm add -g rsrs-cli
```

### 使用 npm 安装 {#install-with-npm}

```powershell
npm install -g rsrs-cli
```

### 安装开发渠道 {#install-the-dev-channel}

新功能可能在默认版本之前进入开发渠道。

```powershell
pnpm add -g rsrs-cli@dev
```

## 验证安装 {#verify-the-installation}

```powershell
rsrs --version
rsrs -V
where.exe rsrs
```

`where.exe` 的输出应解析到全局 bin 目录中的 `rsrs` 可执行文件。

## 首次初始化 {#first-initialization}

需要存储的命令会在 `~/.rsrs` 下初始化配置文件。默认配置文件名为 `main`。

```powershell
rsrs status
```

新配置文件会报告本地存储处于离线模式。注册或登录后，同步取决于账户和同步配置；请检查 `rsrs status`。

运行检查，查看模型、存储、锁、远程连接和注入状态。`--fix` 在需要时可能下载模型，也可能安排后台准备；请查看输出和任务进度，等待当前任务完成。

```powershell
rsrs doctor --fix
```

报告的缺失注入或待处理整理计数器并非安装失败。当检查报告缺失 BGE-M3 文件时，显式修复模型：

```powershell
rsrs model install
rsrs model activate m3
rsrs model probe
```

成功的探查返回 `ready:true` 且 `dimensions:1024`。从 `1.0.11` 开始需要激活，并要带上模型参数 `m3`。

## 创建账户并登录 {#create-an-account-and-log-in}

对于没有密钥的新配置，先生成密钥材料，再注册。不要为已有记忆库再次运行 `keygen`。注册需在主机终端运行，以便在隐藏提示下收集登录密码；`--direct` 还要求运行时已停止。请将示例中的 `YOUR_NAME` 换成用户名。

```powershell
# 1. Create local key material; the echoed super code is shown once.
rsrs keygen --json

# 2. Stop the runtime so --direct can run in this terminal.
rsrs --runtime-internal --stop

# 3. Register in an interactive terminal; enter the login password at the hidden prompt.
rsrs --direct register --user "YOUR_NAME"

# 4. Confirm the account and server.
rsrs status
```

仅将非机密选项作为命令参数传递。让 `register` 通过隐藏提示收集凭据；不要把密码、超码或其他机密放在命令行上。

在新设备上使用现有账户登录。`rsrs login` 默认打开浏览器授权；添加 `--interactive` 可在隐藏提示下输入密码和 TOTP。普通登录不接受 `--secret-key`：

```powershell
# Browser authorization (default).
rsrs login

# Or password/TOTP login with hidden prompts.
rsrs login --interactive --user "YOUR_NAME"
```

请私密保存 `keygen --json` 输出中的 `summary.super` 恢复码。不要共享或提交 `session.json` 或账户密钥。仅在需要时导出解密密钥，因为输出为明文。`--out` 在 Unix 上以 `600` 模式创建文件；在 Windows 上它会继承目标目录的 ACL，因此请选择私有且访问受限的目录，并核验文件的 ACL：

```powershell
rsrs keys-export --out <path>\rsrs-keys.txt
```

`rsrs logout` 会结束会话但保留本地身份和密钥，因此登录会将其带回；需要结束会话时再单独运行。参见 [同步和密钥](../sync-and-keys.md) 了解恢复选项。

## 存储和检索第一条记忆 {#store-and-retrieve-a-first-memory}

输出因命令而异。使用 `--json` 获取机器可读的详细信息，并使用 `show` 检查选中的记录。

```powershell
# Store a memory; a similar candidate is proposed before writing.
rsrs remember "<content>" --type context --importance important --title "<title>" --tags "a,b" --project "<project>" --json

# Skip the duplicate check and write directly.
rsrs remember "<content>" --force --json

# Semantic retrieval.
rsrs recall "<query>" --mode fast --limit 5 --json
rsrs recall "<query>" --titles --json

# Read one record and its causal chain.
rsrs show <ID> --json
rsrs chain <ID> --depth 3 --json

# Browse and inspect the diary.
rsrs list --limit 10 --json
rsrs diary --date today --json
```

`--titles` 形式仅返回 8 字符标识符和标题，浏览候选时节省 token。

| 重要性 | 用途 |
| --- | --- |
| `important` | 进入主存储的可重用结论 |
| `trivial` | 日记条目和常规流程笔记 |

`normal` 值已弃用。优先使用三段式正文描述原因、行动和效果，并添加带有确认日期或计划任务前提条件的触发行。当候选存在时，按此顺序选择一个操作：更新现有记录，然后合并，然后附加，然后创建新记录。决定前需完整阅读候选。

## 理解运行时 {#understand-the-runtime}

命令连接到 `127.0.0.1:15169` 的驻留本地运行时。不要并发运行模型操作。编写脚本时添加超时，不要将秘密作为命令参数；`register` 和 `login --interactive` 可通过隐藏提示收集凭据。

| 选项 | 效果 |
| --- | --- |
| `rsrs --runtime-internal --stop` | 停止本地运行时 |
| `rsrs --direct <command>` | 直接打开存储，绕过运行时 |
| `rsrs --client-only <command>` | 连接到主机运行时而不管理其生命周期 |
| `rsrs web [--no-open]` | 打开托管控制台而不启动本地运行时 |

## 日常维护 {#daily-maintenance}

```powershell
rsrs status
rsrs doctor
rsrs update <ID> --title "<new-title>" --json
rsrs retitle <ID> --title "<new-title>" --json
rsrs forget <ID> --json
rsrs restore <full-ID> --json
rsrs export <file>.json --json
rsrs backup <file>.db --json
rsrs sync --json
rsrs taxonomy --list
rsrs prompt --json
rsrs update-check
rsrs account list
```

导出文件包含明文，且会覆盖已有文件；每次请选择新路径。数据库备份不包含访问授权，也不能替代密钥备份。在执行破坏性操作前，请进行备份。详见 [CLI 命令](../cli.md) 和 [CLI JSON](../cli-api.md)。

## 连接 AI 应用程序 {#connect-ai-applications}

先查看可用目标：

```powershell
rsrs inject --targets
```

检查目标路径和已有内容，并按需备份。下面以 Codex 为例；只有使用该宿主时才运行：

```powershell
rsrs inject --id codex
```

`--all` 会修改所有检测到的目标。DSH 目标会覆盖 `~/.dsh/AGENTS.md`，并移除该路径上的符号链接；使用前请检查并备份。

注入会写入指令，但不会安装自动钩子。自动行为取决于宿主的插件和钩子支持。重启目标应用并确认它加载了指令。详见 [代理集成](../injection.md)。

## 故障排除 {#troubleshooting}

| 症状 | 原因 | 操作 |
| --- | --- | --- |
| `ERR_PNPM_NO_GLOBAL_BIN_DIR` | 未配置 pnpm 全局 bin 目录 | 安装前设置 `global-bin-dir` |
| `BGE-M3 files missing` | 嵌入模型缺失 | 运行 `rsrs model install`，然后 `rsrs model activate m3` |
| 回忆超时出现 `os error 10060` | 本地地址通过代理路由 | 将 `127.0.0.1,localhost` 添加到 `NO_PROXY` |
| 命令停止响应 | 推理工作线程饱和或存在残留进程 | 使用 `Get-Process rsrs` 检查；`rsrs model reset-cpu` 会切换到 CPU 并停止运行时 |
| `another model operation is running` | 并发模型操作 | 等待当前操作完成；不要并发运行 |
| `backup` 报告 `os error 80` | 目标文件已存在 | 选择新的备份路径 |
| `keygen would overwrite it` | 密钥材料已存在 | 仅在新配置文件上运行 `keygen` |
| `doctor` 退出代码 1 | 检查项目失败或命令未完成 | 查看具体错误；仅有注入或整理项未满足时，不一定是安装故障 |

退出代码 `2` 的含义取决于命令，可能表示警告、待定决策或输入错误。请检查输出状态和错误信息；退出代码 `1` 也需要查看具体报告。更多解答请参见 [常见问题](../faq.md)。

## 一分钟检查清单 {#one-minute-checklist}

这份清单适用于独立 CLI 安装。在第 5 步保存记忆前，请按上文完成账户登录或新库初始化；已有记忆库不要重新生成密钥。

```powershell
# 1) Install.
pnpm add -g rsrs-cli

# 2) Verify.
rsrs --version

# 3) Check setup and prepare the model if needed.
rsrs status
rsrs doctor --fix

# 4) Complete account sign-in or new-library setup as described above.

# 5) Store and retrieve a first memory.
rsrs remember "Hello rsrs" --importance trivial --json
rsrs recall "Hello" --json

# 6) Inspect AI application targets; review paths before injection.
rsrs inject --targets
```

关于背景和首次使用流程，请参见 [入门指南](../getting-started.md)。
