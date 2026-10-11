# Runtime 流程 {#runtime-flow}

```mermaid
flowchart LR
  Command["CLI 命令"] --> Runtime["本地 runtime"]
  Page["Web / 桌面"] --> Runtime
  Runtime --> Store["基础设施加密 / SQLite"]
  Runtime --> SDK["安全 SDK"]
  SDK --> Core["Core"]
  Store <-->|密文| Server["同步服务端"]
```

| 路径 | 流程 |
|---|---|
| 写入 | 验证输入 → 获取 Core 建议/特征 → 授权更改 → 加密并持久化 |
| 读取 | 加载已授权本地快照 → Core 选择最终结果/上下文 → 最终输出 |
| 树结构变更 | 一起更新加密的父节点元数据与本地索引 |
| 同步 | 拉取修订/tombstone → 应用冲突规则 → 推送脏记录 → 保存 cursor |
| 注入 | CLI 模板 → 目标 AI 工具中的受管理块 |

Runtime 持有数据目录锁。可用时，普通命令使用 runtime。直接维护前须先停止 runtime；支持的选项以已安装 CLI 的帮助为准。

派生行必须匹配当前来源密文、模型与索引代次。记录更新或模型变更会使旧特征失效；应重建，而非将不兼容产物视为有效。

```mermaid
sequenceDiagram
  participant UI as CLI / UI
  participant App as 基础设施 app
  participant Core as Core
  participant DB as 本地存储
  UI->>App: 已授权操作
  App->>DB: 加载当前记录
  App->>Core: 业务请求 / 不透明特征
  Core-->>App: 最终结果或建议
  App-->>UI: 最终输出
```

[开发](development.md) · [契约](contracts.md)
