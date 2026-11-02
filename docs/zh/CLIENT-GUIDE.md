# 客户端集成 {#client-integration}

Respire Client 2 使用 Go 和 Wails v3 外壳及内嵌前端。它调用命名桌面操作、本机 Runtime RPC 和受限 CLI 宿主操作，不直接打开数据库或实现 Core。开发第三方客户端时，先读 [Runtime RPC](runtime-rpc.md)，并检查正在运行的 CLI 支持哪些功能。

| 职责 | 归属 |
|---|---|
| 桌面、前端、托盘和客户端更新 | `respire-client2` |
| 记忆、本机身份、同步和 Runtime | CLI 及其应用层 |
| 模型执行和检索 | CLI SDK 调用 Core |
| 加密远程记录 | 服务端 |

旧的 `contracts/client-compatibility-matrix.json` 描述 Tauri 客户端及其 sidecar 准备流程，不是 Client 2 的发布矩阵。Client 2 按自身平台选择 CLI 发布，校验元数据和哈希，然后准备可执行文件及原生运行时。也可使用已有的兼容 Runtime。目标映射不保证发布资产存在，也不保证可选功能兼容。

开发时请遵循客户端仓库的[构建说明](https://github.com/risense-ai/respire-client2#build)，检查平台依赖并运行现有检查。Windows 脚本运行 Go vet 和前端语法检查，生成可执行文件、校验和及声明。分发前请在隔离环境中验证打包产物。

受支持的账户操作和模型服务凭据通过标准输入传给 CLI，不放在命令行参数中。不要在 UI 中重复实现密钥管理或推理。见[客户端](client.md)、[契约](contracts.md)和[开发](development.md)。
