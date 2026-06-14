# EasyAR Mega 微信小程序 MCP 设计

本文档定义一个面向 EasyAR Mega 注册用户的 MCP 服务范围，帮助用户通过 Codex、Claude 或其他 MCP 客户端准备、检查、运行和验证官方微信小程序 Sample。

服务不得在聊天中收集 EasyAR 密码、微信密码、验证码、原始 API token、license key、app key、app secret 或私有证书。敏感值应来自本地环境变量、本地未跟踪配置文件、操作系统钥匙串或官方平台会话。

## 目标

- 引导 EasyAR 注册用户完成官方 Mega 账号、license、SDK 和 Sample 获取流程。
- 创建或修复本地微信小程序 Sample 工作区。
- 在不暴露 secret 的前提下验证 EasyAR Mega 本地配置。
- 为 Codex 和 Claude 生成聚焦的 Sample runbook 与交接材料。
- 在可用时集成微信开发者工具 CLI。
- 为编译、预览、上传和真机验证生成证据。

## 非目标

- 绕过 EasyAR 账号检查、下载门禁、license 检查或限流。
- 使用用户凭据自动填写 EasyAR 或微信登录表单。
- 把 secret 写入生成的 Markdown 材料。
- 在没有真机证据时声称 Sample 已完成。

## 核心工具接口

## 当前已实现 MVP 工具

当前仓库先实现安全的 local-key 小程序切片：

- `easyar_list_miniprogram_samples`
- `easyar_check_wechat_devtools`
- `easyar_inspect_miniprogram_project`
- `easyar_generate_miniprogram_local_config_form`
- `easyar_write_miniprogram_local_config_form`
- `easyar_generate_miniprogram_preflight`
- `easyar_write_miniprogram_preflight`
- `easyar_generate_miniprogram_run_sequence`
- `easyar_write_miniprogram_run_sequence`
- `easyar_import_miniprogram_sample_from_local_package`
- `easyar_analyze_miniprogram_devtools_log`
- `easyar_run_miniprogram_devtools_check`
- `easyar_generate_miniprogram_device_validation_checklist`
- `easyar_write_miniprogram_device_validation_checklist`
- `easyar_generate_miniprogram_run_result_form`
- `easyar_write_miniprogram_run_result_form`
- `easyar_write_miniprogram_run_result`
- `easyar_generate_miniprogram_completion_report`
- `easyar_write_miniprogram_completion_report`

当前 focused sample id：

- `wechat-mega`
- `wechat-crs`

这些工具会检查本地文件、导入用户已下载的官方本地包、在微信开发者工具 CLI 可用时执行本地检查、写入真机验证表单，并根据本地脱敏证据生成 completion report。上传 dry-run 和小程序真机证据采集仍需要等用户提供本地官方 Sample 包、已登录的微信开发者工具和测试小程序工程后继续补齐。

### Server And Catalog

- `easyar_mega_server_status`：返回服务版本、支持平台、官方 endpoint 配置、本地工具可用性和推荐首次调用。
- `easyar_mega_official_info`：返回官方链接、SDK/Sample 版本元数据和支持范围。
- `easyar_mega_list_samples`：列出支持的微信小程序 Sample 类别，例如 `image-tracking`、`cloud-recognition`、`geo-spatial`、`mega-scene`。

### Account And Official Access

- `easyar_mega_auth_status`：只报告本地官方 API 环境变量是否配置，token 必须脱敏。
- `easyar_mega_account_onboarding`：把注册/登录作为浏览器端 handoff 引导，不接触密码。
- `easyar_mega_account_materials`：列出账号材料来源、存放位置和分享策略。
- `easyar_mega_check_account`：调用已配置的官方账号状态 endpoint，并只返回脱敏结果。
- `easyar_mega_validate_license`：验证 Mega license 是否适配小程序 app id。
- `easyar_mega_discover_downloads`：发现账号授权的 Mega SDK 与官方 Sample 包，不提供未授权下载。
- `easyar_mega_check_official_access`：聚合账号、license、下载和 Sample 访问检查。

### WeChat Mini Program Project Inspection

- `easyar_mega_inspect_miniprogram_project`：检查 `project.config.json`、`app.json`、`miniprogram/`、页面、组件、npm 状态和 EasyAR 文件。
- `easyar_mega_check_wechat_devtools`：查找并验证微信开发者工具 CLI。
- `easyar_mega_check_sample_readiness`：检查 app id、配置、SDK 导入、页面、权限、域名/网络 allowlist、资源和包管理器。
- `easyar_mega_generate_focused_preflight`：生成运行或上传前的单一 gate。
- `easyar_mega_write_focused_preflight`：写入 `easyar-generated/<sampleId>/PREFLIGHT.md`。

### Local Config And Secret Handling

- `easyar_mega_prepare_miniprogram_project`：创建生成目录、配置模板、`.gitignore` 规则和 Sample runbook。
- `easyar_mega_generate_local_config_form`：生成 `easyar.mega.local.json` 的本地填写表单。
- `easyar_mega_write_local_config_form`：写入 `LOCAL_CONFIG_FORM.md`。
- `easyar_mega_write_local_config_from_env`：从环境变量写入本地配置，只返回字段存在性和验证结果。
- `easyar_mega_validate_local_config`：检查必填字段和占位符，不返回 secret。

### Sample Import And Code Generation

- `easyar_mega_generate_import_checklist`：生成官方 SDK/Sample 导入清单。
- `easyar_mega_import_sample_from_local_package`：从用户本地已下载的官方包复制 Sample。
- `easyar_mega_generate_run_sequence`：生成 Codex/Claude 运行顺序。
- `easyar_mega_write_run_sequence`：写入 `RUN_SEQUENCE.md`。
- `easyar_mega_generate_code_plan`：在写代码前规划 JS/TS/WXML/WXSS 改动。
- `easyar_mega_write_miniprogram_file`：安全写入小程序工程内文件。
- `easyar_mega_create_sample_page`：创建聚焦 Sample 页面并注册页面配置。
- `easyar_mega_review_miniprogram_code`：静态检查 secret、权限、生命周期、SDK 初始化、canvas/camera 使用和异步清理风险。

### WeChat DevTools Automation

- `easyar_mega_run_miniprogram_compile_check`：调用微信开发者工具 CLI 做编译/打开检查。
- `easyar_mega_run_devtools_preview`：通过 DevTools CLI 创建预览二维码。
- `easyar_mega_run_devtools_upload_dry_run`：在本地流程支持时验证上传配置，但不实际发布。
- `easyar_mega_analyze_devtools_log`：分析 DevTools 日志中的工程、app id、域名、包和 EasyAR 问题。

### Device Validation And Handoff

- `easyar_mega_generate_device_validation_checklist`：生成真机验证清单。
- `easyar_mega_write_device_validation_checklist`：写入 `DEVICE_VALIDATION.md`。
- `easyar_mega_generate_run_result`：总结编译、预览、上传和真机尝试。
- `easyar_mega_write_run_result`：写入 `RUN_RESULT.md`。

## 安全和发布原则

- 只处理用户授权的官方工作流。
- 所有账号登录、下载、license 创建和微信登录都由用户在官方网页或官方工具中完成。
- MCP 只读取本地工程结构、生成 runbook、检查配置是否存在、执行本地工具命令并生成脱敏报告。
- 任何发布版本都必须保留英文和中文文档。
