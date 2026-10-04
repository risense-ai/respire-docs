# Core C ABI / JSON business contract

ABI version `0x00010000`, JSON schema `1`, opaque artifact format `1`.
The canonical header is `respire_core.h`; Core keeps an identical copy.

Core exports only `rs_core_abi_version`, `rs_core_create`, `rs_core_call`,
`rs_core_buffer_free`, and `rs_core_destroy`. A caller owns its input; Core owns
each returned buffer until that exact buffer slot is freed once by Core. Handles
are thread confined. The safe Rust SDK supplies RAII and cannot be sent or shared.
A panic poisons the handle; destroy and recreate it. Do not share allocators.

`config` may be empty or UTF-8 `{}`; other configuration fields are rejected.
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
| prepare | Authorized MemoryEntry or content + model + index root → index locator |
| query | Authorized snapshots + MemoryQuery + plain/scored/contextual mode → final entries, final relevance and selected context |
| remember_candidates | Model + authorized snapshots + MemoryQuery → final merge/parent proposal lists |
| candidate_report / analyze_duplicates | Snapshots and user settings → final duplicate/parent proposals |
| tree_cure / deepen_plan / tree_float | Metadata/features + settings → final tree maintenance proposals |
| taxonomy_classify / classify_business | Authorized content/tree material and explicit provider configuration → final classification decisions or action preview |
| query_business | Authorized snapshots and explicit local/quality mode → final selected entries and warnings |
| index_generation / index_status | Index generation and local index readiness |
| model_status / model_probe / model_paths / engine_control | Model installation diagnostics and explicit engine controls |

`Prepared.artifact` is a base64-encoded locator for a local index owned by Core.
It contains no returned document or chunk vectors. Select the library's absolute
`index_root` consistently for preparation and queries. Index rows are bound to
the source ciphertext and generation; they never enter synchronization envelopes.
Existing encrypted entries remain readable and local indexes can be rebuilt.
Account encryption keys are not supplied to Core. An explicitly selected model
provider receives authorized plaintext through Core's model request; credentials
must not be logged or returned. Local mode makes no external model request.

For `prepare`, provide `model` and either `entry` or `content`; an `entry` takes
precedence if both are present. Production models are `legacy` and `m3`.
`test-hash:<dimensions>` is only an explicit fixture provider and requires
`RESPIRE_CORE_TEST_MODE=1`; production callers must not select it.
Successful prepare returns a non-empty `artifact` locator.

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
