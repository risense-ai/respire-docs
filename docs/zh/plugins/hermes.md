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

## 导入已有记忆 {#import-existing-memory}

Hermes 的内置记忆与外部 provider **并存**：切到 respire 后，`MEMORY.md` / `USER.md` 仍照常注入系统提示，但 respire 的 `prefetch` 不会读取它们。按旧记忆所在位置分三种情况处理。

### Hermes 内置记忆 {#built-in-memory}

`MEMORY.md`（agent 笔记）与 `USER.md`（用户画像）位于 `$HERMES_HOME/memories/`，命名 profile 在 `$HERMES_HOME/profiles/<name>/memories/`；条目以 `§` 分隔，两个文件分别有 2,200 / 1,375 字符上限。

推荐在新会话里让 Hermes 自己搬，这样能走 `respire_remember` 的判重与因果挂靠：

> 读取 `$HERMES_HOME/memories/MEMORY.md` 和 `USER.md`，以 `§` 为分隔拆成独立条目，逐条调用 `respire_remember` 存入 rsrs：
> - 每条用「主语+动作+结果」的事实句作标题，`importance=important`；
> - 保留原意，不要把不同事实合并成一条；
> - 返回 `pending`（相似候选）时先判断：同一事实用 `parent` 挂靠，不同事实用 `force` 新建；
> - 完成后用 `respire_recall` 抽查 2-3 条确认可召回。

命令行也可以逐条写入（`rsrs remember` 默认 `trivial`，须显式给 `important`）：

```bash
rsrs remember "<entry>" --title "<fact-sentence title>" --importance important
```

条目多时可用 `rsrs import <file.json>` 批量导入（JSON 数组，以 `rsrs export` 的输出为格式样例；导入后跑 `rsrs audit` 检查重复）。导入后建议先保留内置条目，确认 rsrs 召回稳定后再精简，避免两边各留一份长期漂移。

### Hermes 历史会话 {#hermes-session-history}

`rsrs extract` 原生支持 Hermes，但它抽取的是**会话记录**，不是 `MEMORY.md`：

```bash
rsrs extract --targets                       # confirm the hermes source is detected
rsrs extract --id hermes --dry-run           # preview
rsrs extract --id hermes --since 90d --limit 50
```

每个会话生成一条记忆（标题 `Hermes session <first request>`，正文为【前因】【行为】【后果】），默认落为根节点；之后用 `rsrs audit`、`rsrs candidates`、`rsrs tree-cure` 做整理。`--since` / `--limit` 控制抽取范围，重复运行会按源指纹跳过未变化的会话。

### 其他 memory provider {#other-memory-providers}

Hermes 没有 provider 之间的迁移 API：切换只会停用旧 provider，旧数据仍留在原服务。先从旧 provider 导出（例如 Honcho 的 conclusions / profile），整理成 `rsrs import` 的 JSON 数组，或在会话里让 agent 读取后逐条 `respire_remember`。`rsrs share-import` 只用于 rsrs 子树分享，不是通用导入。

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
- 未实现可选 hook `on_memory_write`：切换后通过 Hermes 内置 `memory` 工具新增/修改的条目不会自动镜像进 rsrs，需按[导入已有记忆](#import-existing-memory)手动迁移；要长期自动同步需给插件补该 hook。

开发与打包见[仓库 README](https://github.com/risense-ai/respire-hermes#readme)。
