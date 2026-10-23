# Kimi Code 版 respire {#respire-for-kimi-code}

[respire-kimi](https://github.com/risense-ai/respire-kimi) 以 Kimi Code 标准 `/plugins` 链路把 respire 记忆引擎装进 Kimi Code：每轮标题档自动召回、「记：」一前缀即落库、Stop 存储检查。共用运行时行为、首次使用步骤与调优参考见[插件总览](./index.md)。

## 安装 {#install}

```bash
/plugins install https://github.com/risense-ai/respire-kimi
# or from a local path:
/plugins install /local/path/to/respire-kimi
```

装完 `/reload` 或 `/new` 开新会话即生效。**插件是用户级**——装入 `$KIMI_CODE_HOME/plugins/managed/respire/`，对你所有项目生效，不是单项目配置。

升级：在 `/plugins` 面板对 respire 执行更新（或重新 install 覆盖），随后 `/reload`。

引擎（`rsrs`）缺失时插件把 `npm i -g @rsrsai/cli@latest` 交给 agent 代跑，装完同会话内即恢复召回与落库。

## 会话内发生什么 {#what-happens-in-a-session}

| 时机 | 行为 |
| --- | --- |
| 会话全程 | `systemPromptPath`（SYSTEM.md）常驻系统提示：答前必查、收尾必存、遇障先翻忆、敏感红线简则 |
| `SessionStart`（startup/resume） | 加载 `skills/respire` playbook 技能并做一次状态探测；引擎未装/未登录/库空/缺模型的引导写入 `.pending_nudge` 状态文件（Kimi SessionStart 输出不进模型上下文），由首个 `UserPromptSubmit` 置顶带出后即删 |
| `UserPromptSubmit` | 自动 `rsrs recall --titles`：标题档注入——只给分数 + 短 id + 标题；斜杠命令 token（`/skill:…`、`/respire:…`）召回前自动剥除；默认直出不过滤 |
| 存料前缀 | 「记：」/「存：」/`remember:` → 直接 `rsrs remember … --importance important`；判为相似时回执转述候选，模型决断 |
| `Stop` | 存储检查：以 `hookSpecificOutput.permissionDecision: "deny"` JSON 续跑一轮，提示模型把本轮新事实落库；续跑轮带 `stop_hook_active=true` 即放行 |
| `/nomem` 前缀 | 本轮跳过召回 |
| 快捷指令 | `/respire:recall <term>`、`/respire:store <content>`、`/respire:sync`；技能本身经 `/skill:respire:respire` 唤起 |

## 启用与关闭 {#enable-and-disable}

| 档 | 怎么关 | 范围 |
| --- | --- | --- |
| 单轮 | prompt 前缀 `/nomem` | 只关本轮召回 |
| 总开关 | `respire.config.json` 设 `"enabled": false` | 记忆层全线静默（召回/落库/存储检查） |
| 插件级 | `/plugins disable respire` | Kimi 侧整插件卸力 |

## 首次使用 {#first-use}

1. 在 [rsrs.rs](https://rsrs.rs) 注册，本机 `rsrs register`。日常 `rsrs login`、`rsrs status`。
2. 导入既有规则——新会话粘贴整段：

   > 请把本机 Kimi Code 的既有规则与记忆导入 respire：逐个读取——`~/.kimi-code/AGENTS.md`（用户级规则，若在）、你常用项目根下的 `AGENTS.md`、`~/.agents/skills/*/SKILL.md`；抽出可复用的事实、约定、教训与红线（口令、证件号、卡号、私钥一律排除、只记位置），去重后用 `rsrs remember` 分条存入（`--importance important`、标题按事实句；判重给候选先决断挂靠或合并），存完给我一份清单。

   空库首日同一线索经首个 prompt 带出。
3. 可选模型：`rsrs model install && rsrs model activate m3`。

## 调优 {#tuning}

配置文件：`$KIMI_CODE_HOME/plugins/managed/respire/hooks/respire.config.json`（缺失即全默认；`/reload` 或新会话生效）。公共字段见[总览](./index.md#tuning)。Kimi 特有：`session_rules` 只管状态探测与 `.pending_nudge` 引导——简则本身由 `systemPromptPath` 常驻承担。

## 卸载 {#uninstall}

```text
/plugins remove respire
```

## 已知边界 {#known-limits}

- **真机安装加载未在 CI 验证**：清单与 hooks 形状按官方文档静态对齐（2026-10-23 核对）；`/plugins install` 后的真实加载路径以你本机实测为准。
- `SessionStart` matcher 仅覆盖 `startup|resume`；长会话压缩后 `/reload` 或新会话即复简则。
- 召回质量是引擎上限；冷启动窗下 hook 超时 20 秒、recall 14 秒、probe 10 秒。

测试与设计要点见[仓库 README](https://github.com/risense-ai/respire-kimi#readme)。
