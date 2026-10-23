# Hermes Agent 版 respire {#respire-for-hermes-agent}

[respire-hermes](https://github.com/risense-ai/respire-hermes) 按官方 [Memory Provider Plugins](https://hermes-agent.nousresearch.com/docs/developer-guide/memory-provider-plugin) 契约实现，让 Hermes 与本机其他 agent（ZCode、Kimi Code 等）共享同一座本地加密记忆库。与钩子适配不同，它是**目录式 memory provider**：Hermes 经 provider API 调用，不走 shell 钩子。调优参考见[插件总览](./index.md)。

## 形态与行为 {#what-it-does}

- **每轮 `prefetch`**：按当轮 query 自动召回标题档（分数 + 短 id + 标题，预算内截断）；正文按需 `respire_show`
- **`system_prompt_block`**：注入用法简则＋引擎状态引导（未装引擎/未登录/空库/缺语义模型时才出对应段，否则零打扰）
- **三个工具**：`respire_recall` / `respire_show` / `respire_remember`（判后即存：相似会给候选，挂靠或直写由模型决断）
- 消息以「记：」「存：」或 `remember:` 开头 → provider 直接落库保底并回执；`/nomem` 前缀关闭当轮自动召回
- 轮末检查：干完活没存才催，闲聊零打扰
- fail-open：引擎缺失/超时/解析失败一律降级为空注入，绝不阻断宿主回合

形态是 **wrapper 式目录 provider、零 Python 依赖面**：引擎是 npm 装的 `rsrs` CLI sidecar（subprocess 调用）。插件根无 `pyproject.toml` / `pip_dependencies`，享受 `HERMES_HOME` 生存契约（`hermes update` 不动本目录）。注意 respire 库本身是**用户级**——一人一库、跨 agent 与 Hermes profile 共享，这是 respire 的产品设计，与 Hermes 默认的按 profile 隔离不同。Hermes 同一时间只允许一个外部 memory provider 激活。

## 安装 {#install}

前置：Python 3.9+（Hermes 自带）、Node.js（引擎 sidecar 用）。

```bash
# 1) Engine (skip if installed; verify with rsrs --version)
npm i -g @rsrsai/cli@latest
rsrs register --user <your name>   # first-device registration, sign up at https://rsrs.rs
# semantic recall (optional): rsrs model install && rsrs model activate m3

# 2) Plugin (either way)
bash scripts/install.sh                 # copies into $HERMES_HOME/plugins/respire/
# or manually: cp -R this directory (minus .git/dist) to ~/.hermes/plugins/respire/

# 3) Activate
hermes memory setup                     # pick respire in the wizard (asks only for the rsrs path; empty = auto-detect)
# or set memory.provider: respire in config and restart Hermes
```

装好用 `hermes respire status` 验证（该子命令仅在本 provider 激活时出现）。

## 配置 {#configuration}

向导极简（官方建议）：只提示 `rsrs_path`。其余可选项手改 **`$HERMES_HOME/respire.json`**（参考 `respire.config.example.json`）。公共字段见[总览](./index.md#tuning)；Hermes 另有 `auto_recall`（默认 `true`——`false` 时只留工具）。环境变量：`RESPIRE_BIN` / `RESPITE_RSRS`（引擎路径）、`RESPITE_CONFIG`（配置文件路径）、`RESPITE_LOG`（日志路径）。日志写 `$HERMES_HOME/respire/plugin.log`。

## 工具 {#tools}

| 工具 | 参数 | 说明 |
| --- | --- | --- |
| `respire_recall` | `query`（必填）、`limit`（默认 8，≤20） | 语义召回标题档 |
| `respire_show` | `id`（短 id 前 8 位即可） | 读全文＋上/下游因果链 |
| `respire_remember` | `content`（必填）、`title`、`importance`、`parent`、`force` | 判后即存；`pending` = 有候选待决断 |

另注册只读技能 `respire:respire`（记忆操作法全文）。

## 已知边界 {#known-limits}

- **未做真机 E2E**：契约逐条取自官方 memory-provider-plugin 文档（2026-10-23 版）；本地验证为脱离 Hermes 的结构等价桩＋真 `rsrs` 引擎的工具/prefetch/配置回环（`tests/test_provider.py`）。若真机行为不符，最可能要调的是 `get_tool_schemas()`（OpenAI function 格式，推断）与 `get_status_config()`（平面 dict，推断）。
- 桌面端配置面板文件（`config_schema.py`）格式官方未公开，暂未随包；面板配置可先手改 `respire.json`。

开发与打包见[仓库 README](https://github.com/risense-ai/respire-hermes#readme)。
