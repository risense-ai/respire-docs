#ifndef RESPIRE_CORE_H
#define RESPIRE_CORE_H
#include <stddef.h>
#include <stdint.h>
#ifdef __cplusplus
extern "C" {
#endif

#define RS_CORE_ABI_VERSION UINT32_C(0x00010002)
#define RS_CORE_OK 0
#define RS_CORE_INVALID_ARGUMENT 1
#define RS_CORE_ABI_MISMATCH 2
#define RS_CORE_UNSUPPORTED_OPERATION 3
#define RS_CORE_MODEL_UNAVAILABLE 4
#define RS_CORE_ARTIFACT_INCOMPATIBLE 5
#define RS_CORE_ENGINE_FAILURE 6
#define RS_CORE_PANIC 7

typedef struct rs_core rs_core;
typedef struct rs_buffer { uint8_t *data; size_t len; } rs_buffer;
typedef int32_t (*rs_host_request)(void *context, const uint8_t *request,
                                  size_t request_len, rs_buffer *out_response);
typedef void (*rs_host_release)(void *context, rs_buffer *response);
/* Borrowed ORT environment/API or session-options/API pointers. The host owns
 * provider library registration and file-based profiling/cache configuration.
 * Never retain these pointers, unwind, or reenter Core from a callback. */
typedef int32_t (*rs_host_native_configure)(void *context, void *native_handle,
                                          const void *ort_api);
typedef int32_t (*rs_host_session_configure)(void *context, void *session_options,
    const void *ort_api, void *ort_environment, const void *selected_device);

/* All calls on one handle are serial. Inputs are borrowed only for the call.
 * Initialize output slots to zero. Release output buffers with the function
 * below, including errors. Never copy an owned buffer or destroy a handle twice.
 * A PANIC result poisons the handle: destroy it before further operations.
 */
uint32_t rs_core_abi_version(void);
int32_t rs_core_create(const uint8_t *config, size_t config_len,
                       rs_core **out_core, rs_buffer *out_error);
int32_t rs_core_call(rs_core *core, const uint8_t *request, size_t request_len,
                     rs_buffer *out_response);
/* Raw model/tokenizer buffers, not base64 JSON or paths. Core retains an owned
 * memory copy. Config contains model, asset_id, engine, execution_timeout_secs,
 * optional session_options_id. For explicit reuse_current=true, both raw inputs
 * must be empty and the matching model/config must already be cached in memory.
 * Output uses the usual JSON envelope with request_id="". */
int32_t rs_core_model_load(rs_core *core, const uint8_t *config, size_t config_len,
    const uint8_t *model, size_t model_len, const uint8_t *tokenizer,
    size_t tokenizer_len, rs_buffer *out_response);
/* configure receives borrowed OrtSessionOptions*, OrtApi*, OrtEnv* and optional
 * OrtEpDevice*. For a non-null device, the host must append that device through
 * SessionOptionsAppendExecutionProvider_V2, including any host cache options.
 * Core does not append it again. A null device permits options such as profiling.
 * The callback is synchronous; a cache hit does not reconfigure the session. */
int32_t rs_core_model_load_with_host(rs_core *core, const uint8_t *config,
    size_t config_len, const uint8_t *model, size_t model_len,
    const uint8_t *tokenizer, size_t tokenizer_len, void *context,
    rs_host_session_configure configure, rs_buffer *out_response);
/* register receives a borrowed OrtEnv* and OrtApi*, synchronously. */
int32_t rs_core_register_providers(rs_core *core, void *context,
    rs_host_native_configure register_providers, rs_buffer *out_response);
/* Synchronous host transport. Core receives provider name/model, never credentials
 * or endpoint. Host owns callback output until host_release; callbacks must not
 * unwind or reenter the handle. Host handles HTTP, credentials, retries and proxy.
 * Local calls continue to use rs_core_call. */
int32_t rs_core_call_with_transport(rs_core *core, const uint8_t *request,
    size_t request_len, void *context, rs_host_request host_request,
    rs_host_release host_release, rs_buffer *out_response);
void rs_core_buffer_free(rs_buffer *buffer);
void rs_core_destroy(rs_core *core);

#ifdef __cplusplus
}
#endif
#endif
