# OpenClaw 版 respire {#respire-for-openclaw}

[respire-openclaw](https://github.com/risense-ai/respire-openclaw) 以 OpenClaw 原生 TypeScript 插件接入 respire 记忆引擎：每轮标题档自动召回注入、七件 rsrs 工具、判后即存回执。共用运行时行为、首次使用步骤与调优参考见[插件总览](./index.md)。

## 安装 {#install}

```bash
# from a local checkout (dev):
git clone https://github.com/risense-ai/respire-openclaw.git
cd respire-openclaw && npm install && npm run build
openclaw plugins install --link ./respire-openclaw

# or from GitHub:
openclaw plugins install git:github.com/risense-ai/respire-openclaw
```

引擎（`rsrs`）自动发现（缺失时插件把 `npm i -g rsrs-cli@latest` 交给 agent 代跑，同会话内恢复召回与落库）。

### 开启会话钩子权限 {#enable-conversation-hooks}

每轮召回钩子属于改写 prompt 的会话钩子，OpenClaw 对非内置插件要求显式授权。在 `openclaw.json`：

```json5
{
  plugins: {
    entries: {
      respire: {
        enabled: true,
        hooks: { allowConversationAccess: true },
        config: {},
      },
    },
  },
}
```

然后 `openclaw plugins inspect respire --runtime --json` 自检。钩子权限键名循 docs.openclaw.ai/plugins/hooks（2026-11 核对）；若你的版本不认该键，以该页当前 schema 为准。

## 会话内发生什么 {#what-happens-in-a-session}

| 时机 | 行为 |
| --- | --- |
| 每会话首个 prompt | 注入简则（系统上下文）＋一次状态探测：引擎未装/未登录/库空/缺模型的引导（探测按 `status_ttl_ms` 缓存） |
| 每轮（`before_prompt_build`） | 自动 `rsrs recall --titles`：标题档注入——只给分数 + 短 id + 标题，预算截断；斜杠命令 token 召回前自动剥除；默认直出不过滤 |
| 存料前缀 | 「记：」/「存：」/「记住：」/`remember:`/`store:` → 插件本身不写库，回执为 pending 交接文，交模型判重（update > merge > attach > new）后经工具或 CLI 落库 |
| Agent 工具 | `respire_recall` / `respire_show` / `respire_chain` / `respire_remember` / `respire_update` / `respire_attach` / `respire_status`；`important` 无已读父本不落库 |
| `/nomem` 前缀 | 本轮跳过召回 |
| 快捷指令 | `/respire-recall <query>`、`/respire-status`、`/respire-sync` |

## 启用与关闭 {#enable-and-disable}

| 档 | 怎么关 | 范围 |
| --- | --- | --- |
| 单轮 | prompt 前缀 `/nomem` | 只关本轮召回 |
| 召回开关 | 插件配置 `"recall_enabled": false` | 工具/指令/简则保留，自动召回停 |
| 总开关 | 插件配置 `"enabled": false` | 记忆层全线静默 |
| 插件级 | `openclaw plugins disable respire` | OpenClaw 侧整插件卸力 |

## 首次使用 {#first-use}

1. 在 [rsrs.rs](https://rsrs.rs) 注册，网关所在机器 `rsrs register`。日常 `rsrs login`、`rsrs status`。
2. 导入既有规则——任一接了 OpenClaw 的对话面向 agent 说：

   > 请把本机既有规则与记忆导入 respire：逐个读取——`~/AGENTS.md`、你常用项目根下的 `AGENTS.md`、`~/.agents/skills/*/SKILL.md`；抽出可复用的事实、约定、教训与红线（口令、证件号、卡号、私钥一律排除、只记位置），去重后用 `respire_remember` 分条存入（important 且带已读父本，标题按事实句），存完给我一份清单。

   空库首日同一线索随会话简则带出。
3. 可选模型：`rsrs model install && rsrs model activate m3`。

## 调优 {#tuning}

配置：`openclaw.json` 的 `plugins.entries.respire.config`（按清单 `configSchema` 严格校验；改后重载插件）。公共字段见[总览](./index.md#tuning)。OpenClaw 特有键：`recall_enabled`（关自动召回、保留工具与简则）、`status_ttl_ms`（探测缓存时长）。

## 卸载 {#uninstall}

```text
openclaw plugins remove respire
```

## 已知边界 {#known-limits}

- **无 Stop 存储检查**——OpenClaw 无可阻塞的回合结束钩子，家族的「续跑一轮催存」在此不存在；「收尾必存」由会话简则承担。本轮有新事实就直接落库，别等催办。
- **无 PreToolUse 写护栏**——护栏内置在写工具内部。agent 从 shell 裸调 `rsrs remember` 不经插件护栏（设计如此）；引擎侧策略仍然生效。
- **真机网关加载未在 CI 验证**：清单与 API 形状按 docs.openclaw.ai 静态对齐（2026-11 核对）；以你网关上 `openclaw plugins inspect respire --runtime --json` 实测为准。
- prompt 改写权限需 `openclaw.json` 里 `hooks.allowConversationAccess`；不开则工具与指令可用、每轮自动召回不生效。

测试与设计要点见[仓库 README](https://github.com/risense-ai/respire-openclaw#readme)。
