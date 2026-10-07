# Browser authorization and TOTP

The producer is `risense-ai/respire-server`. Homepage, Dashboard and Admin are owned by `risense-ai/respire-site`. Cloud frontend
builds set the public `VITE_API_BASE_URL` to the chosen HTTPS API origin, normally
`https://api.rsrs.rs`. No secret belongs in a `VITE_*` variable.

## CLI authorization and TOTP management

CLI browser sign-in uses the OAuth device grant: form-encoded `POST /oauth/device/code`
with public `client_id=respire-cli`, then `POST /oauth/token` with
`grant_type=urn:ietf:params:oauth:grant-type:device_code`. Device grants expire in
600 seconds and require at least five seconds between polls. `slow_down` adds
five seconds to the client's interval. Approval creates a normal revocable user
session once; denial, expiration and replay do not create sessions. Device codes
are private and are stored only as hashes. Access tokens never enter URLs.

The verification origin is server-owned `RSRS_DASHBOARD_URL`, defaulting to
`https://dash.rsrs.rs`; DEV must set `https://dash.dev.rsrs.rs`. The Dashboard
route `/#/authorize` accepts a displayed user code; `/#/authorize?code=...`
prefills it. After normal password and TOTP sign-in, the page shows the account,
device and user code and requires an explicit approve/deny action through
`/api/self/cli-authorization/{code}`. Readonly sessions cannot approve. The CLI
checks the returned verification origin and requests the memory super password
locally after approval; the server never receives that decryption factor.

Authenticated TOTP confirm/disable failures use HTTP 400; HTTP 401 continues to
mean an invalid login session. A correct disable operation clears the binding
without revoking sessions. Wrong codes preserve both binding and session. Login
TOTP tickets allow up to five failed attempts before invalidation and are
consumed on successful verification; the second-factor page can retry a typo.

Schema version 5 adds only the device-grant table and expiry index. Existing
account/vault/memory rows and session tokens are preserved. Deploy the API and
matching DEV dashboard before accepting the new CLI dev release; an older API
returns an explicit failure rather than silently falling back to password login.


See the [producer API contract](https://github.com/risense-ai/respire-server/blob/main/docs/browser-api-contract.md) for deployment transport details and [OpenAPI](../contracts/openapi.yaml) for request and response schemas.
