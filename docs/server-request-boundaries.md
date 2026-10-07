# Server request boundaries

These limits apply to the HTTP entry point of `respire-server serve`. They bound transport work without changing authentication or synchronization semantics.

| Variable | Default | Purpose |
| --- | --- | --- |
| `RSRS_MAX_BODY_BYTES` | 8,388,608 | Maximum request body size |
| `RSRS_HEADER_TIMEOUT_MS` | 10,000 | Header deadline |
| `RSRS_BODY_TIMEOUT_MS` | 30,000 | Body deadline |
| `RSRS_CONNECTION_TIMEOUT_MS` | 70,000 | Absolute connection deadline, including response writing |
| `RSRS_MAX_CONNECTIONS` | 64 | Maximum live connections and associated database tasks |

Configured values must be positive decimal integers. Invalid configuration fails before listening; capacity and platform bounds are also checked.

```mermaid
flowchart LR
  TCP["Accepted connection"] --> Capacity["Capacity permit"]
  Capacity --> Headers["Header deadline"]
  Headers --> Body["Body size + deadline"]
  Body --> DB["Bounded Postgres worker"]
  DB --> Reply["Response within connection deadline"]
```

| Input / event | Result |
| --- | --- |
| Body exceeds limit | 413; does not enter database handling |
| Body equals limit | Accepted by transport; normal validation still applies |
| Chunked body | Enforced cumulative size limit |
| Truncated or malformed request | Explicit failure, not an empty successful request |
| Body deadline exceeded | 408 or connection failure |
| Capacity exhausted | Connection rejected rather than queued without bounds |
| Database unavailable | 503 where reported by the API; not a false authentication failure |

A connection timeout closes the socket; it does not roll back database work that has already begun. The server does not automatically replay a request with an uncertain commit outcome.

## Logs

Logs contain bounded diagnostics such as method, path, status and duration. They exclude request bodies, authorization headers, password hashes, salts, session tokens and query strings.

These transport limits do not replace a reverse proxy, deployment-specific rate limits or backup procedures. See [server](server.md) and [deployment](server-deployment.md).
