# EasyAR Mega MCP 干净环境验收

本文只描述 Unity Mega Sample。微信小程序 Mega 是另一条路径，必须使用 `sampleId=wechat-mega` 和 `easyar-run-wechat-miniprogram`，不能用本文的 Unity APK 或头显证据替代。

## 目标

在没有复用当前仓库 `node_modules`、没有继承 EasyAR 环境变量、没有预置 Unity 工程的临时消费者目录中，验证 MCP 是否会：

- 明确选择 `sampleId=mega`；
- 明确要求 `LocationInputMode=Onsite`；
- 在缺少官方包、License、Mega 配置和场景时停在 preflight，而不是假装已跑通；
- 在没有 APK 时阻止安装；
- 在没有真实设备定位证据时保持 `runThroughComplete=false`；
- 把 Unity Mega 和微信小程序 Mega 互相排除，避免产物误认。

## 自动验收

在仓库根目录运行：

```bash
npm run mega:clean-smoke
```

该命令会临时打包当前 MCP，安装到新的 consumer 目录，启动 package binary，并创建一个只有 Unity 基础目录和 `ProjectVersion.txt` 的空工程。测试结束后临时目录会被删除，不会写入用户工程，也不会要求账号、License、Mega API Secret 或设备权限。

账号与 ID 隔离：本 smoke 不读取或复用用户目录中的 EasyAR 账号、密码、`EASYAR_API_TOKEN`、License、Mega AppID、API Key 或 API Secret。`sampleId=mega` 只是 MCP 的固定样本目录键；测试中的 `com.example.clean.mega` 只是临时假设备包名，不是账号 ID。真实 APK、真实包名、设备序列号和既有 Unity 工程属于单独的设备边界复测，不属于本 clean smoke 的证明。

通过标准：

- `easyar-run-mega` prompt 存在，并明确这是 Unity Mega 路径；
- `easyar-run-wechat-miniprogram` prompt 明确不是 Unity/Android APK/PICO/XREAL 路径；
- 空工程 Mega preflight 有 blocker，`readyForUnityBatch=false` 且 `readyForDeviceBuild=false`；
- 空工程设备清单有 blocker；
- APK dry-run 明确 `apkExists=false`，并建议先构建；
- completion report 明确 `runThroughComplete=false`，不能产生假阳性。

## Unity Mega 真机验收

干净 MCP 安装通过后，使用用户自己的 Unity 工程和官方材料。推荐入口：

```text
easyar-run-mega
projectPath=/absolute/path/to/UnityProject
platform=android
targetDevice=android-phone
```

MCP 应按以下顺序推进，并在每一步读取产物：

1. 读取 `easyar://acceptance/fresh-project` 和 `easyar://samples/catalog`。
2. 写入账号材料、Unity 环境和 `Assets/EasyARGenerated/mega/PREFLIGHT.md`。
3. Mega 配置只使用 `Assets/XR/Settings/EasyAR Settings.asset`；prepare 不生成 `easyar.local.json.example` 或 JSON bridge。
4. 先读 scene audit。多个 Onsite 候选或 Simulator 位于 Build Settings 首位时，使用报告推荐的完整 `scenePath` 重新生成 Build Settings helper。
5. 只有 preflight 没有 required blocker 时，才导入官方 Mega sample、生成 run sequence、编译和构建。
6. Android 设备链路依次为设备状态、APK 安装、启动、现场观察、过滤并脱敏 logcat。
7. 真实设备必须在选定的映射环境中完成 Mega Block localization/tracking；编辑器、Simulator、编译成功、APK 安装成功或应用启动成功都不够。
8. 最后写 `RUN_RESULT.md` 和 `COMPLETION_REPORT.md`，只有报告中的 `runThroughComplete=true` 才能称为跑通。

Mega 4003+ 工程应优先使用官方 `MegaBlockController` 流程；Android 手机、PICO 和 XREAL 真机验收使用 `Onsite`。所有 License、API Key/API Secret、签名材料和原始私有日志只留在本机，不进入聊天或提交内容。
