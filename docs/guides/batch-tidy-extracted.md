# Batch-tidying extracted memories

`rsrs extract` imports sessions from supported platforms and writes one summary memory per session. Each summary is created without a parent, so a large import leaves many scattered root nodes. This page describes a deterministic, model-free way to group those roots under archive anchors and attach them in a single pass with `resort`. The approach is reversible and does not depend on any model service.

## The problem

Each session import produces one summary whose body records the source platform and session id, the working directory, the model, the first instruction, and the last update time. The summary is written with `--importance important` and with no resolved parent, so every entry becomes a root node. A bulk import can add hundreds of roots at once. These roots are not reported as orphans: `audit` counts an orphan only when a parent id dangles, and a root is not an orphan, so `audit` can be all green while the tree stays fragmented.

## Why the standard tidy does not fix it

The built-in tidy commands do not attach an unparented imported entry automatically:

| Command | Behavior |
| --- | --- |
| `classify --plan` | Local only; performs no semantic grouping, so it usually proposes nothing |
| `classify --tree --auto` | Requires a configured classification backend, set with `classify --ds <key>` |

Because neither path reliably covers imported summaries, use deterministic classification instead: assign a rule per entry, build archive anchors, then batch attach with `resort`. The result needs no model and can be rolled back.

## Deterministic classification

The flow assigns each scattered root to an archive anchor by working directory and keyword rules, creates the anchors under a chosen tree root, and attaches every child with a single `resort --spec` call. `resort` previews by default and writes only with `--go`, so nothing changes until the preview is confirmed. Keep a full export snapshot before any write; the local store has no version history and `update` and `merge` are not reversible.

## Prerequisites

Confirm the installed options before starting. This page does not pin a version; check the local binary:

```sh
rsrs --version
rsrs --help
rsrs prompt --json
```

Then inspect the local store and tidy state:

```sh
rsrs status
rsrs resort --status
rsrs tree-cure
```

Read `data_dir` from `rsrs status` and use that path in later commands. Do not copy paths from another device.

### Restricted and sandbox hosts

On a restricted or sandbox host, append `--client-only` to every command on this page so it connects to the existing authenticated local runtime. Do not use `--direct`. If the connection or authentication fails, report it to the host owner instead of changing the runtime lifecycle.

```sh
rsrs --client-only status
rsrs --client-only resort --status
rsrs --client-only tree-cure
```

## Step by step flow

### Select targets

Choose the batch. `--since-resort` means everything added since the last tidy, which is the default scope; `--since 1900` covers the whole store.

```sh
rsrs list --since-resort --limit 500 --json
rsrs list --since 1900 --limit 5000 --json
```

The output contains only a short id and a title, with no parent or importance. Read details with `rsrs show <id> --json`.

### Diagnose the tree

Collect the current tree signals before changing anything:

```sh
rsrs audit --json
rsrs tree-cure
rsrs defrag
```

Treat most same-title groups and defrag clusters as false positives. The entry types that genuinely need action are true duplicate entries, mis-attached or broken links, and scattered roots.

### Back up the data

Export a full plaintext snapshot to a persistent directory before writing. Do not use a temporary directory.

```powershell
rsrs export C:\Users\<user>\rsrs-backups\memories_YYYYMMDD.json
```

```bash
rsrs export ~/rsrs-backups/memories_YYYYMMDD.json
```

### Create archive anchors

Create one archive container per project or topic under the target tree root. Attach every anchor with `--parent`; never store an anchor as a bare root. `--parent` accepts an id, an eight-character prefix, or a tree name.

```sh
rsrs remember "<purpose of this archive>" \
  --title "Session archive: <project>" \
  --type context --importance important \
  --parent <tree-root-or-id> --json
```

Keep the anchor title at or under 80 characters. An anchor is an archive container, not a new catalog node; create a new catalog node only with explicit agreement and `root-create --yes`.

### Define classification rules

Decide the anchor for each scattered root from its working directory and keywords, and order the rules from specific to general so a specific project is tested before a shared word. When the working directory is often missing, fall back to title and body keywords.

| Archive anchor | Match rule (title, body, or working directory) | Notes |
| --- | --- | --- |
| Session archive: project A | Unique keywords for project A | |
| Session archive: project B | Unique keywords for project B | |
| Session archive: other | Matches none of the above | Fallback, evaluated last |

### Attach in batches

`resort --spec` accepts an id, an eight-character prefix, or a tree name for both `id` and `parent`. It is a dry run by default; add `--go` to write.

```jsonc
{
  "ops": [
    { "id": "<child-short-id>", "parent": "<anchor-short-id>" }
  ]
}
```

```sh
rsrs resort --spec '<JSON>' --json
rsrs resort --spec '<JSON>' --go --json
```

A dry run reports `status=pending` and `moved=N`. The write reports `status=ok`, `moved=N`, and `counter=reset`. Chunk the operations at roughly 300 entries per call because the JSON approaches the command-line length limit on Windows, around 32 KB. Quoting a JSON argument with quotes through PowerShell can drop the quotes, so prefer passing arguments as a list through a script instead of the shell.

### Verify the result

Re-run the checks and inspect each anchor:

```sh
rsrs audit --json
rsrs tree-cure
rsrs resort --status
rsrs tree --outline --json
```

Acceptance criteria: `roots` drops clearly, `lone leaf` falls to or near zero, `orphans=0`, and the TIDY counter is reset. The sum of children under the anchors must equal the number of roots attached in this pass.

## Diagnosis signals

| Signal | Source | Interpretation |
| --- | --- | --- |
| Root count | `rsrs tree-cure` | Imported summaries that have no parent |
| Lone leaf | `rsrs tree-cure` | A candidate for mounting under an existing node |
| Orphans | `rsrs audit --json` | Dangling parent id; a root is not counted here |
| Same-title groups | `rsrs audit --json` | Usually false positives from a shared summary first line |
| Truncated titles | `rsrs audit --json` | Titles cut off during import; review before editing |
| Maximum depth | `rsrs audit --json` | Overall tree depth for context |
| Defrag clusters | `rsrs defrag` | Similarity clusters; mostly false positives, do not merge |

## Command cheat sheet

| Purpose | Command |
| --- | --- |
| Select a batch | `rsrs list --since-resort --limit 500 --json` |
| Select the whole store | `rsrs list --since 1900 --limit 5000 --json` |
| Diagnose | `rsrs audit --json`, `rsrs tree-cure`, `rsrs defrag` |
| Back up | `rsrs export <persistent-dir>/memories_YYYYMMDD.json` |
| Create an anchor | `rsrs remember "<purpose>" --title "Session archive: <project>" --importance important --parent <tree-name-or-id> --json` |
| Preview an attach | `rsrs resort --spec '<JSON>' --json` |
| Apply an attach | `rsrs resort --spec '<JSON>' --go --json` |
| Reset the counter | `rsrs resort --reset` |
| Read a node | `rsrs show <id> --json` |
| Read a subtree | `rsrs tree --from <id> --depth 3 --json` |

## Single command helper script

A helper script can run the whole sequence on the same host. It exports a snapshot, finds the unparented roots, classifies them, creates or reuses anchors, and then previews or writes a `resort --spec`. It runs a dry run by default.

Edit the configuration block at the top of the script:

- `PREFIXES` lists the title prefixes treated as scattered roots. If imported entries carry a tag such as `session-import`, the script detects the tag first and uses the prefix as a fallback.
- `TARGET_ROOT` is the tree root under which anchors are created. Use a built-in catalog name or a node id.
- `ANCHORS` maps each topic to its keyword rules. Keep the final fallback entry and do not delete it.

```bash
python tidy_extracted.py
python tidy_extracted.py --go
python tidy_extracted.py --rsrs <path-to-rsrs> --client-only --backup <snapshot-path>
```

The script ships with the related skill in `memory-batch-tidy/scripts/tidy_extracted.py`. See [Skills repository](skills-repo.md) for the surrounding layout, and [CLI commands](../cli.md) and [CLI JSON](../cli-api.md) for the underlying options.

## Common pitfalls

1. Preview first. `resort` does not write by default; confirm `status=pending` and `moved=N` before adding `--go`.
2. `resort --go` resets the TIDY counter and reports `counter=reset`. This is expected and no separate `--reset` is needed.
3. The same title is not the same entry. Summaries share a boilerplate first line, so `same_title_groups` is usually a false positive.
4. Defrag clusters are mostly false positives. Never merge a catalog root, differing sections of one sentence pattern, or separate branches of a tree.
5. Check descendants before merging. A real duplicate merge with `remember --merge-ids` deletes the old entry, so inspect its children and re-attach any orphaned children to the new entry immediately.
6. Quoting. Passing a JSON string with quotes to a native program through PowerShell can drop the quotes; pass arguments as a list instead.
7. Console encoding. On Windows, Python defaults to cp1252 and can fail while printing; set `PYTHONIOENCODING=utf-8` or reconfigure stdout to UTF-8 first.
8. Oversized batches. Split a spec above roughly 300 operations, and keep exports and backups in a persistent directory.

## Rollback

Re-attachment is reversible. Point each child back to its original parent, or to the target tree root, with another `resort` call, or replay the changes against the snapshot from the backup step.

An empty anchor can be removed with `rsrs forget <anchor-id>`, and a soft-deleted entry can be restored with `rsrs restore <full-id>`.

For a full restore, use the export snapshot. The local store keeps no version history, so `update` and `merge` are not reversible and a backup is required before any write.

## Related pages

[Getting started](../getting-started.md), [CLI commands](../cli.md), [CLI JSON](../cli-api.md), [Skills repository](skills-repo.md)
