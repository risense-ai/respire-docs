# Getting started

The desktop client is the recommended way to start. It provides a graphical interface for the local Runtime, accounts, memories, models and AI-tool integration. If you prefer a terminal or cannot use the desktop client, follow the [CLI alternative](#cli-alternative).

## Install the desktop client {#install-the-desktop-client}

1. Open [Client 2 releases](https://github.com/risense-ai/respire-client2/releases/latest) and choose the file for your operating system and processor. The release page lists checksums and version notes.
2. On Windows, download `respire-windows-amd64.exe` for x64 or `respire-windows-arm64.exe` for ARM64 and run it from a permanent writable directory. Windows 10 or later and WebView2 are required.
3. On macOS, download the matching `respire-darwin-amd64.zip` or `respire-darwin-arm64.zip`, extract it and keep `Respire.app` in a permanent location. The app is not Developer ID signed or notarized.
4. On Linux, download the matching `respire-linux-amd64.tar.gz` or `respire-linux-arm64.tar.gz`, extract it and run the executable. A graphical session, GTK 3, WebKitGTK 4.1 and compatible system libraries are required.

You do not need Node.js, npm, Go or Rust to use the desktop app. Desktop and CLI releases are separate; a desktop download does not guarantee a matching Runtime for every platform. See [platform support](https://github.com/risense-ai/respire-client2/blob/main/docs/platforms.md) for prerequisites and verification limits.

## Connect the Runtime {#connect-the-runtime}

On first launch, choose the interface language when prompted; you can change it later at the top right or in **Settings**. Then check the connection indicator in the sidebar. The app can connect to a compatible local Runtime or prepare a matching CLI and its native libraries separately. If no Runtime is available, open **Updates**, choose **Install / update CLI**, and follow the displayed status. A missing release asset or incompatible version is reported in the client; see [Diagnostics](client.md#settings-updates-and-diagnostics) if it does not connect.

![Desktop overview with Runtime and sync status](/client2/overview-en.png)

The screenshot shows the Client 2 0.2.22 frontend with simulated data, not a real account. The interface and status can differ on your device.

## Sign in or create a local library {#sign-in-or-create-a-local-library}

Open **Accounts & Spaces**. If you already have an account, choose **Browser sign-in** or the available password sign-in and complete the prompts. On a new device, follow the recovery flow for your existing keys.

For a new local-only library, choose **Initialize offline memory store**. This creates recovery material for a library without existing local keys; save that material privately. Do not generate replacement keys for an existing library merely to fix sign-in. Cloud sign-in and sync can be configured separately.

## Connect an AI tool {#connect-an-ai-tool}

Open **Install**, choose an instruction mode and enable the agent you use. The client writes instructions and prepares or installs the matching plugin where supported. Some hosts require you to finish installation or trust hooks in the host itself; follow the result shown on screen and the [agent plugin guide](plugins/).

Review the destination and existing instructions first. Switching mode rewrites instructions for enabled agents; disabling an agent removes its injected instructions but leaves the plugin installed. For DSH, injection can overwrite `~/.dsh/AGENTS.md`; inspect and back up that path first.

## Create and find a memory {#create-and-find-a-memory}

Open **Memories**, choose **New memory**, enter a title and content, then save. Search from the same page or ask your connected AI tool about the saved fact. Similar-memory suggestions need a decision; a pending suggestion is not a completed write.

The [client guide](client.md) covers the pages, screenshots and data boundaries. For models, open **Models & Index**; model weights are downloaded separately and are optional for basic use.

## CLI alternative {#cli-alternative}

The CLI is an alternative for terminal workflows and environments without a usable desktop client. Install a version available in the package registry with one package manager:

```sh
npm i -g rsrs-cli
```

Or use pnpm:

```sh
pnpm add -g rsrs-cli
```

Both commands install the `rsrs` launcher. Choose one, not both. For source builds, see [Development](development.md).

## CLI platforms

These are artifact targets, not a list of published packages. Confirm that the selected version and platform package are available before installation.

| Platform | npm platform package | Rust target |
| --- | --- | --- |
| Linux x64, musl (default) | `@rsrsai/linux-x64` | `x86_64-unknown-linux-musl` |
| Linux ARM64, musl (default) | `@rsrsai/linux-arm64` | `aarch64-unknown-linux-musl` |
| Linux x64, glibc | `@rsrsai/linux-x64-gnu` | `x86_64-unknown-linux-gnu` |
| Linux ARM64, glibc | `@rsrsai/linux-arm64-gnu` | `aarch64-unknown-linux-gnu` |
| macOS Apple Silicon | `@rsrsai/macos-arm64` | `aarch64-apple-darwin` |
| Windows x64 | `@rsrsai/win-x64` | `x86_64-pc-windows-msvc` |
| Windows ARM64 | `@rsrsai/win-arm64` | `aarch64-pc-windows-msvc` |

Linux defaults to the musl package. Select glibc explicitly on a compatible glibc host; the same launcher setting applies to npm and pnpm:

```sh
RSRS_LIBC=glibc rsrs doctor
RSRS_LIBC=musl rsrs doctor
# Keep the selection for subsequent commands in this shell:
export RSRS_LIBC=glibc
```

GNU packages require a compatible glibc host and do not run on Alpine. If optional dependencies were omitted, install the selected platform package at the same version as `rsrs-cli`. Intel Mac is not an artifact target.

## First commands

After installing a compatible CLI:

```sh
rsrs --version
rsrs help
rsrs doctor
rsrs --help
```

| Identity | Command |
|---|---|
| First cloud account | Use the interactive registration steps below |
| Browser login | `rsrs login` or `rsrs login --oauth`; complete dashboard login/TOTP and approve the CLI |
| Terminal login | `rsrs login --interactive`; enter password, TOTP when required, then the super password |
| New device | Use the recovery options described by `rsrs login --help` and [Sync and keys](sync-and-keys.md) |
| Local only | `rsrs keygen --json` |

Use `keygen` only for a new profile without existing keys; do not regenerate keys for an existing library. Save `summary.super` from the JSON output privately as recovery material. To register a cloud account for this new profile, run the commands in a host terminal and enter the password when prompted. Replace YOUR_NAME with your username:

```sh
rsrs keygen --json
rsrs --runtime-internal --stop
rsrs --direct register --user YOUR_NAME
```

Keep recovery material outside Git and chat logs. A server cannot recover a lost client decryption secret. Do not replace existing keys merely to fix a login problem.

The configured default API is `https://api.rsrs.rs`. For a local development server use `--addr http://127.0.0.1:8787`.

Respire uses `~/.rsrs` and runtime port `15169`. Startup keeps the selected account and its settings. To import an older account, use `rsrs migrate` or TUI **Migrate old version**, select its source and choose a new account name. Backup-only directories are excluded, existing destinations are refused and original data remains intact. See [Data model](data-model.md) for migration and recovery details.

```sh
rsrs inject --targets
rsrs inject --id codex
rsrs remember "A reusable decision for this project" --type decision --title "Project decision"
rsrs recall "project decision" --limit 3
rsrs tree
```

A duplicate proposal is not a completed write: inspect it and choose the appropriate action. [Injection](injection.md) · [Walkthrough](walkthrough.md) · [FAQ](faq.md)
