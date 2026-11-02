# Cross-repo contracts

Interface snapshots for Respire repositories. Compare the relevant producer revision and consumer pin before a release; these files may lag producer source.

| Contract | Snapshot | Producer or consumer copy |
|---|---|---|
| Core API (crates, modules, distribution) | `core-api.json` | `respire-core/contracts/core-api.json` |
| Core C ABI / business DTOs | `core-abi/` | Core header and safe SDK adapters |
| Server HTTP (sync/auth) | `openapi.yaml` | `respire-server/service/openapi.yaml` |
| CLI artifacts (npm + sidecar names) | `cli-artifact-manifest.json` | `respire-cli/npm/artifact-manifest.json` |
| Client compatibility | `client-compatibility-matrix.json` | `respire-client/contracts/compatibility-matrix.json` |

The Core snapshots match source revision `3bce730191d087c56684ee30743319f4a64918a4`, associated with SDK `1.0.2-dev.16`. The Windows x64 manifest SHA-256 was verified against the CLI lock; other target manifests were not verified. The server still pins SDK `1.0.2-dev.4`; its capabilities must be checked separately. The four model-input streaming functions require the matching SDK capability and build feature.

`rsrs` is the sole command and binary/sidecar prefix; no `respire` or `rs` command alias is provided. The seven artifact targets are listed in [Getting started](../docs/getting-started.md#cli-platforms). The CLI artifact manifest is copied from commit `7b14ada97710`; its scoped package names describe internal artifacts, not the installation entry point. Versions and target entries here do not imply a package has been published or is downloadable.

For installation, use `rsrs-cli`. The snapshot's `npmScope` field still names the old intermediate package because the current CLI packaging code still builds it. The published `rsrs-cli@1.0.19` also depends on that package. This is an unresolved difference between the intended package name and the implementation; changing this snapshot alone would make it inaccurate. The client compatibility matrix is a historical snapshot and has not been verified against the current client.

| Linux launcher selection | Package suffix | Rust target suffix |
| --- | --- | --- |
| Default or `RSRS_LIBC=musl` | `linux-x64` / `linux-arm64` | `unknown-linux-musl` |
| Explicit `RSRS_LIBC=glibc` | `linux-x64-gnu` / `linux-arm64-gnu` | `unknown-linux-gnu` |

The desktop compatibility matrix retains its existing GNU desktop target to musl CLI sidecar mapping. Adding GNU CLI artifacts does not change that mapping or establish a desktop release.

Rules:

- Core is a static library behind the business C ABI; consumers pin SDK manifest SHA-256 and use safe Rust wrappers. Core source is never a submodule.
- CLI binaries are named `rsrs` / `rsrs.exe`. Tauri sidecar files are `rsrs-<rust-target-triple>[.exe]`.
- Server uses the infrastructure app crate at a pinned Git revision; it never depends on the CLI executable crate. The site repository describes a separate Pages deployment for the website and dashboards; verify the actual cutover before assuming it is live.
- Breaking a field in these files is a cross-repo release event: bump the consumer pin (SDK manifest/toolchain pin, infrastructure app Git revision or CLI version) in the same change window.

The OpenAPI snapshot comes from server commit `22096e8e237a`; it does not establish what is deployed. Use the contract from the exact server revision. Validate local consistency with `node contracts/validate.mjs`; this does not compare producer repositories.
