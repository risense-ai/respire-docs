# 浏览器授权与 TOTP {#browser-authorization-and-totp}

生产方为 `risense-ai/respire-server`。主页、Dashboard 和 Admin 归 `risense-ai/respire-site` 所有。云端前端构建将公开的 `VITE_API_BASE_URL` 设置为选定的 HTTPS API 源，通常为 `https://api.rsrs.rs`。任何秘密都不应放入 `VITE_*` 变量。

## CLI 授权与 TOTP 管理 {#cli-authorization-and-totp-management}

CLI 浏览器登录使用 OAuth 设备授权：以表单编码向 `POST /oauth/device/code` 提交公开的 `client_id=respire-cli`，随后向 `POST /oauth/token` 提交 `grant_type=urn:ietf:params:oauth:grant-type:device_code`。设备授权在 600 秒后过期，轮询间隔至少五秒。`slow_down` 会将客户端间隔增加五秒。批准只会创建一次普通、可撤销的用户会话；拒绝、过期和重放不会创建会话。设备代码属于私密数据，仅以哈希形式保存。访问令牌绝不进入 URL。

验证源由服务器的 `RSRS_DASHBOARD_URL` 管理，默认为 `https://dash.rsrs.rs`；DEV 必须设置为 `https://dash.dev.rsrs.rs`。Dashboard 路由 `/#/authorize` 接受显示给用户的代码；`/#/authorize?code=...` 会预填代码。正常完成密码和 TOTP 登录后，页面显示账户、设备与用户代码，要求通过 `/api/self/cli-authorization/{code}` 显式批准或拒绝。只读会话不能批准。CLI 检查返回的验证源，并在批准后于本地请求记忆超级密码；服务器不会收到该解密因子。

已认证的 TOTP 确认/禁用失败返回 HTTP 400；HTTP 401 仍表示登录会话无效。正确的禁用操作清除绑定而不撤销会话。错误代码会保留绑定与会话。登录 TOTP 票据最多允许五次失败尝试，随后失效；验证成功后即被消耗，第二因子页面可以重试输入错误。

数据库模式版本 5 仅新增设备授权表和过期索引。现有账户/保险库/记忆行和会话令牌保留。在验收新的 CLI dev 发布前，先部署 API 及匹配的 DEV 控制台；旧 API 会显式失败，不会静默回退到密码登录。

部署传输详情见[生产方 API 契约](https://github.com/risense-ai/respire-server/blob/main/docs/browser-api-contract.md)，请求与响应模式见 [OpenAPI](https://github.com/risense-ai/respire-docs/blob/main/contracts/openapi.yaml)。
