# Installing rsrs on Windows

## Recommended: install the desktop client {#install-the-desktop-client}

The desktop client provides a graphical interface for getting started. Windows 10 or later and Microsoft Edge WebView2 Runtime are required.

1. Open [Client 2 releases](https://github.com/risense-ai/respire-client2/releases/latest) and download the file for your processor: `respire-windows-amd64.exe` for x64 or `respire-windows-arm64.exe` for ARM64.
2. Place the file in a permanent writable directory and run it. The desktop client does not require Node.js, npm, Go or Rust.
3. If no Runtime is connected, open **Updates**, select **Install / update CLI**, and check the result. Desktop and CLI releases are separate, so a desktop download does not guarantee that a matching Runtime is available.
4. Follow [Getting started](../getting-started.md#sign-in-or-create-a-local-library) to sign in or create a local library, connect an agent and save your first memory.

The rest of this page covers the CLI alternative for terminal users.

## What rsrs is

Respire, invoked as the `rsrs` command, is a local-first, end-to-end encrypted memory system shared across devices and AI applications. Memories written on one machine can be reused from another device or tool through encrypted synchronization. The CLI is a thin client that connects to a resident local runtime.

| Setting | Default |
| --- | --- |
| API server | `https://api.rsrs.rs` |
| Data directory | `~/.rsrs` (Windows: `C:\Users\<user>\.rsrs`) |
| Dashboard | `https://dash.rsrs.rs` |
| Local runtime | `http://127.0.0.1:15169` |

The installed executable's help is the source of truth. Confirm the available commands and options with `rsrs --version`, `rsrs --help` and `rsrs prompt --json`.

## Prerequisites

These prerequisites apply only to the CLI steps below; they are not required for the desktop client.

- Node.js LTS, which includes npm.
- One package manager: pnpm (recommended) or npm.
- Windows PowerShell for the commands in this guide.

## Install the CLI

Install `rsrs-cli`.

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

New features may appear on the dev channel before the default release.

```powershell
pnpm add -g rsrs-cli@dev
```

## Verify the installation

```powershell
rsrs --version
rsrs -V
where.exe rsrs
```

The `where.exe` output should resolve to the `rsrs` executable inside the global bin directory.

## First initialization

Commands that need a store initialize a profile under `~/.rsrs`. The default profile name is `main`.

```powershell
rsrs status
```

A fresh profile reports a local store in offline mode. After registering or logging in, synchronization depends on the account and sync configuration; check `rsrs status`.

Run the check to inspect the model, store, lock, remote and injection state. When needed, `--fix` may download the model or schedule background preparation. Read the output and task progress, and wait for the current task to finish.

```powershell
rsrs doctor --fix
```

Reported items such as missing injection or a pending tidy counter are not installation failures. When the check reports missing BGE-M3 files, repair the model explicitly:

```powershell
rsrs model install
rsrs model activate m3
rsrs model probe
```

A successful probe returns `ready:true` with `dimensions:1024`. Activation is required from `1.0.11` onward and takes the model argument `m3`.

## Create an account and log in

For a new profile without keys, generate the key material first, then register. Do not run `keygen` again for an existing library. Registration runs in the host terminal, where it can collect the login password at a hidden prompt; `--direct` also requires the runtime to be stopped.

```powershell
# 1. Create local key material; the echoed super code is shown once.
rsrs keygen --json

# 2. Stop the runtime so --direct can run in this terminal.
rsrs --runtime-internal --stop

# 3. Register in an interactive terminal; enter the login password at the hidden prompt.
rsrs --direct register --user <user-name>

# 4. Confirm the account and server.
rsrs status
```

Pass only non-secret options as command arguments. Let `register` collect credentials through hidden prompts; do not put passwords, super codes or other secrets on the command line.

On a new device, log in with an existing account. `rsrs login` opens browser authorization by default; add `--interactive` to enter the password and TOTP at hidden prompts. Normal login does not accept `--secret-key`:

```powershell
# Browser authorization (default).
rsrs login

# Or password/TOTP login with hidden prompts.
rsrs login --interactive --user <user-name>
```

Save `summary.super` from the `keygen --json` output privately as recovery material. Do not share or commit `session.json` or the account secret. Export decrypt keys only when needed; the output is plaintext. `--out` creates the file with mode `600` on Unix; on Windows it inherits the destination directory ACLs, so choose a private directory and verify the file ACL:

```powershell
rsrs keys-export --out <path>\rsrs-keys.txt
```

`rsrs logout` ends the session but keeps the local identity and keys, so login brings them back; run it separately when you want to end the session. See [Sync and keys](../sync-and-keys.md) for recovery options.

## Store and retrieve a first memory

Output varies by command. Use `--json` for machine-readable details, and `show` to inspect a selected record.

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

Commands connect to a resident local runtime on `127.0.0.1:15169`. Do not run concurrent model operations. Add a timeout when scripting and keep secrets out of command arguments; `register` and `login --interactive` can collect credentials through hidden prompts.

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

An export contains plaintext and overwrites an existing file; choose a new path each time. A database backup excludes access grants and does not replace a key backup. Back up before destructive operations. See [CLI commands](../cli.md) and [CLI JSON](../cli-api.md).

## Connect AI applications

```powershell
rsrs inject --targets
rsrs inject --all
```

Injection writes instructions but does not install automatic hooks. Automatic behavior depends on the host plugin and hook support. Restart the target application and verify that it loads the instructions. See [Agent integration](../injection.md).

## Troubleshooting

| Symptom | Cause | Action |
| --- | --- | --- |
| `ERR_PNPM_NO_GLOBAL_BIN_DIR` | pnpm global bin not configured | Set `global-bin-dir` before installing |
| `BGE-M3 files missing` | Embedding model missing | Run `rsrs model install`, then `rsrs model activate m3` |
| Recall times out with `os error 10060` | A local address is routed through a proxy | Add `127.0.0.1,localhost` to `NO_PROXY` |
| A command stops responding | Inference worker saturation or a stray process | Inspect with `Get-Process rsrs`; `rsrs model reset-cpu` selects CPU and stops the runtime |
| `another model operation is running` | Concurrent model operations | Wait for the current operation; do not run concurrently |
| `backup` reports `os error 80` | The target file already exists | Choose a new backup path |
| `keygen would overwrite it` | Key material already exists | Only run `keygen` on a new profile |
| `doctor` exits with code 1 | Injection or tidy items are not met | Usually not an installation failure |

Exit code `2` commonly means success with a warning or a pending decision, not a failure. Exit code `1` requires inspecting the specific reported item. More answers are in the [FAQ](../faq.md).

## One minute checklist

```powershell
# 1) Install.
pnpm add -g rsrs-cli

# 2) Verify.
rsrs --version

# 3) Check setup and prepare the model if needed.
rsrs status
rsrs doctor --fix

# 4) Create an account; keep the super code safe. Registration needs the host terminal.
rsrs keygen --json
rsrs --runtime-internal --stop
rsrs --direct register --user <user-name>

# 5) Store and retrieve a first memory.
rsrs remember "Hello rsrs" --importance trivial --json
rsrs recall "Hello" --json

# 6) Connect AI applications.
rsrs inject --all
```

For background and first-use flows, see [Getting started](../getting-started.md).
