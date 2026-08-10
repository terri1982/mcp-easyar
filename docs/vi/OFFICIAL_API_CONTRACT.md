# Hợp đồng API chính thức của mcp-easyar

Được tạo vào lúc: 2026-06-10T15:38:16.371Z
Máy chủ: mcp-easyar 0.1.0
Sẵn sàng để truy cập chính thức vào sản xuất: no

## Mục đích

Dịch vụ EasyAR MCP chính thức dành cho người dùng đã đăng ký chạy các mẫu EasyAR Unity và quy trình lập trình dự án Unity.

Hợp đồng có thể đọc được bằng máy: `docs/openapi/easyar-mcp-account-api.openapi.json`

## Môi trường

Cơ sở URL: https://www.easyar.cn
Mã thông báo: EASYAR_API_TOKEN
Mã thông báo được định cấu hình ngay bây giờ: no

### Biến bắt buộc

- EASYAR_API_BASE_URL
- EASYAR_API_TOKEN
- EASYAR_ACCOUNT_STATUS_ENDPOINT
- EASYAR_LICENSE_VALIDATE_ENDPOINT
- EASYAR_DOWNLOADS_ENDPOINT
- EASYAR_CLOUD_CREDENTIALS_ENDPOINT

### Cấu hình hiện tại

- EASYAR_API_TOKEN: không
- EASYAR_ACCOUNT_STATUS_ENDPOINT: không
- EASYAR_LICENSE_VALIDATE_ENDPOINT: không
- EASYAR_DOWNLOADS_ENDPOINT: không
- EASYAR_CLOUD_CREDENTIALS_ENDPOINT: không

## Xác thực

Sơ đồ: Mã thông báo mang
Tiêu đề: `Authorization: Bearer ${EASYAR_API_TOKEN}`
Nguồn mã thông báo: Mã thông báo tài khoản người dùng đã đăng ký EasyAR chính thức, được lưu trữ trong môi trường khách MCP hoặc bộ lưu trữ bí mật.

- Không dán mã thông báo vào cuộc trò chuyện.
- Không gửi mã thông báo tới GitHub.
- Không trả lại mã thông báo trong API phản hồi, nhật ký, báo cáo sự cố hoặc đầu ra công cụ MCP.
- Ưu tiên mã thông báo tồn tại trong thời gian ngắn hoặc có thể thu hồi cho khách hàng sản xuất.

## Ranh giới ủy quyền

Khóa cục bộ MVP: Quá trình thực thi mẫu Unity có thể chạy sau khi người dùng cài đặt Plugin EasyAR Sense Unity chính thức và điền tài liệu khóa giấy phép cục bộ/API vào dự án Unity. Không cần đăng nhập trang web trong thời gian chạy Unity.

Dự phòng được chấp nhận: Khi không có điểm cuối API chính thức, hãy sử dụng tính năng chuyển giao chỉ dành cho trình duyệt cùng với xác thực khóa cục bộ. MCP ghi lại giai đoạn tài khoản và bằng chứng không bí mật, trong khi người dùng lấy tài liệu plugin/key từ trang web EasyAR chính thức.

Tại sao cần có hỗ trợ chính thức để tự động hóa sản xuất:
- Trạng thái tài khoản chỉ có thẩm quyền trong hệ thống tài khoản EasyAR; MCP không thể chứng minh việc đăng ký, trạng thái tài khoản, tư cách thành viên tổ chức hoặc quyền sản phẩm từ các tệp cục bộ.
- Việc xác thực giấy phép phải được kiểm tra dựa trên hồ sơ giấy phép phía máy chủ EasyAR để chứng minh khả năng tương thích của sản phẩm, nền tảng, thời hạn và gói Unity/package.
- Khám phá tải xuống phải tôn trọng các cổng đăng nhập, quyền lợi, doanh nghiệp và giới hạn tỷ lệ EasyAR; MCP không được tạo ra các URL tải xuống riêng tư hoặc sử dụng lại các phiên trình duyệt.
- Việc phát hiện thông tin xác thực Cloud Encrypt thuộc về dự án đám mây EasyAR của người dùng; MCP chỉ được nhận siêu dữ liệu và cờ hiện diện trừ khi người dùng lưu trữ khóa thời gian chạy cục bộ.

Không được chấp nhận:
- Quét các trang web EasyAR hoặc cookie trình duyệt làm cơ chế ủy quyền sản xuất.
- Yêu cầu người dùng dán mật khẩu trang web EasyAR, mã xác minh, mã thông báo tài khoản, khóa cấp phép, API KEY/API Bí mật, appKey hoặc appSecret tham gia trò chuyện.
- Coi sự hiện diện của cấu hình cục bộ là bằng chứng về quyền tài khoản hoặc ủy quyền tải xuống riêng tư.

## Điểm cuối

### trạng thái tài khoản

Env: EASYAR_ACCOUNT_STATUS_ENDPOINT
Được định cấu hình ngay bây giờ: no
Phương thức: GET
Đường dẫn: /mcp/account/status
Dự kiến URL: https://www.easyar.cn/mcp/account/status
Thời gian chờ ms: 10000
Ủy quyền: Mã thông báo mang bắt buộc từ EASYAR_API_TOKEN

Xác nhận mã thông báo mang thuộc về người dùng EasyAR đã đăng ký và trả về siêu dữ liệu quyền của tài khoản không bí mật.

Trường yêu cầu:
- Không có trường nội dung yêu cầu.

Các trường phản hồi bắt buộc:
- ok
- account.id
- account.registered
- account.status
- entitlements

Các trường phản hồi tùy chọn:
- account.emailMasked
- account.displayName
- plan
- tổ chức
- expiresAt

Được sử dụng bởi MCP công cụ:
- easyar_check_account
- easyar_check_official_access
- easyar_onboarding_report

Xử lý bí mật: Chỉ chấp nhận các trường yêu cầu bí mật khi cần để xác thực, không bao giờ lặp lại chúng và chỉ trả lại siêu dữ liệu đã được loại bỏ.

### xác thực giấy phép

Env: EASYAR_LICENSE_VALIDATE_ENDPOINT
Được định cấu hình ngay bây giờ: không có
Phương thức: POST
Đường dẫn: /mcp/license/validate
Dự kiến URL: https://www.easyar.cn/mcp/license/validate
Thời gian chờ ms: 10000
Ủy quyền: Mã thông báo mang bắt buộc từ EASYAR_API_TOKEN

Xác thực rằng khóa cấp phép EasyAR Sense cục bộ có thể sử dụng được cho nền tảng và mã nhận dạng gói Unity được yêu cầu.

Trường yêu cầu:
- licenseKey
- bundleIdentifier
- platform

Phản hồi bắt buộc các trường:
- ok
- license.valid
- license.product
- license.bundleIdentifierMatches
- license.platformAllowed

Các trường phản hồi tùy chọn:
- license.expiresAt
- license.edition
- license.features
- license.message

Được sử dụng bởi các công cụ MCP:
- easyar_validate_license
- easyar_check_official_access
- easyar_write_focused_preflight

Xử lý bí mật: Chỉ chấp nhận các trường yêu cầu bí mật khi cần để xác thực, không bao giờ lặp lại chúng và chỉ trả lại siêu dữ liệu đã được loại bỏ.

### downloads-discovery

Env: EASYAR_DOWNLOADS_ENDPOINT
Được định cấu hình ngay bây giờ: no
Phương thức: POST
Đường dẫn: /mcp/downloads
Dự kiến URL: https://www.easyar.cn/mcp/downloads
Thời gian chờ ms: 10000
Ủy quyền: Mã thông báo mang bắt buộc từ EASYAR_API_TOKEN

Trả lại EasyAR SDK được ủy quyền bởi tài khoản, Plugin Unity và siêu dữ liệu gói mẫu mà không bỏ qua quyền tải xuống chính thức.

Các trường yêu cầu:
- sampleId
- packageKind
- unityVersion

Các trường phản hồi bắt buộc:
- ok
- packages

Các trường phản hồi tùy chọn:
- packages[].name
- packages[].version
- packages[].url
- packages[].sha256
- packages[].releaseNotesUrl

Được sử dụng bởi các công cụ MCP:
- easyar_discover_downloads
- easyar_check_official_access
- easyar_generate_sample_import_guide

Xử lý bí mật: Chỉ chấp nhận các trường yêu cầu bí mật khi cần để xác thực, không bao giờ lặp lại chúng và chỉ trả lại siêu dữ liệu đã được xử lý lại.

### cloud-credentials-discovery

Env: EASYAR_CLOUD_CREDENTIALS_ENDPOINT
Được định cấu hình ngay bây giờ: no
Phương thức: POST
Đường dẫn: /mcp/cloud-recognition/credentials
Dự kiến URL: https://www.easyar.cn/mcp/cloud-recognition/credentials
Hết thời gian chờ ms: 10000
Ủy quyền: Mã thông báo mang bắt buộc từ EASYAR_API_TOKEN

Trả lại cờ hiện diện và siêu dữ liệu của ứng dụng Cloud Nhận dạng cho người dùng đã đăng ký mà không trả về API thô KEY/API Giá trị bí mật.

Trường yêu cầu:
- sampleId
- bundleIdentifier
- platform

Các trường phản hồi bắt buộc:
- ok
- cloudRecognition.appId
- cloudRecognition.apiKeyPresent

Các trường phản hồi tùy chọn:
- cloudRecognition.apiSecretPresent
- cloudRecognition.appKeyPresent
- cloudRecognition.appSecretPresent
- cloudRecognition.serviceRegion
- cloudRecognition.targetLibraryCount
- cloudRecognition.dashboardUrl

Được sử dụng bởi các công cụ MCP:
- easyar_discover_cloud_credentials
- easyar_check_official_access
- easyar_account_materials

Xử lý bí mật: Chỉ chấp nhận các trường yêu cầu bí mật khi cần để xác thực, không bao giờ lặp lại chúng và chỉ trả lại siêu dữ liệu đã được xử lý lại.

## Ví dụ

### license-validation

```json
{
  "endpoint": "license-validation",
  "request": {
    "method": "POST",
    "url": "https://www.easyar.cn/mcp/license/validate",
    "body": {
      "licenseKey": "<local EasyAR license key>",
      "bundleIdentifier": "com.example.easyar.sample",
      "platform": "android"
    }
  },
  "response": {
    "ok": true,
    "license": {
      "valid": true,
      "product": "EasyAR Sense Unity Plugin",
      "bundleIdentifierMatches": true,
      "platformAllowed": true,
      "features": [
        "image-tracking",
        "cloud-recognition"
      ]
    }
  }
}
```

### cloud-credentials-discovery

```json
{
  "endpoint": "cloud-credentials-discovery",
  "request": {
    "method": "POST",
    "url": "https://www.easyar.cn/mcp/cloud-recognition/credentials",
    "body": {
      "sampleId": "cloud-recognition",
      "bundleIdentifier": "com.example.easyar.sample",
      "platform": "android"
    }
  },
  "response": {
    "ok": true,
    "cloudRecognition": {
      "appId": "<app id or masked app id>",
      "apiKeyPresent": true,
      "apiSecretPresent": true,
      "appKeyPresent": true,
      "appSecretPresent": true,
      "serviceRegion": "configured"
    }
  }
}
```

## Chính sách phản hồi

- Phản hồi có thể bao gồm siêu dữ liệu tài khoản, siêu dữ liệu gói và cờ hiện diện.
- Phản hồi không được bao gồm khóa cấp phép thô, mã thông báo API, khóa API, bí mật API, appKey, appSecret, mật khẩu, mã xác minh, khóa ký hoặc hồ sơ cung cấp.
- Nếu chương trình phụ trợ phải báo cáo sự tồn tại của tài liệu nhạy cảm, hãy trả về cờ hiện diện boolean và URL trang tổng quan thay vì giá trị.
- Sử dụng mã trạng thái không phải 2xx cùng với phần thân lỗi JSON được xử lý lại đối với các lỗi trái phép, hết hạn, không được cấp phép và không có quyền.

## Danh sách kiểm tra sản xuất

- Định cấu hình tất cả các biến env điểm cuối thành HTTPS API EasyAR chính thức.
- Xác thực chính sách CORS/network cho máy khách MCP cục bộ nếu điểm cuối được ủy quyền.
- Đảm bảo mọi điểm cuối đều ủy quyền theo mã thông báo tài khoản và quyền lợi.
- Chạy easyar_check_official_access để theo dõi hình ảnh và nhận dạng trên đám mây.
- Chạy easyar_write_deployment_readiness và giữ trình chặn ở mức 0 trước khi phát hành.

## Bảo mật

Hợp đồng này chỉ là hướng dẫn về lược đồ và triển khai. Nó cố ý không chứa mã thông báo tài khoản EasyAR, khóa cấp phép, khóa API, API bí mật, appKey, appSecret hoặc mật khẩu người dùng.
