# mcp-easyar 官方 API 合同说明

英文原文：`docs/OFFICIAL_API_CONTRACT.md`

本中文版解释生产接入需要的官方 API 能力。字段名、路径、schema 和 OpenAPI JSON 以英文原文为准。

## 为什么需要官方 API

local-key MVP 可以让用户在浏览器里注册、登录、下载插件、创建 key，然后在 Unity 本地运行 Sample。  
但生产自动化如果要让 MCP 判断注册用户身份、下载权限、license 状态、CRS 凭证状态，就需要 EasyAR 官方服务提供授权接口。

## 需要的能力

- account status：确认用户账号状态。
- license validation：确认 license 是否存在、是否匹配包名/平台。
- downloads entitlement：确认用户是否有下载插件或 Sample 的权限。
- CRS credential metadata：返回 AppId、serverAddress、apiKeyPresent、apiSecretPresent 等元数据和存在性标记，不返回 raw secret。
- token policy：MCP client 使用的 token 签发、验证、轮换、吊销机制。

## 安全要求

生产接入不能依赖网页抓取、浏览器 cookie、用户密码或验证码。MCP 只应调用授权 API，并且不输出 secret。
