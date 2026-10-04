#ifndef RESPIRE_CORE_H
#define RESPIRE_CORE_H
#include <stddef.h>
#include <stdint.h>
#ifdef __cplusplus
extern "C" {
#endif

#define RS_CORE_ABI_VERSION UINT32_C(0x00010000)
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
void rs_core_buffer_free(rs_buffer *buffer);
void rs_core_destroy(rs_core *core);

#ifdef __cplusplus
}
#endif
#endif
