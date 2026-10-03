# Data model

Respire uses `~/.rsrs`. Startup discovers existing accounts in `~/.onememory` and `~/.respire` and migrates their data, settings and available credentials. The original directories remain intact. Existing `ONEMEMORY_*` options remain explicit compatibility interfaces.

| Local item | Purpose |
|---|---|
| `~/.rsrs/onememory.db` | Encrypted records plus local metadata and feature indexes; the filename remains compatible |
| `session.json` | Identity, address, token and key material |
| `client.json` | Client preferences, server address and autosync settings |
| `lock.db` | Exclusive local runtime lock |
| `~/.rsrs/models/` | Default tokenizer/model resources |
| `~/.rsrs/inference.json` | Inference-engine settings |

`ONEMEMORY_DATA_DIR` selects the data root. Do not commit session files, database copies or recovery material.

An explicitly configured `ONEMEMORY_DATA_DIR` selects that directory and bypasses default-directory migration. Explicit model-directory options remain compatible overrides.

The local runtime defaults to port `15169`; migration does not connect to or stop the older runtime on `15168`. The desktop application identifier is `ai.risense.respire`. Cryptographic derivation and sync formats remain compatible.

## Existing accounts

```mermaid
flowchart LR
  Old[".onememory / .respire"] --> Snapshot["Consistent database snapshot"]
  Credentials["Existing session and credential store"] --> Check["Verify the original encryption key"]
  Snapshot --> New[".rsrs accounts"]
  Check --> New
  New --> API["api.rsrs.rs"]
```

Migration retains account identities, encrypted records and pending local changes. Existing destination accounts are not overwritten. Each imported account keeps its original encryption material; the process does not reset a vault, generate replacement keys or send credentials to another service. The configured remote API changes to `https://api.rsrs.rs`.

Saved credentials can unlock the existing account without another login. If a session has expired and its login password was never saved, sign in with the original account password. If the original decryption secret is no longer available in the operating-system credential store, use the original recovery material. Copying an encrypted database alone cannot reconstruct a missing secret.

The operating system may request permission to access an existing credential. If an older runtime is still writing, migration preserves a consistent snapshot; later unsynced writes remain in the original directory. Unknown external data directories and early demo database formats require explicit migration with the original version's export/import tools. Unsupported data is left intact rather than replaced.

```mermaid
flowchart TB
  Entry["MemoryEntry: authorized plaintext"] --> Encrypt["Application AES-GCM layer"]
  Encrypt --> Wire["StoredMemory: ciphertext sync fields"]
  Entry --> Meta["Local metadata"]
  Entry --> Core["Core"]
  Core --> Features["Opaque features / artifact"]
  Wire --> DB[("Local SQLite")]
  Meta --> DB
  Features --> DB
  Wire --> Cloud["Server"]
```

| Plaintext field | Meaning |
|---|---|
| `id` | Client-generated record ID |
| `kind` | Memory category; wire casing is defined by the typed protocol |
| `tags / title / content` | Searchable/displayed entry content |
| `user / computer / project` | Ownership and local scope |
| `created_at / updated_at` | Record timestamps |
| `parent_id` | Empty for a root; otherwise the causal parent |
| `importance` | New entries use `important` or `trivial`; legacy values remain readable |
| `device / modified_by` | Creation and last-update device attribution |

| Server-visible sync field | Purpose |
|---|---|
| `id / user` | Record identity and account routing |
| `ciphertext / nonce` | Encrypted payload |
| `embedding_enc` | Existing encrypted feature compatibility field |
| `updated_at / deleted` | Conflict resolution and tombstones |

Local metadata, `local_embedding`, `local_chunks` and `local_artifact` are skipped by sync serialization. Infrastructure code treats feature payloads as bytes. Artifacts are bound to source records/model generation and can be rebuilt; their internal schema is not public.

Exported entry JSON is plaintext. Imports may create new IDs and rebuild parent mappings; protect exported files accordingly. See [CLI](cli.md) and [Sync and keys](sync-and-keys.md).
