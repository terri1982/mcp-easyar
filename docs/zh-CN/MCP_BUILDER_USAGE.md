# MCP Builder 使用记录

日期：2026-07-07

本文记录本机安装并使用 `mcp-builder` 后，对 `mcp-easyar` 的结论。本文不包含 EasyAR 账号、License、API Key/API Secret、设备私有日志或本地敏感配置。

## 已安装

- 来源：`anthropics/skills`
- 路径：`skills/mcp-builder`
- 本机安装位置：`/Users/tuyi/.codex/skills/mcp-builder`

安装命令：

```bash
python3 /Users/tuyi/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --repo anthropics/skills \
  --path skills/mcp-builder
```

说明：Codex 需要重启后才会自动把新 skill 暴露在技能列表里；本轮已直接读取并使用其 `SKILL.md` 和 reference 文档。

## 已读取并使用的参考

- `SKILL.md`
- `reference/mcp_best_practices.md`
- `reference/node_mcp_server.md`
- `reference/evaluation.md`

## 对 GitHub 上其他 MCP Builder 的判断

- `anthropics/skills/skills/mcp-builder`：适合作为设计和审查准则，已安装并使用。
- `alikarimii/mcp_builder`：方向是 OpenAPI v3 转 TypeScript MCP server，适合后续参考 EasyAR 官方 API 自动生成，但该项目当前只有 1 个提交、无 release，并且 README 示例仍展示旧式 MCP handler 模式，不适合直接接入生产链路。
- `moeru-ai/mcp-launcher` 和 `XD3an/mcp-builder`：更偏 MCP server 安装、启动或管理，不是 `mcp-easyar` 当前最需要的 server 设计/生成方案。

## 当前仓库符合项

- 使用 TypeScript 和 MCP TypeScript SDK。
- 当前传输方式是 stdio，符合本地 Unity / 桌面 MCP client 场景。
- 工具命名统一使用 `easyar_` 前缀，避免和其他 MCP server 冲突。
- 输入使用 Zod schema 做校验。
- 已有 core/full profile 控制，core profile 维持在工具数量预算内。
- 工具返回错误通过 `isError` 包装，并对本地路径做脱敏。
- 大量工具已有 `limit` 参数或本地扫描上限，避免无界扫描。
- 文档明确安全边界：不收集 EasyAR 官网密码、验证码、License Key、Cloud Recognition API Key/API Secret、`appKey`、`appSecret`。

## 主要差距

### 1. 仍使用 `server.tool`

当前注册层通过 `McpServer["tool"]` 统一注册工具。`mcp-builder` 推荐新代码使用 `server.registerTool()`，并明确配置 `title`、`description`、`inputSchema`、`annotations` 和可选 `outputSchema`。

建议：不要一次性全量迁移 70+ 工具。先做一层兼容注册器，允许新工具使用现代 metadata，再按模块迁移。

### 2. 缺少 tool annotations

当前工具没有系统化声明：

- `readOnlyHint`
- `destructiveHint`
- `idempotentHint`
- `openWorldHint`

建议：优先给只读工具和写文件工具打标签。典型分类：

- 只读：`easyar_server_status`、`easyar_list_*`、`easyar_check_*`、`easyar_analyze_*`
- 本地写文件：`easyar_write_*`
- 外部世界/设备：Android ADB、Unity batch、官方 API / browser handoff 相关工具

### 3. 缺少 `structuredContent`

当前 `jsonText()` 只返回 JSON 字符串。`mcp-builder` 推荐同时返回文本和 `structuredContent`，便于支持结构化输出的 MCP client 直接读取对象。

建议：新增兼容 helper，例如：

```ts
export function structuredJsonResult(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
    structuredContent: value
  };
}
```

然后从低风险只读工具开始替换，例如 `easyar_server_status`、`easyar_release_manifest`、`easyar_list_miniprogram_samples`。

### 4. 输出格式参数尚未统一

当前生成类工具已经有 `output: "inline" | "file"`，但列表/查询类工具没有统一的 `response_format: "markdown" | "json"`。

建议：不要给所有工具硬塞 `response_format`。只在同时面向人读和机器处理的列表/搜索工具上加，例如 sample catalog、device summary、run-through status。

### 5. 缺少 MCP eval 集合

仓库已有 smoke/test/release check，但还没有按 `mcp-builder` evaluation 指南设计的“LLM 只用 MCP 工具能否完成任务”的 10 题评测集。

建议：新增 `evals/easyar-local-key-mvp.xml`，问题只覆盖只读和幂等工具，答案固定、可字符串比较。题目应覆盖：

- 服务器状态和 focused scope
- 安装/客户端配置
- fresh Unity project acceptance
- release evidence 查询
- Mini Program sample scope
- 官方 API readiness 状态

## 推荐执行顺序

1. 新增结构化 JSON helper，并把 3-5 个只读工具改成 `structuredContent`。
2. 给工具注册器增加现代 metadata 兼容层，为后续 `registerTool` 迁移铺路。
3. 给 core profile 的高频只读工具补 annotations。
4. 新增 MCP eval XML，先覆盖只读资源和状态工具。
5. 再评估是否把官方 API OpenAPI contract 用生成器生成 skeleton；不要直接依赖 `alikarimii/mcp_builder` 输出进生产代码。

## 本轮结论

`mcp-builder` 已安装并用于审查。当前最值得做的不是引入新的外部 generator，而是把 `mcp-easyar` 现有成熟工具逐步升级到现代 MCP 形态：annotations、structuredContent、现代注册 metadata 和 read-only eval。
