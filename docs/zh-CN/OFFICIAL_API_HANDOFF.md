# mcp-easyar 官方 API 接入交接

英文原文：`docs/OFFICIAL_API_HANDOFF.md`

## 目标

给 EasyAR 后端和运维团队说明：如何把真实账号、license、下载、CRS 凭证元数据服务接到 `mcp-easyar`。

## 当前 fallback

在官方 API 未完成前，使用 browser handoff + local-key：

1. 用户在官网浏览器中注册/登录。
2. 用户下载官方插件。
3. 用户创建 license / CRS key。
4. 用户在本地 Unity 工程填写 `easyar.local.json`。
5. MCP 只验证字段存在性，不接触密码或 secret。

## 接入步骤

1. 实现 account status endpoint。
2. 实现 license validation endpoint。
3. 实现 downloads entitlement endpoint。
4. 实现 CRS metadata endpoint。
5. 配置 staging token。
6. 运行 `npm run official-api:canary`。
7. 通过后再配置 production env vars。

## 不接受的方式

- 抓取官网页面作为生产授权机制。
- 读取浏览器 cookie。
- 要求用户把官网密码或验证码发给 MCP。
- 在 MCP 输出 API KEY/API Secret/appSecret。
