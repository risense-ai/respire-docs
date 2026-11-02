# Respire 插件 {#respire-plugins}

Respire 为不同宿主提供独立插件。各插件的召回、存储、收尾和配置不同，请以宿主页为准。插件不附带 `rsrs` 引擎；先按[入门指南](../getting-started.md)安装并准备引擎。

点击宿主名称，可查看安装、使用、配置和排障说明。Dim 暂用字母图标；其余图标对应各宿主或其品牌。

## 宿主 {#hosts}

| 宿主 | 仓库 | 安装方式 | 清单 | 结束时的行为 |
| --- | --- | --- | --- | --- |
| <img src="/agents/zcode.png" alt="" width="24" height="24"> [ZCode](./zcode.md) | [respire-zcode](https://github.com/risense-ai/respire-zcode) | 本地目录市场源 | `.claude-plugin/marketplace.json` | `{"decision":"block","reason":…}` |
| <img src="/agents/kimi.png" alt="" width="24" height="24"> [Kimi Code](./kimi.md) | [respire-kimi](https://github.com/risense-ai/respire-kimi) | `/plugins install`（GitHub 或本地路径） | `kimi.plugin.json` | `hookSpecificOutput.permissionDecision: "deny"` |
| <img src="/agents/dimcode.svg" alt="" width="24" height="24"> [Dim](./dimcode.md) | [respire-dimcode](https://github.com/risense-ai/respire-dimcode) | `dim plugin marketplace` | `.codex-plugin/plugin.json` | `{"decision":"block","reason":…}` |
| <img src="/agents/qoder.png" alt="" width="24" height="24"> [Qoder](./qoder.md) | [respire-qoder](https://github.com/risense-ai/respire-qoder) | `qoder plugins install` | `.qoder-plugin/plugin.json` | `{"decision":"deny"}` |
| <img src="/agents/workbuddy.png" alt="" width="24" height="24"> [WorkBuddy](./workbuddy.md) | [respire-workbuddy](https://github.com/risense-ai/respire-workbuddy) | `install.sh` 或 `codebuddy` CLI | `.codebuddy-plugin/marketplace.json` | `hookSpecificOutput.permissionDecision` |
| <img src="/agents/hermes.png" alt="" width="24" height="24"> [Hermes](./hermes.md) | [respire-hermes](https://github.com/risense-ai/respire-hermes) | 目录式 memory provider | `plugin.yaml` | 后续 prefetch 中的存储提醒 |
| <img src="/agents/codex.png" alt="" width="24" height="24"> [Codex](./codex.md) | [respire-codex](https://github.com/risense-ai/respire-codex) | npm 市场 | `.codex-plugin/plugin.json` | 异步后台检查 |
| <img src="/agents/pi.png" alt="" width="24" height="24"> [Pi](./pi.md) | [respire-pi](https://github.com/risense-ai/respire-pi) | `pi install npm:@rsrsai/pi` | `package.json` | 结算后后台检查 |
| <img src="/agents/dsh.png" alt="" width="24" height="24"> [DSH](./dsh.md) | [respire-dsh](https://github.com/risense-ai/respire-dsh) | `plugin_manager` | `package.json` | 每轮至多一次提醒 |
| <img src="/agents/magpie.svg" alt="" width="24" height="24"> [Magpie](./magpie.md) | [respire-magpie](https://github.com/risense-ai/respire-magpie) | `magpie plugin add` | `package.json` | 回复后后台归档 |

各宿主页：[ZCode](./zcode.md) · [Kimi Code](./kimi.md) · [Dim](./dimcode.md) · [Qoder](./qoder.md) · [WorkBuddy](./workbuddy.md) · [Hermes](./hermes.md) · [Codex](./codex.md) · [Pi](./pi.md) · [DSH](./dsh.md) · [Magpie](./magpie.md)

先按下方说明准备 CLI 和 Runtime，再按宿主页登录及解锁。缺少引擎时，部分旧版插件会提示运行 `rsrs-cli` 安装命令；是否执行由用户决定。

## 使用客户端管理的 CLI {#using-the-client-managed-cli}

Client 2 可在“更新”页安装 CLI 和 Runtime，不需要通过 npm 安装。客户端不一定将可执行文件加入 PATH，因此 Agent 可能无法自动找到它。

默认路径为 `~/.rsrs/client2/runtime/<version>/rsrs`；Windows 的文件名为 `rsrs.exe`。请将 `<version>` 换成已安装版本。如果 Client 2 设置了 `RSRS_DATA_DIR`，请用该目录替代 `~/.rsrs`。如果在插件配置中填写路径，请使用完整的绝对路径；不要假设插件会展开 `~`。也可以将可执行文件所在目录加入宿主的 PATH。必要时重启宿主，再检查它是否连接到运行中的 Runtime。更新可能改变版本目录，更新后请重新核对路径。

Codex 可设置 `RESPIRE_RSRS_PATH`，Pi 可使用 `--respire-rsrs`，DSH 可配置 `rsrsPath`。ZCode、Kimi、Qoder 和 Hermes 支持 `RESPIRE_BIN`；Dim 和 WorkBuddy 可使用 `RESPITE_RSRS` 或各自配置中的 `rsrs`。环境变量必须传入宿主进程。Magpie 直接连接本机 HTTP Runtime，无需为插件配置 CLI 路径。

## 调优 {#tuning}

下表适用于多数 Python 钩子适配器；配置位置和支持字段以宿主页为准。Hermes、Codex、Pi、DSH 和 Magpie 使用不同配置方式。

| 字段 | 默认 | 含义 |
| --- | --- | --- |
| `rsrs` | `""` | 引擎路径；空 = 自动探测（`PATH` → `~/.local/bin` → `~/.rsrs/bin`，宿主另有扩展） |
| `recall_threshold` | `0.0` | 召回分数下限；**0 = 默认关（插件不按分数过滤引擎结果）**——设正数才启用过滤 |
| `recall_limit` | `5` | 每轮取前 N 条标题 |
| `min_prompt_chars` | `2` | 短于该长度的 提示不进行召回 |
| `session_rules` | `true` | 是否在会话开始时加入记忆规则 |
| `budget_chars` | `1500` | 单轮注入总预算 |
| `enabled` | `true` | 总开关；`false` = 关闭记忆功能 |
| `store_nudge_every` | `1` | 存储检查频率：`1` = 每轮、`N` = 每 N 轮、`0` = 关 |
| `skip_prefixes` | 宿主各异 | 宿主内部提示的跳过前缀（不区分大小写）：匹配时不召回、不存储 |
| `log` | `true` | 每个事件向 `hook.log` 写一行（超过 256 KB 后清空） |

默认不按分数过滤召回结果。引擎会判断是否跳过召回，插件默认最多返回五条标题；需要过滤时可调整阈值。

## 排障 {#troubleshooting}

检查 `rsrs --version`、`rsrs --client-only status --json`，并按宿主页确认插件已加载。部分 Python 钩子将查询片段写入本地 `hook.log`；日志脱敏不能识别所有敏感信息，请保护日志。

## 数据安全 {#data-safety}

召回内容和回执可能进入宿主上下文并发送给模型提供商。本地加密不改变这一点；各插件的后台处理和数据流见对应页面。
