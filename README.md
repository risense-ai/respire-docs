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

## Cloudflare Pages

The `respire-docs` Pages project uses its GitHub integration to publish `main` at
<https://docs.rsrs.rs>. Set the project root to this repository, the build command
to `npm ci && node contracts/validate.mjs && npm run build`, and the output directory
to `docs/.vitepress/dist`. `.node-version` pins Node.js 22, matching Docs CI, and
`wrangler.toml` keeps the publish directory in version control. Publish only this
generated directory, never the repository root.

Pull requests receive Pages previews. After merging to `main`, check the production
deployment in Cloudflare. To roll back, select a previous successful production
deployment in Pages; revert the corresponding commit before the next automatic
deployment if the rollback should persist.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [LICENSE](LICENSE).

## License

First-party material uses the [Respire Noncommercial License 1.0](LICENSE).
Personal noncommercial use and self-hosting are permitted. Commercial use,
including internal business deployment, requires prior written authorization.
See [commercial licensing](COMMERCIAL-LICENSE.md).
