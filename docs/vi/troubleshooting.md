# mcp-easyar Khắc phục sự cố mẫu tập trung

Công việc đang thực hiện hiện tại được giới hạn ở Theo dõi hình ảnh, Nhận dạng đám mây và Mega. Các mẫu EasyAR khác được lập danh mục để mở rộng sau này và chưa được coi là đã được máy chủ MCP này xác minh.

## Kiểm tra đầu tiên

Chạy các mẫu này trước khi gỡ lỗi cảnh Unity bằng tay:

```text
easyar_write_onboarding_report projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_import_checklist projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_run_report projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_scene_audit projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_support_bundle projectPath=/path/to/UnityProject sampleId=image-tracking
```

Sử dụng `sampleId=cloud-recognition` cho Nhận dạng đám mây hoặc `sampleId=mega` cho Mega.

## Theo dõi hình ảnh

Các trình chặn phổ biến:

- `easyar-official-import`: Plugin EasyAR Unity chính thức không hiển thị trong `Assets` hoặc `Packages`.
- `sample-scene`: không tìm thấy ứng cử viên cảnh Theo dõi hình ảnh nào hoặc cảnh phù hợp không được bật trong Cài đặt bản dựng.
- `image-target-assets`: hình ảnh mục tiêu hoặc nội dung siêu dữ liệu mục tiêu bị thiếu.
- `image-target-streaming-assets`: dữ liệu mục tiêu `Samples~/StreamingAssets/ImageTargets/ImageTargets.unitypackage` chính thức chưa được nhập vào `Assets/StreamingAssets/EasyARSamples/ImageTargets`.
- `image-tracking-target-load`: Nhật ký thống nhất cho biết không thể tải tệp mục tiêu.
- `image-tracking-no-detection`: ứng dụng mở camera nhưng không bao giờ phát hiện được mục tiêu.

Ghi chú cảnh tùy chỉnh:

Máy chủ MCP nhận ra các cảnh Theo dõi hình ảnh bằng gợi ý đặt tên mẫu chính thức và theo các điểm đánh dấu nội dung cảnh như `ImageTarget`, `ImageTracker` và `TargetDataFileSource`. Điều này cho phép các cảnh tùy chỉnh chẳng hạn như cảnh nhận dạng RMB được coi là ứng cử viên Theo dõi hình ảnh ngay cả khi tên tệp không chứa `ImageTracking`.

Lưu ý dữ liệu mục tiêu mẫu chính thức:

Nếu nhật ký thiết bị báo cáo các tệp bị thiếu như `EasyARSamples/ImageTargets/namecard.jpg`, `namecard.etd` hoặc `idback.etd`, hãy nhập `Samples~/StreamingAssets/ImageTargets/ImageTargets.unitypackage` từ gói Plugin EasyAR Sense Unity, hãy làm mới Unity, xây dựng lại và kiểm tra lại. Vòng xác thực hình ảnh ổn định là hiển thị hình ảnh mục tiêu trên màn hình máy tính và hướng điện thoại được kết nối vào đó cho đến khi mẫu báo cáo mục tiêu đã tìm thấy.

Luồng đề xuất:

```text
easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_create_build_settings_helper projectPath=/path/to/UnityProject sampleId=image-tracking platform=android overwrite=true
easyar_create_sample_validation_helper projectPath=/path/to/UnityProject sampleId=image-tracking overwrite=true
easyar_run_unity_method projectPath=/path/to/UnityProject executeMethod=EasyAR.EditorTools.EasyARSampleValidationHelper.ValidateFocusedSample
easyar_analyze_latest_unity_log projectPath=/path/to/UnityProject sampleId=image-tracking
```

Nếu xác thực vẫn không thành công, hãy tạo lại:

```text
easyar_write_support_bundle projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=image-tracking platform=android overallStatus=blocked
easyar_write_issue_report projectPath=/path/to/UnityProject sampleId=image-tracking platform=android overallStatus=blocked
```

## Nhận dạng đám mây

Trình chặn chung:

- `cloud-recognition-credentials`: `ProjectSettings/EasyAR/easyar.local.json` không chứa `appId` không chứa phần giữ chỗ cùng với `apiKey` cho Sense 4.1+ hoặc bộ `appId`/`appKey`/`appSecret` kế thừa hoàn chỉnh.
- `cloud-target-library-ready`: tài khoản EasyAR không có thư viện hình ảnh Nhận dạng đám mây hoặc thư viện đã chọn chưa tải lên/enabled hình ảnh mục tiêu thử nghiệm.
- `focused-sample-scene-imported`: mẫu Nhận dạng đám mây tồn tại trong bộ đệm của gói EasyAR nhưng chưa được nhập vào `Assets/Samples`.
- `package-cache-sample-available`: máy chủ MCP đã tìm thấy ứng viên dưới `Library/PackageCache/**/Samples~`; nhập nó thông qua Mẫu trình quản lý gói Unity.
- `cloud-recognition-network`: Nhật ký Unity hoặc thiết bị cho biết đã hết thời gian chờ, máy chủ không thể truy cập, TLS, DNS hoặc sự cố kết nối dịch vụ.
- `sample-scene`: không tìm thấy ứng cử viên cảnh Nhận dạng đám mây nào hoặc cảnh phù hợp không được bật trong Cài đặt bản dựng.
- `camera-permission`: ứng dụng không thể truy cập quyền máy ảnh trên thiết bị.

Ghi chú bộ đệm của gói:

Các mẫu gói EasyAR có thể xuất hiện trong `Library/PackageCache/.../Samples~/ImageTracking/ImageTracking_CloudRecognition` trước khi chúng được nhập vào dự án. Máy chủ MCP báo cáo các đường dẫn này là ứng cử viên nhập nhưng Unity vẫn phải nhập mẫu vào `Assets/Samples` trước khi Cài đặt bản dựng và xác thực cảnh có thể thành công.

Ghi chú vượt qua thiết bị Nhận dạng đám mây:

`easyar_android_install_apk`, `easyar_android_start_app` và `easyar_android_collect_logcat` chỉ chứng minh cài đặt, khởi chạy và ghi nhật ký. Nhận dạng đám mây `RUN_RESULT.md` đã vượt qua cũng cần có thư viện mục tiêu Nhận dạng đám mây EasyAR được định cấu hình, ít nhất một hình ảnh mục tiêu thử nghiệm đã tải lên, đường dẫn mạng thiết bị thực tới dịch vụ và nhận dạng được quan sát của mục tiêu đó.

Luồng đề xuất:

```text
easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=cloud-recognition
easyar_validate_local_config projectPath=/path/to/UnityProject
easyar_check_official_access projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_create_build_settings_helper projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android overwrite=true
easyar_create_sample_validation_helper projectPath=/path/to/UnityProject sampleId=cloud-recognition overwrite=true
easyar_run_unity_method projectPath=/path/to/UnityProject executeMethod=EasyAR.EditorTools.EasyARSampleValidationHelper.ValidateFocusedSample
easyar_analyze_latest_unity_log projectPath=/path/to/UnityProject sampleId=cloud-recognition
```

Nếu quá trình xác thực hoặc chạy trên thiết bị thực vẫn không thành công, hãy tạo lại:

```text
easyar_write_support_bundle projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android overallStatus=blocked
easyar_write_issue_report projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android overallStatus=blocked
```

Dán `ISSUE_REPORT.md` vào vấn đề GitHub và tham chiếu `SUPPORT_BUNDLE.md`, `RUN_RESULT.md`, `SCENE_AUDIT.md` và đường dẫn nhật ký Unity được liệt kê ở đó. Xem lại mọi tạo phẩm trước khi đăng công khai.

## Mega

Các trình chặn phổ biến:

- `mega-settings`: `Assets/XR/Settings/EasyAR Settings.asset` thiếu License Key của gói hoặc AppID, ServerAddress, APIKey hay APISecret của Global Mega Block. Mega không sử dụng `easyar.local.json`.
- `mega-scene-selection`: có nhiều hơn một cảnh Onsite, cảnh được bật đầu tiên là Simulator hoặc cảnh đã chọn không phải là cảnh `MegaBlockController` Onsite. Đọc `SCENE_AUDIT.md` và tạo lại trình trợ giúp bằng `scenePath` chính xác được đề xuất.
- `mega-assets`: không tìm thấy gợi ý tài sản Mega, Mega Block, CloudLocalizer hoặc Mega dành riêng cho dự án nào trong `Assets` hoặc `Packages`.
- `mega-block-config`: Unity hoặc nhật ký thiết bị cho biết không thể tải thư viện bản địa hóa đám mây hoặc Mega Block đã chọn.
- `mega-hybridclr`: Các tệp được tạo bằng HybridCLR bị thiếu hoặc cũ đối với mục tiêu bản dựng Android hiện tại.
- `mega-arcore-manifest`: Bản kê khai Android, siêu dữ liệu ARCore hoặc `minSdkVersion` khối xung đột APK đóng gói.
- `mega-localization-runtime`: ứng dụng khởi động nhưng quá trình bản địa hóa Mega trên thiết bị thực không thành công.

Ghi chú vượt qua thiết bị Mega:

Biên dịch hoặc APK xây dựng thành công là không đủ đối với Mega. Mega `RUN_RESULT.md` cần có bằng chứng APK cài đặt/launch cộng với bằng chứng bản địa hóa thiết bị thực cho thư viện bản địa hóa đám mây đã chọn và Mega Block. Người dùng nên tìm thư viện và chặn số nhận dạng trong trang web EasyAR hoặc phiên Mega Studio đã đăng nhập; MCP không được thu thập thông tin xác thực trang web hoặc khóa bí mật trong cuộc trò chuyện.

Luồng đề xuất:

```text
easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=mega
easyar_validate_local_config projectPath=/path/to/UnityProject sampleId=mega
easyar_check_sample_readiness projectPath=/path/to/UnityProject sampleId=mega
easyar_write_scene_audit projectPath=/path/to/UnityProject sampleId=mega
easyar_create_build_settings_helper projectPath=/path/to/UnityProject sampleId=mega platform=android scenePath=Assets/.../MegaOnsite.unity overwrite=true
easyar_create_sample_validation_helper projectPath=/path/to/UnityProject sampleId=mega overwrite=true
easyar_analyze_latest_unity_log projectPath=/path/to/UnityProject sampleId=mega
```

Lỗi khởi động Unity ở chế độ batch phải được chẩn đoán riêng với quá trình biên dịch dự án. `EASYAR_UNITY_PATH` phải trỏ đến tệp thực thi Editor (`Unity.app/Contents/MacOS/Unity`, `Editor/Unity.exe` hoặc `Editor/Unity`), không phải Unity CLI shim. Nếu phiên bản Unity Hub dự kiến là một liên kết tượng trưng bị hỏng tới ổ đĩa ngoài, hãy gắn hoặc khôi phục ổ đĩa đó rồi chạy lại `easyar_write_unity_environment_report` trước khi thử lại.

Sau khi APK được tạo và điện thoại được kết nối, hãy sử dụng runbook thiết bị Android và ghi lại kết quả:

```text
easyar_write_android_device_runbook projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_device_run_result_form projectPath=/path/to/UnityProject sampleId=mega platform=android
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=mega platform=android overallStatus=blocked
easyar_write_completion_report projectPath=/path/to/UnityProject sampleId=mega platform=android
```

Giữ kết quả chạy Mega ở trạng thái `blocked` cho đến khi Mega Block đã chọn được tải và thiết bị thực tạo ra bằng chứng thành công về định vị/theo dõi đã được che thông tin nhạy cảm trong môi trường vật lý đã ánh xạ. Việc cài đặt APK, khởi chạy ứng dụng và logcat sạch chỉ là các bước trung gian; chỉ dùng `overallStatus=passed` sau khi báo cáo hoàn thành cho biết `runThroughComplete=true`.

## Bảo mật

Không đăng khóa cấp phép EasyAR, mã thông báo tài khoản, Nhận dạng đám mây API KEY/API Bí mật, `appKey` hoặc `appSecret`, khóa ký, hồ sơ cấp phép, mã nhận dạng riêng tư của thiết bị hoặc nhật ký riêng tư đầy đủ. Báo cáo MCP loại bỏ các tên khóa phổ biến nhưng người dùng vẫn nên xem lại nội dung vấn đề trước khi xuất bản trên GitHub.
