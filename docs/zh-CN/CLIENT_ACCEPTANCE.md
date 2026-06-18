# MCP 客户端验收清单

安装 GitHub Release 包后，按以下步骤验收。

## 安装检查

```bash
easyar-mcp-check
```

应看到：

- server name 为 `mcp-easyar`
- tools listed 约 70
- prompts listed 6
- resources checked 15
- 无 secret 要求

## MCP 客户端检查

```text
easyar_server_status
easyar_check_client_setup client=codex entrypointMode=package-bin includeTokenPlaceholder=false
```

## 首次用户路径

```text
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_account_onboarding accountStage=not-registered sampleId=cloud-recognition platform=android
```

## 通过标准

- 客户端能列出核心工具。
- 能读取 `easyar://acceptance/fresh-project`。
- 默认工具数低于 80。
- 不要求用户输入官网密码或密钥。
