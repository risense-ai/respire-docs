# Runtime RPC 完整功能参考 {#runtime-rpc-command-reference}

本页覆盖已发布 **1.0.17-dev.14** 的全部 **82 个顶层命令、32 个子命令**及 **18 个 MCP 工具**。传输协议和可运行客户端见 [Runtime RPC](runtime-rpc.md)。

参数、默认值、可选值和别名取自发行版逐项 help 输出；已核对二进制 SHA-256 与该发行版的构建清单。原始帮助保留英文，仅移除行末空白，以便与安装的程序对照；每个功能的用途、调用边界和注意事项提供中文说明。`<VALUE>` 是必须替换的占位值，模板不是可批量执行的脚本。

以下是已核对版本的完整目录，不表示所有命令在旧稳定版中都已存在。DEV 新增的日记片段、快照、反馈、见证及宿主管理能力，需要先核对运行中 `bin`，不能仅检查 `v: 1`。

## 调用边界 {#calling-boundaries}

| 标记 | 含义 |
| --- | --- |
| `RPC` | 以 `cli.exec` 发送参数数组；仍受账户、服务模式、输入校验及操作授权约束。 |
| `ADMIN` | 包含配置、账户、凭据、外部文件或插件操作。只读子集可用于集成；修改前审阅具体动作。 |
| `HOST` | 第三方客户端应交给宿主处理。明确拒绝 RPC 的分支会另行标注；此标记本身不是服务端 ACL。 |

RPC 参数数组省略程序名，由 `--json`、命令、子命令、参数组成。所有路径都在 **runtime 宿主**解析：import、export、backup、snapshot、retitle-many、share-import、extract 和注入配置都不会自动上传或下载客户端文件。不要发送 stdin、TTY、shell 管道或交互选择器。没有专用取消接口的命令不能用关闭 HTTP 连接来取消。

读取下面的用途和边界，再展开原始帮助查看全部参数。`--yes`、`--go`、`--confirm` 和 `--force` 有不同含义，不能为了得到成功响应而自动补齐。HTTP 200、exit 0 或缺少错误文本均不能替代业务状态检查。

<details>
<summary>全局参数与命令索引（发行版原始帮助）</summary>

```text
跨设备跨软件统一 AI 记忆系统（local-first）

Usage: rsrs [OPTIONS] [COMMAND]

Commands:
  runtime            Host-owned foreground runtime and opt-in current-user sign-in startup
  restart            Restart the resident runtime; kill the verified process if graceful shutdown times out
  prompt             Read the full memory workflow before storing or maintaining memories
  v                  Print the embedded CLI version (same as `--version` / `-v`) [alias: version]
  grant              Manage independent read-only subtree grants for local tools
  session            List or revoke independent cloud login sessions; does not change local decrypt keys
  keygen             Generate local key material (offline; writes local session/keyfile - no server, no auth)
  remember           Store a memory (local authority store; encrypts + embeds automatically). Judge-then-store (dedup first, then choose): without --force, an internal recall runs first - high similarity -> suggest merge (`--merge-ids "id1,id2"` deletes old, writes a combined entry); medium -> suggest attach (`--parent` as cause); no candidate or --force writes directly. `--parent` = causal attach; parent/child is cause/effect
  import             Import a JSON-array dump: keep fields, rebuild parent links, sync once after the batch
  recall             Semantic recall through the private Core
  query-log          Query log: each recall's candidates + adoption + model self-grade (local DPO/SFT raw material)
  bench              Retrieval quality benchmark: run an evalset for hit-rate/MRR, optional baseline compare; mine drafts an evalset from query-log
  run-log            Record a procedure run verdict (ok|fail|confounded|no_effect) for a skill/knowledge entry; local-only, feeds how-to ordering and audit
  classify           Batch classify via JEV (TypeSafe): ask which top-level category each entry belongs to, compare with the current parent (read-only)
  list               List recent entries
  forget             Delete (tombstone; propagates with sync)
  purge              Clear current-version ciphertext; pending operations and unresolved conflicts are kept
  restore            Restore a deleted memory by full ID (keeps body and parent; propagates with sync)
  promote            Causal tree: promote - this entry becomes a more-upstream cause (reattach to grandparent/root; effects follow)
  demote             Causal tree: demote - attach this entry under --parent as its effect (extends the chain by one; cycle-safe)
  show               Show one entry in full (cause/effect complete, not truncated)
  chain              Causal-chain deep dive: fetch the whole chain at once - ancestor bodies (root first) + this entry + descendants to --depth. After an AI sees a cause-chain name, it can dig without layer-by-layer show
  attach             Attach a child under a parent (explicit attach is intent; no judge-then-store; auto-syncs)
  tree               Causal tree: render a subtree (--from start, default root forest); --outline prints a full-depth id+title directory (AI tidy reads this first)
  resort             Memory tidy: batch reparent (spec={"ops":[{"id":"child","parent":"parent"}]}; id / first 8 chars / root title all work); dry-run by default, --go writes, auto-syncs, and resets the counter
  agent-config       AI behavior config (agent.json): no args = print the whole file (AI reads it to decide); --set key=value writes a key
  retitle            Retitle: decrypt -> change title -> reseal (ciphertext payload updates) -> dirty -> auto-sync
  retitle-many       Batch retitle (JSON array [{"id":...,"title":...}]; one process, one model load)
  sync               Two-way sync: pull cloud delta -> land locally -> push local changes (LWW)
  sync-conflicts     Show conflicts that still need a decision; --all includes resolved and old-generation history
  sync-resolve       Resolve one retained revision; mark it resolved only after the remote confirms
  sync-history       Show retained sync revisions; --remote reads server history without local caching
  sync-restore       Restore a kept revision as a new local edit
  sync-reset         Rebuild after a server backup restore; keep current recovery snapshots and pending edits
  status             Status
  memory-revision    Read the initialized library's opaque snapshot token without loading a model
  capabilities       Report supported CLI capabilities without a profile, runtime or model download
  reembed            Recompute all embeddings (for embedder upgrades / dim changes; re-embed by semantics)
  defrag             Stock analysis: cluster BGE vectors, flag lone leaves, suggest a tree (read-only)
  split              Split a mixed node (AI decides): no flags prints material JSON for the AI to plan; --go --spec '<json>' applies
  tree-deepen        Deepen the tree: cluster flat children of a large root into sub-roots (--root to inspect/apply; --auto deepens every flat large root)
  inject             Distribute the inject source: --targets lists 14 hosts; --id <target> injects; --remove --id <target> uninstalls; no args in a TTY opens the picker
  tree-cure          Tree hygiene: root-size bill + lone-leaf attach suggestions (read-only; --id --parent actually attaches)
  tree-float         Heat float: an entry with more hits than its parent becomes the grandparent's child (effects follow; dry-run report, --go applies)
  doctor             Self-check: model/store/lock/remote/inject/scope in one pass (first stop for install issues)
  audit              Whole-store health audit: orphans / illegal importance / duplicate titles / truncated titles / deep chains; structured report for an AI audit
  witness            Verify the local ciphertext-digest witness chain (not an external trust anchor)
  web                Open the hosted user dashboard without starting the local runtime
  classify-config    Inspect or configure classification without running a model
  model              Model management: install, verify or uninstall BGE-M3
  config             View/set local config (client.json: data dir / server address / auto-sync / auto-cure)
  candidates         Judge-then-store candidate bill (read-only): high similarity suggests merge, medium suggests attach, similar candidates suggest merging them
  passport           Memory passport: ASCII-art card (user / memory count / connected agents / devices) for sharing
  history            Entry change history (audit stream: create/update/delete/restore/purge; SQLite triggers record it)
  plugin             Plugin hooks (plugins.json): list shows config; test <EVENT> fires an event
  mcp                MCP server over stdio JSON-RPC. The internal runtime serves HTTP/SSE at `/mcp` and `/sse`
  update-check       Check npm for a newer CLI (24h throttle; --force skips it; --clear drops the cache)
  repack             Backfill: reseal ciphertext so payload.parent_id matches the plaintext column (fixes dual-source drift; idempotent)
  diary              Diary = whole-store time chain (the trivial zone is merged in; not filtered by importance): recent (--limit), a day (--date, today/yesterday), a range (--from/--to inclusive), keyword (--contains)
  diary-search       Explicit cross-date diary fragment retrieval; never changes normal recall
  diary-fragment     Read one immutable diary fragment locator and optional immediate neighbors
  taxonomy           Built-in top-level catalog (20 human-domain + 3 AI-domain = 23, embedded at compile): --list prints it; --ensure <root,...> creates roots; no args shows current state
  root-create        Create a root outside the catalog (needs the user to say yes): AI proposes -> user allows -> run with --yes; the AI must not create one on its own
  update             Update a memory (any of title/body/tags/kind/importance); decrypt, reseal, auto-sync
  export             Export the whole store as plaintext JSON (local backup)
  backup             Back up the local store file (whole SQLite copy, ciphertext and index)
  snapshot           Create or inspect verified local snapshots; never rolls back cloud state
  secret             Show account keys: Account Secret / five-keys (manual cross-device join; leak = loss of the store)
  keys-export        Export decrypt keys (super password + Secret Key + vault material) - how a new machine logs in; leak = loss of the store
  super-reset        Reset the super password: unlock URK with the current code, issue a new one, upload. Data is unchanged
  fivekeys           Five-keys join (another machine): verify and write a local session; a non-empty --addr also logs in for a token
  register           Register an account (first device): login password for auth + super password wrapping keys. Address defaults to https://api.rsrs.rs; use --addr to override it. Missing user/password drops into an interactive prompt (TTY only)
  account            Multiple accounts on one machine: each account has its own data dir (local store/keys/session switch as a unit). Logging into a new account creates a profile; `account list` lists them; `account <name>` switches (main = primary); `remove <name> --yes` deletes
  migrate            Explicitly copy a selected old library into a new account; no startup migration
  space              Spaces (virtual accounts): an owner can create several virtual accounts; each is a space with its own super key and data dir. Join = a member builds that space's profile on their machine from an invite; they can switch freely; leaving is `kick`
  logout             Log out: clear addr/token and drop the cloud (identity and keys stay; login brings them back); --full forgets this machine's identity
  login              Log in through browser authorization, or use --interactive for password and TOTP prompts. Address defaults to the last server this machine used (kept in session.json by register/logout). Missing user/password drops into an interactive prompt (TTY only)
  book-material      Book material: a root subtree -> volume/chapter full text (for an AI to draft)
  portrait-material  Portrait material: whole-store portrait aggregate (for an AI to draft a portrait)
  share              Share a subtree: emit a prompt another AI can paste (payload is plaintext; the other AI imports from the prompt)
  share-import       Import a shared subtree: without --go, print attach-candidate bill (for the AI to judge); --go writes the store
  extract            Extract local coding-agent sessions (Codex, OpenCode, Claude Code, …) into rsrs memories
  help               Print this message or the help of the given subcommand(s)

Options:
      --json     Machine-readable output: JSON only, without human progress
  -h, --help     Print help
  -V, --version  Print version

Sandbox: use --client-only or RSRS_CLIENT_ONLY=1 to connect to the host HTTP runtime without managing its lifecycle.
```

</details>

## 诊断与状态 {#diagnostics}

### `status` {#cmd-status}

返回当前记忆库、账户、同步和索引状态。暂停时部分计数为 null，不能当成空库。

调用边界：`RPC`.

RPC `args` 模板：`["--json","status"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Status

Usage: rsrs status [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `memory-revision` {#cmd-memory-revision}

读取已初始化记忆库的不透明版本标记，供客户端判断是否需要刷新；不加载模型。

调用边界：`RPC`.

RPC `args` 模板：`["--json","memory-revision"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Read the initialized library's opaque snapshot token without loading a model

Usage: rsrs memory-revision [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `capabilities` {#cmd-capabilities}

读取静态 CLI 能力，不需要账户或模型；结果不能代替运行时权限与就绪检查。

调用边界：`RPC`.

RPC `args` 模板：`["--json","capabilities"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Report supported CLI capabilities without a profile, runtime or model download

Usage: rsrs capabilities [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `v` {#cmd-v}

读取内嵌版本，别名为 version；健康检查中的 bin 才是实际服务版本。

调用边界：`RPC`.

RPC `args` 模板：`["--json","v"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Print the embedded CLI version (same as `--version` / `-v`)

Usage: rsrs v [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `prompt` {#cmd-prompt}

读取完整记忆工作政策，供 agent 按当前引擎约定检索与存储。

调用边界：`RPC`.

RPC `args` 模板：`["--json","prompt"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Read the full memory workflow before storing or maintaining memories

Usage: rsrs prompt [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `doctor` {#cmd-doctor}

检查模型、记忆库、锁、远端与注入配置；remote/check-update 会联网，fix 会修改状态。

调用边界：`RPC`.

RPC `args` 模板：`["--json","doctor"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Self-check: model/store/lock/remote/inject/scope in one pass (first stop for install issues)

Usage: rsrs doctor [OPTIONS]

Options:
      --json          Machine-readable output: JSON only, without human progress
      --remote        Also probe remote server reachability (GET /health, ~1–3s)
      --check-update  Also check npm for a newer CLI (~1–5s; default reads the 24h cache, no network)
      --fix           Install a missing or unusable embedder; default only reports diagnostics
  -h, --help          Print help
```

</details>

### `audit` {#cmd-audit}

返回孤儿、非法重要性、重名、截断标题、过深链和技能模板等问题。

调用边界：`RPC`.

RPC `args` 模板：`["--json","audit"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Whole-store health audit: orphans / illegal importance / duplicate titles / truncated titles / deep chains; structured report for an AI audit

Usage: rsrs audit [OPTIONS]

Options:
      --json  JSON output (client/AI consumption)
  -h, --help  Print help
```

</details>

### `witness` {#cmd-witness}

校验本地密文摘要见证链；它只能检查本地链，不能充当外部可信时间戳。

调用边界：`RPC`.

RPC `args` 模板：`["--json","witness"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Verify the local ciphertext-digest witness chain (not an external trust anchor)

Usage: rsrs witness [OPTIONS]

Options:
      --json    Machine-readable output: JSON only, without human progress
      --verify
  -h, --help    Print help
```

</details>

### `passport` {#cmd-passport}

生成记忆护照资料，包含账户、记忆数、agent 和设备信息；分享前检查个人信息。

调用边界：`RPC`.

RPC `args` 模板：`["--json","passport"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Memory passport: ASCII-art card (user / memory count / connected agents / devices) for sharing

Usage: rsrs passport [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `history` {#cmd-history}

读取条目创建、更新、删除、恢复和清理的审计记录；可指定条目或读取近期记录。

调用边界：`RPC`.

RPC `args` 模板：`["--json","history"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Entry change history (audit stream: create/update/delete/restore/purge; SQLite triggers record it)

Usage: rsrs history [OPTIONS] [ID]

Arguments:
  [ID]  Entry id (8-char prefix ok); omit = recent changes for the whole store

Options:
      --json           Machine-readable output: JSON only, without human progress
      --limit <LIMIT>  [default: 20]
  -h, --help           Print help
```

</details>

### `update-check` {#cmd-update-check}

检查 npm 新版本；默认有缓存，force 跳过节流，clear 清缓存；不会完成升级。

调用边界：`RPC`.

RPC `args` 模板：`["--json","update-check"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Check npm for a newer CLI (24h throttle; --force skips it; --clear drops the cache)

Usage: rsrs update-check [OPTIONS]

Options:
      --force  Skip the throttle and query the network
      --json   Machine-readable output: JSON only, without human progress
      --clear  Clear the cache (the next check hits the network)
  -h, --help   Print help
```

</details>

## 读取与检索 {#retrieval}

### `recall` {#cmd-recall}

执行语义召回并返回排序结果、分数和关联；titles 只取标题，随后使用 show 读取正文。

调用边界：`RPC`.

RPC `args` 模板：`["--json","recall","<QUERY>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Semantic recall through the private Core

Usage: rsrs recall [OPTIONS] <QUERY>

Arguments:
  <QUERY>

Options:
      --json               Machine-readable output: JSON only, without human progress
      --mode <MODE>        Override the recall mode for this request without changing saved settings [possible values: fast, quality]
      --limit <LIMIT>      [default: 20]
      --type <TYPE>
      --project <PROJECT>  Restrict to this project (use when other projects interfere)
      --trace              Recall trace: stderr dumps the full routing path (candidates -> scope -> two zones -> per-axis Top10)
      --titles             Return compact IDs and titles in JSON; use show to read full memory content
      --no-related         Disable associations for this request (original recall results only)
      --intent <INTENT>    Recall intent: auto (keyword), howto (extra skill pass, keeps one procedure visible), fact (single pass) [default: auto] [possible values: auto, howto, fact]
  -h, --help               Print help
```

</details>

### `list` {#cmd-list}

按时间列出近期条目；支持时间下界和上次整理以来的筛选。

调用边界：`RPC`.

RPC `args` 模板：`["--json","list"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
List recent entries

Usage: rsrs list [OPTIONS]

Options:
      --json           Machine-readable output: JSON only, without human progress
      --limit <LIMIT>  [default: 20]
      --since <SINCE>  Only entries created after this time (RFC3339 or YYYY-MM-DD)
      --since-resort   Only entries created since the last tidy (maintenance.json resort_at) - the §3.8 tidy intake: tidy this batch, do not pull the whole store
  -h, --help           Print help
```

</details>

### `show` {#cmd-show}

读取一个条目的完整正文及直接因果上下文；短 ID 必须唯一。

调用边界：`RPC`.

RPC `args` 模板：`["--json","show","<ID>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Show one entry in full (cause/effect complete, not truncated)

Usage: rsrs show [OPTIONS] <ID>

Arguments:
  <ID>

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `chain` {#cmd-chain}

读取根到当前条目的祖先正文，并按 depth 返回后代；适合沿因果关系展开。

调用边界：`RPC`.

RPC `args` 模板：`["--json","chain","<ID>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Causal-chain deep dive: fetch the whole chain at once - ancestor bodies (root first) + this entry + descendants to --depth. After an AI sees a cause-chain name, it can dig without layer-by-layer show

Usage: rsrs chain [OPTIONS] <ID>

Arguments:
  <ID>

Options:
      --depth <DEPTH>  Descendant depth (default 3; 0 = ancestors + this entry only) [default: 3]
      --json           Machine-readable output: JSON only, without human progress
  -h, --help           Print help
```

</details>

### `tree` {#cmd-tree}

读取整片森林或指定子树；outline 输出 ID 与标题目录，depth 控制普通展开深度。

调用边界：`RPC`.

RPC `args` 模板：`["--json","tree"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Causal tree: render a subtree (--from start, default root forest); --outline prints a full-depth id+title directory (AI tidy reads this first)

Usage: rsrs tree [OPTIONS]

Options:
      --from <FROM>          [default: ""]
      --json                 Machine-readable output: JSON only, without human progress
      --depth <DEPTH>        [default: 3]
      --outline
      --material <MATERIAL>  Export this node's subtree as Markdown material (same as the client install dialog)
  -h, --help                 Print help
```

</details>

### `diary` {#cmd-diary}

按日期、范围、关键词或数量读取时间线；不等于只读取 trivial 条目。

调用边界：`RPC`.

RPC `args` 模板：`["--json","diary"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Diary = whole-store time chain (the trivial zone is merged in; not filtered by importance): recent (--limit), a day (--date, today/yesterday), a range (--from/--to inclusive), keyword (--contains)

Usage: rsrs diary [OPTIONS]

Options:
      --json                 Machine-readable output: JSON only, without human progress
      --limit <LIMIT>        [default: 10]
      --date <DATE>          Flip a day (YYYY-MM-DD or today/yesterday, local timezone)
      --from <FROM>          Range start (YYYY-MM-DD, inclusive; mutually exclusive with --date)
      --to <TO>              Range end (YYYY-MM-DD, inclusive; mutually exclusive with --date; --to without --from means "up to that day")
      --contains <CONTAINS>  Full-text keyword filter (title and decrypted full body); returns a bounded matching excerpt
  -h, --help                 Print help
```

</details>

### `diary-search` {#cmd-diary-search}

显式检索跨日期日记片段；不改变普通 recall。返回定位、来源版本和预算截断信息。

调用边界：`RPC`.

query 最多 500 个 Unicode 标量；limit 为 1–20，max-chars 为 512–12000。预算包含元数据与 JSON 转义。truncated 可能表示预算不足；semantic_ready=false 表示语义覆盖不完整，不要求循环等待索引。

RPC `args` 模板：`["--json","diary-search","<QUERY>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Explicit cross-date diary fragment retrieval; never changes normal recall

Usage: rsrs diary-search [OPTIONS] <QUERY>

Arguments:
  <QUERY>

Options:
      --json                   Machine-readable output: JSON only, without human progress
      --limit <LIMIT>          [default: 5]
      --max-chars <MAX_CHARS>  Budget for fragment result JSON, in Unicode characters (not tokens) [default: 4000]
      --mode <MODE>            [default: hybrid] [possible values: lexical, hybrid]
  -h, --help                   Print help
```

</details>

### `diary-fragment` {#cmd-diary-fragment}

按来源和片段定位读取日记，可带相邻片段；来源变化时旧定位失效。

调用边界：`RPC`.

neighbors 为 0 或 1。保留 source_id、fragment_id 和 source_version。位置按 Unicode 标量计数，不是 JavaScript UTF-16 下标。来源变化时重搜一次新定位，不要静默改为全量读取日记。

RPC `args` 模板：`["--json","diary-fragment","<SOURCE_ID>","<FRAGMENT_ID>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Read one immutable diary fragment locator and optional immediate neighbors

Usage: rsrs diary-fragment [OPTIONS] <SOURCE_ID> <FRAGMENT_ID>

Arguments:
  <SOURCE_ID>
  <FRAGMENT_ID>

Options:
      --json                   Machine-readable output: JSON only, without human progress
      --neighbors <NEIGHBORS>  [default: 0]
      --max-chars <MAX_CHARS>  [default: 4000]
  -h, --help                   Print help
```

</details>

### `book-material` {#cmd-book-material}

把指定根的子树整理为书稿素材；返回素材，不会替 agent 写成成稿。

调用边界：`RPC`.

结果信封使用 command tree-material，素材位于 details.material；不要机械地用 CLI 名称推导信封 command。

RPC `args` 模板：`["--json","book-material","<ROOT>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Book material: a root subtree -> volume/chapter full text (for an AI to draft)

Usage: rsrs book-material [OPTIONS] <ROOT>

Arguments:
  <ROOT>

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `portrait-material` {#cmd-portrait-material}

聚合记忆库中的画像素材，供 agent 后续撰写；注意输出可能含个人信息。

调用边界：`RPC`.

RPC `args` 模板：`["--json","portrait-material"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Portrait material: whole-store portrait aggregate (for an AI to draft a portrait)

Usage: rsrs portrait-material [OPTIONS]

Options:
      --json           Machine-readable output: JSON only, without human progress
      --limit <LIMIT>  [default: 40]
  -h, --help           Print help
```

</details>

## 写入、导入与备份 {#writes}

### `remember` {#cmd-remember}

存储可复用记忆或日记，也支持合并、替代和关联。pending 或 hook 拒绝不等于已写入。

调用边界：`RPC`.

检查返回的动作、ID 和候选决策。合并、替代和关联的效果不同，合并会删除源条目。pre-remember hook 可以返回 pending 而不写入。

RPC `args` 模板：`["--json","remember","<CONTENT>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Store a memory (local authority store; encrypts + embeds automatically). Judge-then-store (dedup first, then choose): without --force, an internal recall runs first - high similarity -> suggest merge (`--merge-ids "id1,id2"` deletes old, writes a combined entry); medium -> suggest attach (`--parent` as cause); no candidate or --force writes directly. `--parent` = causal attach; parent/child is cause/effect

Usage: rsrs remember [OPTIONS] <CONTENT>

Arguments:
  <CONTENT>

Options:
      --json                     Machine-readable output: JSON only, without human progress
      --type <TYPE>              [default: context]
      --tags <TAGS>              [default: ""]
      --title <TITLE>            [default: ""]
      --project <PROJECT>        [default: ""]
      --computer <COMPUTER>      [default: ""]
      --emotion <EMOTION>        [default: -1]
      --importance <IMPORTANCE>  Importance (AI-judged): important (reusable, recall primary zone) | trivial (diary; default). The normal tier is retired [default: trivial]
      --parent <PARENT>          [default: ""]
      --force                    Skip judge-then-store and write immediately
      --merge-ids <MERGE_IDS>    Merge: delete the listed old memories (comma-separated ids) and store this content as the combined entry (inherits the first cause chain)
      --supersedes <SUPERSEDES>  This new conclusion replaces a live important memory
      --see-also <SEE_ALSO>      Bidirectional links to live important memories
  -h, --help                     Print help
```

</details>

### `update` {#cmd-update}

更新标题、正文、标签、类型或重要性，重新加密并产生本地修改；随后后台同步。

调用边界：`RPC`.

RPC `args` 模板：`["--json","update","<ID>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Update a memory (any of title/body/tags/kind/importance); decrypt, reseal, auto-sync

Usage: rsrs update [OPTIONS] <ID>

Arguments:
  <ID>

Options:
      --json                     Machine-readable output: JSON only, without human progress
      --title <TITLE>
      --content <CONTENT>
      --tags <TAGS>
      --kind <KIND>
      --importance <IMPORTANCE>  Importance revision: important | normal | trivial (reseals ciphertext payload and the index column)
  -h, --help                     Print help
```

</details>

### `retitle` {#cmd-retitle}

只修改标题并重新加密；必须显式给出新标题。

调用边界：`RPC`.

RPC `args` 模板：`["--json","retitle","<ID>","--title","<TITLE>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Retitle: decrypt -> change title -> reseal (ciphertext payload updates) -> dirty -> auto-sync

Usage: rsrs retitle [OPTIONS] <ID>

Arguments:
  <ID>

Options:
      --json           Machine-readable output: JSON only, without human progress
      --title <TITLE>  New title (required - omitting it would blank the title; fixed in the 2026-09-20 audit)
  -h, --help           Print help
```

</details>

### `retitle-many` {#cmd-retitle-many}

从宿主上的 JSON 数组文件批量改题；保留失败诊断，操作前备份。

调用边界：`RPC`.

RPC `args` 模板：`["--json","retitle-many","<FILE>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Batch retitle (JSON array [{"id":...,"title":...}]; one process, one model load)

Usage: rsrs retitle-many [OPTIONS] <FILE>

Arguments:
  <FILE>

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `forget` {#cmd-forget}

写入删除标记并通过同步传播；它不是清除所有历史密文。

调用边界：`RPC`.

RPC `args` 模板：`["--json","forget","<ID>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Delete (tombstone; propagates with sync)

Usage: rsrs forget [OPTIONS] <ID>

Arguments:
  <ID>

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `purge` {#cmd-purge}

清理当前版本密文；保留待处理操作与未解决冲突，不承诺清除所有历史副本。

调用边界：`RPC`.

RPC `args` 模板：`["--json","purge","<ID>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Clear current-version ciphertext; pending operations and unresolved conflicts are kept

Usage: rsrs purge [OPTIONS] <ID>

Arguments:
  <ID>

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `restore` {#cmd-restore}

用完整 ID 恢复仍有保留内容的删除条目；恢复同样需要同步。

调用边界：`RPC`.

RPC `args` 模板：`["--json","restore","<ID>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Restore a deleted memory by full ID (keeps body and parent; propagates with sync)

Usage: rsrs restore [OPTIONS] <ID>

Arguments:
  <ID>

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `import` {#cmd-import}

导入宿主上的 JSON 数组文件，重建父子关系并安排同步。

调用边界：`RPC`.

RPC `args` 模板：`["--json","import","<FILE>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Import a JSON-array dump: keep fields, rebuild parent links, sync once after the batch

Usage: rsrs import [OPTIONS] <FILE>

Arguments:
  <FILE>

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `export` {#cmd-export}

将整个记忆库导出为明文 JSON 到宿主路径；输出文件属于敏感数据。

调用边界：`RPC`.

RPC `args` 模板：`["--json","export","<FILE>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Export the whole store as plaintext JSON (local backup)

Usage: rsrs export [OPTIONS] <FILE>

Arguments:
  <FILE>

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `backup` {#cmd-backup}

复制本地 SQLite 形成备份；数据库备份不能代替密钥备份。

调用边界：`RPC`.

RPC `args` 模板：`["--json","backup","<FILE>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Back up the local store file (whole SQLite copy, ciphertext and index)

Usage: rsrs backup [OPTIONS] <FILE>

Arguments:
  <FILE>

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `snapshot` {#cmd-snapshot}

创建或检查经过验证的本地快照，并提供恢复、故障恢复与审阅后恢复同步的子命令。

调用边界：`RPC`.

create/list 可以作为运行时操作。restore/recover 明确拒绝在 runtime worker 中执行，必须使用宿主 CLI。恢复会隔离同步，不会回滚云端。resume-sync 需要与实际审阅一致的本地版本。

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Create or inspect verified local snapshots; never rolls back cloud state

Usage: rsrs snapshot [OPTIONS] <COMMAND>

Commands:
  create       Create a consistent private database snapshot, excluding access grants
  list         List snapshots after validating file digests and SQLite integrity
  restore      Restore one local snapshot after a mandatory pre-backup; cloud state is unchanged
  recover      Recover an interrupted local snapshot transaction (host only)
  resume-sync  Resume sync only after reviewing local/remote differences at this exact local revision
  help         Print this message or the help of the given subcommand(s)

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `snapshot create` {#cmd-snapshot-create}

调用边界：`RPC`.

RPC `args` 模板：`["--json","snapshot","create"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Create a consistent private database snapshot, excluding access grants

Usage: rsrs snapshot create [OPTIONS]

Options:
      --json         Machine-readable output: JSON only, without human progress
      --note <NOTE>  [default: ""]
  -h, --help         Print help
```

</details>

#### `snapshot list` {#cmd-snapshot-list}

调用边界：`RPC`.

RPC `args` 模板：`["--json","snapshot","list"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
List snapshots after validating file digests and SQLite integrity

Usage: rsrs snapshot list [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `snapshot restore` {#cmd-snapshot-restore}

调用边界：`HOST`.

宿主 CLI 参数模板（不是 RPC 调用）：`["--json","snapshot","restore","<ID>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Restore one local snapshot after a mandatory pre-backup; cloud state is unchanged

Usage: rsrs snapshot restore [OPTIONS] <ID>

Arguments:
  <ID>

Options:
      --confirm
      --json     Machine-readable output: JSON only, without human progress
  -h, --help     Print help
```

</details>

#### `snapshot recover` {#cmd-snapshot-recover}

调用边界：`HOST`.

宿主 CLI 参数模板（不是 RPC 调用）：`["--json","snapshot","recover"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Recover an interrupted local snapshot transaction (host only)

Usage: rsrs snapshot recover [OPTIONS]

Options:
      --confirm
      --json     Machine-readable output: JSON only, without human progress
  -h, --help     Print help
```

</details>

#### `snapshot resume-sync` {#cmd-snapshot-resume-sync}

调用边界：`RPC`.

RPC `args` 模板：`["--json","snapshot","resume-sync","--reviewed-revision","<REVIEWED_REVISION>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Resume sync only after reviewing local/remote differences at this exact local revision

Usage: rsrs snapshot resume-sync [OPTIONS] --reviewed-revision <REVIEWED_REVISION>

Options:
      --json
          Machine-readable output: JSON only, without human progress
      --reviewed-revision <REVIEWED_REVISION>

  -h, --help
          Print help
```

</details>

### `extract` {#cmd-extract}

扫描本机编码 agent 会话并导入；targets 列来源，dry-run 预览，游标避免重复导入。

调用边界：`RPC`.

--dry-run 与 --targets 用于检查；--force 重新导入已见会话，--include-subagents 扩大扫描范围。来源路径与会话游标位于宿主。--tui 需要终端。

RPC `args` 模板：`["--json","extract","--targets"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Extract local coding-agent sessions (Codex, OpenCode, Claude Code, …) into rsrs memories

Usage: rsrs extract [OPTIONS]

Options:
      --json                     Machine-readable output: JSON only, without human progress
      --targets                  List agent sources and whether a local session store exists
      --tui                      Force the interactive TUI picker (needs a TTY)
      --all                      Extract from every detected source (default when --id is omitted)
      --id <ID>                  Extract from one source (codex/opencode/claude/…); see --targets
      --dry-run                  Scan and summarize without writing any memory
      --since <SINCE>            Only sessions updated since this bound (today|yesterday|7d|YYYY-MM-DD)
      --limit <LIMIT>            Maximum sessions to import per source (newest first)
      --cwd <CWD>                Filter by working-directory substring
      --model <MODEL>            Filter by model/provider substring
      --session <SESSION>        Filter by session id substring
      --kind <KIND>              Memory kind for imported sessions [default: context]
      --importance <IMPORTANCE>  Importance: important (default) or trivial (diary) [default: important]
      --parent <PARENT>          Optional pre-attach parent (id / tree / anchor title); omit to ingest as roots for a later tidy [default: ""]
      --include-subagents        Include subagent/child sessions (hidden by default)
      --force                    Re-import sessions already recorded in the cursor
  -h, --help                     Print help
```

</details>

## 整理记忆库 {#organization}

### `candidates` {#cmd-candidates}

只读取去重和挂靠候选清单，供调用者先判断，再选择后续写入。

调用边界：`RPC`.

RPC `args` 模板：`["--json","candidates","<CONTENT>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Judge-then-store candidate bill (read-only): high similarity suggests merge, medium suggests attach, similar candidates suggest merging them

Usage: rsrs candidates [OPTIONS] <CONTENT>

Arguments:
  <CONTENT>

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `attach` {#cmd-attach}

把条目挂到指定父条目下，检查自挂与环，再安排同步。

调用边界：`RPC`.

RPC `args` 模板：`["--json","attach","--parent","<PARENT>","<ID>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Attach a child under a parent (explicit attach is intent; no judge-then-store; auto-syncs)

Usage: rsrs attach [OPTIONS] --parent <PARENT> <ID>

Arguments:
  <ID>

Options:
      --json             Machine-readable output: JSON only, without human progress
      --parent <PARENT>
  -h, --help             Print help
```

</details>

### `promote` {#cmd-promote}

把条目提升到祖父或根层，保留它的后代。

调用边界：`RPC`.

RPC `args` 模板：`["--json","promote","<ID>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Causal tree: promote - this entry becomes a more-upstream cause (reattach to grandparent/root; effects follow)

Usage: rsrs promote [OPTIONS] <ID>

Arguments:
  <ID>

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `demote` {#cmd-demote}

把条目作为指定父条目的后果挂入链中，检查环。

调用边界：`RPC`.

RPC `args` 模板：`["--json","demote","--parent","<PARENT>","<ID>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Causal tree: demote - attach this entry under --parent as its effect (extends the chain by one; cycle-safe)

Usage: rsrs demote [OPTIONS] --parent <PARENT> <ID>

Arguments:
  <ID>

Options:
      --json             Machine-readable output: JSON only, without human progress
      --parent <PARENT>
  -h, --help             Print help
```

</details>

### `resort` {#cmd-resort}

使用 ops 计划批量改挂；默认预览，go 才写入，并更新上次整理时间。

调用边界：`RPC`.

RPC `args` 模板：`["--json","resort"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Memory tidy: batch reparent (spec={"ops":[{"id":"child","parent":"parent"}]}; id / first 8 chars / root title all work); dry-run by default, --go writes, auto-syncs, and resets the counter

Usage: rsrs resort [OPTIONS]

Options:
      --go
      --json                   Machine-readable output: JSON only, without human progress
      --spec <SPEC>
      --status                 Show tidy counter (adds since last tidy / threshold)
      --reset                  Manually reset the counter (e.g. after tidying another way)
      --threshold <THRESHOLD>  Set the alert threshold (new-entry count)
  -h, --help                   Print help
```

</details>

### `defrag` {#cmd-defrag}

分析语义聚类、孤立条目和重复候选；返回建议，不自动合并。

调用边界：`RPC`.

RPC `args` 模板：`["--json","defrag"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Stock analysis: cluster BGE vectors, flag lone leaves, suggest a tree (read-only)

Usage: rsrs defrag [OPTIONS]

Options:
      --json       Machine-readable output: JSON only, without human progress
      --min <MIN>  User-selected similarity floor for duplicate suggestions [default: 0.6]
      --top <TOP>  [default: 20]
  -h, --help       Print help
```

</details>

### `split` {#cmd-split}

读取混合节点素材，或以 go 和 spec 应用拆分计划；不要跳过计划审阅。

调用边界：`RPC`.

RPC `args` 模板：`["--json","split","<ID>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Split a mixed node (AI decides): no flags prints material JSON for the AI to plan; --go --spec '<json>' applies

Usage: rsrs split [OPTIONS] <ID>

Arguments:
  <ID>

Options:
      --go           Apply the split plan
      --json         Machine-readable output: JSON only, without human progress
      --spec <SPEC>  AI-authored split-plan JSON (run with no flags first to get material and field docs)
  -h, --help         Print help
```

</details>

### `tree-deepen` {#cmd-tree-deepen}

把过于平铺的子节点归入子根；检查 root、auto 和 go 的写入范围。

调用边界：`RPC`.

RPC `args` 模板：`["--json","tree-deepen"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Deepen the tree: cluster flat children of a large root into sub-roots (--root to inspect/apply; --auto deepens every flat large root)

Usage: rsrs tree-deepen [OPTIONS]

Options:
      --json             Machine-readable output: JSON only, without human progress
      --root <ROOT>      Target root id (8-char prefix ok); default = every flat large root
      --go               Apply the plan (pair with --titles)
      --titles <TITLES>  Sub-root title array JSON (draft order; default = longest member title in the cluster)
      --auto             One-shot: auto-deepen every flat large root (sub-root title = longest member title; retitle later)
      --min <MIN>        User-selected similarity floor for Core grouping [default: 0.55]
  -h, --help             Print help
```

</details>

### `tree-cure` {#cmd-tree-cure}

检查根大小与孤叶挂靠建议；指定 id/parent 或 auto 会改动记忆库。

调用边界：`RPC`.

RPC `args` 模板：`["--json","tree-cure"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Tree hygiene: root-size bill + lone-leaf attach suggestions (read-only; --id --parent actually attaches)

Usage: rsrs tree-cure [OPTIONS]

Options:
      --json             Machine-readable output: JSON only, without human progress
      --top <TOP>        [default: 15]
      --id <ID>          Apply: attach --id under --parent (skip suggestions, just do it)
      --parent <PARENT>
      --auto             Auto-attach: apply every suggestion, skip failures, then summarize
      --min <MIN>        User-selected similarity floor for Core attachment suggestions [default: 0.5]
  -h, --help             Print help
```

</details>

### `tree-float` {#cmd-tree-float}

依据命中热度给出提升计划，go 才改挂；后代跟随原条目。

调用边界：`RPC`.

RPC `args` 模板：`["--json","tree-float"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Heat float: an entry with more hits than its parent becomes the grandparent's child (effects follow; dry-run report, --go applies)

Usage: rsrs tree-float [OPTIONS]

Options:
      --go         Apply: float each reported entry (dirty; propagates with sync)
      --json       Machine-readable output: JSON only, without human progress
      --min <MIN>  Hit-count floor to float (default 3; relative heat - must be strictly above the parent's hits) [default: 3]
  -h, --help       Print help
```

</details>

### `taxonomy` {#cmd-taxonomy}

读取内置 23 类目录与当前根状态；ensure 会创建指定根。

调用边界：`RPC`.

RPC `args` 模板：`["--json","taxonomy","--list"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Built-in top-level catalog (20 human-domain + 3 AI-domain = 23, embedded at compile): --list prints it; --ensure <root,...> creates roots; no args shows current state

Usage: rsrs taxonomy [OPTIONS]

Options:
      --json             Machine-readable output: JSON only, without human progress
      --list             List every built-in category (domain / title / surface-word count / gist)
      --ensure <ENSURE>  Create/fill roots (idempotent): titles must match the catalog, comma-separated; default = fill every missing root
  -h, --help             Print help
```

</details>

### `root-create` {#cmd-root-create}

创建目录外的新根；需要用户明确授权并使用 yes。

调用边界：`RPC`.

RPC `args` 模板：`["--json","root-create","<TITLE>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Create a root outside the catalog (needs the user to say yes): AI proposes -> user allows -> run with --yes; the AI must not create one on its own

Usage: rsrs root-create [OPTIONS] <TITLE>

Arguments:
  <TITLE>

Options:
      --content <CONTENT>  One-line gist (default = the title)
      --json               Machine-readable output: JSON only, without human progress
      --yes                User already allowed this (turn their "yes" into this flag; without it, refuse to write)
  -h, --help               Print help
```

</details>

### `classify` {#cmd-classify}

提供分类、现有树挂靠和因果整理；plan/dry-run 不联网不写库，auto 会应用修改。

调用边界：`RPC`.

简短帮助中的 read-only 不适用于 --auto：--auto 会应用修改。已配置的远端分类器可能收到记忆正文。需要本地预览时用 --plan，对外处理前审阅明确范围并取得授权。

RPC `args` 模板：`["--json","classify","--plan"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Batch classify via JEV (TypeSafe): ask which top-level category each entry belongs to, compare with the current parent (read-only)

Usage: rsrs classify [OPTIONS]

Options:
      --json
          Machine-readable output: JSON only, without human progress
      --limit <LIMIT>
          Process the latest N entries (default 50, so a full-store run is not accidental; --all overrides) [default: 50]
      --all
          Whole store (overrides --limit)
      --root <ROOT>
          Restrict to a subtree (id or 8-char prefix; includes the node itself and descendants)
      --max-chars <MAX_CHARS>
          Truncate each entry body to this many chars (API payload cap) [default: 600]
      --min-confidence <MIN_CONFIDENCE>
          Below this confidence, list as "low confidence, needs a human" (default 0.5) [default: 0.5]
      --save <SAVE>
          Save suggestion JSON (audit / later apply)
      --dry-run
          Dry run: preview final actions without network access or local writes
      --ds [<DS>]
          Use the DS (OpenAI-compatible) backend to emulate JEV: `--ds` uses a stored key; `--ds <key>` takes the key and stores it
      --backend <BACKEND>
          Classify backend: jev (TypeSafe official Jev, default) | ds (DeepSeek-compatible emulate) - same as --ds; pick one
      --tree
          Tree mode: pick a suggested parent among **existing tree nodes** (not a linear 23-root assignment) - pair with --batch for speed
      --causal
          Causal-tree segment rewrite: parent=cause, child=effect; walk by level and let the AI judge order (prints a resort --spec compatible reparent plan; does not write the store)
      --out <OUT>
          Causal mode: write the reparent plan to a file (resort --spec can consume it)
      --auto
          Apply the final organization actions selected by Core
      --plan
          Preview local structural repair actions; text only, no store writes, no network
      --api-base <API_BASE>
          API base (default TypeSafe; later may switch to a rsrs gateway)
      --model <MODEL>
          Model name [default: jev-latest]
  -h, --help
          Print help
```

</details>

### `repack` {#cmd-repack}

重新加密以修正载荷与列中的 parent_id 漂移；属于批量写入维护。

调用边界：`RPC`.

RPC `args` 模板：`["--json","repack"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Backfill: reseal ciphertext so payload.parent_id matches the plaintext column (fixes dual-source drift; idempotent)

Usage: rsrs repack [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

## 同步与冲突处理 {#synchronization}

### `sync` {#cmd-sync}

双向同步并返回推拉数量、冲突、待处理和收敛信息；可能联网并处理删除标记。

调用边界：`RPC`.

RPC `args` 模板：`["--json","sync"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Two-way sync: pull cloud delta -> land locally -> push local changes (LWW)

Usage: rsrs sync [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `sync-conflicts` {#cmd-sync-conflicts}

读取待决冲突；all 还包含已解决和旧代历史，不代表它们仍需处理。

调用边界：`RPC`.

RPC `args` 模板：`["--json","sync-conflicts"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Show conflicts that still need a decision; --all includes resolved and old-generation history

Usage: rsrs sync-conflicts [OPTIONS]

Options:
      --id <ID>
      --json     Machine-readable output: JSON only, without human progress
      --all
      --refresh  Sync latest content and cross-device resolution state first
  -h, --help     Print help
```

</details>

### `sync-resolve` {#cmd-sync-resolve}

基于 epoch、rev 和已读 head-rev 解决冲突；远端确认后才标记解决。

调用边界：`RPC`.

读取双方版本后，再选 keep-current、take-incoming 或 merge。head-rev 将决策绑定到已读的当前版本，merge 还需明确正文。传输失败不代表远端已经确认解决。

RPC `args` 模板：`["--json","sync-resolve","--epoch","<EPOCH>","--rev","<REV>","--head-rev","<HEAD_REV>","--action","<ACTION>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Resolve one retained revision; mark it resolved only after the remote confirms

Usage: rsrs sync-resolve [OPTIONS] --epoch <EPOCH> --rev <REV> --head-rev <HEAD_REV> --action <ACTION>

Options:
      --epoch <EPOCH>
      --json                 Machine-readable output: JSON only, without human progress
      --rev <REV>
      --head-rev <HEAD_REV>  current.rev shown by sync-conflicts, so the head cannot change under you after you compared
      --action <ACTION>      [possible values: keep-current, take-incoming, merge]
      --content <CONTENT>    For merge, the explicit merged body; metadata stays on the current version
  -h, --help                 Print help
```

</details>

### `sync-history` {#cmd-sync-history}

读取保留的同步版本；remote 直接读取服务端历史，不写本地缓存。

调用边界：`RPC`.

RPC `args` 模板：`["--json","sync-history"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Show retained sync revisions; --remote reads server history without local caching

Usage: rsrs sync-history [OPTIONS]

Options:
      --id <ID>
      --json     Machine-readable output: JSON only, without human progress
      --remote
  -h, --help     Print help
```

</details>

### `sync-restore` {#cmd-sync-restore}

从保留版本创建新的本地编辑，之后仍需同步；不是回滚整个云端库。

调用边界：`RPC`.

选择 op-id，或同时提供 rev 与 epoch；不要混用两种选择方式。pending 表示已形成本地编辑，仍需同步。

RPC `args` 模板：`["--json","sync-restore","--op-id","<OP_ID>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Restore a kept revision as a new local edit

Usage: rsrs sync-restore [OPTIONS]

Options:
      --json           Machine-readable output: JSON only, without human progress
      --op-id <OP_ID>
      --rev <REV>
      --epoch <EPOCH>
  -h, --help           Print help
```

</details>

### `sync-reset` {#cmd-sync-reset}

服务端备份恢复后重建同步状态，保留当前恢复快照和待发修改。

调用边界：`RPC`.

RPC `args` 模板：`["--json","sync-reset"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Rebuild after a server backup restore; keep current recovery snapshots and pending edits

Usage: rsrs sync-reset [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

## 反馈与评测 {#evaluation}

### `query-log` {#cmd-query-log}

读取召回候选、采用和反馈日志，也可返回统计；mark 子命令写入明确反馈。

调用边界：`RPC`.

反馈必须来自真实判断，不能因工具调用成功就记为采用。启用显式反馈时，mark 需要 recall.summary.query_log_id 和正确 source；旧式评分的兼容范围更窄。

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Query log: each recall's candidates + adoption + model self-grade (local DPO/SFT raw material)

Usage: rsrs query-log [OPTIONS] [COMMAND]

Commands:
  mark  Report a self-grade: true hit --good (chosen) / misleading --bad (rejected). ids are comma-separated; 8-char prefixes work; matches recall candidates from the last 10 minutes
  help  Print this message or the help of the given subcommand(s)

Options:
      --limit <LIMIT>  [default: 20]
      --stats          Stats only: query count, adoption rate, empty-candidate rate, good/bad self-grade, top entries
      --json           JSON output
  -h, --help           Print help
```

</details>

#### `query-log mark` {#cmd-query-log-mark}

调用边界：`RPC`.

RPC `args` 模板：`["--json","query-log","mark","<IDS>","--good","--query-log-id","<QUERY_LOG_ID>","--source","model"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Report a self-grade: true hit --good (chosen) / misleading --bad (rejected). ids are comma-separated; 8-char prefixes work; matches recall candidates from the last 10 minutes

Usage: rsrs query-log mark [OPTIONS] <IDS>

Arguments:
  <IDS>  Candidate entry ids (comma-separated; prefixes ok)

Options:
      --good                         Mark as a true hit (post-training chosen)
      --bad                          Mark as misleading (post-training rejected)
      --query-log-id <QUERY_LOG_ID>  Explicit request identity from recall.summary.query_log_id (required with feedback enabled)
      --source <SOURCE>              Origin of this explicit verdict; never inferred from a successful command [default: model] [possible values: human, model, task_outcome]
  -h, --help                         Print help
```

</details>

### `run-log` {#cmd-run-log}

记录技能执行的真实结果：ok、fail、confounded 或 no_effect；保存在本地。

调用边界：`RPC`.

RPC `args` 模板：`["--json","run-log","<ID>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Record a procedure run verdict (ok|fail|confounded|no_effect) for a skill/knowledge entry; local-only, feeds how-to ordering and audit

Usage: rsrs run-log [OPTIONS] <ID>

Arguments:
  <ID>  Skill/knowledge entry id (full id or unique prefix)

Options:
      --json             Machine-readable output: JSON only, without human progress
      --status <STATUS>  Outcome: ok | fail (plain success/failure) | confounded (other changes interfered, cannot attribute) | no_effect (worked, but changed nothing observable) [default: ok] [possible values: ok, fail, confounded, no_effect]
      --note <NOTE>      Short note: what deviated or which command failed (local-only, never synced) [default: ""]
  -h, --help             Print help
```

</details>

### `bench` {#cmd-bench}

运行检索评测或从查询日志生成评测草稿；草稿不等于已人工标注的评测集。

调用边界：`RPC`.

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Retrieval quality benchmark: run an evalset for hit-rate/MRR, optional baseline compare; mine drafts an evalset from query-log

Usage: rsrs bench [OPTIONS] <COMMAND>

Commands:
  run   Run an evalset: JSONL one case per line {"query","expect":[8-char prefix or full id...],"project?","note?"}; empty expect = negative
  mine  Mine an evalset draft from query-log (self-grade good is the main signal, adopted is weak)
  help  Print this message or the help of the given subcommand(s)

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `bench run` {#cmd-bench-run}

调用边界：`RPC`.

RPC `args` 模板：`["--json","bench","run","<FILE>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Run an evalset: JSONL one case per line {"query","expect":[8-char prefix or full id...],"project?","note?"}; empty expect = negative

Usage: rsrs bench run [OPTIONS] <FILE>

Arguments:
  <FILE>  Evalset file (JSONL)

Options:
      --json                 Machine-readable output: JSON only, without human progress
      --topk <TOPK>          Eval depth: whether the expected hit is in the top K (default 5) [default: 5]
      --save <SAVE>          Archive this run as JSON (for a later --baseline compare)
      --baseline <BASELINE>  Compare against a baseline (JSON from a previous --save): per-case up/down/same
      --verbose              Per-case detail (default lists only misses)
  -h, --help                 Print help
```

</details>

#### `bench mine` {#cmd-bench-mine}

调用边界：`RPC`.

RPC `args` 模板：`["--json","bench","mine","--out","<OUT>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Mine an evalset draft from query-log (self-grade good is the main signal, adopted is weak)

Usage: rsrs bench mine [OPTIONS] --out <OUT>

Options:
      --json           Machine-readable output: JSON only, without human progress
      --out <OUT>      Output JSONL file
      --limit <LIMIT>  Max cases to export [default: 100]
      --strict         Strict: use self-grade good only, ignore adopted as a weak signal
  -h, --help           Print help
```

</details>

## 身份、授权与分享 {#identity}

### `grant` {#cmd-grant}

创建、列出或撤销只读子树授权；create 只显示一次令牌，需要妥善保管。

调用边界：`ADMIN`.

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Manage independent read-only subtree grants for local tools

Usage: rsrs grant [OPTIONS] <COMMAND>

Commands:
  create  Create a grant; the token is shown only this once - keep it
  list
  revoke
  help    Print this message or the help of the given subcommand(s)

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `grant create` {#cmd-grant-create}

调用边界：`ADMIN`.

RPC `args` 模板：`["--json","grant","create","--root","<ROOT>","--label","<LABEL>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Create a grant; the token is shown only this once - keep it

Usage: rsrs grant create [OPTIONS] --root <ROOT> --label <LABEL>

Options:
      --json           Machine-readable output: JSON only, without human progress
      --root <ROOT>
      --label <LABEL>
  -h, --help           Print help
```

</details>

#### `grant list` {#cmd-grant-list}

调用边界：`ADMIN`.

RPC `args` 模板：`["--json","grant","list"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Usage: rsrs grant list [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `grant revoke` {#cmd-grant-revoke}

调用边界：`ADMIN`.

RPC `args` 模板：`["--json","grant","revoke","<ID>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Usage: rsrs grant revoke [OPTIONS] <ID>

Arguments:
  <ID>

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `session` {#cmd-session}

列出或撤销独立云登录会话；不会轮换本地解密密钥。

调用边界：`ADMIN`.

<details>
<summary>全部参数、默认值与帮助</summary>

```text
List or revoke independent cloud login sessions; does not change local decrypt keys

Usage: rsrs session [OPTIONS] <COMMAND>

Commands:
  list    List independent sessions for this account (the current one is marked current)
  revoke  Revoke cloud access for a session; the full UUID comes from session list
  help    Print this message or the help of the given subcommand(s)

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `session list` {#cmd-session-list}

调用边界：`ADMIN`.

RPC `args` 模板：`["--json","session","list"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
List independent sessions for this account (the current one is marked current)

Usage: rsrs session list [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `session revoke` {#cmd-session-revoke}

调用边界：`ADMIN`.

RPC `args` 模板：`["--json","session","revoke","<ID>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Revoke cloud access for a session; the full UUID comes from session list

Usage: rsrs session revoke [OPTIONS] <ID>

Arguments:
  <ID>

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `keygen` {#cmd-keygen}

离线生成本地密钥；force 可能替换已有身份。它不是找回云端密钥的方法。

调用边界：`HOST`.

宿主 CLI 参数模板（不是 RPC 调用）：`["--json","keygen"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Generate local key material (offline; writes local session/keyfile - no server, no auth)

Usage: rsrs keygen [OPTIONS]

Options:
      --json         Machine-readable output: JSON only, without human progress
      --pass <PASS>  Compatibility flag: unused for encryption since v4 (the super password is system-generated)
      --force        Force overwrite with offline keys even if this machine already has cloud key material (drops the cloud session)
  -h, --help         Print help
```

</details>

### `secret` {#cmd-secret}

读取账户密钥信息；reveal 会公开秘密，应按敏感输出处理。

调用边界：`HOST`.

宿主 CLI 参数模板（不是 RPC 调用）：`["--json","secret"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Show account keys: Account Secret / five-keys (manual cross-device join; leak = loss of the store)

Usage: rsrs secret [OPTIONS]

Options:
      --json    Machine-readable output: JSON only, without human progress
      --reveal  Show the full Secret and five-keys (default is masked)
  -h, --help    Print help
```

</details>

### `keys-export` {#cmd-keys-export}

导出解密材料，可写宿主文件；输出不能进入普通日志或 agent 上下文。

调用边界：`HOST`.

宿主 CLI 参数模板（不是 RPC 调用）：`["--json","keys-export"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Export decrypt keys (super password + Secret Key + vault material) - how a new machine logs in; leak = loss of the store

Usage: rsrs keys-export [OPTIONS]

Options:
      --json       Machine-readable output: JSON only, without human progress
      --out <OUT>  Write a file (mode 600) instead of printing; the file holds every decrypt secret - keep it safe
  -h, --help       Print help
```

</details>

### `super-reset` {#cmd-super-reset}

在已能解锁库的前提下轮换超级密码；不能恢复已经丢失的数据密钥。

调用边界：`HOST`.

宿主 CLI 参数模板（不是 RPC 调用）：`["--json","super-reset"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Reset the super password: unlock URK with the current code, issue a new one, upload. Data is unchanged

Usage: rsrs super-reset [OPTIONS]

Options:
      --json                Machine-readable output: JSON only, without human progress
      --super <SUPER_PASS>  Current super password (omit if already in the local keyring)
  -h, --help                Print help
```

</details>

### `fivekeys` {#cmd-fivekeys}

从已有恢复材料加入账户；非空 addr 还会登录云端。不是凭空恢复密钥。

调用边界：`HOST`.

宿主 CLI 参数模板（不是 RPC 调用）：`["--json","fivekeys","--pass","<PASS>","--kdf-salt","<KDF_SALT>","--wrapped-urk","<WRAPPED_URK>","--urk-nonce","<URK_NONCE>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Five-keys join (another machine): verify and write a local session; a non-empty --addr also logs in for a token

Usage: rsrs fivekeys [OPTIONS] --pass <PASS> --kdf-salt <KDF_SALT> --wrapped-urk <WRAPPED_URK> --urk-nonce <URK_NONCE>

Options:
      --addr <ADDR>                [default: ""]
      --json                       Machine-readable output: JSON only, without human progress
      --user <USER>                [default: ""]
      --pass <PASS>
      --secret <SECRET>            [default: ""]
      --kdf-salt <KDF_SALT>
      --wrapped-urk <WRAPPED_URK>
      --urk-nonce <URK_NONCE>
      --super <SUPER_PASS>         Super password (new wrap). If set, login password + Account Secret are not used to unwrap [default: ""]
  -h, --help                       Print help
```

</details>

### `register` {#cmd-register}

创建云账户及本地密钥包装；无完整参数时可能需要交互输入。

调用边界：`HOST`.

宿主 CLI 参数模板（不是 RPC 调用）：`["--json","register"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Register an account (first device): login password for auth + super password wrapping keys. Address defaults to https://api.rsrs.rs; use --addr to override it. Missing user/password drops into an interactive prompt (TTY only)

Usage: rsrs register [OPTIONS]

Options:
      --addr <ADDR>
      --json                Machine-readable output: JSON only, without human progress
      --user <USER>
      --pass <PASS>
      --super <SUPER_PASS>  Super password (for decrypt; separate from the login password; forgotten = memories unrecoverable)
  -h, --help                Print help
```

</details>

### `account` {#cmd-account}

列出账户档案、切换当前档案或删除本地档案；切换与删除应交给宿主协调。

调用边界：`ADMIN`.

动作包括 list、use &lt;name&gt;、直接用 &lt;name&gt; 切换，以及 remove &lt;name&gt; --yes。RPC 可读取列表；切换与删除由宿主执行。名称在运行时宿主上解析，不对应调用者的文件系统。

RPC `args` 模板：`["--json","account","list"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Multiple accounts on one machine: each account has its own data dir (local store/keys/session switch as a unit). Logging into a new account creates a profile; `account list` lists them; `account <name>` switches (main = primary); `remove <name> --yes` deletes

Usage: rsrs account [OPTIONS] <ACTION> [NAME]

Arguments:
  <ACTION>  Action: list | remove | or a profile name (same as use; main is the primary profile)
  [NAME]    Profile name (required for remove)

Options:
      --json  Machine-readable output: JSON only, without human progress
      --yes   Confirm a real delete on remove (store and keys are unrecoverable)
  -h, --help  Print help
```

</details>

### `migrate` {#cmd-migrate}

显式迁移选定旧库或旧保险库；不会因为启动而自动迁移。

调用边界：`HOST`.

宿主 CLI 参数模板（不是 RPC 调用）：`["--json","migrate"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Explicitly copy a selected old library into a new account; no startup migration

Usage: rsrs migrate [OPTIONS]

Options:
      --json                     Machine-readable output: JSON only, without human progress
      --source <SOURCE>
      --account <ACCOUNT>
      --vault                    Upgrade only the explicitly selected legacy account vault, preserving its data key
      --addr <ADDR>
      --user <USER>
      --pass <PASS>
      --super <SUPER_PASS>
      --secret-key <SECRET_KEY>
      --new-super <NEW_SUPER>    Explicit v4 recovery code for the unchanged data key (required on a headless host without keyring)
  -h, --help                     Print help
```

</details>

### `space` {#cmd-space}

管理虚拟账户、邀请、成员、踢出和本地档案；创建、加入和切换涉及宿主生命周期。

调用边界：`ADMIN`.

动作包括 list、create &lt;name&gt;、use &lt;name&gt;、invite、join &lt;code&gt; 或 join --code &lt;code&gt;、members [name]、kick --session &lt;id&gt; 或 kick --all、remove &lt;name&gt; --yes。invite 支持 note 与 readonly。只读邀请由服务端执行权限检查；加入不等于切换到该档案。

RPC `args` 模板：`["--json","space","list"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Spaces (virtual accounts): an owner can create several virtual accounts; each is a space with its own super key and data dir. Join = a member builds that space's profile on their machine from an invite; they can switch freely; leaving is `kick`

Usage: rsrs space [OPTIONS] <ACTION> [NAME]

Arguments:
  <ACTION>  Action: list | create <name> | use <name> | invite | join <code> | members | kick | remove
  [NAME]    Space name (needed for create/use/remove)

Options:
      --json               Machine-readable output: JSON only, without human progress
      --note <NOTE>        Note on invite (written to the member session's device_name, so you can tell who is who later)
      --readonly           invite --readonly: sign a read-only invite (that member can recall, not write; enforced server-side)
      --code <CODE>        Invite code for join (the name positional also accepts it)
      --session <SESSION>  Member session id to kick
      --all                kick --all: revoke every member session in this space
      --yes                Confirm a real delete on remove (store and keys are unrecoverable)
  -h, --help               Print help
```

</details>

### `logout` {#cmd-logout}

清除云会话；full 还移除本机身份，需要额外确认其后果。

调用边界：`HOST`.

宿主 CLI 参数模板（不是 RPC 调用）：`["--json","logout"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Log out: clear addr/token and drop the cloud (identity and keys stay; login brings them back); --full forgets this machine's identity

Usage: rsrs logout [OPTIONS]

Options:
      --full  Delete the whole session.json (including key material - rejoin needs register or five-keys)
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `login` {#cmd-login}

通过浏览器授权或终端密码/TOTP 登录并验证解密材料，完成后由宿主切换账户。

调用边界：`HOST`.

宿主 CLI 参数模板（不是 RPC 调用）：`["--json","login"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Log in through browser authorization, or use --interactive for password and TOTP prompts. Address defaults to the last server this machine used (kept in session.json by register/logout). Missing user/password drops into an interactive prompt (TTY only)

Usage: rsrs login [OPTIONS]

Options:
      --addr <ADDR>


      --json
          Machine-readable output: JSON only, without human progress

      --user <USER>


      --pass <PASS>


      --super <SUPER_PASS>


      --interactive
          Choose OAuth or password/TOTP in this terminal (a supplied --pass selects password login)

      --oauth
          Explicitly select browser authorization (also the default)

      --dashboard <DASHBOARD>
          Dashboard origin for a custom server

      --no-open
          Display the authorization URL without opening a browser

      --migrate-local
          Copy selected local memories into this server account without plaintext export files

  -h, --help
          Print help (see a summary with '-h')

Vault recovery: cloud authorization does not decrypt memories. Use the existing recovery code or a trusted device's keys-export, then retry login. Missing or incorrect recovery material must not replace the selected account. super-reset rotates an already unlocked vault; it cannot recover a lost data key. keygen --force switches to unrelated offline keys and is not cloud recovery. If all recovery material is lost, existing encrypted data cannot be recovered by resetting a password. See docs/vault-recovery.md.
```

</details>

### `share` {#cmd-share}

把指定子树导出为可交给其他 agent 的明文提示词；分享前取得授权。

调用边界：`RPC`.

结果包含明文子树素材。--raw 是终端展示模式；RPC 仍返回捕获的信封，不会变成原始 stdout 流。返回的信封 command 可能为 share-export。

RPC `args` 模板：`["--json","share"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Share a subtree: emit a prompt another AI can paste (payload is plaintext; the other AI imports from the prompt)

Usage: rsrs share [OPTIONS]

Options:
      --json         Machine-readable output: JSON only, without human progress
      --root <ROOT>  Subtree root (8-char prefix ok); default is this machine's scope root, else error
      --raw          Print only the prompt body (pipes/clipboard), no hint lines
      --out <OUT>    Write a file instead of printing (prefer <file>.txt with the full prompt)
  -h, --help         Print help
```

</details>

### `share-import` {#cmd-share-import}

读取分享文件并给出挂靠候选；go 才导入，force 明确绕过冲突而建同级项。

调用边界：`RPC`.

RPC `args` 模板：`["--json","share-import","<FILE>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Import a shared subtree: without --go, print attach-candidate bill (for the AI to judge); --go writes the store

Usage: rsrs share-import [OPTIONS] <FILE>

Arguments:
  <FILE>  Share text file (full prompt or bare payload)

Options:
      --json             Machine-readable output: JSON only, without human progress
      --parent <PARENT>  Attach point: hang this subtree under that existing memory (8-char prefix ok); default is a new root [default: ""]
      --go               Write switch: omit to only print the candidate bill
      --title <TITLE>    Override the root title (default = the sharer's original title)
      --force            Bypass Core-reported conflicts and explicitly create a sibling entry
  -h, --help             Print help
```

</details>

## 配置与集成 {#configuration}

### `agent-config` {#cmd-agent-config}

读取 agent.json，或以 set 修改行为和服务模式；不能用它绕过团队只读权限。

调用边界：`ADMIN`.

RPC `args` 模板：`["--json","agent-config"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
AI behavior config (agent.json): no args = print the whole file (AI reads it to decide); --set key=value writes a key

Usage: rsrs agent-config [OPTIONS]

Options:
      --json       Machine-readable output: JSON only, without human progress
      --set <SET>  Set a key, format key=value (e.g. diary_mode=verbose)
  -h, --help       Print help
```

</details>

### `config` {#cmd-config}

读取或修改数据目录、服务地址、自动同步、自动整理和 RPC 并行设置。

调用边界：`ADMIN`.

可以通过 RPC 读取配置。data-dir 和账户或服务身份变更交由宿主协调。rpc-parallelism 在宿主重启后生效；客户端环境变量不会改变已运行的 worker 数量。

RPC `args` 模板：`["--json","config"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
View/set local config (client.json: data dir / server address / auto-sync / auto-cure)

Usage: rsrs config [OPTIONS]

Options:
      --data-dir <DATA_DIR>
          Set the data directory (absolute path; empty string clears back to default ~/.rsrs)
      --json
          Machine-readable output: JSON only, without human progress
      --addr <ADDR>
          Set the server address
      --autosync <AUTOSYNC>
          Set post-write auto-sync [possible values: true, false]
      --cure-auto <CURE_AUTO>
          Set periodic auto-cure [possible values: true, false]
      --rpc-parallelism <RPC_PARALLELISM>
          Max concurrent ordinary runtime jobs. 0 follows available CPU parallelism; explicit values cannot exceed it. Applies after runtime restart
  -h, --help
          Print help
```

</details>

### `classify-config` {#cmd-classify-config}

读取或设置分类后端与模型；key-stdin 从宿主标准输入保存 API key。

调用边界：`ADMIN`.

--key-stdin 明确拒绝通过 RPC 执行。凭据仅通过获授权的宿主终端和 keyring 流程提供，不要把真实 key 填入这些请求示例。

RPC `args` 模板：`["--json","classify-config"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Inspect or configure classification without running a model

Usage: rsrs classify-config [OPTIONS]

Options:
      --backend <BACKEND>    [possible values: jev, ds]
      --json                 Machine-readable output: JSON only, without human progress
      --api-base <API_BASE>
      --model <MODEL>
      --set                  Persist the selected backend and optional endpoint/model
      --key-stdin            Read one API key from redirected stdin and store it in the OS keyring
  -h, --help                 Print help
```

</details>

### `inject` {#cmd-inject}

列出、预览、安装或移除外部工具配置；写入的是宿主文件，不是客户端文件。

调用边界：`ADMIN`.

非交互集成使用 --targets、--id 和 --preview。--tui 需要终端。Codex 修改可用 --expected 校验预览版本。文件在宿主读写，hook 或注入可能影响其他应用。

RPC `args` 模板：`["--json","inject","--targets"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Distribute the inject source: --targets lists 14 hosts; --id <target> injects; --remove --id <target> uninstalls; no args in a TTY opens the picker

Usage: rsrs inject [OPTIONS]

Options:
      --json                 Machine-readable output: JSON only, without human progress
      --targets
      --tui                  Force the interactive TUI picker (errors if there is no TTY)
      --all                  Inject every detected target (skip the TUI; same as no-args when there is no TTY)
      --id <ID>              Target id (dsh/opencode/codex/claude/codebuddy/workbuddy/kylinbot/pi/zigcode/deepseek/qwen/doubao/generic)
      --remove
      --preview              Preview a Codex inject or uninstall without writing (requires --id codex)
      --expected <EXPECTED>  Apply only if the config still matches this preview revision (requires --id codex)
  -h, --help                 Print help
```

</details>

### `plugin` {#cmd-plugin}

列出插件 hook 配置，或显式触发指定事件；test 可能执行本机插件。

调用边界：`ADMIN`.

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Plugin hooks (plugins.json): list shows config; test <EVENT> fires an event

Usage: rsrs plugin [OPTIONS] <COMMAND>

Commands:
  list  List hooks configured in plugins.json (event -> command/timeout/failure policy)
  test  Fire one event to verify a plugin (--payload is business JSON; a test hook need not actually write the store)
  help  Print this message or the help of the given subcommand(s)

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `plugin list` {#cmd-plugin-list}

调用边界：`ADMIN`.

RPC `args` 模板：`["--json","plugin","list"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
List hooks configured in plugins.json (event -> command/timeout/failure policy)

Usage: rsrs plugin list [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `plugin test` {#cmd-plugin-test}

调用边界：`ADMIN`.

RPC `args` 模板：`["--json","plugin","test","<EVENT>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Fire one event to verify a plugin (--payload is business JSON; a test hook need not actually write the store)

Usage: rsrs plugin test [OPTIONS] <EVENT>

Arguments:
  <EVENT>  Event name: pre-remember | post-remember | post-recall | post-forget | post-sync

Options:
      --json               Machine-readable output: JSON only, without human progress
      --payload <PAYLOAD>  Business payload JSON (default {}); combined with event name/timestamp into the full event on plugin stdin [default: {}]
  -h, --help               Print help
```

</details>

### `mcp` {#cmd-mcp}

启动 stdio MCP 适配器；运行时另行提供 HTTP/SSE 适配器，不应嵌套在 RPC 命令中启动。

调用边界：`HOST`.

宿主 CLI 参数模板（不是 RPC 调用）：`["--json","mcp"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
MCP server over stdio JSON-RPC. The internal runtime serves HTTP/SSE at `/mcp` and `/sse`

Usage: rsrs mcp [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `web` {#cmd-web}

在宿主打开托管控制台或返回其 URL；它不是本地 Web 服务启动命令。

调用边界：`HOST`.

宿主 CLI 参数模板（不是 RPC 调用）：`["--json","web"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Open the hosted user dashboard without starting the local runtime

Usage: rsrs web [OPTIONS]

Options:
      --json     Machine-readable output: JSON only, without human progress
      --no-open  Report https://dash.rsrs.rs without opening a browser
  -h, --help     Print help
```

</details>

## 模型与索引 {#models}

### `model` {#cmd-model}

安装、激活、选择、探测或卸载 BGE-M3 与推理后端；部分恢复操作仅供宿主。

调用边界：`RPC`.

install 下载或校验文件，不激活索引；activate 校验并激活重建的索引。install-m3/uninstall-m3 是别名。reset-cpu 与 install-engines 明确要求宿主执行。engine 修改配置，probe 执行真实推理。

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Model management: install, verify or uninstall BGE-M3

Usage: rsrs model [OPTIONS] <COMMAND>

Commands:
  install          Download or verify BGE-M3 without rebuilding the index [alias: install-m3]
  activate         Build a resumable index generation and activate it after complete validation
  reset-cpu        Force CPU and terminate the runtime, even when inference or RPC is stuck
  engine           Show or select inference engine. Failures do not switch engines; default CPU
  install-engines  Install compatible NPU execution providers through Windows ML
  probe            Run real BGE-M3 inference and report the selected backend
  uninstall        Delete the user-installed BGE-M3 files [alias: uninstall-m3]
  help             Print this message or the help of the given subcommand(s)

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `model install` {#cmd-model-install}

调用边界：`RPC`.

RPC `args` 模板：`["--json","model","install"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Download or verify BGE-M3 without rebuilding the index

Usage: rsrs model install [OPTIONS]

Options:
      --json             Machine-readable output: JSON only, without human progress
      --mirror <MIRROR>
  -h, --help             Print help
```

</details>

#### `model activate` {#cmd-model-activate}

调用边界：`RPC`.

RPC `args` 模板：`["--json","model","activate","<MODEL>"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Build a resumable index generation and activate it after complete validation

Usage: rsrs model activate [OPTIONS] <MODEL>

Arguments:
  <MODEL>  [possible values: m3]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `model reset-cpu` {#cmd-model-reset-cpu}

调用边界：`HOST`.

宿主 CLI 参数模板（不是 RPC 调用）：`["--json","model","reset-cpu"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Force CPU and terminate the runtime, even when inference or RPC is stuck

Usage: rsrs model reset-cpu [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `model engine` {#cmd-model-engine}

调用边界：`RPC`.

RPC `args` 模板：`["--json","model","engine"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Show or select inference engine. Failures do not switch engines; default CPU

Usage: rsrs model engine [OPTIONS] [ENGINE]

Arguments:
  [ENGINE]  [possible values: npu, gpu, cpu]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `model install-engines` {#cmd-model-install-engines}

调用边界：`HOST`.

宿主 CLI 参数模板（不是 RPC 调用）：`["--json","model","install-engines"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Install compatible NPU execution providers through Windows ML

Usage: rsrs model install-engines [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `model probe` {#cmd-model-probe}

调用边界：`RPC`.

RPC `args` 模板：`["--json","model","probe"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Run real BGE-M3 inference and report the selected backend

Usage: rsrs model probe [OPTIONS]

Options:
      --json           Machine-readable output: JSON only, without human progress
      --model <MODEL>  [possible values: m3]
      --text <TEXT>    Text to compare against the CPU baseline, including long-input checks [default: 本地推理引擎验证：记忆检索]
  -h, --help           Print help
```

</details>

#### `model uninstall` {#cmd-model-uninstall}

调用边界：`RPC`.

RPC `args` 模板：`["--json","model","uninstall"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Delete the user-installed BGE-M3 files

Usage: rsrs model uninstall [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `reembed` {#cmd-reembed}

按当前模型重新计算嵌入，属于长时间的索引写入。

调用边界：`RPC`.

RPC `args` 模板：`["--json","reembed"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Recompute all embeddings (for embedder upgrades / dim changes; re-embed by semantics)

Usage: rsrs reembed [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

## 宿主生命周期 {#lifecycle}

### `runtime` {#cmd-runtime}

管理前台运行、启动、停止、重启和当前用户登录自启动；查询与修改的边界不同。

调用边界：`HOST`.

runtime status 与 runtime autostart status 读取已有状态。run/start/stop/restart 和 autostart enable/disable/remove 明确拒绝在 worker 中执行。自启动只对当前用户生效，需主动启用；--now 与 --stop 增加立即启停的效果。这些操作不安装系统服务。

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Host-owned foreground runtime and opt-in current-user sign-in startup

Usage: rsrs runtime [OPTIONS] <COMMAND>

Commands:
  run        Serve in the foreground; service managers supervise this process
  start      Start the host through its configured lifecycle owner
  stop       Stop the owned host without automatic resurrection
  restart    Drain and restart the owned host through its configured lifecycle owner
  status     Inspect the existing host without creating a profile or starting it
  autostart  Manage opt-in current-user sign-in startup; never installs a system service
  help       Print this message or the help of the given subcommand(s)

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `runtime run` {#cmd-runtime-run}

调用边界：`HOST`.

宿主 CLI 参数模板（不是 RPC 调用）：`["--json","runtime","run"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Serve in the foreground; service managers supervise this process

Usage: rsrs runtime run [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `runtime start` {#cmd-runtime-start}

调用边界：`HOST`.

宿主 CLI 参数模板（不是 RPC 调用）：`["--json","runtime","start"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Start the host through its configured lifecycle owner

Usage: rsrs runtime start [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `runtime stop` {#cmd-runtime-stop}

调用边界：`HOST`.

宿主 CLI 参数模板（不是 RPC 调用）：`["--json","runtime","stop"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Stop the owned host without automatic resurrection

Usage: rsrs runtime stop [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `runtime restart` {#cmd-runtime-restart}

调用边界：`HOST`.

宿主 CLI 参数模板（不是 RPC 调用）：`["--json","runtime","restart"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Drain and restart the owned host through its configured lifecycle owner

Usage: rsrs runtime restart [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `runtime status` {#cmd-runtime-status}

调用边界：`ADMIN`.

RPC `args` 模板：`["--json","runtime","status"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Inspect the existing host without creating a profile or starting it

Usage: rsrs runtime status [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `runtime autostart` {#cmd-runtime-autostart}

调用边界：`HOST`.

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Manage opt-in current-user sign-in startup; never installs a system service

Usage: rsrs runtime autostart [OPTIONS] <COMMAND>

Commands:
  enable   Register current-user sign-in startup; start now only with --now
  disable  Disable future sign-in startup; stop the existing host only with --stop
  remove   Remove only this installation's startup registration; preserve data and keys
  status   Read registration and runtime status without changing either
  help     Print this message or the help of the given subcommand(s)

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `runtime autostart enable` {#cmd-runtime-autostart-enable}

调用边界：`HOST`.

宿主 CLI 参数模板（不是 RPC 调用）：`["--json","runtime","autostart","enable"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Register current-user sign-in startup; start now only with --now

Usage: rsrs runtime autostart enable [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
      --now
  -h, --help  Print help
```

</details>

#### `runtime autostart disable` {#cmd-runtime-autostart-disable}

调用边界：`HOST`.

宿主 CLI 参数模板（不是 RPC 调用）：`["--json","runtime","autostart","disable"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Disable future sign-in startup; stop the existing host only with --stop

Usage: rsrs runtime autostart disable [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
      --stop
  -h, --help  Print help
```

</details>

#### `runtime autostart remove` {#cmd-runtime-autostart-remove}

调用边界：`HOST`.

宿主 CLI 参数模板（不是 RPC 调用）：`["--json","runtime","autostart","remove"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Remove only this installation's startup registration; preserve data and keys

Usage: rsrs runtime autostart remove [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
      --stop
  -h, --help  Print help
```

</details>

#### `runtime autostart status` {#cmd-runtime-autostart-status}

调用边界：`ADMIN`.

RPC `args` 模板：`["--json","runtime","autostart","status"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Read registration and runtime status without changing either

Usage: rsrs runtime autostart status [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `restart` {#cmd-restart}

通过宿主协调重启已有服务；超时只处理已经核实身份的进程。

调用边界：`HOST`.

宿主 CLI 参数模板（不是 RPC 调用）：`["--json","restart"]`

<details>
<summary>全部参数、默认值与帮助</summary>

```text
Restart the resident runtime; kill the verified process if graceful shutdown times out

Usage: rsrs restart [OPTIONS]

Options:
      --json               Machine-readable output: JSON only, without human progress
      --timeout <TIMEOUT>  Seconds to wait for graceful shutdown before force termination [default: 10]
  -h, --help               Print help
```

</details>

## 返回结果与副作用 {#results-and-side-effects}

所有 RPC 业务调用仍返回接入页所述的两层响应。下表说明各类结果应如何使用，不是把变化中的业务详情伪装成固定 schema。必须检查实际版本、status、summary、errors、actions 和 details；可选字段缺失时不要编造默认成功。

| 功能 | 返回内容与处理 |
| --- | --- |
| `status`, `doctor`, `audit`, `witness` | 摘要与诊断行；必须处理警告和失败 |
| `recall`, `list`, `show`, `chain`, `tree` | summary/items/details 中允许公开的记录和关系；titles 模式主动省略正文 |
| `remember`, `update`, `retitle`, `attach`, `forget`, `restore` | 动作、ID、版本或待决事项；不能只凭退出码认定写入 |
| `diary`, `diary-search`, `diary-fragment` | 时间线或片段，以及定位、来源版本和预算元数据 |
| `resort`, `split`, `classify`, `tree-deepen`, `tree-cure`, `tree-float` | 计划或应用报告；需要区分是否传入执行选项 |
| `sync`, `sync-conflicts`, `sync-history`, `sync-resolve`, `sync-restore` | 数量、保留版本、明确冲突决策，或等待同步的状态 |
| `snapshot` | summary.action 和快照详情；create/list 可能报告见证损坏或部分快照问题 |
| `model`, `reembed` | 文件或索引状态、选定引擎或推理探测；已安排准备不等于完成 |
| `query-log`, `run-log`, `bench` | 查询、明确结果和评测指标；不因请求成功而自动认定反馈 |
| `import`, `export`, `backup`, `extract`, `share-import` | 路径、数量与逐项结果；路径指向宿主，不是文件传输正文 |
| `grant`, `session`, `account`, `space` | 按动作返回身份和授权详情；授权和邀请可能包含凭据 |
| `secret`, `keys-export`, `super-reset` | 明确的敏感输出，不能按普通诊断命令处理 |
| `book-material`, `portrait-material`, `share` | 明文素材或提示词；command 字段可能与 CLI 名称不同 |
| `agent-config`, `config`, `classify-config`, `inject`, `plugin` | 配置、目标文件操作或 hook 结果；可能产生外部副作用 |

## 健康检查与后台任务字段 {#health-and-background-fields}

以下字段来自 DEV 参考版本；旧版本可能缺失。它们提供诊断，不构成稳定的业务记录 schema。推理对象由后端返回，接入方必须兼容新增字段、空值和明确错误，不依赖未文档化的 Core 内部结构。

| 字段 | 含义 |
| --- | --- |
| `server`, `v`, `bin`, `pid` | 运行时身份、协议、二进制版本和进程 ID |
| `url`, `exe`, `data_dir` | 绑定 URL、可执行文件和选定记忆库路径 |
| `store_ready`, `installation_root` | DEV 存储就绪标记和安装级资源根 |
| `managed_id`, `credential_state`, `snapshot_restore_id` | DEV 托管、凭据与恢复诊断；字段可选或为 null |
| `recall_statistics.pending` | 排队中的召回统计写入 |
| `recall_statistics.enqueued`, `recall_statistics.persisted` | 已接收与已持久化的统计计数 |
| `recall_statistics.rejected`, `recall_statistics.failed` | 被拒绝与失败的统计计数 |
| `retrieval_index.state`, `retrieval_index.scheduled` | 索引阶段和是否已请求下一轮后台处理 |
| `retrieval_index.worker_active`, `retrieval_index.running` | 索引 worker 是否存在及当前是否执行 |
| `retrieval_index.error`, `retrieval_index.model_setup` | 索引或准备错误及安装提示，不会把错误改为成功 |
| `inference` | 后端提供的全局推理状态，可能包含 host_recovery_required；不是单条命令的进度 |
| `rpc.available_parallelism`, `rpc.effective_parallelism` | 检测到的 CPU 并行度和已配置 worker 容量 |
| `rpc.ordinary_running`, `rpc.lightweight_running`, `rpc.lightweight_capacity` | 普通与轻量请求占用及轻量容量 |
| `rpc.queue_wait_timeout_secs`, `rpc.queue_cancelled` | 排队接纳期限和取消计数 |
| `rpc.queued_or_cancelled_pending_removal`, `rpc.executing_until_reply` | 等待移除的排队或取消请求，以及保留执行槽直至消费响应的请求数 |
| `rpc.recent_timing_micros`, `rpc.timing_scope` | 近期排队与执行耗时诊断及测量范围 |

`runtime.result` 的 `envelope.summary` 包含 `request_id`、`state`、`response` 和 `retention`；完成后取原始 `response`，pending 时等待，unknown 时先核实业务状态。`model.prepare` 与 `index.prepare` 的结果使用上表的索引状态字段。`model.control` 返回 `active`，匹配任务时还含 `id`、`phase`、`item`、`done`、`total`、`elapsed`、`idle` 和 `cancelled`；任务 ID 不匹配会报告 `stale`。`cli.progress` 的阶段数据与全局 `inference` 分开，不能将全局等待数当成当前命令的队列位置。

## 完整 MCP 适配器 {#mcp-adapter}

本节说明同一 runtime 提供的另一个协议。MCP 使用 JSON-RPC 2.0，与 `/api/rpc` 的自定义信封不同。stdio 模式由宿主执行 `rsrs mcp`，每行一个 JSON 对象；客户端模式只连接已有 runtime。HTTP 使用 `/mcp` 或 `/sse`，受相同的实际对端、Host、Origin 检查。

该版本实现 `initialize`、`tools/list`、`tools/call` 和 `ping`，报告协议版本 `2025-03-26`。通知不产生普通响应。HTTP POST 默认返回 JSON；`Accept: text/event-stream` 返回 message 事件，GET 返回包含实际绑定端点的 endpoint 事件。不要据此假设存在持久会话、服务端主动订阅、通用取消、分页或事件重放。HTTP 适配器可接受批量帧，自定义 RPC 不使用该批量格式。

成功调用把业务信封编码为 `result.content[0].text` 中的 JSON 字符串。`result.isError` 只标记适配器/工具调用失败；值为 false 时业务 `status` 仍可能为 fail 或 pending。先检查 JSON-RPC error 和 isError，再解析 text 并判断业务状态。结果还包含 `memory_context`，明确记忆是历史参考，不是工具授权。

以下请求模板只用于 MCP 端点，不能发送到 `/api/rpc`：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-03-26",
    "capabilities": {},
    "clientInfo": {
      "name": "example-client",
      "version": "1.0"
    }
  }
}
```

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list",
  "params": {}
}
```

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "memory_status",
    "arguments": {}
  }
}
```

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "ping"
}
```

默认目录有 18 个工具，其中 `memory_forget` 和 `memory_restore` 默认关闭。宿主通过 `RSRS_MCP_ALLOW` 与 `RSRS_MCP_DENY` 指定逗号分隔的名称；DENY 优先。ALLOW 中的 `all` 或 `*` 仍不开放这两个敏感工具，需要显式列名。非法名称或空项会报错。旧变量 `RSRS_MCP_ALLOW_TOOLS` 与 `RSRS_MCP_DENY_TOOLS` 仅在对应新变量未设置时兼容。

只读模式只保留读取工具；暂停模式只保留 memory_status，ALLOW 不能绕过服务模式。merge_ids 合并还要求 memory_forget 权限。以实际 tools/list 为准，不要硬编码显示工具数量。直接 RPC 不受这些 MCP allow/deny 过滤限制，集成方仍需执行自己的权限控制。

当前 `memory_query_log_mark` 只转发 ids/good/bad，不转发 query-log-id/source。需要显式查询身份的反馈流程应使用 `cli.exec query-log mark`；不要把这个工具当成完整 CLI 参数集。以下为该版本全部工具及原始 inputSchema；必填项在 required 中列出，运行时还有上文说明的权限和语义校验。

### `memory_status` {#tool-memory-status}

读取记忆库与运行状态。

<details>
<summary>inputSchema</summary>

```json
{
  "type": "object",
  "properties": {}
}
```
</details>

### `memory_extract` {#tool-memory-extract}

扫描或导入本机编码 agent 会话。写入需要 confirm=true；dry_run=true 仅预览。

<details>
<summary>inputSchema</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "One platform (codex/opencode/claude/…); omit for all detected"
    },
    "dry_run": {
      "type": "boolean",
      "description": "Scan and summarize without writing"
    },
    "limit": {
      "type": "integer",
      "minimum": 0,
      "description": "Maximum sessions to import per source (newest first)"
    },
    "since": {
      "type": "string",
      "description": "today|yesterday|7d|YYYY-MM-DD"
    },
    "importance": {
      "type": "string",
      "enum": [
        "important",
        "trivial"
      ]
    },
    "parent": {
      "type": "string",
      "description": "Attach imported memories under this parent (id / tree / anchor title)"
    },
    "confirm": {
      "type": "boolean",
      "description": "Required to write (omit only with dry_run=true)"
    }
  }
}
```
</details>

### `memory_remember` {#tool-memory-remember}

保存记忆、合并、替代或关联；合并还需要删除权限。

<details>
<summary>inputSchema</summary>

```json
{
  "type": "object",
  "properties": {
    "content": {
      "type": "string",
      "description": "Memory body; prefer cause, action, and effect sections"
    },
    "title": {
      "type": "string"
    },
    "importance": {
      "type": "string",
      "enum": [
        "important",
        "trivial"
      ]
    },
    "parent": {
      "type": "string",
      "description": "Parent id or catalog title"
    },
    "force": {
      "type": "boolean"
    },
    "merge_ids": {
      "type": "string",
      "description": "Comma-separated ids to merge into this content"
    },
    "supersedes": {
      "type": "string",
      "description": "Live important memory replaced by this conclusion"
    },
    "see_also": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Live important memories to link bidirectionally"
    },
    "type": {
      "type": "string",
      "description": "Memory kind; default context"
    }
  },
  "required": [
    "content"
  ]
}
```
</details>

### `memory_recall` {#tool-memory-recall}

语义召回，可选择是否包含关联。

<details>
<summary>inputSchema</summary>

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string"
    },
    "limit": {
      "type": "integer",
      "description": "Default 20"
    },
    "related": {
      "type": "boolean",
      "default": true
    }
  },
  "required": [
    "query"
  ]
}
```
</details>

### `memory_list` {#tool-memory-list}

列出近期记忆。

<details>
<summary>inputSchema</summary>

```json
{
  "type": "object",
  "properties": {
    "limit": {
      "type": "integer",
      "description": "Default 10"
    }
  }
}
```
</details>

### `memory_show` {#tool-memory-show}

读取指定条目和因果上下文。

<details>
<summary>inputSchema</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    }
  },
  "required": [
    "id"
  ]
}
```
</details>

### `memory_update` {#tool-memory-update}

更新条目字段。

<details>
<summary>inputSchema</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "title": {
      "type": "string"
    },
    "content": {
      "type": "string"
    },
    "tags": {
      "type": "string"
    },
    "kind": {
      "type": "string"
    },
    "importance": {
      "type": "string",
      "enum": [
        "important",
        "trivial"
      ]
    }
  },
  "required": [
    "id"
  ]
}
```
</details>

### `memory_attach` {#tool-memory-attach}

显式修改父条目。

<details>
<summary>inputSchema</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "Child id"
    },
    "parent": {
      "type": "string"
    }
  },
  "required": [
    "id",
    "parent"
  ]
}
```
</details>

### `memory_tree` {#tool-memory-tree}

读取森林、子树或目录。

<details>
<summary>inputSchema</summary>

```json
{
  "type": "object",
  "properties": {
    "from": {
      "type": "string"
    },
    "outline": {
      "type": "boolean"
    },
    "depth": {
      "type": "integer"
    }
  }
}
```
</details>

### `memory_history` {#tool-memory-history}

读取条目修改审计。

<details>
<summary>inputSchema</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "limit": {
      "type": "integer"
    }
  }
}
```
</details>

### `memory_diary_search` {#tool-memory-diary-search}

在预算内检索跨日期日记片段。

<details>
<summary>inputSchema</summary>

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "minLength": 1,
      "maxLength": 500
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 20
    },
    "max_chars": {
      "type": "integer",
      "minimum": 512,
      "maximum": 12000
    },
    "mode": {
      "type": "string",
      "enum": [
        "lexical",
        "hybrid"
      ]
    }
  },
  "required": [
    "query"
  ],
  "additionalProperties": false
}
```
</details>

### `memory_diary_fragment` {#tool-memory-diary-fragment}

读取片段及可选的紧邻片段；旧定位失效时返回错误。

<details>
<summary>inputSchema</summary>

```json
{
  "type": "object",
  "properties": {
    "source_id": {
      "type": "string"
    },
    "fragment_id": {
      "type": "string"
    },
    "neighbors": {
      "type": "integer",
      "minimum": 0,
      "maximum": 1
    },
    "max_chars": {
      "type": "integer",
      "minimum": 512,
      "maximum": 12000
    }
  },
  "required": [
    "source_id",
    "fragment_id"
  ],
  "additionalProperties": false
}
```
</details>

### `memory_diary` {#tool-memory-diary}

读取时间线，包含日记区域。

<details>
<summary>inputSchema</summary>

```json
{
  "type": "object",
  "properties": {
    "limit": {
      "type": "integer"
    },
    "date": {
      "type": "string"
    },
    "from": {
      "type": "string"
    },
    "to": {
      "type": "string"
    },
    "contains": {
      "type": "string"
    }
  }
}
```
</details>

### `memory_chain` {#tool-memory-chain}

读取祖先、当前条目与后代。

<details>
<summary>inputSchema</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    },
    "depth": {
      "type": "integer",
      "description": "Default 3"
    }
  },
  "required": [
    "id"
  ]
}
```
</details>

### `memory_query_log_mark` {#tool-memory-query-log-mark}

对召回候选给出明确采用或拒绝反馈；当前适配器有参数限制，见下文。

<details>
<summary>inputSchema</summary>

```json
{
  "type": "object",
  "properties": {
    "ids": {
      "type": "string",
      "description": "Comma-separated ids; 8-char prefixes ok"
    },
    "good": {
      "type": "boolean"
    },
    "bad": {
      "type": "boolean"
    }
  },
  "required": [
    "ids"
  ]
}
```
</details>

### `memory_forget` {#tool-memory-forget}

写删除标记并同步；默认不开放。

<details>
<summary>inputSchema</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    }
  },
  "required": [
    "id"
  ]
}
```
</details>

### `memory_restore` {#tool-memory-restore}

恢复有保留正文的已删除条目；默认不开放。

<details>
<summary>inputSchema</summary>

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string"
    }
  },
  "required": [
    "id"
  ]
}
```
</details>

### `memory_taxonomy` {#tool-memory-taxonomy}

只读取内置 23 类目录，不执行 ensure。

<details>
<summary>inputSchema</summary>

```json
{
  "type": "object",
  "properties": {}
}
```
</details>

## 隐藏控制项与保留接口 {#hidden-and-reserved-controls}

完整功能目录不等于对内部接口作兼容承诺。以下控制项虽不全部出现在普通 help 中，但需要在集成边界中说明。分类控制项属于该参考版本的高级参数，可能变化；不要依赖未发布的调参接口。编译时原生故障注入方法和 Core 私有 ABI 不属于第三方 RPC 功能。

| 控制项 | 作用与边界 |
| --- | --- |
| `--progress-id` | cli.progress 使用的集成 ID，与 RPC 请求 ID 独立 |
| `--model-task-id` | model.control 要匹配的模型任务 ID |
| `classify --samples` | 请求的分类样本数；默认 5 |
| `classify --batch` | 请求的树分类批量大小；默认 12 |
| `classify --tree-depth` | 所选树的最大深度；默认 2 |
| `classify --min-kids` | 因果分段所需的最小子节点数；默认 3 |
| `classify --segments` | 因果片段上限；默认 0 表示全部 |
| `classify --rounds` | 自动改挂轮数上限；默认 5 |
| `--client-only`, `--direct`, `--runtime-internal` | 宿主 CLI 预解析标志，不是 cli.exec 参数；--direct 不授予另起写入者的权限 |
| `--managed`, `--installation-root`, `--supervised-child` | 保留给 runtime run 引导过程，由宿主管理器使用 |
| `lifecycle` | 保留给宿主协调的 RPC 请求字段，不是授权凭据 |

[Runtime RPC](runtime-rpc.md) · [CLI JSON API](cli-api.md) · [Runtime](runtime.md)
