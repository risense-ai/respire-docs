# Windows packaging {#windows-packaging}

Respire Client 2 publishes a Windows executable for each supported architecture. The desktop requires Microsoft Edge WebView2; it does not bundle the CLI, Core runtime or model weights. The client downloads a matching CLI and native runtime separately, and can use a compatible existing local Runtime.

The repository's Windows build script produces `dist/respire-windows-<arch>.exe`, `dist/SHA256SUMS`, `dist/LICENSE.txt` and `dist/THIRD_PARTY_NOTICES.txt`. It runs Go vet and frontend syntax checks. For build prerequisites and commands, see the [client README](https://github.com/risense-ai/respire-client2#build).

The CLI release metadata identifies the target, binary and runtime archive and their SHA-256 hashes. Client 2 validates the downloaded files, executable architecture and the files listed in `core-runtime.json`. Missing matching assets are reported; another architecture is not substituted. Desktop updates use their own release assets and checksum file. The release currently has no publisher-key signature or Authenticode signature; a checksum from the same release source cannot protect against compromise of that source.

Before distribution, check the target, checksums, notices, WebView2 prerequisite and startup in a clean environment. Verify CLI and model availability separately; a desktop build does not establish that every matching CLI asset is published or that model files are available offline.

[Client integration](CLIENT-GUIDE.md)
