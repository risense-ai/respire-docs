# Client integration {#client-integration}

Respire Client 2 uses a Go and Wails v3 shell with an embedded frontend. It calls named desktop actions, local Runtime RPC and restricted CLI host operations; it does not open the database or implement Core. For a third-party client, start with [Runtime RPC](runtime-rpc.md) and check the running CLI's supported capabilities.

| Responsibility | Owner |
|---|---|
| Desktop, frontend, tray and client updater | `respire-client2` |
| Memory, local identity, sync and Runtime | CLI and its application layer |
| Model execution and retrieval | Core through the CLI SDK |
| Encrypted remote records | Server |

The old `contracts/client-compatibility-matrix.json` describes the Tauri client and its sidecar staging; it is not the Client 2 release matrix. Client 2 selects a CLI release for its own platform, validates its metadata and hashes, then stages the executable and native runtime. An existing compatible Runtime can also be used. A target mapping does not guarantee published assets or compatible optional features.

For development, follow the client repository's [build instructions](https://github.com/risense-ai/respire-client2#build), check the platform dependencies and run the existing checks. The Windows script runs Go vet and frontend syntax checks and produces an executable, checksums and notices. Verify a packaged build in an isolated environment before distribution.

Credentials for supported account operations and model services are passed to the CLI through standard input, not command-line arguments. Do not duplicate key management or inference in the UI. See [Client](client.md), [Contracts](contracts.md) and [Development](development.md).
