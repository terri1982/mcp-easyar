# Ghi chú phát hành mcp-easyar local-key MVP

Phiên bản hiện tại: `v0.1.0-local-key.40`

## Điểm nổi bật

- Thêm README chính bằng tiếng Nhật và tiếng Việt.
- Mỗi ngôn ngữ có quickstart, hướng dẫn cài từ GitHub Release, status và release notes.
- Bao gồm quy trình Unity CLI `1.0.0-beta.3` giới hạn: preflight, nhập Sample, prepare, configure, validate và build Android.
- Ghi nhận kiểm thử Samsung S22 Image Tracking với danh thiếp công ty và XREAL Air 2 Ultra Mega `Found`.
- Kiểm tra XREAL SDK `3.1.0+`, Enterprise camera license, Native Session Manager, XR Loader, OpenGL ES 3 và Android API 29 trước khi build.
- Default core profile có khoảng 68 công cụ; `generate_*` cũ chỉ được giữ trong full profile để tương thích.
- Không đưa license, APK, private map ID hoặc raw private log vào package phát hành.

## Cài đặt

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.40/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## Trạng thái sẵn sàng

- Local-key MVP ready: yes
- Production official API ready: no

Bản phát hành không vượt qua đăng nhập, license, quyền tải xuống, enterprise gate hoặc rate limit.
