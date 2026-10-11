# 为什么选择 Respire {#why-respire}

对话、项目或设备改变时，代理可能丢失有用上下文。Respire 将可复用知识保存在单个会话之外，让用户能够查找、审阅和维护。

```mermaid
flowchart LR
  Work["开始任务"] --> Recall["查找相关知识"]
  Recall --> Review["阅读并核实"]
  Review --> Act["开展工作"]
  Act --> Save["保存有用结论"]
  Save --> Next["后续任务复用"]
```

| 原则 | 产品行为 |
| --- | --- |
| 知识可检查 | 记录有标识符、内容和关系 |
| 上下文可迁移 | 设备同步加密记录 |
| 所有权保留在本地 | 解密密钥留在用户手中 |
| 接口保持简单 | CLI、桌面端和代理集成共享公开行为 |
| Core 边界明确 | 检索和记忆策略通过二进制 SDK 分发 |

实际工作流见[快速开始](getting-started.md)和[架构](architecture.md)。
