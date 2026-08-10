# Nghiệm thu dự án mới với mcp-easyar

Danh sách kiểm tra này chứng minh rằng một dự án Unity mới có thể sử dụng khóa cục bộ hiện tại MVP để tiếp cận mục tiêu mẫu EasyAR tập trung.

Phạm vi chấp nhận hiện tại:

- Theo dõi hình ảnh
- CRS/Cloud Nhận dạng
- Mega

Ngoài phạm vi cho đến khi người dùng tiếp tục một cách rõ ràng:

- Xin chào AR
- Theo dõi bề mặt
- Các mẫu Plugin EasyAR Sense Unity Plugin khác
- Tài khoản EasyAR chính thức tự động API truy cập
- cài đặt npm hoặc npx trước khi gói npm được xuất bản

## Điều kiện tiên quyết

- Unity `2022.3.62f3` hoặc trình soạn thảo Unity 2022.3 LTS tương thích đã được cài đặt.
- Node.js 20 hoặc mới hơn đã có sẵn.
- Gói MCP được cài đặt từ tarball Bản phát hành GitHub hiện tại.
- Bản chính thức Plugin EasyAR Sense Unity được tải xuống từ trang web EasyAR và được nhập vào dự án Unity.
- Xác thực thiết bị Android được ưu tiên làm bằng chứng cuối cùng. Việc kiểm tra chỉ dành cho người chỉnh sửa là không đủ để chứng minh khả năng nhận dạng AR.

Cài đặt bản phát hành trước hiện tại:

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.41/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## Quy tắc an toàn

Khóa cục bộ MVP cố tình giữ tài khoản và tài liệu bí mật bên ngoài cuộc trò chuyện.

Không dán các giá trị này vào Codex, Claude, đưa ra nhận xét, tài liệu, nhật ký hoặc tệp đã cam kết:

- Mật khẩu trang web EasyAR
- Mã xác minh
- Khóa cấp phép
- CRS API Khóa hoặc API Bí mật
- `appKey`
- `appSecret`

Người dùng đăng ký, đăng nhập, tải xuống gói, tạo khóa và quản lý thư viện mục tiêu đám mây trong trình duyệt của riêng họ tại trang web EasyAR chính thức. MCP chỉ hướng dẫn quy trình và xác thực sự hiện diện cục bộ đã được loại bỏ.

Đường dẫn cấu hình cục bộ của dự án Unity là:

```text
ProjectSettings/EasyAR/easyar.local.json
```

Tệp này phải ở trạng thái cục bộ và bị bỏ qua bởi git.

## Cuộc gọi của khách hàng đầu tiên

Sau khi kết nối Codex, Claude Desktop hoặc ứng dụng khách MCP khác, hãy gọi:

```text
easyar_server_status
easyar_check_client_setup client=codex entrypointMode=package-bin includeTokenPlaceholder=false
```

Sau đó hãy đọc các tài nguyên sau:

```text
easyar://client/acceptance
easyar://acceptance/fresh-project
easyar://status/remaining-work
easyar://workflow/focused-scope
easyar://workflow/programming
```

Máy khách sẵn sàng khi tên máy chủ là `mcp-easyar`, các mẫu tập trung bao gồm `image-tracking`, `cloud-recognition` và `mega` và `easyar-mcp-check` báo cáo tất cả tài nguyên cần thiết là OK.

## Luồng dự án Unity mới

Tạo cấu phần phần mềm chuyển giao cục bộ đầu tiên:

```text
easyar_write_client_setup outputRoot=/path/to/report-folder client=codex entrypointMode=package-bin
easyar_write_first_run_guide projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_write_local_config_handoff projectPath=/path/to/UnityProject accountStage=logged-in sampleId=cloud-recognition platform=android
easyar_write_local_config_form projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
```

Điền `ProjectSettings/EasyAR/easyar.local.json` cục bộ hoặc viết nó từ các biến môi trường cục bộ với:

```text
easyar_write_local_config_from_env projectPath=/path/to/UnityProject overwrite=false
easyar_validate_local_config projectPath=/path/to/UnityProject sampleId=cloud-recognition
```

Để theo dõi hình ảnh, hãy chạy trình tự thiết lập tập trung:

```text
easyar_write_import_checklist projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_sample_import_guide projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_import_sample_from_package_cache projectPath=/path/to/UnityProject sampleId=image-tracking dryRun=true
easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_create_sample_validation_helper projectPath=/path/to/UnityProject overwrite=true
easyar_run_unity_method projectPath=/path/to/UnityProject methodName=EasyARGenerated.SampleValidationHelper.ValidateFocusedSample sampleId=image-tracking platform=android
easyar_write_run_sequence projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
```

Để nhận dạng CRS/Cloud, hãy chạy trình tự thiết lập tập trung tương tự với `sampleId=cloud-recognition`. Người dùng phải có thư viện mục tiêu đám mây CRS với ít nhất một hình ảnh mục tiêu được tải lên và các trường CRS cục bộ bắt buộc đã được điền.

```text
easyar_write_import_checklist projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_sample_import_guide projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_import_sample_from_package_cache projectPath=/path/to/UnityProject sampleId=cloud-recognition dryRun=true
easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_run_unity_method projectPath=/path/to/UnityProject methodName=EasyARGenerated.SampleValidationHelper.ValidateFocusedSample sampleId=cloud-recognition platform=android
easyar_write_run_sequence projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
```

Đối với Mega, hãy sử dụng Plugin EasyAR Sense Unity chính thức dành cho Mega và chạy trình tự thiết lập tập trung với `sampleId=mega`. Người dùng phải có giấy phép giới hạn gói EasyAR và phải sử dụng trang web EasyAR đã đăng nhập hoặc phiên Mega Studio của riêng họ để tìm thư viện bản địa hóa đám mây, bộ lưu trữ Mega Block, Tên khối và ID khối. Định cấu hình Unity cục bộ; không dán giấy phép hoặc API Giá trị bí mật vào cuộc trò chuyện.

```text
easyar_write_import_checklist projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_sample_import_guide projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_import_sample_from_package_cache projectPath=/path/to/UnityProject sampleId=mega dryRun=true
easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_check_sample_readiness projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_run_sequence projectPath=/path/to/UnityProject sampleId=mega platform=android
```

Đối với điện thoại Android/tablet, PICO và XREAL Xác thực Mega, hãy đặt mẫu Mega `LocationInputMode` thành `Onsite`. Để xác thực tai nghe PICO 4 Ultra Enterprise, hãy cài đặt gói mở rộng thiết bị EasyAR Unity XR chính thức, chỉ giữ lại `PicoFrameSource` và sử dụng PICO Unity Integration SDK `3.1.0` hoặc mới hơn. Một kết quả Mega được thông qua yêu cầu các tín hiệu xây dựng/install/launch/readiness cộng với bản địa hóa/tracking trong môi trường vật lý được ánh xạ đã chọn.

Sau đó, việc xác thực bản dựng và thiết bị sẽ viết bằng chứng tập trung:

```text
easyar_android_device_status
easyar_write_device_validation_checklist projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=image-tracking platform=android status=passed recognitionVerified=true
easyar_write_completion_report projectPath=/path/to/UnityProject sampleId=image-tracking platform=android runThroughComplete=true
easyar_write_device_validation_checklist projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android status=passed recognitionVerified=true
easyar_write_completion_report projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android runThroughComplete=true
easyar_write_device_validation_checklist projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=mega platform=android status=passed recognitionVerified=true
easyar_write_completion_report projectPath=/path/to/UnityProject sampleId=mega platform=android runThroughComplete=true
easyar_write_focused_scope_status projectPath=/path/to/UnityProject platform=android
```

## Tiêu chí chấp nhận

- `easyar-mcp-check` chuyển và báo cáo tài nguyên chấp nhận dự án mới.
- Thiết lập máy khách hoạt động thông qua `package-bin` cho Codex hoặc Claude Desktop.
- `ProjectSettings/EasyAR/easyar.local.json` xác thực cục bộ mà không in các giá trị bí mật.
- Theo dõi hình ảnh hoàn tất quá trình nhận dạng thiết bị thực.
- CRS/Cloud Tính năng nhận dạng hoàn tất quá trình nhận dạng thiết bị thực đối với mục tiêu trên đám mây.
- Mega hoàn thành quá trình bản địa hóa thiết bị thực trên điện thoại Android/tablet, PICO hoặc XREAL với `LocationInputMode=Onsite`.
- `FOCUSED_SCOPE_STATUS.md` báo cáo `allFocusedSamplesComplete=true`.
- Báo cáo được tạo chứa các đường dẫn, sự hiện diện bị loại bỏ và các hành động tiếp theo, không phải bí mật thô.
- GitHub Phát hành tarball smoke chuyển cho cùng một thẻ phát hành.

Khi các bước kiểm tra này vượt qua, khóa cục bộ tập trung hiện tại MVP có thể được chấp nhận cho một dự án Unity mới.
