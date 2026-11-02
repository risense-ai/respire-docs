# 文档审查报告

## Client 2 0.2.22 补充审查

本轮以 Client 2 发布标签 `v0.2.22` 的提交 `866e34c9daa89b9a86b6b9da1a5d8d021f62dd71` 为依据。客户端工作树另有未提交修改；这些修改没有作为发布功能写入文档。以下状态只覆盖本轮检查，不能替代各平台的原生验收。

| 发现 | 处理与依据 | 仍需核验 |
| --- | --- | --- |
| 客户端指南声称 Codex 注入有界面预览。0.2.22 的安装页没有这一入口。 | 已修正中英文 `docs/client.md`；依据为发布版 `internal/desktop/frontend/pages/injection.js`。CLI 历史参考保留其版本范围。 | 没有执行真实宿主的注入。 |
| 原有五组客户端截图来自 0.2.17，且缺少多个页面。 | 已补充 0.2.22 的 12 个页面和托盘截图，使用发布版前端和模拟数据。 | 模拟数据不验证 Runtime、真实账户或原生窗口。 |
| Windows 安装页仍以 CLI 为主要路径。 | 中英文页面已将桌面客户端放在前面，并说明 Node.js 只用于下方的 CLI 路径。 | 未在新安装的 Windows 系统上执行完整安装。 |
| 0.2.22 英文界面的部分文字仍为中文。 | 截图保留真实界面文字，并在客户端指南中注明。 | 客户端翻译需要在客户端仓库修复；本轮不修改该仓库。 |
| 首页与仓库列表仍只列出八个插件，遗漏 DSH 和 Magpie。 | 已更新中英文首页与仓库列表；对照 `docs/plugins/index.md` 的十个插件条目。 | 本轮未重复执行各宿主的插件安装。 |
| Windows CLI 指南将 `doctor --fix` 描述为立即安装模型。 | 已说明该命令可能安排后台准备或等待现有任务；对照 CLI `v1.0.19` 的 `run_doctor`。 | 未在新配置中运行模型下载。 |
| 迁移指南使用固定测试账户名，并无条件删除该账户；同名账户可能包含已有库和密钥。 | 已移除中英文命令示例，改用独立数据目录、独立端口和测试服务的隔离原则；对照 CLI `v1.0.19` 的 `run_account` 和数据目录解析。 | 未创建或删除真实账户，也未验证外部测试服务。 |

本轮逐页对照了发布版前端的页面入口、显示内容和操作代码。截图检查使用隔离的模拟接口，没有执行写入、登录或安装；下表不能证明这些操作在真实 Runtime 中全部成功。

| 页面 | 主要源码 | 文档覆盖 |
| --- | --- | --- |
| 概览 | `pages/overview.js` | 状态、同步、Runtime 启停和跳转。 |
| 记忆 | `memory/workspace.js`、`editor.js`、`tools.js`、`interactions.js` | 四种视图、筛选、检索、选择、编辑、合并和工具。 |
| 日记 | `memory/diary.js` | 日历、日期浏览、片段搜索和相邻片段。 |
| 整理 | `pages/organize.js` | 检查、方案预览和应用，以及 AI 服务的数据发送边界。 |
| 模型与索引 | `pages/models.js`、`pages/recall.js` | 权重、引擎、索引、召回配置和基准测试。 |
| 账户与空间 | `pages/accounts.js`、`authentication.js`、`space-members.js` | 登录、恢复、账户迁移、同步、空间和成员。 |
| 安装 | `pages/injection.js`、`internal/desktop/inject.go` | 提示词模式、目标开关、插件和文件覆盖。 |
| 访问授权 | `pages/grants.js` | 子树授权的创建、查看和撤销。 |
| 设置 | `pages/settings.js`、`storage.js`、`ui/typography.js` | 外观、语言、启动、备份、目录和排版。 |
| 更新 | `pages/settings.js` | 客户端和 CLI 的通道、检查和更新。 |
| 操作记录 | `pages/settings.js` | 请求状态、回执和查询原请求。 |
| 诊断 | `pages/settings.js` | 连接状态、检查和诊断导出。 |
| 托盘 | `quickpanel.js`、`internal/desktop/app.go` | 快捷面板、同步、窗口和 Runtime 操作。 |

状态：文档修改和指定检查已完成；未实测或仍需后续核验的事项见各条状态。以下发现记录审查时的问题，不表示修改后仍然存在。

## 补充：npm 包名与机器契约

面向用户的安装入口是 `rsrs-cli`。审查快照中的 CLI 提交 `7b14ada97710` 仍构建旧的中间包；已发布的 `rsrs-cli@1.0.19` 也仍依赖该包。因此，不能只在文档的机器契约副本中改名。

后续 CLI 分支 `fix/npm-direct-launcher` 的提交 `d45fcb0` 改为直接构建启动包。截至本轮核查，该提交只见于该分支，尚未证实进入公开发布。本轮没有修改 CLI 代码或机器契约。

客户端兼容矩阵属于旧客户端的历史快照，尚未对照当前客户端验证。同步这两份契约前，需要核对对应源码修订、消费者和发布状态；本次按要求只修改文档。

## 范围和依据

- 审查 `respire-docs` 中的中英文页面、仓库说明和契约说明，并检查相关机器契约。
- 以当前检出的 CLI、Core、服务端、插件和 `respire-client2` 源码为依据。涉及已发布版本的声明另行标明版本；工作树中的未提交修改不代表已发布行为。
- 文档基线：`521405dac9b27e97d3ac2e3dd8f2e18345083649`，审查前工作树干净。以下源码修订和状态记录本次审查时的快照；dirty 表示源码包含未提交改动，不代表发布行为。
- CLI：`7b14ada97710` dirty；Core：`b1d25985d62d` dirty；server：`22096e8e237a` dirty；site：`14ad9f38453d` dirty；client2：`52a57e8b4f69` dirty。
- 插件：Codex `7b848de71d65` clean；DimCode `6215d1cc5e54` clean；DSH `88e4f4e26516` dirty；Hermes `b8827c0b5c96` clean；Kimi `13ecc42a74ff` clean；Magpie `c10746661b59` dirty；Pi `01f069b2ad7b` clean；Qoder `0bb476d1a742` dirty；WorkBuddy `f8591f0d5fdb` clean；Zcode `3771cb28405e` clean。
- 审查包括事实、命令、数据与安全边界、中英文一致性、文字和重复内容。构建检查只能发现部分格式和链接问题，不能代替事实核对。

## 已确认问题

1. **[已调整；相关运行行为仍待核验]** **迁移说明冲突**：`docs/zh/ovh-environments.md:12` 称启动时迁移旧账户；`respire-cli/crates/app/src/migration.rs:78` 和 `cli/src/main.rs:6645` 表明旧数据需要显式迁移。英文页同样有误。
   修改或依据：`docs/ovh-environments.md；CLI crates/app/src/migration.rs`。
2. **[已调整；相关运行行为仍待核验]** **安装示例的凭据风险**：`docs/zh/getting-started.md:64` 和英文页的注册示例在命令参数中放入密码；应核对当前命令后使用交互输入，避免凭据出现在进程参数中。
   修改或依据：`docs/getting-started.md；CLI cli/src/main.rs`。
3. **[已调整；相关运行行为仍待核验]** **安装入口过时**：入门、迁移、Windows 与插件指南多处使用被放弃的旧入口。`respire-cli/npm/README.md:6` 将 `rsrs-cli` 作为主要入口，且该包的 `latest` 和 `dev` 标签均存在；必须区分面向用户的入口和当前源码里的内部依赖。
   修改或依据：`docs/getting-started.md、docs/guides/windows-install.md、docs/plugins/；CLI npm/README.md`。
4. **[已调整；相关运行行为仍待核验]** **客户端架构过时**：`docs/zh/client.md:3`、`CLIENT-GUIDE.md`、`windows-packaging.md`、`index.md`、`repos.md` 和 `development.md` 等仍描述旧桌面端。`respire-client2/README.md:5` 和 `internal/desktop/frontend/client.js:1` 显示当前桌面端使用 Wails、独立前端和 Runtime RPC。
   修改或依据：`docs/client.md、docs/CLIENT-GUIDE.md、docs/windows-packaging.md；client2 README.md`。
5. **[已调整；相关运行行为仍待核验]** **客户端功能缺失**：文档尚未覆盖客户端的总览、记忆、日记、整理、模型与索引、账户与空间、安装、访问授权、设置、更新、操作记录、诊断和托盘面板。功能需要按各页面及宿主操作源码逐项补充，并标明版本与平台限制。
   修改或依据：`docs/client.md；client2 internal/desktop/frontend/client.js`。
6. **[已调整；相关运行行为仍待核验]** **插件收尾说明过时**：Codex 文档仍描述主代理续跑和 5 秒 Stop；`plugins/respire-codex/hooks/hooks.json:18` 使用异步 Stop 和 300 秒限制。Pi 文档也描述主代理续跑，而 `plugins/respire-pi/lib/index.js:213` 使用后台处理。需要同时核查发送给模型的材料、结果未知时的处理和宿主版本限制。
   修改或依据：`docs/plugins/codex.md、docs/plugins/pi.md；对应插件 hooks/hooks.json、lib/index.js`。
7. **[已调整；相关运行行为仍待核验]** **插件总览过度概括**：`docs/zh/plugins/index.md:3` 将安装、配置和收尾行为概括为统一契约，但各插件的实现不同。总览还缺少 DSH 和 Magpie；各宿主的安装和隐私边界应分别说明。
   修改或依据：`docs/plugins/index.md、docs/plugins/dsh.md、docs/plugins/magpie.md；对应插件仓库`。
8. **[已调整；相关运行行为仍待核验]** **插件卸载示例不完整**：Dim 和 WorkBuddy 的备份命令使用未创建的目标目录；WorkBuddy 的回退说明还依赖假设已经失效的 CLI。应核对实际卸载路径后分别改写。
   修改或依据：`docs/plugins/dimcode.md、docs/plugins/workbuddy.md；对应插件仓库`。
9. **[已同步选定快照；其他目标和旧消费者兼容性未验证]** **契约副本与当前源码不一致**：已将 CLI 清单同步至 CLI 提交 `7b14ada97710`，将 OpenAPI 同步至服务端提交 `22096e8e237a`。Core 四份契约对应 CLI 固定的 SDK `1.0.2-dev.16`：Windows 目标清单的哈希与锁文件一致，其源码修订 `3bce730191d087c56684ee30743319f4a64918a4` 的四个文件已逐项核对。服务端固定的 SDK 版本不同，不能据此推断它支持新增能力；旧客户端矩阵保留其原范围。
   修改或依据：`contracts/README.md、contracts/core-abi/README.md；各仓库契约`。
10. **[已调整；相关运行行为仍待核验]** **服务端文档存在过时描述**：`docs/zh/server.md:53` 指向当前仓库不存在的管理前端目录；部署页只说明历史 schema 5，容易误认为它是当前目标。服务端有未提交修改，必须区分已提交与工作树行为。
   修改或依据：`docs/server.md、docs/server-deployment.md；server service/`。
11. **[已调整；相关运行行为仍待核验]** **备份和整理指引不完整**：批量整理页没有说明数据库快照；其预览无副作用的表述也与辅助脚本会先创建锚点的说明冲突。`--limit 5000` 不能保证覆盖更大的记忆库。
   修改或依据：`docs/guides/batch-tidy-extracted.md；CLI 及脚本实现`。
12. **[已调整；相关运行行为仍待核验]** **文字与维护规则问题**：`data-model.md` 重复解释数据目录设置；豆包示例在表格后重复整段排障信息；`CONTRIBUTING.md` 要求只用英文，与双语页面配对规则冲突。中英文页面均需逐句核对。
   修改或依据：`docs/data-model.md、docs/guides/agent-example-doubao.md、CONTRIBUTING.md`。
13. **[已调整；相关运行行为仍待核验]** **保险库认证条件不完整**：浏览器授权页笼统称授权后输入超级密码；`respire-cli/cli/src/login.rs:104` 对旧版 v1 保险库要求原登录密码和 Account Secret。文档应区分保险库版本，避免误导恢复操作。
   修改或依据：`docs/browser-api-contract.md；CLI cli/src/login.rs`。
14. **[已调整]** **注入覆盖风险说明不足**：`docs/zh/injection.md` 没有充分说明全文覆盖目标会覆盖现有文件并移除目标符号链接。对应实现为 `respire-cli/crates/app/src/inject.rs:371`；更新说明时应提示先检查并备份目标。
   修改或依据：`docs/injection.md；CLI crates/app/src/inject.rs`。
15. **[已调整；相关运行行为仍待核验]** **模型配置项和并发说明过时**：CLI 页与 FAQ 提到的两个模型目录变量在当前非测试源码中未找到读取实现；`RSRS_M3_DIR` 有实现。Windows 指南禁止同一配置执行任何并发命令，也没有足够依据；应按具体排他操作说明限制。
   修改或依据：`docs/cli.md、docs/faq.md、docs/guides/windows-install.md；CLI 配置源码`。
16. **[已调整；相关运行行为仍待核验]** **RPC 示例与前提不一致**：`docs/zh/runtime-rpc.md:40` 要求确认运行版本，后面的 Python 和 JavaScript 示例只打印版本而未校验。应注明示例的范围，不能让读者以为示例完成了版本兼容判断。
   修改或依据：`docs/runtime-rpc.md；CLI runtime RPC 实现`。
17. **[已调整；相关运行行为仍待核验]** **同步字段指代不明**：`docs/zh/sync-and-keys.md:52` 提到前文的四个字段，但前文没有列出；需要对照相关契约补全或调整指代。
   修改或依据：`docs/sync-and-keys.md；server service/src/http/dto.rs`。
18. **[已调整；相关运行行为仍待核验]** **插件配置与隐私细节错误**：Qoder 配置文件存在优先级，直接复制到钩子目录可能不生效；Hermes 的提醒发生在后续请求，不能描述成仅在本会话出现新事实后触发。部分钩子日志会记录提示词片段，后台归档也可能把本轮材料发送给模型。
   修改或依据：`docs/plugins/qoder.md、docs/plugins/hermes.md；对应插件源码`。
19. **[已调整；相关运行行为仍待核验]** **引导示例错误**：豆包示例要求离线状态也存在 Server 状态行；批量整理页把受数量限制的列表称为全库，且对列表输出内容和分类后端的描述已过时。须按 `respire-cli/cli/src/main.rs` 的具体实现调整。
   修改或依据：`docs/guides/agent-example-doubao.md、docs/guides/batch-tidy-extracted.md；CLI cli/src/main.rs`。
20. **[已调整；未做故障注入]** **迁移回执的写入位置未说明**：`respire-cli/crates/app/src/migration.rs:217` 和 `:243` 显示，迁移发布目标后还会在源目录写入回执。应说明源数据库和凭据保留，但源目录可能新增回执；写入回执失败时目标可能已存在。
   修改或依据：`docs/data-model.md、docs/runtime.md；CLI crates/app/src/migration.rs`。
21. **[已调整；相关运行行为仍待核验]** **关系召回存在例外**：`respire-cli/cli/src/main.rs:8121` 和 `:8228` 显示元数据路径及渲染预算路径不会执行普通关联扩展。`--no-related` 与渲染预算的组合还有一处可能保留替代提示；这是源码推断，尚未复现，不应当作已证实的运行结果。
   修改或依据：`docs/associations.md；CLI cli/src/main.rs、cli/src/recall_select.rs`。
22. **[已调整；相关运行行为仍待核验]** **同步流程顺序有误**：`architecture-internals.md` 把 cursor 保存放在推送之后；`respire-cli/crates/app/src/sync.rs:144` 显示 v2 在拉取时逐页提交 cursor，推送后可能再次拉取。
   修改或依据：`docs/architecture-internals.md；CLI crates/app/src/sync.rs`。
23. **[已调整；相关运行行为仍待核验]** **远程整理脚本的备份和预览风险**：所引用脚本在预览阶段会创建锚点，并使用固定路径导出明文；重复执行可覆盖第一次备份。它还接受某些非零退出码、不核对完整状态，并以短 ID 一次提交批量操作。不能继续把它写成无副作用的一键预览。
   修改或依据：`docs/guides/batch-tidy-extracted.md；引用脚本`。
24. **[已调整；相关运行行为仍待核验]** **站点部署描述过时**：`product/site.md` 只描述旧的容器和代理路径；`respire-site/README.md:37` 描述了 Cloudflare Pages 的新方案。仓库配置不证明线上流量已切换，必须区分目标架构和已验证部署。
   修改或依据：`docs/product/site.md；site README.md`。
25. **[已调整；相关运行行为仍待核验]** **长参考页的中文遗漏条件**：`docs/zh/runtime-rpc-commands.md` 中，日记检索分数的可信度、`remember` 判重流程、导入范围、合并删除源条目以及注册的交互条件等，与英文原文相比存在遗漏。该页固定为历史版本，修订时不能把新版本行为直接写进旧版参数表。
   修改或依据：`docs/runtime-rpc-commands.md；CLI v1.0.17-dev.14 cli/src/main.rs`。
26. **[已调整；相关运行行为仍待核验]** **旧客户端兼容矩阵的适用范围不明**：`contracts/client-compatibility-matrix.json` 指向旧 Tauri 客户端，client2 的平台映射和下载机制不同。该文件仍由文档仓库的校验脚本读取，不能直接替换；应先在说明中标明旧客户端范围。
   修改或依据：`contracts/README.md；contracts/client-compatibility-matrix.json`。
27. **[已同步已提交快照；线上部署未验证]** **OpenAPI 副本缺少已提交接口**：审查时服务端 HEAD 的契约有 44 条路径，文档副本有 26 条。现已同步服务端提交 `22096e8e237a` 的快照，并排除工作树中未提交的 5 条路径；该快照不证明线上部署。
   修改或依据：`docs/contracts.md、contracts/README.md；server service/openapi.yaml`。
28. **[已按固定 SDK 的源码同步；运行时兼容性未实测]** **Core 执行限制的版本范围不清**：原 `contracts/core-abi/README.md` 写单队列和固定运行期限，而当前 Core 使用两个队列并由宿主提供期限。修订时标注 SDK 和源码范围；流式输入扩展需要对应 SDK 的能力支持。
   修改或依据：`contracts/core-abi/README.md；Core ABI 实现`。
29. **[已调整；相关运行行为仍待核验]** **注册和密钥生成的显示方式需要说明**：当前 `keygen --pass` 不是加密因子；`keygen --json` 返回的恢复材料应在私密环境安全保存。注册应在交互终端输入凭据，不能把密码放入命令参数。
   修改或依据：`docs/getting-started.md；CLI cli/src/main.rs`。
30. **[已调整；未做故障注入]** **备份及模型恢复指引不完整**：数据库备份会移除本地访问授权，导出会覆盖同名文件，而 `reset-cpu` 会切换引擎并停止运行时。相关指南现要求使用新备份路径，并说明操作影响；依据为 CLI `service.rs` 与 `core-sdk/src/business.rs`。
31. **[已调整；未做宿主实测]** **客户端和插件边界遗漏**：补充客户端切换数据目录、清除本机身份、更新时重启、文件覆盖及图谱操作；WorkBuddy 页面补充所测桌面端的钩子限制，DSH 将五条召回改为可配置的默认值。
32. **[已调整；未部署]** **同步提案的迁移编号冲突**：服务端已将原文提及的编号用于其他迁移，现删除该编号，并保留提案尚未完成的说明。

## 逐篇覆盖与处理状态

以下每行包含同路径英文和 `docs/zh/` 中文页。已读或已调整表示进行了文档和相关源码审阅；不等于逐项运行、宿主实测或线上验证。对照依据指本次涉及的主要仓库，不表示已验证其全部代码。

| 页面 | 状态 | 主要依据及剩余风险 |
| --- | --- | --- |
| `docs/CLIENT-GUIDE.md` | 已读，已调整 | CLI、相关源码与文档；未逐项运行 |
| `docs/README.md` | 已读，已调整 | CLI、相关源码与文档；未逐项运行 |
| `docs/architecture-internals.md` | 已读，已调整 | CLI、相关源码与文档；未逐项运行 |
| `docs/architecture.md` | 已读，本次未调整 | CLI、相关源码与文档；未逐项运行 |
| `docs/associations.md` | 已读，已调整 | CLI、相关源码与文档；未逐项运行 |
| `docs/benchmark.md` | 已读，本次未调整 | CLI 基准实现；未运行基准 |
| `docs/browser-api-contract.md` | 已读，已调整 | server 和 CLI；线上状态未核验 |
| `docs/cli-api.md` | 已读，已调整 | CLI、相关源码与文档；未逐项运行 |
| `docs/cli.md` | 已读，已调整 | CLI、相关源码与文档；未逐项运行 |
| `docs/client.md` | 已读，已调整 | client2 和 CLI；非 Windows 未实测 |
| `docs/contracts.md` | 已读，已调整 | Core、CLI 和契约；发布兼容性待核验 |
| `docs/data-model.md` | 已读，已调整 | CLI、相关源码与文档；未逐项运行 |
| `docs/development.md` | 已读，已调整 | CLI、相关源码与文档；未逐项运行 |
| `docs/faq.md` | 已读，已调整 | CLI、相关源码与文档；未逐项运行 |
| `docs/getting-started.md` | 已读，已调整 | CLI、相关源码与文档；未逐项运行 |
| `docs/guides/agent-example-doubao.md` | 已读，已调整 | CLI、相关源码与文档；未逐项运行 |
| `docs/guides/batch-tidy-extracted.md` | 已读，已调整 | CLI、相关源码与文档；未逐项运行 |
| `docs/guides/migrate-and-upgrade.md` | 已读，已调整 | CLI、相关源码与文档；未逐项运行 |
| `docs/guides/skills-repo.md` | 已读，已调整 | CLI、相关源码与文档；未逐项运行 |
| `docs/guides/windows-install.md` | 已读，已调整 | CLI、相关源码与文档；未逐项运行 |
| `docs/index.md` | 已读，已调整 | CLI、相关源码与文档；未逐项运行 |
| `docs/injection.md` | 已读，已调整 | CLI 注入实现；覆盖行为未实测 |
| `docs/ovh-environments.md` | 已读，已调整 | CLI、相关源码与文档；未逐项运行 |
| `docs/plugin-dev.md` | 已读，已调整 | CLI 钩子实现；未逐项运行 |
| `docs/plugin-ecosystem.md` | 已读，已调整 | CLI 和 client2；未逐项运行 |
| `docs/plugins/codex.md` | 已读，已调整 | 对应插件仓库；宿主未实测 |
| `docs/plugins/dimcode.md` | 已读，已调整 | 对应插件仓库；宿主未实测 |
| `docs/plugins/dsh.md` | 新增，已读 | 对应插件仓库；宿主未实测 |
| `docs/plugins/hermes.md` | 已读，已调整 | 对应插件仓库；宿主未实测 |
| `docs/plugins/index.md` | 已读，已调整 | 对应插件仓库；宿主未实测 |
| `docs/plugins/kimi.md` | 已读，已调整 | 对应插件仓库；宿主未实测 |
| `docs/plugins/magpie.md` | 新增，已读 | 对应插件仓库；宿主未实测 |
| `docs/plugins/pi.md` | 已读，已调整 | 对应插件仓库；宿主未实测 |
| `docs/plugins/qoder.md` | 已读，已调整 | 对应插件仓库；宿主未实测 |
| `docs/plugins/workbuddy.md` | 已读，已调整 | 对应插件仓库；宿主未实测 |
| `docs/plugins/zcode.md` | 已读，已调整 | 对应插件仓库；宿主未实测 |
| `docs/product/core.md` | 已读，已调整 | Core、CLI 和契约；发布兼容性待核验 |
| `docs/product/site.md` | 已读，已调整 | site 配置；线上流量未核验 |
| `docs/product/web.md` | 已读，已调整 | client2 和 CLI；非 Windows 未实测 |
| `docs/repos.md` | 已读，已调整 | CLI、相关源码与文档；未逐项运行 |
| `docs/runtime-rpc-commands.md` | 已读，已调整 | CLI v1.0.17-dev.14；命令未逐条运行 |
| `docs/runtime-rpc.md` | 已读，已调整 | CLI、相关源码与文档；未逐项运行 |
| `docs/runtime.md` | 已读，已调整 | CLI、相关源码与文档；未逐项运行 |
| `docs/server-deployment.md` | 已读，已调整 | server 和 CLI；线上状态未核验 |
| `docs/server-request-boundaries.md` | 已读，本次未调整 | server 和 CLI；线上状态未核验 |
| `docs/server.md` | 已读，已调整 | server 和 CLI；线上状态未核验 |
| `docs/story.md` | 已读，本次未调整 | CLI、相关源码与文档；未逐项运行 |
| `docs/sync-and-keys.md` | 已读，已调整 | server 和 CLI；线上状态未核验 |
| `docs/sync-v2-rollout.md` | 已读，本次未调整 | server 和 CLI；线上状态未核验 |
| `docs/walkthrough.md` | 已读，已调整 | CLI、相关源码与文档；未逐项运行 |
| `docs/windows-packaging.md` | 已读，已调整 | client2 和 CLI；非 Windows 未实测 |

根文件和发布材料单独记录：

| 材料 | 状态与边界 |
| --- | --- |
| `README.md`、`COMMERCIAL-LICENSE.md`、`LICENSE` | 已读，本次未调整；未判断法律效力或核验线上部署。 |
| `CONTRIBUTING.md` | 已读并调整双语规则。 |
| `contracts/README.md`、`contracts/core-abi/README.md` | 已读并调整适用版本说明；未实测全部 ABI。 |
| `contracts/openapi.yaml`、`contracts/core-api.json`、`contracts/core-abi/` schema 和头文件、CLI 清单、客户端矩阵 | 已比对并同步服务端、CLI 和固定 Core SDK 的源码快照。旧客户端矩阵保留原版本；各目标 SDK 与消费者的运行兼容性仍待核验。 |
| `docs/.vitepress/config.mts`、`scripts/validate-locales.mjs` | 已检查导航及双语校验；构建只检查其覆盖的规则。 |

历史 RPC 清单固定为 `1.0.17-dev.14`，不代表当前 CLI 的完整命令集；原始帮助保留，正文注明判重例外。源码工作树中的未提交功能不能当作已发布或已部署。

## 检查结果

- `node contracts/validate.mjs`：通过。
- `npm run build`：通过，校验 51 组页面及 7915 个内部链接和资源；构建提示 chunk 超过 500 kB。
- 维护 skill 的 `quick_validate`：通过。
- Core SDK Windows 清单哈希与 CLI 锁文件一致；四份 Core 契约的 Git blob 与清单标明的源码修订一致。OpenAPI 与选定服务端提交一致。
- 这些检查不验证云端部署、宿主插件运行、真实凭据流程或灾难恢复。

## 后续核验

机器契约的版本升级、发布兼容性、线上部署与外部宿主行为仍需单独核验。迁移、备份和恢复没有进行破坏性实测；失败后的目标目录和回执状态应在真实环境核对。
