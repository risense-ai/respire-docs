# Magpie 版 Respire {#respire-for-magpie}

<img src="/agents/magpie.svg" alt="Magpie logo" width="56" height="56">

[respire-magpie](https://github.com/risense-ai/respire-magpie) 将 Magpie 接入本地 Respire HTTP Runtime，并可通过独立后台 worker 整理已完成的回合。

## 安装 {#install}

需要 Magpie 0.1.1273+、Bun 1.3.6+，以及已安装、运行并解锁的 Respire HTTP Runtime。插件 README 推荐 Magpie 0.1.2208+，以识别本机 agent 来源；设置热更新需要 0.1.1531+。本次未独立验证这些宿主版本限制。

安装前可在 Client 2 的概览或诊断页确认本机 Runtime 已连接，并确认记忆库已解锁。Magpie 插件通过 HTTP 连接 Runtime，不要求终端能直接运行 `rsrs`。如果使用独立 CLI，也可以运行 `rsrs --client-only status --json` 检查状态。

```sh
magpie plugin add @rsrsai/magpie
```

在插件页面配置 Runtime 和归档模型。保存设置不等于连接测试成功。本地安装可指向完整插件目录；安装后保留该目录。详情见[仓库 README](https://github.com/risense-ai/respire-magpie#readme)。

## 使用 {#use}

在插件页面启用所需选项后，打开新会话并询问已有记忆，检查召回。需要保存事实时，先确认后台处理的结果；如结果未确认，请先查库，不要直接重试。

## 行为与配置 {#behavior-and-configuration}

插件只接受 `local` 和 `magpie-key` 来源，并在回复前读取政策及相关记忆。显式存储在后台处理完成前显示 pending；pending 不是写入回执。`/nomem` 和 `#nomem` 只跳过当前召回；已启用的后台 `archive` 或 `capture` 仍可运行。

`archive` 默认开启，需要配置 `generationBaseUrl` 和 `generationModel`。合格回复结束后，独立 worker 可保存过程日记并整理新事实。`capture` 默认关闭；`readOnly` 禁止本插件写入。Runtime 默认为 `http://127.0.0.1:15169`，只接受字面回环地址。远程生成服务必须使用 HTTPS。其他配置与限制见 README。

## 隐私与排障 {#privacy-and-troubleshooting}

归档会将本轮消息、工具内容和相关记忆发送给配置的生成服务，并可能产生模型费用。在宿主环境设置凭据；`authorizationEnv` 只保存变量名。加密状态和备份默认保存在 `~/.rsrs/magpie`，但密钥位于同一目录，请保护整个目录。

停用或移除插件不能立即通知已分离的 worker。worker 每次新生成和写入前检查控制状态，总预算为 280 秒。未确认写入不会自动重试。宿主没有提供真实 SessionStart、resume 或 compaction 事件；完成通知在入队前丢失时，队列无法补救。不可用时检查 Client 2 的连接状态和插件设置；独立 CLI 用户也可运行 `rsrs --client-only status --json`。
