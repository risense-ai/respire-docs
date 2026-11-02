# MiniMax Code 的 respire 插件 {#respire-for-minimax-code}

[respire-minimax-code](https://github.com/risense-ai/respire-minimax-code) 用官方 **MiniMax Plugin V1** 格式（`.minimax-plugin/`）把 respire 引擎挂进 [MiniMax Code](https://github.com/MiniMax-AI/minimax-code) 0.4.0+。它提供一个 Agent Skill、一个 stdio MCP server，以及三类生命周期 hooks：`SessionStart`、`UserPromptSubmit`、`Stop`。

目标版本是 mcode 0.4.0+，已在 mcode 0.6.12 / 0.7.4 实测。不支持 mcode 0.3.x：那一条版本线读便携根清单，会忽略 hooks。

## 包结构 {#package-layout}

```text
respire-minimax-code/
├── .minimax-plugin/plugin.json   # schemaVersion 1: icon, category, mcp, skills, hooks
├── icon.png
├── respire.mcp.json              # node ./mcp/respire-mcp.mjs -> rsrs mcp
├── hooks/respire-hooks.json
├── hooks/scripts/respire-hook.mjs
├── mcp/respire-mcp.mjs
└── skills/respire/SKILL.md
```

## 安装 {#install}

### 1. 引擎 {#_1-engine}

```bash
npm i -g @rsrsai/cli@latest
rsrs --version
```

### 2. 插件 {#_2-plugin}

把 `respire-minimax-code` 目录放进当前 mcode profile 的本地插件目录，然后在 TUI 里刷新 `/plugins`：

```bash
mcode plugin marketplace list
mcode plugin list --available --marketplace local
```

也可以按 V1 格式提交官方 Marketplace；本地安装不需要先通过官方审核。

### 3. 注册登录 {#_3-register}

去 [rsrs.rs](https://rsrs.rs) 注册，本机跑 `rsrs register`。日常 `rsrs login`；`rsrs status` 查态。

## 会话行为 {#session-behavior}

| 时机 | 行为 |
|---|---|
| `SessionStart` | 注入记忆层简则，并做一次状态探测：未登录、库近空或缺可选模型；就绪时零打扰 |
| `UserPromptSubmit` | 跑 `rsrs recall --titles` 注入标题档——分数、8 位短 id、标题；正文由 agent 按需读。语义预算超时后回退到 `rsrs diary --contains`（只取 important） |
| 存料前缀 | 「记：」/「存：」/ `remember:` → `rsrs remember … --importance important`；相似时回执候选，由模型决断 |
| `Stop` | 存储检查：`{"decision":"block","reason":…}` 续跑一轮；`stop_hook_active=true` 时放行 |
| `/nomem` | 本轮跳过召回 |
| `$skill:` | 召回前剥除，防技能名词面污染 |

hook 解析器把单个 handler 限制在 10 秒内。适配层用 3.5s 做语义召回、7.5s 做整体召回（含词面兜底）、5s 做状态探测、8s 做落库。失败不阻塞会话：hook 始终 exit 0；召回与状态探测降级为静默，落库时缺引擎则返回安装命令。

## 配置 {#configuration}

优先级：

1. `RESPITE_CONFIG`
2. `$PLUGIN_DATA/respire.config.json`
3. `$PLUGIN_ROOT/respire.config.json`

公共字段见[插件总览](./index.md#tuning)。MiniMax 特有：

- `store_force: true`：大库判重慢时，`记：` 直接 `--force` 落库；回执会注明未判重。
- `semantic_timeout_ms`：语义召回预算；词面兜底受整体 7.5s 限制。
- `auto_inject` 对 mcode 无意义：`rsrs inject` 没有 mcode target。

## 验证 {#verify}

```bash
node ../respire-general/scripts/validate.mjs .
node ../respire-general/tests/run.mjs --check
```

官方 Marketplace 校验由 mcode 的插件工具链执行；本地加载不需要先通过审核。本包自身的检查见上。

## 已知边界 {#known-limits}

- **只支持 0.4.0+**：0.3.x 读便携根清单，会忽略 hooks。
- **社区 Registry**：`MiniMax-Code-Plugins` 校验器要求根 `plugin.json`，V1 包面向官方 Marketplace；社区目录适合提交便携的 `respire-general`。
- **官方上架**：GitHub 已发布 `v0.3.0`。issue [#580](https://github.com/MiniMax-AI/minimax-code/issues/580) 跟踪官方提交路径，当前尚未进入官方目录。
- **不装模型完全可用**：注册、登录、同步与词面召回不依赖 BGE-M3；模型是可选增强。

完整测试日志与设计说明见[仓库 README](https://github.com/risense-ai/respire-minimax-code#readme)。
