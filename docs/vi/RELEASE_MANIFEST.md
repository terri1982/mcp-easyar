# Bản kê khai phát hành mcp-easyar

Được tạo vào lúc: 2026-06-11T04:35:00.000Z
Gói: mcp-easyar 0.1.0
Bin: easyar-mcp
Node: >=20
Kho lưu trữ: https://github.com/terri1982/mcp-easyar.git
Sẵn sàng cho tài liệu cài đặt: có

## Mô hình sẵn sàng

- Khóa cục bộ MVP: sẵn sàng cho tính năng Theo dõi hình ảnh tập trung, Nhận dạng đám mây và hỗ trợ Mega khi gói/install tài liệu vượt qua, lệnh xác minh vượt qua và bằng chứng an toàn về phạm vi tập trung của Android được cung cấp thông qua `docs/release-evidence/focused-scope.android.json`. Bản phát hành trước hai mẫu đã xuất bản có bằng chứng Theo dõi hình ảnh và Nhận dạng đám mây; sơ đồ công việc hiện tại bao gồm bằng chứng cài đặt thiết bị thực Mega Android an toàn/localization, bằng chứng khởi động APK dự án mới/localization, EasyAR Sense `4003.0.0` bằng chứng khởi động mẫu Android, `4003.0.0` / Mega `2.13.0` Android vượt qua ARMall `涂意工位测试专用`, PICO xác thực tai nghe 4 Ultra Enterprise tóm tắt và một camera Theo dõi chuyển động Android sạch sẽ/Panda APK tóm tắt xác thực.
- Chính thức sản xuất API: chưa sẵn sàng cho đến khi tài khoản EasyAR, giấy phép, nội dung tải xuống và các biến điểm cuối Nhận dạng đám mây được kết nối với các dịch vụ EasyAR được ủy quyền và vượt qua kiểm tra quyền truy cập chính thức tập trung.
- Lưu ý thời gian chạy Unity: sau khi cài đặt Plugin EasyAR Sense Unity chính thức, quá trình thực thi mẫu phía Unity sử dụng cục bộ license/API cấu hình khóa và không yêu cầu đăng nhập trang web trong thời gian chạy.

## Phạm vi tập trung

Mẫu tập trung: theo dõi hình ảnh, nhận dạng đám mây, mega
Mẫu bị trì hoãn: hello-ar, theo dõi bề mặt

## Lệnh cài đặt

- `npm install`
- `npm run build`
- `npm start`

## Cài đặt hồ sơ

### Bản sao Git cục bộ

Chế độ điểm truy cập: `local-dist`
Tính khả dụng: kiểm tra phát triển

- `npm install`
- `npm run build`
- Cấu hình máy khách: `easyar_generate_client_config client=claude-desktop entrypointMode=local-dist serverPath=/absolute/path/to/mcp-easyar/dist/index.js`

### Gói phát hành GitHub

Chế độ điểm truy cập: `package-bin`
Tính khả dụng: đường dẫn phát hành trước công khai hiện tại

- `npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.41/mcp-easyar-0.1.0.tgz`
- `easyar-mcp-check`
- Cấu hình máy khách: `easyar_generate_client_config client=claude-desktop entrypointMode=package-bin`

### Gói npm toàn cầu sau npm xuất bản

Chế độ điểm vào: `package-bin`
Tính khả dụng: post-npm-publish chỉ

- `npm install -g mcp-easyar`
- Cấu hình máy khách: `easyar_generate_client_config client=claude-desktop entrypointMode=package-bin`

### Gói npx sau npm xuất bản

Chế độ điểm truy cập: `npx`
Tính khả dụng: chỉ sau npm-publish

- `npx -y mcp-easyar`
- Cấu hình máy khách: `easyar_generate_client_config client=claude-desktop entrypointMode=npx`

## MCP Điểm truy cập

- Điểm truy cập phân phối được xây dựng: `node /Users/tuyi/Documents/EasyAR 官方 MCP 服务/dist/index.js`
- Thùng gói: `easyar-mcp`
- Kiểm tra cài đặt: `easyar-mcp-check`
- gói npx sau khi npm xuất bản: `npx -y mcp-easyar`

## Lệnh xác minh

- `npm run typecheck`
- `npm test`
- `npm run bin:smoke`
- `npm run install:check`
- `npm run package:smoke`
- `npm run pack:check`
- `npm run security:check`
- `npm run release:check`
- `EASYAR_RELEASE_EVIDENCE_PATH=docs/release-evidence/focused-scope.android.json EASYAR_RELEASE_PLATFORM=android npm run release:check`
- `EASYAR_RELEASE_REQUIRE_LOCAL_KEY_MVP=1 EASYAR_RELEASE_EVIDENCE_PATH=docs/release-evidence/focused-scope.android.json EASYAR_RELEASE_PLATFORM=android npm run release:check`
- `EASYAR_RELEASE_REQUIRE_PRODUCTION_READY=1 npm run release:check`

## Xác minh nội dung đã xuất bản

- `npm run github-release:smoke`

## Quy trình phát hành

- Khóa cục bộ chỉ dành cho GitHub MVP: chạy quy trình làm việc `GitHub Release` thủ công với `gate=local-key-mvp`; nó xác thực bằng chứng tập trung và tải tarball tương thích với npm lên Bản phát hành GitHub.
- Xuất bản npm sản xuất: chỉ chạy quy trình làm việc `Release` thủ công sau khi tài khoản EasyAR, giấy phép, nội dung tải xuống và các biến điểm cuối Nhận dạng đám mây chính thức được định cấu hình; nó thực thi cổng sản xuất trước `npm publish --provenance`.

## Cuộc gọi MCP đầu tiên

- `easyar_server_status`
- `easyar_release_manifest`
- `easyar_authorization_strategy`
- `easyar_account_onboarding`
- `easyar_account_materials`
- `easyar_check_client_setup`
- `easyar_auth_status`
- `easyar_check_official_access`
- `easyar_next_workflow_step`
- `easyar_write_production_validation`
- `easyar_write_issue_report`

## Công cụ thiết lập máy khách

- `easyar_generate_client_config`
- `easyar_check_client_setup`
- `easyar_write_client_setup`

## Môi trường khóa cục bộ bắt buộc

- `EASYAR_UNITY_PATH`
- `EASYAR_RELEASE_PROJECT_PATH`
- `EASYAR_RELEASE_EVIDENCE_PATH`
- `EASYAR_RELEASE_PLATFORM`

Khóa cục bộ MVP Người dùng không cần cung cấp `EASYAR_API_TOKEN`. Họ hoàn tất đăng ký trang web EasyAR, đăng nhập, tải xuống, tạo giấy phép, tạo khóa CRS và tra cứu tài liệu Mega trong trình duyệt của riêng họ, sau đó điền vào cấu hình dự án Unity cục bộ.

## Chính thức nâng cao API Môi trường

Các biến này chỉ dành cho tích hợp API sản xuất do EasyAR sở hữu trong tương lai và không bắt buộc đối với người dùng khóa cục bộ thông thường:

- `EASYAR_API_BASE_URL`
- `EASYAR_API_TOKEN`
- `EASYAR_ACCOUNT_STATUS_ENDPOINT`
- `EASYAR_LICENSE_VALIDATE_ENDPOINT`
- `EASYAR_DOWNLOADS_ENDPOINT`
- `EASYAR_CLOUD_CREDENTIALS_ENDPOINT`

## Môi trường xác thực

- `EASYAR_RELEASE_REQUIRE_LOCAL_KEY_MVP`
- `EASYAR_RELEASE_REQUIRE_PRODUCTION_READY`
- `EASYAR_UNITY_VERSION`
- `EASYAR_BUNDLE_IDENTIFIER`
- `EASYAR_LICENSE_KEY`
- `EASYAR_CANARY_PROJECT_PATH`
- `EASYAR_CANARY_PLATFORM`
- `EASYAR_STUB_HOST`
- `EASYAR_STUB_PORT`
- `EASYAR_STUB_TOKEN`

## Tệp cần thiết

- OK README.md
- OK README.en.md
- OK README.ja.md
- OK README.vi.md
- OK README.zh-CN.md
- OK .env.example
- OK CHANGELOG.md
- OK LICENSE
- OK SECURITY.md
- OK tài liệu/quickstart.md
- OK tài liệu/OFFICIAL_API_CONTRACT.md
- OK tài liệu/OFFICIAL_API_HANDOFF.md
- OK tài liệu/openapi/easyar-mcp-account-api.openapi.json
- OK docs/release-evidence/focused-scope.android.json
- Được rồi tài liệu/release-evidence/motion-tracking-camera-panda-android.md
- OK tài liệu/release-evidence/easyar-sense-4003-android-samples.md
- OK tài liệu/release-evidence/mega-tuyi-workstation-android.md
- OK tài liệu/release-evidence/mega-pico4-ultra-enterprise-summary.md
- OK tài liệu/zh-CN/release-evidence/motion-tracking-camera-panda-android.md
- OK tài liệu/zh-CN/release-evidence/mega-tuyi-workstation-android.md
- OK tài liệu/zh-CN/release-evidence/mega-pico4-ultra-enterprise-summary.md
- OK tài liệu/release-notes/local-key-mvp.md
- OK tài liệu/CLIENT_ACCEPTANCE.md
- OK tài liệu/FRESH_PROJECT_ACCEPTANCE.md
- OK tài liệu/client-setup.md
- OK tài liệu/install-from-github-release.md
- OK tài liệu/ROADMAP.md
- OK docs/STATUS.md
- OK docs/RELEASE_MANIFEST.md
- OK docs/troubleshooting.md
- OK docs/zh-CN/README.md
- OK docs/ja/README.md và đầy đủ 24 tài liệu nguồn đã bản địa hóa
- OK docs/vi/README.md và đầy đủ 24 tài liệu nguồn đã bản địa hóa
- OK nội dung/easyar-icon.png
- OK dist/index.js
- OK dist/easyar-api.js
- OK .github/ISSUE_TEMPLATE/focused-sample-run.yml
- OK .github/workflows/ci.yml
- OK .github/workflows/github-release.yml
- OK .github/workflows/release.yml

## Tệp gói

- dist
- docs/OFFICIAL_API_CONTRACT.md
- docs/OFFICIAL_API_HANDOFF.md
- docs/openapi/easyar-mcp-account-api.openapi.json
- docs/release-evidence
- docs/release-notes
- docs/CLIENT_ACCEPTANCE.md
- docs/FRESH_PROJECT_ACCEPTANCE.md
- docs/tencent-cloud-mcp-submission.md
- docs/client-setup.md
- docs/install-from-github-release.md
- docs/ROADMAP.md
- docs/STATUS.md
- docs/quickstart.md
- docs/RELEASE_MANIFEST.md
- docs/troubleshooting.md
- docs/zh-CN/README.md
- docs/zh-CN tài liệu cốt lõi và phát hành bằng chứng, ngoại trừ tài liệu thiết kế Chương trình WeChat Mini nội bộ từ tarball đóng gói.
- nội dung/easyar-icon.png
- tập lệnh/github-release-install-smoke.mjs
- tập lệnh/official-api-canary.mjs
- tập lệnh/official-api-stub.mjs
- .env.example
- README.md
- README.en.md
- README.ja.md
- README.vi.md
- README.zh-CN.md
- CHANGELOG.md
- LICENSE
- SECURITY.md

## Tập lệnh

- `bin:smoke`: `npm run build && MCP_EASYAR_SMOKE_COMMAND=./dist/index.js node scripts/smoke-test.mjs`
- `build`: `tsc`
- `dev`: `tsx src/index.ts`
- `github-release:smoke`: `node scripts/github-release-install-smoke.mjs`
- `install:check`: `npm run build && node dist/install-check.js`
- `official-api:canary`: `npm run build && node scripts/official-api-canary.mjs`
- `official-api:stub`: `node scripts/official-api-stub.mjs`
- `official-api:stub-smoke`: `node scripts/official-api-stub-smoke.mjs`
- `package:smoke`: `npm run build && node scripts/package-install-smoke.mjs`
- `pack:check`: `npm run build && npm pack --dry-run`
- `postbuild`: `chmod +x dist/index.js dist/install-check.js`
- `release:check`: `node scripts/release-check.mjs`
- `security:check`: `node scripts/security-check.mjs`
- `start`: `node dist/index.js`
- `test`: `npm run build && node scripts/smoke-test.mjs && node scripts/official-api-fixture-smoke.mjs && node scripts/official-api-stub-smoke.mjs && node scripts/openapi-contract-smoke.mjs`
- `typecheck`: `tsc --noEmit`

## Hành động tiếp theo

- Chạy các lệnh xác minh trước khi xuất bản hoặc gắn thẻ một bản phát hành.
- Sử dụng quy trình phát hành GitHub Actions thủ công để xuất bản npm sau khi định cấu hình môi trường npm-publish được bảo vệ.
- Sử dụng easyar_check_client_setup để xác thực đường dẫn cấu hình máy khách MCP hoặc điểm nhập gói đã chọn trước khi đưa nó cho Codex hoặc Claude. Chỉ sử dụng npx sau khi quá trình xuất bản npm hoàn tất.
- Giữ mã thông báo tài khoản EasyAR chính thức và thông tin đăng nhập Cloud Encrypt ra khỏi các tệp cấu hình đã cam kết.

## Security

Bản kê khai phát hành là an toàn để cam kết. Nó liệt kê các tên biến môi trường bắt buộc và các lệnh giữ chỗ, không phải các giá trị bí mật.
