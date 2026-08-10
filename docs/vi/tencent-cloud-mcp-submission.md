# Hồ sơ gửi Tencent Cloud MCP

Tài liệu này thu thập tài liệu công khai, không bí mật để gửi `mcp-easyar` tới Nhà phát triển đám mây Tencent MCP.

## Cơ bản

- Tên: `mcp-easyar`
- Tên hiển thị: mcp-easyar
- Tên hiển thị tiếng Trung: EasyAR MCP Service
- Danh mục: Công cụ dành cho nhà phát triển / Công cụ dành cho nhà phát triển
- Thẻ: `EasyAR`, `Unity`, `AR`, `Image Tracking`, `Cloud Recognition`, `Mega`, `MCP`, `Codex`, `Claude`
- Giấy phép: Apache-2.0
- Kho lưu trữ: https://github.com/terri1982/mcp-easyar
- Trang chủ: https://github.com/terri1982/mcp-easyar#readme
- Tiếng Trung README: https://github.com/terri1982/mcp-easyar/blob/main/README.md
- Tiếng Anh README: https://github.com/terri1982/mcp-easyar/blob/main/README.en.md
- Phát hành: https://github.com/terri1982/mcp-easyar/releases/tag/v0.1.0-local-key.41
- Giải phóng tarball: https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.41/mcp-easyar-0.1.0.tgz
- Biểu trưng: `assets/easyar-icon.png`

## Mô tả ngắn

Giúp người dùng EasyAR đã đăng ký xây dựng và xác thực các mẫu Theo dõi hình ảnh EasyAR Unity, Nhận dạng đám mây và Mega bằng các công cụ mã hóa AI.

## Mô tả ngắn tiếng Trung

Giúp người dùng EasyAR đã đăng ký nhanh chóng định cấu hình, xây dựng và xác minh tính năng theo dõi hình ảnh của EasyAR Unity, CRS / Cloud Reviews và Mega Sample thông qua các công cụ AI như Codex và Claude.

## Mô tả dài

`mcp-easyar` là máy chủ Giao thức bối cảnh mô hình dành cho quy trình công việc EasyAR Unity được ủy quyền. Khóa cục bộ hiện tại MVP hướng dẫn người dùng đăng ký trang web EasyAR chính thức/login/download/key trong trình duyệt của riêng họ, sau đó giúp các dự án Unity cục bộ kiểm tra cấu hình, tạo sổ sách chạy, xác thực tính năng Theo dõi hình ảnh, CRS / Nhận dạng đám mây và tính sẵn sàng của Mega, đồng thời tạo ra các tạo phẩm hỗ trợ được loại bỏ. Tài liệu mặc định của GitHub là tiếng Trung, với các tài liệu README tiếng Anh và /Chinese tiếng Anh được sao chép được giữ lại để xuất bản song ngữ.

Máy chủ không yêu cầu người dùng cung cấp mật khẩu trang web EasyAR, mã xác minh, khóa cấp phép, bí mật API Nhận dạng đám mây hoặc `EASYAR_API_TOKEN`. Người dùng cài đặt Plugin EasyAR Sense Unity chính thức và điền cấu hình Unity cục bộ trên máy của chính họ.

## Mô tả dài tiếng Trung

`mcp-easyar` là dịch vụ MCP dành cho quy trình phát triển được ủy quyền của EasyAR Unity. Hiện tại khóa cục bộ MVP đã bao gồm tính năng Theo dõi hình ảnh, CRS / Nhận dạng đám mây và đã mở rộng cấu hình, bản dựng, khởi động thiết bị thực và khởi động được xác minh cục bộ của Mega Sample. Tài liệu mặc định của GitHub đã được chuyển sang tiếng Trung Quốc, trong khi vẫn giữ lại các tài liệu tiếng Anh README cũng như tiếng Trung và tiếng Anh. Người dùng hoàn tất đăng ký trang web chính thức của EasyAR, đăng nhập, tải xuống plug-in và tạo khóa trong trình duyệt của riêng họ; MCP chịu trách nhiệm hướng dẫn cấu hình cục bộ Unity, kiểm tra trạng thái dự án, tạo danh sách chạy, xác minh mức độ sẵn sàng của bản dựng và tạo tài liệu khắc phục sự cố không nhạy cảm.

Dịch vụ này không thu thập mật khẩu trang web chính thức của EasyAR, mã xác minh, khóa cấp phép, Nhận dạng đám mây API Bí mật, appSecret hoặc `EASYAR_API_TOKEN`. Người dùng cần tự cài đặt Plugin EasyAR Sense Unity chính thức và điền cấu hình cục bộ vào dự án Unity cục bộ.

## Cài đặt

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.41/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## MCP Lệnh

```json
{
  "mcpServers": {
    "easyar": {
      "command": "easyar-mcp",
      "args": [],
      "env": {
        "EASYAR_API_BASE_URL": "https://www.easyar.cn"
      }
    }
  }
}
```

## Cuộc gọi đầu tiên

```text
easyar_server_status
easyar_check_client_setup client=codex entrypointMode=package-bin includeTokenPlaceholder=false
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_account_onboarding accountStage=not-registered sampleId=cloud-recognition platform=android
```

## Ghi chú bảo mật

- Không yêu cầu người dùng cung cấp `EASYAR_API_TOKEN`.
- Không thu thập mật khẩu hoặc mã xác minh trang web EasyAR.
- Không thu thập khóa cấp phép, Nhận dạng đám mây API KEY/API Bí mật, `appKey` hoặc `appSecret` trong trò chuyện.
- Thông tin xác thực Local Unity nằm trong `ProjectSettings/EasyAR/easyar.local.json` hoặc các biến môi trường cục bộ.
- Báo cáo được tạo sẽ loại bỏ mã thông báo, khóa, mật khẩu, giấy phép và trường bí mật chung.

## Phạm vi hiện tại

- Sẵn sàng: Quy trình làm việc bằng khóa cục bộ theo dõi hình ảnh.
- Sẵn sàng: CRS / Nhận dạng đám mây quy trình làm việc bằng khóa cục bộ.
- Sẵn sàng trong `v0.1.0-local-key.41`: Quy trình làm việc bằng khóa cục bộ lớn với Android APK cài đặt/startup, bằng chứng dự án mới và bằng chứng bản địa hóa môi trường vật lý.
- Trì hoãn: Hello AR, Theo dõi bề mặt và các mẫu chính thức EasyAR khác.
- Đường cơ sở của Unity: 2022.3.62f3.
