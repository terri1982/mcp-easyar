# Bàn giao API chính thức của mcp-easyar

Được tạo vào lúc: 2026-06-10T15:38:16.374Z
Mục tiêu triển khai: không xác định
Máy chủ: mcp-easyar 0.1.0
Kho lưu trữ: https://github.com/terri1982/mcp-easyar

## Mục đích

Việc chuyển giao này dành cho các nhóm vận hành và phụ trợ EasyAR kết nối mcp-easyar với tài khoản người dùng đã đăng ký được ủy quyền, giấy phép, nội dung tải xuống và dịch vụ Nhận dạng đám mây.

Hợp đồng có thể đọc được bằng máy để nhập cổng, sơ khai máy chủ và tạo ứng dụng khách: `docs/openapi/easyar-mcp-account-api.openapi.json`

## Môi trường

Cơ sở URL: https://www.easyar.cn
Mã thông báo env: EASYAR_API_TOKEN
Mã thông báo được định cấu hình ngay bây giờ: không

Các biến bắt buộc:
- EASYAR_API_BASE_URL
- EASYAR_API_TOKEN
- EASYAR_ACCOUNT_STATUS_ENDPOINT
- EASYAR_LICENSE_VALIDATE_ENDPOINT
- EASYAR_DOWNLOADS_ENDPOINT
- EASYAR_CLOUD_CREDENTIALS_ENDPOINT

Cấu hình hiện tại:
- EASYAR_API_TOKEN: không
- EASYAR_ACCOUNT_STATUS_ENDPOINT: không
- EASYAR_LICENSE_VALIDATE_ENDPOINT: no
- EASYAR_DOWNLOADS_ENDPOINT: no
- EASYAR_CLOUD_CREDENTIALS_ENDPOINT: no

## Ranh giới ủy quyền

Khóa cục bộ MVP: Việc thực thi mẫu Unity có thể chạy sau khi người dùng cài đặt Plugin EasyAR Sense Unity chính thức và điền vào giấy phép cục bộ/API tài liệu chính trong dự án Unity. Không cần đăng nhập trang web trong thời gian chạy Unity.

Dự phòng được chấp nhận: Khi không có điểm cuối API chính thức, hãy sử dụng tính năng chuyển giao chỉ dành cho trình duyệt cộng với xác thực khóa cục bộ. MCP ghi lại giai đoạn tài khoản và bằng chứng không bí mật, trong khi người dùng lấy tài liệu plugin/key từ trang web EasyAR chính thức.

Tại sao cần có hỗ trợ chính thức để tự động hóa sản xuất:
- Trạng thái tài khoản chỉ có thẩm quyền trong hệ thống tài khoản EasyAR; MCP không thể chứng minh đăng ký, trạng thái tài khoản, tư cách thành viên tổ chức hoặc quyền sản phẩm từ các tệp cục bộ.
- Việc xác thực giấy phép phải được kiểm tra dựa trên hồ sơ giấy phép phía máy chủ EasyAR để chứng minh sản phẩm, nền tảng, thời hạn sử dụng và gói Unity/package khả năng tương thích với mã nhận dạng.
- Việc phát hiện tải xuống phải tôn trọng các cổng đăng nhập, quyền, doanh nghiệp và giới hạn tỷ lệ EasyAR; MCP không được tạo ra các URL tải xuống riêng tư hoặc sử dụng lại các phiên trình duyệt.
- Việc phát hiện thông tin xác thực Cloud Encrypt thuộc về dự án đám mây EasyAR của người dùng; MCP chỉ được nhận siêu dữ liệu và cờ hiện diện trừ khi người dùng lưu trữ khóa thời gian chạy cục bộ.

Không được chấp nhận:
- Quét các trang trang web EasyAR hoặc cookie trình duyệt làm cơ chế ủy quyền sản xuất.
- Yêu cầu người dùng dán mật khẩu trang web EasyAR, mã xác minh, mã thông báo tài khoản, khóa cấp phép, API KEY/API Bí mật, appKey hoặc appSecret tham gia trò chuyện.
- Coi sự hiện diện của cấu hình cục bộ là bằng chứng về quyền tài khoản hoặc ủy quyền tải xuống riêng tư.

## Ánh xạ điểm cuối

### trạng thái tài khoản

Env: EASYAR_ACCOUNT_STATUS_ENDPOINT
Phương thức: GET
Dự kiến URL: https://www.easyar.cn/mcp/account/status

Xác nhận mã thông báo mang thuộc về người dùng EasyAR đã đăng ký và trả về siêu dữ liệu có quyền truy cập tài khoản không bí mật.

Việc cần làm của chủ sở hữu phụ trợ: Liên kết xác thực mã thông báo với hệ thống tài khoản người dùng đã đăng ký EasyAR chính thức và trả về siêu dữ liệu tài khoản không bí mật/entitlement.

Trường yêu cầu:
- Không có trường nội dung yêu cầu.

Các trường phản hồi bắt buộc:
- ok
- account.id
- account.registered
- account.status
- entitlements

Được sử dụng bởi MCP công cụ:
- easyar_check_account
- easyar_check_official_access
- easyar_onboarding_report

Chấp nhận:
- Mã thông báo của người dùng đã đăng ký hợp lệ trả về ok=true và account.registered=true.
- Mã thông báo chưa đăng ký hoặc đã hết hạn trả về 401/403 với nội dung lỗi được xử lý lại.

Mẫu lệnh canary:
```bash
curl -fsS -H "Authorization: Bearer ${EASYAR_API_TOKEN}" "${EASYAR_ACCOUNT_STATUS_ENDPOINT}"
```

### license-validation

Env: EASYAR_LICENSE_VALIDATE_ENDPOINT
Phương thức: POST
Dự kiến URL: https://www.easyar.cn/mcp/license/validate

Xác thực rằng khóa cấp phép EasyAR Sense cục bộ có thể sử dụng được cho nền tảng và mã nhận dạng gói Unity được yêu cầu.

Việc cần làm của chủ sở hữu phụ trợ: Xác thực giấy phép EasyAR Sense cục bộ được cung cấp dựa trên quyền tài khoản, sản phẩm, nền tảng và mã nhận dạng gói Unity/package.

Các trường yêu cầu:
- licenseKey
- bundleIdentifier
- platform

Phản hồi bắt buộc các trường:
- ok
- license.valid
- license.product
- license.bundleIdentifierMatches
- license.platformAllowed

Được sử dụng bởi các công cụ MCP:
- easyar_validate_license
- easyar_check_official_access
- easyar_write_focused_preflight

Chấp nhận:
- Giấy phép hợp lệ/bundle/platform trả về license.valid=true và bundleIdentifierMatches=true.
- Giấy phép không hợp lệ, id gói sai hoặc nền tảng không được phép trả về ok=false hoặc 403 mà không lặp lại khóa cấp phép.

Mẫu lệnh Canary:
```bash
curl -fsS -X POST -H "Authorization: Bearer ${EASYAR_API_TOKEN}" -H "Content-Type: application/json" -d '{"licenseKey":"${EASYAR_TEST_LICENSE_KEY}","bundleIdentifier":"com.easyar.testsample","platform":"android"}' "${EASYAR_LICENSE_VALIDATE_ENDPOINT}"
```

### downloads-discovery

Env: EASYAR_DOWNLOADS_ENDPOINT
Phương thức: POST
Dự kiến URL: https://www.easyar.cn/mcp/downloads

Trả lại EasyAR SDK, Plugin Unity và siêu dữ liệu gói mẫu mà không bỏ qua quá trình tải xuống chính thức quyền.

Việc cần làm của chủ sở hữu phụ trợ: Chỉ trả lại siêu dữ liệu gói SDK/plugin/sample được ủy quyền cho tài khoản đã đăng ký mà không cho phép tải xuống trái phép.

Các trường yêu cầu:
- sampleId
- packageKind
- unityVersion

Các trường phản hồi bắt buộc:
- ok
- gói

Được sử dụng bởi MCP công cụ:
- easyar_discover_downloads
- easyar_check_official_access
- easyar_generate_sample_import_guide

Chấp nhận:
- Tài khoản được ủy quyền trả về siêu dữ liệu EasyAR Unity Plugin/sample cần thiết cho quy trình làm việc tập trung.
- Yêu cầu gói trái phép trả về 403 và không tải xuống riêng tư URL.

Mẫu lệnh Canary:
```bash
curl -fsS -X POST -H "Authorization: Bearer ${EASYAR_API_TOKEN}" -H "Content-Type: application/json" -d '{"sampleId":"image-tracking","packageKind":"unity-samples","unityVersion":"6000.4.7f1"}' "${EASYAR_DOWNLOADS_ENDPOINT}"
```

### cloud-credentials-discovery

Env: EASYAR_CLOUD_CREDENTIALS_ENDPOINT
Phương thức: POST
Dự kiến URL: https://www.easyar.cn/mcp/cloud-recognition/credentials

Trả lại siêu dữ liệu ứng dụng Cloud Nhận dạng và cờ hiện diện cho người dùng đã đăng ký mà không trả về API thô KEY/API Giá trị bí mật.

Việc cần làm của chủ sở hữu phụ trợ: Trả về siêu dữ liệu của ứng dụng Cloud Warning và API KEY cờ hiện diện mà không trả về API KEY/API Giá trị bí mật.

Các trường yêu cầu:
- sampleId
- bundleIdentifier
- platform

Các trường phản hồi bắt buộc:
- ok
- cloudRecognition.appId
- cloudRecognition.apiKeyPresent

Được sử dụng bởi MCP công cụ:
- easyar_discover_cloud_credentials
- easyar_check_official_access
- easyar_account_materials

Chấp nhận:
- Ứng dụng Nhận dạng đám mây đã định cấu hình trả về appId cộng với serverAddress và apiKeyPresent/apiSecretPresent cờ.
- Phản hồi không bao giờ bao gồm các giá trị API KEY/API Bí mật, appKey hoặc appSecret thô.

Mẫu lệnh canary:
```bash
curl -fsS -X POST -H "Authorization: Bearer ${EASYAR_API_TOKEN}" -H "Content-Type: application/json" -d '{"sampleId":"cloud-recognition","bundleIdentifier":"com.easyar.testsample","platform":"android"}' "${EASYAR_CLOUD_CREDENTIALS_ENDPOINT}"
```

## Triển khai

1. Xác nhận hệ thống tài khoản EasyAR có thể phát hành hoặc xác thực mã thông báo mang của người dùng đã đăng ký cho MCP khách hàng.
2. Ánh xạ các dịch vụ tài khoản EasyAR hiện có/license/download/cloud tới bốn hợp đồng điểm cuối MCP.
3. Trước tiên, hãy triển khai các điểm cuối tới môi trường dàn dựng hoặc môi trường nội bộ rồi đặt các MCP env phù hợp ở đó.
4. Chạy các lệnh canary bằng tài khoản thử nghiệm đã đăng ký, giấy phép EasyAR Sense hợp lệ và ứng dụng thử nghiệm Nhận dạng đám mây.
5. Chạy easyar_check_official_access để theo dõi hình ảnh và nhận dạng trên đám mây.
6. Chỉ sau khi vượt qua giai đoạn thử nghiệm, hãy định cấu hình các lọ env sản xuất cho quá trình triển khai MCP đã xuất bản.

Kho lưu trữ canary:

```bash
EASYAR_CANARY_PROJECT_PATH=/path/to/UnityProject EASYAR_CANARY_PLATFORM=android npm run official-api:canary
```

Canary khởi động máy chủ MCP cục bộ, sử dụng mã thông báo mang được định cấu hình và các biến env điểm cuối, kiểm tra trạng thái tài khoản, xác minh Theo dõi hình ảnh, Nhận dạng đám mây và quyền truy cập chính thức của Mega, sau đó chạy xác thực sản xuất. Nó chỉ in trạng thái pass/blocker và không được in mã thông báo, khóa cấp phép, API KEY/API Bí mật, appKey hoặc các giá trị appSecret.

Sơ khai hợp đồng cục bộ:

```bash
npm run official-api:stub
```

Sơ khai phục vụ bốn tuyến điểm cuối chính thức trên `127.0.0.1:8787` theo mặc định và trả về siêu dữ liệu lịch thi đấu không bí mật tương thích với hợp đồng MCP. Nó rất hữu ích để xác thực định tuyến cổng, nối dây biến môi trường và hành vi canary trước khi kết nối các dịch vụ phụ trợ EasyAR thực sự. Đây không phải là dịch vụ tài khoản sản xuất và không được triển khai dưới dạng một dịch vụ.

## Cổng chấp nhận

- Tất cả các biến môi trường điểm cuối bắt buộc được đặt trong môi trường thời gian chạy MCP.
- Mọi điểm cuối đều yêu cầu Ủy quyền: Bearer ${EASYAR_API_TOKEN} và từ chối các mã thông báo bị thiếu, hết hạn hoặc trái phép.
- easyar_check_account trả về configure=true và ok=true cho tài khoản thử nghiệm EasyAR đã đăng ký.
- easyar_validate_license xác thực giấy phép EasyAR Sense cục bộ cho gói Unity/package giá trị nhận dạng mà không lặp lại khóa cấp phép.
- easyar_discover_downloads chỉ trả về siêu dữ liệu gói do tài khoản ủy quyền và không bao giờ bỏ qua các cổng tải xuống EasyAR.
- easyar_discover_cloud_credentials trả về appId và cờ hiện diện, không bao giờ là các giá trị API KEY/API Bí mật, appKey hoặc appSecret.
- easyar_check_official_access để theo dõi hình ảnh và nhận dạng đám mây bằng cùng một môi trường triển khai.
- easyar_write_deployment_readiness không có trình chặn điểm cuối chính thức.
- Khói cố định vẫn có màu xanh, sau đó giai đoạn thực/prod hoạt động canary được ghi lại trong OFFICIAL_ACCESS.md.

## Chính sách lỗi

- Trả về 401/403 đối với trường hợp không hợp lệ, hết hạn, chưa đăng ký, không được cấp phép hoặc các tài khoản bị thiếu quyền.
- Trả về các lỗi JSON đã được xử lý lại với mã lỗi ổn định; không trả lại bí mật thô hoặc dữ liệu tài khoản riêng tư.
- Giới hạn tỷ lệ các lần xác thực không thành công lặp lại theo tài khoản/token và điểm cuối.
- Nếu điểm cuối không khả dụng, MCP phải báo cáo đã định cấu hình=false hoặc ok=false và dừng trước khi tải xuống riêng tư hoặc thiết lập Nhận dạng đám mây.
- Không quay lại thu thập các phiên trang web EasyAR hoặc bỏ qua đăng nhập/download cổng.

## Hiện vật cần tái tạo

- docs/OFFICIAL_API_CONTRACT.md
- docs/OFFICIAL_API_HANDOFF.md
- docs/openapi/easyar-mcp-account-api.openapi.json
- Nội dung/EasyARGenerated/<sampleId>/OFFICIAL_ACCESS.md
- Nội dung/EasyARGenerated/DEPLOYMENT_READINESS.md
- Nội dung/EasyARGenerated/PRODUCTION_VALIDATION.md
- Nội dung/EasyARGenerated/REMAINING_WORK.md

## Hành động tiếp theo

- Chỉ định chủ sở hữu phụ trợ cho trạng thái tài khoản, xác thực giấy phép, tải xuống-khám phá và khám phá thông tin xác thực trên đám mây.
- Điền EASYAR_ACCOUNT_STATUS_ENDPOINT, EASYAR_LICENSE_VALIDATE_ENDPOINT, EASYAR_DOWNLOADS_ENDPOINT và EASYAR_CLOUD_CREDENTIALS_ENDPOINT vào môi trường MCP chạy thử.
- Chạy tập lệnh nút/official-api-fixture-smoke.mjs, chạy npm run tùy ý Official-api:stub để nối dây hợp đồng cục bộ, sau đó chạy npm runofficial-api:canary bằng tài khoản thử nghiệm EasyAR đã đăng ký.
- Chạy easyar_write_official_access_report để theo dõi hình ảnh và nhận dạng đám mây sau khi định cấu hình điểm cuối.

## Bảo mật

Bàn giao này chỉ chứa tên điểm cuối, lược đồ request/response và các mẫu canary không bí mật. Nó không được chứa mật khẩu EasyAR, mã xác minh, mã thông báo tài khoản, khóa cấp phép, khóa API, API bí mật, appKey, appSecret, khóa ký hoặc dữ liệu người dùng riêng tư.
