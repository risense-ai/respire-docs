# ZCode 版 respire {#respire-for-zcode}

[respire-zcode](https://github.com/risense-ai/respire-zcode) 以 ZCode 标准插件市场把 respire 记忆引擎装进 ZCode：每轮标题档自动召回、「记：」一前缀即落库、Stop 存储检查。共用运行时行为、首次使用步骤与调优参考见[插件总览](./index.md)。

## 安装 {#install}

插件不带安装脚本，走 ZCode 市场的本地目录源：

```bash
git clone https://github.com/risense-ai/respire-zcode.git && cd respire-zcode
python3 scripts/validate_plugin.py                     # self-check: structure / manifest / hooks / secret scan
```

然后在本机 ZCode 客户端：

1. **插件市场 → 添加 → 添加插件市场**：粘贴克隆的仓库目录（市场根 = 仓根，清单在 `.claude-plugin/marketplace.json`）。
2. **个人 → risense-zcode → respire → 安装**。
3. 开**新会话**——SessionStart 注入简则即标志钩子已挂上。

市场源即管理入口：**设置 → 插件** 停用或移除插件；删除市场源（插件市场 → 市场源 → risense-zcode）一并移除。引擎（`rsrs`）缺失时插件把安装命令（`npm i -g @rsrsai/cli@latest`）注入会话交 agent 代装——检测就绪后同会话内即恢复。

## 会话内发生什么 {#what-happens-in-a-session}

| 时机 | 行为 |
| --- | --- |
| `SessionStart` | 注入记忆层简则；一次三态探测——未登录附注册引导、库不足 10 条附首日存料、缺 BGE-M3 附可选装法；就绪时零打扰 |
| `UserPromptSubmit` | 自动 `rsrs recall --titles`：标题档注入——只给分数 + 8 位短 id + 标题；正文由 agent `rsrs show <id>` 取；默认直出不过滤（噪音边界 = 引擎 skip 门、limit 5、标题档） |
| 存料前缀 | 「记：」/「存：」/`remember:` → 直接 `rsrs remember … --importance important`；判为相似时回执转述候选，模型决断 |
| `Stop` | 存储检查：`{"decision":"block","reason":…}` 续跑一轮，提示模型把本轮新事实落库；续跑轮带 `stop_hook_active=true` 即放行（ZCode 自身限续跑至多三次） |
| `/nomem` 前缀 | 本轮跳过召回 |
| `skills/respire` | 按需加载操作法（recall/remember/show/forget/sync）；技能是说明书，动作全由钩子驱动 |

## ZCode 协议要点 {#zcode-protocol-notes}

与姊妹适配的三处实质差异，已核 ZCode runtime 源码：

1. **输出通道是 JSON 不是纯文本。** ZCode 对 hook stdout 只认以 `{` 开头且过严格 schema 的 JSON——纯文本被静默丢弃、非法 JSON 判 hook 失败。故一切注入走顶层 `{"additionalContext": "…"}`（SessionStart / UserPromptSubmit / Stop 三事件均消费）。
2. **Stop 阻塞决策枚举是 `approve|block`。** 用 `{"decision":"block","reason":…}`；Qoder 版的 `"deny"` 过不了 ZCode schema。
3. **数据目录是 `ZCODE_PLUGIN_DATA`**（探测链 `RESPITE_DATA` → `ZCODE_PLUGIN_DATA` → 脚本目录）；stdin 全量携带事件字段（`prompt` / `stop_hook_active` / `hook_event_name`），事件识别走 argv → stdin → `ZCODE_HOOK_EVENT` 三级回退。

## 首次使用 {#first-use}

1. 在 [rsrs.rs](https://rsrs.rs) 注册，本机 `rsrs register`。日常 `rsrs login`、`rsrs status`。
2. 导入既有规则——在 ZCode 新会话粘贴整段：

   > 请把本机既有规则与记忆导入 respire：逐个读取——`~/.zcode/AGENTS.md`（家目录规则，若在）、工作区根与各项目的 `AGENTS.md`、`~/.agents/skills/*/SKILL.md`；抽出可复用的事实、约定、教训与红线（口令、证件号、卡号、私钥一律排除、只记位置），去重后用 `rsrs remember` 分条存入（`--importance important`、标题按事实句；判重给候选先决断挂靠或合并），存完给我一份清单。

   空库首日 SessionStart 会注入同一线索。
3. 可选模型：`rsrs model install && rsrs model activate m3`。

## 调优 {#tuning}

配置文件：插件安装目录下 `hooks/respire.config.json`（缺失即全默认；新会话生效）。公共字段见[总览](./index.md#tuning)；ZCode 适配另有 `skip_prefixes`，用于宿主内部提示（如自动化 Recap）。

## 卸载 {#uninstall}

**设置 → 插件** 找到 respire 停用或卸载；或删除市场源（插件市场 → 市场源 → risense-zcode）一并移除。

## 已知边界 {#known-limits}

- 召回质量是引擎上限——用词鸿沟下换同义词或上位词补查。
- 冷启动窗：hook 超时 20 秒、recall 14 秒、probe 10 秒；探测失败在会话开始注入诊断段。
- ZCode 限 Stop 续跑至多三次；本层每轮至多催一次。
- 安装与更新仅对新会话生效。

测试与发版流程见[仓库 README](https://github.com/risense-ai/respire-zcode#readme)。
