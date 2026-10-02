# Cross-repo contracts

Canonical interfaces for Respire repositories. Consumers keep matching copies for their checks.

| Contract | Canonical file | Also in |
|---|---|---|
| Core API (crates, modules, distribution) | `core-api.json` | `respire-core/contracts/core-api.json` |
| Core C ABI / business DTOs | `core-abi/` | Core header and safe SDK adapters |
| Server HTTP (sync/auth) | `openapi.yaml` | `respire-server/service/openapi.yaml` |
| CLI artifacts (npm + sidecar names) | `cli-artifact-manifest.json` | `respire-cli/npm/artifact-manifest.json` |
| Client compatibility | `client-compatibility-matrix.json` | `respire-client/contracts/compatibility-matrix.json` |

The main npm package is `@rsrsai/cli`. `rsrs` is the sole command and binary/sidecar prefix; no `respire` or `rs` command alias is provided. The seven artifact targets are listed in [Getting started](../docs/getting-started.md#cli-platforms). Versions and target entries recorded here do not imply a package has been published or is downloadable.

| Linux launcher selection | Package suffix | Rust target suffix |
| --- | --- | --- |
| Default or `RSRS_LIBC=musl` | `linux-x64` / `linux-arm64` | `unknown-linux-musl` |
| Explicit `RSRS_LIBC=glibc` | `linux-x64-gnu` / `linux-arm64-gnu` | `unknown-linux-gnu` |

The desktop compatibility matrix retains its existing GNU desktop target to musl CLI sidecar mapping. Adding GNU CLI artifacts does not change that mapping or establish a desktop release.

Rules:

- Core is a static library behind the business C ABI; consumers pin SDK manifest SHA-256 and use safe Rust wrappers. Core source is never a submodule.
- CLI binaries are named `rsrs` / `rsrs.exe`. Tauri sidecar files are `rsrs-<rust-target-triple>[.exe]`.
- Server uses the infrastructure app crate at a pinned Git revision; it never depends on the CLI executable crate. The marketing site and admin SPA are a separate nginx image (`Deploy Web`), not embedded in the API binary.
- Breaking a field in these files is a cross-repo release event: bump the consumer pin (SDK manifest/toolchain pin, infrastructure app Git revision or CLI version) in the same change window.

Validate locally with `node contracts/validate.mjs`.
