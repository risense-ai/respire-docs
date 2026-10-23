# 集成方式 {#integration-options}

使用受支持的 CLI 契约为 Respire 增加工作流，不依赖内部数据库结构或检索内部实现。

| 集成 | 接口 | 典型用途 |
| --- | --- | --- |
| 外部工具 | CLI `--json` | 报告、导出和可视化 |
| 钩子 | `plugins.json` 事件命令 | 写入前检查和操作后通知 |
| 代理指令 | `rsrs inject` | 工作前召回、工作后保存 |
| MCP | 标准 I/O 上的 `rsrs mcp` | 为兼容客户端提供受支持的记忆工具 |
| 桌面端 | CLI sidecar | 基于相同命令行为的用户界面 |

```mermaid
flowchart TD
  Tools["代理、桌面端与外部工具"] --> API["CLI / JSON / MCP"]
  API --> Public["基础设施应用层"]
  Public --> Core["Core SDK"]
  Public --> Store["本地加密存储"]
```

| 规则 | 原因 |
| --- | --- |
| 解析机器输出 | 避免依赖翻译后的显示文本 |
| 保持账户秘密私密 | 钩子和外部工具只需要允许的输入 |
| 不读取内部数据库文件 | 存储格式不是集成 API |
| 显式表达副作用 | 导出、导入和插件执行产生不同影响 |
| 使用匹配 SDK 产物 | 匹配目标、工具链、ABI 和清单哈希 |

此列表描述已有接口类型，不承诺插件市场或任意进程内扩展。受支持工具集以各命令帮助为准。

参阅[插件](plugin-dev.md)、[代理集成](injection.md)、现成的 [AI 工具插件](plugins/index.md)、[CLI](cli.md)和 [CLI JSON](cli-api.md)。
