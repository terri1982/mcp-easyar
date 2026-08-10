# Bằng chứng mẫu Android EasyAR Sense 4003

Ngày: 2026-07-02

Phạm vi: Plugin EasyAR Sense Unity `4003.0.0+5171.3948ae721` Xác thực khởi động và xây dựng mẫu Android trong một dự án Unity mới, Unity `2022.3.62f3`.

Chỉ bằng chứng an toàn. Bản tóm tắt này có chủ ý loại trừ mật khẩu trang web EasyAR, khóa cấp phép, API Khóa/API Nhận dạng đám mây, appKey/appSecret, khóa ký, APK nhị phân, gói Unity và nhật ký riêng tư thô.

## Môi trường được xác minh

- Dự án Unity được tạo trên `/Volumes/UnityAPFS` cho mẫu riêng biệt xác thực.
- Gói Mega Unity do tài khoản chính thức ủy quyền đã được tải xuống thông qua trang web EasyAR đã đăng nhập.
- Bộ gói đã nhập:
 - `com.easyar.sense` `4003.0.0+5171.3948ae721`
 - `com.easyar.mega` `2.13.0+5171.3948ae721`
 - `com.easyar.mega.studio` `2.13.0+5171.3948ae721`
- Thiết bị thử nghiệm Android: Samsung `SM-S9010`, sê-ri `R5CTA0ZQ6XJ`.
- Mã nhận dạng gói Android dùng cho bản dựng xác minh cục bộ khớp với bản ghi giấy phép EasyAR hiện có.
- Cấu hình dịch vụ Mega và Nhận dạng đám mây đã được áp dụng cục bộ từ tài khoản EasyAR/ARMall đã đăng nhập mà không cần thực hiện thô thông tin đăng nhập.

## Kết quả mẫu

Tất cả bốn APK được tạo thành công và đã được cài đặt/launched trên thiết bị Android. Mỗi ứng dụng vẫn ở nền trước với quy trình vẫn hoạt động trong suốt thời gian xác thực.

| Mẫu | Xây dựng | Khởi động thiết bị | Tín hiệu thời gian chạy chính |
| --- | --- | --- | --- |
| ImageTracking_Target | Đã vượt qua | Đã vượt qua | Đã khởi chạy EasyAR, máy ảnh đã đạt được `ACTIVE`, kết cấu mục tiêu/reference đã được giải quyết sau khi bảo quản các tệp `.meta` chính thức. |
| ImageTracking_CloudRecognition | Đã vượt qua | Đã vượt qua | Đã khởi chạy EasyAR, máy ảnh đạt `ACTIVE`, không có lỗi thiếu cấu hình dịch vụ Nhận dạng đám mây. |
| MotionTracking_DeviceMotionAndPlaneDetection | Đã vượt qua | Đã vượt qua | Đã khởi tạo EasyAR, tải ARCore, camera đạt `ACTIVE`; chỉ có cảnh báo XROrigin dự kiến ​​được quan sát. |
| MegaBlock_Basic | Đã vượt qua | Đã vượt qua | Đã khởi chạy EasyAR, máy ảnh đã đạt đến `ACTIVE`, đường dẫn vị trí đang ở chế độ `Onsite`, không có cảnh báo ở chế độ Trình mô phỏng. |

## Đã xóa trình chặn

- Đã nâng cấp từ gói `4002` cục bộ cũ hơn lên bộ gói `4003` Sense + Mega đã tải xuống hiện tại.
- Đã nhập các cảnh mẫu chính thức từ PackageCache vào `Assets/Samples/EasyAR Sense Unity Plugin/4003.0.0`.
- Các tệp Unity `.meta` chính thức được bảo tồn cho mẫu thư mục. Điều này đã sửa các tập lệnh cảnh bị thiếu và kết cấu bị hỏng/prefab tham chiếu do GUID không khớp.
- Đã thêm ImageTargets StreamingAssets để tải mục tiêu Theo dõi hình ảnh.
- Đã áp dụng cấu hình dịch vụ Nhận dạng đám mây cho Cài đặt EasyAR cho mẫu đám mây.
- Đã áp dụng cấu hình dịch vụ bản địa hóa Mega Block cho Cài đặt EasyAR cho mẫu Mega.
- Đã chuyển `MegaBlock_Basic` `locationInputMode` từ `Simulator` sang `Onsite` để xác thực thiết bị thực.

## Kiểm tra tiêu cực

Nhật ký xác thực thành công không hiển thị:

- Android `FATAL EXCEPTION`
- `The referenced script on this Behaviour is missing`
- `Texture is null`
- `Service config ... NOT set`
- `License Key is empty`
- giấy phép EasyAR không hợp lệ/key lỗi khởi động
- `Session Broken`
- Cảnh báo Mega `Simulator mode` sau khi chuyển sang `Onsite`

Camera Samsung cấp hệ thống/VPN/location đã có cảnh báo được quan sát trong logcat nhưng không phải là trình chặn mẫu; các ứng dụng vẫn ở nền trước và các luồng camera đạt trạng thái hoạt động.

## MCP Theo dõi

Lần chạy này đã bộc lộ yêu cầu tự động hóa hiện được phản ánh trong hành vi MCP: quá trình nhập mẫu Unity chính thức phải bảo toàn tất cả các tệp `.meta` từ `PackageCache/Samples~`. Việc thiếu tệp `.meta` sẽ phá vỡ các tham chiếu Unity GUID và có thể tạo ra lỗi thời gian chạy `missing script` hoặc nội dung rỗng ngay cả khi APK xây dựng thành công.

## Tệp bằng chứng cục bộ

Nhật ký bản dựng thô, nhật ký thời gian chạy, APK, gói Unity và dự án Unity tạm thời vẫn cục bộ và không nên cam kết vì chúng có thể chứa đường dẫn riêng tư hoặc dành riêng cho tài khoản cấu hình.

- Dự án Unity cục bộ: `/Volumes/UnityAPFS/EasyAR-Sample-Run-20260701/EasyARSamples`
- Thư mục APK cục bộ: `/Volumes/UnityAPFS/EasyAR-Sample-Run-20260701/Builds`
- Thư mục nhật ký cục bộ: `/Volumes/UnityAPFS/EasyAR-Sample-Run-20260701/Logs`
