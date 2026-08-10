# Làm mới tài liệu chính thức của EasyAR - 2026-07-01

Nguồn: <https://www.easyar.cn/doc/zh-cn/>

Việc làm mới siêu dữ liệu MCP này dựa trên quá trình thu thập thông tin đầy đủ của sơ đồ trang web tài liệu EasyAR chính thức của Trung Quốc vào ngày 2026-07-01. Quá trình thu thập thông tin bao gồm 819 trang:

- Đám mây API: 19 trang
- Bản địa API: 166 trang
- Unity API: 239 trang
- WeChat API: 52 trang
- Phát triển hướng dẫn: 247 trang về các chủ đề Unity, Native, WeChat, Web, Mega và tai nghe
- Hướng dẫn người dùng Mega: 95 trang
- Chỉ mục tài liệu cấp cao nhất: 1 trang

## Phiên bản chính thức hiện tại

- Plugin EasyAR Sense Unity: `4003.0.0`
- EasyAR Sense Unity Plugin cho Mega: `4003.0.0`
- Gói hỗ trợ EasyAR Mega: `2.13.0`
- EasyAR Mega Studio (Unity): `2.13.0`
- Tiện ích mở rộng plugin EasyAR Sense Unity / gói tiện ích mở rộng thiết bị XR: `4000.0.1`
- EasyAR Sense Native: `4.9.0`
- EasyAR Mega WeChat Mini Program Plugin: `2.0.3`

## MCP-Những thay đổi liên quan

- Unity Plugin `4003.0.0` giới thiệu quy trình phát triển Mega mới hơn tập trung vào `MegaBlockController`.
- Các giả định Legacy Unity Mega cần thận trọng: các nhóm nút do Mega Studio tạo, các tùy chọn cấu hình nhiều khối và Thiết lập tập trung vào BlockRoot không còn là quy trình làm việc chính hiện tại nữa.
- `com.easyar.mega` hiện là gói hỗ trợ Mega; Mega Studio được chia thành `com.easyar.mega.studio`.
- Mega Studio `2.13.0` không còn hỗ trợ quy trình phát triển Unity cũ và xóa các công cụ Block Viewer cũ hơn.
- Các tài liệu hiện bao gồm hướng dẫn tai nghe mở rộng cho Apple Vision Pro, XREAL Air2 Ultra, PICO 4 Ultra Enterprise, Rokid AR Studio và các gói mở rộng tai nghe của bên thứ ba.
- Tài liệu về hoạt động của Mega hiện bao gồm nổi bật việc cập nhật cảnh, nâng cấp định dạng, di chuyển sang dịch vụ lập bản đồ mới hơn, nhập vị trí tại chỗ/simulator, thu thập dữ liệu và khắc phục sự cố.
- Native Sense vẫn ở mức `4.9.0`; WeChat Mega vẫn ở mức `2.0.3`, vì vậy MCP không nên phát minh ra phiên bản mới hơn cho những bản nhạc đó.

## Tài liệu tham khảo chính thức chính

- Ghi chú phát hành Unity: <https://www.easyar.cn/doc/zh-cn/develop/unity/release-notes/release-notes.html>
- Ghi chú phát hành gốc: <https://www.easyar.cn/doc/zh-cn/develop/native/release-notes/release-notes.html>
- Ghi chú phát hành Mega Studio: <https://www.easyar.cn/doc/zh-cn/mega/reference/studio-unity/release-notes.html>
- Ghi chú phát hành WeChat Mega: <https://www.easyar.cn/doc/zh-cn/develop/wechat/mega/release-notes.html>
- Tổng quan về tai nghe: <https://www.easyar.cn/doc/zh-cn/develop/headsets/headsets.html>
- Hỗ trợ tai nghe Unity: <https://www.easyar.cn/doc/zh-cn/develop/unity/headsets/headsets.html>
- Khởi động nhanh Unity Mega: <https://www.easyar.cn/doc/zh-cn/develop/unity/mega/quickstart.html>
- Bắt đầu nhanh WeChat Mega: <https://www.easyar.cn/doc/zh-cn/develop/wechat/mega/quickstart.html>
- Cập nhật cảnh lớn: <https://www.easyar.cn/doc/zh-cn/mega/scene-update/intro.html>
- Nâng cấp định dạng lớn: <https://www.easyar.cn/doc/zh-cn/mega/format-upgrade/intro.html>
- Di chuyển lớn: <https://www.easyar.cn/doc/zh-cn/mega/migration/intro.html>
