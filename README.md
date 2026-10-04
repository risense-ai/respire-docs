# Respire documentation

User guides, architecture references and cross-repository contracts for Respire.

| Guide | Topic |
| --- | --- |
| [Overview](docs/index.md) | Components and data flow |
| [Getting started](docs/getting-started.md) | Setup and first memory |
| [Architecture](docs/architecture.md) | Storage, keys and execution |
| [Development](docs/development.md) | Build prerequisites and checks |
| [Contracts](contracts/README.md) | ABI, HTTP, CLI and sidecar compatibility |

## Develop

```sh
npm ci
node contracts/validate.mjs
npm run dev
npm run build
```

The development server listens on `http://127.0.0.1:4173`.

Pushing `main` builds a development documentation artifact in Actions. A stable `vX.Y.Z` tag publishes the built documentation and checksums in this repository's Releases. This workflow does not enable Pages or deploy production.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [LICENSE](LICENSE).

## License

First-party material is offered under [PolyForm Noncommercial 1.0.0](LICENSE).
Personal noncommercial use and self-hosting are permitted; commercial use,
including internal commercial deployment, requires a separate written license.
See [commercial licensing and component exceptions](COMMERCIAL-LICENSE.md).
