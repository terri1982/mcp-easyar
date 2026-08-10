# Bằng chứng bản địa hóa và khởi động Android của Dự án Mega Fresh

Ngày: 2026-06-12

Phạm vi: dự án Unity mới Xác thực bản địa hóa và khởi động mẫu Mega trên Android, Unity `2022.3.62f3`.

Chỉ bằng chứng an toàn. Bản tóm tắt này có chủ ý loại trừ mật khẩu trang web EasyAR, mã xác minh, khóa cấp phép, API Khóa/API Giá trị bí mật, appKey/appSecret, khóa ký, APK nhị phân, gói Unity và nhật ký riêng tư thô.

## Thiết lập dự án mới

- Một dự án Unity mới đã được tạo để xác minh thay vì sử dụng lại Tiantan trước đó project.
- Các gói tải xuống chính thức đã được sử dụng:
 - `com.easyar.sense` `4002.0.0+4956.1ec38c1ad`
 - `com.easyar.mega` `2.12.6+4956.1ec38c1ad`
- Mẫu `MegaBlock_Basic` chính thức đã được sao chép từ bộ đệm của gói EasyAR vào dự án.
- Gói Android tên được lấy từ bản ghi trung tâm phát triển EasyAR đã đăng nhập: `com.myarcommon.myar`.
- AppID bản địa hóa đám mây lớn được sử dụng cho thư viện đã chọn: `ab70931ebdd2488c9b7883bab473ca50`.
- Thư viện đã chọn/materials được xác định là:
 - Thư viện bản địa hóa đám mây: `视辰信息科技(上海)有限公司`
 - Mega Block storage: `ARMallBlock9.0`
 - Tên Mega Block: `大厅+办公室+阳台+GPS+0716`
- Cảnh mẫu đã được chuyển từ chế độ `Simulator` sang chế độ `Onsite` để xác thực thiết bị thực.
- Cảnh `MegaBlock_Basic` chính thức đã được điều chỉnh cho dự án mới nên `BlockHolder.BlockRootSource` sử dụng `Internal`. Điều này ngăn chặn lỗi nghiêm trọng trong thời gian chạy `Block root not exist ... (BlockRootSource = External)` khi Mega Block được bản địa hóa nhưng không có BlockRoot bên ngoài nào được chỉ định trong trình chỉnh sửa.

## Tín hiệu đã được xác minh

- Bản dựng Android APK đã thành công.
- APK được cài đặt thành công trên thiết bị Android được kết nối.
- Thiết bị kiểm tra được phát hiện thông qua ADB: Samsung `SM_S9210`, serial `RFCY4161BTX`.
- Đã khởi chạy ứng dụng thành công với quy trình vẫn hoạt động sau khi khởi động.
- Đã cấp quyền truy cập vào máy ảnh và vị trí thông qua ADB trước khi khởi chạy.
- EasyAR Sense đã khởi chạy thành công trên thiết bị:
 - `EasyAR Sense Unity Plugin Version 4002.0.0+4956.1ec38c1ad`
 - `EasyAR Sense CommunityFull (Android-arm64) Version 4.9.0.11908-e5f122cc4`
- Không có trình chặn khởi động trước:
 - không có `License Key is empty`
 - không có `Invalid Key`
 - không quan sát thấy `401` hoặc `400` lỗi dịch vụ trong cửa sổ khởi động
 - không gặp sự cố khi chạy Android
 - không `Block root not exist`
 - không `Session Broken: RunningFailed`
- Bản dựng thiết bị thực không còn phát ra cảnh báo `Mega is running in Simulator mode` sau khi chuyển `locationInputMode` sang `Onsite`.
- ARCore/camera nhật ký khởi động đã hiển thị hoạt động trực tiếp của khung hình camera.

## Bằng chứng bản địa hóa

Dự án mới sau đó đã được thử nghiệm trên cùng một thiết bị Android trong khi camera của điện thoại hướng vào cảnh văn phòng được lập bản đồ đã chọn. Nhật ký thiết bị và chẩn đoán trên màn hình cho gói `com.myarcommon.myar` đã ghi lại các tín hiệu theo dõi và định vị lặp lại:

- `[VioEstimator] Vio start up successful initialization`
- `[MLOC] NCam_Verified results of kLocalizationFullMap`
- `World pose node changing to MapId:315886d2-3094-27d0-8dbf-1686cdc2c8f9`
- `[MLOC] NCam_Verified results of kMapTracking`
- `[M] [Localizer] - loaded map 315886d1-3094-27d0-8c86-ec6f18cb4d51`
- `[M] ADF 315886d2-3094-27d0-8dbf-1686cdc2c8f9 successfully localized against ADF 315886d1-3094-27d0-8c86-ec6f18cb4d51`
- Chẩn đoán mẫu trên màn hình hiển thị `Block: 大厅+办公室+阳台+GPS+0716 (a21e8f20-e1b9-4ac1-a5ed-335e74697e6a)` và trạng thái thiết bị liên quan đến khối được bản địa hóa.

Không có giấy phép không hợp lệ, AppID không hợp lệ, trái phép, bị cấm, `Block root not exist`, `Session Broken` hoặc trình chặn sự cố thời gian chạy Android đã được quan sát thấy trong cửa sổ bản địa hóa thành công.

## Giới hạn hiện tại

Bằng chứng này chứng minh các tín hiệu nhật ký APK dự án mới, khởi tạo EasyAR, tính sẵn sàng của chế độ tại chỗ, bản địa hóa Mega trên thiết bị thực/tracking tín hiệu nhật ký và Chặn bản địa hóa trên màn hình nhận dạng cho môi trường được ánh xạ đã chọn. Đây vẫn là bản tóm tắt bằng chứng cục bộ: nhật ký thô, ảnh chụp màn hình, APK, tệp gói Unity và cài đặt Unity mang bí mật nằm bên ngoài kho lưu trữ.

## Tệp bằng chứng cục bộ

Nhật ký thô và dự án Unity vẫn cục bộ và không nên được cam kết vì các dự án Unity/EasyAR có thể chứa thông tin chi tiết về tài khoản hoặc môi trường riêng tư.

- Dự án Fresh Unity: `/Users/tuyi/UnityProjects/EasyARMegaVerification`
- Nhật ký bản dựng: `/Users/tuyi/UnityProjects/EasyARMegaVerification/Logs/build-android-mega-onsite.log`
- Nhật ký bản dựng sửa lỗi BlockRoot cuối cùng: `/Users/tuyi/UnityProjects/EasyARMegaVerification/Logs/build-android-mega-blockroot-internal.log`
- Nhật ký bản địa hóa thiết bị cuối cùng: `/Users/tuyi/UnityProjects/EasyARMegaVerification/Logs/mega-current-block-debug-20260612-123117.log`
- Ảnh chụp màn hình thiết bị cuối cùng: `/Users/tuyi/UnityProjects/EasyARMegaVerification/Logs/mega-current-block-debug-20260612-123120.png`
- Đường dẫn APK: `/Users/tuyi/UnityProjects/EasyARMegaVerification/Builds/EasyARMegaVerification.apk`
