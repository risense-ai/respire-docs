# Worked example: adding cross-session memory to Doubao

Chat clients such as Doubao keep each conversation isolated. A new session starts with no knowledge of earlier decisions, preferences or file paths, so the same context has to be restated every time. This page connects a Doubao client to the `rsrs` CLI so the client retains memory across sessions.

## The problem

Doubao has no cross-session memory by default. Each new conversation begins from a blank context, so project names, conventions and earlier decisions are lost between sessions.

## What injection provides

After the client is connected to rsrs, the agent recalls stored memory before acting and writes reusable conclusions back when a task ends. Memory is stored locally, while the cloud keeps ciphertext only. Records follow the account, so they remain available across machines and across clients.

| Behavior | Description |
| --- | --- |
| Recall before acting | The agent queries memory at the start of a session |
| Write back conclusions | Reusable results are stored with `rsrs remember` |
| Local storage | The local runtime holds the data; the cloud stores ciphertext |
| Portability | The same account carries memory to other machines and clients |

## Prerequisites

Install the CLI and confirm that the local runtime is healthy. For setup details see [Installing on Windows](windows-install.md) and [Getting started](../getting-started.md).

```powershell
npm i -g @rsrsai/cli
rsrs status
```

`rsrs status` reports Mode, User, Server and Memories. Continue when each of them reports PASS.

## Three steps

The workflow injects rules into the client, optionally checks the MCP endpoint, and restarts the client.

| Step | Command | Effect |
| --- | --- | --- |
| Inject rules | `rsrs --client-only inject --id doubao` | Writes the instruction file for the client |
| Verify MCP | `rsrs mcp` | Starts a stdio server that exposes memory tools |
| Restart client | Restart the client | Loads the instruction file at startup |

### Inject the workflow rules

```powershell
rsrs --client-only inject --id doubao
```

A `doubao PASS updated` result confirms the write. The command writes `~/.doubao/AGENTS.md`, or `C:\Users\<user>\.doubao\AGENTS.md` on Windows. The file contains the memory rules the client follows:

- recall memory before the first action in each turn;
- read memory with `--json`;
- write reusable conclusions back with `rsrs remember` before finishing;
- mark reusable conclusions `important` and diary entries `trivial`;
- structure each record with cause, action and effect sections.

### Verify the MCP endpoint

```powershell
rsrs mcp
```

The command starts an MCP server over stdio and exposes the memory tools, including `memory_recall`, `memory_remember`, `memory_status`, `memory_list` and `memory_show`. The command line is sufficient for daily use; the MCP endpoint is intended for clients that register MCP servers directly.

### Restart the Doubao client

`AGENTS.md` is read when the client starts. Restart the client after injection so the rules take effect, then open a new conversation.

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

In the `inject --targets` output, the `doubao` row shows `PASS fresh ~/.doubao/AGENTS.md` when the rules are present. The `rsrs list` and `rsrs recall` commands return JSON that confirms the store is reachable.

## Pitfalls

| Pitfall | Handling |
| --- | --- |
| Copied paths from another machine | Recorded paths are machine specific; keep conclusions only and verify paths locally |
| Proxy blocks the local runtime | Add `127.0.0.1,localhost` to `NO_PROXY`; a proxy produces `os error 10060` timeouts |
| No automatic hooks | `inject` writes text only; recall and save depend on the agent following the rules |
| Optional MCP registration | Registering `rsrs mcp` is optional and not required for command line use |
| Duplicate saves | New saves run duplicate detection first and may propose merges or links |

Do not copy recorded paths from another machine; a recorded path is valid only on the machine that produced it. A proxy that intercepts localhost traffic blocks the local runtime, so if `rsrs recall` fails with `os error 10060`, add `127.0.0.1,localhost` to `NO_PROXY`. The `inject` command writes instruction text and installs no hooks, so memory recall and save depend on the agent following the injected rules; MCP registration is optional. New saves run duplicate detection before a record is created.

For the general mechanism and other supported clients, see [Agent integration](../injection.md).
