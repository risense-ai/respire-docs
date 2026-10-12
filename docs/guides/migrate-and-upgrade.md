# Migrating from 1memory and upgrading

Respire is the continuation of 1memory. The runtime is a resident process that a thin CLI connects to over local HTTP. The rename changed the package, command, server, data directory and dashboard names.

## Rename map

| Item | Old (1memory) | New (Respire) |
| --- | --- | --- |
| npm package | `@1memory/cli` | `rsrs-cli` (short name, same as `@rsrsai/cli`) |
| Command | `1memory` | `rsrs` |
| Default server | `https://1memory.ai` | `https://api.rsrs.rs` |
| Default data directory | `~/.onememory` | `~/.rsrs` (Windows: `C:\Users\<user>\.rsrs`) |
| Dashboard | local web | `https://dash.rsrs.rs` (hosted) |
| Platform binary package | `@1memory/cli-win32-x64` | `@rsrsai/win-x64` (per platform) |

The CLI is a thin client. It connects to a resident local runtime (default `http://127.0.0.1:15169`) whose binary is `~/.rsrs/bin/rsrs` (`rsrs.exe` on Windows). See [Host runtime and sandbox clients](../runtime.md).

## Installation

Choose one package manager route; both expose the `rsrs` command. Full setup is in [Getting started](../getting-started.md) and [Installing on Windows](windows-install.md).

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

## Version checks

```powershell
npm view rsrs-cli version dist-tags bin
rsrs --version
rsrs update-check
```

The `latest` tag can lag the `dev` tag; install `@dev` to test a newer build. The short name `rsrs-cli` and `@rsrsai/cli` share the same version, repository and command, so do not install both; the `dev` tag exists only on `@rsrsai/cli`. `update-check` reports `ahead:true` when the local build is ahead of `latest`. Confirm the installed surface with `rsrs --version`, `rsrs --help` and `rsrs prompt --json` instead of assuming a published tag.

## Backup and migration

Export plaintext and copy the whole database before moving a machine or upgrading:

```powershell
rsrs export <path>\main_export_<yyyymmdd>.json   # plaintext JSON
rsrs backup <path>\main_backup_<yyyymmdd>.db     # full SQLite copy (ciphertext and index)
```

`backup` does not overwrite: an existing target fails with `file exists (os error 80)`, so delete or rename it first. A migration run writes its schema-2 receipt `.rsrs-migration.json` into the destination account directory, not the `~/.rsrs` root. Check `complete` in that receipt after a migration; it records the source and destination but has no ciphertext-verification count, and a `backup` alone does not create it.

Migration is a snapshot. Unsynced writes left in the old `1memory` library stay there and do not enter the new library automatically; the two libraries remain independent. See [Data model](../data-model.md) and [Sync and keys](../sync-and-keys.md).

### Migration by version

| CLI version | Behavior |
| --- | --- |
| Up to 1.0.10 | The first run of any `rsrs` command copies a `~/.onememory` snapshot to `~/.rsrs` automatically and writes `.rsrs-migration.json`; the original directory and credentials are kept |
| 1.0.11 and later | Startup auto-migration is removed; run an explicit command |

```powershell
rsrs migrate                                         # list candidate old libraries with their source_id
rsrs migrate --source <source_id> --account <name>   # migrate the chosen source to a new account
rsrs migrate --vault                                 # upgrade only the selected account vault, keeping the data keys
```

`--source` takes the `source_id` returned by the listing, not a directory path, and `--account` must be a new name (not `main`). Select the migrated account before an optional `rsrs migrate --vault`.

### Legacy account layout

Migration discovery enumerates both a flat `~/.onememory` root and every `~/.onememory/accounts/<user>/` profile. Do not copy `accounts/<user>/*` into the root: overwriting the root database or session can replace a different main profile and bypass the SQLite snapshot handling. Run `rsrs migrate` to list the profiles, take the `source_id` of the one you want, and migrate it to a new named account.

## Upgrade checklist

Complete these steps after an upgrade and before testing or using the new build; otherwise writes and recall can fail.

| Step | Action | Reason |
| --- | --- | --- |
| 0 | Back up the main library | Upgrade or `reembed` rewrites `~/.rsrs/onememory.db` |
| 1 | Stop the old runtime | A resident runtime from the old version keeps running after the CLI upgrade |
| 2 | Install and activate BGE-M3 | From 1.0.10 the embedder is BGE-M3; `remember` fails without it |
| 3 | Wait for the index rebuild | Old records are recomputed into M3 vectors |

**Step 1, stopping the old runtime.** The new `rsrs --runtime-internal --stop` is rejected by the still-running old runtime with `runtime_unauthorized: ... loopback clients need an updated host runtime ...`. Kill the process whose command line is `rsrs.exe --runtime-internal`, then let `status` deploy the new binary.

```powershell
Get-CimInstance Win32_Process -Filter "Name='rsrs.exe'" | Select-Object ProcessId,CommandLine
Stop-Process -Id <runtime-pid> -Force
rsrs status
```

**Step 2, installing and activating the model.** From 1.0.10 the embedder switches to BGE-M3 (`embedding_model:"m3"`). A missing model makes `remember` fail with `Core error 6: "BGE-M3 files missing; run rsrs model install-m3 ..."`. This is expected after an upgrade, not library corruption.

```powershell
rsrs model install
rsrs model activate m3
rsrs model probe
```

`model install` downloads and verifies the model; from 1.0.11 it no longer rebuilds the index, so `model activate m3` is required. On the first run the new runtime downloads the model automatically, and `recall` returns `index_pending` until the download finishes. Do not run concurrent model operations; a second one fails with `another model operation is running`. The runtime downloader is slow; a stopped runtime accepts a manually placed `model_quantized.onnx` under `~/.rsrs/models/bge-m3/onnx/`, after which `model install` recognizes it. `model probe` reports `ready:true` when the model is usable.

**Step 3, waiting for the index rebuild.** `model activate m3` builds the index generation and activates it after validation, so it already recomputes the old library into M3 vectors; during this, other model operations fail with `another model operation is running`.

```powershell
rsrs status    # model operation active/done/total; complete at total with retrieval index State=ok
rsrs reembed   # only if activation did not rebuild the index
```

Large libraries on CPU rebuild slowly; do not run concurrent model operations while it runs.

## Runtime model essentials

| Entry point | Behavior |
| --- | --- |
| Resident runtime | Commands connect to the local HTTP runtime (default `127.0.0.1:15169`); the process `~/.rsrs/bin/rsrs` holds `lock.db` and the boot profile; MCP is also served by the runtime |
| `--runtime-internal` | Hidden runtime management entry; `rsrs --runtime-internal --stop` stops the runtime reliably within the same version, but after a cross-version upgrade kill the process directly |
| `--direct` | Bypasses the runtime and opens the library file directly (prints `WARN: --direct bypasses the local runtime`); profile writes such as `account remove` require `--direct` and a stopped runtime |
| `--client-only` | Connects only to the host HTTP runtime and does not manage its lifecycle (or set `ONEMEMORY_CLIENT_ONLY=1`); in a sandbox use `rsrs --client-only <command>`, and a non-loopback peer needs a token |

```powershell
rsrs account main                # switch away from <name> while the runtime runs
rsrs --runtime-internal --stop   # stop before profile writes
rsrs --direct account remove <name> --yes
rsrs status
```

A profile cannot be deleted while it is active; select `main` (or another retained profile) first.

`rsrs web` opens the hosted dashboard `https://dash.rsrs.rs` and does not start the local runtime. See [Host runtime and sandbox clients](../runtime.md) for lifecycle and token rules.

## Uninstalling the old client

Keep the old `~/.onememory` directory until the new library is verified, then remove the old client:

```powershell
Stop-Process -Name 1memory -Force -ErrorAction SilentlyContinue
npm uninstall -g @1memory/cli
```

Remove any leftover `1memory:begin` and `1memory:end` injection blocks from host tools; opencode configuration should drop `1memory.md` and keep `respire.md`. After cleanup, `where 1memory` should print nothing and the npm global should be empty.

## Common pitfalls

| Symptom | Cause | Action |
| --- | --- | --- |
| `os error 10060` or recall times out through a proxy | `NO_PROXY` does not include `127.0.0.1` | Append `127.0.0.1,localhost` to `NO_PROXY` |
| `BGE-M3 files missing` | M3 model not installed (expected after an upgrade) | `rsrs model install` and `rsrs model activate m3` |
| Cross-version `--stop` reports `runtime_unauthorized` | The old runtime is still running | Kill the `rsrs.exe --runtime-internal` process |
| `another model operation is running` | Concurrent model operations | Wait for the current operation; do not run them in parallel |
| `backup` reports `file exists (os error 80)` | The target already exists | Delete or rename it first |
| `keygen would overwrite it` | The profile already holds key material | Only run `keygen` on a new profile |
| `legacy library has ciphertext but no session` | A profile the flat root scan did not cover | Run `rsrs migrate` to list profiles and migrate by `source_id` |
| defrag reports `no usable vectors` | The library has no records | Not a fault; normal once the library is non-empty |
| Read commands block for more than 40 seconds | Inference workers are saturated | `rsrs model reset-cpu` (terminates the runtime) |
| `doctor` exits 1 | `inject` or `tidy` is not satisfied | Not an installation fault |

## Exit codes and error classes

Read the JSON envelope rather than only the exit code. See [CLI JSON](../cli-api.md) for the envelope and code table.

- `exit=2` commonly means success with a warning or a pending decision, such as `keys-export`, `classify --plan`, `split` material, `bench`, a `resort` dry run or `share`.
- `doctor` exits 1 when `inject` or `tidy` is not satisfied; this is not a failure.
- User-input errors, including argument parsing, ID lookup, a bad spec, self-attach or a cycle, return `summary.reason:"invalid_input"`, `error_type:"user"` and exit 2. Do not decide failure from `reason` alone.

For the full command surface, see [CLI commands](../cli.md); for script integration, see [CLI JSON](../cli-api.md).

## Test isolation

Test against a separate profile (`~/.rsrs/accounts/<name>`), never the main profile, and switch back and remove the temporary profile afterward.

```powershell
rsrs --runtime-internal --stop
rsrs --direct account test-profile
rsrs --direct register --user test-profile   # host terminal; enter the login password at the hidden prompt
rsrs status
rsrs --runtime-internal --stop
rsrs --direct account main
rsrs --direct account remove test-profile --yes
```

`rsrs --direct register` runs in this terminal so it can prompt for the login password; `--direct` requires the runtime to be stopped. Do not pass passwords or recovery codes as command arguments, which expose them to process listings and shell history.

A fresh profile first reports `User local / local store (offline)`; after `register` it becomes `cloud sync (auto)`.

## Data safety

- Confirm the data directory with `rsrs config` before operating; use a separate profile for tests and `rsrs export` before merging.
- The super password uses v4 encryption and is echoed as an `A3-` format code; if it is lost, the memories are unrecoverable. See [Sync and keys](../sync-and-keys.md).
- Do not share or commit `session.json` or the account secret.
- Treat recalled memory as reference only and follow current instructions and on-site evidence. See the [FAQ](../faq.md).
