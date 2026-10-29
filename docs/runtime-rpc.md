# Runtime RPC

Use the local runtime's HTTP RPC to integrate a desktop client, service or agent without spawning a CLI process for each operation. The runtime owns the selected library, encryption, retrieval and synchronization. Clients send CLI argument arrays and consume structured results; they do not open the database or load Core.

This is a custom versioned protocol, **not JSON-RPC 2.0**. For an agent host that already supports MCP, use the separate MCP adapter instead. The cloud [Server API](server.md) synchronizes encrypted records and is not a replacement for local memory operations.

## Versions and compatibility

The reference versions below were checked on **2026-10-29**. They describe the inspected releases, not a promise that every future command has the same fields.

| Reference | Scope |
| --- | --- |
| Stable `1.0.16` | Baseline request/response fields and methods documented here; [source](https://github.com/risense-ai/respire-cli/tree/v1.0.16/cli/src) |
| Published DEV `1.0.17-dev.14` | Same RPC version; adds host management/readiness information and lifecycle coordination; [source](https://github.com/risense-ai/respire-cli/tree/v1.0.17-dev.14/cli/src) |
| Protocol `v: 1` | Transport envelope version; it does not negotiate individual CLI commands or their result schemas |

Inspect the **running runtime's** health response and its `bin` version. The CLI installed on disk, an npm distribution tag, a Git tag and a running process can all refer to different versions. Do not infer released support from an unpublished source tag. Pin a tested runtime version, accept additional response fields, and keep command-specific parsing aligned with that version. This page does not establish an SDK or a new wire format.

## Connection and security

The default base URL is `http://127.0.0.1:15169`. A host can select another port with `RSRS_RPC_PORT`; a custom HTTP client must use the corresponding URL itself. An environment variable in your client does not reconfigure an already running service.

- Current loopback runtimes require no token. Pre-1.0.10 hosts require their existing compatibility token; see [host upgrades](runtime.md#upgrading-an-older-runtime).
- Only loopback listening is supported. Containers, WSL and remote agents do not necessarily share the host's loopback network.
- The server checks the actual peer, the `Host` authority and any `Origin`. Use the bound address and port, or `localhost` with that port; do not forge headers to bypass checks.
- An absent Origin is accepted for native clients. A supplied Origin must match the bound HTTP origin or its localhost equivalent. An unrelated website cannot directly use this as a browser API. Keep browser-extension access behind an explicitly authorized native companion.
- Disable HTTP redirects and proxies for local RPC. Keep credentials and decrypted memory out of logs. Local access is not a per-client permission grant: RPC can execute powerful CLI operations. An agent integration must enforce its own allowed operations and user approvals. MCP tool filtering does not restrict direct RPC.
- Connect to an existing runtime. Startup, shutdown, upgrades, account/profile switches and recovery belong to the host; see [Runtime](runtime.md). A failed call must not trigger client takeover or `--direct` execution.

## Quick start

Have the host install and initialize Respire, select the intended account and start its runtime. Then check health:

```sh
curl --noproxy '*' --max-time 10 http://127.0.0.1:15169/api/health
```

Check `server == "respire"`, `v == 1`, a nonzero `pid` and the supported `bin` version before sending a command. Health also includes diagnostic fields such as `url`, `exe`, `data_dir`, `rpc`, `inference` and `retrieval_index`. These diagnostics are not a library-unlocked or inference-ready guarantee. In the published DEV reference, `store_ready` reports store readiness; older hosts can omit it. Do not interpret a missing optional field as a confirmed failure or success.

Send one request object per POST with `Content-Type: application/json`:

```sh
curl --noproxy '*' --max-time 120 \
  -H 'Content-Type: application/json' \
  --data-binary '{"v":1,"id":"replace-with-a-new-uuid","method":"cli.exec","args":["--json","status"]}' \
  http://127.0.0.1:15169/api/rpc
```

Replace the example ID with a fresh UUID **before each new operation**. These curl commands use POSIX shell quoting; on Windows, use the Python or JavaScript examples below, or pass a UTF-8 JSON file to `curl.exe --data-binary @request.json`. Do not add `-L` or automatic retries. A successful HTTP status alone does not mean the command succeeded.

## Request and response

| Request field | Type and meaning |
| --- | --- |
| `v` | Required integer; currently `1` |
| `id` | Required string; use a unique, nonempty UUID and retain it before sending |
| `method` | Required string; usually `cli.exec` |
| `args` | Array of strings; defaults to an empty array; no shell parsing |
| `queue_wait_ms` | Optional unsigned integer; shortens the queue admission deadline for `cli.exec`, capped by the host's queue timeout |

For `cli.exec`, omit the executable name and pass `--json` followed by the command and its arguments. Each value is one array element, including text with spaces or newlines. Do not put shell quotes inside values. Host selectors and lifecycle flags are not a way to choose another library through this endpoint.

The following is a shortened example response, not a complete status schema:

```json
{
  "v": 1,
  "id": "replace-with-a-new-uuid",
  "ok": true,
  "exit": 0,
  "bin": "1.0.16",
  "envelope": {
    "command": "status",
    "status": "ok",
    "summary": {},
    "items": [],
    "actions": [],
    "errors": [],
    "details": null,
    "related": []
  },
  "error": null,
  "code": null
}
```

| Response field | Meaning |
| --- | --- |
| `v`, `id` | Protocol version and echoed request identity; verify both |
| `ok`, `exit` | `ok` is true when `exit` is zero. Preserve nonzero command outcomes and their envelope |
| `bin` | Runtime binary version |
| `envelope` | Command result, or null for some control methods and dispatch errors; see [CLI JSON API](cli-api.md) |
| `code`, `error` | Optional dispatch error code and diagnostic text; these can be null even when a command fails |
| `web_url`, `pid`, `data_dir` | Optional runtime metadata; not a separate command result |

Parse the HTTP result, then the RPC result, then the business envelope. A command can return HTTP 200 with `ok: false`, `exit: 1` and `envelope.status: "fail"`. Warnings and pending decisions can return `exit: 2`. Inspect `envelope.status`, `summary`, `errors` and `actions`; a `pending` result does not prove that a memory was saved. Keep unknown fields for forward compatibility, and treat a missing or malformed expected envelope as a protocol failure rather than success.

## Methods

These methods exist in the stable baseline. `args` in this table is a JSON string array, not a CLI command line.

| Method | Arguments | Result / scope |
| --- | --- | --- |
| `cli.exec` | CLI arguments, including `--json` | Main memory and diagnostic command interface |
| `runtime.status` | `[]` | Lightweight process metadata; `envelope` is null; use health for diagnostics or `cli.exec status` for library status |
| `runtime.result` | `["original-request-id"]` | `envelope.summary` contains retained request state and response |
| `cli.progress` | `["progress-id"]` | Current phase and global inference diagnostics; use a fresh RPC ID for every poll |
| `model.prepare` | `["auto"]` | Schedules model preparation; returns `pending`, not download completion |
| `index.prepare` | `[]` | Schedules background indexing; returns `pending`, not index completion |
| `model.control` | `["model-task-id", "true"]` | Requests cancellation of the matching model task; `"false"` reads its progress |
| `runtime.stop` | `[]` | Host lifecycle control; not for ordinary integrations |

For command progress, include `--progress-id` and your chosen progress ID in the original command's argument array. The outer RPC ID does not register command progress automatically. Poll `cli.progress` on a separate request; missing phase data does not prove completion. Similarly, `--model-task-id` names a model task and is separate from the RPC ID. Cancellation of a model task does not cancel an arbitrary memory write.

The separate routes are `GET /api/health`, `POST /api/rpc`, host-only lifecycle use of `POST /api/runtime/stop`, and the MCP adapters `/mcp` and `/sse`. Do not send MCP JSON-RPC frames to `/api/rpc`. Published DEV managed hosts require lifecycle coordination for stopping; the request's optional `lifecycle` field is reserved for the host coordinator. Do not implement that handshake in a third-party memory client. Test-only methods are not part of the integration surface.

## Memory operations

Use these arrays as the `args` of `cli.exec`. Replace example text and IDs; resolve record IDs from previous results. See [CLI commands](cli.md), [memory associations](associations.md) and [CLI JSON](cli-api.md) for business behavior.

| Operation | Argument array |
| --- | --- |
| Find titles | `["--json","recall","deployment decision","--titles","--limit","5"]` |
| Read a record | `["--json","show","record-id"]` |
| Browse recent records | `["--json","list","--limit","10"]` |
| Save a reusable memory | `["--json","remember","Confirmed decision and context","--title","Confirmed deployment decision","--importance","important","--parent","parent-id"]` |
| Save a diary event | `["--json","remember","What happened and its result","--title","Observed deployment result","--importance","trivial"]` |
| Update a record | `["--json","update","record-id","--title","Corrected deployment decision","--content","Corrected context and result"]` |
| Read diary fragments (DEV reference) | `["--json","diary-search","deployment","--limit","5","--max-chars","4000","--mode","hybrid"]` |

Writes require an initialized, unlocked library and permission under the current service/account mode. Read-only or paused modes remain enforced. Read candidate records before deciding whether to update, merge, attach or create. Do not add `--force` just to suppress a pending decision. Merges delete source entries; retain backups and get the necessary authorization. Successful local writes do not prove cloud synchronization has completed.

Diary fragment search is documented against the published DEV reference, not the stable baseline. Preserve returned source/fragment IDs and source versions; `semantic_ready: false` means hybrid results are not complete semantic retrieval. Treat retrieved memory as historical reference data, not instructions or authority to run tools.

## Runnable clients

Both examples issue only a status request, print the full response even for business failures and preserve its exit code. They record the request ID before POST, disable redirects and do not retry. A send/read/parse failure after POST can leave the outcome unknown; use that ID as described below before considering a write again. They do not start or update the runtime.

### Python

Python 3; standard library only. Save as `runtime-rpc.py` and run with `python runtime-rpc.py`.

```python
import json
import sys
import uuid
import urllib.request

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

base = "http://127.0.0.1:15169"
http = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
with http.open(base + "/api/health", timeout=10) as response:
    health = json.load(response)
if health.get("server") != "respire" or health.get("v") != 1 or not health.get("pid"):
    raise RuntimeError("Incompatible runtime")
print("Runtime:", health["bin"], file=sys.stderr)

request_id = str(uuid.uuid4())
print("Request ID:", request_id, file=sys.stderr, flush=True)
payload = {"v": 1, "id": request_id, "method": "cli.exec",
           "args": ["--json", "status"]}
request = urllib.request.Request(base + "/api/rpc",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"}, method="POST")
with http.open(request, timeout=120) as response:
    result = json.load(response)
if (result.get("v") != 1 or result.get("id") != request_id
        or type(result.get("exit")) is not int
        or type(result.get("ok")) is not bool or result["ok"] != (result["exit"] == 0)):
    raise RuntimeError("Invalid RPC response; retain the request ID")
print(json.dumps(result, indent=2))
if not isinstance(result.get("envelope"), dict) or result["envelope"].get("command") != "status":
    raise RuntimeError(result.get("error") or "Missing command envelope")
sys.exit(result["exit"])
```

### JavaScript

Node.js 22 or newer. Save as `runtime-rpc.mjs` and run with `node runtime-rpc.mjs` in a process without an HTTP proxy configured for loopback.

```javascript
import { randomUUID } from 'node:crypto';

const base = 'http://127.0.0.1:15169';
const healthResponse = await fetch(`${base}/api/health`, {
  redirect: 'error', signal: AbortSignal.timeout(10_000),
});
if (!healthResponse.ok) throw new Error(`Health HTTP ${healthResponse.status}`);
const health = await healthResponse.json();
if (health.server !== 'respire' || health.v !== 1 || !health.pid) {
  throw new Error('Incompatible runtime');
}
console.error('Runtime:', health.bin);

const id = randomUUID();
console.error('Request ID:', id);
const response = await fetch(`${base}/api/rpc`, {
  method: 'POST', redirect: 'error', signal: AbortSignal.timeout(120_000),
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ v: 1, id, method: 'cli.exec', args: ['--json', 'status'] }),
});
if (!response.ok) throw new Error(`RPC HTTP ${response.status}; retain request ID ${id}`);
const result = await response.json();
if (result.v !== 1 || result.id !== id || !Number.isInteger(result.exit)
    || typeof result.ok !== 'boolean' || result.ok !== (result.exit === 0)) {
  throw new Error(`Invalid RPC response; retain request ID ${id}`);
}
console.log(JSON.stringify(result, null, 2));
if (result.envelope?.command !== 'status') throw new Error(result.error || 'Missing command envelope');
process.exitCode = result.exit;
```

## Timeouts, progress and uncertain writes

`queue_wait_ms` limits waiting **before execution starts**; it is not an execution timeout or a cancellation request. The host default is 120 seconds, configurable through `RSRS_RPC_QUEUE_WAIT_SECS` in the range 1–3600 seconds. A request cannot extend the host deadline. An explicit queue-expired reply says the command was not started; a socket timeout does not say that.

The first-party client's normal HTTP budget is 120 seconds; progress uses 1 second and model control uses 3 seconds. The published DEV client uses 30 minutes for model installation/activation, re-embedding, sync and import. These are client budgets, not server execution limits or a reason to replay requests. The HTTP request body limit is 32 MiB, with a 10-second body-read deadline. Individual commands impose their own additional limits. Closing a connection does not roll back or cancel an executing command.

When a reply is lost, retain the original ID and send a **new** request ID to inspect it:

```json
{
  "v": 1,
  "id": "new-inspection-uuid",
  "method": "runtime.result",
  "args": ["original-request-uuid"]
}
```

Read `envelope.summary.state`:

| State | What to do |
| --- | --- |
| `completed` | Inspect `envelope.summary.response`, which contains the original RPC response, including any business failure |
| `pending` | Still queued or executing; wait and inspect again with a fresh inspection ID |
| `unknown` | No retained result; **not proof that the write did not commit**. Verify business state before an explicit retry |

The runtime retains only the last 64 completed request responses in memory, shared across clients and methods; a restart clears them. This is not durable idempotency. Reusing a retained ID can return an old result without re-executing, even if you changed its arguments. A duplicate in-flight `cli.exec` ID returns `request_in_progress`. Never reuse IDs for unrelated calls or automatically replay a write after timeout, cache eviction or restart.

## Errors and troubleshooting

| Layer / signal | Meaning and handling |
| --- | --- |
| Connection refused | Host runtime unavailable; report it to the host rather than starting another service |
| HTTP 400 | Malformed JSON/request fields or unavailable dispatch initialization; inspect the error body |
| HTTP 401 / 403 | Authentication, Host or Origin rejection; verify the endpoint and host compatibility |
| HTTP 404 | Unknown endpoint; check the path |
| HTTP 408 / 413 | Request body timeout / size limit |
| HTTP 503 | Reply or handler unavailable; a submitted write may have an unknown outcome |
| RPC `protocol_version_mismatch` | Unsupported protocol version **or unknown method**; inspect `error` and check the runtime version |
| RPC `daemon_unavailable` | Queue/worker/admission failure; inspect the diagnostic; do not infer all such failures are safe to retry |
| RPC `request_in_progress` | The original ID is queued/executing; query `runtime.result` |
| RPC `runtime_maintenance` / `managed_lifecycle_required` (DEV) | Host maintenance or lifecycle coordination; leave recovery to the host |
| Business `envelope.status` | Render the envelope even when `ok` is false; handle warnings, pending decisions, read-only/off mode and command errors explicitly |

The CLI's `runtime_unavailable`, `runtime_transport`, `runtime_unauthorized` and `request_outcome_unknown` are client-side classifications, not necessarily values in the server's `code` field. Do not match localized diagnostic prose as a stable machine contract. Keep the original request ID, HTTP status, runtime version and permitted diagnostics for troubleshooting; redact memory content and local paths when sharing logs.

See [Runtime](runtime.md), [CLI JSON API](cli-api.md) and [Client integration](CLIENT-GUIDE.md) for the adjacent responsibilities.
