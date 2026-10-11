# Respire · rsrs {#respire-·-rsrs}

面向 AI 工具的本地优先记忆：在设备上维护工作记忆库，在本地检索，并跨设备同步加密记录。Respire 的唯一 CLI 命令是 **rsrs**，仓库组织为 **risense-ai**。

```mermaid
flowchart LR
  AI["AI 工具"] --> CLI["CLI"]
  Browser["本地 Web"] --> CLI
  Desktop["桌面客户端"] --> CLI
  CLI --> App["基础设施 app / 加密 / 存储"]
  App --> SDK["安全 SDK"]
  SDK --> Core["Core：模型与算法"]
  App --> DB[("本地 SQLite")]
  DB <-->|密文| Server["服务端"]
```

| 组件 | 职责 |
|---|---|
| CLI | 命令、授权、注入、JSON 输出与本地 runtime |
| Core | 模型执行、检索、排序、判重与上下文选择 |
| 基础设施 crates | 协议、密码学、持久化、同步与安全 SDK 适配 |
| 服务端 | 身份认证与各用户的密文存储 |
| Web / 桌面 | 使用 CLI 操作的同一套树形界面 |
| 官网 | 产品介绍，与记忆客户端分离 |

[开始使用](getting-started.md) · [了解架构](architecture.md) · [构建前提](development.md)
