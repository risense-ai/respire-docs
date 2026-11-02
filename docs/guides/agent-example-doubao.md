# Worked example: adding cross-session memory to Doubao

This page shows how to inject `rsrs` instructions for Doubao. Cross-session recall depends on the client loading the instruction file and the agent following it.

## The problem

New conversations may lack earlier project context.

## What injection provides

The injected instructions ask the agent to recall and save reusable conclusions. Memory is stored locally; configured sync can make encrypted records available to the same account on other devices.

| Behavior | Description |
| --- | --- |
| Recall before acting | The agent queries memory at the start of a session |
| Write back conclusions | Reusable results are stored with `rsrs remember` |
| Local storage | The local runtime holds the data; the cloud stores ciphertext |
| Portability | The same account carries memory to other machines and clients |

## Prerequisites

Use the CLI installed by Client 2, or install it separately if needed, and confirm the local Runtime is healthy. The terminal must be able to find `rsrs`; see [CLI access for plugins](../plugins/#using-the-client-managed-cli). For setup details see [Installing on Windows](windows-install.md) and [Getting started](../getting-started.md).

```powershell
rsrs status
```

Check `rsrs status` for the expected mode and any errors. Server is shown only when configured.

## Three steps

The workflow injects rules into the client, optionally starts the MCP server, and restarts the client.

| Step | Command | Effect |
| --- | --- | --- |
| Inject rules | `rsrs --client-only inject --id doubao` | Writes the instruction file for the client |
| Optional MCP server | `rsrs mcp` | Starts a stdio server that exposes memory tools |
| Restart client | Restart the client | Loads the instruction file at startup |

### Inject the workflow rules

```powershell
rsrs --client-only inject --id doubao
```

Use `rsrs --client-only inject --targets` to read the resolved path and detection state for `doubao`; preset paths are conventions, so a custom configuration may differ. The instruction file asks the agent to follow these rules:

- recall memory before the first action in each turn;
- read memory with `--json`;
- write reusable conclusions back with `rsrs remember` before finishing;
- mark reusable conclusions `important` and diary entries `trivial`;
- structure each record with cause, action and effect sections.

### Optional: start the MCP server

```powershell
rsrs mcp
```

The command starts an MCP server over stdio and exposes the memory tools, including `memory_recall`, `memory_remember`, `memory_status`, `memory_list` and `memory_show`. The command line is sufficient for daily use; the MCP endpoint is intended for clients that register MCP servers directly.

### Restart the Doubao client

Restart the client and verify that it loads the resolved `AGENTS.md` path. Injection alone cannot ensure the client reads or follows the instructions.

## Confirming it works

The following commands inspect the injection state and the store. See [CLI commands](../cli.md) for the full command reference.

```powershell
# List clients that have been injected
rsrs --client-only inject --targets

# Show the most recent stored records
rsrs list --limit 10 --json

# Search the store by title
rsrs recall "project keyword" --titles --json
```

Use the `inject --targets` output to confirm the current `doubao` status and resolved path. The `rsrs list` and `rsrs recall` commands return JSON that confirms the store is reachable.

## Pitfalls

| Pitfall | Handling |
| --- | --- |
| Copied paths from another machine | Recorded paths are machine specific; keep conclusions only and verify paths locally |
| Proxy blocks the local runtime | Add `127.0.0.1,localhost` to `NO_PROXY`; a proxy produces `os error 10060` timeouts |
| No automatic hooks | `inject` writes text only; recall and save depend on the agent following the rules |
| Optional MCP registration | Registering `rsrs mcp` is optional and not required for command line use |
| Duplicate saves | Eligible saves run duplicate detection and may propose merges or links; explicit options and trivial entries can skip it |

For the general mechanism and other supported clients, see [Agent integration](../injection.md).
