# memTools 桌面收录 {#memtools-desktop-capture}

memTools 是 Respire 的可选 Windows 桌面伴侣。它常驻系统托盘，用全局热键唤起小窗，把想法、事实、决策或日记通过本机 loopback runtime 写入本地 rsrs 记忆库。它还能在任意应用里划词保存、提供一键快捷目标、用模型或本机 agent 预处理内容、扫描 `【触发】` 日期做到期提醒，并把整个记忆库渲染成 3D 点云。Chrome 与 Edge 扩展可以把网页选区存进同一个记忆库。

本文对应 memTools `0.5.1`（提交 `1b7ed18`）。结论均与该版本源码核对，但未重新做界面实机回归。界面文案、分类树数量与端口以实际运行的版本和本地库为准。

memTools 只是客户端：不启动、停止、复制或升级 runtime。runtime 本身见 [宿主运行时与升级](../runtime.md)，命令行见 [CLI 命令](../cli.md)。

## 能力与边界 {#capabilities-and-scope}

| 能力 | 入口 | 结果 |
| --- | --- | --- |
| 收录到主区 | 小窗 → 记录 → 主区 → 选树 → 提交 | 以 `importance = important` 挂到所选树根 |
| 收录日记 | 小窗 → 记录 → 日记 → 提交 | 以 `importance = trivial` 落库并并入当日轨迹 |
| 三段模板 | 小窗 → 三段模板 | 拼成带 `【前因】【行为】【后果】` 的正文 |
| 自动化收录 | 底栏开关 | 先判档、判重、判树，再写入 |
| 模型判档 | `automation.mode` 与 `[automation.llm]` | 模型决定重要度、树与标题，失败回退本地 |
| 内容梳理 | 记录视图 → 梳理 | 总结、结构化、起标题、翻译、提取或润色 |
| 梳理来源 | 任务条 → 来源 | 模型、opencode、Qoder 或关闭，点选即生效 |
| 快捷目标 | 顶栏、划词面板、扩展菜单 | 一键存到常用位置，最多 8 个，第 1 个最优先 |
| 划词悬浮 | 任意应用拖选或双击 | 光标旁弹窗保存，或打开小窗并预填 |
| 判重择一 | 提交后的候选列表 | 改、并、挂或存新条 |
| 最近记忆 | 顶栏 → 最近记忆 | 按更新时间倒序，可按树筛选 |
| 搜索 | 顶栏 → 搜索 | 语义搜索或 id 前缀精确命中 |
| 到期提醒 | 顶栏 → 提醒与角标 | 已逾期、今天、即将与之后分组 |
| 3D 记忆图谱 | 顶栏 → 图谱 | 只读点云，悬停聚焦，实时更新 |
| 网页收录 | Chrome 与 Edge 扩展 | 按快捷目标保存，可先梳理 |
| 自动更新 | 底栏 → 更新 | 检查、下载、SHA-256 校验并重启 |
| 同步徽标 | 底栏 | 离线状态、待同步条数与冲突数 |
| 托盘常驻 | 系统托盘 | 关闭小窗后热键、划词与扩展仍可用 |

明确不做：

- 不启动、停止、复制或升级 rsrs 服务。runtime 不可达时只报告，生命周期交给宿主。
- 不使用 `--direct`。所有调用都走本机 loopback HTTP 端点。
- 不拼接 shell 命令字符串。调用 rsrs 与 agent 都使用参数数组。
- 不在浏览器扩展里自动改或并。疑似重复时退化为下挂，并提示回小窗确认。
- 不猜 task 的绝对日期。
- 不为 agent 层次提供完全隔离。交给带工具 agent 的内容仍可能触发工具。
- 不提供记忆的图形化版本历史。改与并不可逆，只能靠备份。

## 前置条件 {#prerequisites}

### 运行环境 {#required-environment}

| 项 | 要求 | 检查方法 |
| --- | --- | --- |
| 操作系统 | Windows 10 或 11 x64 | `winver` |
| WebView2 | 系统通常已内置；缺失时安装 Microsoft Edge WebView2 Runtime | 已安装应用 |
| rsrs runtime | 本机运行，默认 `http://127.0.0.1:15169` | `rsrs --client-only status` |
| 端口 15169 | 未被占用 | `Get-NetTCPConnection -LocalPort 15169` |
| 端口 17650 | 扩展端点，可修改 | `Get-NetTCPConnection -LocalPort 17650` |
| 权限 | 普通用户，无需管理员 | — |

在受限或沙盒环境中，CLI 必须带 `--client-only`。memTools 不管理服务生命周期。

### 可选能力 {#optional-capabilities}

| 能力 | 需要 | 默认值 |
| --- | --- | --- |
| 内容梳理（模型） | OpenAI 兼容的 `/v1/chat/completions` 端点 | `http://127.0.0.1:8125/v1/chat/completions`，模型 `qwen3:8b` |
| 内容梳理（agent） | `PATH` 中有 `opencode` 或 `qodercli` | 自动探测 |
| 模型判档 | 同一端点；`automation.mode` 设为 `high-quality` 或 `memory-gateway` | `local-fallback` |
| 自动更新 | 可访问的 `update.json` | `http://127.0.0.1:17651/update.json` |
| 3D 图谱 | 数据目录中有 `onememory.db` 与 `core-index` | 取自 runtime `status.data_dir` |
| 划词悬浮 | 无额外依赖；可能与其他划词软件冲突 | 启动时开启 |

### 源码构建要求 {#source-build-requirements}

| 项 | 要求 | 用途 |
| --- | --- | --- |
| Node.js | LTS，建议 20 或更新 | 前端构建与 npm 脚本 |
| npm | 随 Node.js 安装 | 安装依赖 |
| Rust | Stable MSVC 工具链 | Tauri 后端 |
| Visual Studio Build Tools | 含 C++ 桌面开发 | MSVC 链接器 |
| Tauri CLI | 已列入 `devDependencies` | 通过 `npm run tauri` 调用 |

## 安装与启动 {#install-and-start}

### 运行成品 exe {#run-a-prebuilt-executable}

1. 获取 `memtools.exe`；源码构建时位于 `src-tauri/target/release/memtools.exe`。
2. 双击启动。预期：不弹窗口，托盘出现图标。
3. 按 `Ctrl+Alt+R`。预期：小窗在上次位置或屏幕中央出现。
4. 查看底栏 runtime 状态点。预期：可连接时为绿色，否则灰色或红色。

> 小窗初始是隐藏的（`visible = false`）。这是正常行为，不是启动失败。

### 从源码构建 {#build-from-source}

```powershell
cd <repo>
npm install
npm run tauri dev
npm run tauri build -- --no-bundle
```

产物在 `src-tauri/target/release/memtools.exe`。不要分发 `cargo build --release` 的产物：它缺少 `custom-protocol` 特性，会加载开发服务器，可能只得到空白窗口。

### 启动检查 {#startup-checks}

- [ ] 任务管理器中存在 `memtools.exe`。
- [ ] 托盘图标存在，悬停提示 `memTools · rsrs 记忆`。
- [ ] `Ctrl+Alt+R` 能显示与隐藏小窗。
- [ ] runtime 状态点为绿色，或最近记忆能刷新。
- [ ] 启用扩展端点时，控制台出现 `浏览器扩展端点已启动 http://127.0.0.1:<port>`。
- [ ] 在其它应用里选中至少两个字，出现 `记` 图标。

### 隐藏、退出与单例 {#hide-exit-and-single-instance}

| 操作 | 行为 |
| --- | --- |
| 标题栏 `—` 或 `✕` | 隐藏到托盘，进程继续运行 |
| `Esc` | 隐藏到托盘 |
| 托盘左键 | 显示或隐藏小窗 |
| 托盘右键 → `显示面板` | 显示小窗 |
| 托盘右键 → `划词悬浮` | 开关划词悬浮 |
| 托盘右键 → `退出 memTools` | 退出进程 |
| 再次启动 exe | 唤起已有小窗，不产生第二个进程 |

> 关闭小窗不会停止热键、划词或扩展端点。要彻底退出请走托盘菜单。

## 界面总览 {#interface-overview}

### 主窗 {#main-window}

| 区域 | 内容 | 说明 |
| --- | --- | --- |
| 标题栏 | `memTools`、`rsrs 记忆`、`—`、`✕` | 整条可拖动，按钮可点击 |
| 视图切换 | 记录、最近记忆、搜索、提醒、快捷目标、图谱 | 切换视图不会打断记录视图 |
| 输入模式 | 自由文本、三段模板 | 模板拆分前因、行为与后果 |
| 输入区 | 多行文本框 | 上限 8000 字 |
| 输入提示 | `Ctrl+Enter 提交 · Esc 关闭` | 左侧字数统计，右侧梳理按钮 |
| 梳理任务条 | 来源与六个任务 | 模型、opencode、Qoder 或关闭 |
| 存到哪里 | 主区（`important`）或日记（`trivial`） | 层一 |
| 挂哪棵树 | 从 runtime 读取的树根 | 层二，仅主区显示 |
| 性质标记 | `context`、`decision`、`preference`、`task`、`emotion`、`time`、`skill` | 层三，可选，默认 `context` |
| 结果区 | 成功详情或错误 | 失败时小窗保持打开 |
| 底栏 | 自动化、更新、扩展、同步徽标、runtime 状态点 | 自动化开启时层一至层三隐藏 |

### 划词面板 {#selection-panel}

| 状态 | 内容 |
| --- | --- |
| 收起 | 40×40 的 `记` 图标，置顶、不抢焦点、不进 Alt+Tab |
| 展开 | 宽 280 像素、高 140 到 640 像素：选中文字预览、来源窗口、字数与竖排目标列表 |
| 操作 | 点目标保存；末项打开小窗并预填；`×`、`Esc` 或点击外部关闭 |

## 收录一条记忆 {#capture-a-memory}

手动路径适合已经知道该存到哪里的场景。

### 收录到主区 {#capture-to-the-main-area}

适用于可复用的结论、决策、配置、步骤和踩坑记录。

1. 按 `Ctrl+Alt+R`，焦点落在输入框。
2. 输入正文，尽量包含 `【前因】【行为】【后果】`。
3. 在存到哪里选择 **主区**。
4. 在挂哪棵树选择一棵树。树根按人域与 AI 域分组。
5. 可选地选择 type，默认是 `context`。
6. 按 `Ctrl+Enter`。
7. 在结果区查看 `action`、`id`、挂点、路径与标题。

树的名称和数量来自 runtime；新库通常有 23 棵。

规则：

- 主区必须选择一棵树，未选择会被拒绝。
- 条目以 `importance = important` 写入。
- 缺少标记时，按段落结构补标：
  - 一段补为 `【行为】` 并给出告警；
  - 两段补为 `【前因】` 与 `【行为】`；
  - 三段及以上补为 `【前因】`、`【行为】` 与 `【后果】`。
- 补标只添加标记，不改写事实。
- 标题由程序生成，界面内不能修改。
- 结果会显示类似 `root / … / this entry` 的路径，便于核对挂点。

### 收录到日记 {#capture-to-the-diary}

适用于今天做了什么、临时流水和活动轨迹。

1. 按 `Ctrl+Alt+R`。
2. 用一句话写清谁、何时、何地、做了什么，建议 20 到 60 字。
3. 在存到哪里选择 **日记**。
4. 按 `Ctrl+Enter`。
5. 挂点显示 `（日记，并入当日轨迹）`。

条目以 `importance = trivial` 写入，不判树也不挂树，自动并入当日轨迹。提醒扫描会跳过日记。

### 使用三段模板 {#use-the-three-part-template}

适用于强制把主区条目拆成前因、行为与后果。

1. 在输入模式选择 **三段模板**。
2. 填写字段：
   - `【前因】`：背景或起因，可留空；
   - `【行为】`：做了什么，必填；
   - `【后果】`：结果或结论，可留空。
3. 选择主区、树与 type。
4. 按 `Ctrl+Enter`，三个输入框会拼成带标记的正文。

> `【行为】` 为空时提交会被拒绝，并提示 `【行为】为空`。

### 标题生成 {#title-generation}

标题由 `automation::build_title` 生成：

1. 优先取 `【行为】` 段，其次 `【前因】`，最后用整段正文。
2. 跳过 `【触发】` 行。
3. 去掉开头的日期或时间 token，如 `2026-10-17` 或 `10:20`。
4. 截到首个句末标点 `。！？；;` 或 24 个字，不跨句拼接。
5. 内容为空时回退为 `未命名记忆`。

> 标题写事件事实，不要把分类名当标题。

### task 的触发行 {#trigger-lines-for-tasks}

type 为 `task` 时：

1. 输入区上方出现琥珀色的 `【触发】` 输入框。
2. 填写已确认的日期，推荐 `YYYY-MM-DD`，或填写可核实的前提。
3. 未填写就提交会返回 `needs_trigger` 并聚焦该输入框。程序从不猜日期。
4. 不含 `YYYY-MM-DD` 的内容仍可保存，但会提示确认前提可核实。

```text
【前因】需要在月底前完成记忆库整理
【行为】安排批量整理散根
【后果】待执行
【触发】2026-10-31
```

带已确认日期的 task 会进入提醒扫描范围。

### 输入限制 {#input-limits}

| 情况 | 行为 |
| --- | --- |
| 内容为空 | 拒绝提交，提示先输入内容 |
| 超过 8000 字 | 拒绝提交，提示拆分成多条 |
| 主区未选树 | 拒绝提交，提示选择分类树 |
| 模板 `【行为】` 为空 | 拒绝提交 |
| rsrs 插件 hook 超时告警 | 视为非致命；写入通常已成功 |
| runtime 不可达 | 显示连接错误，小窗保持打开，且不会启动服务 |
| 返回候选列表 | 尚未保存，需要选择一种判重操作 |

## 判重候选 {#duplicate-candidates}

rsrs 返回相似候选但没有写入时，结果区会列出候选并要求择一。

### 选择操作 {#choose-an-action}

| 选择 | 行为 | 说明 |
| --- | --- | --- |
| 改 | 重写选中的候选 | 默认单选第一条；改前备份，改后回读 |
| 并 | 把全部选中候选合并成新条 | 备份每条候选及其子条；注意孤儿子条 |
| 挂 | 把当前内容作为选中候选的子条新建 | 使用第一条选中的候选 |
| 存新条 | 在所选树下新建 | 仅在确实无所归属时使用 |

### 判重安全规则 {#duplicate-safety-rules}

- 改、并、挂都需要先勾选候选，否则提示 `未选择候选`。
- 并使用全部选中候选；改与挂只使用第一条。
- 存新条不依赖候选，但必须选择一棵树。
- 破坏性操作从不静默执行；备份写入 `{app_config_dir}/backups`。
- 候选列表不代表成功；只有完成择一后条目才存在。
- 自动化的挂分支还会显示目标附近的局部树（`memory_tree --outline`，深度 1，最多 8 个节点）。

## 自动化 {#automation}

自动化适合只想把内容丢进去、由工具判断归处的场景。

### 开启自动化 {#enable-automation}

1. 打开底栏开关；存到哪里、挂哪棵树和 type 会隐藏。
2. 可选地在提示框填写项目名或关键词，提升判重准确度。
3. 输入正文并按 `Ctrl+Enter`。
4. 无需确认时直接写入并回显分支、id 与挂点；否则弹出候选列表。

> 默认 `automation.mode = "local-fallback"`：判档与判树使用本地规则，判重使用本机 rsrs 模型。`high-quality` 与 `memory-gateway` 才会调用 `[automation.llm]`。

### 自动化流水线 {#automation-pipeline}

| 阶段 | 规则 |
| --- | --- |
| 判档 | 含三段标记，或命中 `结论`、`决策`、`修复`、`配置`、`命令` 等关键词，或达到 120 字，判为 `important`。否则以 `【` 加数字开头，或命中 `日记`、`今天`、`随手` 等日记词，判为 `trivial`。其余达到 60 字判为 `important`，否则 `trivial` |
| 日记短路 | `trivial` 直接写日记，不判重也不判树 |
| 补标 | `important` 且无标记时，按段落补标 |
| 判重 | 最多两轮 recall。有提示词时第 1 轮为提示词加正文前 30 字，第 2 轮为前 40 字；无提示词时第 1 轮为前 40 字，正文超过 40 字时第 2 轮为后 40 字。每轮最多 3 条，去重后按相似度排序 |
| 判树 | 用关键词 bigram 与树根名称和描述打分；名称完全命中额外加 5 分 |

### 分支与阈值 {#branches-and-thresholds}

| 条件 | 分支 | 行为 | 是否需确认 |
| --- | --- | --- | --- |
| 判档为 `trivial` | journal | 一步写入日记 | 否 |
| 最高相似度 ≥ `dup_threshold`（默认 `0.85`） | confirm | 返回候选，要求改、并、挂或存新条 | 是 |
| 最高相似度 ≥ `attach_threshold`（默认 `0.70`） | attach | 作为 `context` 挂到最相似条目下 | 否 |
| 无相似条目且能判树 | create | 在该树下以 `context` 新建 | 否 |
| 无相似条目且无法判树 | confirm | 要求手动选择树 | 是 |

破坏性分支的保护：

| 分支 | 保护 |
| --- | --- |
| 改 | 读取并备份原条到 `{app_config_dir}/backups`，改后回读，内容不一致即报错 |
| 并 | 合并前备份每条候选的正文与子条 |
| 挂、存新条、日记 | 非破坏性，自动执行 |

备份文件名为 `memtools-backup-<tag>-<millisecond timestamp>.json`。本地库没有版本历史，合并后要检查是否留下孤儿子条。

### 模型判档 {#model-assisted-classification}

把 `automation.mode` 设为 `high-quality` 或 `memory-gateway`，并配置 `[automation.llm]`：

```toml
[automation]
mode = "high-quality"

[automation.llm]
enabled = true
endpoint = "http://127.0.0.1:8125/v1/chat/completions"
model = "qwen3:8b"
api_key = ""
timeout_secs = 60
```

行为：

- 一次调用返回 `importance`、`tree`、`title` 与 `reason`。
- 只接受合法重要度、树根范围内的树名和 2 到 40 字标题。JSON 围栏与前后说明会被剥离。
- 判重仍走 rsrs 语义检索，改与并仍需确认。
- 模型失败或未启用时明确告警并回退本地规则。结果标签显示 `判档：模型` 或 `判档：本地`。

### 自动化边界 {#automation-boundaries}

- 判档与判树是关键词规则或模型输出，不是深度融合推理。模糊内容可能放错位置，关键条目走手动路径。
- 本地判重只在 rsrs 语义检索返回的候选里选择。
- 自动化不保证不产生新根：无法判树时会要求用户选择，而不是静默新建。
- 挂与改会把被采纳候选标为 `good`；存新条会把未采纳候选标为 `bad`。这项自评是尽力而为，候选已离开 `query_log` 时跳过。

## 快捷目标 {#quick-targets}

快捷目标是用户自定义的有序保存位置，第 1 个最优先。小窗、划词面板与扩展共用同一份列表。

### 目标类型 {#target-types}

| `kind` | 含义 | 写入行为 |
| --- | --- | --- |
| `journal` | 一步日记 | `importance = trivial`，不挂树 |
| `tree` | 挂到指定节点 | `--title --parent <parent> --type <type> --importance <importance>` |
| `auto` | 自动判档 | 判档、判重、判树后执行 |

`parent` 可以是树名（如 `AI-domain`）、记忆 id 或记忆标题。

### 管理快捷目标 {#manage-targets}

在小窗打开顶栏 → `快捷目标`：

1. 用 `新增目标` 添加一项。
2. 填写不超过 24 字的展示名并选择类型。
3. `tree` 类型需从当前树中填写 `parent`，并选择 type 与 importance。
4. 用上下按钮排序，第 1 项最优先。
5. 保存，或恢复默认：日记与自动判档。

扩展选项页的快捷目标卡片编辑的是同一份列表。

限制：

- 最多 8 个目标。
- `id` 必须唯一；`tree` 必须填 `parent`。
- `journal` 固定使用 `trivial`；`tree` 默认 `context` 与 `important`。
- 唯一数据源是 `{app_config_dir}/targets.json`。扩展的 `chrome.storage.local` 只是离线缓存。
- 扩展菜单每 10 分钟刷新一次；memTools 不可达时使用缓存或内置列表。
- 在 `POST /remember` 中，`target_id` 优先于旧的 `mode`。

### 目标出现的位置 {#where-targets-appear}

| 位置 | 表现 |
| --- | --- |
| 划词面板 | 竖排一列，第 1 个带 `优先` 徽标，末尾是 `在 memTools 中选择…` |
| 扩展菜单 | 按目标顺序生成子菜单，第 1 个带 ①，之后是 `梳理后保存（AI 总结）`、`在 memTools 中选择…` 与 `打开 memTools` |
| 主窗 | 手动模式保留存到哪里、树与 type；快捷目标可选 |

## 内容梳理 {#content-processing}

梳理把粗糙笔记变成记忆形态后再落库。它不打开聊天窗口，也不修改已有记忆。

### 梳理来源 {#processing-sources}

| 层次 | 来源 | 适用 | 默认 |
| --- | --- | --- | --- |
| 一 | OpenAI 兼容端点 | 总结、结构化、起标题、翻译、提取、润色 | 是 |
| 二 | 本机 headless agent CLI（opencode 或 Qoder） | 需要 agent 工具或 skill 的任务 | 否 |

切换方式：记录 → `梳理` → `来源` → **模型**、**opencode**、**Qoder** 或 **关闭**。点选立即生效，无需重启。

- 选择写入 `%APPDATA%\com.memtools.desktop\processor.json`，并叠加在 `config.toml` 之上。
- `config.toml` 保留默认值与高级参数，如 `bin`、超时、工作目录与工具列表。
- 选择关闭等价于 `enabled = false`；再选任一来源即恢复。
- 选择 agent 会探测 CLI，并显示 `opencode 可用：<path>（version）` 或具体的失败原因。

### 梳理任务 {#processing-tasks}

| 任务 | key | 说明 |
| --- | --- | --- |
| 总结成记忆 | `summarize` | 生成带 `【前因】【行为】【后果】` 的条目 |
| 结构化 | `structure` | 按字段或分段重组 |
| 起标题 | `title` | 2 到 60 字的事件标题 |
| 翻译 | `translate` | 目标语言由 `lang` 指定，默认中文 |
| 提取要点 | `extract` | 返回要点列表 |
| 润色 | `polish` | 在不改事实的前提下改写 |

HTTP 层也接受 `总结`、`标题`、`润色` 等中文别名。

### 梳理流程 {#processing-workflows}

小窗内：

1. 打开记录并输入或粘贴内容。
2. 点击 `梳理`。
3. 确认来源。
4. 点击任务，按钮进入忙碌态。
5. 结果替换输入内容。失败时显示原因，原输入保持不变。
6. 手动落库或走自动化。

扩展中：

1. 选择 `梳理后保存（AI 总结）`，选区先用 `summarize` 处理。
2. 结果再走 `auto` 判档落库。
3. 通知标题带 `（AI 梳理）`。
4. 超时为 120 秒，普通保存是 45 秒。
5. 梳理失败返回 502 或 503，绝不静默保存原文。

### 梳理 HTTP 接口 {#processing-http-endpoints}

`POST /process` 只梳理不写库：

```json
{
  "content": "text to process",
  "task": "summarize",
  "lang": "中文"
}
```

响应包含 `content`、`task`、`source`（`llm`、`opencode` 或 `qoder`）与 `message`。

`POST /remember` 接受 `process` 字段，先梳理再落库：

```json
{
  "text": "original content",
  "target_id": "auto",
  "process": "summarize",
  "url": "https://example.com/page",
  "page_title": "page title"
}
```

| 情况 | HTTP |
| --- | --- |
| 来源未启用、关闭、未配置或 agent 未找到 | 503 |
| 未知任务或 JSON 无效 | 400 |
| `/remember` 原文为空，或梳理后超过 8000 字 | 400 |
| 模型或 agent 调用失败 | 502 |
| 超时，agent 默认 240 秒 | 504 |
| 请求体超过 256 KB | 413 |

`/process` 的内容检查（如空内容或超过 `max_chars`）表现为 502；`/remember` 在写入前会再次检查长度。

### 梳理配置 {#processing-configuration}

```toml
[processor]
enabled = true
endpoint = "http://127.0.0.1:8125/v1/chat/completions"
model = "qwen3:8b"
api_key = ""
timeout_secs = 120
max_chars = 8000
agent_endpoint = ""

[processor.agent]
enabled = false
kind = "opencode"
bin = ""
model = ""
agent = ""
timeout_secs = 240
workdir = ""
pure = true
max_turns = 0
allowed_tools = ""
disallowed_tools = ""
extra_args = []
token = ""
token_env = ""
```

prompt 可以按任务覆盖，并支持 `{content}` 与 `{lang}`：

```toml
[processor.prompts]
summarize = '''Summarize the content into an entry with 【前因】【行为】【后果】: {content}'''
```

### agent 安全 {#agent-safety}

- agent 以子进程加参数数组运行，从不拼接 shell 字符串，Windows 下不弹控制台窗口。
- 默认工作目录是 `{temp}/memtools-agent`，避免 agent 把 memTools 仓库及其 `AGENTS.md` 当作项目。
- opencode 默认带 `--pure`，还可以用 `--agent` 进一步限制。
- Qoder 可用 `max_turns`、`allowed_tools` 与 `disallowed_tools` 收紧。
- 超时会杀进程并返回 504；未安装或未启用返回 503；agent 报错返回 502。
- 即使有这些限制，agent 仍可能执行工具。不要把敏感内容交给层次二。

## 提醒 {#reminders}

提醒是界面侧的扫描，不是 rsrs CLI 的后台服务。

### 提醒前提 {#reminder-requirements}

条目必须是非日记，且正文包含可核实的 `【触发】` 行：

```text
【触发】2026-10-31
```

只认已确认的 `YYYY-MM-DD`。含 `无日期条件`、`待定`、`待确认`、`看情况` 或 `再议` 的条目跳过，日记与已带 `【完成】` 或 `【已完成】` 的条目也跳过。

### 提醒扫描 {#reminder-scanning}

1. 打开顶栏 → `提醒`。角标统计已逾期与今天到期的数量。
2. 分组为已逾期、今天到期、`reminder.soon_days` 内即将到期与之后。
3. 每行显示触发日期、标题与剩余或逾期天数；点击可展开。

扫描窗口从 200 条起，按需翻倍到 1600 条，到上限时提示 `可能不全`。

### 忽略与完成 {#reminder-ignore-and-complete}

| 操作 | 行为 |
| --- | --- |
| 忽略 | 把该 id 的当前触发日期记入 `{app_config_dir}/reminders/reminders.json`；日期变化后会重新出现 |
| 完成 | 先备份正文，再用 `memory_update` 追加 `【完成】YYYY-MM-DD` 并回读；扫描器随后跳过该条 |

移除 `【完成】` 行即可恢复提醒。

### 提醒后台扫描 {#reminder-background}

- 启动 8 秒后首扫，之后每 `reminder.interval_minutes`（默认 30 分钟）一次。
- 更新托盘 tooltip，并向小窗广播 `reminders://due`。
- 扫描只读 rsrs 数据；忽略状态写入 memTools 自己的配置目录。
- 不弹窗也不响铃，只有托盘 tooltip 和角标提示。

## 记忆图谱 {#memory-graph}

图谱把整个库渲染成可交互的 3D 点云，并且严格只读。

### 图谱数据源 {#graph-data-source}

- 只读打开 rsrs 数据目录中的 `onememory.db`，兼容 WAL。
- 读取 `memories`、`core_artifacts`、`recall_pairs`、`entry_audit` 与 `query_log`。
- 从 `core-index` 解压 m3 1024 维向量，用确定性 PCA 投影到 3D。
- 缓存位于 `{app_config_dir}/graph/`：`basis.json` 冻结布局，`vectors.f32` 增量保存向量，新记忆不会重排布局。
- 数据目录优先取 runtime `status.summary.data_dir`；没有 runtime 时依次回退到 `RSRS_DATA_DIR`、`~/.rsrs`、`~/.rsrs/accounts/*` 下最近修改的库。

### 图谱视觉编码 {#graph-visual-encoding}

| 视觉 | 含义 |
| --- | --- |
| 色相 | 树根，按黄金角分布，分支略有差异 |
| 大小 | 召回热度 |
| 透明度与辉光 | 重要度 |
| 形状 | `kind` |
| 实线 | 父子关系 |
| 另一种线 | 召回共现 |

### 图谱交互 {#graph-interaction}

| 操作 | 效果 |
| --- | --- |
| 拖拽 | 旋转 |
| 滚轮 | 缩放 |
| 悬停 | 50 毫秒后聚焦，并用多源 BFS 点亮邻居 |
| 点击 | 锁定焦点；点击空白释放 |
| 工具栏 | 适配、自转、重排 PCA 布局、重载快照 |
| 打开图谱 | 放大窗口；离开时还原 |
| 节点详情 | 标题、分类、重要度、召回数与正文预览；可复制 id 或跳转搜索 |

显示菜单提供非聚焦时半透明、1 到 6 层点亮（默认 3）与 1 到 500 个节点（默认 20）。整层放不下时少显示一层，避免单个枢纽点亮整棵树。

内置约 15 万点的 `brain2.container.ply`，经体素化得到真实容器体积。节点等比映射后向中心收缩直到被包含。容器开关可恢复原始 PCA 坐标。

### 图谱实时更新 {#graph-live-updates}

- 每 900 毫秒轮询 `entry_audit`（create、update、delete、restore、purge）、`query_log`（recall）与 `memories.updated_at`。
- 不需要 Node bridge，也不需要 `plugins.json` hook。
- memTools、opencode、MCP、CLI 与云端同步的写入都能看到。
- 召回候选会点亮 6 秒。

### 图谱边界 {#graph-boundaries}

- 大库首次构建较慢；有缓存后启动明显加快。
- 图谱只读。改、并、删请回到小窗或 CLI。
- 依赖 rsrs 向量工件；缺少 `core-index` 时只能按元数据布局，语义表达会变弱。
- 没有 runtime 且找不到数据目录时显示空状态。

## 浏览器扩展 {#browser-extension}

### 安装扩展 {#extension-install}

1. 启动 memTools，确认托盘图标存在。
2. 点击底栏 `扩展` 查看端口与令牌，复制令牌。
3. 在 Chrome 或 Edge 打开 `chrome://extensions`。
4. 开启开发者模式。
5. 选择 `加载已解压的扩展程序`，选中 memTools 仓库的 `extension` 目录。
6. 打开扩展选项，填写端口与令牌，保存并测试连接。

> 点击工具栏图标会打开选项页，没有弹窗界面。

### 日常使用 {#extension-daily-use}

1. 在网页上选中文字。
2. 右键选择 `保存到 memTools`。
3. 选一个快捷目标，或 `梳理后保存（AI 总结）`。
4. 查看系统通知：
   - 成功时显示保存位置、标题与 id 前 8 位；
   - 疑似重复时提示已下挂，并要求回小窗核对；
   - 梳理失败返回 502 或 503，且不保存原文；
   - 其它失败显示 HTTP 状态或原因。

正文会追加来源行 `来源：《page title》URL`。URL 截到 2000 字，没有 URL 时不追加。

### 扩展端点 {#extension-endpoint}

| 项 | 说明 |
| --- | --- |
| 监听地址 | 仅 `127.0.0.1`，默认端口 `17650` |
| 鉴权 | `X-MemTools-Token` 或 `Authorization: Bearer <token>` |
| 路由 | `GET /health`、`GET /targets`、`PUT /targets`、`POST /open`、`POST /remember`、`POST /process`、`GET /agent`、`GET /`、`OPTIONS` 返回 204 |
| 请求体 | 最大 256 KB |
| 正文长度 | 最大 8000 字 |
| mode | `journal` 或 `auto`，默认 `auto`；有 `target_id` 时优先 |
| 超时 | 扩展侧 45 秒，`process` 为 120 秒 |
| 错误 | 401 未授权，400 JSON 无效、内容为空或 mode 未知，413 请求体过大，502 写入失败，503 梳理未启用，504 agent 超时 |

```json
{
  "text": "selected text to save",
  "target_id": "t1",
  "process": "summarize",
  "url": "https://example.com/page",
  "page_title": "page title",
  "title": "optional custom title"
}
```

`GET /targets` 返回目标列表与分类树。`PUT /targets` 用 `{"targets":[...]}` 整体替换。分类树读取缓存 300 秒，拉取超时 1.5 秒，后台预热 120 秒；runtime 不可用时 `/targets` 仍快速返回，`taxonomy` 为空数组。

自动模式从不在扩展侧执行改或并。高相似命中会退化为下挂，并设置 `needs_confirm`。既无相似条目又无法判树时请求失败，并要求用户回小窗选择树。

### 扩展令牌与端口 {#extension-token-and-port}

令牌优先级：

1. `config.toml` 中的固定 `[extension] token`；
2. 已存在的 `%APPDATA%\com.memtools.desktop\extension_token.txt`；
3. 都没有时，首次启动生成 32 位十六进制令牌并写入该文件。

轮换令牌：退出 memTools，删除文件或设置新的固定令牌，重新启动，再到扩展选项更新并测试。用 `[extension] enabled = false` 加重启可停用端点。

### 扩展安全 {#extension-security}

- 端点只绑定 loopback。除 `OPTIONS` 预检外，包括 `/health` 在内的所有路由都要求令牌。
- CORS 放开是为了让扩展页面调用，但写入仍需要令牌。
- 令牌泄露等于本机写入权限。不要提交到仓库、贴到聊天或截进图里。
- `extension.pem` 是 CRX 签名私钥，`extension.crx` 是打包产物，都不要公开分发。

## 最近记忆与搜索 {#recent-and-search}

### 最近记忆 {#recent-memories}

1. 打开顶栏 → `最近记忆`。
2. 设置 1 到 200 条，默认 20。
3. 刷新；条目按 `updated_at` 倒序。
4. 点分类 chip 过滤，点 `全部` 清除。
5. 点条目展开。

每行显示标题、更新时间、`kind` 与 `importance`。由于 `memory_list` 不能按分类过滤，程序先收集子树 id，再在最近窗口内筛选。窗口从 `max(200, count × 10)` 起，按倍数增长到 2000，到上限时提示 `可能不全`。返回条数少于窗口说明已到库尾，不再扩窗。

### 搜索模式 {#search-modes}

搜索视图用同一个输入框兼容两种模式。

语义搜索：

1. 输入自然语言，如 `托盘 关闭`。
2. 设置 1 到 100 条，默认 20。
3. 搜索。结果显示相似度百分比；带 `superseded_by` 的条目显示 `已被 xx 取代 · 点击查看新条`。

id 搜索：

1. 输入 8 位前缀或完整 UUID，如 `bd22ad3a`。
2. 搜索。精确显示该条、祖先路径，并可在悬停时预览正文。
3. id 需为 8 到 36 个字符，只含十六进制字符或连字符，且至少有 8 个十六进制字符。

不像 id 的输入会回退到语义搜索，而不是报格式错误。空查询、未找到 id 与 runtime 失败都有各自的提示。

## 更新与同步 {#update-and-sync}

### 自动更新 {#updates}

1. 客户端从 `[update] endpoint` 获取 `update.json`，字段为 `version`、`notes`、`url`、`sha256`、`size` 与 `mandatory`。
2. 比较 `v1.0.0` 与 `1.0.0-beta` 之类的数字版本。
3. 下载新 exe，并发送 `update://progress` 事件。
4. 校验 SHA-256。
5. 新 exe 以 `--apply-update <target>` 启动，最多等待 60 秒让旧进程退出，然后替换文件并重启。

| 配置 | 默认 | 含义 |
| --- | --- | --- |
| `update.enabled` | `true` | 启用更新检查 |
| `update.endpoint` | `http://127.0.0.1:17651/update.json` | 清单地址 |
| `update.check_on_start` | `true` | 启动时静默检查一次 |

本机发布：

```powershell
npm run update:publish -- "release notes"
npm run update:serve
```

更新针对独立 exe，目录必须可写，因此 `Program Files` 需要管理员权限。清单未签名；公网分发前要改用 HTTPS 并增加签名校验。目标文件被占用超过 60 秒时更新器放弃，并写入 `%APPDATA%\com.memtools.desktop\update\apply.log`。

也可以手动替换：先从托盘退出，避免文件被占用。

### 同步徽标 {#sync-badge}

底栏解析 rsrs 的 `status.summary`：`offline`、`autosync`、`sync_live.pending`、`conflicts` 与 `sync_scheduler.last_success_unix`。

| 状态 | 徽标 |
| --- | --- |
| 离线 | 琥珀色 `离线 · N 待同步` |
| 在线有积压 | `N 待同步` |
| 有冲突 | 一并显示冲突数 |
| 正常 | 隐藏 |

提示文案为 `离线不丢：本地已落库，rsrs 下次 sync 自动补传`。每 60 秒以及窗口唤起时刷新。

## 配置 {#configuration}

### 配置文件 {#config-file}

配置文件是 `<repo>/src-tauri/config.toml`，修改后重启生效。唯一例外是界面写入的 `processor.json`，它立即生效。

> memTools 按构建时记录的项目路径读取 `src-tauri/config.toml`。把 exe 单独拷到没有源码目录的机器上会回退到内置默认值。需要改配置时，请在构建机上修改后重启，或重新构建。

`tauri.conf.json` 的初始窗口尺寸会被 `config.toml` 的 `[window] width` 与 `height` 覆盖。

### 配置参考 {#settings-reference}

**窗口、热键与 runtime**

| 配置 | 默认 | 含义 |
| --- | --- | --- |
| `hotkey.register` | `Ctrl+Alt+R` | Tauri 语法的全局热键 |
| `window.width` | `480` | 窗口宽度（像素） |
| `window.height` | `560` | 窗口高度（像素） |
| `window.always_on_top` | `true` | 窗口置顶 |
| `window.decorations` | `false` | 无边框，由前端绘制 |
| `window.transparent` | `true` | 透明毛玻璃背景 |
| `window.remember_position` | `true` | 恢复上次位置 |
| `window.submit_close` | `true` | 提交成功约 1.2 秒后隐藏 |
| `rsrs.base_url` | `http://127.0.0.1:15169` | Runtime 地址 |
| `rsrs.mcp_path` | `mcp` | MCP over HTTP 路径，实际请求 `POST {base_url}/{mcp_path}` |
| `rsrs.timeout_secs` | `5` | status 与 taxonomy 的快速探测超时 |
| `rsrs.op_timeout_secs` | `30` | remember、recall、update、attach、show 与 tree 的慢操作超时 |
| `rsrs.tools.*` | `memory_*` | MCP 工具名映射 |

**自动化**

| 配置 | 默认 | 含义 |
| --- | --- | --- |
| `automation.enabled` | `false` | 自动化开关的初始状态 |
| `automation.mode` | `local-fallback` | `local-fallback`、`high-quality` 或 `memory-gateway` |
| `automation.recall_rounds` | `2` | 判重轮数 |
| `automation.recall_limit` | `3` | 每轮候选上限 |
| `automation.dup_threshold` | `0.85` | 达到即视为疑似重复，需要确认 |
| `automation.attach_threshold` | `0.70` | 达到即自动下挂 |
| `automation.llm.enabled` | `false` | 是否调用模型判档，`local-fallback` 时忽略 |
| `automation.llm.endpoint` | `http://127.0.0.1:8125/v1/chat/completions` | OpenAI 兼容端点 |
| `automation.llm.model` | `qwen3:8b` | 模型名 |
| `automation.llm.api_key` | 空 | 留空不发送 `Authorization` 头 |
| `automation.llm.timeout_secs` | `60` | 模型调用超时 |

**提醒、扩展与更新**

| 配置 | 默认 | 含义 |
| --- | --- | --- |
| `reminder.enabled` | `true` | 启用到期扫描 |
| `reminder.interval_minutes` | `30` | 后台扫描间隔 |
| `reminder.soon_days` | `7` | 多少天内算即将到期 |
| `extension.enabled` | `true` | 启动扩展端点 |
| `extension.port` | `17650` | 只绑定 `127.0.0.1` |
| `extension.token` | 空 | 留空则生成 `extension_token.txt` |
| `update.enabled` | `true` | 启用更新检查 |
| `update.endpoint` | `http://127.0.0.1:17651/update.json` | 清单地址 |
| `update.check_on_start` | `true` | 启动时检查一次 |

**划词悬浮**

| 配置 | 默认 | 含义 |
| --- | --- | --- |
| `selection.enabled` | `true` | 启动时启用划词 |
| `selection.min_chars` | `2` | 少于该字数不弹图标 |
| `selection.max_chars` | `4000` | 超过该字数则忽略 |
| `selection.drag_threshold_px` | `8` | 拖选判定的物理像素 |
| `selection.capture_timeout_ms` | `600` | 模拟 `Ctrl+C` 后等待剪贴板的时间 |
| `selection.double_click` | `true` | 双击也显示图标 |
| `selection.offset_px` | `14` | 图标相对光标的偏移 |

**内容梳理**

| 配置 | 默认 | 含义 |
| --- | --- | --- |
| `processor.enabled` | `true` | 启用梳理；关闭时 `/process` 返回 503 |
| `processor.endpoint` | `http://127.0.0.1:8125/v1/chat/completions` | 梳理端点，独立于自动化 |
| `processor.model` | `qwen3:8b` | 模型名 |
| `processor.api_key` | 空 | 留空不发送 `Authorization` 头 |
| `processor.timeout_secs` | `120` | 模型调用超时 |
| `processor.max_chars` | `8000` | 模型输入上限 |
| `processor.prompts.*` | 内置 | 按任务覆盖 prompt，支持 `{content}` 与 `{lang}` |
| `processor.agent_endpoint` | 空 | 非空时通过 `--attach` 启用层次二 |
| `processor.agent.enabled` | `false` | 为 true 时启用 agent 层次 |
| `processor.agent.kind` | `opencode` | `opencode` 或 `qoder` |
| `processor.agent.bin` | 空 | 可执行文件路径，留空自动探测 |
| `processor.agent.model` | 空 | opencode 用 `provider/model`；Qoder 用 `auto`、`efficient` 等 |
| `processor.agent.agent` | 空 | opencode `--agent` |
| `processor.agent.timeout_secs` | `240` | agent 超时；超时返回 504 |
| `processor.agent.workdir` | 空 | 留空使用 `{temp}/memtools-agent` |
| `processor.agent.pure` | `true` | opencode `--pure`，跳过外部插件 |
| `processor.agent.max_turns` | `0` | Qoder `--max-turns`，为 0 时不传 |
| `processor.agent.allowed_tools` / `disallowed_tools` | 空 | Qoder 工具白名单与黑名单 |
| `processor.agent.token` / `token_env` | 空 | 令牌及环境变量名，Qoder 默认 `QODER_PERSONAL_ACCESS_TOKEN` |
| `processor.agent.extra_args` | `[]` | 原样追加的参数 |

修改热键：

```toml
[hotkey]
register = "Ctrl+Shift+M"
```

保存后重启。若热键被占用，注册失败会写入日志，托盘仍可打开小窗。

### 运行时数据文件 {#runtime-files}

| 文件 | 内容 | 写入方 |
| --- | --- | --- |
| `%APPDATA%\com.memtools.desktop\targets.json` | 快捷目标 | 小窗与扩展选项 |
| `%APPDATA%\com.memtools.desktop\processor.json` | 梳理来源 | 小窗梳理 → 来源 |
| `%APPDATA%\com.memtools.desktop\reminders\reminders.json` | 忽略的提醒 | 提醒视图 |
| `%APPDATA%\com.memtools.desktop\graph\` | `basis.json` 与 `vectors.f32` | 图谱视图 |
| `%APPDATA%\com.memtools.desktop\backups\` | 改或并之前的备份 | 自动化与快捷目标 |
| `%APPDATA%\com.memtools.desktop\update\` | 下载包与 `apply.log` | 更新器 |

## 数据与安全 {#data-and-security}

### 本机路径 {#local-paths}

Windows 下 `app_config_dir` 为 `%APPDATA%\com.memtools.desktop\`。

| 路径 | 用途 | 敏感性 |
| --- | --- | --- |
| `extension_token.txt` | 扩展令牌 | 敏感，禁止提交或分享 |
| `window_state.json` | 上次窗口位置 | 否 |
| `backups\memtools-backup-*.json` | 改或并前的备份 | 含记忆正文，按内部资料处理 |
| `targets.json` | 快捷目标 | 含挂点名，按内部资料处理 |
| `processor.json` | 梳理来源 | 不含密钥 |
| `reminders\reminders.json` | 忽略的提醒 | 否 |
| `graph\` | 布局与向量缓存 | 含向量，按内部资料处理 |
| `update\` | 更新包与 `apply.log` | 否 |
| `<repo>/src-tauri/config.toml` | 运行配置 | 填了固定令牌或 API key 时敏感 |
| `<repo>/extension.pem` | CRX 签名私钥 | 敏感，禁止分发 |
| `<repo>/extension.crx` | 打包扩展 | 不要公开分发 |

记忆正文存放在 rsrs 的 `data_dir`（`onememory.db` 等），由 rsrs 管理。memTools 不复制整个库，图谱也只读打开。

### 网络与鉴权 {#network-and-authentication}

| 项 | 说明 |
| --- | --- |
| rsrs 连接 | 仅 loopback `http://127.0.0.1:15169/mcp` |
| 扩展端点 | 仅 loopback，默认 `127.0.0.1:17650` |
| 扩展鉴权 | `X-MemTools-Token` 或 `Authorization: Bearer` |
| 模型与 agent | 梳理和模型判档会把内容发到配置的端点或本机 agent，端点可能在局域网或公网 |
| 更新 | 默认本机；公网主机请用 HTTPS |
| 远程访问 | 不支持；不要把端口映射到公网 |
| 服务生命周期 | memTools 不启动、停止、复制或升级 rsrs |

### 备份与回滚 {#backup-and-rollback}

- 改之前把原条 JSON 备份到 `backups/memtools-backup-<8-char id>-<timestamp>.json`。
- 并之前备份每条候选的 `id`、`title`、`children` 与 `content`。
- 提醒的完成操作先备份正文，再追加 `【完成】` 并回读。
- 回滚时用 `rsrs update` 从备份恢复正文，或重新 `remember` 并修正挂点。合并后要重新挂接孤儿子条。

> 本地库没有版本历史，改与并不可逆。操作前必须备份。

### 敏感数据 {#sensitive-data}

- 不要把 `extension_token.txt`、`extension.pem` 以及含令牌或 API key 的 `config.toml` 提交到仓库。
- 截图前遮住令牌、URL 参数与账号信息。
- 在文档、issue 或聊天中引用记忆内容前，先检查是否含个人或内部信息。
- 使用层次二前确认内容可以交给本机 agent；使用模型前确认端点可信。

## 故障排查 {#troubleshooting}

| 现象 | 可能原因 | 处理 |
| --- | --- | --- |
| 启动后没有窗口 | 小窗初始隐藏 | 按 `Ctrl+Alt+R` 或点托盘图标 |
| 热键无反应 | 被其它程序占用，或注册失败 | 修改 `hotkey.register` 后重启，或走托盘 |
| 没有托盘图标 | 托盘创建失败或被系统隐藏 | 查看日志中的 `建立系统托盘失败`，并检查溢出区 |
| 关闭后进程仍在 | 关闭只是隐藏到托盘 | 托盘 → `退出 memTools` |
| `runtime 不可达` | Runtime 未启动、端口不对或被防火墙拦截 | 由宿主启动 runtime，检查 `rsrs.base_url` 与 15169 端口 |
| `鉴权失败` | 非 loopback 访问或令牌不匹配 | 检查 rsrs 令牌配置；loopback 默认不需要 |
| 出现候选列表 | rsrs 找到相似条目且未写入 | 选中候选后改、并、挂，或选择树存新条 |
| 主区提交被拒 | 未选择树 | 选择一棵树或切换到日记 |
| task 要求 `【触发】` | type 为 `task` 但未填触发 | 填写 `YYYY-MM-DD` 或可核实前提 |
| 内容被拒 | 超过 8000 字 | 拆成多条 |
| 小窗空白 | `cargo build --release` 开发版或 WebView2 异常 | 改用 `npm run tauri build -- --no-bundle`，并修复 WebView2 |
| 日志出现 hook 超时 | rsrs 插件 hook 较慢 | 非致命；等待写入，慢操作超时为 30 秒 |
| 扩展返回 401 | 令牌错误或缺失 | 从扩展面板复制令牌后重测 |
| 扩展连不上 | memTools 未运行、端口不同或端点被禁用 | 启动 memTools，对齐 `[extension] port` 与 `enabled` |
| 扩展菜单缺失 | 扩展未重新加载 | 在扩展页重新加载 |
| 扩展目标不更新 | 菜单每 10 分钟刷新一次 | 保存目标后等待，或重新加载扩展 |
| 扩展要求核对 | 近似重复已自动下挂 | 在小窗搜索该条，再决定是否改或并 |
| 扩展找不到分类 | 内容太短或无线索 | 回小窗手动保存，或补充更明确的内容 |
| 扩展端点启动失败 | 端口 17650 被占用 | 修改 `[extension] port` 与扩展选项，或释放端口 |
| 划词不弹图标 | 划词关闭、选区太短，或应用使用 `Ctrl+Shift+C` | 从托盘开启，选中至少两个字，换普通编辑器验证 |
| 图标位置不对 | 多显示器或缩放边界情况 | 图标会 clamp 到工作区；调整 `selection.offset_px` |
| 划词取词失败 | 目标应用不支持 `Ctrl+C` | 使用 `在 memTools 中选择…` 手动粘贴 |
| 剪贴板变了 | 原剪贴板是图片或文件 | 已知边界；先保存重要剪贴板内容 |
| 快捷目标保存失败 | 超过 8 个、`id` 重复或缺少 parent | 删除多余项、修改 id 或补 `parent` |
| 两处目标列表不一致 | 扩展缓存未刷新 | 以 memTools 为准，等待 10 分钟或重新加载扩展 |
| 梳理提示未启用 | 来源为关闭或端点为空 | 在来源中选择模型、opencode 或 Qoder |
| 梳理返回 503 | 端点未配置或 agent 未启用 | 检查 `[processor] endpoint` 或选择 agent 来源 |
| 梳理返回 502 | 模型未启动、名称错误或 agent 未登录 | 启动模型、检查 `model`、运行 `qodercli /login` |
| 梳理返回 504 | agent 冷启动超时 | 增大 `processor.agent.timeout_secs` |
| 梳理卡住 | 模型较慢或 agent 正在跑工具 | 等到超时，或切换到模型来源 |
| 提醒里没有条目 | 不是 task、没有触发、没有日期、是日记或已完成 | 补 `【触发】YYYY-MM-DD`，检查 `importance` |
| 提醒提示 `可能不全` | 扫描到达 1600 条上限 | 缩小范围或使用搜索 |
| 提醒完成失败 | Runtime 不可达，或备份、更新失败 | 检查 runtime 后重试 |
| 忽略后提醒又出现 | 该条的触发日期变了 | 重新忽略 |
| 图谱空白 | 缺少 `onememory.db` 或数据目录未知 | 设置 `RSRS_DATA_DIR` 或启动 runtime |
| 图谱很卡 | 节点太多或层级、上限过高 | 调低点亮层级与节点上限 |
| 更新检查失败 | `update.json` 不可达或格式错误 | 检查 `[update] endpoint`，用 `npm run update:serve` 验证 |
| 更新无法替换文件 | exe 被占用、目录只读或超过 60 秒 | 关闭其它实例，换可写目录，重试并查看 `apply.log` |
| 底栏一直显示待同步 | rsrs 离线或有积压 | 条目已本地落库，等待下次同步 |
| `config.toml` 修改不生效 | 配置在启动时读取，便携 exe 可能找不到文件 | 重启，并检查 exe 与源码目录的关系 |
| 最近记忆分类结果偏少 | 过滤依赖采样窗口 | 调大数量，或用 `全部`、搜索 |
| id 搜索无结果 | 不是 8 到 36 位十六进制字符，或前缀不唯一 | 使用完整 UUID 或更长前缀 |

## 验收清单 {#acceptance-checklist}

- [ ] `Ctrl+Alt+R` 能显示和隐藏小窗，焦点在输入框。
- [ ] 主区条目出现在所选树根下，最近记忆能看到并显示路径。
- [ ] 日记条目显示 `并入当日轨迹`，且不在树中。
- [ ] 模板只填 `【行为】` 也能提交，`【行为】` 为空被拒。
- [ ] task 缺少触发时被要求补充，且没有猜日期。
- [ ] 自动化能一步保存日记，也能为重要条目自动下挂或新建。
- [ ] 候选列表在任何选择之前都不会报成功。
- [ ] 改与并会生成备份，回读一致。
- [ ] 快捷目标可增删改排序，最多 8 个，顺序与划词面板、扩展一致。
- [ ] 选中至少两个字出现 `记`；目标能保存；预填可用。
- [ ] 梳理能切换来源，六个任务都能返回，失败不覆盖输入。
- [ ] 扩展梳理通知带 `（AI 梳理）`，失败不保存原文。
- [ ] 提醒分组正确，忽略与完成都生效。
- [ ] 图谱能加载、悬停聚焦、切换容器、调整层级与节点，并实时更新。
- [ ] 最近记忆的数量、筛选与展开正常。
- [ ] 搜索支持语义与 8 位 id 前缀，并标记 `superseded_by`。
- [ ] 托盘左键切换正常，右键菜单可显示、退出与开关划词。
- [ ] 再次启动不会产生第二个进程。
- [ ] 扩展连接测试通过，目标保存成功；错误令牌返回 401。
- [ ] 停用扩展端点只影响扩展，不影响小窗。
- [ ] 更新能检查、显示进度、校验并重启，`apply.log` 有记录。
- [ ] 同步徽标在离线时显示待同步，恢复后消失。

## 限制与红线 {#limits-and-red-lines}

### 红线 {#red-lines}

1. 不得启动、停止、复制或升级 rsrs 服务。
2. 不得使用 `--direct`。
3. 不得拼接 shell 字符串调用 rsrs 或 agent。
4. 不得把判重候选当作成功；必须择一执行或明确失败。
5. 不得裸存或在不检查的情况下使用 `--force`；同题条目必须下挂或合并。
6. 合并前必须检查子条并备份。
7. 长文更新前必须备份。
8. 不得猜测绝对日期。
9. 不得把 agent 层次当作纯文本函数；它可能执行工具。

### 已知限制 {#known-limits}

- 配置依赖构建时记录的源码路径，便携 exe 可能回退到默认值。
- 在 `local-fallback` 下，判档与判树是本地关键词规则，不是语义模型。
- 模型判档失败会回退本地规则，回退结果仍受规则限制。
- 快捷目标最多 8 个，展示名最多 24 字。
- 扩展端点只支持 loopback，不支持远程设备。
- 扩展未上架浏览器商店，需要开发者模式加载。
- 划词模拟 `Ctrl+C`，终端等自定义复制的应用可能取不到词。
- 提醒是界面扫描而不是系统服务，最多扫描 1600 条。
- 本地库没有版本历史，改与并不可逆。
- 图谱不能编辑或删除记忆。
- 更新清单未签名，公网分发需要 HTTPS 与签名校验。
- agent 层次在未安装或未登录时会明确报错，且不会回退到模型。

## 快速参考 {#quick-reference}

### 命令 {#commands}

| 目的 | 命令 |
| --- | --- |
| 检查 runtime | `rsrs --client-only status` |
| 查看分类树 | `rsrs --client-only taxonomy --list --json` |
| 查看记忆 | `rsrs --client-only show <id> --json` |
| 单元测试 | `cd <repo>/src-tauri && cargo test --lib` |
| 开发模式 | `npm run tauri dev` |
| 正式构建 | `npm run tauri build -- --no-bundle` |
| 只读最近记忆 | `cargo run --example recent -- 全部 5` |
| 只读搜索 | `cargo run --example search -- "关键词" 5` |
| 提醒扫描 | `cargo run --example reminders_probe -- 12` |
| 图谱快照 | `cargo run --example graph_probe` |
| 梳理干跑 | `cargo run --example process_probe -- --mock` |
| agent 探测 | `cargo run --example agent_probe -- --kind opencode --probe` |
| 扩展冒烟测试 | `cargo run --example extension_server` |
| 发布更新包 | `npm run update:publish -- "release notes"` |
| 本机更新服务 | `npm run update:serve` |

单元测试覆盖标题生成、补标、最近记忆过滤、id 识别、扩展令牌与来源行、版本比较与清单、提醒日期与忽略状态、模型输出过滤、梳理任务与错误码、agent 参数与输出解析、梳理来源叠加以及快捷目标存储。本文示例使用占位 id，请替换成自己的 id。

### 术语 {#glossary}

| 术语 | 含义 |
| --- | --- |
| rsrs 与 Respire | 本地优先的 AI 记忆系统，提供 CLI 与本地 runtime |
| Runtime | 常驻本机服务，默认 `127.0.0.1:15169` |
| 主区 | `importance = important` 且需要挂树的条目 |
| 日记 | `importance = trivial` 且不挂树的条目 |
| 树根 | 内置分类节点，通常 23 个，分为人域与 AI 域 |
| 判档 | 判断写入主区还是日记 |
| 判重 | 用语义召回寻找相似条目 |
| 判树 | 用关键词重叠或模型输出选择挂点 |
| 候选列表 | 未写入的相似条目，需要用户择一 |
| 三段标记 | `【前因】【行为】【后果】` |
| `needs_confirm` | 破坏性分支等待用户确认 |
| 快捷目标 | 类型为 `journal`、`tree` 或 `auto` 的有序保存位置 |
| 划词悬浮 | 选中文字后出现的全局 `记` 图标与保存面板 |
| 层次一与层次二 | 通过模型端点与通过 headless agent 的梳理路径 |
| 来源 | 梳理使用的模型或 agent |
| 容器 | 图谱使用的大脑点云体积 |
