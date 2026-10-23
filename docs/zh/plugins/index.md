# Respire 插件 {#respire-plugins}

Respire 为每个宿主提供一个薄适配插件：把 [respire 引擎](../getting-started.md)（CLI 名 `rsrs`）挂进 agent 循环——每轮标题档自动召回、「记：」一前缀即落库、Stop 存储检查。本地优先、端侧加密、云端 LWW 同步。

所有插件共用一套运行时设计：

| 时机 | 行为 |
| --- | --- |
| 会话开始 | 注入记忆层简则，并做一次三态探测：未登录附注册引导、库近空附首日存料引导、缺语义模型附可选装法；一切就绪时零打扰 |
| 每轮 prompt | 自动 `rsrs recall --titles` 注入标题档——分数、8 位短 id、标题；正文由 agent 按需 `rsrs show <id>` 取 |
| prompt 以存料前缀开头 | 以「记：」「存：」或 `remember:` 开头的 prompt 直接 `rsrs remember … --importance important` 落库；引擎判为相似时不写入，回执转述候选，由模型决断（挂靠或直写） |
| Stop（AI 干完活） | 存储检查：续跑一轮，提示模型把本轮新的事实、决定与教训分条落库；闲聊不催。防循环＋`store_nudge_every` 节流 |
| prompt 以 `/nomem` 开头 | 本轮跳过召回 |

**模型可选。** 注册、登录、同步、召回全不依赖端侧模型——未装模型时引擎自动走词面档。BGE-M3 是纯可选增强：想要更好的语义召回再 `rsrs model install && rsrs model activate m3`，缺模型不报错、不拦路。

## 宿主 {#hosts}

| 宿主 | 仓库 | 安装通路 | 清单 | Stop 契约 |
| --- | --- | --- | --- | --- |
| ZCode | [respire-zcode](https://github.com/risense-ai/respire-zcode) | 本地目录市场源 | `.claude-plugin/marketplace.json` | `{"decision":"block","reason":…}` |
| Kimi Code | [respire-kimi](https://github.com/risense-ai/respire-kimi) | `/plugins install`（GitHub 或本地路径） | `kimi.plugin.json` | `hookSpecificOutput.permissionDecision: "deny"` |
| Dim | [respire-dimcode](https://github.com/risense-ai/respire-dimcode) | `dim plugin marketplace` | `.codex-plugin/plugin.json` | `{"decision":"block","reason":…}` |
| Qoder | [respire-qoder](https://github.com/risense-ai/respire-qoder) | `qoder plugins install` | `.qoder-plugin/plugin.json` | `{"decision":"deny"}` |
| WorkBuddy | [respire-workbuddy](https://github.com/risense-ai/respire-workbuddy) | `install.sh` 或 `codebuddy` CLI | `.codebuddy-plugin/marketplace.json` | `hookSpecificOutput.permissionDecision` |
| Hermes | [respire-hermes](https://github.com/risense-ai/respire-hermes) | 目录式 memory provider | `plugin.yaml` | provider API 的轮末检查 |

各宿主页：[ZCode](./zcode.md) · [Kimi Code](./kimi.md) · [Dim](./dimcode.md) · [Qoder](./qoder.md) · [WorkBuddy](./workbuddy.md) · [Hermes](./hermes.md)

引擎处处同一套。装插件不装引擎：`rsrs` 缺失时插件把 `npm i -g @rsrsai/cli@latest` 交给 agent 会话内代装，无需手动操作。注册每台机器一次：在 [rsrs.rs](https://rsrs.rs) 注册后本机 `rsrs register`；日常 `rsrs login` 浏览器授权、`rsrs status` 查态；autosync 常开，`rsrs sync` 手动同步。

## 首次使用 {#first-use}

1. **注册登录。** 在 [rsrs.rs](https://rsrs.rs) 注册账号，本机 `rsrs register`。不依赖模型，开箱即用。
2. **导入既有规则与记忆（一次成库，LLM 代抽）。** 在宿主开个新会话，粘贴对应宿主页给出的导入提示词——agent 会逐个读取你的 `AGENTS.md` 与技能文件，抽出可复用的事实、约定与红线（口令等敏感信息一律排除、只记位置），去重后用 `rsrs remember` 分条存入。
3. **可选：端侧模型。** `rsrs model install && rsrs model activate m3` 换取更强的语义召回；不装完全可用。

## 调优 {#tuning}

各适配读同一份配置文件 `respire.config.json`，位于其 hooks 旁（从包内 `respire.config.example.json` 复制；改动新会话生效，不涉及登录与账号）：

| 字段 | 默认 | 含义 |
| --- | --- | --- |
| `rsrs` | `""` | 引擎路径；空 = 自动探测（`PATH` → `~/.local/bin` → `~/.rsrs/bin`，宿主另有扩展） |
| `recall_threshold` | `0.0` | 召回分数下限；**0 = 默认关（引擎直出不过滤）**——设正数才启用过滤 |
| `recall_limit` | `5` | 每轮取前 N 条标题 |
| `min_prompt_chars` | `2` | 短于该长度的 prompt 跳过召回 |
| `session_rules` | `true` | 是否注入会话开始简则 |
| `budget_chars` | `1500` | 单轮注入总预算 |
| `enabled` | `true` | 总开关；`false` = 记忆层全线静默 |
| `store_nudge_every` | `1` | 存储检查节流：`1` = 每轮、`N` = 每 N 轮、`0` = 关 |
| `skip_prefixes` | `[]` | 宿主内部提示白名单（前缀、大小写不敏感）：命中则本轮不召回不落库 |
| `log` | `true` | 每事件一行 `hook.log` 留痕（超 256 KB 清轮） |

过滤默认不设阈值，是有意为之：噪音已被三层框住——引擎 skip 门、limit 5、标题档。历史教训：阈值每降一次都是真相关被拦的补救，漏召代价远大于多看两行标题。

## 排障 {#troubleshooting}

- **钩子以新会话为准。** 安装或更新插件后开新会话；运行中的会话不热载（Kimi Code 用 `/reload`）。
- **冷启动窗。** 引擎冷启加模型加载实测 7 秒以上，故 hook 超时 20 秒。探测失败会在会话开始注入诊断段，不静默失败。
- **召回质量是引擎上限。** 用词鸿沟下 BGE-M3 可能漏召真条；简则已约束模型换同义词、上位词或英文词补查。
- **每个事件都留痕。** 数据目录的 `hook.log` 每事件一行（时间、事件、输出大小、耗时、查询摘要）——按行复盘召回灵不灵。

## 数据安全 {#data-safety}

记忆库在本机；新配置即离线模式（不联网、不注册——召回落库照常，写入留本地队列，登录后补同步）。上云的只有密文：记录在本地加密后才上传，服务端永不持有账户解密密钥。企业可自建同步服务器（见[服务端部署](../server-deployment.md)），数据不出内网。
