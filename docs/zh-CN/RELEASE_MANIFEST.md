# mcp-easyar 发布清单

当前发布：`v0.1.0-local-key.38`

## 安装

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.38/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## 验证命令

```bash
npm run typecheck
npm test
npm run bin:smoke
npm run install:check
npm run package:smoke
npm run pack:check
npm run security:check
EASYAR_RELEASE_REQUIRE_LOCAL_KEY_MVP=1 EASYAR_RELEASE_EVIDENCE_PATH=docs/release-evidence/focused-scope.android.json EASYAR_RELEASE_PLATFORM=android npm run release:check
```

## 发布模型

- `local-key-mvp`：当前 GitHub prerelease gate。已发布的两样本证据覆盖 Image Tracking 和 CRS / Cloud Recognition；当前工作树已补 Mega Android 真机安装、启动、定位跟踪、fresh project Mega APK 启动与定位/跟踪证据，并新增 PICO 4 Ultra Enterprise 眼镜 sample 的 APK 打包、安装、PICO VST、眼镜内实景透视、Mega `Found` 和办公室 block 定位证据，以及 Android Motion Tracking 相机/Panda 干净正式包验证记录。
- `production`：未来官方 API 接入后使用。

## 包内容

包内包含默认中文 README、英文 README、核心 docs、中文 docs、release evidence、official API contract、安装 smoke 脚本和 MCP binary。

## 当前 focused scope

- Image Tracking
- CRS / Cloud Recognition
- Mega（Android 手机、PICO 4 Ultra Enterprise 眼镜与 XREAL 眼镜均以 Onsite 作为验收基线）

## local-key 用户配置

普通用户不需要提供 `EASYAR_API_TOKEN`。用户在自己的浏览器中完成 EasyAR 官网注册、登录、下载、license 创建、CRS key 创建和 Mega 云定位库/Block 信息查找，然后在本机 Unity 工程里填写本地配置。

未来只有在 EasyAR 官方账号 API 接入生产环境后，`EASYAR_API_TOKEN`、账号状态、license 校验、下载权限和 CRS 凭证发现等变量才属于高级官方 API 部署配置。

## 新增证据

- 英文：`docs/release-evidence/mega-pico4-ultra-enterprise-summary.md`
- 中文：`docs/zh-CN/release-evidence/mega-pico4-ultra-enterprise-summary.md`
- 英文：`docs/release-evidence/motion-tracking-camera-panda-android.md`
- 中文：`docs/zh-CN/release-evidence/motion-tracking-camera-panda-android.md`
