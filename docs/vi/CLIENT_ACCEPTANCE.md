# Danh sách nghiệm thu MCP client của mcp-easyar

Sử dụng danh sách kiểm tra này sau khi cài đặt `mcp-easyar` từ tarball bản phát hành GitHub, gói npm, thanh toán cục bộ hoặc hồ sơ npx.

Mục đích là để chứng minh rằng Codex, Claude Desktop hoặc ứng dụng khách MCP stdio khác có thể khởi động máy chủ, liệt kê các công cụ/resources và tiếp cận các lệnh gọi quy trình làm việc EasyAR đầu tiên mà không để lộ bí mật.

## Kiểm tra cài đặt

Chạy kiểm tra gói từ cùng môi trường shell mà máy khách MCP sẽ sử dụng:

```bash
easyar-mcp-check
```

Kết quả mong đợi:

- `OK server-name`
- `OK tools`
- `OK prompts`
- `OK resources`
- `OK github-release-install`
- `OK local-key-release-notes`
- `OK roadmap`
- `OK focused-scope-workflow`

Việc kiểm tra không được yêu cầu mật khẩu trang web EasyAR, khóa cấp phép, API bí mật Nhận dạng đám mây, `appKey` hoặc `appSecret`.

## Cấu hình máy khách gói-Bin

Sử dụng chế độ gói-bin sau khi cài đặt từ GitHub Release hoặc npm:

```text
easyar_generate_client_config client=codex entrypointMode=package-bin includeTokenPlaceholder=false
easyar_generate_client_config client=claude-desktop entrypointMode=package-bin includeTokenPlaceholder=false
easyar_check_client_setup client=codex entrypointMode=package-bin includeTokenPlaceholder=false
easyar_check_client_setup client=claude-desktop entrypointMode=package-bin includeTokenPlaceholder=false
```

Lệnh MCP dự kiến:

```json
{
  "command": "easyar-mcp",
  "args": []
}
```

## Cuộc gọi đầu tiên của khách hàng

Sau khi khởi động lại ứng dụng khách MCP với cấu hình đã tạo, hãy chạy:

```text
easyar_server_status
easyar_auth_status
easyar_release_manifest
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
```

Kết quả dự kiến:

- Tên máy chủ báo cáo `mcp-easyar`.
- Các mẫu tập trung bao gồm `image-tracking` và `cloud-recognition`.
- Tài nguyên bao gồm `easyar://status/current`, `easyar://acceptance/fresh-project`, `easyar://workflow/focused-scope` và `easyar://workflow/programming`.
- `easyar://status/remaining-work` báo cáo các khoảng trống có phạm vi hiện tại và các trình chặn sản xuất đầy đủ mà không có bí mật.
- `easyar_auth_status` chỉ báo cáo sự hiện diện bí mật dưới dạng boolean hoặc bản xem trước được xử lý lại.

## Unity Project Handoff

Đối với dự án Unity, hãy viết một tạo phẩm thiết lập máy khách trước khi tự động hóa Unity:

```text
easyar_write_client_setup outputRoot=/path/to/report-folder client=codex entrypointMode=package-bin
easyar_write_first_run_guide projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_write_local_config_handoff projectPath=/path/to/UnityProject accountStage=logged-in sampleId=cloud-recognition platform=android
easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
```

Đọc `CLIENT_SETUP.md`, `FIRST_RUN.md`, `LOCAL_CONFIG_HANDOFF.md` và `PREFLIGHT.md` trước khi yêu cầu khách hàng chạy các lệnh bó Unity.

## Phân loại lỗi

- Nếu `tools/list` trống, hãy khởi động lại ứng dụng khách MCP và xác minh JSON được lồng trong `mcpServers.easyar`.
- Nếu không tìm thấy `easyar-mcp`, hãy cài đặt lại gói hoặc sử dụng `node dist/index.js` cấu hình local-dist tuyệt đối.
- Nếu `package-bin` hoạt động trong Terminal nhưng không hoạt động trong máy khách, hãy căn chỉnh môi trường máy khách `PATH`.
- Nếu các công cụ tài khoản chính thức báo cáo các biến điểm cuối là bị thiếu, tiếp tục chuyển giao trình duyệt khóa cục bộ trừ khi API chính thức sản xuất được định cấu hình có chủ đích.
- Nếu lệnh gọi Unity không thành công, hãy chạy `easyar_write_unity_environment_report` và `easyar_write_focused_preflight` trước khi thay đổi tệp dự án.

## Bảo mật

Không dán hoặc cam kết mật khẩu trang web EasyAR, mã xác minh, khóa cấp phép, Khóa nhận dạng đám mây API Bí mật /API, `appKey`, `appSecret`, ký khóa, APK, gói Unity hoặc nhật ký riêng tư.
