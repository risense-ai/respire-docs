# Agent Plugins 通用包 {#respire-for-agent-plugins}

[respire-general](https://github.com/risense-ai/respire-general) 面向支持 [Agent Plugins 1.0](https://agent-plugins.org/) 但没有专用 respire 适配的客户端。它只使用协议标准化的两类组件：一个 Agent Skill 和一个 MCP server；没有宿主 hooks，也没有宿主私有清单。

客户端能加载 skill 并连接 MCP、但没有插件 hook 生命周期时用它。已有专用适配的宿主优先用专用适配：hooks 能自动召回/落库，不必依赖模型自觉执行。

## 包结构 {#package-layout}

```text
respire-general/
├── plugin.json                 # Agent Plugins 1.0 manifest
├── mcp.json                    # node mcp/respire-mcp.mjs -> rsrs mcp
├── skills/respire/SKILL.md
├── mcp/respire-mcp.mjs
├── lib/inject.mjs
└── scripts/setup-inject.mjs
```

## 安装 {#install}

### 1. 引擎 {#_1-engine}

```bash
npm i -g @rsrsai/cli@latest
rsrs --version
```

无全局写权限时先试：

```bash
npm config set prefix ~/.npm-global
npm i -g @rsrsai/cli@latest
```

### 2. 插件 {#_2-plugin}

把整个 `respire-general` 目录放进客户端的本地插件根，或用客户端的目录安装命令，然后重启会话。包内没有安装器，也不安装引擎。

### 3. 注册登录 {#_3-register}

去 [rsrs.rs](https://rsrs.rs) 注册，本机跑 `rsrs register`。日常 `rsrs login`；`rsrs status` 查态。

## 客户端得到什么 {#what-the-client-gets}

| 组件 | 行为 |
|---|---|
| Skill `respire` | 告诉模型何时翻忆、怎么存、标题规则与安全边界 |
| MCP `respire` | 通过极薄 stdio 桥启动 `rsrs mcp`，暴露 `memory_recall`、`memory_remember`、`memory_show` 等工具 |
| 无 hooks | 召回与落库由 agent 主动执行；没有每轮自动召回，也没有 Stop 存储检查 |

MCP 桥自己解析引擎（含 Windows `.cmd` shim），客户端不需要知道 npm shim 怎么启动。

## 无 hook 宿主的首次 inject {#first-run-inject-for-hookless-hosts}

`rsrs inject` 把记忆规则写进宿主的指令文件（`CLAUDE.md`、`AGENTS.md`、`MEMORY.md` 等）。它是一次性/可刷新的文件写入，不是每轮 hook。

```bash
node scripts/setup-inject.mjs --target auto
node scripts/setup-inject.mjs --target auto --check
```

脚本先跑 `rsrs inject --targets --json`，然后：

1. 目标 `absent` / `stale` → `rsrs inject --id <target>`；
2. 目标 `current` → 跳过；
3. 注入成功后，结果记录到插件数据目录下的 `inject-state.json`。

MCP 桥首次启动时也会做同样检查（`auto_inject` 默认开启）。只对检测到的宿主动手；mcode 会被跳过，因为 `rsrs inject` 没有 mcode target。不需要自动注入时设 `auto_inject: false`。

配置优先级（MCP 桥与 setup 脚本）：

1. `RESPITE_CONFIG`
2. `$PLUGIN_DATA/respire.config.json`
3. `$PLUGIN_ROOT/respire.config.json`

## 边界 {#limits}

- hooks 不属于 Agent Plugins 1.0；通用包无法做到每轮自动召回。
- `rsrs inject` 没有 mcode target；mcode 用 hooks 包，或用 `--append-system-prompt-file` 启动器。
- 自动 inject 会写宿主指令文件；不需要时用 `auto_inject: false` 关闭。
- MCP 桥需要客户端 MCP 的 `PATH` 上有 `node`；引擎本身也是 Node CLI。

## 验证 {#verify}

```bash
node scripts/validate.mjs
node scripts/validate.mjs ../respire-minimax-code
node tests/run.mjs
```

完整清单见仓库 README。
