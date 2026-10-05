# FAQ

| Question | Answer |
|---|---|
| What do source builds need? | Docs/frontend build independently; CLI/server also need the matching Core SDK. See [Development](development.md). |
| What command should I use? | `rsrs` is the only CLI command and binary/sidecar prefix. The product is Respire; `respire` and `rs` are not command aliases. |
| Does the server see memory content? | Sync records are encrypted; decryption keys stay on the client. |
| Are opaque artifacts encrypted? | No. They are rebuildable local derived features. |
| Where is the dashboard? | `rsrs web` opens `https://dash.rsrs.rs`. The CLI does not host an embedded website. |
| Why is my model not found? | Run `rsrs doctor`; check any explicit `ONEMEMORY_MODEL_DIR`. An invalid explicit path is not silently replaced. |
| Why does sync fail? | Check identity, token, configured server and network. Preserve the local database while diagnosing. |
| Why is the installed version old? | Check PATH for another `rsrs` before the intended executable. |
| Why does injection not take effect? | Check the managed block and target tool configuration, then restart long-running sessions. |
| Does Respire reuse the older local account? | Choose a source with `rsrs migrate` or TUI **Migrate old version**. Startup does not import accounts. Migration preserves original data and available decryption credentials, refuses existing destinations and does not reset encryption keys. |
| Why do some environment variables still start with ONEMEMORY? | They are explicit compatibility interfaces; default data/runtime state is separate. |

[Getting started](getting-started.md) · [Development](development.md) · [Injection](injection.md) · [Sync and keys](sync-and-keys.md)
