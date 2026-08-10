# mcp-easyar Kế hoạch mục tiêu đầy đủ

Kế hoạch này giúp hiển thị mục tiêu dài hạn ban đầu trong khi vẫn duy trì phạm vi đã phát hành hiện tại.

Bản phát hành công khai hiện tại: `v0.1.0-local-key.41`

## Goal

Giúp người dùng EasyAR đã đăng ký sử dụng Codex, Claude và các ứng dụng khách MCP khác để:

- cài đặt và định cấu hình `mcp-easyar`
- hoàn tất thiết lập tài khoản EasyAR chính thức và khóa cục bộ một cách an toàn
- xây dựng và chạy các mẫu EasyAR Unity
- nhận hỗ trợ lập trình dự án Unity trong quá trình phát triển EasyAR

## Bản phát hành đã hoàn thành

Khóa cục bộ hiện tại MVP đã hoàn tất cho mục tiêu tập trung đã được phê duyệt:

- Hình ảnh Theo dõi
- CRS/Cloud Nhận dạng
- Mega

Bằng chứng:

- GitHub Phát hành thẻ khói cài đặt tarball.
- Bằng chứng thiết bị thực Android tồn tại cho cả hai mẫu tập trung.
- `easyar://acceptance/fresh-project` xác định dự án Unity mới đường dẫn chấp nhận.
- `easyar://workflow/programming` xác định quy trình lập trình Unity an toàn.
- Cổng sản xuất vẫn báo cáo `Production ready: no` cho đến khi API tài khoản EasyAR chính thức thực sự được kết nối.

## Bản mở rộng Mega đã hoàn thành

Bản phát hành trước `v0.1.0-local-key.41` bao gồm Mega. Bằng chứng bao gồm:

- MCP danh mục, sổ tay, kiểm tra mức độ sẵn sàng, biểu mẫu xác thực thiết bị, tạo mẫu MonoBehaviour và chẩn đoán nhật ký bao gồm Mega.
- Unity 2022.3.62f3 Bản dựng Android APK, cài đặt thiết bị thực/startup, khởi tạo EasyAR, tải Mega Block và bản địa hóa Mega/tracking tồn tại bằng chứng từ thẻ đã hoàn thành trước đó.
- Một dự án Unity mới riêng biệt hiện đã chứng minh việc nhập gói 4002 Mega chính thức, bản dựng Android APK/install/startup, khởi chạy EasyAR và tính sẵn sàng của chế độ tại chỗ.
- Bằng chứng phát hành cam kết an toàn hiện bao gồm APK cài đặt/startup trên thiết bị thực và Mega bản địa hóa/tracking xác thực cộng với khởi động dự án mới/localization bằng chứng từ môi trường được ánh xạ đã chọn.

## Theo dõi mở rộng 1: Nhiều mẫu EasyAR hơn

Mục đích: mở rộng từ hai mẫu đã được xác minh hiện tại sang các mẫu EasyAR Unity chính thức hơn mà không làm giảm yêu cầu về bằng chứng.

Tiêu chí đầu vào cho mỗi mẫu mới:

- người dùng yêu cầu tiếp tục nhóm mẫu đó một cách rõ ràng.
- Phiên bản Plugin EasyAR Sense Unity chính thức và phiên bản Unity đã được ghi lại.
- Giấy phép địa phương/API các điều kiện tiên quyết đã được xác định và ghi lại.
- Mẫu có danh sách kiểm tra nhập, kiểm tra trước, trình tự chạy, danh sách kiểm tra xác thực thiết bị, kết quả chạy, báo cáo hoàn thành và gói hỗ trợ.

Tiêu chí chấp nhận cho mỗi mẫu mới:

- Quá trình nhập Unity thành công từ các tài liệu gói chính thức.
- Biên dịch các lượt kiểm tra.
- Quá trình xây dựng Android hoặc iOS thành công.
- Quá trình xác thực thiết bị thực chứng minh hành vi AR mà mẫu nhằm chứng minh.
- Không có mật khẩu tài khoản, khóa cấp phép, bí mật Nhận dạng đám mây, khóa ký, APK, gói Unity hoặc quyền riêng tư thô nhật ký được cam kết.

Lệnh ứng viên:

1. Xin chào AR: quyền của máy ảnh, khởi động ARSession, giấy phép/config đường cơ sở.
2. Theo dõi bề mặt: theo dõi thiết bị và hành vi vị trí trên thiết bị thực.
3. Các mẫu Plugin EasyAR Sense Unity bổ sung sau khi các điều kiện tiên quyết và tiêu chí vượt qua đã được ghi lại.

## Bản mở rộng 2: API Tích hợp sản xuất chính thức

Mục đích: chuyển từ chuyển giao trình duyệt cùng với khóa cục bộ sang tự động hóa trong phạm vi tài khoản chính thức cho người dùng EasyAR đã đăng ký.

Các dịch vụ bắt buộc do EasyAR sở hữu:

- điểm cuối trạng thái tài khoản
- điểm cuối xác thực giấy phép
- quyền tải xuống/package điểm cuối khám phá
- CRS/Cloud Điểm cuối siêu dữ liệu thông tin xác thực nhận dạng trả về siêu dữ liệu và cờ hiện diện không có bí mật thô
- chính sách phát hành, xoay vòng, xác thực và thu hồi mã thông báo cho MCP khách hàng

Tiêu chí chấp nhận:

- `npm run official-api:canary` vượt qua các dịch vụ EasyAR dàn dựng hoặc sản xuất.
- `easyar_production_validation` báo cáo `Production ready: yes`.
- Cổng phát hành sản xuất vượt qua `EASYAR_RELEASE_REQUIRE_PRODUCTION_READY=1`.
- Việc tích hợp không bao giờ loại bỏ mật khẩu trang web, cookie trình duyệt, quá trình xác minh mã hoặc dữ liệu trang riêng tư làm cơ chế ủy quyền.

## Bản mở rộng 3: Dịch vụ lập trình Unity

Mục đích: làm cho `mcp-easyar` trở nên hữu ích trong suốt quá trình phát triển dự án EasyAR Unity, không chỉ đưa ra mẫu.

Cơ sở hiện tại:

- tập trung vào preflight
- kiểm tra tích hợp cấu hình
- bối cảnh lập trình
- kế hoạch mã
- Tạo và xem xét tập lệnh C#
- biên dịch/build/device báo cáo kết quả
- gói chuyển giao cho Codex, Claude và con người

Các bước tăng cường tiếp theo:

- Thêm nhiều trường hợp dự án thực tế hơn cho Theo dõi hình ảnh và CRS.
- Thêm sách hướng dẫn lập trình theo mẫu cụ thể khi có nhiều mẫu được xác minh hơn.
- Giữ bí mật mã được tạo và nằm trong phạm vi mục tiêu rõ ràng của dự án.
- Yêu cầu biên dịch hoặc bằng chứng thiết bị trước khi đánh dấu các thay đổi mã hoàn tất.

## Chính sách phát hành

Các bản phát hành trước của GitHub có thể tiếp tục sử dụng `gate=local-key-mvp` trong khi dự án được gắn nhãn rõ ràng là khóa cục bộ MVP.

Việc xuất bản npm sản xuất nên đợi cho đến khi một trong những điều sau đúng:

- API tài khoản EasyAR chính thức được kết nối và cổng sản xuất nghiêm ngặt đã vượt qua
- chính sách npm phát hành trước rõ ràng được phê duyệt và gói được gắn nhãn là chỉ khóa cục bộ

## Ranh giới an toàn

`mcp-easyar` phải hướng dẫn quy trình làm việc EasyAR được ủy quyền. Nó không được bỏ qua việc đăng nhập tài khoản EasyAR, kiểm tra giấy phép, ủy quyền tải xuống, cổng doanh nghiệp, giới hạn tốc độ hoặc quy tắc xử lý bí mật.
