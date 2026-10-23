# Dim 版 respire {#respire-for-dim}

[respire-dimcode](https://github.com/risense-ai/respire-dimcode) 以 Dim 标准插件市场把 respire 记忆引擎装进 Dim agent：每轮标题档自动召回、「记：」一前缀即落库、Stop 存储检查。共用运行时行为、首次使用步骤与调优参考见[插件总览](./index.md)。

## 安装 {#install}

```bash
git clone https://github.com/risense-ai/respire-dimcode.git && cd respire-dimcode
python3 scripts/validate_plugin.py                     # self-check: structure / manifest / hooks / secret scan
dim plugin marketplace add .agents/plugins/marketplace.json
dim plugin install respire@risense
```

升级（源仓拉新后覆盖装）：

```bash
git pull
dim plugin marketplace upgrade risense     # refresh the registered source — the marketplace loads the registration-time snapshot
dim plugin install respire@risense --overwrite
```

若自定义过 `hooks/respire.config.json`，从旧目录拷回（旧默认值不会自动升级）。安装位置：`~/.dimcode/v2/plugins/respire/`（CN 发行版；Global 为 `~/.dim/v2/plugins/`，源码默认 `~/.agents/plugins/`——复制安装，改源码需重装）。

验证：

```bash
ls ~/.dimcode/v2/plugins/respire                 # .codex-plugin, hooks, skills all present
echo '{"prompt":"respire 测试"}' | python3 ~/.dimcode/v2/plugins/respire/hooks/respire.py UserPromptSubmit
```

两条 Dim 现状须知（已核源码）：`dim` **无** `plugin list` 子命令；`dim hooks list` 只列 project/user 两路配置、**不列插件钩子**——list 显示空不等于钩子没挂。插件本体在 TUI / Desktop 插件页查，生效与否以新会话实测为准。

引擎（`rsrs`）缺失时插件把 `npm i -g @rsrsai/cli@latest` 注入会话代装。**新会话起生效。**

## 会话内发生什么 {#what-happens-in-a-session}

| 时机 | 行为 |
| --- | --- |
| `SessionStart` | 注入记忆层简则（对整会话与 subagent 生效）；一次三态探测——注册引导/首日存料/可选模型；就绪时零打扰 |
| `UserPromptSubmit` | 自动 `rsrs recall --titles`：标题档注入——只给分数 + 短 id + 标题；正文经 `rsrs show <id>` 取（附因果链）；默认直出不过滤 |
| 存料前缀 | 「记：」/「存：」/`remember:` → 直接 `rsrs remember … --importance important`；判为相似时回执转述候选，模型决断 |
| `Stop` | 存储检查：`block` + reason 续跑一轮，提示模型把本轮新事实落库；续跑轮带 `stop_hook_active=true` 即放行 |
| `/nomem` 前缀 | 本轮跳过召回 |
| `$skill:` 前缀 | 召回前剥除，防技能名词面污染 query |
| `skills/respire` | 按需加载操作法；技能是说明书，动作全由钩子驱动 |

## 启用与关闭 {#enable-and-disable}

| 档 | 怎么关 | 范围 |
| --- | --- | --- |
| 单轮 | prompt 前缀 `/nomem` | 只关本轮召回 |
| 总开关 | `respire.config.json` 设 `"enabled": false` | 记忆层全线静默（简则/召回/落库） |
| 组件级 | Dim 插件页对 respire 的 **hook 组件**逐项开关（`skill`/`hook`/`mcp` 原生支持） | Dim 侧直接卸力 |

## 首次使用 {#first-use}

1. 在 [rsrs.rs](https://rsrs.rs) 注册，本机 `rsrs register`。日常 `rsrs login`、`rsrs status`。
2. 导入既有规则——Dim 新会话粘贴整段：

   > 请把本机 Dim 的既有规则与记忆导入 respire：逐个读取——`~/AGENTS.md`（家目录规则，若在）、你常用项目根下的 `AGENTS.md`、`~/.dimcode/v2/skills/*/SKILL.md`、`~/.dimcode/v2/hooks.json`、`~/.dimcode/v2/notes/` 与 `plan-drafts/` 下的 md；抽出可复用的事实、约定、教训与红线（口令、证件号、卡号、私钥一律排除、只记位置），去重后用 `rsrs remember` 分条存入（`--importance important`、标题按事实句；判重给候选先决断挂靠或合并），存完给我一份清单。

   空库首日 SessionStart 会注入同一线索。
3. 可选模型：`rsrs model install && rsrs model activate m3`。

## 调优 {#tuning}

配置文件：`~/.dimcode/v2/plugins/respire/hooks/respire.config.json`（缺失即全默认；新会话生效）。公共字段见[总览](./index.md#tuning)。

## 卸载 {#uninstall}

`dim` 无 `plugin uninstall` 子命令（已核源码）——搬移式卸载，**目标必须在 plugins 根之外**（根内带 manifest 的残留目录会被 Dim 当插件继续加载、钩子双跑）：

```bash
mv ~/.dimcode/v2/plugins/respire ~/.dimcode/v2/plugins-backup/respire.removed-$(date +%s)
```

## 已知边界 {#known-limits}

- 召回质量是引擎上限；冷启动窗下 hook 超时 20 秒、recall 14 秒、probe 10 秒。
- **PostCompact 不可重注**（Dim 协议该事件仅副作用）：长会话压缩后开新会话即复简则。
- 新会话起生效；运行中的会话不热载。

测试与设计要点见[仓库 README](https://github.com/risense-ai/respire-dimcode#readme)。
