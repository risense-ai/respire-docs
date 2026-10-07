# Core C ABI / JSON business contract

ABI version `0x00010002`, JSON schema `1`, opaque artifact format `1`.
The canonical header is `respire_core.h`; Core keeps an identical copy.

Core exports only `rs_core_abi_version`, `rs_core_create`, `rs_core_call`,
`rs_core_call_with_transport`, `rs_core_model_load`, `rs_core_model_load_with_host`,
`rs_core_register_providers`, `rs_core_buffer_free`, and `rs_core_destroy`. A caller owns its input; Core owns
each returned buffer until that exact buffer slot is freed once by Core. Handles
are thread confined. The safe Rust SDK supplies RAII and cannot be sent or shared.
A panic poisons the handle; destroy and recreate it. Do not share allocators.

`config` may be empty or UTF-8 `{}`; its only optional field is `test_mode` (false
by default), explicitly enabled by a fixture host. Other fields are rejected.
Inputs are UTF-8 JSON byte slices, without a trailing-NUL requirement. Output
`rs_buffer.len` is the exact byte length. Initialise output slots to zero before
each call; release success and error buffers through `rs_core_buffer_free` once.
That function clears the original slot. A null handle can be destroyed, but a
destroyed handle or a copied owned buffer cannot be reused. Pointer validity and
exclusive ownership are caller obligations, not recoverable validation errors.

| C status / JSON error code | Meaning in the current implementation |
|---|---|
| 0 | Success; JSON contains `result` |
| 1 | Invalid pointer/length, create configuration or request envelope |
| 2 | Unsupported request schema version |
| 3 | Unsupported operation |
| 4 / 5 | Reserved header values (`MODEL_UNAVAILABLE` / `ARTIFACT_INCOMPATIBLE`); not currently emitted as distinct business codes |
| 6 | Business/engine failure, including unavailable model, invalid DTO and corrupt or incompatible artifact; inspect `error.message` |
| 7 | Panic or poisoned handle; destroy and recreate |

For invalid output pointers or a null call handle, only the C status is available;
no JSON error buffer is promised. If JSON could not be parsed, or a panic happened,
`request_id` is empty. SDK callers must check both the C status and response shape.

Requests contain `schema_version`, `request_id`, `operation`, and a business payload.
Responses echo the schema/id and contain either `result` or `error` (code/message).
The request schema lists operations. DTOs are in the safe `core-sdk/src/business.rs`;
typed business adapters are in the SDK and CLI `classify.rs`.
`request.schema.json` describes the envelope and main typed DTOs;
`response.schema.json` describes the success/error envelope. Neither schema
describes feature contents. The SDK adapters remain authoritative
for operation-specific report DTOs and classify argument ordering.

| Business operation | Input / output boundary |
|---|---|
| prepare | Authorized MemoryEntry or content + model → opaque compressed index bytes |
| query | Authorized snapshots + MemoryQuery + plain/scored/contextual mode → final entries, final relevance and selected context |
| remember_candidates | Model + authorized snapshots + MemoryQuery → final merge/parent proposal lists |
| candidate_report / analyze_duplicates | Snapshots and user settings → final duplicate/parent proposals |
| tree_cure / deepen_plan / tree_float | Metadata/features + settings → final tree maintenance proposals |
| taxonomy_classify / classify_business | Authorized content/tree material and explicit provider configuration → final classification decisions or action preview |
| query_business | Authorized snapshots and explicit local/quality mode → final selected entries and warnings |
| index_generation / index_status | Index generation and local index readiness |
| model_status / model_probe / engine_control | Injected-model diagnostics and in-memory reset/status controls |

`capabilities.inference_execution` is `in_process`. The resident runtime loads
and shares the native ONNX session. There is no inference child or pipe protocol.
The host owns all model locations and CPU/GPU/NPU configuration. It injects raw
model/tokenizer buffers and explicit settings into each handle; matching sessions
can be shared from an in-memory cache. Account switching does not write settings.
Engine control supports `get`, `reset` and `inference_status`; `set`, `reset_cpu`
and accelerator installation/discovery report explicit host-managed errors.
Native errors retain
their underlying cause in `error.message`; no engine fallback is applied.
CPU probes reuse the shared session. Accelerator probes compare with a CPU session.
Reset invalidates existing session handles. Shared inference uses a FIFO queue
with up to 32 waiting requests and a 120-second queue wait limit. Each native run
has a separate 120-second execution limit using ONNX cooperative cancellation.
Session loading uses the same queue and a separate 120-second ONNX load cancellation
deadline; changing engines waits for the active inference to release its permit.
Expired queue entries are removed before inference. An expired native run produces
no embedding. `inference_status` reports queued/active work, phase, capacity, limits and
`host_recovery_required` without waiting for the native session mutex. Providers
may ignore cancellation; an unresponsive native call requires host runtime recovery.
The execution limit does not guarantee termination of a native thread or release
of database locks. No additional inference process is created.

Index compatibility depends on the model and artifact generation, not the CLI
or SDK release number. Reuse complete compatible artifacts during upgrades.

The production M3 file is `onnx/model_quantized.onnx`, pinned to
`Xenova/bge-m3` revision `4de13258303883538bd53b696b452bf8099f0858`:
569694530 bytes, SHA-256
`0826f8c1ab9edf1801db86c61919d4d108e8bfc0b809ec823ad366882ff0b77d`.
The tokenizer remains at the same revision and checksum. This model has a separate
index generation from FP16 and `model_int8.onnx`; do not mix their vectors.
Retain resumable checkpoints and activate the new generation only after completion.

`Prepared.artifact` contains base64-encoded opaque compressed index bytes. Core
never reads or writes files, directories or databases. The host persists these
bytes and resolves existing `rsi1` locators into bytes before calling Core; Core
rejects unresolved locators. The compression payload, revision and generation stay
unchanged, so this boundary change alone does not require index rebuilding. Hosts
must not interpret internal index/vector structures. Index rows remain bound to
source ciphertext and generation and never enter synchronization envelopes.
Account encryption keys, API credentials, endpoints and HTTP execution remain in
the host. Core accepts only a provider name and model. For external model work,
`rs_core_call_with_transport` borrows synchronous host request/release callbacks;
Core plans the request and interprets the response. The host owns authentication,
proxy, timeout and retry execution. Callback input contains `provider`, `body`,
`timeout` and `retries`; it is transport traffic, never a returned business plan.
The host must return JSON and sanitize errors before forwarding them to Core.
Callback output is host-owned until the release callback, including failures.
Callbacks must not unwind or recursively enter the same handle. No callbacks or
credentials are retained by Core. Local mode makes no external model request.
Provider configuration is parsed before local dispatch too; local mode does not
permit credential or endpoint fields. Windows execution-provider library registration and profiling/cache paths
also belong to the host. `rs_core_register_providers` borrows `OrtEnv*` and
`OrtApi*` for synchronous registration. `rs_core_model_load_with_host` similarly
borrows `OrtSessionOptions*`, `OrtApi*`, `OrtEnv*` and an optional selected
`OrtEpDevice*` while loading. When a device is supplied, the host appends it with
`SessionOptionsAppendExecutionProvider_V2` and host-owned cache options; Core does
not append the same provider again. A null device permits profiling configuration. No paths or callbacks are retained by Core. Hosts must
not retain pointers, unwind, or reenter Core. Cache hits do not reconfigure an
existing session; include configuration changes in `session_options_id`.

`rs_core_model_load` accepts UTF-8 configuration plus separate borrowed raw model
and tokenizer buffers, never large base64 JSON or file paths. Configuration
requires `model`, host-validated `asset_id`, `engine` and
`execution_timeout_secs`; `session_options_id` is optional. The output is the
standard JSON envelope with empty request ID and `result.dimensions`. Core retains
owned bytes. With explicit `reuse_current: true`, both buffers must be empty and
the complete configuration must match a cached model. Otherwise loading fails and
the host must provide the verified buffers. Existing ABI entry points remain;
consumers must use the matching ABI 1.2 SDK for these new symbols.

For `prepare`, provide `model` and either `entry` or `content`; an `entry` takes
precedence if both are present. The production model is `m3`; legacy BGE is retired.
`test-hash:<dimensions>` is only an explicit fixture provider and requires
`test_mode: true` in handle creation; production callers must not select it.
Successful prepare returns non-empty opaque `artifact` bytes.

`query` requires `model`, `snapshots`, `query` and `mode` (`plain`, `scored`,
`contextual`). Snapshot metadata fields are explicit strings/flags, not the sync
`StoredMemory` serialization: its local fields are deliberately skipped by serde.
An authorized entry may be `null` when only metadata is needed, and features may
be `null` when none exist. An entry ID must match its snapshot ID, and snapshot IDs
must be unique. Pass the full candidate set required for context; the final result
is an entry array, a `[final_score, entry]` array, or contextual objects containing
`score`, `entry`, and `ancestors`, respectively. Final scores are business results,
not intermediate vectors or rank-stage traces.

Do not cache artifacts independently of their source ciphertext, selected model
and index generation. Updates/deletions invalidate derived rows; a model or format
change requires rebuilding. Compatibility input is for existing records.

`remember_candidates` requires `model`, `snapshots` and `query`. Its result is an
object with `merge` and `parent` arrays, each containing `[final_score, MemoryEntry]`
pairs. SDK callers display these final proposals and authorize writes; they do
not reproduce Core grouping rules.

Final scores are user-facing results. Intermediate vectors, request plans and
execution traces are not returned by these operations.

SDK builds require Rust 1.95.0 with the exact release/commit recorded in manifest,
panic=unwind, LTO disabled, and matching target/CRT. Windows uses the dynamic CRT.
Cargo validates the pinned manifest and every file SHA-256 and stages runtime DLLs
beside executables/tests. Distributions must also include runtime libraries and
third-party notices (`stage-core-runtime.mjs`); an exe alone is incomplete on Windows.

Association contract: `related_business` accepts authorized snapshots, query,
final hit IDs and local pair evidence. It returns `related` (ID/title/source/type)
and `superseded` (hit ID to latest active replacement ID). This additive operation
keeps the existing C ABI, request envelope and opaque index generation unchanged.
See the request/response schema definitions. Capability negotiation is required
before relation writes. Public callers never receive intermediate vectors or
policy thresholds. Empty relation fields are compatible with old payload reads;
all shared-library writers must be upgraded before enabling relation writes.

Query tuning is explicit `query_settings` data (`recall_min_score`, `mmr_lambda`,
`ancestor_budget`, `ancestor_root_floor`). Association tuning is explicit
`related_settings` data (`enabled`, `max`, `pair_min`, `min_cos`, `knn_seeds`,
`knn_per`). Core supplies existing algorithm defaults when omitted but never reads
host environment variables. Hosts translate supported environment/configuration
inputs before entering Core. No intermediate scoring traces are printed by Core.
