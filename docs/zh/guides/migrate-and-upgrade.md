# 从1memory迁移并升级 {#migrating-from-1memory-and-upgrading}

Respire是1memory的延续。运行时是一个驻留进程，通过本地HTTP由一个轻量级CLI连接。重命名更改了包、命令、服务器、数据目录和仪表板名称。

## 重命名映射表 {#rename-map}

| 项目 | 旧（1memory） | 新（Respire） |
| --- | --- | --- |
| npm包 | `@1memory/cli` | `rsrs-cli`（简称，与`@rsrsai/cli`相同） |
| 命令 | `1memory` | `rsrs` |
| 默认服务器 | `https://1memory.ai` | `https://api.rsrs.rs` |
| 默认数据目录 | `~/.onememory` | `~/.rsrs`（Windows: `C:\Users\<user>\.rsrs`) |
| 仪表板 | 本地网页 | `https://dash.rsrs.rs`（托管） |
| 平台二进制包 | `@1memory/cli-win32-x64` | `@rsrsai/win-x64`（按平台） |

CLI是一个轻量级客户端。它连接到一个驻留的本地运行时（默认`http://127.0.0.1:15169`），其二进制文件为`~/.rsrs/bin/rsrs`（Windows为`rsrs.exe`）。详见[托管运行时和沙箱客户端](../runtime.md)。

## 安装 {#installation}

选择一个包管理器路径；两者均暴露`rsrs`命令。完整设置详见[入门指南](../getting-started.md)和[Windows安装](windows-install.md)。

```powershell
# Point pnpm at an npm global bin already on PATH when needed
pnpm config set global-bin-dir "C:\Users\<user>\AppData\Roaming\npm"
pnpm config set global-dir "C:\Users\<user>\AppData\Local\pnpm\global"

# Stable release (short name, same as @rsrsai/cli)
pnpm add -g rsrs-cli
# Dev build (the dev tag exists only on @rsrsai/cli)
pnpm add -g @rsrsai/cli@dev

# npm is equivalent
npm install -g rsrs-cli
```

## 版本检查 {#version-checks}

```powershell
npm view rsrs-cli version dist-tags bin
rsrs --version
rsrs update-check
```

`latest`标签可能滞后于`dev`标签；安装`@dev`以测试更新构建。简称`rsrs-cli`和`@rsrsai/cli`共享相同版本、仓库和命令，因此不要安装两者；`dev`标签仅存在于`@rsrsai/cli`中。`update-check`在本地构建领先于`latest`时报告`ahead:true`。应使用`rsrs --version`、`rsrs --help`和`rsrs prompt --json`确认已安装的版本，而非假设已发布的标签。

## 备份与迁移 {#backup-and-migration}

在迁移机器或升级前，导出纯文本并复制整个数据库：

```powershell
rsrs export <path>\main_export_<yyyymmdd>.json   # plaintext JSON
rsrs backup <path>\main_backup_<yyyymmdd>.db     # full SQLite copy (ciphertext and index)
```

`backup`不会覆盖：目标文件已存在时会报错`file exists (os error 80)`，因此需先删除或重命名。迁移运行会把 schema-2 回执`.rsrs-migration.json`写入目标账户目录，而非`~/.rsrs`根目录。迁移完成后在该回执中检查`complete`；它记录源和目标，但没有加密文本校验计数，单独执行`backup`也不会生成它。

迁移是一个快照。未同步的旧`1memory`库写入会保留在原处，不会自动进入新库；两个库保持独立。详见[数据模型](../data-model.md)和[同步与密钥](../sync-and-keys.md)。

### 按版本迁移 {#migration-by-version}

| CLI版本 | 行为 |
| --- | --- |
| 到1.0.10 | 任何`rsrs`命令首次运行会自动将`~/.onememory`快照复制到`~/.rsrs`，并写入`.rsrs-migration.json`；原始目录和凭据保留 |
| 1.0.11及以后 | 移除启动自动迁移；运行显式命令 |

```powershell
rsrs migrate                                         # list candidate old libraries with their source_id
rsrs migrate --source <source_id> --account <name>   # migrate the chosen source to a new account
rsrs migrate --vault                                 # upgrade only the selected account vault, keeping the data keys
```

`--source`接受列表返回的`source_id`，而非目录路径，且`--account`必须是新名称（不能是`main`）。在可选的`rsrs migrate --vault`前先选择迁移后的账户。

### 旧账户布局 {#legacy-account-layout}

迁移发现会枚举平铺的`~/.onememory`根目录以及每个`~/.onememory/accounts/<user>/`配置文件。不要将`accounts/<user>/*`复制到根目录：覆盖根目录的数据库或会话可能替换另一个主配置文件并绕过 SQLite 快照处理。运行`rsrs migrate`列出配置文件，取所需配置的`source_id`，迁移到一个新的命名账户。

## 升级检查清单 {#upgrade-checklist}

升级后且在测试或使用新构建前完成以下步骤；否则写入和回忆可能失败。

| 步骤 | 操作 | 原因 |
| --- | --- | --- |
| 0 | 备份主库 | 升级或`reembed`会重写`~/.rsrs/onememory.db` |
| 1 | 停止旧运行时 | 旧版本的驻留运行时在CLI升级后仍会继续运行 |
| 2 | 安装并激活BGE-M3 | 从1.0.10开始嵌入器为BGE-M3；缺少模型会使`remember`失败 |
| 3 | 等待索引重建 | 旧记录会被重新计算为M3向量 |

**步骤1，停止旧运行时。** 新的`rsrs --runtime-internal --stop`会被仍在运行的旧运行时拒绝，报错`runtime_unauthorized: ... loopback clients need an updated host runtime ...`。终止命令行是`rsrs.exe --runtime-internal`的进程，然后让`status`部署新二进制文件。

```powershell
Get-CimInstance Win32_Process -Filter "Name='rsrs.exe'" | Select-Object ProcessId,CommandLine
Stop-Process -Id <runtime-pid> -Force
rsrs status
```

**步骤2，安装并激活模型。** 从1.0.10开始嵌入器切换为BGE-M3（`embedding_model:"m3"`）。缺少模型会使`remember`失败，报错`Core error 6: "BGE-M3 files missing; run rsrs model install-m3 ..."`. 这是升级后的预期行为，而非库损坏。

```powershell
rsrs model install
rsrs model activate m3
rsrs model probe
```

`model install`下载并验证模型；从1.0.11开始不再重建索引，因此需要`model activate m3`。首次运行新运行时会自动下载模型，且`recall`在下载完成前返回`index_pending`。不要并发运行模型操作；第二个操作会报错`another model operation is running`。运行时下载器较慢；停止运行时后，可手动放置`model_quantized.onnx`到`~/.rsrs/models/bge-m3/onnx/`目录下，之后`model install`会识别它。`model probe`在模型可用时报告`ready:true`。

**步骤3，等待索引重建。** `model activate m3` 会构建索引代并在校验通过后激活，因此它本身就会将旧库重新计算为 M3 向量；在此期间，其他模型操作会因 `another model operation is running` 失败。

```powershell
rsrs status    # model operation active/done/total; complete at total with retrieval index State=ok
rsrs reembed   # only if activation did not rebuild the index
```

在 CPU 上重建大型库速度较慢；在它运行期间不要运行其他模型操作。

## 运行时模型核心要素 {#runtime-model-essentials}

| 入口点 | 行为 |
| --- | --- |
| 本地运行时 | 命令连接到本地 HTTP 运行时（默认 `127.0.0.1:15169`）；进程 `~/.rsrs/bin/rsrs` 持有 `lock.db` 和启动配置文件；MCP 也由运行时提供服务 |
| `--runtime-internal` | 隐藏的运行时管理入口；`rsrs --runtime-internal --stop` 可在相同版本内可靠停止运行时，但跨版本升级后需直接终止进程 |
| `--direct` | 绕过运行时直接打开库文件（打印 `WARN: --direct bypasses the local runtime`）；如 `account remove` 等配置写入操作需 `--direct` 和已停止的运行时 |
| `--client-only` | 仅连接到主机 HTTP 运行时且不管理其生命周期（或设置 `ONEMEMORY_CLIENT_ONLY=1`）；在沙箱中使用 `rsrs --client-only <command>`，非回环对等端需使用令牌 |

```powershell
rsrs account main                # switch away from <name> while the runtime runs
rsrs --runtime-internal --stop   # stop before profile writes
rsrs --direct account remove <name> --yes
rsrs status
```

配置文件在活动状态下无法删除；请先选择 `main`（或其他保留的配置文件）。

`rsrs web` 打开托管仪表盘 `https://dash.rsrs.rs` 且不启动本地运行时。详见 [主机运行时和沙箱客户端](../runtime.md) 的生命周期和令牌规则。

## 卸载旧客户端 {#uninstalling-the-old-client}

在新库验证前保留旧的 `~/.onememory` 目录，然后移除旧客户端：

```powershell
Stop-Process -Name 1memory -Force -ErrorAction SilentlyContinue
npm uninstall -g @1memory/cli
```

移除任何残留的 `1memory:begin` 和 `1memory:end` 注入块；原始代码配置应删除 `1memory.md` 并保留 `respire.md`。清理后，`where 1memory` 应无输出且 npm 全局为空。

## 常见问题 {#common-pitfalls}

| 症状 | 原因 | 解决方法 |
| --- | --- | --- |
| `os error 10060` 或通过代理召回超时 | `NO_PROXY` 不包含 `127.0.0.1` | 将 `127.0.0.1,localhost` 添加到 `NO_PROXY` |
| `BGE-M3 files missing` | M3 模型未安装（升级后预期出现） | `rsrs model install` 和 `rsrs model activate m3` |
| 跨版本 `--stop` 报 `runtime_unauthorized` | 旧运行时仍在运行 | 终止 `rsrs.exe --runtime-internal` 进程 |
| `another model operation is running` | 并发模型操作 | 等待当前操作；不要并行运行 |
| `backup` 报 `file exists (os error 80)` | 目标已存在 | 先删除或重命名 |
| `keygen would overwrite it` | 配置文件已包含密钥材料 | 仅在新配置文件上运行 `keygen` |
| `legacy library has ciphertext but no session` | 平铺根扫描未覆盖的配置文件 | 运行 `rsrs migrate` 列出配置文件并按 `source_id` 迁移 |
| defrag 报 `no usable vectors` | 库中无记录 | 不是故障；库非空时正常 |
| 读取命令阻塞超过40秒 | 推理工作线程饱和 | `rsrs model reset-cpu`（终止运行时） |
| `doctor` 退出码1 | `inject` 或 `tidy` 未满足 | 不是安装故障 |

## 退出码和错误分类 {#exit-codes-and-error-classes}

阅读 JSON 包裹而非仅退出码。详见 [CLI JSON](../cli-api.md) 的包裹和代码表。

- `exit=2` 通常表示成功带警告或待定决策，如 `keys-export`、`classify --plan`、`split` 材料、`bench`、`resort` 干运行或 `share`。
- `doctor` 退出码1当 `inject` 或 `tidy` 未满足；这不是故障。
- 用户输入错误，包括参数解析、ID 查找、不良规范、自连接或循环，返回 `summary.reason:"invalid_input"`、`error_type:"user"` 且退出码2。不要仅凭 `reason` 判断故障。

完整命令面详见 [CLI 命令](../cli.md)；脚本集成详见 [CLI JSON](../cli-api.md)。

## 测试隔离 {#test-isolation}

测试针对独立配置文件 (`~/.rsrs/accounts/<name>`)，从不使用主配置文件，并在测试后切换回并移除临时配置文件。

```powershell
rsrs --runtime-internal --stop
rsrs --direct account test-profile
rsrs register --user test-profile   # password entered at a hidden prompt; a super code is issued
rsrs status
rsrs --runtime-internal --stop
rsrs --direct account main
rsrs --direct account remove test-profile --yes
```

`rsrs register` 会在隐藏提示下请求登录密码，并签发超码。不要将密码或恢复码作为命令参数传递，它们会暴露在进程列表和 shell 历史中。

新配置文件首次报告 `User local / local store (offline)`；`register` 后变为 `cloud sync (auto)`。

## 数据安全 {#data-safety}

- 操作前用 `rsrs config` 确认数据目录；测试使用独立配置文件且 `rsrs export` 合并前使用。
- 超级密码使用 v4 加密并以 `A3-` 格式代码输出；若丢失，记忆将无法恢复。详见 [同步和密钥](../sync-and-keys.md)。
- 不要共享或提交 `session.json` 或账户密钥。
- 将召回记忆视为参考且遵循当前指令和现场证据。详见 [常见问题](../faq.md)。
