# 实例：为Doubao添加跨会话记忆 {#worked-example-adding-cross-session-memory-to-doubao}

本页介绍如何为 Doubao 注入 `rsrs` 指令。跨会话召回取决于客户端是否加载指令文件，以及代理是否遵循指令。

## 问题 {#the-problem}

新对话可能缺少之前的项目上下文。

## 注入提供了什么 {#what-injection-provides}

注入的指令要求代理召回并保存可复用的结论。记忆保存在本地；配置同步后，同一账户可在其他设备使用加密记录。

| 行为 | 描述 |
| --- | --- |
| 行动前回忆 | 会话开始时代理查询记忆 |
| 写回结论 | 使用`rsrs remember`存储可重用结果 |
| 本地存储 | 本地运行时持有数据；云服务存储加密数据 |
| 可移植性 | 同一账户将记忆带到其他机器和客户端 |

## 先决条件 {#prerequisites}

安装CLI并确认本地运行时健康。设置详情请参见[Windows安装](windows-install.md)和[入门指南](../getting-started.md)。

```powershell
npm i -g rsrs-cli
rsrs status
```

检查 `rsrs status` 的模式是否符合预期，并查看错误。只有配置服务端时才会显示服务器项。

## 三步操作 {#three-steps}

工作流将规则注入客户端，可选地启动MCP服务器，并重启客户端。

| 步骤 | 命令 | 效果 |
| --- | --- | --- |
| 注入规则 | `rsrs --client-only inject --id doubao` | 为客户端写入指令文件 |
| 可选的MCP服务器 | `rsrs mcp` | 启动stdio服务器暴露记忆工具 |
| 重启客户端 | 重启客户端 | 启动时加载指令文件 |

### 注入工作流规则 {#inject-the-workflow-rules}

```powershell
rsrs --client-only inject --id doubao
```

使用 `rsrs --client-only inject --targets` 查看 `doubao` 解析出的路径和检测状态；预设路径只是约定，自定义配置可能不同。指令文件要求代理遵循以下规则：

- 每个回合首次行动前回忆记忆；
- 使用`--json`读取记忆；
- 使用`rsrs remember`在结束前写回可重用结论；
- 标记可重用结论为`important`，日记条目为`trivial`；
- 以原因、行动和效果部分结构化每个记录。

### 可选：启动MCP服务器 {#optional-start-the-mcp-server}

```powershell
rsrs mcp
```

该命令通过stdio启动MCP服务器并暴露记忆工具，包括`memory_recall`、`memory_remember`、`memory_status`、`memory_list`和`memory_show`。命令行已足够日常使用；MCP端点适用于直接注册MCP服务器的客户端。

### 重启Doubao客户端 {#restart-the-doubao-client}

重启客户端，并确认它加载了解析出的 `AGENTS.md` 路径。注入本身不能保证客户端读取或遵循指令。

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

使用`inject --targets`输出确认当前`doubao`状态和解析出的路径。`rsrs list`和`rsrs recall`命令返回的JSON确认存储可达。

## 常见问题 {#pitfalls}

| 问题 | 处理方式 |
| --- | --- |
| 从其他机器复制路径 | 记录的路径是机器特定的；仅保留结论并本地验证路径 |
| 代理阻止本地运行时 | 将`127.0.0.1,localhost`添加到`NO_PROXY`；代理会产生`os error 10060`超时 |
| 无自动钩子 | `inject`仅写入文本；回忆和保存依赖代理遵循规则 |
| 可选的MCP注册 | 注册`rsrs mcp`是可选的，命令行使用无需注册 |
| 重复保存 | 符合条件的保存会进行重复检测，可能建议合并或链接；显式选项和 trivial 条目可能跳过检测 |
