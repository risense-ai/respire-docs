# 常见问题 {#faq}

| 问题 | 回答 |
|---|---|
| 源码构建需要什么？ | 文档/前端可独立构建；CLI/server 还需要匹配的 Core SDK。见[开发](development.md)。 |
| 应使用哪个命令？ | `rsrs` 是唯一 CLI 命令及二进制/sidecar 前缀。产品名为 Respire；`respire` 与 `rs` 不是命令别名。 |
| 服务端能看到记忆内容吗？ | 同步记录已加密；解密密钥留在客户端。 |
| 不透明产物已加密吗？ | 没有。它们是可重建的本地派生特征。 |
| Dashboard 在哪里？ | `rsrs web` 打开 `https://dash.rsrs.rs`。CLI 不托管嵌入式网站。 |
| 为什么找不到模型？ | 运行 `rsrs doctor`，检查显式设置的 `RSRS_MODEL_DIR`。无效的显式路径不会被静默替换。 |
| 为什么同步失败？ | 检查身份、token、配置的服务端和网络。诊断过程中保留本地数据库。 |
| 为什么安装版本较旧？ | 检查 PATH 中是否有另一个 `rsrs` 排在目标可执行文件之前。 |
| 为什么注入未生效？ | 检查受管理块及目标工具配置，再重启长期运行的会话。 |
| Respire 会复用旧本地账户吗？ | 使用 `rsrs migrate` 或 TUI 的 **Migrate old version** 选择来源。启动不会导入账户。迁移保留原始数据及可用解密凭据，拒绝已有目标，不重置加密密钥。 |
| 为什么部分环境变量仍以 ONEMEMORY 开头？ | 它们是显式兼容接口；默认数据/runtime 状态独立。 |

[开始使用](getting-started.md) · [开发](development.md) · [注入](injection.md) · [同步与密钥](sync-and-keys.md)
