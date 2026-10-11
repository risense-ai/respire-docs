# Synchronization and keys

Synchronization transfers encrypted records. Decryption, local indexing and retrieval happen on the user's device; the server does not need a model or an account decryption key.

```mermaid
flowchart LR
  A["Device A: keys + SQLite"] <-->|"Encrypted records"| Server["Server: authentication + Postgres"]
  Server <-->|"Encrypted records"| B["Device B: keys + SQLite"]
```

| Mode | Behavior |
| --- | --- |
| Local | No configured remote connection |
| Automatic | The runtime schedules synchronization after supported writes |
| Manual | Run `rsrs sync` explicitly |

`RSRS_NO_AUTOSYNC` overrides the account's `client.json` setting. Setting it to a nonzero value disables automatic synchronization. Explicit `sync` waits for the synchronization attempt to finish.

## Record handling

| Mechanism | Purpose |
| --- | --- |
| Dirty records / outbox | Preserve local edits awaiting acknowledgement |
| Ordered server cursor | Download changes without depending on device clocks |
| Tombstone | Synchronize deletion intent |
| Retained versions | Preserve conflicts and history for review |
| Local feature artifact | Rebuildable retrieval data; separate from the encrypted content revision |

See [synchronization v2](sync-v2-rollout.md) for conflict decisions and server recovery.

## Key ownership

```mermaid
flowchart TD
  Secret["Super password + Account Secret"] --> Wrap["Key derivation and wrapping"]
  Wrap --> URK["User root key"]
  URK --> Data["Local data and embedding encryption keys"]
  Data --> Records["Encrypted records"]
```

| Change | Effect |
| --- | --- |
| Login password | Changes authentication credentials |
| Super password reset | Rewraps the root key; does not rewrite every record |
| New device | Requires authentication and the necessary key-recovery material |
| Logout | Follow `logout --help`; removing local identity is separate from revoking a remote session |

Legacy v1 recovery uses the original login password plus Account Secret, with no separate super password. The wrapping diagram above describes accounts with a separate super/recovery factor; do not request a replacement super password for v1 recovery. Normal login preserves the vault version and encrypted read/write format. Only explicit namespace migration rewrites the selected copy, and it retains the original factors and source.

The server stores opaque vault versions 1 through 4 at `POST /api/self/vault`. For the first upload of recovery material, send `If-None-Match: *` to create only a missing vault. If another vault already exists, the server returns `412` and preserves that vault; the client must read and verify it instead of overwriting it. Invalid fields, versions or unsupported conditions return `400`. A request without the condition keeps the existing upsert behavior and is not safe for first-time recovery initialization.

`POST /api/self/vault` additionally accepts the optional `wrapped_urk_server` and `server_urk_nonce` fields: a second, opaque wrapping of the same URK under a server KMS envelope key. Both are additive and optional — omitting them keeps the existing vault and any stored envelope, and `GET /api/self/vault` returns them, empty until set. The server still stores only opaque strings and derives no client keys; a host that holds the envelope key can unwrap the URK without the super password, which the CLI does when `RSRS_SERVER_KEK` is set.

The vault API contract is mirrored between repositories: `respire-server/service/openapi.yaml` carries the request fields and `respire-docs/contracts/openapi.yaml` keeps the canonical copy. Optional fields are additive, so the copies stay compatible without a consumer pin bump. The corresponding server schema migration (`0007_vault_server_envelope`, schema version 8) must be applied before clients write the envelope fields, because an older server ignores unknown JSON fields and stores the vault without the envelope.

Keep migration credentials, Account Secret and session files private. Do not add them to repositories or send them through ordinary plugin payloads.

## Backup

| Backup | Contains | Recovery requirement |
| --- | --- | --- |
| `export` | Plaintext records | Protect the exported file |
| `backup` | Local SQLite database | Keep the matching key material |
| Key recovery material | Account secrets or wrapped-key access | Store independently from the database backup |

Before replacing an active database, stop the corresponding runtime and follow the installed restore procedure. Verify a restored copy before relying on a backup.
