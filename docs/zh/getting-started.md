# 开始使用 {#getting-started}

推荐先使用桌面客户端。它提供图形界面，可以管理本机 Runtime、账户、记忆、模型和 AI 工具连接。如果更习惯终端，或当前平台无法使用桌面客户端，可以选择 [CLI 备选方案](#cli-alternative)。

## 安装桌面客户端 {#install-the-desktop-client}

1. 打开 [Client 2 发布页](https://github.com/risense-ai/respire-client2/releases/latest)，选择与操作系统和处理器匹配的文件。发布页也提供校验和及版本说明。
2. Windows x64 下载 `respire-windows-amd64.exe`，ARM64 下载 `respire-windows-arm64.exe`。将文件放在可写入的固定目录中，再运行它。系统需要 Windows 10 或更高版本及 WebView2。
3. macOS 下载对应的 `respire-darwin-amd64.zip` 或 `respire-darwin-arm64.zip`，解压后将 `Respire.app` 保存在可写入的固定位置。系统需要 macOS 12 或更高版本；应用尚未使用 Developer ID 签名或公证。
4. Linux 下载对应的 `respire-linux-amd64.tar.gz` 或 `respire-linux-arm64.tar.gz`，解压后运行可执行文件。系统需要图形会话、GTK 3、WebKitGTK 4.1、X11 客户端库，以及兼容 Ubuntu 22.04 的系统库。这些应用使用 glibc，不能直接在 Alpine/musl 上运行。

使用桌面应用不需要安装 Node.js、npm、Go 或 Rust。桌面端和 CLI 分别发布，因此有桌面安装包不代表该平台一定有匹配的 Runtime。平台前提和验证范围见[平台支持](https://github.com/risense-ai/respire-client2/blob/main/docs/platforms.md)。

例如，截至 [CLI 1.0.19](https://github.com/risense-ai/respire-cli/releases/tag/v1.0.19)，发布资产中没有 macOS Intel 对应的 CLI。使用 Intel Mac 时，请先检查所选版本是否提供匹配资产；客户端也可以连接已经运行的兼容本机 Runtime。

## 连接 Runtime {#connect-the-runtime}

首次打开客户端时，按提示选择界面语言；之后可以在右上角或“设置”中切换。接着查看侧栏的连接状态。客户端可以连接兼容的本机 Runtime，也可以自行下载安装匹配的 CLI 和 Runtime。这个安装过程不需要 npm。如果没有可用的 Runtime，请打开“更新”，选择“下载并安装”，并查看页面显示的进度和结果。缺少发布文件或版本不兼容时，客户端会显示错误；无法连接时可查看[诊断说明](client.md#settings-updates-and-diagnostics)。

如果关闭了 Runtime 自动重启，安装后的版本会在下次启动 Runtime 时生效。CLI / Runtime 区域的“重启并应用”可用时，也可以用它启动新版本。

Client 2 将 CLI 保存在带版本号的目录中，不一定会把 `rsrs` 加入终端或 Agent 的 PATH。如果插件找不到它，请参阅[插件如何使用客户端管理的 CLI](plugins/#using-the-client-managed-cli)。

![桌面端概览及 Runtime、同步状态](/client2/overview-zh.png)

截图展示 Client 2 0.2.24 的前端，使用模拟数据，并非真实账户。实际界面和状态可能不同。

## 登录或创建本地记忆库 {#sign-in-or-create-a-local-library}

打开“账户与空间”。如果已有账户，请选择“浏览器登录”或可用的密码登录方式，并按提示操作。在新设备上，请使用恢复流程取回已有密钥。

如果需要新建云账户，请在“账户登录与恢复”中选择“注册账户”，填写服务器、账户名和密码，并按提示保存返回的恢复材料。密码认证需要 CLI 1.0.18 或支持账户 RPC 的兼容版本。

如果需要创建新的纯本地记忆库，请选择“初始化离线记忆库”。该操作为尚无本机密钥的记忆库生成恢复材料；请私密保存。不要为了修复登录问题而给已有记忆库重新生成密钥。云端登录和同步可以之后再配置。

## 连接 AI 工具 {#connect-an-ai-tool}

打开“配置Agent”，选择提示词模式，再启用需要的 Agent。客户端会写入提示词，并在支持时准备或安装对应插件。部分宿主还需要在自身界面完成安装或信任钩子；请查看页面结果，再参考 [Agent 插件指南](plugins/)。

操作前请检查目标文件及其中已有的指令。切换模式会重写已启用 Agent 的提示词；关闭某个 Agent 会移除注入内容，但保留插件。DSH 的注入可能覆盖 `~/.dsh/AGENTS.md`，请先检查并备份该路径。

## 创建和查找记忆 {#create-and-find-a-memory}

打开“记忆”，选择“新建记忆”，填写标题和正文后保存。之后可以在同一页面搜索，也可以让已连接的 AI 工具询问这条事实。遇到相似记忆建议时，需要先作出选择；待处理建议不等于写入完成。

[客户端指南](client.md)介绍各页面、界面截图和数据边界。如需模型，请打开“模型与索引”；模型权重需要单独下载，基础使用可以不装模型。

## CLI 备选方案 {#cli-alternative}

如果需要终端工作流，或当前系统无法使用桌面客户端，请阅读[独立安装 CLI](cli-install.md)。

<span id="cli-platforms"></span><span id="first-commands"></span>
