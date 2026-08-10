# mcp-easyar local-key MVP

Bản phát hành trước này là đường dẫn phân phối GitHub hiện tại cho `mcp-easyar`.

Phát hành: `v0.1.0-local-key.41`

## Điểm nổi bật của bản phát hành

- Bổ sung bản tiếng Nhật và tiếng Việt đầy đủ cho cả 24 tài liệu Markdown nguồn công khai, cùng mục lục bản địa hóa và README cấp cao nhất.
- Trước khi phát hành, hệ thống kiểm tra tính đồng nhất của danh mục tài liệu, độ đầy đủ của bản dịch, code block không thay đổi, liên kết bản địa hóa hợp lệ và tính đầy đủ của từng ngôn ngữ trong gói phát hành.
- Thêm giới hạn Unity CLI `1.0.0-beta.3` preflight, nhập mẫu chính thức, chuẩn bị, cấu hình, xác thực và quy trình xây dựng Android.
- Thêm cấu hình điện thoại Android và XREAL với các bản dựng cảnh tập trung và phát hành đầu ra APK.
- Xác thực XREAL SDK `3.1.0+`, sự hiện diện của giấy phép máy ảnh doanh nghiệp, Trình quản lý phiên gốc, XREAL Trình tải XR, OpenGL ES 3 và Android API 29 trước khi xây dựng.
- Ghi lại thẻ Theo dõi hình ảnh S22 của Samsung đối với thẻ tên công ty và thẻ bản địa hóa XREAL Air 2 Ultra Mega với các lệnh gọi lại `Found` lặp lại.
- Giữ bí mật các tệp giấy phép, APK, số nhận dạng bản đồ riêng tư và nhật ký riêng tư thô bên ngoài gói đã xuất bản.

## Hiện tại điều gì đang có hiệu quả

- Lượt cài đặt từ tarball Bản phát hành GitHub với `npm install -g`.
- Hiển thị các tệp nhị phân của gói `easyar-mcp` và `easyar-mcp-check`.
- Kết nối Codex, Claude và các máy khách stdio MCP khác với các công cụ quy trình làm việc EasyAR Unity.
- Hướng dẫn người dùng EasyAR lần đầu hoặc đã đăng ký thông qua đăng ký chỉ trên trình duyệt/login/download/key thiết lập.
- Giữ mật khẩu trang web EasyAR, mã xác minh, mã thông báo tài khoản, khóa cấp phép, API KEY/API Bí mật, appKey và appSecret ngoài cuộc trò chuyện.
- Hỗ trợ mục tiêu chạy qua mẫu Unity trong phạm vi:
- Theo dõi hình ảnh
- CRS/Cloud Nhận dạng
- Mega
- Bao gồm bằng chứng cam kết phát hành Android an toàn cho phạm vi tập trung, bao gồm Mega APK cài đặt/startup và bằng chứng theo dõi bản địa hóa.
- Thêm xác thực tính sẵn sàng của Mega BlockRoot cho cảnh mẫu chính thức và ghi lại khối được bản địa hóa thành công `大厅+办公室+阳台+GPS+0716`.
- Lời nhắc theo dõi hình ảnh, CRS/Cloud Nhận dạng và tập trung kết thúc giờ đây sẽ yêu cầu khách hàng đọc `easyar://acceptance/fresh-project` trước.
- Thêm `easyar-run-wechat-miniprogram` để khách hàng MCP có thể chạy chuyển giao `wechat-mega` và `wechat-crs` tập trung mà không cần thu thập bí mật của người dùng trong cuộc trò chuyện.
- Thêm các công cụ trạng thái chạy qua Chương trình nhỏ để người dùng có thể tạo lại một báo cáo cuộc gọi tiếp theo sau khi nhập gói chính thức, kiểm tra DevTools hoặc thay đổi bằng chứng trên thiết bị thực.
- Thêm công cụ giàn giáo không gian làm việc Chương trình nhỏ để tạo lớp vỏ dự án an toàn trước khi nhập gói EasyAR chính thức do người dùng tải xuống.
- Nhập gói chính thức của Chương trình nhỏ chấp nhận thư mục được giải nén hoặc `.zip` đã tải xuống, xác thực đường dẫn mục nhập zip trước khi giải nén và vẫn bỏ qua cấu hình riêng tư và các tệp giống bí mật.
- Trạng thái máy chủ, khởi động nhanh, hướng dẫn cài đặt và thiết lập máy khách được tạo hiện hướng người dùng mới đến cùng một tài nguyên chấp nhận dự án mới trước khi tự động hóa Unity.
- Cung cấp các công cụ hỗ trợ dự án Unity cho cấu hình cục bộ, preflight, hướng dẫn nhập, xây dựng/run trình tự, chẩn đoán nhật ký, lập kế hoạch C#, viết tập lệnh và các gói hỗ trợ.

## Cài đặt

Sử dụng Node.js 20 hoặc mới hơn:

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.41/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

Sau đó, định cấu hình ứng dụng khách MCP bằng lệnh:

```bash
easyar-mcp
```

Chi tiết khác: `docs/install-from-github-release.md`.

## MCP Cuộc gọi đầu tiên

```text
easyar_server_status
easyar_authorization_strategy preferredMode=auto sampleId=cloud-recognition platform=android
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_write_local_config_handoff projectPath=/path/to/UnityProject accountStage=logged-in sampleId=cloud-recognition platform=android
easyar_validate_local_config projectPath=/path/to/UnityProject sampleId=cloud-recognition
easyar_next_workflow_step projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
```

Để theo dõi hình ảnh, hãy chuyển `sampleId` thành `image-tracking`. Đối với Mega, hãy chuyển `sampleId` sang `mega` và sử dụng tên gói cổng thông tin EasyAR, giấy phép cục bộ và Mega Block đã chọn từ phiên EasyAR/Mega Studio đã đăng nhập của chính người dùng.

## Local-Key Boundary

Bản phát hành này có chủ ý sử dụng đường dẫn khóa cục bộ MVP:

1. Người dùng đăng ký/logs bằng/downloads/creates khóa trên trang web EasyAR chính thức trong trình duyệt.
2. Người dùng cài đặt Plugin EasyAR Sense Unity chính thức.
3. Người dùng điền cục bộ vào các trường Giấy phép EasyAR và Nhận dạng đám mây trong dự án Unity.
4. MCP chỉ xác thực sự hiện diện cục bộ đã được biên tập lại và hướng dẫn tự động hóa Unity.

Không cần đăng nhập trang web trong thời gian chạy Unity sau khi plugin chính thức và khóa cục bộ được định cấu hình.

## Chưa được bao gồm

- Tài khoản EasyAR chính thức/license/download/cloud chưa kết nối API quyền.
- xuất bản đăng ký npm chưa được bật chưa.
- Xin chào AR, Theo dõi bề mặt và các mẫu khác nằm ngoài phạm vi của mục tiêu phát hành này.
- Bản phát hành này không bỏ qua đăng nhập EasyAR, kiểm tra giấy phép, ủy quyền tải xuống, cổng doanh nghiệp hoặc giới hạn tốc độ.

## Xác minh

Cổng phát hành yêu cầu:

- Kiểm tra kiểu TypeScript
- MCP kiểm tra khói
- kiểm tra cài đặt gói-bin
- kiểm tra khói cài đặt gói
- npm pack dry run
- kiểm tra bảo mật kho lưu trữ
- khóa cục bộ MVP bằng chứng về Theo dõi hình ảnh, CRS/Cloud Nhận dạng và Mega

Kiểm tra nội dung đã xuất bản bổ sung:

```bash
npm run github-release:smoke
```

Mô hình sẵn sàng hiện tại:

- Khóa cục bộ MVP sẵn sàng: có
- Chính thức sản xuất API sẵn sàng: no
