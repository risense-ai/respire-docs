# Pi 版 respire {#respire-for-pi}

[respire-pi](https://github.com/risense-ai/respire-pi) 是 Pi coding agent 1.3.0 的原生记忆扩展，经 npm 以 `@rsrsai/pi` 分发：每轮答前自动召回标题、「记：」一前缀即落库、轮末做一次存料审查。与 Codex 插件同为 npm 分发的 Node.js 形态，且只调 `rsrs --client-only`。共用调优参考见[插件总览](./index.md)。

## 安装 {#install}

前置：Node.js 22+、Pi 1.3.0、已装的 `rsrs` CLI、运行中的 Respire 宿主 runtime。旧 `@mariozechner/pi-coding-agent` 版本未验证，且缺本扩展依赖的 settlement 接口。

需要时单独装引擎：

```sh
npm install -g @rsrsai/cli@latest
rsrs --version
rsrs --client-only status --json
```

安装已发布包：

```sh
pi install npm:@rsrsai/pi
```

或不改 Pi 设置直接加载：

```sh
pi --extension ./respire-pi/lib/index.js
```

装完重启 Pi 或 `/reload`。用 `pi list` 确认：应有一条 `npm:@rsrsai/pi`。无需 `rsrs inject`、AGENTS.md 块、技能安装、MCP server 或自定义系统提示——扩展自带记忆规则。若旧配置已往 Pi 的 AGENTS.md 注入过 Respire 规则，先备份再只删那个旧 Respire 块，避免重复指令。

## 使用 {#use}

在项目里启动 `pi` 正常对话——扩展在模型作答前自动召回匹配的记忆标题，模型需要细节时读全文。要存一条已确认的事实，消息以存料前缀开头：

```text
remember: This project's release checklist requires a Windows smoke test.
```

中文前缀「记：」「存：」「记录：」「记住：」同样可用。回执三态：**success** 带记忆 id；**pending** 表示引擎发现候选且**未**保存——agent 读候选并决定更新还是挂靠；**unconfirmed** 表示结果未知——重试前先查库。存料前缀请求的是「存下所述事实」，不是执行该事实里描述的工作流。更新既有记忆保留其 id，同样是真实写入。

单条消息跳过自动记忆处理，前缀 `/nomem`（或 `#nomem`）；后续消息与记忆规则不受影响。

## 更新与卸载 {#update-and-remove}

```sh
pi update npm:@rsrsai/pi
pi list
```

更新后重启 Pi 或 `/reload`。钉住版本用 `pi install npm:@rsrsai/pi@<version>`。卸载跑 `pi remove npm:@rsrsai/pi`——Respire 引擎与记忆库保留。

召回不可用时，在 Pi 的执行环境跑 `rsrs --version` 与 `rsrs --client-only status --json`；CLI 缺失、宿主 runtime 停止、库被锁或未登录，按引擎自己的流程解决——扩展无法处理这些账号/runtime 状态。包已装但未加载时，查 `pi list`、重启/reload，并确认 Pi 包扩展未被禁用。

Windows 上扩展用 PowerShell 7.3+（`pwsh.exe`）跑 npm/pnpm 包装，参数以 JSON stdin 传递以保留 Unicode、引号与 shell 元字符。原生 `rsrs.exe` 可直接指定、无需 PowerShell 桥：

```sh
pi --respire-rsrs /path/to/rsrs
```

`rsrs` 保持在 PATH 上，供 agent 自己的 shell 调用。

## 行为 {#behavior}

| 触发 | 结果 |
| --- | --- |
| 人类输入（交互 UI 或 RPC） | 召回至多 5 条标题、1500 字符内 |
| 「记：」「存：」「记录：」「记住：」、`remember:` | 尝试一次显式落库，附上真实引擎回执 |
| `/nomem` 或 `#nomem` 后接空白/结束 | 该条输入跳过自动记忆处理 |
| 疑似凭据 | 跳过自动召回与落库 |
| `before_agent_start` | 向结构化系统提示追加稳定简则 |
| 记忆操作成功 settlement 后 | 至多一次存料审查续跑；显式落库成功则抑制 |
| 运行中止/失败、引擎跳过或引擎不可用 | 不自动续跑 |

召回结果与回执经 Pi 的 `input` 变换附加到同一条输入，因此出现在保存的用户消息里、并保持挂在 steering/后续输入上；原始文本与图像附件保留。扩展生成的输入被忽略。会话切换与关闭会取消未完成的引擎调用。

凭据检测是尽力而为——不要提交口令、token 或私钥。收尾审查只提醒 agent 存有用的新发现，不会自动把对话记录搬进记忆。

测试与发版流程见[仓库 README](https://github.com/risense-ai/respire-pi#readme)。
