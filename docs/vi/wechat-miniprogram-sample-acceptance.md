# Nghiệm thu EasyAR WeChat Mini Program Sample

Danh sách kiểm tra này là cổng bằng chứng cho các mẫu `wechat-mega` và `wechat-crs` tập trung. Đó là dựa trên khóa cục bộ và công cụ chính thức có chủ ý: người dùng đăng nhập vào EasyAR và WeChat trong trang web chính thức hoặc Công cụ dành cho nhà phát triển WeChat, tải xuống các gói chính thức, điền vào cấu hình cục bộ trên máy của chính họ và cho phép MCP chỉ kiểm tra các tệp cục bộ và bằng chứng đã được loại bỏ.

Không dán mật khẩu EasyAR, mật khẩu WeChat, mã xác minh, khóa cấp phép, CRS API khóa/secrets, bí mật ứng dụng, tải khóa lên, xem trước mã QR hoặc nhật ký riêng tư thô vào cuộc trò chuyện.

## Mẫu được hỗ trợ

- `wechat-mega`: Mẫu Chương trình WeChat Mini EasyAR Mega.
- `wechat-crs`: EasyAR CRS / Mẫu Chương trình WeChat Mini nhận dạng đám mây.

Các mẫu Chương trình WeChat Mini khác nằm ngoài phạm vi cho đến khi rõ ràng được yêu cầu.

## Dữ liệu đầu vào cục bộ bắt buộc

Người dùng phải chuẩn bị những thứ này bên ngoài MCP:

- Thư mục dự án Chương trình WeChat Mini với `project.config.json` và `app.json`.
- Công cụ dành cho nhà phát triển WeChat được cài đặt và đăng nhập cục bộ.
- Chương trình EasyAR Mini chính thức SDK/sample được người dùng tải xuống từ trang web EasyAR.
- Giấy phép EasyAR được liên kết với id ứng dụng Chương trình nhỏ.
- Dành cho `wechat-mega`: Thông tin về ứng dụng Mega/server cùng với thư viện bản địa hóa đám mây đã chọn/block siêu dữ liệu.
- Dành cho `wechat-crs`: CRS id ứng dụng, địa chỉ máy chủ, khóa API, API bí mật và ít nhất một hình ảnh mục tiêu trên đám mây đã tải lên.

`wechat-mega` đặc biệt yêu cầu gói EasyAR Mega WeChat Mini Program SDK/sample hoặc dự án WeChat Mini Program Mega hiện có. Dự án Unity Mega, bản dựng Android APK, PICO hoặc bản dựng XREAL là bằng chứng tham khảo hữu ích, nhưng đây không phải là mẫu Chương trình nhỏ Mega và không thể tự mình hoàn thành mục tiêu này.

## Bản tải xuống chính thức

MCP không đăng nhập vào trang web EasyAR cho người dùng và không bỏ qua quyền tải xuống. Người dùng nên mở trang tải xuống EasyAR chính thức trong trình duyệt của riêng họ:

```text
https://www.easyar.cn/view/download.html
```

Cụm từ tìm kiếm được đề xuất:

- `wechat-mega`: 微信小程序, Mega, EasyAR Mega, Chương trình nhỏ
- `wechat-crs`: 微信小程序, CRS, Nhận dạng đám mây, Chương trình nhỏ

Chính thức hiện tại tải xuống các mục:

- `wechat-mega`: `EasyAR Mega 微信小程序示例`, phiên bản `2.0.3`, tên tệp `easyar-mega-wechat-miniprogram-plugin-2.0.3-1077.647aaae_samples.zip`, tài liệu `https://www.easyar.cn/doc/zh-cn/develop/wechat/mega/quickstart.html`
- `wechat-crs`: `EasyAR CRS 微信小程序示例`, phiên bản `2.0.0`, tên tệp `EasyAR-miniprogram-WebAR-Demo-tracking.zip`, docs `https://www.easyar.cn/doc/zh-cn/develop/wechat/cloud-recognition/quickstart.html`

Các tệp này được bảo vệ bằng thông tin đăng nhập trang web EasyAR/entitlement. MCP không tải chúng xuống bằng mật khẩu tài khoản của người dùng và không bỏ qua ủy quyền; người dùng nên tải chúng xuống trong phiên trình duyệt chính thức của riêng họ.

Sau khi tải xuống, hãy chuyển thư mục giải nén cục bộ hoặc đường dẫn `.zip` tới `easyar_import_miniprogram_sample_from_local_package`. Nếu MCP phát hiện một dự án Unity, dự án đó sẽ từ chối dưới dạng nguồn mẫu Chương trình WeChat Mini.

## Được đề xuất MCP Trình tự

Thay thế `/path/to/miniprogram` và `/path/to/official/package-or.zip` bằng các đường dẫn cục bộ. Đường dẫn gói chính thức có thể là thư mục được trích xuất hoặc `.zip` đã tải xuống.

```text
easyar_list_miniprogram_samples
easyar_check_wechat_devtools
easyar_find_miniprogram_official_package sampleId=wechat-mega searchRoots='["/Users/you/Downloads","/Users/you/Documents"]'
easyar_write_miniprogram_official_package_search projectPath=/path/to/miniprogram sampleId=wechat-mega searchRoots='["/Users/you/Downloads","/Users/you/Documents"]'
easyar_create_miniprogram_sample_workspace projectPath=/path/to/miniprogram sampleId=wechat-mega appId=wx-your-appid
easyar_write_miniprogram_local_config_form projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_import_miniprogram_sample_from_local_package projectPath=/path/to/miniprogram sampleId=wechat-mega packagePath=/path/to/official/package-or.zip dryRun=true
easyar_import_miniprogram_sample_from_local_package projectPath=/path/to/miniprogram sampleId=wechat-mega packagePath=/path/to/official/package-or.zip dryRun=false
easyar_inspect_miniprogram_project projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_run_through_status projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_preflight projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_run_sequence projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_run_miniprogram_devtools_check projectPath=/path/to/miniprogram sampleId=wechat-mega mode=open dryRun=true
easyar_run_miniprogram_devtools_check projectPath=/path/to/miniprogram sampleId=wechat-mega mode=open dryRun=false
easyar_run_miniprogram_devtools_check projectPath=/path/to/miniprogram sampleId=wechat-mega mode=preview dryRun=true
easyar_run_miniprogram_devtools_check projectPath=/path/to/miniprogram sampleId=wechat-mega mode=preview dryRun=false
easyar_analyze_miniprogram_devtools_log projectPath=/path/to/miniprogram sampleId=wechat-mega logPath=easyar-generated/wechat-mega/DEVTOOLS_CHECK.log
easyar_write_miniprogram_device_validation_checklist projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_run_result_form projectPath=/path/to/miniprogram sampleId=wechat-mega
```

Sử dụng `sampleId=wechat-crs` cho đường dẫn CRS.

## Xác thực thiết bị thực

Mẫu chưa hoàn chỉnh cho đến khi được xem trước trên điện thoại thực thông qua Công cụ dành cho nhà phát triển WeChat.

Sử dụng `easyar_run_miniprogram_devtools_check mode=preview` sau khi dự án mở thành công. Theo mặc định, nó chuẩn bị `easyar-generated/<sampleId>/WECHAT_PREVIEW_QR.png` và `easyar-generated/<sampleId>/WECHAT_PREVIEW_INFO.json` làm cấu phần phần mềm xem trước cục bộ. Mã QR là bằng chứng riêng tư của địa phương; không dán hoặc cam kết nó. Nếu phiên bản Công cụ dành cho nhà phát triển WeChat đã cài đặt sử dụng các đối số xem trước khác nhau, hãy chuyển `devtoolsArgs` chính xác.

Không gian làm việc được tạo bởi MCP, hãy thêm các cấu phần phần mềm xem trước này vào `.gitignore`; đối với các dự án hiện có, hãy thêm các quy tắc bỏ qua tương đương trước khi chạy bản xem trước.

Đối với cả hai mẫu, hãy ghi lại:

- mẫu thiết bị đã thử nghiệm
- Phiên bản WeChat nếu biết
- liệu quyền của máy ảnh có được cấp hay không
- Xem trước DevTools/open kết quả
- đường dẫn nhật ký được biên tập lại hoặc đường dẫn ảnh chụp màn hình được biên tập lại
- bản tóm tắt ngắn về hành vi được quan sát

Đối với `wechat-mega`, bằng chứng bắt buộc là bản địa hóa thiết bị thực/tracking trong môi trường được ánh xạ đã chọn. Bằng chứng tốt bao gồm nhật ký đã được biên tập lại hoặc ghi chú ảnh chụp màn hình cho thấy thành công về bản địa hóa, tìm thấy khối, bắt đầu theo dõi hoặc tín hiệu thành công mẫu chính thức tương đương.

Đối với `wechat-crs`, bằng chứng bắt buộc là sự công nhận mục tiêu đám mây dự định. Bằng chứng tốt bao gồm nhật ký đã được biên tập lại hoặc ghi chú ảnh chụp màn hình hiển thị tên mục tiêu/id hoặc tín hiệu thành công nhận dạng mẫu chính thức. Người dùng phải tải hình ảnh mục tiêu lên thư viện EasyAR Cloud Certification.

`easyar_analyze_miniprogram_devtools_log` báo cáo cả phát hiện về trình chặn và `successSignals`. Để chuyển bằng chứng, hãy ưu tiên các tín hiệu thành công như `camera-ready`, `devtools-preview-ready`, `mega-localized` và `crs-recognized`, sau đó sao chép dòng bằng chứng đã được biên tập lại vào bản tóm tắt kết quả lần chạy.

## Ghi lại kết quả

Sau khi xem trước trên thiết bị thực, hãy ghi kết quả lần chạy. `passedStepIds` phải đến từ `DEVICE_VALIDATION.md`.

Nếu dự án đã có tệp bằng chứng cục bộ được biên tập lại, chẳng hạn như `docs/crs-real-evidence.json`, hãy chuyển tệp đó dưới dạng `redactedEvidencePath`. Đường dẫn phải nằm trong dự án Chương trình nhỏ. Không dán mã QR, nhật ký riêng tư thô, khóa cấp phép, bí mật API hoặc mã thông báo vào phần tóm tắt.

Ví dụ cho Mega:

```text
easyar_write_miniprogram_run_result projectPath=/path/to/miniprogram sampleId=wechat-mega overallStatus=passed devtoolsStatus=passed devicePreviewStatus=passed passedStepIds='["official-login","project-preflight","devtools-check","real-device-preview","mega-service-ready","mega-localized-on-device"]' evidenceSummary="Real-device WeChat preview localized in the mapped Mega environment; redacted log/screenshot evidence recorded locally."
easyar_write_miniprogram_completion_report projectPath=/path/to/miniprogram sampleId=wechat-mega
easyar_write_miniprogram_scope_status projectPath=/path/to/miniprogram
```

Ví dụ cho CRS:

```text
easyar_write_miniprogram_run_result projectPath=/path/to/miniprogram sampleId=wechat-crs overallStatus=passed devtoolsStatus=passed devicePreviewStatus=passed passedStepIds='["official-login","project-preflight","devtools-check","real-device-preview","crs-service-ready","crs-recognized-on-device"]' evidenceSummary="Real-device WeChat preview recognized the intended CRS cloud target; redacted log/screenshot evidence recorded locally."
easyar_write_miniprogram_completion_report projectPath=/path/to/miniprogram sampleId=wechat-crs
easyar_write_miniprogram_scope_status projectPath=/path/to/miniprogram
```

`COMPLETION_REPORT.md` chỉ hoàn tất khi:

- `PREFLIGHT.md` tồn tại và không có kiểm tra bị chặn nào.
- `DEVICE_VALIDATION.md` tồn tại.
- `DEVTOOLS_CHECK.log` tồn tại, không có phát hiện trình chặn nào đã biết và bao gồm ít nhất một tín hiệu thành công được công nhận, chẳng hạn như `devtools-preview-ready`, `camera-ready`, `mega-localized` hoặc `crs-recognized`.
- `RUN_RESULT.md` nói `Run-through complete: yes` và chứa bản tóm tắt bằng chứng đã được biên tập lại có thể sử dụng được, không phải văn bản giữ chỗ.
- Kết quả chạy tham chiếu bằng chứng xem trước thiết bị thực.
- `MINIPROGRAM_SCOPE_STATUS.md` chỉ báo cáo `All Mini Program samples complete: yes` sau cả hai `wechat-mega` và `wechat-crs` báo cáo hoàn thành đã đạt.

## Chính sách phát hành yêu cầu

Không yêu cầu `wechat-mega` hoặc `wechat-crs` chỉ được thực hiện từ các tạo phẩm được tạo. Một tuyên bố công khai hợp lệ cần có các hiện vật của dự án địa phương cộng với bằng chứng thiết bị thực đã được biên tập lại. Chỉ riêng việc biên dịch/open thành công đã là tiến bộ hữu ích, nhưng đó không phải là sự hoàn thành mẫu.
