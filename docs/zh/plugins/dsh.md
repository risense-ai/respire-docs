# DeepSeek Harness 版 Respire {#respire-for-deepseek-harness}

<img src="/agents/dsh.png" alt="DeepSeek Harness logo" width="56" height="56">

[respire-dsh](https://github.com/risense-ai/respire-dsh) 是 DeepSeek Harness 的原生记忆插件。

## 安装 {#install}

需要 Node.js 24+、已安装的 `rsrs` CLI 和运行中的 host Runtime。插件 README 验证了 Harness 0.2.1-rc.2；其他版本和完整桌面对话尚未验证。先准备并解锁引擎，再让 Harness agent 调用 `plugin_manager`：

```json
{"action":"install_bundle","target":"@rsrsai/dsh"}
```

重启 Harness，确认只启用一个 `respire-memory` 条目。终端 npm 安装不会激活宿主插件。安装替代包前，通过插件管理移除旧的 `@rsrsai/respire-dsh`。另一个 Discover 市场入口见[仓库 README](https://github.com/risense-ai/respire-dsh#readme)。

## 使用 {#use}

重启后打开新会话，提出一个与已有记忆相关的问题，确认助手能召回。要保存事实时，可以用“记：”开头；先确认收到的状态，再按需核对记录。

## 行为与配置 {#behavior-and-configuration}

插件在接受用户输入时默认最多召回五条标题；`recallLimit` 可设为 1 到 20。`记：`、`存：`、`记录：`、`记住：` 和 `remember:` 前缀请求一次写入。有效 ID 确认写入，回读会核对 ID、标题和正文。Pending 表示未写入；超时或取消可能结果未确认，重试前先查库。`/nomem` 或 `#nomem` 跳过该条自动召回。显式存储成功会抑制有次数限制的收尾提醒。

在 Harness patch 层配置已安装的 `respire-memory` 条目。默认值：`enabled: true`、`rsrsPath: rsrs`、`recallLimit: 5`、`recallThreshold: 0`、`budgetChars: 1500`、`minPromptChars: 2`、`storeNudgeEvery: 1`、`timeoutMs: 20000`。设 `storeNudgeEvery: 0` 可关闭提醒。配置条目会整体替换插件配置。

## 隐私与排障 {#privacy-and-troubleshooting}

标题和回执会进入持久的模型可见消息，可能发送给模型提供商。凭据检测不能覆盖所有秘密，提交前请移除敏感内容。插件不管理 runtime 或账号。召回失败时，在 Harness 执行环境检查 `rsrs --version` 和 `rsrs --client-only status --json`。通过 Harness 插件管理停用或移除插件。
