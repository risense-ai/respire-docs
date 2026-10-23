# Qoder 版 respire {#respire-for-qoder}

[respire-qoder](https://github.com/risense-ai/respire-qoder) 是 Dim 版的 Qoder 移植：用 Qoder 的插件钩子把 respire 引擎挂进 agent 循环——每轮标题档自动召回、「记：」一前缀即落库、收尾做一次存储检查。共用运行时行为、首次使用步骤与调优参考见[插件总览](./index.md)。

## 安装 {#install}

### 1. Qoder 插件 {#_1-qoder-plugin}

按目录安装：

```bash
qoder plugins install /absolute/path/to/respire-qoder
```

或按市场安装（本仓自带 `.qoder-plugin/marketplace.json`）：

```bash
qoder plugins marketplace add /absolute/path/to/respire-qoder
qoder plugins install respire-qoder@risense
```

装完在会话里执行 `/plugins reload`，或重启会话。Qoder Desktop 也可在插件设置里从本地目录安装；桌面版与 CLI 共用同一套插件目录与清单。

### 2. 引擎（缺失时 agent 可代装） {#_2-engine-the-agent-can-install-it-for-you}

```bash
npm i -g @rsrsai/cli@latest
rsrs --version
```

无全局写权限时先试：

```bash
npm config set prefix ~/.npm-global
npm i -g @rsrsai/cli@latest
```

插件每轮实时探测引擎；装好**同会话内**即恢复召回与「记：」落库。

### 3. 注册登录（首次） {#_3-register-first-time}

去 [rsrs.rs](https://rsrs.rs) 注册，本机 `rsrs register`。日常 `rsrs login`、`rsrs sync`、`rsrs status`。

## 会话内发生什么 {#what-happens-in-a-session}

| 时机 | 行为 |
| --- | --- |
| `SessionStart` | 注入记忆层简则；一次三态探测——注册引导/首日存料/可选模型；就绪时零打扰 |
| `UserPromptSubmit` | 自动 `rsrs recall --titles`：标题档注入，只给分数 + 短 id + 标题，正文由 agent `rsrs show <id>` 按需取；默认直出不过滤 |
| 存料前缀 | 「记：」/「存：」/`remember:` → 直接 `rsrs remember … --importance important`；判为相似时不写入、转述候选（`--parent` 挂靠或 `--force` 直写）由模型决断 |
| `Stop` | 存储检查：`decision: deny` 续跑一轮，提示把本轮新事实分条存入；`stop_hook_active=true` 时放行，防循环 |
| `/nomem` 前缀 | 本轮跳过召回 |
| `$skill:` 前缀 | 召回前剥除，防技能名词面污染 query |
| `skills/respire` | 按需加载完整操作法；动作全由钩子驱动 |

## 与 Dim 版的差异 {#differences-from-the-dim-version}

| 项 | Dim 版 | Qoder 版 |
| --- | --- | --- |
| 清单 | `.codex-plugin/plugin.json` | `.qoder-plugin/plugin.json` |
| 插件根占位符 | `${CLAUDE_PLUGIN_ROOT}` | `${QODER_PLUGIN_ROOT}` |
| 配置/日志目录 | 插件 `hooks/` | `QODER_PLUGIN_DATA`，无则回退 `hooks/` |
| Stop 阻塞 | `{"decision":"block"}` | `{"decision":"deny"}`（Qoder 文档语义） |
| 市场 | `dim plugin marketplace` | Qoder 本地目录安装或市场 |

## 调优 {#tuning}

配置优先级：`RESPITE_CONFIG` 环境变量 → `$QODER_PLUGIN_DATA/respire.config.json` → `<plugin root>/hooks/respire.config.json`。从 example 复制即可：

```bash
cp hooks/respire.config.example.json hooks/respire.config.json
```

公共字段见[总览](./index.md#tuning)。Qoder 特有：若你已用 `rsrs inject` 往 `~/.qoder/rules` 写过 respire 全文，建议 `session_rules: false` 防双份注入。环境变量：`RESPIRE_BIN`（引擎路径）、`RESPITE_RSRS`（兼容旧名）、`RESPITE_CONFIG`、`RESPITE_LOG`。

## 验证 {#verify}

```bash
python3 scripts/validate_plugin.py
bash tests/test_hooks.sh
```

直接验钩子（不依赖 Qoder 是否已加载插件）：

```bash
echo '{"hook_event_name":"UserPromptSubmit","prompt":"respire 记忆"}' \
  | python3 hooks/respire.py UserPromptSubmit
```

## 已知边界 {#known-limits}

- 召回质量是引擎上限；冷启动窗下 hook 超时 20 秒、recall 14 秒、probe 10 秒。
- **未真机验证项**：本包在 Qoder CLI/Desktop 中的真实加载与 Stop 阻塞效果尚未真机安装验证；钩子脚本本身已用真引擎与假引擎分别跑通。Qoder 插件机制以官方文档为准：<https://docs.qoder.com/zh/cli/plugins-reference>、<https://docs.qoder.com/zh/cli/hooks-reference>。

设计要点见[仓库 README](https://github.com/risense-ai/respire-qoder#readme)。
