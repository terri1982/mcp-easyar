# Bằng chứng Motion Tracking Camera Panda trên Android

Ngày: 19-06-2026

Phạm vi: Mẫu theo dõi chuyển động EasyAR Sense Unity trên Android, Unity `2022.3.62f3`.

Chỉ bằng chứng an toàn. Bản tóm tắt này có chủ ý loại trừ khóa cấp phép EasyAR, khóa ký, tệp nhị phân APK, ảnh chụp màn hình từ không gian riêng tư, tải trọng gói Unity và nhật ký riêng tư thô.

## Kết quả đã được xác minh

- Đã xây dựng một Android APK từ mẫu theo dõi chuyển động của Plugin EasyAR Sense Unity.
- Đã cài đặt và khởi động nguội APK trên Samsung thật `SM-S9210` Thiết bị Android.
- Hình ảnh camera được hiển thị chính xác trong ứng dụng.
- Tất cả giao diện người dùng mẫu, các nút, menu thả xuống nguồn khung, kết xuất chẩn đoán màu vàng EasyAR và hình mờ Unity `Development Build` đều bị ẩn.
- Thời gian chạy sử dụng tính năng theo dõi chuyển động EasyAR với đầu vào máy ảnh ARCore.
- Cảnh đã được thay đổi để tự động đặt mẫu Tìm thấy đối tượng `EasyARPanda` sau khi chạm vào mặt phẳng ngang.
- APK bắt đầu mà không có `Invalid Key`, `license invalid`, `EasyARSettings is not found`, `Could not find EasyAR shader`, `FATAL EXCEPTION` hoặc `Unable to start AR Session`.

## Lưu ý triển khai

- Tên gói Android: `com.easyar.mega.xrtest`.
- Nội dung cài đặt EasyAR đã được đăng ký thông qua `EditorBuildSettings.AddConfigObject("EasyAR.Settings", ...)` và được thêm vào nội dung tải trước của Unity.
- Trình đổ bóng hình ảnh máy ảnh EasyAR đã được buộc vào Unity `Always Included Shaders` trước khi xây dựng:
 - `EasyAR/CameraImage_RGB`
 - `EasyAR/CameraImage_BGR`
 - `EasyAR/CameraImage_Gray`
 - `EasyAR/CameraImage_YUV_I420_YV12`
 - `EasyAR/CameraImage_YUV_NV12`
 - `EasyAR/CameraImage_YUV_NV21`
- Thời gian chạy mẫu hiện ẩn tất cả các đối tượng `Canvas` khi khởi động.
- `DiagnosticsController.MessageOutput.SessionDump` được đặt thành `None` để chặn lớp phủ kết xuất phiên EasyAR màu vàng.
- Các tùy chọn xây dựng đã được thay đổi từ phát triển/debugging thành `BuildOptions.None`.
- Thứ tự nguồn khung ưu tiên EasyAR `MotionTrackerFrameSource` nên thử nghiệm nhấn mặt phẳng ngang có sẵn cho vị trí Panda tự động.

## Tệp bằng chứng cục bộ

Đầu ra bản dựng thô, APK và ảnh chụp màn hình vẫn cục bộ và không được cam kết.

- Dự án Unity: `/private/tmp/easyar-motion-minimal-20260619`
- APK: `/private/tmp/easyar-motion-minimal-20260619/Builds/easyar-motion-tracking.apk`
- Nhật ký bản dựng cuối cùng: `/private/tmp/easyar-motion-minimal-20260619/build-no-debug-overlay.log`
- Ảnh chụp màn hình cuối cùng: `/private/tmp/easyar-no-debug-overlay.png`

## Tín hiệu bản dựng cuối cùng

- `Build Finished, Result: Success.`
- APK kích thước: `668044287` byte, được hiển thị bởi Finder/ls khoảng `45M`.
- ADB kết quả cài đặt: `Success`.
- Kiểm tra tiêu cực trong thời gian chạy không tìm thấy lỗi khởi động, giấy phép, cài đặt hoặc đổ bóng nghiêm trọng nào.

## Đã xóa các trình chặn trước đó

- Gói EasyAR/license không khớp đã được khắc phục bằng cách sử dụng `com.easyar.mega.xrtest`.
- `EasyARSettings is not found` đã được sửa bằng cách tải trước và đăng ký nội dung cài đặt.
- `Could not find EasyAR shader for video overlay` đã được sửa bằng cách đưa tất cả trình đổ bóng hình ảnh máy ảnh EasyAR vào bản dựng.
- Đã sửa lỗi giao diện người dùng gỡ lỗi hiển thị bằng cách tắt các canvas mẫu và đầu ra kết xuất phiên EasyAR.
- Hình mờ Unity `Development Build` đã bị xóa bằng cách tạo một APK không phát triển.
