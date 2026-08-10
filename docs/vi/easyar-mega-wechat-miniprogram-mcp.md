# Thiết kế MCP cho EasyAR Mega WeChat Mini Program

Tài liệu này xác định phạm vi dịch vụ MCP cho người dùng EasyAR Mega đã đăng ký muốn Codex, Claude hoặc ứng dụng khách MCP khác chuẩn bị, kiểm tra, chạy và xác thực các mẫu Chương trình WeChat Mini chính thức.

Dịch vụ này không được thu thập mật khẩu EasyAR, mật khẩu WeChat, mã xác minh, mã thông báo API thô, khóa cấp phép, ứng dụng khóa, bí mật ứng dụng hoặc chứng chỉ riêng tư trong trò chuyện. Các giá trị bí mật phải được đọc từ các biến môi trường cục bộ, tệp cấu hình không bị theo dõi cục bộ, móc khóa hệ điều hành hoặc phiên nền tảng chính thức.

## Mục tiêu

- Hướng dẫn người dùng EasyAR đã đăng ký thông qua tài khoản Mega chính thức, giấy phép, SDK và quyền truy cập mẫu.
- Tạo hoặc sửa chữa không gian làm việc mẫu Chương trình WeChat Mini cục bộ.
- Xác thực cấu hình cục bộ EasyAR Mega mà không làm lộ bí mật.
- Tạo sổ tay mẫu tập trung và các tạo phẩm chuyển giao cho Codex và Claude.
- Tích hợp với Công cụ dành cho nhà phát triển WeChat CLI khi có sẵn.
- Tạo bằng chứng để biên dịch, xem trước, tải lên và xác thực thiết bị thực.

## Không phải mục tiêu

- Bỏ qua kiểm tra tài khoản EasyAR, cổng tải xuống, kiểm tra giấy phép hoặc xếp hạng limit.
- Tự động hóa biểu mẫu đăng nhập EasyAR hoặc WeChat bằng thông tin xác thực của người dùng.
- Lưu trữ bí mật trong các tạo phẩm Markdown được tạo.
- Xác nhận một mẫu đã hoàn tất mà không cần bằng chứng về thiết bị.

## Giao diện công cụ cốt lõi

## MVP Công cụ

Kho lưu trữ hiện tại triển khai két an toàn đầu tiên Lát chương trình nhỏ khóa cục bộ:

- `easyar_list_miniprogram_samples`
- `easyar_check_wechat_devtools`
- `easyar_inspect_miniprogram_project`
- `easyar_generate_miniprogram_local_config_form`
- `easyar_write_miniprogram_local_config_form`
- `easyar_generate_miniprogram_preflight`
- `easyar_write_miniprogram_preflight`
- `easyar_generate_miniprogram_run_sequence`
- `easyar_write_miniprogram_run_sequence`
- `easyar_import_miniprogram_sample_from_local_package`
- `easyar_analyze_miniprogram_devtools_log`
- `easyar_run_miniprogram_devtools_check`
- `easyar_generate_miniprogram_device_validation_checklist`
- `easyar_write_miniprogram_device_validation_checklist`
- `easyar_generate_miniprogram_run_result_form`
- `easyar_write_miniprogram_run_result_form`
- `easyar_write_miniprogram_run_result`
- `easyar_generate_miniprogram_completion_report`
- `easyar_write_miniprogram_completion_report`
- `easyar_generate_miniprogram_scope_status`
- `easyar_write_miniprogram_scope_status`

Id mẫu tập trung được hỗ trợ:

- `wechat-mega`
- `wechat-crs`

Các công cụ này kiểm tra các tệp cục bộ, nhập các gói cục bộ chính thức do người dùng tải xuống, chạy kiểm tra khói DevTools cục bộ khi CLI có sẵn, viết biểu mẫu xác thực thiết bị thực và tạo báo cáo hoàn thành từ bằng chứng địa phương đã được biên tập lại. Hỗ trợ chạy thử tải lên và thu thập bằng chứng Chương trình nhỏ trên thiết bị thực vẫn hoạt động trong tương lai cho đến khi có gói mẫu cục bộ chính thức, Công cụ dành cho nhà phát triển WeChat đã đăng nhập và các dự án thử nghiệm có sẵn.

### Máy chủ và danh mục

- `easyar_mega_server_status`
- Mục đích: trả lại phiên bản máy chủ, nền tảng được hỗ trợ, điểm cuối chính thức được định cấu hình, tính khả dụng của công cụ cục bộ và các cuộc gọi đầu tiên được đề xuất.
- Đầu vào: không có.
- Đầu ra: tóm tắt khả năng, trạng thái xác thực, trạng thái nền tảng, các cuộc gọi tiếp theo.

- `easyar_mega_official_info`
- Mục đích: trả về các liên kết chính thức, siêu dữ liệu phiên bản SDK/sample được ghi lại và phạm vi hỗ trợ.
- Đầu vào: `locale` tùy chọn.
- Đầu ra: liên kết, tên gói, ghi chú phiên bản, dấu thời gian làm mới.

- `easyar_mega_list_samples`
- Mục đích: liệt kê các danh mục mẫu Chương trình Mini WeChat được hỗ trợ.
- Đầu vào: `scope` tùy chọn.
- Đầu ra: id mẫu, khả năng yêu cầu, trạng thái triển khai.
- Id mẫu tập trung được đề xuất: `image-tracking`, `cloud-recognition`, `geo-spatial`, `mega-scene`.

### Tài khoản và quyền truy cập chính thức

- `easyar_mega_auth_status`
- Mục đích: báo cáo xem các biến env API chính thức tại địa phương có được định cấu hình hay không.
- Đầu vào: không có.
- Đầu ra: chỉ có boolean; bản xem trước mã thông báo phải được xử lý lại.

- `easyar_mega_account_onboarding`
- Mục đích: hướng dẫn đăng ký/login chuyển giao trình duyệt.
- Đầu vào: `accountStage`, `sampleId` tùy chọn.
- Đầu ra: hành động chính thức của trình duyệt, lời nhắc trả về, lệnh gọi MCP tiếp theo.

- `easyar_mega_account_materials`
- Mục đích: liệt kê các tài liệu tài khoản bắt buộc và nơi mỗi giá trị sẽ tồn tại.
- Đầu vào: `sampleId`, `platform=wechat-miniprogram`.
- Đầu ra: nguồn trường, đường dẫn lưu trữ, chính sách chia sẻ.

- `easyar_mega_check_account`
- Mục đích: gọi điểm cuối trạng thái tài khoản chính thức được định cấu hình.
- Đầu vào: không có.
- Đầu ra: đã được định cấu hình/ok/statusCode/summary, các chi tiết đã được làm sạch.

- `easyar_mega_validate_license`
- Mục đích: xác minh rằng giấy phép EasyAR Mega hợp lệ cho id ứng dụng Chương trình nhỏ.
- Đầu vào: `projectPath`, `appId` tùy chọn, `licenseKey` tùy chọn.
- Đầu ra: ok, tóm tắt ràng buộc, chi tiết được biên tập lại, hành động tiếp theo.

- `easyar_mega_discover_downloads`
- Mục đích: khám phá Mega SDK được tài khoản ủy quyền và các gói mẫu chính thức.
- Đầu vào: `sampleId`, `sdkVersion` tùy chọn, `miniprogramBaseLibVersion` tùy chọn.
- Đầu ra: siêu dữ liệu gói và hướng dẫn tải xuống chính thức, không phải tải xuống trực tiếp trái phép.

- `easyar_mega_check_official_access`
- Mục đích: cùng nhau chạy tài khoản, giấy phép, tải xuống và kiểm tra quyền truy cập chính thức theo mẫu cụ thể.
- Đầu vào: `projectPath`, `sampleId`.
- Đầu ra: pass/blocker ma trận.

### Kiểm tra dự án chương trình nhỏ WeChat

- `easyar_mega_inspect_miniprogram_project`
- Mục đích: kiểm tra cấu trúc Mini Program cục bộ.
- Đầu vào: `projectPath`.
- Đầu ra: sự hiện diện của `project.config.json`, `app.json`, `miniprogram/`, trang, thành phần, trạng thái npm, tệp EasyAR, tệp SDK.

- `easyar_mega_check_wechat_devtools`
- Mục đích: tìm và xác thực Công cụ dành cho nhà phát triển WeChat CLI.
- Đầu vào: `cliPath` tùy chọn, `candidateDirs` tùy chọn.
- Đầu ra: đường dẫn được phát hiện, kết quả lệnh phiên bản, gợi ý yêu cầu đăng nhập.

- `easyar_mega_check_sample_readiness`
- Mục đích: báo cáo các trình chặn cục bộ trước khi chạy mẫu đã chọn.
- Đầu vào: `projectPath`, `sampleId`.
 - Đầu ra: kiểm tra id ứng dụng, cấu hình, SDK nhập, trang, quyền, miền/network danh sách cho phép, nội dung, trình quản lý gói.

- `easyar_mega_generate_focused_preflight`
 - Mục đích: tạo một cổng duy nhất trước khi chạy hoặc tải lên.
 - Đầu vào: `projectPath`, `sampleId`, `target=devtools|device` tùy chọn.
 - Đầu ra: tài khoản, cấu hình, dự án, SDK, DevTools và ma trận sẵn sàng mẫu.

- `easyar_mega_write_focused_preflight`
 - Mục đích: ghi `easyar-generated/<sampleId>/PREFLIGHT.md`.
 - Đầu vào: giống như preflight plus `overwrite`.
 - Đầu ra: đường dẫn bằng văn bản và tóm tắt.

### Cấu hình cục bộ và Xử lý bí mật

- `easyar_mega_prepare_miniprogram_project`
 - Mục đích: tạo các thư mục được tạo, mẫu cấu hình, `.gitignore` quy tắc và sổ sách mẫu.
 - Đầu vào: `projectPath`, `sampleId`.
 - Đầu ra: các tệp đã ghi và hành động tiếp theo.

- `easyar_mega_generate_local_config_form`
 - Mục đích: hiển thị biểu mẫu không bí mật có thể điền cho `easyar.mega.local.json`.
 - Đầu vào: `projectPath`, `sampleId`.
 - Đầu ra: danh sách trường, phần giữ chỗ, nguồn chính thức, các lựa chọn thay thế env.

- `easyar_mega_write_local_config_form`
 - Mục đích: viết `easyar-generated/<sampleId>/LOCAL_CONFIG_FORM.md`.
 - Đầu vào: `projectPath`, `sampleId`.
 - Đầu ra: đường dẫn được ghi.

- `easyar_mega_write_local_config_from_env`
 - Mục đích: ghi cấu hình cục bộ từ các bí mật được môi trường hỗ trợ.
 - Đầu vào: `projectPath`, `sampleId`.
 - Đọc env: `EASYAR_MEGA_LICENSE_KEY`, `EASYAR_MEGA_APP_KEY`, `EASYAR_MEGA_APP_SECRET`, `WECHAT_MINIPROGRAM_APP_ID`.
 - Đầu ra: chỉ hiện diện và kết quả xác thực.

- `easyar_mega_validate_local_config`
 - Mục đích: xác thực các trường cấu hình cục bộ bắt buộc mà không trả về bí mật.
 - Đầu vào: `projectPath`, `sampleId`.
 - Đầu ra: thiếu/placeholder trường và hành động tiếp theo.

### Nhập mẫu và tạo mã

- `easyar_mega_generate_import_checklist`
 - Mục đích: tạo SDK/sample danh sách kiểm tra nhập chính thức.
 - Đầu vào: `projectPath`, `sampleId`.
 - Đầu ra: các bước đặt hàng và lệnh gọi xác minh.

- `easyar_mega_import_sample_from_local_package`
 - Mục đích: sao chép mẫu chính thức được tải xuống cục bộ vào dự án.
 - Đầu vào: `projectPath`, `packagePath`, `sampleId`, tùy chọn `dryRun`.
 - Đầu ra: sơ đồ tệp hoặc tệp được sao chép.

- `easyar_mega_generate_run_sequence`
 - Mục đích: tạo quy trình làm việc Codex/Claude theo thứ tự cho mẫu.
 - Đầu vào: `projectPath`, `sampleId`, `target=devtools|device`.
 - Đầu ra: các bước, lệnh, trường bằng chứng.

- `easyar_mega_write_run_sequence`
 - Mục đích: ghi `RUN_SEQUENCE.md`.
 - Đầu vào: `projectPath`, `sampleId`, target.
 - Đầu ra: đường dẫn được viết.

- `easyar_mega_generate_code_plan`
 - Mục đích: plan Chương trình nhỏ JS/TS/WXML/WXSS chỉnh sửa trước khi viết mã.
 - Đầu vào: `projectPath`, `sampleId`, `changeGoal`.
 - Đầu ra: kế hoạch tệp có phạm vi và kế hoạch kiểm tra.

- `easyar_mega_write_miniprogram_file`
 - Mục đích: ghi tệp JS/TS/WXML/WXSS/JSON một cách an toàn dưới gốc Chương trình Mini.
- Đầu vào: `projectPath`, `relativePath`, `content`, tùy chọn `overwrite`.
 - Đầu ra: đường dẫn bằng văn bản và kiểm tra an toàn.

- `easyar_mega_create_sample_page`
 - Mục đích: tạo một trang mẫu tập trung với yêu cầu đăng ký trang.
 - Đầu vào: `projectPath`, `sampleId`, `pagePath`.
 - Đầu ra: các tệp đã tạo và ứng dụng/page thay đổi cấu hình.

- `easyar_mega_review_miniprogram_code`
 - Mục đích: xem xét tĩnh đối với các rủi ro của Chương trình EasyAR Mega và Mini.
 - Đầu vào: `projectPath`, tùy chọn `paths`.
 - Đầu ra: phát hiện bí mật, quyền, vòng đời, SDK init, canvas/camera sử dụng, dọn dẹp không đồng bộ.

### WeChat DevTools Automation

- `easyar_mega_run_miniprogram_compile_check`
 - Mục đích: gọi Công cụ dành cho nhà phát triển WeChat CLI biên dịch/open kiểm tra khi có sẵn.
 - Đầu vào: `projectPath`, `cliPath` tùy chọn, `logPath`.
 - Đầu ra: trạng thái thoát, phân tích nhật ký đã được vệ sinh, hành động tiếp theo.

- `easyar_mega_run_devtools_preview`
 - Mục đích: tạo bản xem trước mã QR thông qua DevTools CLI.
 - Đầu vào: `projectPath`, tùy chọn `cliPath`, tùy chọn `qrOutputPath`.
 - Đầu ra: Đường dẫn QR, tóm tắt nhật ký, trình chặn đã biết.

- `easyar_mega_run_devtools_upload_dry_run`
 - Mục đích: xác minh cấu hình tải lên mà không xuất bản khi được hỗ trợ bởi quy trình làm việc cục bộ.
 - Đầu vào: `projectPath`, phiên bản, mô tả.
 - Đầu ra: kế hoạch lệnh, cổng an toàn, kết quả xác thực cục bộ.

- `easyar_mega_analyze_devtools_log`
 - Mục đích: phân tích nhật ký WeChat DevTools cho các vấn đề chung về dự án, id ứng dụng, miền, gói và EasyAR.
 - Đầu vào: `logPath` hoặc `logText`, tùy chọn `sampleId`.
 - Đầu ra: các sự cố đã phân loại và hành động tiếp theo.

### Xác thực thiết bị và chuyển giao

- `easyar_mega_generate_device_validation_checklist`
 - Mục đích: tạo danh sách kiểm tra xác thực thiết bị thực.
 - Đầu vào: `projectPath`, `sampleId`, `devicePlatform=ios|android`.
 - Đầu ra: bằng chứng dự kiến về camera, mạng, quyền, nhận dạng và theo dõi.

- `easyar_mega_write_device_validation_checklist`
 - Mục đích: ghi `DEVICE_VALIDATION.md`.
 - Đầu vào: đường dẫn dự án, id mẫu, thiết bị platform.
 - Đầu ra: đường dẫn bằng văn bản.

- `easyar_mega_generate_run_result`
 - Mục đích: tóm tắt các lần biên dịch, xem trước, tải lên và thiết bị.
 - Đầu vào: `projectPath`, `sampleId`, `overallStatus`, các trường bằng chứng.
 - Đầu ra: tóm tắt kết quả được xử lý lại.

- `easyar_mega_write_run_result`
 - Mục đích: ghi `RUN_RESULT.md`.
 - Đầu vào: giống như kết quả chạy.
 - Đầu ra: đường dẫn được viết.

- `easyar_mega_generate_completion_report`
 - Mục đích: xác định xem mẫu có thực sự chạy hay không through.
 - Đầu vào: `projectPath`, `sampleId`.
 - Đầu ra: `runThroughComplete`, danh sách chặn, danh sách bằng chứng.

- `easyar_mega_write_completion_report`
 - Mục đích: viết `COMPLETION_REPORT.md`.
 - Đầu vào: đường dẫn dự án và id mẫu.
 - Đầu ra: đường dẫn bằng văn bản.

- `easyar_mega_generate_issue_report`
 - Mục đích: tạo ra vấn đề hỗ trợ được biên tập lại cho các mẫu không thành công.
 - Đầu vào: `projectPath`, `sampleId`, trạng thái, triệu chứng.
 - Đầu ra: Báo cáo giảm giá không có bí mật.

## Giao diện tài nguyên

- `easyar-mega://samples/catalog`
- `easyar-mega://official/info`
- `easyar-mega://official/api-contract`
- `easyar-mega://wechat/checklist`
- `easyar-mega://workflow/quickstart`
- `easyar-mega://security/secrets`

## Nhắc Giao diện

- `easyar-mega-run-image-tracking`
- `easyar-mega-run-cloud-recognition`
- `easyar-mega-miniprogram-code-review`
- `easyar-mega-validate-official-access`
- `easyar-mega-device-validation`

## Chiến lược kiểm tra mỗi công cụ

Sử dụng ba lớp cho mỗi công cụ.

1. Kiểm tra lược đồ
 - Gọi công cụ MCP với đầu vào tối thiểu hợp lệ.
 - Gọi nó với đầu vào bắt buộc là enum/path/missing không hợp lệ.
 - Xác nhận lỗi Zod/MCP là rõ ràng và không bao gồm bí mật.

2. Kiểm tra cố định
 - Sử dụng dự án Chương trình nhỏ giả tạm thời chứa `project.config.json`, `app.json`, các trang, tệp EasyAR SDK giả và nhật ký giả.
 - Xác nhận các bước kiểm tra mức độ sẵn sàng được trả về, trình chặn, đường dẫn bằng văn bản và nội dung Markdown.

3. Kiểm tra khói tích hợp
 - Khởi động máy chủ MCP qua stdio.
 - Chạy `initialize`, `tools/list`, đã chọn `tools/call`, `resources/list` và đã chọn `resources/read`.
 - Khẳng định JSON-RPC phản hồi hợp lệ và máy chủ thoát hoàn toàn.

Kiểm tra trên mỗi giao diện được đề xuất:

- Công cụ máy chủ/catalog: công cụ xác minh/resources/prompts được liệt kê và có các mẫu tập trung.
- Công cụ tài khoản: kiểm tra điểm cuối bị thiếu, mã thông báo bị thiếu, 200 giả, 401 giả, và biên tập bí mật.
- Kiểm tra dự án: kiểm tra thư mục trống, Chương trình nhỏ một phần, Chương trình nhỏ hợp lệ và không gian làm việc với gói con.
- Công cụ cấu hình: kiểm tra cấu hình bị thiếu, cấu hình giữ chỗ, cấu hình hợp lệ, cấu hình Nhận dạng đám mây, trình soạn thảo được env hỗ trợ.
- Công cụ nhập: chạy thử, gói bị thiếu, gói bên ngoài root được phép, ghi đè sai, ghi đè true.
- Công cụ mã: kiểm tra đường dẫn tương đối an toàn, từ chối truyền tải đường dẫn, cập nhật đăng ký JSON, quét bí mật.
- Công cụ DevTools: kiểm tra CLI bị thiếu, CLI giả thành công, CLI giả, thất bại, phân loại nhật ký.
- Công cụ thiết bị/report: kiểm tra bị chặn, thất bại, vượt qua mà không có bằng chứng thiết bị, vượt qua với bằng chứng thiết bị.

## Hỗ trợ nền tảng và kiểm tra nền tảng

### Codex

Điểm nhập được hỗ trợ:

- local dist: `node /absolute/path/to/dist/index.js`
- thùng gói: `easyar-mcp`
- npx: `npx -y mcp-easyar`

Thử nghiệm:

- Tạo cấu hình Codex với `easyar_mega_generate_client_config client=codex`.
- Chạy `easyar_mega_server_status`.
- Chạy `easyar_mega_inspect_miniprogram_project` trên một dự án cố định.
- Chạy `easyar_mega_write_focused_preflight` và xác minh Markdown đã tạo.
- Chạy `easyar_mega_review_miniprogram_code` sau khi chỉnh sửa mẫu được kiểm soát.

### Claude Desktop

Các điểm truy cập được hỗ trợ:

- máy chủ stdio MCP được định cấu hình trong Claude Desktop JSON.

Kiểm tra:

- Tạo cấu hình Claude với `easyar_mega_generate_client_config client=claude-desktop`.
- Xác nhận `tools/list` hiển thị tất cả các công cụ EasyAR Mega.
- Yêu cầu Claude gọi `easyar_mega_server_status`.
- Yêu cầu Claude tạo `LOCAL_CONFIG_FORM.md` và `PREFLIGHT.md` trong một dự án cố định.
- Xác nhận các cấu phần phần mềm được tạo không chứa giá trị bí mật.

### Khách hàng MCP chung

Điểm nhập được hỗ trợ:

- Bất kỳ ứng dụng MCP nào hỗ trợ truyền tải stdio và các công cụ MCP/resources/prompts.

Kiểm tra:

- JSON-RPC thử nghiệm khói stdio với `initialize`, `tools/list`, `resources/list` và ba yêu cầu `tools/call` đại diện.
- Xác thực khả năng tương thích với phiên bản giao thức MCP đã khai báo.

### Công cụ dành cho nhà phát triển WeChat

Bề mặt được hỗ trợ:

- DevTools cục bộ CLI để biên dịch/open/preview/upload xác thực khi được cài đặt và đăng nhập.

Kiểm tra:

- Thiếu CLI trả về một trình chặn rõ ràng.
- Công cụ cố định CLI giả sẽ trả về quá trình biên dịch và xem trước thành công logs.
- Thử nghiệm CLI thực trên máy của nhà phát triển:
 - `easyar_mega_check_wechat_devtools`
 - `easyar_mega_run_miniprogram_compile_check`
 - `easyar_mega_run_devtools_preview`
- Xác thực đường dẫn đầu ra QR tồn tại khi xem trước thành công.
- Xác thực nhật ký đã được sắp xếp lại và phân loại.

### Phần cuối chính thức của EasyAR

Bề mặt được hỗ trợ:

- Điểm cuối chính thức có thể định cấu hình cho tài khoản, giấy phép, nội dung tải xuống và siêu dữ liệu mẫu.

Kiểm tra:

- Thiếu điểm cuối được định cấu hình trả về=false.
- Thiếu mã thông báo trả về đã định cấu hình=true và ok=null.
- Mock 200 trả về ok=true.
- Mock 401/403 trả về ok=false và tài khoản/license hành động tiếp theo.
- Các trường phản hồi khớp với mã thông báo/key/secret/license/password được điều chỉnh lại theo cách đệ quy.

### GitHub Hành động hoặc CI khác

Bề mặt được hỗ trợ:

- Kiểm tra gói, kiểm tra đánh máy, khói và thiết bị cố định không bí mật.

Kiểm tra:

- `npm run typecheck`
- `npm test`
- `npm run package:smoke`
- Không yêu cầu bí mật EasyAR hoặc WeChat thực sự.
- Công việc tùy chọn hàng đêm có thể sử dụng bí mật tài khoản thử nghiệm chính thức từ bộ lưu trữ bí mật CI.

### macOS, Windows, Linux

Yêu cầu hỗ trợ:

- MCP bản thân máy chủ sẽ chạy ở mọi nơi Node.js hơn 20 lần chạy.
- Tính năng tự động hóa của Công cụ dành cho nhà phát triển WeChat được xác thực chủ yếu trên các máy của nhà phát triển đã cài đặt DevTools CLI.

Thử nghiệm:

- Xử lý đường dẫn cho các đường dẫn và không gian tuyệt đối.
- Khám phá có thể thực thi theo nền tảng.
- Kiểm tra dự án cố định trên tất cả các mục tiêu hệ điều hành.
- DevTools thực CLI hút trên macOS và máy của nhà phát triển Windows.

## Luồng người dùng đầu tiên được đề xuất

1. `easyar_mega_server_status`
2. `easyar_mega_account_onboarding accountStage=logged-in sampleId=image-tracking`
3. `easyar_mega_account_materials sampleId=image-tracking`
4. `easyar_mega_prepare_miniprogram_project projectPath=/path/to/miniprogram sampleId=image-tracking`
5. `easyar_mega_write_local_config_form projectPath=/path/to/miniprogram sampleId=image-tracking`
6. Người dùng điền vào cấu hình cục bộ bên ngoài cuộc trò chuyện hoặc đặt các biến env.
7. `easyar_mega_validate_local_config projectPath=/path/to/miniprogram sampleId=image-tracking`
8. `easyar_mega_check_wechat_devtools`
9. `easyar_mega_write_focused_preflight projectPath=/path/to/miniprogram sampleId=image-tracking`
10. `easyar_mega_run_miniprogram_compile_check projectPath=/path/to/miniprogram`
11. `easyar_mega_run_devtools_preview projectPath=/path/to/miniprogram`
12. Quét và xác thực thiết bị thực.
13. `easyar_mega_write_run_result`
14. `easyar_mega_write_completion_report`
