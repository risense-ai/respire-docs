# 在 Windows 上安装 rsrs {#installing-rsrs-on-windows}

## rsrs 是什么 {#what-rsrs-is}

Respire（通过 `rsrs` 命令调用）是一个本地优先、端到端加密的跨设备和 AI 应用程序的内存系统。在一台机器上书写的记忆可以通过加密同步在另一台设备或工具中复用。CLI 是一个轻量级客户端，连接到本地运行时。

| 设置 | 默认值 |
| --- | --- |
| API 服务器 | `https://api.rsrs.rs` |
| 数据目录 | `~/.rsrs`（Windows: `C:\Users\<user>\.rsrs`） |
| 控制台 | `https://dash.rsrs.rs` |
| 本地运行时 | `http://127.0.0.1:15169` |

安装的可执行文件帮助信息是权威来源。通过 `rsrs --version`、`rsrs --help` 和 `rsrs prompt --json` 确认可用命令和选项。撰写本文时注册表发布 `1.0.11` 作为默认版本，`1.0.12-dev.1` 在开发渠道；这些仅作为示例，而非保证。

## 先决条件 {#prerequisites}

- Node.js LTS（包含 npm）
- 一个包管理器：pnpm（推荐）或 npm
- Windows PowerShell 用于本指南中的命令

## 安装 CLI {#install-the-cli}

简短包名 `rsrs-cli` 和作用域名称 `@rsrsai/cli` 是同一包的两个入口点，版本相同。仅安装其中一个，否则两者可能争夺 `rsrs` 命令。

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

新功能通常在开发渠道早于默认版本发布。开发渠道仅在作用域名称下发布，而非 `rsrs-cli`。

```powershell
pnpm add -g @rsrsai/cli@dev
```

## 验证安装 {#verify-the-installation}

```powershell
rsrs --version
rsrs -V
where.exe rsrs
```

`where.exe` 的输出应解析到全局 bin 目录中的 `rsrs` 可执行文件。

## 首次初始化 {#first-initialization}

任何 `rsrs` 命令的首次运行会创建本地存储和 `~/.rsrs` 下的配置文件。默认配置文件名为 `main`。

```powershell
rsrs status
```

新配置文件会报告本地存储处于离线模式。注册或登录云账户后，会报告自动云同步。

运行捆绑检查以安装嵌入模型并检查模型、存储、锁、远程和注入状态。

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

账户设置将本地密钥材料与云账户结合。先生成密钥材料，再注册。

```powershell
# 1. Create local key material; the echoed super code is shown once.
rsrs keygen --json

# 2. Register a cloud account using the super code from the previous step.
rsrs register --user <user-name> --pass "<login-password>" --super "<super-code>" --json

# 3. Confirm the account and server.
rsrs status
```

传递所有参数以避免命令进入交互式提示。

在新设备上使用现有账户登录。`rsrs login` 默认打开浏览器授权；添加 `--interactive` 可在隐藏提示下输入密码和 TOTP。普通登录不接受 `--secret-key`：

```powershell
# Browser authorization (default).
rsrs login

# Or password/TOTP login with hidden prompts.
rsrs login --interactive --user <user-name>
```

超级密码仅显示一次且丢失后无法恢复。保持离线以备恢复。不要共享或提交 `session.json` 或账户密钥。仅在需要时导出解密密钥，因为输出为明文；`--out` 会写入权限为 `600` 的文件而非打印：

```powershell
rsrs keys-export --out <path>\rsrs-keys.txt
```

`rsrs logout` 会结束会话但保留本地身份和密钥，因此登录会将其带回；需要结束会话时再单独运行。参见 [同步和密钥](../sync-and-keys.md) 了解恢复选项。

## 存储和检索第一条记忆 {#store-and-retrieve-a-first-memory}

读取命令仅在使用 `--json` 时返回完整内容。

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

命令连接到 `127.0.0.1:15169` 的驻留本地运行时，而非每次启动进程。不要对同一配置文件并发运行 `rsrs` 命令；竞争命令会争夺运行时并导致阻塞。脚本时添加超时，并将所有参数传递给 `register` 以避免交互式提示；`login` 使用浏览器授权，或用 `--interactive` 进行隐藏的密码提示。

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

导出文件包含纯文本，数据库备份不会替代密钥备份。在执行破坏性操作前，请进行备份。完整命令集请参见 [CLI 命令](../cli.md) 和 [CLI JSON](../cli-api.md)。

## 连接 AI 应用程序 {#connect-ai-applications}

```powershell
rsrs inject --targets
rsrs inject --all
```

注入会写入策略文本，指示代理何时回忆和记住信息。它不会安装自动钩子；自动触发需要注册的 MCP 服务器或 `plugins.json` 条目。注入后重启目标应用程序以加载新指令。详见 [代理集成](../injection.md)。

## 故障排除 {#troubleshooting}

| 症状 | 原因 | 操作 |
| --- | --- | --- |
| `ERR_PNPM_NO_GLOBAL_BIN_DIR` | 未配置 pnpm 全局 bin 目录 | 安装前设置 `global-bin-dir` |
| `BGE-M3 files missing` | 嵌入模型缺失 | 运行 `rsrs model install`，然后 `rsrs model activate m3` |
| 回忆超时出现 `os error 10060` | 本地地址通过代理路由 | 将 `127.0.0.1,localhost` 添加到 `NO_PROXY` |
| 命令停止响应 | 推理工作线程饱和或存在残留进程 | 运行 `rsrs model reset-cpu`；使用 `Get-Process rsrs` 检查 |
| `another model operation is running` | 并发模型操作 | 等待当前操作完成；不要并发运行 |
| `backup` 报告 `os error 80` | 目标文件已存在 | 删除或重命名该文件 |
| `keygen would overwrite it` | 密钥材料已存在 | 仅在新配置文件上运行 `keygen` |
| `doctor` 退出代码 1 | 注入或整理项未满足 | 通常不是安装失败 |

退出代码 `2` 通常表示成功但有警告或待定决策，而非失败。退出代码 `1` 需要检查具体报告的项目。更多解答请参见 [常见问题](../faq.md)。

## 一分钟检查清单 {#one-minute-checklist}

```powershell
# 1) Install.
pnpm add -g rsrs-cli

# 2) Verify.
rsrs --version

# 3) Initialize and repair the model.
rsrs status
rsrs doctor --fix

# 4) Create an account; keep the super code safe.
rsrs keygen --json
rsrs register --user <user-name> --pass "<login-password>" --super "<super-code>" --json

# 5) Store and retrieve a first memory.
rsrs remember "Hello rsrs" --importance trivial --json
rsrs recall "Hello" --json

# 6) Connect AI applications.
rsrs inject --all
```

关于背景和首次使用流程，请参见 [入门指南](../getting-started.md)。
