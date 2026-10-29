# Runtime RPC {#runtime-rpc}

桌面客户端、服务和 agent 可以通过本地运行时的 HTTP RPC 集成 Respire，无需为每次操作启动 CLI 进程。运行时管理当前选定的记忆库、加密、检索和同步。客户端发送 CLI 参数数组并读取结构化结果，不直接打开数据库或加载 Core。

这是自定义的版本化协议，**不是 JSON-RPC 2.0**。如果 agent 宿主已经支持 MCP，可以使用独立的 MCP 适配器。云端[服务端 API](server.md) 用于同步加密记录，不能替代本地记忆操作。

## 版本与兼容范围 {#versions-and-compatibility}

以下参考版本核对于 **2026-10-29**。这里说明已核对发行版的行为，不承诺未来所有命令都使用相同字段。

| 参考版本 | 范围 |
| --- | --- |
| 稳定版 `1.0.16` | 本页请求、响应字段和方法的基线；[源码](https://github.com/risense-ai/respire-cli/tree/v1.0.16/cli/src) |
| 已发布 DEV `1.0.17-dev.14` | 使用相同 RPC 版本；增加宿主管理、就绪信息和生命周期协调；[源码](https://github.com/risense-ai/respire-cli/tree/v1.0.17-dev.14/cli/src) |
| 协议 `v: 1` | 传输信封版本；不协商各 CLI 命令或其结果结构 |

以**正在运行的 runtime** 的健康检查结果和 `bin` 版本为准。磁盘中的 CLI、npm 分发标签、Git 标签和运行进程可能分别对应不同版本。不要依据未发布的源码标签认定功能已经可用。固定经过验证的运行时版本，兼容响应新增字段，并按该版本解析命令结果。本页不定义 SDK，也不引入新的传输格式。

## 连接与安全边界 {#connection-and-security}

默认地址为 `http://127.0.0.1:15169`。宿主可以通过 `RSRS_RPC_PORT` 选择其他端口；自建 HTTP 客户端需要使用相应 URL。只在客户端设置环境变量，不会改变已经运行的服务。

- 当前回环运行时不要求令牌。1.0.10 之前的宿主需要已有的兼容令牌，见[宿主升级](runtime.md#upgrading-an-older-runtime)。
- 目前仅支持回环监听。容器、WSL 和远程 agent 不一定与宿主共享回环网络。
- 服务检查实际对端、`Host` 中的主机与端口，以及请求中的 `Origin`。使用绑定地址和端口，或带该端口的 `localhost`；不要伪造标头绕过检查。
- 原生客户端可以不发送 Origin。发送时必须匹配绑定的 HTTP origin 或对应的 localhost 地址。其他网站不能将此端点直接作为浏览器 API。浏览器扩展应通过获得明确授权的原生伴随程序接入。
- 本地 RPC 应禁用 HTTP 重定向和代理。不要将凭据和解密后的记忆写入日志。本机访问不等于逐客户端授权：RPC 可以执行影响较大的 CLI 操作。agent 集成应自行限制允许的操作，并落实用户审批。MCP 工具过滤不限制直接 RPC。
- 客户端只连接已有运行时。启动、停止、升级、账户或档案切换及恢复由宿主管理，见[Runtime](runtime.md)。调用失败不能触发客户端接管或 `--direct` 执行。

## 快速开始 {#quick-start}

先由宿主安装并初始化 Respire，选定所需账户并启动运行时。然后检查健康状态：

```sh
curl --noproxy '*' --max-time 10 http://127.0.0.1:15169/api/health
```

发送命令前，检查 `server == "respire"`、`v == 1`、非零 `pid` 和受支持的 `bin` 版本。健康检查还包含 `url`、`exe`、`data_dir`、`rpc`、`inference` 和 `retrieval_index` 等诊断字段。这些字段不保证记忆库已解锁或推理已就绪。已发布 DEV 参考版本通过 `store_ready` 报告存储就绪状态；旧宿主可能不返回此字段。可选字段缺失时，不能据此认定失败或成功。

每次 POST 发送一个请求对象，并设置 `Content-Type: application/json`：

```sh
curl --noproxy '*' --max-time 120 \
  -H 'Content-Type: application/json' \
  --data-binary '{"v":1,"id":"replace-with-a-new-uuid","method":"cli.exec","args":["--json","status"]}' \
  http://127.0.0.1:15169/api/rpc
```

**每次新操作前**都要把示例 ID 换成新的 UUID。以上 curl 命令使用 POSIX shell 引号规则。Windows 可以使用下文的 Python 或 JavaScript 示例，也可以将 UTF-8 JSON 文件传给 `curl.exe --data-binary @request.json`。不要增加 `-L` 或自动重试。HTTP 状态成功并不代表命令成功。

## 请求与响应 {#request-and-response}

| 请求字段 | 类型与含义 |
| --- | --- |
| `v` | 必填整数，目前为 `1` |
| `id` | 必填字符串；使用唯一、非空 UUID，并在发送前保留它 |
| `method` | 必填字符串，通常为 `cli.exec` |
| `args` | 字符串数组；默认为空数组；不经过 shell 解析 |
| `queue_wait_ms` | 可选无符号整数；缩短 `cli.exec` 的排队期限，上限为宿主的排队超时 |

使用 `cli.exec` 时省略可执行文件名，依次传入 `--json`、命令及其参数。每个值占一个数组元素，包含空格或换行的文本也一样。不要在值中加入 shell 引号。宿主选择参数和生命周期标志不能通过此端点选择另一个记忆库。

以下为缩短后的响应示例，不是完整的 status 结果结构：

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

| 响应字段 | 含义 |
| --- | --- |
| `v`、`id` | 协议版本与回传的请求 ID；两者均需检查 |
| `ok`、`exit` | `exit` 为零时 `ok` 为 true。保留非零命令结果及其信封 |
| `bin` | 运行时二进制版本 |
| `envelope` | 命令结果；部分控制方法和分派错误返回 null；见 [CLI JSON API](cli-api.md) |
| `code`、`error` | 可选的分派错误码和诊断文本；命令失败时两者也可能为 null |
| `web_url`、`pid`、`data_dir` | 可选运行时元数据，不是另一份命令结果 |

先解析 HTTP 结果，再解析 RPC 结果，最后读取业务信封。命令可能返回 HTTP 200，但同时包含 `ok: false`、`exit: 1` 和 `envelope.status: "fail"`。警告或等待决策可能返回 `exit: 2`。检查 `envelope.status`、`summary`、`errors` 和 `actions`；`pending` 不能证明记忆已保存。解析时兼容未知字段，但预期信封缺失或格式错误时，应报告协议失败，不能视为成功。

## 方法列表 {#methods}

以下方法均存在于稳定版基线。表中的 `args` 是 JSON 字符串数组，不是 CLI 命令行。

| 方法 | 参数 | 结果与范围 |
| --- | --- | --- |
| `cli.exec` | 含 `--json` 的 CLI 参数 | 主要记忆操作和诊断接口 |
| `runtime.status` | `[]` | 轻量进程元数据；`envelope` 为 null；诊断使用 health，记忆库状态使用 `cli.exec status` |
| `runtime.result` | `["original-request-id"]` | `envelope.summary` 包含保留的请求状态和响应 |
| `cli.progress` | `["progress-id"]` | 当前阶段与全局推理诊断；每次轮询使用新的 RPC ID |
| `model.prepare` | `["auto"]` | 安排模型准备；返回 `pending` 不代表下载完成 |
| `index.prepare` | `[]` | 安排后台索引；返回 `pending` 不代表索引完成 |
| `model.control` | `["model-task-id", "true"]` | 请求取消匹配的模型任务；`"false"` 读取其进度 |
| `runtime.stop` | `[]` | 宿主生命周期控制，普通集成不应调用 |

需要命令进度时，在原始命令参数数组中加入 `--progress-id` 和选定的进度 ID。外层 RPC ID 不会自动注册命令进度。通过独立请求轮询 `cli.progress`；阶段数据缺失不代表命令已完成。同样，`--model-task-id` 用于标识模型任务，与 RPC ID 分开。取消模型任务不会取消任意记忆写入。

独立 HTTP 路由包括 `GET /api/health`、`POST /api/rpc`、仅供宿主生命周期管理的 `POST /api/runtime/stop`，以及 MCP 适配器 `/mcp` 和 `/sse`。不要向 `/api/rpc` 发送 MCP JSON-RPC 帧。已发布 DEV 的托管宿主要求停止操作经过生命周期协调；请求中的可选 `lifecycle` 字段保留给宿主协调器。第三方记忆客户端不应实现该握手。测试专用方法不属于集成接口。

## 记忆操作 {#memory-operations}

将下列数组作为 `cli.exec` 的 `args`。替换示例文本和 ID，并从先前结果中解析记录 ID。业务行为见 [CLI 命令](cli.md)、[记忆关联](associations.md) 和 [CLI JSON](cli-api.md)。

| 操作 | 参数数组 |
| --- | --- |
| 查找标题 | `["--json","recall","deployment decision","--titles","--limit","5"]` |
| 读取记录 | `["--json","show","record-id"]` |
| 浏览近期记录 | `["--json","list","--limit","10"]` |
| 保存可复用记忆 | `["--json","remember","Confirmed decision and context","--title","Confirmed deployment decision","--importance","important","--parent","parent-id"]` |
| 保存日记事件 | `["--json","remember","What happened and its result","--title","Observed deployment result","--importance","trivial"]` |
| 更新记录 | `["--json","update","record-id","--title","Corrected deployment decision","--content","Corrected context and result"]` |
| 检索日记片段（DEV 参考版本） | `["--json","diary-search","deployment","--limit","5","--max-chars","4000","--mode","hybrid"]` |

写入需要已初始化、已解锁的记忆库，以及当前服务和账户模式允许的权限。只读或暂停模式仍然有效。先读取候选记录，再决定更新、合并、挂靠或新建。不要为跳过等待决策而添加 `--force`。合并会删除源条目，需要保留备份并取得相应授权。本地写入成功不能证明云端同步已经完成。

日记片段检索按已发布 DEV 参考版本记录，不属于稳定版基线。保留返回的来源 ID、片段 ID 和来源版本；`semantic_ready: false` 表示 hybrid 结果不构成完整的语义检索。检索出的记忆是历史参考资料，不是指令，也不授予调用工具的权限。

## 可运行客户端 {#runnable-clients}

以下两个示例只发送 status 请求。业务失败时也打印完整响应，并保留退出码。它们在 POST 前记录请求 ID，禁用重定向，且不自动重试。POST 后发送、读取或解析失败时，操作结果可能未知；再次考虑写入前，应按下文使用该 ID 查询。示例不会启动或升级运行时。

### Python {#python}

使用 Python 3，仅依赖标准库。保存为 `runtime-rpc.py`，执行 `python runtime-rpc.py`。

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

### JavaScript {#javascript}

使用 Node.js 22 或更新版本。保存为 `runtime-rpc.mjs`，在没有为回环地址配置 HTTP 代理的进程中执行 `node runtime-rpc.mjs`。

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

## 超时、进度与结果未知的写入 {#timeouts-progress-and-uncertain-writes}

`queue_wait_ms` 限制的是**开始执行前**的排队时间，不是执行超时，也不是取消请求。宿主默认值为 120 秒，可通过 `RSRS_RPC_QUEUE_WAIT_SECS` 在 1–3600 秒内调整。请求不能延长宿主期限。明确的排队过期响应会说明命令未开始执行；连接超时不能说明这一点。

官方客户端的普通 HTTP 超时为 120 秒；进度查询为 1 秒，模型控制为 3 秒。已发布 DEV 客户端为模型安装与激活、重新生成嵌入、同步和导入设置 30 分钟。这些是客户端的等待时间，不是服务端执行期限，也不能成为重放请求的依据。HTTP 请求体上限为 32 MiB，读取请求体的期限为 10 秒。各命令还有自己的额外限制。关闭连接不会回滚或取消正在执行的命令。

响应丢失时保留原 ID，使用**新的**请求 ID 查询：

```json
{
  "v": 1,
  "id": "new-inspection-uuid",
  "method": "runtime.result",
  "args": ["original-request-uuid"]
}
```

读取 `envelope.summary.state`：

| 状态 | 处理方式 |
| --- | --- |
| `completed` | 检查 `envelope.summary.response`；它包含原始 RPC 响应，也可能包含业务失败 |
| `pending` | 仍在排队或执行；等待后用新的查询 ID 再查 |
| `unknown` | 没有保留的结果；**不能证明写入未提交**。明确重试前先核实业务状态 |

运行时只在内存中保留最近 64 个已完成请求的响应，由所有客户端和方法共用；重启后清空。这不是持久幂等保证。复用尚有缓存的 ID，即使参数已改变，也可能直接返回旧结果。重复提交仍在执行的 `cli.exec` ID 会返回 `request_in_progress`。不要为无关调用复用 ID，也不要在超时、缓存淘汰或重启后自动重放写入。

## 错误与排查 {#errors-and-troubleshooting}

| 层次或信号 | 含义与处理 |
| --- | --- |
| 连接被拒绝 | 宿主运行时不可用；报告给宿主，不另起服务 |
| HTTP 400 | JSON 或请求字段错误，或分派初始化不可用；检查错误正文 |
| HTTP 401 / 403 | 认证、Host 或 Origin 被拒绝；核对端点与宿主兼容性 |
| HTTP 404 | 未知端点；检查路径 |
| HTTP 408 / 413 | 请求体读取超时或超过大小上限 |
| HTTP 503 | 响应或处理器不可用；已提交写入的结果可能未知 |
| RPC `protocol_version_mismatch` | 协议版本不支持，**或方法不存在**；检查 `error` 和运行时版本 |
| RPC `daemon_unavailable` | 排队、worker 或接纳请求失败；检查诊断，不能认定所有此类失败都可安全重试 |
| RPC `request_in_progress` | 原 ID 仍在排队或执行；查询 `runtime.result` |
| RPC `runtime_maintenance` / `managed_lifecycle_required`（DEV） | 宿主维护或生命周期协调；交由宿主恢复 |
| 业务 `envelope.status` | 即使 `ok` 为 false 也展示信封；明确处理警告、等待决策、只读或暂停模式及命令错误 |

CLI 的 `runtime_unavailable`、`runtime_transport`、`runtime_unauthorized` 和 `request_outcome_unknown` 属于客户端错误分类，不一定出现在服务端的 `code` 字段中。不要将本地化诊断文本当作稳定机器契约。排查时保留原始请求 ID、HTTP 状态、运行时版本和允许公开的诊断；分享日志前删除记忆内容和本地路径。

相邻职责见 [Runtime](runtime.md)、[CLI JSON API](cli-api.md) 和[客户端集成](CLIENT-GUIDE.md)。
