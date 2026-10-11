# 开始使用 {#getting-started}

```mermaid
flowchart LR
  Install["安装兼容版本"] --> Model["检查模型资源"]
  Model --> Identity["创建 / 恢复身份"]
  Identity --> Inject["连接 AI 工具"]
  Inject --> Memory["存储与召回"]
```

| 安装方式 | 前提 |
|---|---|
| npm | `@rsrsai/cli` 启动器及匹配的平台包 |
| 桌面安装器 | [Respire Releases](https://github.com/risense-ai/respire-releases/releases) 仓库中的兼容产物 |
| 源码 | 基础设施源码与匹配的 Core SDK |

对于包注册表中已提供的版本，选择一种包管理器：

```sh
npm i -g @rsrsai/cli
pnpm add -g @rsrsai/cli
```

两种包管理器都会安装 `rsrs` 命令。源码构建见[开发](development.md)。

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

GNU 包要求兼容的 glibc 主机，不能在 Alpine 上运行。如果安装时省略了可选依赖，请安装与 `@rsrsai/cli` 版本相同的目标平台包。Intel Mac 不在产物目标范围内。

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
| 首个云端账户 | `rsrs register --user <name> --pass <login-password> --super <recovery-password>` |
| 浏览器登录 | `rsrs login` 或 `rsrs login --oauth`；完成 dashboard 登录/TOTP 并批准 CLI |
| 终端登录 | `rsrs login --interactive`；输入密码、按要求输入 TOTP，再输入 super 密码 |
| 新设备 | 使用 `rsrs login --help` 与[同步与密钥](sync-and-keys.md)中说明的恢复选项 |
| 仅本地使用 | `rsrs keygen --pass <password>` |

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
