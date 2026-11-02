# 开始使用 {#getting-started}

推荐先使用桌面客户端。它提供图形界面，可以管理本机 Runtime、账户、记忆、模型和 AI 工具连接。如果更习惯终端，或当前平台无法使用桌面客户端，可以选择 [CLI 备选方案](#cli-alternative)。

## 安装桌面客户端 {#install-the-desktop-client}

1. 打开 [Client 2 发布页](https://github.com/risense-ai/respire-client2/releases/latest)，选择与操作系统和处理器匹配的文件。发布页也提供校验和及版本说明。
2. Windows x64 下载 `respire-windows-amd64.exe`，ARM64 下载 `respire-windows-arm64.exe`。将文件放在可写入的固定目录中，再运行它。系统需要 Windows 10 或更高版本及 WebView2。
3. macOS 下载对应的 `respire-darwin-amd64.zip` 或 `respire-darwin-arm64.zip`，解压后将 `Respire.app` 保存在固定位置。应用尚未使用 Developer ID 签名或公证。
4. Linux 下载对应的 `respire-linux-amd64.tar.gz` 或 `respire-linux-arm64.tar.gz`，解压后运行可执行文件。系统需要图形会话、GTK 3、WebKitGTK 4.1 和兼容的系统库。

使用桌面应用不需要安装 Node.js、npm、Go 或 Rust。桌面端和 CLI 分别发布，因此有桌面安装包不代表该平台一定有匹配的 Runtime。平台前提和验证范围见[平台支持](https://github.com/risense-ai/respire-client2/blob/main/docs/platforms.md)。

## 连接 Runtime {#connect-the-runtime}

首次打开客户端时，按提示选择界面语言；之后可以在右上角或“设置”中切换。接着查看侧栏的连接状态。客户端可以连接兼容的本机 Runtime，也可以单独准备匹配的 CLI 和原生库。如果没有可用的 Runtime，请打开“更新”，选择“安装 / 更新 CLI”，并查看页面显示的进度和结果。缺少发布文件或版本不兼容时，客户端会显示错误；无法连接时可查看[诊断说明](client.md#settings-updates-and-diagnostics)。

![桌面端概览及 Runtime、同步状态](/client2/overview-zh.png)

截图展示 Client 2 0.2.22 的前端，使用模拟数据，并非真实账户。实际界面和状态可能不同。

## 登录或创建本地记忆库 {#sign-in-or-create-a-local-library}

打开“账户与空间”。如果已有账户，请选择“浏览器登录”或可用的密码登录方式，并按提示操作。在新设备上，请使用恢复流程取回已有密钥。

如果需要创建新的纯本地记忆库，请选择“初始化离线记忆库”。该操作为尚无本机密钥的记忆库生成恢复材料；请私密保存。不要为了修复登录问题而给已有记忆库重新生成密钥。云端登录和同步可以之后再配置。

## 连接 AI 工具 {#connect-an-ai-tool}

打开“安装”，选择提示词模式，再启用需要的 Agent。客户端会写入提示词，并在支持时准备或安装对应插件。部分宿主还需要在自身界面完成安装或信任钩子；请查看页面结果，再参考 [Agent 插件指南](plugins/)。

操作前请检查目标文件及其中已有的指令。切换模式会重写已启用 Agent 的提示词；关闭某个 Agent 会移除注入内容，但保留插件。DSH 的注入可能覆盖 `~/.dsh/AGENTS.md`，请先检查并备份该路径。

## 创建和查找记忆 {#create-and-find-a-memory}

打开“记忆”，选择“新建记忆”，填写标题和正文后保存。之后可以在同一页面搜索，也可以让已连接的 AI 工具询问这条事实。遇到相似记忆建议时，需要先作出选择；待处理建议不等于写入完成。

[客户端指南](client.md)介绍各页面、界面截图和数据边界。如需模型，请打开“模型与索引”；模型权重需要单独下载，基础使用可以不装模型。

## CLI 备选方案 {#cli-alternative}

CLI 适合终端工作流，也适合暂时无法使用桌面客户端的环境。对于注册表中已提供的版本，选择一种包管理器安装：

```sh
npm i -g rsrs-cli
```

或者使用 pnpm：

```sh
pnpm add -g rsrs-cli
```

两种命令都会安装 `rsrs` 启动器，任选一种即可。源码构建见[开发](development.md)。

## CLI 平台 {#cli-platforms}

下表列出构建产物的目标平台，并非已发布包的清单。安装前请确认所选版本及平台包已提供。

| 平台 | npm 平台包 | Rust target |
| --- | --- | --- |
| Linux x64，musl（默认） | `@rsrsai/linux-x64` | `x86_64-unknown-linux-musl` |
| Linux ARM64，musl（默认） | `@rsrsai/linux-arm64` | `aarch64-unknown-linux-musl` |
| Linux x64，glibc | `@rsrsai/linux-x64-gnu` | `x86_64-unknown-linux-gnu` |
| Linux ARM64，glibc | `@rsrsai/linux-arm64-gnu` | `aarch64-unknown-linux-gnu` |
| macOS Apple Silicon | `@rsrsai/macos-arm64` | `aarch64-apple-darwin` |
| Windows x64 | `@rsrsai/win-x64` | `x86_64-pc-windows-msvc` |
| Windows ARM64 | `@rsrsai/win-arm64` | `aarch64-pc-windows-msvc` |

Linux 默认使用 musl 包。在兼容的 glibc 主机上须显式选择 glibc；npm 和 pnpm 使用相同的启动器设置：

```sh
RSRS_LIBC=glibc rsrs doctor
RSRS_LIBC=musl rsrs doctor
# Keep the selection for subsequent commands in this shell:
export RSRS_LIBC=glibc
```

GNU 包要求兼容的 glibc 主机，不能在 Alpine 上运行。如果安装时省略了可选依赖，请安装与 `rsrs-cli` 版本相同的目标平台包。Intel Mac 不在产物目标范围内。

## 初次运行 {#first-commands}

安装兼容 CLI 后：

```sh
rsrs --version
rsrs help
rsrs doctor
rsrs --help
```

| 身份场景 | 命令 |
|---|---|
| 首个云端账户 | 按下方步骤交互注册 |
| 浏览器登录 | `rsrs login` 或 `rsrs login --oauth`；完成 dashboard 登录/TOTP 并批准 CLI |
| 终端登录 | `rsrs login --interactive`；输入密码、按要求输入 TOTP，再输入 super 密码 |
| 新设备 | 使用 `rsrs login --help` 与[同步与密钥](sync-and-keys.md)中说明的恢复选项 |
| 仅本地使用 | `rsrs keygen --json` |

仅在没有现有密钥的新配置中使用 `keygen`；不要为已有记忆库重新生成密钥。请私密保存 JSON 输出中的 `summary.super` 作为恢复材料。为这个新配置注册云账户时，请在宿主终端执行以下命令，并在提示时输入登录密码。请把 YOUR_NAME 换成你的用户名：

```sh
rsrs keygen --json
rsrs --runtime-internal --stop
rsrs --direct register --user YOUR_NAME
```

恢复材料应保存在 Git 和聊天日志之外。服务端无法恢复遗失的客户端解密秘密。不要只为修复登录问题而替换已有密钥。

配置的默认 API 为 `https://api.rsrs.rs`。本地开发服务使用 `--addr http://127.0.0.1:8787`。

Respire 使用 `~/.rsrs` 和 runtime 端口 `15169`。启动时保留已选账户及其设置。导入旧账户须使用 `rsrs migrate` 或 TUI 的 **Migrate old version**，选择来源并指定新账户名。纯备份目录不作为来源，已有目标会被拒绝，原始数据保持完整。迁移与恢复详情见[数据模型](data-model.md)。

```sh
rsrs inject --targets
rsrs inject --id codex
rsrs remember "A reusable decision for this project" --type decision --title "Project decision"
rsrs recall "project decision" --limit 3
rsrs tree
```

判重建议不等于写入完成：请检查建议并选择适当操作。[注入](injection.md) · [操作演练](walkthrough.md) · [常见问题](faq.md)
