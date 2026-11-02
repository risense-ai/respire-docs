# Batch-tidying extracted memories

`rsrs extract` can import session summaries. Without a parent, summaries become roots. This page describes how to inspect and archive them in batches with `resort`. Reattaching cannot exactly restore an originally parentless record.

## The problem

By default, imported summaries use `--importance important` and become roots when no parent is specified. A bulk import can add hundreds of roots at once. These roots are not reported as orphans: `audit` counts an orphan only when a parent id dangles, and a root is not an orphan, so `audit` can be all green while the tree stays fragmented.

## Why the standard tidy does not fix it

The built-in tidy commands do not attach an unparented imported entry automatically:

| Command | Behavior |
| --- | --- |
| `classify --plan` | Local only; performs no semantic grouping, so it usually proposes nothing |
| `classify --tree --auto` | Requires an available classification backend; inspect it with `classify-config` |

Classify entries by working directory and keywords, then attach them with `resort`. Review each entry first.

## Deterministic classification

The flow assigns roots to archive anchors, creates anchors, then attaches children with `resort --spec`. Only `resort` itself previews by default; creating anchors writes data. Back up before writing.

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

Choose the batch. `--since-resort` selects entries created since the last tidy; `--since 1900` sets an early lower bound. `--limit` truncates results, and old entries with an empty creation time are excluded.

```sh
rsrs list --since-resort --limit 500 --json
rsrs list --since 1900 --limit 5000 --json
```

`rsrs list --json` includes full records in `details`; use `rsrs show <id> --json` to inspect an entry.

### Diagnose the tree

Collect the current tree signals before changing anything:

```sh
rsrs audit --json
rsrs tree-cure
rsrs defrag
```

Review same-title groups and defrag clusters entry by entry; similarity alone does not establish duplication. Check for true duplicates, misplaced or broken links, and scattered roots.

### Back up the data

Export a plaintext snapshot to a persistent directory before writing. Use a new path each time: export overwrites existing files. Do not use a temporary directory. The export contains every record in plaintext, so restrict access to the directory (for example, a user-only ACL) and encrypt it when appropriate.

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

A dry run reports `status=pending` and `moved=N`. The write reports `status=ok`, `moved=N`, and `counter=reset`. Split large operations into batches: the safe size depends on the JSON and the platform's command-line limit. Check each batch before writing. PowerShell may drop quotes in a JSON argument, so prefer passing arguments as a list through a script.

### Verify the result

Re-run the checks and inspect each anchor:

```sh
rsrs audit --json
rsrs tree-cure
rsrs resort --status
rsrs tree --outline --json
```

Acceptance criteria: `roots` drops clearly, `lone leaf` falls to or near zero, `orphans=0`, and the TIDY counter is reset. For anchors created empty in this pass, the child count must equal the number of roots attached to them; for anchors that already had children, compare the increase in child count before and after the run instead of the total.

## Diagnosis signals

| Signal | Source | Interpretation |
| --- | --- | --- |
| Root count | `rsrs tree-cure` | Imported summaries that have no parent |
| Lone leaf | `rsrs tree-cure` | A candidate for mounting under an existing node |
| Orphans | `rsrs audit --json` | Dangling parent id; a root is not counted here |
| Same-title groups | `rsrs audit --json` | Review each record; a shared title does not prove duplication |
| Truncated titles | `rsrs audit --json` | Titles cut off during import; review before editing |
| Maximum depth | `rsrs audit --json` | Overall tree depth for context |
| Defrag clusters | `rsrs defrag` | Similarity clusters require individual review before merging |

## Command cheat sheet

| Purpose | Command |
| --- | --- |
| Select a batch | `rsrs list --since-resort --limit 500 --json` |
| Select from an early date | `rsrs list --since 1900 --limit 5000 --json` |
| Diagnose | `rsrs audit --json`, `rsrs tree-cure`, `rsrs defrag` |
| Back up | `rsrs export <persistent-dir>/memories_YYYYMMDD.json` |
| Create an anchor | `rsrs remember "<purpose>" --title "Session archive: <project>" --importance important --parent <tree-name-or-id> --json` |
| Preview an attach | `rsrs resort --spec '<JSON>' --json` |
| Apply an attach | `rsrs resort --spec '<JSON>' --go --json` |
| Reset the counter | `rsrs resort --reset` |
| Read a node | `rsrs show <id> --json` |
| Read a subtree | `rsrs tree --from <id> --depth 3 --json` |

## Single command helper script

The skills repository contains `memory-batch-tidy/scripts/tidy_extracted.py`, but do not run it without review: preview creates anchors, repeated runs overwrite the plaintext export at the same path, and an unrelated same-title anchor can be reused. The script does not chunk operations or save a per-entry undo plan. Review targets manually and use distinct protected backup paths.

## Common pitfalls

1. Preview first. `resort` does not write by default; confirm `status=pending` and `moved=N` before adding `--go`.
2. `resort --go` resets the TIDY counter and reports `counter=reset`. This is expected and no separate `--reset` is needed.
3. The same title does not prove duplication. Review each `same_title_groups` entry.
4. Similarity does not prove duplication. Review defrag clusters and their context before merging.
5. Back up and record children before merging. `remember --merge-ids` deletes the old entries; inspect the result and re-attach any orphaned children.
6. Quoting. Passing a JSON string with quotes to a native program through PowerShell can drop the quotes; pass arguments as a list instead.
7. Console encoding. Windows output encoding varies by environment; set `PYTHONIOENCODING=utf-8` when needed.
8. Oversized batches. Split the spec to fit the platform limit, and keep exports and backups in a persistent directory.

## Rollback

An attachment can be reversed by pointing each child back to its recorded original parent with another `resort` call. Pointing a child at the target tree root does not restore an originally parentless entry, so it is not an exact rollback.

An empty anchor can be removed with `rsrs forget <anchor-id>`, and a soft-deleted entry can be restored with `rsrs restore <full-id>`.

`rsrs import` mints new ids and appends copies; it does not restore in place. Alternatively, create a database snapshot with `rsrs snapshot create` before writing. Restore does not roll back the server and quarantines sync; read the [snapshot instructions](https://github.com/risense-ai/respire-cli/blob/main/docs/snapshots.md) first. Keep a backup because a recoverable revision is not guaranteed for every change.

## Related pages

[Getting started](../getting-started.md), [CLI commands](../cli.md), [CLI JSON](../cli-api.md), [Skills repository](skills-repo.md)
