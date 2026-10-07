# Architecture

The local library is the working source of truth. The server stores encrypted records; local retrieval does not require a server request.

The resident runtime loads ONNX and performs inference in the same process.
One shared model session queues inference calls. The host reads model/tokenizer
bytes and supplies explicit settings to Core. Model files and CPU/GPU/NPU
selection are global host resources. Account switching selects a different library and index,
while preserving those global settings. HTTP health and progress handlers remain
available while command and background threads perform model work.

Clients preserve existing runtime tokens on the initial health, RPC and stop
request. New loopback runtimes ignore the header; authenticated older runtimes
still require it. Removing server-side authentication does not remove client
upgrade compatibility. Host takeover verifies the runtime, stops it gracefully,
then waits for its process, listener and library lock before starting a successor.
Restricted clients cannot perform lifecycle operations.

Every published stable CLI version from 1.0.6 onward is an upgrade source in the
release validation matrix. The inventory is read dynamically, so each new stable
release becomes a source for later releases. Missing artifacts or failed checks
block publication. A 1.0.6 DEV artifact is an additional historical baseline
because a formal 1.0.6 artifact is unavailable in the current release registries.

```mermaid
flowchart LR
  Entry["Authorized plaintext entry"] --> Crypto["Application encryption layer"]
  Crypto --> Cipher["Encrypted record"]
  Cipher --> DB[("Local SQLite")]
  Entry --> SDK["Safe Rust SDK"]
  SDK --> Core["Model / retrieval engine"]
  Core --> Artifact["Opaque local features"]
  Artifact --> Host["Host persists opaque bytes"]
  Host --> DB
  DB <-->|Encrypted sync| Cloud[("Server storage")]
```

| Trust boundary | Owns |
|---|---|
| Infrastructure client layer | Account keys, authorized plaintext, encryption, sync, files, database, model loading and HTTP |
| Core | In-memory inference, opaque data structures, feature interpretation, retrieval, ranking, context policies and request planning |
| Server | Authentication and encrypted records; no client decryption keys |
| UI | Final results and authorized writes through CLI operations |

Local metadata and derived features are not part of the sync wire DTO. Feature artifacts are rebuildable local data, not encrypted secrets. Final scores and authorized plaintext remain observable at runtime.

Core does not resolve paths, select filenames, read environment variables or open
files/databases. The host passes bytes and explicit settings, not a storage path.
The private index encoding and algorithms stay in Core; infrastructure code only
stores opaque bytes bound to their source ciphertext and index generation.

| Operation | Result |
|---|---|
| Remember / update / forget | Write locally, then allow runtime background sync |
| Recall | Local final results from Core |
| Password changes | Update key wrapping rather than re-encrypting every memory |
| Delete | Sync a tombstone; preserve convergence across devices |

See [Data model](data-model.md), [Runtime flow](architecture-internals.md) and [Sync and keys](sync-and-keys.md).
