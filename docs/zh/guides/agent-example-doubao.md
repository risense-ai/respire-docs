# 实例：为Doubao添加跨会话记忆 {#worked-example-adding-cross-session-memory-to-doubao}

聊天客户端如Doubao会将每个对话隔离。新会话开始时没有任何先前决策、偏好或文件路径的知识，因此每次都需要重新陈述相同的上下文。本页面将Doubao客户端连接到`rsrs` CLI，使客户端在不同会话间保留记忆。

## 问题 {#the-problem}

Doubao默认没有跨会话记忆。每个新对话都从空白上下文开始，因此项目名称、约定和先前决策会在不同会话间丢失。

## 注入提供了什么 {#what-injection-provides}

客户端连接到rsrs后，代理会在行动前查询存储的记忆，并在任务结束时将可重用的结论写回。记忆存储在本地，而云服务仅存储加密数据。记录随账户同步，因此可在不同机器和客户端间保持可用。

| 行为 | 描述 |
| --- | --- |
| 行动前回忆 | 会话开始时代理查询记忆 |
| 写回结论 | 使用`rsrs remember`存储可重用结果 |
| 本地存储 | 本地运行时持有数据；云服务存储加密数据 |
| 可移植性 | 同一账户将记忆带到其他机器和客户端 |

## 先决条件 {#prerequisites}

安装CLI并确认本地运行时健康。设置详情请参见[Windows安装](windows-install.md)和[入门指南](../getting-started.md)。

```powershell
npm i -g @rsrsai/cli
rsrs status
```

`rsrs status`报告模式、用户、服务器和记忆状态。当所有项目均报告为PASS时继续。

## 三步操作 {#three-steps}

工作流将规则注入客户端，可选地检查MCP端点，并重启客户端。

| 步骤 | 命令 | 效果 |
| --- | --- | --- |
| 注入规则 | `rsrs --client-only inject --id doubao` | 为客户端写入指令文件 |
| 验证MCP | `rsrs mcp` | 启动stdio服务器暴露记忆工具 |
| 重启客户端 | 重启客户端 | 启动时加载指令文件 |

### 注入工作流规则 {#inject-the-workflow-rules}

```powershell
rsrs --client-only inject --id doubao
```

`doubao PASS updated`结果确认写入成功。命令将写入`~/.doubao/AGENTS.md`，或Windows上的`C:\Users\<user>\.doubao\AGENTS.md`。该文件包含客户端遵循的记忆规则：

- 每个回合首次行动前回忆记忆；
- 使用`--json`读取记忆；
- 使用`rsrs remember`在结束前写回可重用结论；
- 标记可重用结论为`important`，日记条目为`trivial`；
- 以原因、行动和效果部分结构化每个记录。

### 验证MCP端点 {#verify-the-mcp-endpoint}

```powershell
rsrs mcp
```

该命令通过stdio启动MCP服务器并暴露记忆工具，包括`memory_recall`、`memory_remember`、`memory_status`、`memory_list`和`memory_show`。命令行已足够日常使用；MCP端点适用于直接注册MCP服务器的客户端。

### 重启Doubao客户端 {#restart-the-doubao-client}

客户端启动时读取`AGENTS.md`。注入后重启客户端使规则生效，然后打开新对话。

## 确认功能正常 {#confirming-it-works}

以下命令检查注入状态和存储。完整命令参考请参见[CLI命令](../cli.md)。

```powershell
# List clients that have been injected
rsrs --client-only inject --targets

# Show the most recent stored records
rsrs list --limit 10 --json

# Search the store by title
rsrs recall "project keyword" --titles --json
```

在`inject --targets`输出中，`doubao`行显示`PASS fresh ~/.doubao/AGENTS.md`时规则存在。`rsrs list`和`rsrs recall`命令返回的JSON确认存储可达。

## 常见问题 {#pitfalls}

| 问题 | 处理方式 |
| --- | --- |
| 从其他机器复制路径 | 记录的路径是机器特定的；仅保留结论并本地验证路径 |
| 代理阻止本地运行时 | 将`127.0.0.1,localhost`添加到`NO_PROXY`；代理会产生`os error 10060`超时 |
| 无自动钩子 | `inject`仅写入文本；回忆和保存依赖代理遵循规则 |
| 可选的MCP注册 | 注册`rsrs mcp`是可选的，命令行使用无需注册 |
| 重复保存 | 新保存首先运行重复检测，可能建议合并或链接 |

不要从其他机器复制记录的路径；记录的路径仅在生成它的机器上有效。拦截本地主机流量的代理会阻止本地运行时，因此如果`rsrs recall`因`os error 10060`失败，请将`127.0.0.1,localhost`添加到`NO_PROXY`。`inject`命令仅写入指令文本并安装无钩子，因此记忆回忆和保存依赖于代理遵循注入的规则；MCP注册是可选的。新保存在记录创建前运行重复检测。
