# Runtime RPC command reference

This reference covers all **82 top-level commands, 32 subcommands** and **18 MCP tools** in the published **1.0.17-dev.14** release. See [Runtime RPC](runtime-rpc.md) for transport fields and runnable clients.

Arguments, defaults, accepted values and aliases below are the release binary's per-command help, checked against its published SHA-256 build manifest. The original help is retained with only trailing whitespace removed so it can be compared with an installed binary. `<VALUE>` denotes a placeholder you must replace; templates are not a script to execute in bulk.

This is the complete catalog for the inspected version, not a claim that every command exists in the older stable baseline. DEV diary-fragment, snapshot, feedback, witness and host-management features require checking the running `bin`; `v: 1` alone is insufficient.

## Calling boundaries

| Label | Meaning |
| --- | --- |
| `RPC` | Send an argument array through `cli.exec`; account rights, service modes, validation and operation authorization still apply. |
| `ADMIN` | Includes configuration, identity, external-file or plugin operations. Use the read subset for integration and review each mutation. |
| `HOST` | A third-party client should delegate this to the host. Explicitly rejected RPC branches are identified below; this label itself is not a server ACL. |

RPC argument arrays omit the executable name and contain `--json`, command, subcommand and arguments. All paths resolve on the **runtime host**: import, export, backup, snapshot, retitle-many, share-import, extract and injection do not upload or download client files. Do not send stdin, TTY, shell pipes or interactive pickers. Closing an HTTP connection cannot cancel a command that has no dedicated cancellation API.

Read each purpose and boundary, then expand the original help for all arguments. `--yes`, `--go`, `--confirm` and `--force` have different meanings; do not add them automatically just to obtain success. HTTP 200, exit 0 or absent error prose cannot replace checking the business outcome.

<details>
<summary>Global options and command index (release help)</summary>

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

## Diagnostics and status {#diagnostics}

### `status` {#cmd-status}

Status.

Calling boundary: `RPC`.

RPC `args` template: `["--json","status"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
Status

Usage: rsrs status [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `memory-revision` {#cmd-memory-revision}

Read the initialized library's opaque snapshot token without loading a model.

Calling boundary: `RPC`.

RPC `args` template: `["--json","memory-revision"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
Read the initialized library's opaque snapshot token without loading a model

Usage: rsrs memory-revision [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `capabilities` {#cmd-capabilities}

Report supported CLI capabilities without a profile, runtime or model download.

Calling boundary: `RPC`.

RPC `args` template: `["--json","capabilities"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
Report supported CLI capabilities without a profile, runtime or model download

Usage: rsrs capabilities [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `v` {#cmd-v}

Print the embedded CLI version (same as --version / -v).

Calling boundary: `RPC`.

RPC `args` template: `["--json","v"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
Print the embedded CLI version (same as `--version` / `-v`)

Usage: rsrs v [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `prompt` {#cmd-prompt}

Read the full memory workflow before storing or maintaining memories.

Calling boundary: `RPC`.

RPC `args` template: `["--json","prompt"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
Read the full memory workflow before storing or maintaining memories

Usage: rsrs prompt [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `doctor` {#cmd-doctor}

Self-check: model/store/lock/remote/inject/scope in one pass (first stop for install issues).

Calling boundary: `RPC`.

RPC `args` template: `["--json","doctor"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Whole-store health audit: orphans / illegal importance / duplicate titles / truncated titles / deep chains; structured report for an AI audit.

Calling boundary: `RPC`.

RPC `args` template: `["--json","audit"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
Whole-store health audit: orphans / illegal importance / duplicate titles / truncated titles / deep chains; structured report for an AI audit

Usage: rsrs audit [OPTIONS]

Options:
      --json  JSON output (client/AI consumption)
  -h, --help  Print help
```

</details>

### `witness` {#cmd-witness}

Verify the local ciphertext-digest witness chain (not an external trust anchor).

Calling boundary: `RPC`.

RPC `args` template: `["--json","witness"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Memory passport: ASCII-art card (user / memory count / connected agents / devices) for sharing.

Calling boundary: `RPC`.

RPC `args` template: `["--json","passport"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
Memory passport: ASCII-art card (user / memory count / connected agents / devices) for sharing

Usage: rsrs passport [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `history` {#cmd-history}

Entry change history (audit stream: create/update/delete/restore/purge; SQLite triggers record it).

Calling boundary: `RPC`.

RPC `args` template: `["--json","history"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Check npm for a newer CLI (24h throttle; --force skips it; --clear drops the cache).

Calling boundary: `RPC`.

RPC `args` template: `["--json","update-check"]`

<details>
<summary>All arguments, defaults and help</summary>

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

## Read and retrieve {#retrieval}

### `recall` {#cmd-recall}

Semantic recall through the private Core.

Calling boundary: `RPC`.

RPC `args` template: `["--json","recall","<QUERY>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

List recent entries.

Calling boundary: `RPC`.

RPC `args` template: `["--json","list"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Show one entry in full (cause/effect complete, not truncated).

Calling boundary: `RPC`.

RPC `args` template: `["--json","show","<ID>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Causal-chain deep dive: fetch the whole chain at once - ancestor bodies (root first) + this entry + descendants to --depth. After an AI sees a cause-chain name, it can dig without layer-by-layer show.

Calling boundary: `RPC`.

RPC `args` template: `["--json","chain","<ID>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Causal tree: render a subtree (--from start, default root forest); --outline prints a full-depth id+title directory (AI tidy reads this first).

Calling boundary: `RPC`.

RPC `args` template: `["--json","tree"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Diary = whole-store time chain (the trivial zone is merged in; not filtered by importance): recent (--limit), a day (--date, today/yesterday), a range (--from/--to inclusive), keyword (--contains).

Calling boundary: `RPC`.

RPC `args` template: `["--json","diary"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Explicit cross-date diary fragment retrieval; never changes normal recall.

Calling boundary: `RPC`.

Query length is at most 500 Unicode scalars; limit is 1–20 and max-chars is 512–12000. Budget includes metadata and JSON escaping. truncated can mean budget exhaustion; semantic_ready=false is incomplete semantic coverage, not an indexing wait instruction.

RPC `args` template: `["--json","diary-search","<QUERY>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Read one immutable diary fragment locator and optional immediate neighbors.

Calling boundary: `RPC`.

neighbors is 0 or 1. Preserve source_id, fragment_id and source_version. Offsets are Unicode scalar positions, not JavaScript UTF-16 indexes. If the source changed, search once again for a current locator; do not silently read the full diary instead.

RPC `args` template: `["--json","diary-fragment","<SOURCE_ID>","<FRAGMENT_ID>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Book material: a root subtree -&gt; volume/chapter full text (for an AI to draft).

Calling boundary: `RPC`.

The result envelope uses command tree-material and details.material; do not derive the envelope command mechanically from the CLI spelling.

RPC `args` template: `["--json","book-material","<ROOT>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Portrait material: whole-store portrait aggregate (for an AI to draft a portrait).

Calling boundary: `RPC`.

RPC `args` template: `["--json","portrait-material"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
Portrait material: whole-store portrait aggregate (for an AI to draft a portrait)

Usage: rsrs portrait-material [OPTIONS]

Options:
      --json           Machine-readable output: JSON only, without human progress
      --limit <LIMIT>  [default: 40]
  -h, --help           Print help
```

</details>

## Write, import and preserve {#writes}

### `remember` {#cmd-remember}

Store a memory (local authority store; encrypts + embeds automatically). Judge-then-store (dedup first, then choose): without --force, an internal recall runs first - high similarity -&gt; suggest merge (--merge-ids "id1,id2" deletes old, writes a combined entry); medium -&gt; suggest attach (--parent as cause); no candidate or --force writes directly. --parent = causal attach; parent/child is cause/effect.

Calling boundary: `RPC`.

Inspect the returned action/ID and any pending candidate decision. Merge, supersede and see-also have different effects; merge deletes its sources. A pre-remember hook can return pending without a write.

RPC `args` template: `["--json","remember","<CONTENT>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Update a memory (any of title/body/tags/kind/importance); decrypt, reseal, auto-sync.

Calling boundary: `RPC`.

RPC `args` template: `["--json","update","<ID>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Retitle: decrypt -&gt; change title -&gt; reseal (ciphertext payload updates) -&gt; dirty -&gt; auto-sync.

Calling boundary: `RPC`.

RPC `args` template: `["--json","retitle","<ID>","--title","<TITLE>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Batch retitle (JSON array [{"id":...,"title":...}]; one process, one model load).

Calling boundary: `RPC`.

RPC `args` template: `["--json","retitle-many","<FILE>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Delete (tombstone; propagates with sync).

Calling boundary: `RPC`.

RPC `args` template: `["--json","forget","<ID>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Clear current-version ciphertext; pending operations and unresolved conflicts are kept.

Calling boundary: `RPC`.

RPC `args` template: `["--json","purge","<ID>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Restore a deleted memory by full ID (keeps body and parent; propagates with sync).

Calling boundary: `RPC`.

RPC `args` template: `["--json","restore","<ID>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Import a JSON-array dump: keep fields, rebuild parent links, sync once after the batch.

Calling boundary: `RPC`.

RPC `args` template: `["--json","import","<FILE>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Export the whole store as plaintext JSON (local backup).

Calling boundary: `RPC`.

RPC `args` template: `["--json","export","<FILE>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Back up the local store file (whole SQLite copy, ciphertext and index).

Calling boundary: `RPC`.

RPC `args` template: `["--json","backup","<FILE>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Create or inspect verified local snapshots; never rolls back cloud state.

Calling boundary: `RPC`.

Create/list are runtime operations. Restore/recover are explicitly rejected inside a runtime worker and require the host CLI. Restore quarantines synchronization and never rolls back cloud state. Resume-sync requires the exact reviewed local revision.

<details>
<summary>All arguments, defaults and help</summary>

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

Calling boundary: `RPC`.

RPC `args` template: `["--json","snapshot","create"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Calling boundary: `RPC`.

RPC `args` template: `["--json","snapshot","list"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
List snapshots after validating file digests and SQLite integrity

Usage: rsrs snapshot list [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `snapshot restore` {#cmd-snapshot-restore}

Calling boundary: `HOST`.

Host CLI argument template (not an RPC call): `["--json","snapshot","restore","<ID>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Calling boundary: `HOST`.

Host CLI argument template (not an RPC call): `["--json","snapshot","recover"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Calling boundary: `RPC`.

RPC `args` template: `["--json","snapshot","resume-sync","--reviewed-revision","<REVIEWED_REVISION>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Extract local coding-agent sessions (Codex, OpenCode, Claude Code, …) into rsrs memories.

Calling boundary: `RPC`.

--dry-run and --targets are inspections; --force reimports previously seen sessions, and --include-subagents expands the scan. Imported source paths and session cursors belong to the host. --tui requires a terminal.

RPC `args` template: `["--json","extract","--targets"]`

<details>
<summary>All arguments, defaults and help</summary>

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

## Organize the library {#organization}

### `candidates` {#cmd-candidates}

Judge-then-store candidate bill (read-only): high similarity suggests merge, medium suggests attach, similar candidates suggest merging them.

Calling boundary: `RPC`.

RPC `args` template: `["--json","candidates","<CONTENT>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Attach a child under a parent (explicit attach is intent; no judge-then-store; auto-syncs).

Calling boundary: `RPC`.

RPC `args` template: `["--json","attach","--parent","<PARENT>","<ID>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Causal tree: promote - this entry becomes a more-upstream cause (reattach to grandparent/root; effects follow).

Calling boundary: `RPC`.

RPC `args` template: `["--json","promote","<ID>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Causal tree: demote - attach this entry under --parent as its effect (extends the chain by one; cycle-safe).

Calling boundary: `RPC`.

RPC `args` template: `["--json","demote","--parent","<PARENT>","<ID>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Memory tidy: batch reparent (spec={"ops":[{"id":"child","parent":"parent"}]}; id / first 8 chars / root title all work); dry-run by default, --go writes, auto-syncs, and resets the counter.

Calling boundary: `RPC`.

RPC `args` template: `["--json","resort"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Stock analysis: cluster BGE vectors, flag lone leaves, suggest a tree (read-only).

Calling boundary: `RPC`.

RPC `args` template: `["--json","defrag"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Split a mixed node (AI decides): no flags prints material JSON for the AI to plan; --go --spec '&lt;json&gt;' applies.

Calling boundary: `RPC`.

RPC `args` template: `["--json","split","<ID>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Deepen the tree: cluster flat children of a large root into sub-roots (--root to inspect/apply; --auto deepens every flat large root).

Calling boundary: `RPC`.

RPC `args` template: `["--json","tree-deepen"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Tree hygiene: root-size bill + lone-leaf attach suggestions (read-only; --id --parent actually attaches).

Calling boundary: `RPC`.

RPC `args` template: `["--json","tree-cure"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Heat float: an entry with more hits than its parent becomes the grandparent's child (effects follow; dry-run report, --go applies).

Calling boundary: `RPC`.

RPC `args` template: `["--json","tree-float"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Built-in top-level catalog (20 human-domain + 3 AI-domain = 23, embedded at compile): --list prints it; --ensure &lt;root,...&gt; creates roots; no args shows current state.

Calling boundary: `RPC`.

RPC `args` template: `["--json","taxonomy","--list"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Create a root outside the catalog (needs the user to say yes): AI proposes -&gt; user allows -&gt; run with --yes; the AI must not create one on its own.

Calling boundary: `RPC`.

RPC `args` template: `["--json","root-create","<TITLE>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Batch classify via JEV (TypeSafe): ask which top-level category each entry belongs to, compare with the current parent (read-only).

Calling boundary: `RPC`.

The short help's read-only wording does not apply to --auto: --auto applies selected changes. A configured remote classifier can receive memory text. Prefer --plan for a local preview and review the explicit scope before authorizing external processing.

RPC `args` template: `["--json","classify","--plan"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Backfill: reseal ciphertext so payload.parent_id matches the plaintext column (fixes dual-source drift; idempotent).

Calling boundary: `RPC`.

RPC `args` template: `["--json","repack"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
Backfill: reseal ciphertext so payload.parent_id matches the plaintext column (fixes dual-source drift; idempotent)

Usage: rsrs repack [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

## Synchronize and resolve conflicts {#synchronization}

### `sync` {#cmd-sync}

Two-way sync: pull cloud delta -&gt; land locally -&gt; push local changes (LWW).

Calling boundary: `RPC`.

RPC `args` template: `["--json","sync"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
Two-way sync: pull cloud delta -> land locally -> push local changes (LWW)

Usage: rsrs sync [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `sync-conflicts` {#cmd-sync-conflicts}

Show conflicts that still need a decision; --all includes resolved and old-generation history.

Calling boundary: `RPC`.

RPC `args` template: `["--json","sync-conflicts"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Resolve one retained revision; mark it resolved only after the remote confirms.

Calling boundary: `RPC`.

Choose keep-current, take-incoming or merge only after reading both revisions. head-rev binds the decision to the observed head; merge needs explicit content. A transport failure is not confirmation of remote resolution.

RPC `args` template: `["--json","sync-resolve","--epoch","<EPOCH>","--rev","<REV>","--head-rev","<HEAD_REV>","--action","<ACTION>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Show retained sync revisions; --remote reads server history without local caching.

Calling boundary: `RPC`.

RPC `args` template: `["--json","sync-history"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Restore a kept revision as a new local edit.

Calling boundary: `RPC`.

Use op-id, or rev together with epoch; do not mix the two selectors. A pending result represents a local edit awaiting synchronization.

RPC `args` template: `["--json","sync-restore","--op-id","<OP_ID>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Rebuild after a server backup restore; keep current recovery snapshots and pending edits.

Calling boundary: `RPC`.

RPC `args` template: `["--json","sync-reset"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
Rebuild after a server backup restore; keep current recovery snapshots and pending edits

Usage: rsrs sync-reset [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

## Feedback and evaluation {#evaluation}

### `query-log` {#cmd-query-log}

Query log: each recall's candidates + adoption + model self-grade (local DPO/SFT raw material).

Calling boundary: `RPC`.

Feedback must describe a real verdict, not a successful tool call. With explicit feedback enabled, mark requires query-log-id from recall.summary.query_log_id and an appropriate source; legacy grading has narrower compatibility rules.

<details>
<summary>All arguments, defaults and help</summary>

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

Calling boundary: `RPC`.

RPC `args` template: `["--json","query-log","mark","<IDS>","--good","--query-log-id","<QUERY_LOG_ID>","--source","model"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Record a procedure run verdict (ok|fail|confounded|no_effect) for a skill/knowledge entry; local-only, feeds how-to ordering and audit.

Calling boundary: `RPC`.

RPC `args` template: `["--json","run-log","<ID>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Retrieval quality benchmark: run an evalset for hit-rate/MRR, optional baseline compare; mine drafts an evalset from query-log.

Calling boundary: `RPC`.

<details>
<summary>All arguments, defaults and help</summary>

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

Calling boundary: `RPC`.

RPC `args` template: `["--json","bench","run","<FILE>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Calling boundary: `RPC`.

RPC `args` template: `["--json","bench","mine","--out","<OUT>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

## Identity, access and sharing {#identity}

### `grant` {#cmd-grant}

Manage independent read-only subtree grants for local tools.

Calling boundary: `ADMIN`.

<details>
<summary>All arguments, defaults and help</summary>

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

Calling boundary: `ADMIN`.

RPC `args` template: `["--json","grant","create","--root","<ROOT>","--label","<LABEL>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Calling boundary: `ADMIN`.

RPC `args` template: `["--json","grant","list"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
Usage: rsrs grant list [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `grant revoke` {#cmd-grant-revoke}

Calling boundary: `ADMIN`.

RPC `args` template: `["--json","grant","revoke","<ID>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

List or revoke independent cloud login sessions; does not change local decrypt keys.

Calling boundary: `ADMIN`.

<details>
<summary>All arguments, defaults and help</summary>

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

Calling boundary: `ADMIN`.

RPC `args` template: `["--json","session","list"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
List independent sessions for this account (the current one is marked current)

Usage: rsrs session list [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `session revoke` {#cmd-session-revoke}

Calling boundary: `ADMIN`.

RPC `args` template: `["--json","session","revoke","<ID>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Generate local key material (offline; writes local session/keyfile - no server, no auth).

Calling boundary: `HOST`.

Host CLI argument template (not an RPC call): `["--json","keygen"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Show account keys: Account Secret / five-keys (manual cross-device join; leak = loss of the store).

Calling boundary: `HOST`.

Host CLI argument template (not an RPC call): `["--json","secret"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Export decrypt keys (super password + Secret Key + vault material) - how a new machine logs in; leak = loss of the store.

Calling boundary: `HOST`.

Host CLI argument template (not an RPC call): `["--json","keys-export"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Reset the super password: unlock URK with the current code, issue a new one, upload. Data is unchanged.

Calling boundary: `HOST`.

Host CLI argument template (not an RPC call): `["--json","super-reset"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Five-keys join (another machine): verify and write a local session; a non-empty --addr also logs in for a token.

Calling boundary: `HOST`.

Host CLI argument template (not an RPC call): `["--json","fivekeys","--pass","<PASS>","--kdf-salt","<KDF_SALT>","--wrapped-urk","<WRAPPED_URK>","--urk-nonce","<URK_NONCE>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Register an account (first device): login password for auth + super password wrapping keys. Address defaults to https://api.rsrs.rs; use --addr to override it. Missing user/password drops into an interactive prompt (TTY only).

Calling boundary: `HOST`.

Host CLI argument template (not an RPC call): `["--json","register"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Multiple accounts on one machine: each account has its own data dir (local store/keys/session switch as a unit). Logging into a new account creates a profile; account list lists them; account &lt;name&gt; switches (main = primary); remove &lt;name&gt; --yes deletes.

Calling boundary: `ADMIN`.

Actions: list; use &lt;name&gt;; &lt;name&gt; as shorthand for use; remove &lt;name&gt; --yes. Read listing through RPC; use the host for switching or deleting profiles. A name resolves on the runtime host, not in the caller's filesystem.

RPC `args` template: `["--json","account","list"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Explicitly copy a selected old library into a new account; no startup migration.

Calling boundary: `HOST`.

Host CLI argument template (not an RPC call): `["--json","migrate"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Spaces (virtual accounts): an owner can create several virtual accounts; each is a space with its own super key and data dir. Join = a member builds that space's profile on their machine from an invite; they can switch freely; leaving is kick.

Calling boundary: `ADMIN`.

Actions: list; create &lt;name&gt;; use &lt;name&gt;; invite; join &lt;code&gt; or join --code &lt;code&gt;; members [name]; kick --session &lt;id&gt; or kick --all; remove &lt;name&gt; --yes. Invite supports note and readonly. A readonly invite is server-enforced; joining does not imply switching to that profile.

RPC `args` template: `["--json","space","list"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Log out: clear addr/token and drop the cloud (identity and keys stay; login brings them back); --full forgets this machine's identity.

Calling boundary: `HOST`.

Host CLI argument template (not an RPC call): `["--json","logout"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Log in through browser authorization, or use --interactive for password and TOTP prompts. Address defaults to the last server this machine used (kept in session.json by register/logout). Missing user/password drops into an interactive prompt (TTY only).

Calling boundary: `HOST`.

Host CLI argument template (not an RPC call): `["--json","login"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Share a subtree: emit a prompt another AI can paste (payload is plaintext; the other AI imports from the prompt).

Calling boundary: `RPC`.

The result includes plaintext subtree material. --raw is a terminal presentation mode; RPC still returns its captured envelope, not a raw stdout stream. The returned envelope command can be share-export.

RPC `args` template: `["--json","share"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Import a shared subtree: without --go, print attach-candidate bill (for the AI to judge); --go writes the store.

Calling boundary: `RPC`.

RPC `args` template: `["--json","share-import","<FILE>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

## Configuration and integrations {#configuration}

### `agent-config` {#cmd-agent-config}

AI behavior config (agent.json): no args = print the whole file (AI reads it to decide); --set key=value writes a key.

Calling boundary: `ADMIN`.

RPC `args` template: `["--json","agent-config"]`

<details>
<summary>All arguments, defaults and help</summary>

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

View/set local config (client.json: data dir / server address / auto-sync / auto-cure).

Calling boundary: `ADMIN`.

Read configuration through RPC. Set data-dir and account/server identity changes through the host coordinator. rpc-parallelism applies after host restart; changing your client's environment does not change running worker capacity.

RPC `args` template: `["--json","config"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Inspect or configure classification without running a model.

Calling boundary: `ADMIN`.

--key-stdin is explicitly rejected through RPC. Supply credentials only through the authorized host terminal/keyring flow; never place real keys in these request examples.

RPC `args` template: `["--json","classify-config"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Distribute the inject source: --targets lists 14 hosts; --id &lt;target&gt; injects; --remove --id &lt;target&gt; uninstalls; no args in a TTY opens the picker.

Calling boundary: `ADMIN`.

Use --targets, --id and --preview for noninteractive integration. --tui needs a terminal. Codex changes support preview revision checking through --expected. Files are read/written on the host, and a hook or injection may affect another application.

RPC `args` template: `["--json","inject","--targets"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Plugin hooks (plugins.json): list shows config; test &lt;EVENT&gt; fires an event.

Calling boundary: `ADMIN`.

<details>
<summary>All arguments, defaults and help</summary>

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

Calling boundary: `ADMIN`.

RPC `args` template: `["--json","plugin","list"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
List hooks configured in plugins.json (event -> command/timeout/failure policy)

Usage: rsrs plugin list [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `plugin test` {#cmd-plugin-test}

Calling boundary: `ADMIN`.

RPC `args` template: `["--json","plugin","test","<EVENT>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

MCP server over stdio JSON-RPC. The internal runtime serves HTTP/SSE at /mcp and /sse.

Calling boundary: `HOST`.

Host CLI argument template (not an RPC call): `["--json","mcp"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
MCP server over stdio JSON-RPC. The internal runtime serves HTTP/SSE at `/mcp` and `/sse`

Usage: rsrs mcp [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `web` {#cmd-web}

Open the hosted user dashboard without starting the local runtime.

Calling boundary: `HOST`.

Host CLI argument template (not an RPC call): `["--json","web"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
Open the hosted user dashboard without starting the local runtime

Usage: rsrs web [OPTIONS]

Options:
      --json     Machine-readable output: JSON only, without human progress
      --no-open  Report https://dash.rsrs.rs without opening a browser
  -h, --help     Print help
```

</details>

## Models and indexes {#models}

### `model` {#cmd-model}

Model management: install, verify or uninstall BGE-M3.

Calling boundary: `RPC`.

install downloads/verifies artifacts without activating an index; activate validates and activates a rebuilt index. install-m3/uninstall-m3 are aliases. reset-cpu and install-engines explicitly require the host. engine changes configuration; probe performs actual inference.

<details>
<summary>All arguments, defaults and help</summary>

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

Calling boundary: `RPC`.

RPC `args` template: `["--json","model","install"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Calling boundary: `RPC`.

RPC `args` template: `["--json","model","activate","<MODEL>"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Calling boundary: `HOST`.

Host CLI argument template (not an RPC call): `["--json","model","reset-cpu"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
Force CPU and terminate the runtime, even when inference or RPC is stuck

Usage: rsrs model reset-cpu [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `model engine` {#cmd-model-engine}

Calling boundary: `RPC`.

RPC `args` template: `["--json","model","engine"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Calling boundary: `HOST`.

Host CLI argument template (not an RPC call): `["--json","model","install-engines"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
Install compatible NPU execution providers through Windows ML

Usage: rsrs model install-engines [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `model probe` {#cmd-model-probe}

Calling boundary: `RPC`.

RPC `args` template: `["--json","model","probe"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Calling boundary: `RPC`.

RPC `args` template: `["--json","model","uninstall"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
Delete the user-installed BGE-M3 files

Usage: rsrs model uninstall [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `reembed` {#cmd-reembed}

Recompute all embeddings (for embedder upgrades / dim changes; re-embed by semantics).

Calling boundary: `RPC`.

RPC `args` template: `["--json","reembed"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
Recompute all embeddings (for embedder upgrades / dim changes; re-embed by semantics)

Usage: rsrs reembed [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

## Host lifecycle {#lifecycle}

### `runtime` {#cmd-runtime}

Host-owned foreground runtime and opt-in current-user sign-in startup.

Calling boundary: `HOST`.

runtime status and runtime autostart status inspect existing state. run/start/stop/restart and autostart enable/disable/remove explicitly reject worker execution. Autostart is opt-in and current-user only; --now and --stop add immediate lifecycle effects. No call installs a system service.

<details>
<summary>All arguments, defaults and help</summary>

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

Calling boundary: `HOST`.

Host CLI argument template (not an RPC call): `["--json","runtime","run"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
Serve in the foreground; service managers supervise this process

Usage: rsrs runtime run [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `runtime start` {#cmd-runtime-start}

Calling boundary: `HOST`.

Host CLI argument template (not an RPC call): `["--json","runtime","start"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
Start the host through its configured lifecycle owner

Usage: rsrs runtime start [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `runtime stop` {#cmd-runtime-stop}

Calling boundary: `HOST`.

Host CLI argument template (not an RPC call): `["--json","runtime","stop"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
Stop the owned host without automatic resurrection

Usage: rsrs runtime stop [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `runtime restart` {#cmd-runtime-restart}

Calling boundary: `HOST`.

Host CLI argument template (not an RPC call): `["--json","runtime","restart"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
Drain and restart the owned host through its configured lifecycle owner

Usage: rsrs runtime restart [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `runtime status` {#cmd-runtime-status}

Calling boundary: `ADMIN`.

RPC `args` template: `["--json","runtime","status"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
Inspect the existing host without creating a profile or starting it

Usage: rsrs runtime status [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

#### `runtime autostart` {#cmd-runtime-autostart}

Calling boundary: `HOST`.

<details>
<summary>All arguments, defaults and help</summary>

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

Calling boundary: `HOST`.

Host CLI argument template (not an RPC call): `["--json","runtime","autostart","enable"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Calling boundary: `HOST`.

Host CLI argument template (not an RPC call): `["--json","runtime","autostart","disable"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Calling boundary: `HOST`.

Host CLI argument template (not an RPC call): `["--json","runtime","autostart","remove"]`

<details>
<summary>All arguments, defaults and help</summary>

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

Calling boundary: `ADMIN`.

RPC `args` template: `["--json","runtime","autostart","status"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
Read registration and runtime status without changing either

Usage: rsrs runtime autostart status [OPTIONS]

Options:
      --json  Machine-readable output: JSON only, without human progress
  -h, --help  Print help
```

</details>

### `restart` {#cmd-restart}

Restart the resident runtime; kill the verified process if graceful shutdown times out.

Calling boundary: `HOST`.

Host CLI argument template (not an RPC call): `["--json","restart"]`

<details>
<summary>All arguments, defaults and help</summary>

```text
Restart the resident runtime; kill the verified process if graceful shutdown times out

Usage: rsrs restart [OPTIONS]

Options:
      --json               Machine-readable output: JSON only, without human progress
      --timeout <TIMEOUT>  Seconds to wait for graceful shutdown before force termination [default: 10]
  -h, --help               Print help
```

</details>

## Results and side effects

All RPC business calls retain the two response layers described in the integration guide. This table explains how to consume each result family; it does not pretend evolving business details are a fixed schema. Inspect the actual version, status, summary, errors, actions and details; do not fabricate success when optional fields are absent.

| Feature family | Result and handling |
| --- | --- |
| `status`, `doctor`, `audit`, `witness` | Summary and diagnostic rows; warnings and failures are meaningful |
| `recall`, `list`, `show`, `chain`, `tree` | Permitted record/relationship data in summary/items/details; titles mode deliberately omits bodies |
| `remember`, `update`, `retitle`, `attach`, `forget`, `restore` | Action/identifier/revision or pending decision; verify a reported write rather than assuming from exit alone |
| `diary`, `diary-search`, `diary-fragment` | Time-chain or fragment data with locators, source versions and budget metadata |
| `resort`, `split`, `classify`, `tree-deepen`, `tree-cure`, `tree-float` | Plan or application report; confirm which execution option was requested |
| `sync`, `sync-conflicts`, `sync-history`, `sync-resolve`, `sync-restore` | Counts, retained revisions, explicit conflict decisions and possibly pending synchronization |
| `snapshot` | summary.action and snapshot details; create/list can report broken witness or partial snapshot problems |
| `model`, `reembed` | Artifact/index state, selected engine or inference probe; scheduled preparation is not completion |
| `query-log`, `run-log`, `bench` | Queries, explicit verdicts and evaluation metrics; feedback is not inferred from request success |
| `import`, `export`, `backup`, `extract`, `share-import` | Paths, counts and item outcomes; paths point to the host, not file-transfer bodies |
| `grant`, `session`, `account`, `space` | Action-specific identity/access details; grants and invites can contain credentials |
| `secret`, `keys-export`, `super-reset` | Explicit sensitive output; do not treat these like ordinary diagnostic commands |
| `book-material`, `portrait-material`, `share` | Plaintext material/prompt data; command names may differ from CLI spelling |
| `agent-config`, `config`, `classify-config`, `inject`, `plugin` | Configuration, target/file actions or hook results; external side effects are possible |

## Health and background fields

These fields are from the DEV reference and can be absent on older hosts. They are diagnostics, not a stable business-record schema. The backend supplies the inference object; consumers must accept additions, nulls and explicit errors without depending on undocumented Core internals.

| Field | Meaning |
| --- | --- |
| `server`, `v`, `bin`, `pid` | Runtime identity, protocol, binary version and process ID |
| `url`, `exe`, `data_dir` | Bound URL, executable and selected library path |
| `store_ready`, `installation_root` | DEV store readiness and installation-wide resource root |
| `managed_id`, `credential_state`, `snapshot_restore_id` | DEV supervision, credential and restore diagnostics; optional/null values are meaningful |
| `recall_statistics.pending` | Queued recall-statistics writes |
| `recall_statistics.enqueued`, `recall_statistics.persisted` | Accepted and persisted statistics counts |
| `recall_statistics.rejected`, `recall_statistics.failed` | Rejected and failed statistics counts |
| `retrieval_index.state`, `retrieval_index.scheduled` | Index stage and whether another background pass is requested |
| `retrieval_index.worker_active`, `retrieval_index.running` | Index worker lifetime and current activity |
| `retrieval_index.error`, `retrieval_index.model_setup` | Index/preparation error and setup guidance, not a success fallback |
| `inference` | Backend-provided global inference status, including host_recovery_required when present; not one command's progress |
| `rpc.available_parallelism`, `rpc.effective_parallelism` | Detected CPU parallelism and configured worker capacity |
| `rpc.ordinary_running`, `rpc.lightweight_running`, `rpc.lightweight_capacity` | Ordinary/lightweight occupancy and lightweight capacity |
| `rpc.queue_wait_timeout_secs`, `rpc.queue_cancelled` | Queue admission deadline and cancelled count |
| `rpc.queued_or_cancelled_pending_removal`, `rpc.executing_until_reply` | Queued/cancelled requests awaiting removal and executions retaining their slot until reply consumption |
| `rpc.recent_timing_micros`, `rpc.timing_scope` | Recent queue/execution timing diagnostics and their measurement scope |

The `runtime.result` `envelope.summary` contains `request_id`, `state`, `response` and `retention`: use the original `response` when completed, wait when pending, and verify business state when unknown. `model.prepare` and `index.prepare` return the index-status fields above. `model.control` returns `active` and, for a matching task, `id`, `phase`, `item`, `done`, `total`, `elapsed`, `idle` and `cancelled`; a mismatched task reports `stale`. `cli.progress` phase data is separate from global `inference`; global waiting counts are not the current command's queue position.

## Complete MCP adapter {#mcp-adapter}

This is the other protocol served by the same runtime. MCP uses JSON-RPC 2.0, unlike the custom `/api/rpc` envelope. The host runs `rsrs mcp` for stdio, one JSON object per line; client-only mode connects to the existing runtime. HTTP uses `/mcp` or `/sse` under the same actual-peer, Host and Origin checks.

This version implements `initialize`, `tools/list`, `tools/call` and `ping`, and reports protocol version `2025-03-26`. Notifications do not produce ordinary responses. HTTP POST returns JSON by default; `Accept: text/event-stream` produces a message event, and GET produces an endpoint event using the actual bound endpoint. Do not assume durable sessions, server-pushed subscriptions, general cancellation, pagination or event replay. The HTTP adapter accepts batch frames; custom RPC does not use that batch format.

A successful tool invocation encodes the business envelope as a JSON string in `result.content[0].text`. `result.isError` indicates adapter/tool-call failure only; false does not exclude a business status of fail or pending. Check JSON-RPC error and isError, then parse text and inspect the business outcome. Results also include `memory_context`, identifying retrieved memory as historical reference rather than tool authorization.

These request templates target MCP endpoints only, never `/api/rpc`:

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

The catalog contains 18 tools; `memory_forget` and `memory_restore` are disabled by default. The host sets comma-separated names through `RSRS_MCP_ALLOW` and `RSRS_MCP_DENY`; DENY wins. ALLOW `all` or `*` still excludes those two sensitive tools, which require explicit names. Unknown names and empty items are errors. Legacy `RSRS_MCP_ALLOW_TOOLS` and `RSRS_MCP_DENY_TOOLS` are used only when the corresponding canonical variable is absent.

Read-only mode retains only read tools; paused mode retains only memory_status, and ALLOW cannot override service mode. A merge_ids merge also requires memory_forget permission. Use the actual tools/list rather than hard-coding the visible count. Direct RPC is not filtered by MCP allow/deny settings; the integration must enforce its own permissions.

Currently `memory_query_log_mark` forwards only ids/good/bad, not query-log-id/source. Feedback requiring explicit query identity should use `cli.exec query-log mark`; the tool does not expose every CLI argument. Below are every tool and its original inputSchema. Required fields are listed under required; permission and semantic checks described above still apply.

### `memory_status` {#tool-memory-status}

Local store status (data dir, session, counts). Use to check that rsrs is ready.

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

Import local coding-agent sessions (Codex, OpenCode, Claude Code, …) into rsrs memories. Batch write: imports up to limit newest sessions per source, seals each, then auto-syncs; pass confirm=true to write, or dry_run=true to preview

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

Store a memory (judge-then-store; --force writes immediately; merge_ids deletes the listed ids)

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

Semantic recall (local BGE + keyword fusion, no network)

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

List recent memories

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

Show one memory in full (including causal-chain context)

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

Update title/body/tags/kind/importance of an existing memory

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

Attach a child under a parent (explicit reparent)

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

Causal tree: forest / subtree / outline

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

Entry change audit (create/update/delete/restore)

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

Explicit cross-date diary fragments, bounded output; scores are relevance, not credibility

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

Bounded read of a diary fragment; rejects changed or missing locators

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

Diary time chain (trivial zone included)

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

Causal chain: ancestors + this entry + descendants

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

Self-grade recall candidates: --good (chosen) or --bad (rejected)

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

Tombstone a memory (propagates with sync)

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

Restore a tombstoned memory by full id

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

List the 23 built-in catalog roots

<details>
<summary>inputSchema</summary>

```json
{
  "type": "object",
  "properties": {}
}
```
</details>

## Hidden and reserved controls

A complete feature catalog does not promise compatibility for internal controls. The following options are not all shown in ordinary help but matter to integration boundaries. Classification controls are advanced parameters in this reference version and can change; do not depend on unpublished tuning interfaces. Compile-time native-fault methods and the private Core ABI are not third-party RPC features.

| Control | Purpose and boundary |
| --- | --- |
| `--progress-id` | Integration ID used by cli.progress; independent of the RPC request ID |
| `--model-task-id` | Matching model operation ID for model.control |
| `classify --samples` | Requested classification samples; default 5 |
| `classify --batch` | Requested tree classification batch size; default 12 |
| `classify --tree-depth` | Maximum selected tree depth; default 2 |
| `classify --min-kids` | Minimum child count for causal segments; default 3 |
| `classify --segments` | Maximum causal segments; default 0 means all |
| `classify --rounds` | Maximum auto-reparent rounds; default 5 |
| `--client-only`, `--direct`, `--runtime-internal` | Host CLI pre-parser flags, not cli.exec arguments; --direct never authorizes a second writer |
| `--managed`, `--installation-root`, `--supervised-child` | Reserved runtime-run bootstrap options; leave them to the host manager |
| `lifecycle` | Reserved RPC request field for host coordination, not an authorization credential |

[Runtime RPC](runtime-rpc.md) · [CLI JSON API](cli-api.md) · [Runtime](runtime.md)
