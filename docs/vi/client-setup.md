# mcp-easyar Thiết lập ứng dụng khách

Sử dụng hướng dẫn này khi kết nối Codex, Claude Desktop hoặc ứng dụng khách MCP stdio khác với `mcp-easyar`.

## Cài đặt hồ sơ

### Kho lưu trữ cục bộ

Sử dụng hướng dẫn này khi phát triển hoặc thử nghiệm trực tiếp kho lưu trữ.

```bash
npm install
npm run build
npm run install:check
```

MCP khởi chạy:

```json
{
  "mcpServers": {
    "easyar": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-easyar/dist/index.js"],
      "env": {
        "EASYAR_API_BASE_URL": "https://www.easyar.cn"
      }
    }
  }
}
```

Tạo đoạn mã cấu hình cục bộ:

```text
easyar_generate_client_config client=claude-desktop entrypointMode=local-dist serverPath=/absolute/path/to/mcp-easyar/dist/index.js
easyar_check_client_setup client=claude-desktop entrypointMode=local-dist serverPath=/absolute/path/to/mcp-easyar/dist/index.js
```

### Gói phát hành GitHub

Sử dụng gói này cho Bản phát hành GitHub khóa cục bộ MVP hiện tại. Thao tác này sẽ cài đặt gói nhị phân mà không cần chờ xuất bản sổ đăng ký npm.

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.41/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

Claude Desktop MCP khởi chạy:

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

Khởi chạy Codex MCP sử dụng cùng một hình dạng stdio:

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

Tạo đoạn mã cấu hình thùng gói:

```text
easyar_generate_client_config client=claude-desktop entrypointMode=package-bin
easyar_generate_client_config client=codex entrypointMode=package-bin includeTokenPlaceholder=false
easyar_check_client_setup client=claude-desktop entrypointMode=package-bin
```

### Gói npm toàn cầu sau npm xuất bản

Sử dụng gói này sau khi gói được xuất bản lên npm.

```bash
npm install -g mcp-easyar
easyar-mcp-check
```

Sau khi cài đặt, hãy sử dụng cùng một `package-bin` MCP cấu hình khởi chạy được hiển thị ở trên.

### gói npx sau npm Publish

Sử dụng cấu hình này sau khi `mcp-easyar` được xuất bản lên npm, khi máy khách có thể truy cập sổ đăng ký npm và bạn không muốn cài đặt toàn cầu. Đối với bản phát hành trước GitHub hiện tại, hãy sử dụng cấu hình gói Phát hành GitHub ở trên.

```bash
npx -y mcp-easyar
```

MCP khởi chạy:

```json
{
  "mcpServers": {
    "easyar": {
      "command": "npx",
      "args": ["-y", "mcp-easyar"],
      "env": {
        "EASYAR_API_BASE_URL": "https://www.easyar.cn"
      }
    }
  }
}
```

Tạo đoạn mã cấu hình npx:

```text
easyar_generate_client_config client=codex entrypointMode=npx includeTokenPlaceholder=false
easyar_check_client_setup client=codex entrypointMode=npx includeTokenPlaceholder=false
```

## Xử lý bí mật

Giữ các giá trị EasyAR thực trong môi trường máy khách MCP, chuỗi khóa hệ điều hành, kho bí mật triển khai hoặc cấu hình dự án bị bỏ qua cục bộ.

Không bao giờ dán các giá trị này vào cuộc trò chuyện, sự cố GitHub, tệp đã cam kết hoặc cấu phần phần mềm hỗ trợ được tạo:

- Mật khẩu trang web EasyAR
- mã xác minh
- Giấy phép EasyAR khóa
- Nhận dạng đám mây API Khóa/API Bí mật
- kế thừa `appKey`/`appSecret`
- khóa ký di động hoặc tệp cấp phép

Các công cụ kiểm tra cài đặt và thiết lập ứng dụng khách chỉ báo cáo sự hiện diện, hình dạng điểm truy cập, khả năng đọc tài nguyên và các hành động tiếp theo.

## Cuộc gọi khói đầu tiên

Sau khi máy khách khởi động máy chủ, hãy gọi:

```text
easyar_server_status
easyar_auth_status
easyar_release_manifest
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_write_client_setup outputRoot=/path/to/report-folder client=claude-desktop entrypointMode=package-bin
```

Cũng đọc MCP tài nguyên `easyar://acceptance/fresh-project`. Sau đó, hãy làm theo các cấu phần `CLIENT_SETUP.md`, `FIRST_RUN.md` và `PREFLIGHT.md` đã tạo trước khi yêu cầu máy khách chạy Unity Automation.

## Khắc phục sự cố

- Nếu `tools/list` trống, hãy khởi động lại máy khách MCP và xác minh rằng JSON được lồng trong `mcpServers.easyar`.
- Nếu `local-dist` không thành công, hãy chạy lại `npm install && npm run build` và sử dụng đường dẫn `dist/index.js` tuyệt đối.
- Nếu `package-bin` không thành công, hãy chạy `easyar-mcp-check` trong cùng môi trường shell được máy khách MCP sử dụng.
- Nếu `npx` không thành công sau khi xuất bản npm, hãy xác minh quyền truy cập đăng ký npm/network và chạy `npx -y mcp-easyar` trong một thiết bị đầu cuối. Trước khi xuất bản npm, thay vào đó hãy sử dụng hồ sơ gói Phát hành GitHub.
- Nếu các công cụ tài khoản chính thức trả về `configured=false`, người dùng khóa cục bộ MVP có thể bỏ qua trạng thái đó. Việc triển khai API chính thức trong tương lai sẽ định cấu hình xác thực do dịch vụ quản lý bên ngoài cuộc trò chuyện của người dùng.
