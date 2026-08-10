# Tóm tắt bằng chứng thiết bị Android Mega

Ngày: 2026-06-12

Phạm vi: `mega` mẫu trên Android, Unity `2022.3.62f3`.

Chỉ bằng chứng an toàn. Bản tóm tắt này có chủ ý loại trừ mật khẩu trang web EasyAR, mã xác minh, khóa cấp phép, API KEY/API Nhận dạng đám mây, appKey/appSecret, khóa ký, tệp nhị phân APK, gói Unity và nhật ký riêng tư thô.

## Tín hiệu đã xác minh

- Tên gói Android được lấy từ bản ghi trung tâm phát triển EasyAR đã đăng nhập: `com.myarcommon.myar`.
- APK đã xác minh siêu dữ liệu `package: name='com.myarcommon.myar'`.
- Đã phát hiện thiết bị thử nghiệm thông qua ADB: Samsung `SM_S9210`, serial `RFCY4161BTX`.
- APK đã cài đặt thành công trên thiết bị Android thực.
- Các quyền về thời gian chạy máy ảnh, vị trí, mạng và âm thanh đã được cấp nếu có.
- Cài đặt EasyAR đã tải trên thiết bị.
- EasyAR Sense đã khởi chạy thành công; trình chặn `Invalid Key: {No matched Package Name}` trước đó đã bị xóa.
- Khối Mega được tải từ `ARMallBlock9.0`: `大厅+办公室+阳台+GPS+0716`.
- Trình chặn trình đổ bóng lớp phủ máy ảnh EasyAR đã bị xóa bằng cách bao gồm `EasyAR/CameraImage_*` trình đổ bóng trong Unity `Always Included Shaders`.
- Nhật ký thiết bị dài cho thấy bản địa hóa Mega/tracking hoạt động với `[MLOC]`, `kLocalizationFullMap`, `kMapTracking` và lặp lại `NCam_Verified results`.

## Theo dõi dự án mới

Một thẻ dự án Unity mới riêng biệt cũng được ghi lại sau khi người dùng yêu cầu không tiếp tục dự án Tiantan. Xem `docs/release-evidence/mega-fresh-project-android-startup.md`.

Vé dự án mới đó hiện chứng minh quá trình nhập gói chính thức, bản dựng APK, cài đặt trên thiết bị thực/startup, khởi tạo EasyAR Sense, tính sẵn sàng của chế độ `Onsite`, độ ổn định khi chạy `BlockHolder.BlockRootSource=Internal` và tín hiệu nhật ký Mega localization/tracking của thiết bị thực từ môi trường được ánh xạ đã chọn. Khối được bản địa hóa được hiển thị bằng chẩn đoán trên màn hình là `大厅+办公室+阳台+GPS+0716` với ID khối `a21e8f20-e1b9-4ac1-a5ed-335e74697e6a`.

## Tệp bằng chứng cục bộ

Nhật ký thô vẫn ở cục bộ và không được cam kết vì các dự án Unity/EasyAR có thể chứa thông tin chi tiết về tài khoản hoặc môi trường riêng tư.

- Nhật ký bản dựng: `/Users/tuyi/UnityProjects/TiantanARSpatial/Logs/mega-android-build-shader-fix-2.log`
- Nhật ký thiết bị: `/Users/tuyi/UnityProjects/TiantanARSpatial/Logs/mega-device-logcat-20260612-shader-fix-long.log`

## Đã xóa các trình chặn trước đó

- Tên gói Android mặc định của Unity đã được thay thế bằng tên gói cổng EasyAR.
- Giấy phép EasyAR không khớp đã được khắc phục bằng cách sử dụng giấy phép cổng thông tin cho tên gói đó trong dự án Unity cục bộ.
- `EasyARSettings is not found` đã được sửa bằng cách tải trước `Assets/XR/Settings/EasyAR Settings.asset`.
- `Could not find EasyAR shader for video overlay` đã được sửa bằng cách thêm tất cả các trình đổ bóng hình ảnh máy ảnh EasyAR cần thiết vào các trình đổ bóng luôn được bao gồm trước khi xây dựng.
