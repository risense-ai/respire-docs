# Installing rsrs on Windows

## What rsrs is

Respire, invoked as the `rsrs` command, is a local-first, end-to-end encrypted memory system shared across devices and AI applications. Memories written on one machine can be reused from another device or tool through encrypted synchronization. The CLI is a thin client that connects to a resident local runtime.

| Setting | Default |
| --- | --- |
| API server | `https://api.rsrs.rs` |
| Data directory | `~/.rsrs` (Windows: `C:\Users\<user>\.rsrs`) |
| Dashboard | `https://dash.rsrs.rs` |
| Local runtime | `http://127.0.0.1:15169` |

The installed executable's help is the source of truth. Confirm the available commands and options with `rsrs --version`, `rsrs --help` and `rsrs prompt --json`. At the time of writing the registry published `1.0.11` as the default release and `1.0.12-dev.1` on the dev channel; treat these as examples, not a guarantee.

## Prerequisites

- Node.js LTS, which includes npm.
- One package manager: pnpm (recommended) or npm.
- Windows PowerShell for the commands in this guide.

## Install the CLI

The short package name `rsrs-cli` and the scoped name `@rsrsai/cli` are two entry points of the same package at the same version. Install only one of them, otherwise both may compete for the `rsrs` command.

### Install with pnpm

When the pnpm global bin directory is not configured, installs fail with `ERR_PNPM_NO_GLOBAL_BIN_DIR`. Point it at an npm directory already on the PATH before installing.

```powershell
pnpm config set global-bin-dir "C:\Users\<user>\AppData\Roaming\npm"
pnpm config set global-dir "C:\Users\<user>\AppData\Local\pnpm\global"

# Install the default release.
pnpm add -g rsrs-cli
```

### Install with npm

```powershell
npm install -g rsrs-cli
```

### Install the dev channel

New features often appear on the dev channel before the default release. The dev channel is published only under the scoped name, not under `rsrs-cli`.

```powershell
pnpm add -g @rsrsai/cli@dev
```

## Verify the installation

```powershell
rsrs --version
rsrs -V
where.exe rsrs
```

The `where.exe` output should resolve to the `rsrs` executable inside the global bin directory.

## First initialization

The first run of any `rsrs` command creates the local store and a profile under `~/.rsrs`. The default profile name is `main`.

```powershell
rsrs status
```

A fresh profile reports a local store in offline mode. After registering or logging in to a cloud account, it reports automatic cloud synchronization.

Run the bundled check to install the embedding model and inspect the model, store, lock, remote and injection state.

```powershell
rsrs doctor --fix
```

Reported items such as missing injection or a pending tidy counter are not installation failures. When the check reports missing BGE-M3 files, repair the model explicitly:

```powershell
rsrs model install
rsrs model activate
rsrs model probe
```

A successful probe returns `ready:true` with `dimensions:1024`. Activation is required from `1.0.11` onward.

## Create an account and log in

Account setup combines local key material with a cloud account. Generate the key material first, then register.

```powershell
# 1. Create local key material; the echoed super code is shown once.
rsrs keygen --json

# 2. Register a cloud account using the super code from the previous step.
rsrs register --user <user-name> --pass "<login-password>" --super "<super-code>" --json

# 3. Confirm the account and server.
rsrs status
```

Pass every argument so the command does not drop into an interactive prompt.

On a new device, log in with an existing account:

```powershell
rsrs login --user <user-name> --pass "<login-password>" --secret-key "<secret-key>"
rsrs logout
rsrs keys-export --json
```

The super password is displayed once and cannot be recovered if lost. Keep it offline for recovery. Do not share or commit `session.json` or the account secret; an export contains plaintext. See [Sync and keys](../sync-and-keys.md) for recovery options.

## Store and retrieve a first memory

Read commands return full content only with `--json`.

```powershell
# Store a memory; a similar candidate is proposed before writing.
rsrs remember "<content>" --type context --importance important --title "<title>" --tags "a,b" --project "<project>" --json

# Skip the duplicate check and write directly.
rsrs remember "<content>" --force --json

# Semantic retrieval.
rsrs recall "<query>" --mode fast --limit 5 --json
rsrs recall "<query>" --titles --json

# Read one record and its causal chain.
rsrs show <ID> --json
rsrs chain <ID> --depth 3 --json

# Browse and inspect the diary.
rsrs list --limit 10 --json
rsrs diary --date today --json
```

The `--titles` form returns only an 8-character identifier and the title, which saves tokens when browsing candidates.

| Importance | Use |
| --- | --- |
| `important` | Reusable conclusions that enter the main store |
| `trivial` | Diary entries and routine process notes |

The `normal` value is deprecated. Prefer a three-section body describing the cause, the action and the effect, and add a trigger line with a confirmed date or prerequisite for planned tasks. When a candidate exists, choose one action in this order: update the existing record, then merge, then attach, then create a new record. Read the candidate in full before deciding.

## Understand the runtime

Commands connect to a resident local runtime on `127.0.0.1:15169` rather than starting a process each time. Do not run `rsrs` commands concurrently against the same profile; competing commands contend for the runtime and stall. Add a timeout when scripting, and pass every argument to `register` and `login` to avoid an interactive prompt.

| Option | Effect |
| --- | --- |
| `rsrs --runtime-internal --stop` | Stops the local runtime |
| `rsrs --direct <command>` | Opens the store directly, bypassing the runtime |
| `rsrs --client-only <command>` | Connects to a host runtime without managing its lifecycle |
| `rsrs web [--no-open]` | Opens the hosted dashboard without starting the local runtime |

## Daily maintenance

```powershell
rsrs status
rsrs doctor
rsrs update <ID> --title "<new-title>" --json
rsrs retitle <ID> --title "<new-title>" --json
rsrs forget <ID> --json
rsrs restore <full-ID> --json
rsrs export <file>.json --json
rsrs backup <file>.db --json
rsrs sync --json
rsrs taxonomy --list
rsrs prompt --json
rsrs update-check
rsrs account list
```

An export contains plaintext, and a database backup does not replace a key backup. Back up before destructive operations. The full command surface is documented in [CLI commands](../cli.md) and [CLI JSON](../cli-api.md).

## Connect AI applications

```powershell
rsrs inject --targets
rsrs inject --all
```

Injection writes policy text that tells an agent when to recall and remember. It does not install automatic hooks; automatic triggering requires a registered MCP server or a `plugins.json` entry. Restart the target application after injection so it loads the new instructions. See [Agent integration](../injection.md).

## Troubleshooting

| Symptom | Cause | Action |
| --- | --- | --- |
| `ERR_PNPM_NO_GLOBAL_BIN_DIR` | pnpm global bin not configured | Set `global-bin-dir` before installing |
| `BGE-M3 files missing` | Embedding model missing | Run `rsrs model install`, then `rsrs model activate` |
| Recall times out with `os error 10060` | A local address is routed through a proxy | Add `127.0.0.1,localhost` to `NO_PROXY` |
| A command stops responding | Inference worker saturated or a stray process exists | Run `rsrs model reset-cpu`; inspect with `Get-Process rsrs` |
| `another model operation is running` | Concurrent model operations | Wait for the current operation; do not run concurrently |
| `backup` reports `os error 80` | The target file already exists | Remove or rename it |
| `keygen would overwrite it` | Key material already exists | Only run `keygen` on a new profile |
| `doctor` exits with code 1 | Injection or tidy items are not met | Usually not an installation failure |

Exit code `2` commonly means success with a warning or a pending decision, not a failure. Exit code `1` requires inspecting the specific reported item. More answers are in the [FAQ](../faq.md).

## One minute checklist

```powershell
# 1) Install.
pnpm add -g rsrs-cli

# 2) Verify.
rsrs --version

# 3) Initialize and repair the model.
rsrs status
rsrs doctor --fix

# 4) Create an account; keep the super code safe.
rsrs keygen --json
rsrs register --user <user-name> --pass "<login-password>" --super "<super-code>" --json

# 5) Store and retrieve a first memory.
rsrs remember "Hello rsrs" --importance trivial --json
rsrs recall "Hello" --json

# 6) Connect AI applications.
rsrs inject --all
```

For background and first-use flows, see [Getting started](../getting-started.md).
