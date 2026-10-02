# Runtime flow

```mermaid
flowchart LR
  Command["CLI command"] --> Runtime["Local runtime"]
  Page["Web / Desktop"] --> Runtime
  Runtime --> Store["Infrastructure crypto / SQLite"]
  Runtime --> SDK["Safe SDK"]
  SDK --> Core["Core"]
  Store <-->|Ciphertext| Server["Sync server"]
```

| Path | Flow |
|---|---|
| Write | Validate input → obtain Core proposals/features → authorize changes → encrypt and persist |
| Read | Load authorized local snapshots → Core selects final results/context → final output |
| Tree changes | Update encrypted parent metadata and local index together |
| Sync | Pull revisions/tombstones → apply conflict rules → push dirty records → save cursor |
| Injection | CLI template → managed block in the target AI tool |

The runtime owns the data-directory lock. Normal commands use the runtime when available. Direct maintenance requires stopping the runtime first; use the installed CLI's help for supported flags.

Derived rows must match their current source ciphertext, model and index generation. Record updates or model changes invalidate stale features; rebuild rather than treating incompatible artifacts as valid.

```mermaid
sequenceDiagram
  participant UI as CLI / UI
  participant App as Infrastructure app
  participant Core as Core
  participant DB as Local store
  UI->>App: Authorized operation
  App->>DB: Load current records
  App->>Core: Business request / opaque features
  Core-->>App: Final results or proposals
  App-->>UI: Final output
```

[Development](development.md) · [Contracts](contracts.md)
