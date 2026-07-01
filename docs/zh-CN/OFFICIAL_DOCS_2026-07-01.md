# EasyAR 官方文档刷新 - 2026-07-01

来源：<https://www.easyar.cn/doc/zh-cn/>

本次 MCP 元数据刷新基于 2026-07-01 对 EasyAR 官方中文文档 sitemap 的完整抓取，共覆盖 819 个页面：

- Cloud API：19 页
- Native API：166 页
- Unity API：239 页
- WeChat API：52 页
- 开发指南：247 页，覆盖 Unity、Native、微信小程序、Web、Mega、头显等主题
- Mega 使用指南：95 页
- 顶层文档索引：1 页

## 当前官方版本

- EasyAR Sense Unity Plugin：`4003.0.0`
- EasyAR Sense Unity Plugin for Mega：`4003.0.0`
- EasyAR Mega 支持包：`2.13.0`
- EasyAR Mega Studio (Unity)：`2.13.0`
- EasyAR Sense Unity Plugin Extensions / XR 设备扩展包：`4000.0.1`
- EasyAR Sense Native：`4.9.0`
- EasyAR Mega 微信小程序插件：`2.0.3`

## 对 MCP 有影响的变化

- Unity Plugin `4003.0.0` 引入以 `MegaBlockController` 为中心的新 Mega 开发流程。
- 旧 Unity Mega 假设需要谨慎处理：Mega Studio 生成节点组、多 block 配置选项、BlockRoot 中心化配置不再是当前主要开发路径。
- `com.easyar.mega` 现在是 Mega 支持包；Mega Studio 拆分到 `com.easyar.mega.studio`。
- Mega Studio `2.13.0` 不再支持旧 Unity 开发流程，并移除了旧 Block Viewer 工具。
- 官方文档已扩展头显说明，覆盖 Apple Vision Pro、XREAL Air2 Ultra、PICO 4 Ultra Enterprise、Rokid AR Studio 和第三方头显扩展包。
- Mega 运维文档明显扩展，包含场景更新、格式升级、新建图服务迁移、Onsite/Simulator 定位输入、数据采集和排障。
- Native Sense 仍是 `4.9.0`；微信 Mega 仍是 `2.0.3`，MCP 不应为这些轨道虚构更高版本。

## 关键官方链接

- Unity 发行说明：<https://www.easyar.cn/doc/zh-cn/develop/unity/release-notes/release-notes.html>
- Native 发行说明：<https://www.easyar.cn/doc/zh-cn/develop/native/release-notes/release-notes.html>
- Mega Studio 发行说明：<https://www.easyar.cn/doc/zh-cn/mega/reference/studio-unity/release-notes.html>
- 微信 Mega 发布日志：<https://www.easyar.cn/doc/zh-cn/develop/wechat/mega/release-notes.html>
- 头显概览：<https://www.easyar.cn/doc/zh-cn/develop/headsets/headsets.html>
- Unity 头显支持：<https://www.easyar.cn/doc/zh-cn/develop/unity/headsets/headsets.html>
- Unity Mega 快速入门：<https://www.easyar.cn/doc/zh-cn/develop/unity/mega/quickstart.html>
- 微信 Mega 快速入门：<https://www.easyar.cn/doc/zh-cn/develop/wechat/mega/quickstart.html>
- Mega 场景更新：<https://www.easyar.cn/doc/zh-cn/mega/scene-update/intro.html>
- Mega 格式升级：<https://www.easyar.cn/doc/zh-cn/mega/format-upgrade/intro.html>
- Mega 迁移：<https://www.easyar.cn/doc/zh-cn/mega/migration/intro.html>
