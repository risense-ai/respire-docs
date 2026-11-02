# Windows 打包 {#windows-packaging}

Respire Client 2 为每个受支持的 Windows 架构发布可执行文件。桌面端需要 Microsoft Edge WebView2；它不包含 CLI、Core 运行时或模型权重。客户端单独下载匹配的 CLI 和原生运行时，也可使用已有的兼容本机 Runtime。

仓库的 Windows 构建脚本生成 `dist/respire-windows-<arch>.exe`、`dist/SHA256SUMS`、`dist/LICENSE.txt` 和 `dist/THIRD_PARTY_NOTICES.txt`。脚本运行 Go vet 和前端语法检查。构建依赖和命令见[客户端 README](https://github.com/risense-ai/respire-client2#build)。

CLI 发布元数据标明目标、二进制文件和运行时压缩包及其 SHA-256 哈希。Client 2 校验下载文件、可执行文件架构和 `core-runtime.json` 中列出的文件。缺少匹配资产时会报告错误，不会替换为其他架构。桌面更新使用自己的发布资产和校验和文件。目前发行包没有发布者密钥签名或 Authenticode 签名；来自同一发布源的校验和不能防范该发布源遭入侵。

分发前请在干净环境中检查目标、校验和、声明、WebView2 依赖和启动情况。CLI 与模型可用性需要单独核实；桌面端构建成功不代表每个匹配的 CLI 资产都已发布，也不代表模型文件可离线使用。

[客户端集成](CLIENT-GUIDE.md)
