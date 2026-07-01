# EasyAR Official Docs Refresh - 2026-07-01

Source: <https://www.easyar.cn/doc/zh-cn/>

This MCP metadata refresh is based on a complete crawl of the official EasyAR Chinese documentation sitemap on 2026-07-01. The crawl covered 819 pages:

- Cloud API: 19 pages
- Native API: 166 pages
- Unity API: 239 pages
- WeChat API: 52 pages
- Development guides: 247 pages across Unity, Native, WeChat, Web, Mega, and headset topics
- Mega user guides: 95 pages
- Top-level documentation index: 1 page

## Current Official Versions

- EasyAR Sense Unity Plugin: `4003.0.0`
- EasyAR Sense Unity Plugin for Mega: `4003.0.0`
- EasyAR Mega support package: `2.13.0`
- EasyAR Mega Studio (Unity): `2.13.0`
- EasyAR Sense Unity Plugin Extensions / XR device extension package: `4000.0.1`
- EasyAR Sense Native: `4.9.0`
- EasyAR Mega WeChat Mini Program Plugin: `2.0.3`

## MCP-Relevant Changes

- Unity Plugin `4003.0.0` introduces the newer Mega development workflow centered on `MegaBlockController`.
- Legacy Unity Mega assumptions need caution: Mega Studio generated node groups, multi-block configuration options, and BlockRoot-centric setup are no longer the current primary workflow.
- `com.easyar.mega` is now the Mega support package; Mega Studio is split into `com.easyar.mega.studio`.
- Mega Studio `2.13.0` no longer supports the old Unity development flow and removes older Block Viewer tools.
- The docs now include expanded headset guidance for Apple Vision Pro, XREAL Air2 Ultra, PICO 4 Ultra Enterprise, Rokid AR Studio, and third-party headset extension packages.
- Mega operations documentation now prominently covers scene update, format upgrade, migration to the newer mapping service, onsite/simulator location input, data collection, and troubleshooting.
- Native Sense remains at `4.9.0`; WeChat Mega remains at `2.0.3`, so MCP should not invent newer versions for those tracks.

## Key Official References

- Unity release notes: <https://www.easyar.cn/doc/zh-cn/develop/unity/release-notes/release-notes.html>
- Native release notes: <https://www.easyar.cn/doc/zh-cn/develop/native/release-notes/release-notes.html>
- Mega Studio release notes: <https://www.easyar.cn/doc/zh-cn/mega/reference/studio-unity/release-notes.html>
- WeChat Mega release notes: <https://www.easyar.cn/doc/zh-cn/develop/wechat/mega/release-notes.html>
- Headset overview: <https://www.easyar.cn/doc/zh-cn/develop/headsets/headsets.html>
- Unity headset support: <https://www.easyar.cn/doc/zh-cn/develop/unity/headsets/headsets.html>
- Unity Mega quickstart: <https://www.easyar.cn/doc/zh-cn/develop/unity/mega/quickstart.html>
- WeChat Mega quickstart: <https://www.easyar.cn/doc/zh-cn/develop/wechat/mega/quickstart.html>
- Mega scene update: <https://www.easyar.cn/doc/zh-cn/mega/scene-update/intro.html>
- Mega format upgrade: <https://www.easyar.cn/doc/zh-cn/mega/format-upgrade/intro.html>
- Mega migration: <https://www.easyar.cn/doc/zh-cn/mega/migration/intro.html>
