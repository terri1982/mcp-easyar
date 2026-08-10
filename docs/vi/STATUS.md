# mcp-easyar Trạng thái hiện tại

Trang trạng thái này tóm tắt trạng thái hiện tại được chứng minh bằng bằng chứng của `mcp-easyar`.

Đây không phải là xác nhận hoàn thành cho mọi mẫu EasyAR. Mục tiêu hiện hoạt hiện chỉ bao gồm Theo dõi hình ảnh, CRS/Cloud Nhận dạng và Mega.

Một bản nhạc mẫu Chương trình mini WeChat bổ sung hiện đang được thêm cho EasyAR Mega và CRS/Cloud Nhận dạng. Việc triển khai hiện tại cung cấp khả năng kiểm tra cục bộ, nhập gói chính thức do người dùng tải xuống, kiểm tra khói DevTools, phân tích nhật ký, danh sách kiểm tra xác thực thiết bị thực, biểu mẫu kết quả chạy, báo cáo hoàn thành, trạng thái phạm vi Chương trình nhỏ vàhiện vật bàn giao; đây chưa phải là yêu cầu về việc xem trước, tải lên hoặc hoàn thành Chương trình nhỏ trên thiết bị thực.

## Bản phát hành hiện tại

Bản phát hành trước GitHub hiện tại: `v0.1.0-local-key.41`

Bản làm mới tài liệu tiếng Trung EasyAR chính thức: 2026-07-01. Siêu dữ liệu MCP hiện theo dõi Plugin EasyAR Sense Unity / dành cho Mega `4003.0.0`, gói hỗ trợ EasyAR Mega và Mega Studio `2.13.0`, gói tiện ích mở rộng thiết bị XR `4000.0.1`, EasyAR Sense Native `4.9.0` và Plugin chương trình mini EasyAR Mega WeChat `2.0.3`. Xem `docs/OFFICIAL_DOCS_2026-07-01.md`.

Cài đặt:

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.41/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## Tiến trình có trọng số bằng chứng

- Mục tiêu trong phạm vi được công bố: 100% cho tính năng Theo dõi hình ảnh đã được phê duyệt, CRS/Cloud Nhận dạng và mục tiêu Mega.
- Bằng chứng Mega Android: lượt cài đặt, khởi chạy thiết bị, khởi chạy EasyAR, tải Mega Block và bản địa hóa Mega/tracking bằng chứng nhật ký đã được ghi lại vào ngày 12 tháng 6 năm 2026. Giờ đây, một thẻ dự án Unity mới riêng biệt chứng minh tính năng nhập gói chính thức, xây dựng APK, cài đặt/startup, khởi tạo EasyAR, tính sẵn sàng của `Onsite` và nhật ký bản địa hóa thiết bị thực/trackingtín hiệu trong môi trường ánh xạ đã chọn. Thẻ EasyAR Sense `4003.0.0` / Mega `2.13.0` 2026-07 hiện chứng minh quy trình làm việc MegaBlockController hiện tại chống lại ARMall `涂意工位测试专用` trên Samsung `SM-S9010`, bao gồm cấp phép Sense khớp với tên gói, sửa chữa phần phụ thuộc XR chính thức, khởi động máy ảnh ARCore, `CodexTest01` Cấu hình khối vàbản địa hóa thành công được người dùng xác nhận. Thẻ tai nghe PICO 4 Ultra Enterprise hiện chứng minh APK bản dựng/install/startup, nguồn khung EasyAR Pico, PICO VST khởi động camera, truyền qua tai nghe có thể nhìn thấy và bản địa hóa Mega `Found` đối với khối văn phòng đã chọn. Giờ đây, thẻ Theo dõi chuyển động của Android chứng tỏ bản dựng mẫu hoàn toàn chỉ dành cho máy ảnh vớiGiao diện người dùng/diagnostics bị ẩn, đầu vào camera ARCore, EasyAR MotionTracker và vị trí Panda tự động trên lần truy cập mặt phẳng ngang.
- Khả năng sử dụng công khai MVP khóa cục bộ: khoảng 98%

Các tỷ lệ phần trăm này là ước tính dựa trên bằng chứng. Bản phát hành trước đã xuất bản bao gồm mục tiêu khóa cục bộ gồm ba mẫu: Theo dõi hình ảnh, CRS/Cloud Nhận dạng và Mega. Mục tiêu API chính thức sản xuất rộng hơn vẫn chưa hoàn thành.

## What Is Ready

- Việc phân phối tarball phát hành GitHub đang hoạt động.
- `easyar-mcp` và `easyar-mcp-check` các tệp nhị phân gói có sẵn.
- Codex, Claude Desktop và việc tạo cấu hình máy khách MCP chung đang được triển khai.
- Hướng dẫn chấp nhận khách hàng có sẵn thông qua `docs/CLIENT_ACCEPTANCE.md` và `easyar://client/acceptance`.
- Hướng dẫn chấp nhận dự án Fresh Unity có sẵn thông qua `docs/FRESH_PROJECT_ACCEPTANCE.md` và `easyar://acceptance/fresh-project`.
- Triển khai khóa cục bộ mà không cần thu thập mật khẩu trang web EasyAR hoặc khóa bí mật trong cuộc trò chuyện.
- Theo dõi hình ảnh tập trung, CRS/Cloud Tính năng nhận dạng và quy trình làm việc Mega được triển khai hoặc đang được phát triển.
- Có bằng chứng an toàn về Android được cam kết cho tính năng Theo dõi hình ảnh, CRS/Cloud Nhận dạng và phạm vi mục tiêu Mega.
- Bằng chứng thiết bị thực Mega bao gồm APK cài đặt/startup, khởi tạo EasyAR Sense, tải Mega Block đã chọn và các tín hiệu `[MLOC]` `kMapTracking` / `NCam_Verified results`. Bằng chứng Mega của dự án mới hiện cũng bao gồm các tín hiệu bản địa hóa/tracking chẳng hạn như `successfully localized against ADF`. Hiện đã có thẻ Android 4003.0.0 / MegaBlockControllercũng bao gồm thư viện bản địa hóa đám mây `涂意工位测试专用`. PICO 4 Bằng chứng Ultra Enterprise sử dụng đường dẫn tai nghe được ghi lại với `PicoFrameSource` và `LocationInputMode=Onsite`; mọi cảnh báo chẩn đoán của EasyAR Simulator đều cho biết cảnh vẫn cần được chuyển sang Tại chỗ và xây dựng lại.
- Hỗ trợ lập trình dự án Unity hiện có cho các hoạt động kiểm tra trước tập trung, kiểm tra hiện trường, trình tự chạy, xác thực thiết bị, phân tích nhật ký, lập kế hoạch C#, viết kịch bản, đánh giá và chuyển giao các tạo phẩm.
- Hỗ trợ Chương trình WeChat Mini hiện bao gồm siêu dữ liệu mẫu tập trung cho `wechat-mega` và `wechat-crs`, kiểm tra dự án, phát hiện Công cụ dành cho nhà phát triển WeChat CLI, biểu mẫu cấu hình cục bộ, nhập gói chính thức do người dùng tải xuống, kiểm tra khói DevTools, phân tích nhật ký, báo cáo trước, trình tự chạy, danh sách kiểm tra xác thực thiết bị thực, kết quả chạy,báo cáo hoàn thành, trạng thái phạm vi Chương trình nhỏ, tài nguyên `easyar://samples/wechat-miniprogram` và tài nguyên chấp nhận `easyar://acceptance/wechat-miniprogram`.
- Bản tiếng Nhật và tiếng Việt hiện phản ánh đầy đủ cả 24 tài liệu Markdown nguồn công khai, gồm nghiệm thu, API chính thức, kế hoạch, khắc phục sự cố, WeChat Mini Program, ghi chú phát hành và release evidence. Kiểm tra cục bộ và kiểm tra gói sẽ từ chối bản dịch thiếu trang, bị rút gọn, liên kết ngược về tiếng Anh hoặc làm thay đổi nội dung kỹ thuật.

## Phạm vi hoạt động

Mẫu mục tiêu hiện tại:

- Theo dõi hình ảnh
- CRS/Cloud Nhận dạng
- Mega

Nằm ngoài phạm vi của mục tiêu hiện tại:

- Xin chào AR
- Theo dõi bề mặt
- Các mẫu Plugin EasyAR Sense Unity chính thức bổ sung

Các mẫu Chương trình nhỏ bổ sung ngoài `wechat-mega` và `wechat-crs` nằm ngoài phạm vi cho đến khi được yêu cầu.

## Công việc còn lại đã biết

- Giữ tính năng theo dõi hình ảnh, CRS/Cloud Nhận dạng và bằng chứng Mega, mới tài liệu chấp nhận dự án và phát hành các thử nghiệm khói phù hợp với Bản phát hành GitHub mới nhất.
- Quyết định chính sách xuất bản npm cho bản phát hành trước so với bản phát hành chính thức.
- Luôn cập nhật bằng chứng Theo dõi hình ảnh, CRS/Cloud Nhận dạng, Mega và Theo dõi chuyển động khi các phiên bản Unity được hỗ trợ hoặc nền tảng mục tiêu mở rộng.
- Tiếp tục tăng cường quy trình lập trình Unity với nhiều trường hợp dự án thực tế hơn.
- Ghi lại bản xem trước Công cụ dành cho nhà phát triển WeChat/upload và bằng chứng thiết bị thực cho `wechat-mega` và `wechat-crs` sau khi đăng nhập vào các gói mẫu chính thức tại địa phương DevTools và các dự án Chương trình nhỏ thử nghiệm đều có sẵn.
- Luôn cập nhật bằng chứng Android 4003.0.0 / MegaBlockController khi gói Mega chính thức hoặc tài liệu bản địa hóa đám mây ARMall thay đổi.

## Ranh giới an toàn

Bản phát hành hiện tại sử dụng đường dẫn khóa cục bộ MVP:

1. Người dùng đăng ký, đăng nhập, tải xuống các gói chính thức và tạo khóa trên trang web EasyAR chính thức trong trình duyệt của riêng họ.
2. Người dùng cài đặt Plugin EasyAR Sense Unity chính thức.
3. Người dùng điền cục bộ vào các trường giấy phép và Nhận dạng đám mây trong dự án Unity.
4. MCP chỉ xác thực sự hiện diện đã được loại bỏ và hướng dẫn tự động hóa Unity.

MCP không được yêu cầu người dùng dán mật khẩu trang web EasyAR, mã xác minh, khóa cấp phép, Khóa nhận dạng đám mây API Khóa/API Bí mật, `appKey` hoặc `appSecret` vào cuộc trò chuyện.

## Hành động tiếp theo tốt nhất

1. Giữ tarball và tài liệu của Bản phát hành GitHub phù hợp với mọi bản phát hành trước công khai.
2. Kiểm tra thiết lập Codex và Claude Desktop mới bằng cách sử dụng `docs/CLIENT_ACCEPTANCE.md` và `docs/FRESH_PROJECT_ACCEPTANCE.md`.
3. Chạy một thẻ cài đặt sạch/build/device khác để Theo dõi hình ảnh, CRS/Cloud Nhận dạng và Mega khi dự án Unity thay đổi.
4. Quyết định xem có cần xuất bản npm cho khóa cục bộ có phạm vi này MVP hay không.
