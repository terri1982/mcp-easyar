# Trạng thái hiện tại của mcp-easyar

GitHub prerelease hiện tại: `v0.1.0-local-key.40`

## Đã xác minh

- Cài GitHub Release tarball và chạy `easyar-mcp-check`
- Default core profile khoảng 68 công cụ
- Các công cụ tương thích cũ trong full profile
- Image Tracking: Samsung S22 nhận diện danh thiếp công ty và hiển thị Panda
- CRS / Cloud Recognition: bằng chứng nhận diện trên thiết bị Android thật
- Mega: bằng chứng build/install/runtime trên Android phone, fresh project, PICO 4 Ultra Enterprise và XREAL Air 2 Ultra
- XREAL: Unity CLI `1.0.0-beta.3`, Native Session Manager, Enterprise camera license, XREAL XR Loader, OpenGL ES 3 và Mega `Found`
- Motion Tracking: release APK chỉ hiển thị camera, ẩn debug UI và đặt Panda
- WeChat Mini Program: kiểm tra cục bộ, nhập package chính thức, DevTools handoff và validation report cho `wechat-mega` / `wechat-crs`
- README, quickstart, install, status và release notes bằng tiếng Nhật và tiếng Việt

## Chưa hoàn thành

- Kiểm thử thiết bị thật cho Hello AR, Surface Tracking và các Sample bổ sung
- Bằng chứng preview, upload và thiết bị thật cho `wechat-mega` / `wechat-crs`
- EasyAR-owned account/license/download/CRS production API
- npm publish sau khi production gate hoàn tất

## Cài đặt

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.40/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

Đây là local-key MVP prerelease, không phải tuyên bố production API ready.
