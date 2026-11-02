# Migrating from 1memory and upgrading

Respire is the continuation of 1memory. The runtime is a resident process that a thin CLI connects to over local HTTP. The rename changed the package, command, server, data directory and dashboard names.

## Rename map

| Item | Old (1memory) | New (Respire) |
| --- | --- | --- |
| npm package | `@1memory/cli` | `rsrs-cli` |
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

# Stable release
pnpm add -g rsrs-cli
# Dev build
pnpm add -g rsrs-cli@dev

# npm is equivalent
npm install -g rsrs-cli
```

## Version checks

```powershell
npm view rsrs-cli version dist-tags bin
rsrs --version
rsrs update-check
```

The `latest` tag can lag `dev`; use `rsrs-cli@dev` for the dev channel. Confirm the installed surface with `rsrs --version`, `rsrs --help` and `rsrs prompt --json`.

## Backup and migration

Export plaintext and back up the database before moving a machine or upgrading:

```powershell
rsrs export <path>\main_export_<yyyymmdd>.json   # plaintext JSON
rsrs backup <path>\main_backup_<yyyymmdd>.db     # SQLite copy without access grants
```

`export` overwrites an existing file, while `backup` refuses an existing target; choose a new path for each. The database backup excludes access grants and does not replace a key backup. The migration receipt `.rsrs-migration.json` is written in the destination account directory; check its `complete` field.

Migration is a snapshot. Unsynced writes left in the old `1memory` library stay there and do not enter the new library automatically; the two libraries remain independent. See [Data model](../data-model.md) and [Sync and keys](../sync-and-keys.md).

### Migration by version

| CLI version | Behavior |
| --- | --- |
| Older releases | Historical automatic migration depends on the version; check its documentation |
| Current release | Startup does not import automatically; run an explicit migration |

```powershell
rsrs migrate                                         # list candidate old libraries with their source_id
rsrs migrate --source <source_id> --account <name>   # migrate the chosen source to a new account
rsrs migrate --vault                                 # migrate the selected account vault, keeping the data keys
```

`--source` takes the `source_id` returned by the listing, not a directory path, and `--account` must be a new name (not `main`). Select the migrated account before an optional `rsrs migrate --vault`.

### Legacy account layout

Migration discovery enumerates both a flat `~/.onememory` root and every `~/.onememory/accounts/<user>/` profile. Do not copy `accounts/<user>/*` into the root: overwriting the root database or session can replace a different main profile and bypass the SQLite snapshot handling. Run `rsrs migrate` to list the profiles, take the `source_id` of the one you want, and migrate it to a new named account.

## Upgrade checklist

Back up before upgrading, then use status checks to decide whether runtime or model work is needed.

| Step | Action | Reason |
| --- | --- | --- |
| 0 | Back up the main library | Keep a recovery copy from before the upgrade |
| 1 | Check the runtime | Confirm the new version is active |
| 2 | Check BGE-M3 | Install and activate it if missing |
| 3 | Check the index | Wait if a rebuild is underway |

**Step 1, checking the runtime.** Use `rsrs restart` to restart it, then inspect `rsrs status`. If a cross-version error occurs, inspect and verify the process before intervening.

```powershell
rsrs restart
rsrs status
```

**Step 2, installing and activating the model when needed.** If BGE-M3 is missing, use these commands and inspect the result.

```powershell
rsrs model install
rsrs model activate m3
rsrs model probe
```

`model install` downloads and verifies the model; `model activate m3` builds and activates the index. Do not run model operations concurrently. Use `model probe` to check readiness.

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
| `--runtime-internal` | Host lifecycle entry; `rsrs --runtime-internal --stop` requests runtime shutdown |
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

Remove any leftover `1memory:begin` and `1memory:end` injection blocks from host tools; opencode configuration should drop `1memory.md` and keep `respire.md`. After cleanup, `where 1memory` should print nothing. Keep unrelated global npm packages.

## Common pitfalls

| Symptom | Cause | Action |
| --- | --- | --- |
| `os error 10060` or recall times out through a proxy | `NO_PROXY` does not include `127.0.0.1` | Append `127.0.0.1,localhost` to `NO_PROXY` |
| `BGE-M3 files missing` | M3 model not installed (expected after an upgrade) | `rsrs model install` and `rsrs model activate m3` |
| Cross-version `--stop` reports `runtime_unauthorized` | Runtime version mismatch | Inspect and verify the runtime process before intervening |
| `another model operation is running` | Concurrent model operations | Wait for the current operation; do not run them in parallel |
| `backup` reports `file exists (os error 80)` | The target already exists | Choose a new backup path |
| `keygen would overwrite it` | The profile already holds key material | Only run `keygen` on a new profile |
| `legacy library has ciphertext but no session` | Original credentials are unavailable | Recover the original keys before migration |
| defrag reports `no usable vectors` | The library has no records | Not a fault; normal once the library is non-empty |
| Read commands block for more than 40 seconds | Inference workers may be saturated | Inspect the runtime; `rsrs model reset-cpu` selects CPU and stops the runtime |
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

A fresh profile reports a local store in offline mode. After `register`, check `rsrs status`; synchronization depends on configuration.

## Data safety

- Confirm the data directory with `rsrs config` before operating; use a separate profile for tests and `rsrs export` before merging.
- New v4 accounts use an `A3-` recovery code. If all usable recovery material is lost, encrypted memories cannot be recovered. See [Sync and keys](../sync-and-keys.md).
- Do not share or commit `session.json` or the account secret.
- Treat recalled memory as reference only and follow current instructions and on-site evidence. See the [FAQ](../faq.md).
