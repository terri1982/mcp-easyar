# Cài đặt mcp-easyar từ bản phát hành GitHub

Hướng dẫn này dành cho đường dẫn phát hành khóa cục bộ MVP hiện tại. Nó giúp người dùng EasyAR đã đăng ký hoặc lần đầu tiên kết nối Codex, Claude hoặc ứng dụng khách MCP khác với quy trình công việc Unity cục bộ mà không cần cung cấp MCP mật khẩu trang web EasyAR.

Phạm vi mục tiêu hiện tại:

- Theo dõi hình ảnh
- CRS/Cloud Nhận dạng

Ngoài phạm vi của mục tiêu phát hành này:

- Xin chào AR
- Theo dõi bề mặt
- Các mẫu EasyAR khác

## 1. Cài đặt Tarball phát hành

Sử dụng Node.js 20 hoặc mới hơn.

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.41/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

`easyar-mcp-check` nên báo cáo `server-name`, phạm vi tập trung, công cụ, lời nhắc và tài nguyên là OK. Nó không cần bí mật EasyAR.

## 2. Định cấu hình MCP Máy khách

Đối với chế độ thùng gói, lệnh máy chủ MCP là:

```bash
easyar-mcp
```

Dành cho máy tính để bàn Claude:

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

Đối với Codex:

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

Các máy khách stdio MCP khác nên sử dụng cùng lệnh, args và env.

Không sử dụng `npx -y mcp-easyar` cho đường dẫn phát hành trước GitHub này trừ khi gói cũng đã được xuất bản lên npm. Lộ trình cài đặt công khai hiện tại là GitHub Release tarball plus `entrypointMode=package-bin`.

## 3. Bắt đầu bằng Local-Key MVP

Trước tiên hãy gọi những công cụ MCP này:

```text
easyar_server_status
easyar_authorization_strategy preferredMode=auto sampleId=cloud-recognition platform=android
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
```

Cũng đọc MCP tài nguyên `easyar://acceptance/fresh-project` trước khi chạy thiết lập Unity.

Chế độ MVP bình thường là `local-key`.

Người dùng hoàn thành các hành động này trong trình duyệt:

1. Đăng ký hoặc đăng nhập tại trang web EasyAR chính thức.
2. Tải xuống/install Plugin EasyAR Sense Unity chính thức.
3. Tạo hoặc định vị giấy phép EasyAR Sense cho mã nhận dạng gói Unity/bundle.
4. Đối với Nhận dạng đám mây, hãy tạo hoặc định vị AppId, Nhận dạng mục tiêu cuối máy khách URL, API KEY và API Bí mật.
5. Quay lại ứng dụng khách MCP chỉ ở giai đoạn tài khoản, chẳng hạn như `logged-in` hoặc `has-cloud-credentials`.

MCP không được nhận mật khẩu trang web EasyAR, mã xác minh, mã thông báo tài khoản thô, khóa cấp phép, API KEY/API Bí mật, appKey hoặc appSecret trong cuộc trò chuyện.

## 4. Chuẩn bị Dự án Unity

Chạy các tác giả chuyển giao:

```text
easyar_write_first_run_guide projectPath=/path/to/UnityProject accountStage=logged-in sampleId=cloud-recognition platform=android
easyar_write_local_config_handoff projectPath=/path/to/UnityProject accountStage=logged-in sampleId=cloud-recognition platform=android
easyar_write_local_config_form projectPath=/path/to/UnityProject accountStage=logged-in sampleId=cloud-recognition platform=android
easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
```

Điền `ProjectSettings/EasyAR/easyar.local.json` cục bộ hoặc sử dụng tính năng viết dựa trên môi trường:

```text
easyar_write_local_config_from_env projectPath=/path/to/UnityProject sampleId=cloud-recognition
easyar_validate_local_config projectPath=/path/to/UnityProject sampleId=cloud-recognition
```

Việc xác thực chỉ báo cáo các vấn đề về hiện diện và phần giữ chỗ. Nó không in các giá trị bí mật.

## 5. Chạy Quy trình làm việc tập trung

Để theo dõi hình ảnh:

```text
easyar_next_workflow_step projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_run_sequence projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
```

Dành cho nhận dạng đám mây:

```text
easyar_next_workflow_step projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_run_sequence projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
```

Chỉ tiếp tục khi `PREFLIGHT.md` cho thấy mẫu đã chọn đã sẵn sàng. Sau khi chạy thiết bị thực, hãy ghi lại bằng chứng với:

```text
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=image-tracking platform=android overallStatus=passed
easyar_write_completion_report projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
```

Sử dụng `sampleId=cloud-recognition` để chạy Nhận dạng đám mây.

## 6. Khắc phục sự cố

Nếu máy khách MCP không thể khởi động máy chủ:

```bash
which easyar-mcp
easyar-mcp-check
```

Nếu tự động hóa Unity bị chặn:

```text
easyar_unity_environment projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_analyze_latest_unity_log projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_support_bundle projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
```

Đối với Nhận dạng đám mây, hãy chuyển `sampleId` sang `cloud-recognition`.

## Ranh giới bảo mật

Khóa cục bộ MVP không chứng minh quyền truy cập tài khoản từ xa. Nó giả sử người dùng có được plugin và tài liệu chính thông qua trang web EasyAR chính thức. Tự động hóa quyền của tài khoản sản xuất/license/download/cloud vẫn là một kênh API chính thức riêng biệt.

Không bỏ qua đăng nhập EasyAR, kiểm tra giấy phép, ủy quyền tải xuống, cổng doanh nghiệp hoặc giới hạn tốc độ.
