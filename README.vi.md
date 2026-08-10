<p align="center">
  <img src="assets/easyar-icon.png" alt="EasyAR logo" width="96" height="96">
</p>

# mcp-easyar

[简体中文](README.md) | [English](README.en.md) | [日本語](README.ja.md) | Tiếng Việt

`mcp-easyar` là máy chủ MCP giúp người dùng EasyAR đã đăng ký cấu hình, build, kiểm thử trên thiết bị thật và hỗ trợ lập trình các EasyAR Unity Sample bằng Codex, Claude và những MCP client khác.

Phiên bản công khai hiện tại đi theo mô hình local-key MVP. Người dùng tự đăng ký, đăng nhập, tải plugin chính thức và tạo license / CRS key trên trang EasyAR. MCP chỉ hướng dẫn, kiểm tra cục bộ và tự động hóa Unity; không yêu cầu gửi mật khẩu, mã xác minh, license key, API Secret hoặc appSecret vào cuộc trò chuyện.

## Bản phát hành hiện tại

- GitHub prerelease: `v0.1.0-local-key.40`
- Sample đã được xác minh:
  - Image Tracking
  - CRS / Cloud Recognition
  - Mega
- Bằng chứng thiết bị thật:
  - Samsung S22 nhận diện danh thiếp công ty và hiển thị Panda
  - Mega trên Android, fresh Unity project và PICO 4 Ultra Enterprise
  - XREAL Air 2 Ultra dùng Native Session Manager và Enterprise camera license, trả về Mega `Found`
- Unity CLI: `1.0.0-beta.3`
- Unity: `2022.3.62f3`
- Hướng WeChat Mini Program hỗ trợ `wechat-mega` và `wechat-crs` cho kiểm tra dự án, nhập gói chính thức, DevTools handoff và checklist kiểm thử. Dự án không tự tuyên bố đã preview, upload hoặc chạy thành công trên thiết bị khi chưa có bằng chứng.

## Cài đặt

Yêu cầu Node.js 20 trở lên.

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.40/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

Cấu hình MCP client dùng package binary:

```json
{
  "mcpServers": {
    "easyar": {
      "command": "easyar-mcp",
      "args": []
    }
  }
}
```

## Profile công cụ

Chế độ mặc định là `core`, hiện có khoảng 68 công cụ để tránh cảnh báo giới hạn 80 công cụ của một số MCP client.

Chỉ dùng `full` khi cần bảo trì hoặc khả năng tương thích đầy đủ:

```bash
MCP_EASYAR_TOOL_PROFILE=full easyar-mcp
```

Các công cụ `generate_*` cũ vẫn được giữ trong full profile. Trong core profile, dùng công cụ `write_*` tương ứng với `output="inline"` hoặc `output="file"`.

## Lệnh MCP đầu tiên

```text
easyar_server_status
easyar_list_samples
easyar_write_client_setup outputRoot=/path/to/workspace client=codex entrypointMode=package-bin output=inline
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_account_onboarding accountStage=not-registered sampleId=cloud-recognition platform=android
```

Các MCP resource nên đọc:

```text
easyar://acceptance/fresh-project
easyar://acceptance/wechat-miniprogram
easyar://samples/wechat-miniprogram
easyar://roadmap/full-goal
easyar://workflow/programming
```

## Quy trình local-key

1. Người dùng tự đăng ký và đăng nhập EasyAR trong trình duyệt.
2. Tải EasyAR Sense Unity Plugin chính thức.
3. Tạo hoặc tìm license đúng với package name của ứng dụng.
4. Với CRS, cấu hình AppId, service URL, API KEY và API Secret ở máy cục bộ. Với Mega, chọn Mega Block và bản đồ tương ứng.
5. Lưu dữ liệu bí mật trong dự án cục bộ, ví dụ `ProjectSettings/EasyAR/easyar.local.json`.
6. MCP chỉ kiểm tra sự tồn tại, định dạng và placeholder; không trả lại giá trị bí mật.
7. Sau khi build, phải xác minh hành vi AR trên thiết bị thật. Chỉ tạo được APK chưa phải là hoàn thành.

## Quy trình Unity CLI

`easyar_unity_cli_status` kiểm tra Unity CLI đã cài, bản mới nhất của beta channel và trạng thái Pipeline.

`easyar_unity_cli` chỉ cho phép các thao tác giới hạn:

- `preflight`
- `import-sample`
- `prepare`
- `configure`
- `validate`
- `build-android`

Điện thoại Android dùng `deviceProfile=android-phone`; XREAL dùng `deviceProfile=xreal`. Trước khi build XREAL, MCP kiểm tra `com.xreal.xr` `3.1.0+`, Enterprise camera license, Native Session Manager, XREAL XR Loader, OpenGL ES 3 và Android API 29. Tài liệu EasyAR không yêu cầu một Unity package riêng tên `com.xreal.xr.enterprise`.

## Tiêu chí hoàn thành Sample

- Image Tracking: nhận diện đúng ảnh mục tiêu và hiển thị nội dung AR gắn với mục tiêu trên camera thiết bị thật.
- CRS / Cloud Recognition: nhận kết quả nhận diện cloud với cấu hình dịch vụ hợp lệ.
- Mega: định vị thành công trong không gian đã lập bản đồ và có tín hiệu thành công như `Found`.
- XREAL / PICO: nhìn thấy camera passthrough trong kính, dùng đúng frame source và `LocationInputMode=Onsite`, sau đó định vị thành công.

## WeChat Mini Program

Phạm vi hiện tại gồm `wechat-mega` và `wechat-crs`:

- kiểm tra cấu trúc dự án
- phát hiện WeChat Developer Tools CLI
- biểu mẫu cấu hình cục bộ
- nhập an toàn package hoặc zip chính thức do người dùng đã tải
- phân tích DevTools log
- preflight, run sequence, device validation, run result và completion report

MCP không tự đăng nhập WeChat hoặc EasyAR, không vượt qua quyền tải xuống và không thu thập secret trong cuộc trò chuyện.

## Ranh giới bảo mật

Không gửi các dữ liệu sau vào chat, GitHub hoặc log công khai:

- mật khẩu và mã xác minh EasyAR
- license key
- CRS API KEY / API Secret
- appKey / appSecret
- signing key
- APK, Unity package hoặc log có dữ liệu bí mật

`mcp-easyar` không vượt qua đăng nhập, kiểm tra license, quyền tải xuống, enterprise gate hoặc rate limit của EasyAR.

## Tài liệu tiếng Việt

- [Mục lục tài liệu](docs/vi/README.md)
- [Bắt đầu nhanh](docs/vi/quickstart.md)
- [Cài đặt từ GitHub Release](docs/vi/install-from-github-release.md)
- [Trạng thái hiện tại](docs/vi/STATUS.md)
- [Ghi chú phát hành local-key MVP](docs/vi/release-notes/local-key-mvp.md)

## Ngôn ngữ khác

- [简体中文](README.md)
- [English](README.en.md)
- [日本語](README.ja.md)

## Phạm vi hiện tại

Local-key MVP đã phát hành Image Tracking, CRS / Cloud Recognition và Mega qua GitHub Release. Tự động hóa production bằng API account/license/download/CRS chính thức và npm production publish vẫn nằm ngoài phạm vi cho đến khi production gate hoàn tất.
