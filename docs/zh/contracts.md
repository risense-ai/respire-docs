# 契约 {#contracts}

规范机器可读契约位于仓库根目录的 `contracts/`。

| 契约 | 规范文件 | 使用方 |
|---|---|---|
| Core 分发 / 操作 | `core-api.json` | Core 和安全 SDK |
| C ABI / JSON DTO | `core-abi/` | Core 头文件和安全 SDK 适配器 |
| 服务端 HTTP | `openapi.yaml` | 服务端和 API 客户端 |
| CLI 包 / sidecar | `cli-artifact-manifest.json` | CLI 打包 |
| 桌面兼容性 | `client-compatibility-matrix.json` | 客户端准备流程 |

```mermaid
flowchart LR
  Canonical["规范契约"] --> Copies["使用方副本"]
  Copies --> Pins["SDK 清单 / 应用修订版 / CLI 版本"]
  Pins --> Checks["跨仓库验证"]
```

```sh
node contracts/validate.mjs
```

| 规则 | 要求 |
|---|---|
| ABI | 业务 C 接口；不公开向量或数学 API |
| 资源边界 | 宿主提供模型/tokenizer 和不透明索引字节；Core 不接受存储路径，也不打开文件或数据库 |
| SDK | 固定目标、编译器、清单哈希和运行时文件 |
| 服务端 | 固定基础设施 app crate，而非 CLI 可执行文件 |
| Sidecar | 包含其运行时库和声明 |
| 破坏性变更 | 发布前协调生产方和使用方的固定版本 |

翻译不改变操作名称、状态码、JSON 字段、二进制名称或目标映射。契约有效并不证明发布已可用。

[开发](development.md)
