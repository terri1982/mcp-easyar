# mcp-easyar Lộ trình

Lộ trình này theo dõi mục tiêu MVP của khóa cục bộ có phạm vi hiện tại: Theo dõi hình ảnh, CRS/Cloud Nhận dạng và chỉ Mega.

Để có mục tiêu dịch vụ rộng hơn trên nhiều mẫu hơn, tích hợp sản xuất API chính thức và tăng cường dịch vụ lập trình Unity, hãy đọc [FULL_GOAL_PLAN.md](FULL_GOAL_PLAN.md) hoặc MCP tài nguyên `easyar://roadmap/full-goal`.

## Trạng thái hiện tại

Trạng thái: local-key MVP được xuất bản dưới dạng bản phát hành trước GitHub `v0.1.0-local-key.41`.

Bản phát hành hiện tại có thể được cài đặt từ Bản phát hành GitHub:

```bash
npm install -g https://github.com/terri1982/mcp-easyar/releases/download/v0.1.0-local-key.41/mcp-easyar-0.1.0.tgz
easyar-mcp-check
```

## Đã hoàn thành

- Kho lưu trữ, tên gói, README, giấy phép, chính sách bảo mật và biểu tượng EasyAR đã có sẵn.
- Phân phối tarball phát hành GitHub đang hoạt động.
- Codex, Claude Desktop và tạo cấu hình máy khách MCP chung được triển khai.
- Triển khai kiểm tra cài đặt, kiểm tra khói gói, kiểm tra khói cài đặt bản phát hành GitHub và kiểm tra bảo mật.
- Triển khai khóa cục bộ: người dùng đăng ký, đăng nhập, tải xuống và tạo khóa trên trang web EasyAR chính thức trong trình duyệt của riêng họ.
- MCP hướng dẫn cấu hình Unity cục bộ mà không thu thập mật khẩu trang web, mã xác minh, mã thông báo tài khoản, khóa cấp phép, khóa API, `appKey` hoặc `appSecret` trong trò chuyện.
- Theo dõi hình ảnh tập trung và CRS/Cloud Quy trình nhận dạng được triển khai và có bằng chứng cam kết an toàn về Android.
- Hỗ trợ quy trình làm việc Mega tập trung được triển khai và có bằng chứng thiết bị Android được cam kết an toàn từ lần chạy Unity 2022.3.62f3 APK install/startup/localization-tracking. Một dự án Unity mới riêng biệt hiện chứng minh tính năng nhập gói chính thức, APK build/install/startup, tính sẵn sàng của chế độ tại chỗ và bản địa hóa thiết bị thực/tracking tín hiệu nhật ký trong môi trường được ánh xạ đã chọn.
- Hỗ trợ mẫu Chương trình WeChat Mini đã bắt đầu cho `wechat-mega` và `wechat-crs`: siêu dữ liệu mẫu, kiểm tra dự án cục bộ, phát hiện Công cụ dành cho nhà phát triển WeChat CLI, biểu mẫu cấu hình cục bộ, nhập gói chính thức do người dùng tải xuống, kiểm tra khói DevTools, phân tích nhật ký, báo cáo trước, trình tự chạy, danh sách kiểm tra xác thực thiết bị thực, kết quả chạy và báo cáo hoàn thành được triển khai.
- Hỗ trợ lập trình dự án Unity dành cho ánh sáng trước mẫu tập trung, kiểm tra hiện trường, trình tự chạy, xác thực thiết bị, thu thập nhật ký, lập kế hoạch C#, viết tập lệnh và tạo phẩm chuyển giao.

## Phạm vi hoạt động

Mục tiêu mẫu đang hoạt động được cố ý giới hạn ở:

- Theo dõi hình ảnh
- CRS/Cloud Nhận dạng
- Mega

Xin chào AR, Theo dõi bề mặt và các mẫu EasyAR khác không nằm trong mục tiêu hiện tại.

Trọng tâm của Chương trình nhỏ mới được giới hạn ở:

- Chương trình nhỏ WeChat Mega
- Chương trình WeChat Mini CRS / Nhận dạng đám mây

## Còn lại cho mục tiêu có phạm vi

### Mẫu mục tiêu

- Duy trì tính năng Theo dõi Hình ảnh, CRS/Cloud Sự công nhận và bằng chứng phát hành Mega phù hợp với mọi bản phát hành trước công khai.
- Giữ tài liệu cài đặt, tài liệu chấp nhận của khách hàng và thử nghiệm khói phù hợp với Bản phát hành GitHub mới nhất.
- Tiếp tục tăng cường quy trình lập trình Unity bằng cách sử dụng tính năng Theo dõi hình ảnh thực và CRS trường hợp dự án.
- Ghi lại bản xem trước Công cụ dành cho nhà phát triển WeChat/upload bằng chứng và bằng chứng thiết bị thực cho `wechat-mega` và `wechat-crs` sau khi có gói mẫu địa phương chính thức, DevTools đã đăng nhập và các dự án Chương trình nhỏ thử nghiệm.

### Tích hợp API chính thức

Khóa cục bộ trong phạm vi MVP không yêu cầu API tài khoản EasyAR chính thức. Nếu sau này cần phải tự động hóa sản xuất thì vẫn cần hỗ trợ dịch vụ chính thức hoặc hợp đồng API nội bộ đã được phê duyệt cho:

- Trạng thái tài khoản
- Xác thực giấy phép
- Quyền tải xuống và khám phá gói
- Khám phá thông tin xác thực nhận dạng trên đám mây
- `EASYAR_API_TOKEN` phát hành, xoay vòng, xác thực và thu hồi

Cho đến khi các API đó tồn tại, đường dẫn an toàn là chuyển giao trình duyệt cộng với các khóa Unity cục bộ.

### Phân phối

- Luôn cập nhật phân phối tarball GitHub Release cho người dùng khóa cục bộ MVP.
- Chỉ xuất bản lên npm sau khi cổng sản xuất được bật có chủ ý hoặc một npm riêng chính sách phát hành trước đã được phê duyệt.
- Lưu giữ ghi chú phát hành, tài liệu cài đặt, `easyar-mcp-check` và `npm run github-release:smoke` phù hợp với thẻ xuất bản mới nhất.

### Unity Coverage

- Giữ đường cơ sở đã được xác minh của Unity ở Unity `2022.3.62f3` trừ khi phạm vi phiên bản được hỗ trợ được mở rộng.
- Thêm bằng chứng lặp lại cho từng nền tảng và mục tiêu được hỗ trợ sample.
- Ưu tiên bằng chứng thiết bị thực cho sự thành công của AR; trình mô phỏng có thể xác minh cài đặt/startup nhưng không thể chứng minh tính năng theo dõi dựa trên máy ảnh thành công.

## Quy tắc an toàn

- Không yêu cầu người dùng dán mật khẩu trang web EasyAR, mã xác minh, khóa cấp phép, khóa API, `appKey` hoặc `appSecret` vào cuộc trò chuyện.
- Không cam kết `ProjectSettings/EasyAR/easyar.local.json`, bản sao bí mật thời gian chạy, APK, gói Unity, khóa ký hoặc nhật ký cục bộ có thông tin xác thực.
- Không bỏ qua đăng nhập EasyAR, kiểm tra giấy phép, ủy quyền tải xuống, cổng doanh nghiệp hoặc giới hạn tốc độ.

## Hành động tốt nhất tiếp theo

1. Giữ các tài liệu MVP khóa cục bộ và phát hành các thử nghiệm khói phù hợp với Bản phát hành GitHub mới nhất.
2. Giữ cho séc chấp nhận của khách hàng luôn ở trạng thái xanh đối với Codex và Claude.
3. Tiếp tục tập trung hỗ trợ lập trình Unity vào Theo dõi hình ảnh, CRS/Cloud Nhận dạng và Mega.
4. Quyết định xem nên xuất bản npm dưới dạng khóa cục bộ được đánh dấu rõ ràng MVP hay đợi.
