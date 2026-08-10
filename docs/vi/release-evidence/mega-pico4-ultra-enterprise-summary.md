# Tóm tắt bằng chứng Mega trên PICO 4 Ultra Enterprise

Ngày: 12-06-2026

Phạm vi: `mega` mẫu trên PICO 4 Ultra Enterprise, Unity `2022.3.62f3`.

Chỉ bằng chứng an toàn. Bản tóm tắt này có chủ ý loại trừ mật khẩu trang web EasyAR, mã xác minh, khóa cấp phép, API Khóa/API Giá trị bí mật, appKey/appSecret, khóa ký, APK nhị phân, gói Unity và nhật ký riêng tư thô.

## Đường cơ sở đã được xác minh

- Unity: `2022.3.62f3`
- Tên gói Android: `com.easyar.mega.xrtest`
- Plugin EasyAR Sense Unity: `4002.0.0+4956.1ec38c1ad`
- EasyAR Mega: `2.12.6+4956.1ec38c1ad`
- Gói mở rộng thiết bị EasyAR Unity XR: `4000.0.0`
- PICO Tích hợp Unity SDK: `3.4.0`
- Loại giấy phép EasyAR bắt buộc: `4.x XR正式版`
- Thiết bị: PICO 4 Ultra Enterprise
- Nguồn khung EasyAR: `PicoFrameSource`
- Thư viện bản địa hóa Mega cloud/material: `视辰信息科技(上海)有限公司`
- Mega Block được bản địa hóa: `大厅+办公室+阳台+GPS+0716`

## Tín hiệu đã được xác minh

- Một dự án Unity mới đã được tạo để xác thực tai nghe PICO thay vì sử dụng lại dự án Tiantan hoặc điện thoại Android trước đó.
- Bản dựng APK đã thành công từ chế độ hàng loạt Unity.
- APK được cài đặt thành công trên thiết bị PICO được kết nối thông qua ADB.
- Ứng dụng đã khởi chạy dưới dạng gói `com.easyar.mega.xrtest`.
- EasyAR Sense đã khởi chạy trên tai nghe.
- Đã chạy kiểm tra tính khả dụng của nguồn khung EasyAR Pico.
- PICO VST khởi động máy ảnh thành công; nhật ký hiển thị `startPreview done, RGB=[0]`.
- Tai nghe vẫn hoạt động và ứng dụng giữ cửa sổ nền trước trong khi chụp thành công.
- Chẩn đoán EasyAR trên màn hình hiển thị:
 - `Pico (True) received 900+`
 - `Mega Block: min=FiveDof, Simulator`
 - `1222.263, Found`
 - `Block: 大厅+办公室+阳台+GPS+0716 (...)`
- Người dùng đã xác nhận PICO chuyển qua tai nghe/real-world nền hiển thị trong tai nghe.

## Ghi chú nhập vị trí

Đường dẫn PICO hiện sử dụng Mega `LocationInputMode=Onsite`, phù hợp với điện thoại Android/tablet và xác thực XREAL. Nếu tai nghe hiển thị:

```text
Mega is running in Simulator mode with simulated or no location input.
```

cảnh vẫn ở chế độ đầu vào Trình mô phỏng/non-onsite và phải được chuyển sang Tại chỗ trước khi xây dựng lại APK.

## Lưu ý ảnh chụp màn hình

ADB `screencap` có thể bỏ lỡ PICO VST lớp bố cục chuyển qua. Bằng chứng kho lưu trữ phải coi tính năng chuyển qua có thể nhìn thấy bằng tai nghe cùng với nhật ký EasyAR/PICO và chẩn đoán Mega `Found` làm tín hiệu xác thực thay vì yêu cầu `screencap` hiển thị nền trong thế giới thực.

## Tệp bằng chứng cục bộ

Nhật ký thô và dự án Unity vẫn mang tính cục bộ và không nên được cam kết vì các dự án Unity/EasyAR có thể chứa tài khoản hoặc môi trường riêng tư chi tiết.

- Dự án Fresh Unity: `/Users/tuyi/UnityProjects/xrtest`
- Nhật ký bản dựng: `/Users/tuyi/UnityProjects/xrtest/Logs/build-pico-mega-simulator-vst-bootstrap-fixed.log`
- Nhật ký chạy PICO tập trung: `/Users/tuyi/UnityProjects/xrtest/Logs/pico-mega-simulator-vst-bootstrap-fixed-focused-20260612.log`
- Tại chỗ mới nhất PICO APK: `/Users/tuyi/UnityProjects/xrtest/Builds/xrtest-pico-mega-onsite.apk`
- Ảnh chụp màn hình tai nghe đang hoạt động: `/Users/tuyi/UnityProjects/xrtest/Logs/pico_easyar_active.png`
- APK đường dẫn: `/Users/tuyi/UnityProjects/xrtest/Builds/xrtest-pico-mega.apk`
