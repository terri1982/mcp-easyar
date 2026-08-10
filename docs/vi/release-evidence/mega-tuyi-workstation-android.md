# Bằng chứng Android cho máy trạm Mega Tuyi

Ngày: 2026-07-02

Phạm vi: Bản địa hóa đám mây EasyAR Mega Block dựa trên thư viện ARMall `涂意工位测试专用` trong dự án Unity mới, Unity `2022.3.62f3`, thiết bị Android thực.

Chỉ bằng chứng an toàn. Bản tóm tắt này có chủ ý loại trừ mật khẩu trang web EasyAR, khóa cấp phép, Mega API Khóa/API Giá trị bí mật, khóa ký, APK nhị phân, gói Unity, ảnh chụp màn hình với mã nhận dạng dịch vụ và nhật ký riêng tư thô.

## Môi trường được xác minh

- Dự án Unity: `/Users/tuyi/UnityProjects/EasyAR-Mega-Tuyi-Workstation-Test`
- APK: `/Users/tuyi/UnityProjects/EasyAR-Mega-Tuyi-Workstation-Test/Builds/Android/EasyAR-Mega-Tuyi-Workstation.apk`
- Bộ gói EasyAR:
 - `com.easyar.sense` `4003.0.0+5171.3948ae721`
 - `com.easyar.mega` `2.13.0+5171.3948ae721`
 - `com.easyar.mega.studio` `2.13.0+5171.3948ae721`
- Các phần phụ thuộc của Unity XR là đã thêm cho cảnh mẫu chính thức:
 - `com.unity.xr.arfoundation` `5.1.6`
 - `com.unity.xr.arcore` `5.1.6`
 - `com.unity.xr.management` `4.4.0`
- Mã định danh gói Android: `com.DefaultCompany.MegaMap`
- Thiết bị thử nghiệm: Samsung `SM-S9010`, serial `R5CTA0ZQ6XJ`

## Tài liệu bản địa hóa đám mây đã chọn

- Nhóm dịch vụ: `ARMallMega9.0`
- Thư viện bản địa hóa đám mây: `涂意工位测试专用`
- Bộ nhớ giới hạn: `ARMallBlock9.0`
- Định dạng dữ liệu: `3-a`
- Chặn: `CodexTest01`
- ID khối: `b75f4d7a-134c-4b6a-90d4-1dea938c2c16`
- Chế độ thời gian chạy: `Onsite`

## Tín hiệu đã được xác minh

- Đã tạo và áp dụng gói khớp với tên gói Giấy phép EasyAR Sense 4.x cho `com.DefaultCompany.MegaMap`.
- Đã định cấu hình `MegaBlock_Basic` để sử dụng cấu hình dịch vụ Mega Block toàn cầu và `CodexTest01`.
- Đã xây dựng Android ARM64 IL2CPP APK thành công.
- Đã cài đặt APK trên Samsung `SM-S9010` thành công.
- Đã cấp quyền cho máy ảnh/location thông qua ADB.
- EasyAR Sense đã khởi chạy trên thiết bị:
 - `EasyAR Sense Unity Plugin Version 4003.0.0+5171.3948ae721`
 - `EasyAR Sense CommunityFull (Android-arm64) Version 4.9.0.11908-e5f122cc4`
- Trình chặn khởi động `Invalid Key: {No matched Package Name}` trước đó đã bị xóa sau khi sử dụng giấy phép khớp với tên gói.
- Thiếu AR Foundation/XR cảnh báo về tập lệnh cảnh đã bị xóa bằng cách thêm gói Unity XR.
- Thời gian chạy đã sử dụng đầu vào camera ARCore và mở luồng camera thực.
- Chẩn đoán trên thiết bị đã hiển thị đường dẫn bản địa hóa đám mây Mega Block bằng cách sử dụng `CodexTest01` và cấu hình máy chủ đã chọn.
- Người dùng đã xác nhận lần chạy thiết bị thực cuối cùng được bản địa hóa thành công.

## Đã xóa trình chặn

- Việc sử dụng lại lần đầu giấy phép EasyAR cục bộ không liên quan không thành công với `Invalid Key: {No matched Package Name}`. Giấy phép Sense của tài khoản ARMall mới đã được tạo cho tên gói thử nghiệm.
- Mẫu chính thức ban đầu đã ghi lại các tập lệnh bị thiếu trên `AR Session`, `XR Origin` và `Main Camera`. Việc thêm AR Foundation, ARCore XR Plugin và XR Management đã giải quyết được những cảnh báo đó.
- Bản dựng Android đầu tiên không thành công do CPU cài đặt phụ trợ kiến ​​trúc/tập lệnh chưa hoàn chỉnh cho các bản dựng hàng loạt ARCore. Quá trình tự động hóa bản dựng hiện đặt IL2CPP và ARM64 đồng thời vô hiệu hóa hộp thoại chiếu trước ARCore 32-bit EasyAR ở chế độ hàng loạt.
- Dự án Unity đĩa ngoài trước đó đã gặp phải nhiều lỗi cơ sở dữ liệu nội dung Unity; dự án được xác minh cuối cùng đã được tạo lại trên bộ lưu trữ APFS cục bộ.

## Giới hạn hiện tại

Bản ghi đã cam kết là một bản tóm tắt an toàn. APK thô, gói Unity, ảnh chụp màn hình, nhật ký bản dựng và thông tin đăng nhập dịch vụ vẫn cục bộ vì chúng có thể chứa thông tin chi tiết về tài khoản hoặc môi trường riêng tư.

## Tệp bằng chứng cục bộ

- Dự án Unity: `/Users/tuyi/UnityProjects/EasyAR-Mega-Tuyi-Workstation-Test`
- APK: `/Users/tuyi/UnityProjects/EasyAR-Mega-Tuyi-Workstation-Test/Builds/Android/EasyAR-Mega-Tuyi-Workstation.apk`
- Nhật ký bản dựng: `/Users/tuyi/UnityProjects/EasyAR-Mega-Tuyi-Workstation-Test/Builds/Logs/build-android.log`
- Ảnh chụp màn hình thời gian chạy: `/tmp/s22-mega-current.png`
