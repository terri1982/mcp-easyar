# mcp-easyar Công việc còn lại

Trang này cung cấp cho Codex, Claude Desktop và các ứng dụng khách MCP khác một cái nhìn ổn định, không bí mật về những gì còn lại cho mục tiêu phát hành tập trung hiện tại.

## Phạm vi hiện tại

Mục tiêu hiện tại được người dùng phê duyệt được giới hạn ở:

- Theo dõi hình ảnh
- CRS/Cloud Nhận dạng
- Mega

Xin chào AR, Surface Tracking và các mẫu Plugin EasyAR Sense Unity khác nằm ngoài phạm vi của mục tiêu phát hành hiện tại cho đến khi người dùng yêu cầu tiếp tục một cách rõ ràng.

## Bằng chứng hiện tại

- Bản phát hành trước công khai hiện tại: `v0.1.0-local-key.41`
- Mục tiêu có phạm vi được xuất bản: 100% cho tính năng Theo dõi hình ảnh đã được phê duyệt, CRS/Cloud Nhận dạng và mục tiêu Mega.
- Bằng chứng lớn bao gồm điện thoại Android, dự án mới, PICO 4 Ultra Enterprise và các đường dẫn XREAL Air 2 Ultra build/install/runtime, bao gồm các tín hiệu bản địa hóa thiết bị thực.
- Khóa cục bộ MVP khả năng sử dụng công khai: khoảng 98%
- Có bằng chứng về tính năng Theo dõi hình ảnh và CRS/Cloud trên thiết bị Android, bao gồm cả ảnh chụp màn hình nhận dạng CRS được làm mới và nhật ký thiết bị từ ngày 11 tháng 6 năm 2026.
- GitHub Phát hành thẻ khói cài đặt tarball, bao gồm Codex và Claude Desktop `package-bin` kiểm tra thiết lập ứng dụng khách.
- Hướng dẫn chấp nhận dự án Fresh Unity tồn tại trong `docs/FRESH_PROJECT_ACCEPTANCE.md` và `easyar://acceptance/fresh-project`.
- `npx -y mcp-easyar` được dành riêng cho lần xuất bản npm trong tương lai; đường dẫn cài đặt bản phát hành trước công khai hiện tại là tarball Bản phát hành GitHub.
- Kiểm tra bảo mật vượt qua mà không cần cam kết bí mật cấu hình cục bộ, bí mật thời gian chạy, APK, gói Unity hoặc các giá trị giống bí mật rõ ràng.

## Còn lại cho mục tiêu có phạm vi hiện tại

- Giữ liên kết phát hành, tài liệu trạng thái, hướng dẫn chấp nhận dự án mới, kiểm tra cài đặt và kiểm tra khói phát hành GitHub phù hợp với từng bản phát hành trước mới.
- Chạy lại Theo dõi hình ảnh, CRS/Cloud Nhận dạng và bằng chứng thiết bị Mega khi dự án Unity, phiên bản EasyAR Sense Unity Plugin, phiên bản Unity được hỗ trợ hoặc thay đổi nền tảng đích.
- Tiếp tục tăng cường quy trình lập trình Unity với các trường hợp dự án Theo dõi hình ảnh thực và CRS.

## Không bắt buộc đối với mục tiêu có phạm vi hiện tại

- Chạy Hello AR, Theo dõi bề mặt hoặc các mẫu EasyAR khác.
- Thu thập mật khẩu trang web EasyAR, mã xác minh, khóa cấp phép, CRS API KEY/API Bí mật, `appKey` hoặc `appSecret` trong trò chuyện.
- Gọi API tài khoản chính thức EasyAR thực để lấy giấy phép tự động/download/cloud khám phá thông tin xác thực.
- Xuất bản lên npm dưới dạng bản phát hành sản xuất.
- Sử dụng `npx -y mcp-easyar` trước khi gói npm tồn tại.

## Còn lại cho mục tiêu sản xuất đầy đủ

- Điểm cuối trạng thái tài khoản do EasyAR sở hữu.
- Điểm cuối xác thực giấy phép do EasyAR sở hữu.
- Điểm cuối quyền tải xuống do EasyAR sở hữu.
- CRS/Cloud Thuộc sở hữu của EasyAR. Điểm cuối siêu dữ liệu thông tin xác thực nhận dạng trả về cờ hiện diện và siêu dữ liệu không có bí mật thô.
- Chính sách xác minh và phát hành mã thông báo sản xuất cho người dùng EasyAR đã đăng ký.
-- Cổng phát hành sản xuất nghiêm ngặt sử dụng API chính thức thực sự bằng chứng.

## Best Next MCP Cuộc gọi

Dành cho người dùng mới hoặc thiết lập khách hàng mới:

```text
easyar_server_status
easyar_check_client_setup client=codex entrypointMode=package-bin includeTokenPlaceholder=false
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_account_onboarding accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_generate_sample_plan sampleId=mega platform=android unityVersion=2022.3.62f3
```

Cũng đọc MCP tài nguyên `easyar://acceptance/fresh-project`.

Đối với dự án Unity:

```text
easyar_write_project_handoff projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_remaining_work_report projectPath=/path/to/UnityProject platform=android verificationEvidence=passed
easyar_write_focused_scope_status projectPath=/path/to/UnityProject platform=android
```

## Ranh giới an toàn

Bản phát hành hiện tại đi theo lộ trình MVP khóa cục bộ. Người dùng đăng ký, đăng nhập, tải xuống các gói chính thức, tạo khóa giấy phép/CRS và điền cấu hình dự án Unity cục bộ vào trình duyệt và hệ thống tệp của riêng họ. MCP chỉ báo cáo sự hiện diện, trạng thái, đường dẫn cấu phần phần mềm và hành động tiếp theo đã được loại bỏ.
