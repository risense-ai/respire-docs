# Codex 版 respire {#respire-for-codex}

[respire-codex](https://github.com/risense-ai/respire-codex) 是原生 Codex 记忆插件，经 npm 以 `@rsrsai/codex` 分发：用户输入时召回、显式请求时落库、收尾提醒 agent 存好新发现。与钩子适配不同，它是 Node.js 扩展且只调 `rsrs --client-only`——从不启动、停止或升级 runtime。共用调优参考见[插件总览](./index.md)。

## 安装 {#install}

前置：Node.js 24+、npm、Git、带插件/hooks 支持的本地 Codex 客户端、已装的 `rsrs` CLI。Windows 上 npm/pnpm rsrs 包装器还需 PowerShell 7.3+（`pwsh`），或设 `RESPIRE_RSRS_PATH` 指向原生 `rsrs.exe` 直接执行。开发对照 Codex CLI 0.163.0；桌面客户端需同样的插件与 hooks 接口，Work Cloud、Web 客户端与禁用 hooks 的企业环境未验证。

先备好引擎（已可用可跳过）：

```sh
npm install -g @rsrsai/cli@latest
rsrs --version
rsrs --client-only status --json
```

登录、解锁记忆库与配置模型走 rsrs 自己的交互界面；宿主 runtime 须已在运行。

添加本仓市场源并安装其 npm 条目：

```sh
codex plugin marketplace add risense-ai/respire-codex --ref main
codex plugin add respire@rsrsai
```

市场清单来自本仓；**插件本体从 npm 下载（`@rsrsai/codex`）**，不是 Git 包依赖。清单跟踪 `latest`；要钉住版本，把下面条目加进你自有市场的 `plugins` 数组：

```json
{
  "name": "respire",
  "source": {
    "source": "npm",
    "package": "@rsrsai/codex",
    "version": "0.1.4",
    "registry": "https://registry.npmjs.org"
  },
  "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" },
  "category": "Productivity"
}
```

只跑 `npm install -g @rsrsai/codex` 不会注册 Codex 插件。

然后重启 Codex，在插件界面确认 Respire 已启用，并打开钩子管理（CLI 里 `/hooks`）**逐个审阅并信任** `SessionStart`、`UserPromptSubmit`、`Stop` 三个钩子。安装或升级后新增/变更的钩子须再次审阅，不可绕过。开新会话，用一个已知项目试召回，再用一条你明确批准存的事实试落库。

插件不移除 `rsrs inject` 或其他记忆钩子写入的既有 AGENTS.md 指令。若多个来源都在做自动召回或收尾提醒，理清各自角色、只留其一，避免重复。

## 升级 {#upgrade}

```sh
codex plugin marketplace upgrade rsrsai
codex plugin add respire@rsrsai
```

重启 Codex，在插件详情确认版本，并在 `/hooks` 审阅变更的钩子。若发版后版本号仍显示旧值，是 npm 元数据缓存——PowerShell 里：

```powershell
$env:npm_config_prefer_online = 'true'
codex plugin add respire@rsrsai --json
Remove-Item Env:npm_config_prefer_online
```

该变量原本有值则恢复原值而非删除。测试前先核对返回的版本；装回旧版不算升级。无需卸载插件或删除其状态。

## 行为 {#behavior}

| 触发 | 结果 |
| --- | --- |
| `SessionStart`（startup、resume、clear、fork、compaction） | 注入记忆工作流简则并检查引擎状态 |
| 普通用户输入 | 同步 `recall --titles --json`——至多 5 条、1500 字符内；正文由 agent 按需读 |
| 「记：」「存：」「记录：」「记住：」、`remember:` | 尝试一次 `remember`，回执为 success、pending 或 unconfirmed |
| `/nomem` 或 `#nomem` 后接空白 | 该条输入跳过自动召回；库模式不变，收尾检查仍可运行 |
| `Stop` | 每轮至多一次续跑提醒，且仅在有成功召回的轮；显式落库成功则抑制 |

回执三态。**Success** 带真实记录 id——确认写入。**Pending** 表示引擎发现近似候选且**未写入**：agent 读候选，决定更新、合并还是挂靠。**Unconfirmed** 表示结果未知（超时、取消、缺有效 id）：写入可能已提交，先查库——插件不会重试。`plan` 模式跳过显式落库。

记忆标题是参考数据不是指令。收尾提醒只让 agent 评估并落库新发现，不归档会话。`stop_hook_active`、会话/轮去重与续跑标记防循环；插件自身的续跑不再触发召回或落库。subagent 钩子未启用。

## 配置、状态与隐私 {#configuration-state-and-privacy}

- `RESPIRE_RSRS_PATH`：可选的可执行路径或命令名；默认 `rsrs`。`PLUGIN_ROOT` 与 `PLUGIN_DATA` 由 Codex 提供；状态绝不写入安装目录。
- 每次引擎调用限 20 秒、1 MiB stdout；hook 超时分别为 30/30/5 秒。
- Windows 上参数以 JSON stdin 传给固定 PowerShell 适配器——用户输入绝不拼进脚本源码。
- `PLUGIN_DATA/sessions/` 只存哈希标识、处理阶段与去重标记——不存用户文本、召回标题或口令。每会话保留最近 32 轮。
- 状态更新用锁与原子替换。崩溃残留的 `.lock` 会让该会话后续召回/落库报失败并跳过；确认该会话钩子已停后删锁文件或开新会话。
- 常见凭据模式会跳过，但这不是完整的秘密扫描器——提交前先移除敏感内容。注入的标题与回执会进入 Codex 上下文、可能到达所配置的模型提供商；本地加密不改变这一点。
- 引擎原始 stderr 不落日志，只暴露错误类别；失败不阻断用户主任务。

`/hooks` 里一个 Respire 钩子都没有时，检查目标安装是否启用且含 `.codex-plugin/plugin.json` 与 `hooks/hooks.json`。钩子在列但不生效，审阅信任状态并重启。钩子报引擎错误时，跑 `rsrs --client-only status --json` 与 setup 技能。

Stop 输出会在保留续跑文本的同时请求 `suppressOutput: true`；Codex 0.163.0 解析但忽略该字段，提醒仍可见。测试与发版流程见[仓库 README](https://github.com/risense-ai/respire-codex#readme)。
