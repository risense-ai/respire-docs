---
name: respire-docs-maintenance
description: Audit or update Respire documentation against its implementation, including desktop features, CLI and plugin behavior, contracts, and paired English and Chinese pages. Use for repository-wide documentation reviews or maintenance in respire-docs.
---

# Respire documentation maintenance

Treat documentation as a description of a particular implementation and version. Read the user's scope and check the working tree before editing. Analysis-only requests are read-only. Keep existing unrelated changes.

## Audit

1. Inventory the requested pages and their paired translations. Record which files were read, the source revisions checked, findings, and any unverified claims. For a full review, inspect each page and its code examples; do not treat a passing build as a factual review.
2. Follow each claim to its owner: CLI and Runtime in `respire-cli`, desktop pages and host actions in `respire-client2`, individual adapters in `plugins`, Core contracts in `respire-core`, server routes in `respire-server`, and website deployment in `respire-site`. Resolve sibling repositories from the checkout, not from a presumed absolute path. If a repository or version is unavailable, record the affected claims as unverified and continue independent work; note uncommitted source changes.
3. Distinguish current source, an explicitly versioned reference, uncommitted changes, a release, and a deployed service. Do not use a newer implementation to rewrite a historical command listing without changing its stated version and verifying the full listing. Do not infer that source code is deployed or that a feature was tested in a host.
4. Check installation, migration, backup, deletion, credentials, data sent to model providers, and uncertain write results against the implementation. Inspect scripts before recommending them, including actions performed before a preview and whether backup paths are overwritten.
5. Report each issue with its document location, supporting source, impact, proposed correction, and verification limits. Prioritize unsafe instructions and data loss, then broken installation and incorrect behavior, followed by omissions, duplication, and prose.

## Update

Honor the requested scope and preserve historical contracts and their consumers. Do not overwrite a machine-readable contract with another repository's current copy until its version, consumers, and compatibility have been checked. Describe unverified behavior as unverified.

For a full review, audit feature coverage for the current desktop client, including its pages, tray, prerequisites, side effects, privacy boundaries, and platform or Runtime requirements. Update the documentation only when the user has authorized edits. Read the relevant page handler and host action before describing a feature.

Keep English and Simplified Chinese public pages paired. Preserve corresponding heading IDs and executable code blocks, and carry technical identifiers into the translation. Write concise natural Chinese: connect the reasoning between sentences, limit nested modifiers, avoid dense abstract subjects, and check ordinary noun–verb usage. Remove repetition without dropping conditions or warnings.

After changes, run `node contracts/validate.mjs` and `npm run build` from this repository when permitted and available. If a check cannot run or fails, report why and retain the unresolved risk. Review the diff, page pairs, removed links, and claims against the source. Report checks actually run and remaining uncertainties; never claim that a build verifies live behavior. Do not publish, send, or alter another repository without authorization.
