# WorkBuddy 版 respire {#respire-for-workbuddy}

<img src="/agents/workbuddy.png" alt="WorkBuddy logo" width="56" height="56">

[respire-workbuddy](https://github.com/risense-ai/respire-workbuddy) 以 WorkBuddy 标准插件市场把 respire 记忆引擎装进 WorkBuddy agent：每轮标题档自动召回、「记：」一前缀即落库、Stop 存储检查。共用运行时行为、首次使用步骤与调优参考见[插件总览](./index.md)。

## 安装 {#install}

克隆仓库，审阅安装脚本后运行：

```bash
git clone https://github.com/risense-ai/respire-workbuddy.git
cd respire-workbuddy
# Review install.sh before running it
bash install.sh
```

或克隆后跑安装脚本——自动定位 WorkBuddy 桌面端自带的 `codebuddy` CLI（非常规安装位可设 `CODEBUDDY_BIN=/path/to/codebuddy`），注册市场、安装插件并验证注册表与缓存落地：

```bash
git clone https://github.com/risense-ai/respire-workbuddy.git && cd respire-workbuddy
bash install.sh                # install; upgrades if already installed
bash install.sh --github       # force the GitHub remote marketplace (ignore the local clone)
bash install.sh --uninstall    # uninstall (keeps the marketplace registration for easy reinstall)
```

升级时重跑安装脚本。脚本会尝试先执行 `marketplace update`，再执行 `plugin update`；请检查错误和安装版本。

**装完须完全退出并重启 WorkBuddy，新会话起生效。** WorkBuddy 正在运行时写入可能被其内存态覆盖——若重启后没生效，退出 WorkBuddy 再跑一次脚本即可。

手动兜底（脚本失效时）：

```bash
codebuddy plugin marketplace add <absolute path to this repo> --name risense-workbuddy
codebuddy plugin install respire@risense-workbuddy
```

仓结构＝标准两层：仓根 `.codebuddy-plugin/marketplace.json` 是市场清单，插件本体在 `plugins/respire/`（其内 `.codebuddy-plugin/plugin.json` 为插件清单）。安装位置：`~/.workbuddy/plugins/cache/risense-workbuddy/respire/<version>/`（WorkBuddy 标准缓存，随市场自动更新）。

验证：

```bash
ls ~/.workbuddy/plugins/cache/risense-workbuddy/respire/*/    # .codebuddy-plugin, hooks, skills all present
echo '{"prompt":"respire 测试"}' | python3 ~/.workbuddy/plugins/cache/risense-workbuddy/respire/*/hooks/respire.py UserPromptSubmit
```

引擎（`rsrs`）缺失时插件把 `npm i -g rsrs-cli@latest` 注入会话代装。**新会话起生效。**

插件仓库报告，其测试的 WorkBuddy 桌面端不加载插件自带的 hooks，只有 `settings.json` 中的用户级钩子会运行。仓库未注明所测宿主版本，其他版本需要验证。仅安装市场插件不能证明桌面端的自动召回已生效。如需在连接器页面使用按需技能，请按仓库的[连接器安装说明](https://github.com/risense-ai/respire-workbuddy/tree/main/connector)操作；安装后须完全退出并重开 WorkBuddy。连接器与自动钩子是两种独立方式。

## 会话内发生什么 {#what-happens-in-a-session}

| 时机 | 行为 |
| --- | --- |
| `SessionStart` | 注入记忆层简则（对整会话生效）；一次三态探测——注册引导/首日存料/可选模型；就绪时零打扰 |
| `UserPromptSubmit` | 自动 `rsrs recall --titles`：标题档注入——只给分数 + 短 id + 标题；正文经 `rsrs show <id>` 取（附因果链）；默认直出不过滤 |
| 存料前缀 | 「记：」/「存：」/`remember:` → 直接 `rsrs remember … --importance important`；判为相似时回执转述候选，模型决断 |
| `Stop` | 存储检查：续跑一轮，提示模型把本轮新事实落库；续跑轮带 `stop_hook_active=true` 即放行 |
| `/nomem` 前缀 | 本轮跳过召回 |
| `skills/respire` | 按需加载操作法；技能是说明书，动作全由钩子驱动 |

## 启用与关闭 {#enable-and-disable}

| 档 | 怎么关 | 范围 |
| --- | --- | --- |
| 单轮 | prompt 前缀 `/nomem` | 只关本轮召回 |
| 总开关 | `respire.config.json` 设 `"enabled": false` | 记忆层全线静默（简则/召回/落库） |
| 组件级 | WorkBuddy 插件页对 respire 的 **hook 组件**逐项开关（`skill`/`hook`/`mcp` 原生支持） | WorkBuddy 侧直接卸力 |

## 首次使用 {#first-use}

1. 在 [rsrs.rs](https://rsrs.rs) 注册，本机 `rsrs register`。日常 `rsrs login`、`rsrs status`。
2. 导入既有规则——WorkBuddy 新会话粘贴整段：

   > 请把本机 WorkBuddy 的既有规则与记忆导入 respire：逐个读取——`~/.workbuddy/SOUL.md`、`~/.workbuddy/USER.md`、常用项目根下的 `AGENTS.md`/`CODEBUDDY.md` 与 `.workbuddy/skills/*/SKILL.md`；抽出可复用的事实、约定、教训与红线（口令、证件号、卡号、私钥一律排除、只记位置），去重后用 `rsrs remember` 分条存入（`--importance important`、标题按事实句；判重给候选先决断挂靠或合并），存完给我一份清单。

   空库首日 SessionStart 会注入同一线索。
3. 可选模型：`rsrs model install && rsrs model activate m3`。

## 调优 {#tuning}

配置文件：`~/.workbuddy/plugins/cache/risense-workbuddy/respire/<version>/hooks/respire.config.json`（缺失即全默认；新会话生效）。公共字段见[总览](./index.md#tuning)；本适配另有 `skip_prefixes`，用于宿主内部提示（如自动化 Recap）。

## 卸载 {#uninstall}

首选 `bash install.sh --uninstall`（走官方 CLI，注册表干净）。CLI 失效时搬移式兜底，**目标必须在 plugins 根之外**（根内带 manifest 的残留目录会被当插件继续加载、钩子双跑）：

```bash
mkdir -p ~/.workbuddy/plugins-backup
mv ~/.workbuddy/plugins/cache/risense-workbuddy/respire ~/.workbuddy/plugins-backup/respire.removed-$(date +%s)
codebuddy plugin uninstall respire@risense-workbuddy
```

## 已知边界 {#known-limits}

- 召回质量是引擎上限；冷启动窗下 hook 超时 20 秒、recall 14 秒、probe 10 秒。
- **PostCompact 不可重注**（协议该事件仅副作用）：长会话压缩后开新会话即复简则。
- GUI 安装入口未证实存在；走脚本或 CLI。若你的版本有（插件页 → 市场 → 添加本地市场），走 GUI 亦可。

测试与设计要点见[仓库 README](https://github.com/risense-ai/respire-workbuddy#readme)。
