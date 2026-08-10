# mcp-easyar - Bắt đầu nhanh

Quy trình công việc này hỗ trợ cả người dùng EasyAR mới và đã đăng ký kết nối Codex, Claude hoặc ứng dụng khách MCP khác với tự động hóa dự án Unity cục bộ.

Trạng thái hiện tại:

- Khóa cục bộ MVP sẵn sàng hỗ trợ Theo dõi hình ảnh, Nhận dạng đám mây và quy trình làm việc Mega tập trung sau khi Plugin EasyAR Sense Unity chính thức được cài đặt và các khóa cục bộ hoặc vật liệu Mega được định cấu hình. Mega hiện có bằng chứng về việc cài đặt thiết bị Android/startup/localization-tracking trong sơ đồ công việc hiện tại.
- API tài khoản EasyAR chính thức vẫn là một quá trình tự động hóa sản xuất. Chúng cần thiết để kiểm tra quyền của tài khoản phía máy chủ/license/download/cloud nhưng không bắt buộc để thực thi mẫu phía Unity khi plugin và khóa được ủy quyền là cục bộ.

Đường dẫn mặc định ngay bây giờ: chạy khóa cục bộ MVP. Người dùng hoàn tất đăng ký/login/download/key trên trang web EasyAR chính thức trong trình duyệt. MCP hướng dẫn các bước đó, ghi biểu mẫu cục bộ và tệp chuyển giao, chỉ xác thực sự hiện diện cấu hình cục bộ đã được biên tập lại, sau đó tiến hành nhập, xây dựng và xác thực thiết bị Unity.

## 1. Xây dựng máy chủ

```bash
npm install
npm run build
npm run install:check
```

Trước khi xuất bản hoặc chuyển gói cho người dùng khác, hãy chạy `npm run package:smoke` để cài đặt tarball cục bộ vào một dự án tiêu dùng tạm thời và thực thi `easyar-mcp-check`.

## 2. Định cấu hình ứng dụng khách

Nếu bạn chưa có tài khoản EasyAR, hãy bắt đầu với hướng dẫn về tài khoản:

```text
easyar_first_run_guide accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_authorization_strategy preferredMode=auto sampleId=cloud-recognition platform=android
easyar_write_authorization_strategy projectPath=/path/to/UnityProject preferredMode=auto sampleId=cloud-recognition platform=android
easyar_write_first_run_guide projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_account_onboarding accountStage=not-registered sampleId=cloud-recognition
easyar_account_materials sampleId=cloud-recognition
easyar_write_account_onboarding projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition
easyar_write_account_materials projectPath=/path/to/UnityProject sampleId=cloud-recognition
easyar_write_portal_evidence projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_local_config_handoff projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_write_local_config_form projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_write_focused_handoff_pack projectPath=/path/to/UnityProject sampleId=all platform=android accountStage=not-registered
```

Các hướng dẫn sẽ đưa người dùng đến trang web chính thức của EasyAR và trung tâm phát triển, sau đó liệt kê mọi trường bắt buộc, trường đó đến từ đâu, nơi lưu trữ trường đó và liệu trường đó có an toàn để chia sẻ hay không. `AUTHORIZATION_STRATEGY.md` ghi lại điểm khác biệt chính: sau khi cài đặt Plugin EasyAR Sense Unity chính thức, quá trình thực thi mẫu Unity sử dụng cấu hình khóa giấy phép cục bộ/API và không yêu cầu đăng nhập trang web khi chạy; đăng nhập trang web là để lấy các gói và khóa được ủy quyền. `FIRST_RUN.md` đưa ra lệnh gọi an toàn đầu tiên, phạm vi Theo dõi hình ảnh tập trung/Cloud Nhận dạng/Mega và thứ tự đọc giả. `PORTAL_EVIDENCE.md` chỉ ghi lại các quan sát không bí mật của trung tâm phát triển, chẳng hạn như id bản ghi ứng dụng, cờ dịch vụ, sự hiện diện của Giấy phép Sense, trạng thái thư viện Nhận dạng đám mây/target và số nhận dạng thư viện Mega/block. `LOCAL_CONFIG_HANDOFF.md` liên kết các bước tài khoản đó với tệp `ProjectSettings/EasyAR/easyar.local.json` chính xác. `LOCAL_CONFIG_FORM.md` cung cấp khung JSON có thể điền, bản đồ nguồn theo từng trường, lệnh ghi được hỗ trợ bởi môi trường và chuỗi xác thực. `easyar_write_focused_handoff_pack` ghi chẩn đoán an toàn cho mỗi mẫu, biểu mẫu, trình tự chạy, ngữ cảnh lập trình, `HANDOFF_PACK.md`, `ARTIFACT_INDEX.md` và bảng thông tin dự án trong một lệnh gọi. MCP không yêu cầu mật khẩu trang web EasyAR và không lưu trữ thông tin xác thực tài khoản.

Đối với người dùng chưa đăng ký, quy trình MCP là:

1. Đọc MCP tài nguyên `easyar://acceptance/fresh-project` để neo Theo dõi hình ảnh hiện tại, CRS/Cloud Nhận dạng và phạm vi chấp nhận Mega.
2. Chỉ hỏi trạng thái tài khoản, ví dụ `accountStage=not-registered`; người dùng mới là điểm bắt đầu hợp lệ.
3. Chạy `easyar_authorization_strategy preferredMode=auto sampleId=cloud-recognition platform=android`; đường dẫn MVP bình thường là `local-key`.
4. Gửi người dùng đến `https://www.easyar.cn/` trong trình duyệt của họ khi họ vẫn cần plugin, giấy phép hoặc khóa Cloud Nhận dạng chính thức. Họ sử dụng mục nhập đăng nhập chính thức/register, kích hoạt tài khoản nếu được yêu cầu và vào trung tâm phát triển ở đó.
5. Sau khi người dùng quay lại, chỉ hỏi giai đoạn nào hiện là đúng: `registered-not-logged-in`, `logged-in`, `has-license` hoặc `has-cloud-credentials`.
6. Viết `FIRST_RUN.md`; nó ghi lại lệnh gọi MCP an toàn đầu tiên, phạm vi tập trung, trình chặn, thứ tự tạo tác và liệu tự động hóa Unity có được phép hay không.
7. Viết `ACCOUNT_ONBOARDING.md`; nó ghi lại quá trình chuyển giao trình duyệt, mô hình giai đoạn, lời nhắc trả về và quy tắc xử lý bí mật cho người vận hành hoặc công cụ AI tiếp theo.
8. Sau khi người dùng quay lại từ cổng đăng nhập, hãy viết `PORTAL_EVIDENCE.md` chỉ với những quan sát không bí mật; sử dụng cờ hiện diện cho API KEY/API Bí mật/license giá trị.
9. Viết `LOCAL_CONFIG_HANDOFF.md`; nó cung cấp cho người dùng cả cách sử dụng tệp thủ công và cách được env hỗ trợ để điền vào cấu hình cục bộ mà không cần dán bí mật vào cuộc trò chuyện.
10. Hướng dẫn họ tạo hoặc tìm giấy phép EasyAR Sense cho mã nhận dạng gói Unity/package.
11. Đối với Nhận dạng trên đám mây, hãy hướng dẫn họ tạo hoặc định vị CRS/Cloud AppId nhận dạng cộng với API KEY. Sense 4.1+ sử dụng `appId` + `apiKey`; Các trường `appKey`/`appSecret` cũ vẫn được chấp nhận để tương thích.
12. Để xác thực thiết bị thực của Nhận dạng đám mây, hãy hướng dẫn họ tạo thư viện hình ảnh nhận dạng trên đám mây, tải lên ít nhất một hình ảnh mục tiêu thử nghiệm và chỉ giữ lại tên thư viện không bí mật, số lượng mục tiêu hoặc trang tổng quan URL để làm bằng chứng.
13. Đối với Mega, hãy hướng dẫn họ định vị thư viện bản địa hóa đám mây, bộ lưu trữ Mega Block, Tên khối và ID khối trong trang web EasyAR hoặc phiên Mega Studio đã đăng nhập. Chỉ lưu trữ những tên không bí mật/ids làm tài liệu dự án cục bộ.
14. Giữ bí mật khỏi cuộc trò chuyện: điền `ProjectSettings/EasyAR/easyar.local.json` cục bộ hoặc sử dụng biến môi trường cục bộ với `easyar_write_local_config_from_env`, sau đó cho phép `easyar_validate_local_config` chỉ báo cáo các vấn đề về hiện diện và phần giữ chỗ.
15. Tạo `PREFLIGHT.md` với `easyar_write_focused_preflight`; không chạy tự động hóa hàng loạt Unity cho đến khi tệp đó báo cáo tài khoản, cấu hình cục bộ, quá trình nhập, đường dẫn Unity, cảnh và cổng tập lệnh.
16. Sau khi biên dịch, xây dựng và xác thực thiết bị thực, hãy viết `RUN_RESULT.md`, sau đó viết `COMPLETION_REPORT.md`. Chỉ coi mẫu tập trung là thực sự chạy qua khi `runThroughComplete=true`; biên dịch/build chỉ thành công thôi là chưa đủ.

MCP không bao giờ nên biến đăng ký thành một hình thức trò chuyện. Đăng nhập, kích hoạt email, đặt lại mật khẩu và mã xác minh vẫn ở phiên trình duyệt chính thức. MCP chỉ ghi lại giai đoạn tài khoản và bằng chứng cục bộ.

`easyar_write_artifact_index` bao gồm `ACCOUNT_ONBOARDING.md`, `ACCOUNT_MATERIALS.md` và `PORTAL_EVIDENCE.md` theo thứ tự đọc chuyển giao để một công cụ AI khác có thể xem các điều kiện tiên quyết về tài khoản và bằng chứng cổng đăng nhập trước khi thử xác thực Unity.

Hãy hỏi máy chủ MCP để tìm khách hàng đoạn trích:

```text
easyar_server_status
Read MCP resource easyar://acceptance/fresh-project
easyar_release_manifest
easyar_generate_client_config client=claude-desktop
easyar_generate_client_config client=codex entrypointMode=package-bin includeTokenPlaceholder=false
easyar_generate_client_config client=generic-json entrypointMode=package-bin
easyar_check_client_setup client=claude-desktop serverPath=/absolute/path/to/mcp-easyar/dist/index.js
easyar_write_client_setup outputRoot=/path/to/report-folder client=claude-desktop serverPath=/absolute/path/to/mcp-easyar/dist/index.js
easyar_onboarding_report projectPath=/path/to/UnityProject sampleId=image-tracking client=claude-desktop platform=android
```

Đối với cấu hình thiết lập Codex, Claude Desktop, local-dist, thùng phát hành GitHub hiện tại và npm trong tương lai/npx, hãy xem `docs/client-setup.md`.

`CLIENT_SETUP.md` bao gồm đích cấu hình, danh sách kiểm tra chấp nhận, lệnh gọi đầu tiên chẳng hạn như `easyar_server_status` và các bước khắc phục sự cố dành riêng cho khách hàng. Hãy sử dụng nó trước khi giao thiết lập Codex hoặc Claude cho người dùng khác.

`easyar_server_status` cũng trả về một khối giới thiệu `preflightFirst`. Trình tự cuộc gọi đầu tiên được đề xuất là hướng dẫn tài khoản, tài liệu tài khoản, báo cáo môi trường Unity, chuẩn bị dự án, tập trung vào thử nghiệm trước, sau đó đọc `PREFLIGHT.md`.

Đối với khóa cục bộ hiện tại MVP, chỉ bắt đầu với các biến Unity/project cục bộ:

```bash
EASYAR_API_BASE_URL=https://www.easyar.cn
EASYAR_UNITY_PATH=/Applications/Unity/Hub/Editor/2022.3.62f3/Unity.app/Contents/MacOS/Unity
EASYAR_UNITY_CANDIDATE_DIRS=/Applications/Unity/Hub/Editor
EASYAR_RELEASE_PROJECT_PATH=/path/to/UnityProject
EASYAR_RELEASE_EVIDENCE_PATH=docs/release-evidence/focused-scope.android.json
EASYAR_RELEASE_PLATFORM=android
EASYAR_UNITY_VERSION=2022.3.62f3
EASYAR_LICENSE_KEY=<set locally if using easyar_write_local_config_from_env>
EASYAR_CLOUD_APP_ID=<set locally for Cloud Recognition>
EASYAR_CLOUD_SERVER_ADDRESS=<set locally for Cloud Recognition>
EASYAR_CLOUD_API_KEY=<set locally for Cloud Recognition>
EASYAR_CLOUD_API_SECRET=<set locally for Cloud Recognition>
```
Các biến
Tài khoản chính thức API dành cho quá trình tự động hóa sản xuất, không dành cho quá trình chạy thử mẫu khóa cục bộ hiện tại. Người dùng MVP khóa cục bộ không cần `EASYAR_API_TOKEN`; không yêu cầu người dùng cung cấp.

```bash
EASYAR_ACCOUNT_STATUS_ENDPOINT=https://www.easyar.cn/path/to/official/account/status
EASYAR_LICENSE_VALIDATE_ENDPOINT=https://www.easyar.cn/path/to/official/license/validate
EASYAR_DOWNLOADS_ENDPOINT=https://www.easyar.cn/path/to/official/downloads
EASYAR_CLOUD_CREDENTIALS_ENDPOINT=https://www.easyar.cn/path/to/official/cloud-recognition/credentials
EASYAR_CANARY_PROJECT_PATH=/path/to/UnityProject
EASYAR_CANARY_PLATFORM=android
EASYAR_STUB_HOST=127.0.0.1
EASYAR_STUB_PORT=8787
EASYAR_STUB_TOKEN=your_local_stub_token
```

Kho lưu trữ bao gồm `.env.example` dưới dạng mẫu không bí mật. Sao chép các giá trị vào môi trường máy khách MCP, chuỗi khóa hệ điều hành, bí mật CI hoặc `.env` cục bộ không bị theo dõi; không bao giờ cam kết các khóa cấp phép EasyAR thực, API KEY/API Bí mật, `appKey` hoặc `appSecret`.

Hợp đồng phụ trợ chính thức/API được xuất bản trong `docs/OFFICIAL_API_CONTRACT.md`. Hợp đồng OpenAPI có thể đọc được bằng máy để nhập cổng, sơ khai phụ trợ và tạo ứng dụng khách là `docs/openapi/easyar-mcp-account-api.openapi.json`. Hợp đồng Markdown có thể được tạo lại bằng:

```text
easyar_generate_official_api_contract
easyar_write_official_api_contract workspacePath=/path/to/workspace
easyar_generate_official_openapi_contract
easyar_write_official_openapi_contract workspacePath=/path/to/workspace
easyar_official_api_handoff deploymentTarget=staging
easyar_write_official_api_handoff workspacePath=/path/to/workspace deploymentTarget=staging
```
Khách hàng
MCP cũng có thể đọc `easyar://official/api-contract` cho Markdown hoặc `easyar://official/openapi` cho OpenAPI JSON có thể đọc được bằng máy hoặc sử dụng lời nhắc `easyar-validate-official-endpoints` trước khi xác thực quyền truy cập điểm cuối của người dùng đã đăng ký. `OFFICIAL_API_HANDOFF.md` là danh sách kiểm tra triển khai phụ trợ/operations để liên kết hợp đồng với các dịch vụ tài khoản EasyAR thực, đặt các biến env điểm cuối, chạy chim hoàng yến và ghi lại bằng chứng truy cập chính thức.

Bạn có thể kiểm tra việc khám phá đường dẫn Unity cục bộ bằng:

```text
easyar_unity_environment
```

Không bao giờ cam kết mã thông báo tài khoản, khóa cấp phép, thông tin xác thực nhận dạng trên đám mây hoặc bí mật ký tên trên thiết bị di động.

Đối với người dùng EasyAR lần đầu, thứ tự dự định là:

1. Đăng ký hoặc đăng nhập trên trang web EasyAR chính thức/development center.
2. Tạo hoặc định vị khóa cấp phép EasyAR Sense cho mã định danh gói ứng dụng/package.
3. Đối với Nhận dạng đám mây, hãy tạo hoặc định vị CRS AppId plus API KEY trong tài khoản chính thức.
4. Chỉ đặt các giá trị giấy phép và Nhận dạng đám mây trong `ProjectSettings/EasyAR/easyar.local.json` hoặc các biến môi trường cục bộ được sử dụng bởi `easyar_write_local_config_from_env`.
5. Chạy `easyar_validate_local_config` và `easyar_write_focused_preflight`.
6. Chỉ sử dụng `easyar_check_official_access` khi điểm cuối tài khoản EasyAR API chính thức đã được định cấu hình.

Nếu điểm cuối tài khoản EasyAR chính thức được định cấu hình, hãy xác minh quyền truy cập tài khoản và giấy phép bằng:

```text
easyar_check_account
easyar_validate_license projectPath=/path/to/UnityProject platform=android
easyar_discover_downloads projectPath=/path/to/UnityProject sampleId=image-tracking packageKind=unity-samples
easyar_discover_cloud_credentials projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_check_official_access projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_official_access_report projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
```

## 3. Chọn mẫu

Nếu ứng dụng khách MCP của bạn hỗ trợ lời nhắc, hãy bắt đầu từ `easyar-run-image-tracking`, `easyar-run-cloud-recognition`, `easyar-run-wechat-miniprogram` hoặc trợ lý lập trình chung với `sampleId=mega`.

Hiện tại, hãy sử dụng một trong các quy trình làm việc mẫu tập trung:

- `image-tracking`
- `cloud-recognition`
- `mega`

Các mẫu EasyAR khác nằm ngoài phạm vi của tính năng Theo dõi hình ảnh hiện tại, CRS/Cloud Nhận dạng và mục tiêu Mega.

Đối với các mẫu Chương trình WeChat Mini, hãy sử dụng `easyar-run-wechat-miniprogram` với `sampleId=wechat-mega` hoặc `sampleId=wechat-crs`. Lời nhắc duy trì luồng trên trình duyệt EasyAR/WeChat chính thức và chuyển giao DevTools, có thể tạo một vỏ không gian làm việc Chương trình nhỏ tối thiểu với `easyar_create_miniprogram_sample_workspace`, có thể tìm/write bằng chứng tìm kiếm gói chính thức với `easyar_find_miniprogram_official_package` và `easyar_write_miniprogram_official_package_search`, ghi các tạo phẩm preflight cục bộ/evidence và yêu cầu bằng chứng xem trước thiết bị thực trước khi hoàn thành.

Trong khi thực hiện Chương trình nhỏ, hãy chạy lại `easyar_write_miniprogram_run_through_status` bất cứ khi nào dự án, tìm kiếm gói chính thức/import, nhật ký DevTools hoặc bằng chứng thiết bị thực thay đổi. Nó ghi một tệp trạng thái cục bộ với lệnh gọi MCP được đề xuất tiếp theo.

Cuộc gọi:

```text
easyar_list_samples
easyar_generate_sample_plan sampleId=image-tracking platform=android
easyar_next_workflow_step projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_generate_focused_preflight projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_focused_preflight projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_generate_sample_import_guide projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_sample_import_guide projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_import_sample_from_package_cache projectPath=/path/to/UnityProject sampleId=cloud-recognition dryRun=true
easyar_write_workflow_state projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_generate_run_sequence projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_run_sequence projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_artifact_index projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_generate_run_report projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_run_report projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_audit_sample_scene projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_scene_audit projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_generate_support_bundle projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_support_bundle projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=image-tracking overallStatus=blocked
easyar_write_issue_report projectPath=/path/to/UnityProject sampleId=image-tracking overallStatus=blocked
easyar_write_first_run_guide projectPath=/path/to/UnityProject accountStage=not-registered sampleId=cloud-recognition platform=android
easyar_write_project_handoff projectPath=/path/to/UnityProject platform=android
easyar_write_remaining_work_report projectPath=/path/to/UnityProject platform=android verificationEvidence=passed
```

Sau khi viết các tạo phẩm, trước tiên hãy đọc `FIRST_RUN.md` cho người dùng mới hoặc khách hàng MCP mới, sau đó là `PROJECT_HANDOFF.md` khi tiếp tục toàn bộ dự án Unity, sau đó là `REMAINING_WORK.md` để ước tính khoảng cách dựa trên bằng chứng, sau đó là `PREFLIGHT.md` cho mẫu đang hoạt động. Quá trình chuyển giao dự án đưa ra một cuộc gọi tiếp theo hàng đầu cùng với trạng thái quy trình làm việc trên mỗi mẫu; `PREFLIGHT.md` là cổng tập trung cho Codex, Claude hoặc người vận hành con người biết trình chặn nào phải được xóa trước khi tự động hóa hàng loạt Unity hoặc xây dựng thiết bị.

Đối với Nhận dạng đám mây, hãy sử dụng `sampleId=cloud-recognition` và điền `easyar.cloudRecognition.appId` cộng với `apiKey` vào `ProjectSettings/EasyAR/easyar.local.json`. Các trường `appKey`/`appSecret` kế thừa vẫn được chấp nhận để tương thích. Kết quả thiết bị đã đạt cũng yêu cầu thư viện mục tiêu EasyAR Cloud Certification có ít nhất một hình ảnh mục tiêu thử nghiệm được tải lên.

Đối với Mega, hãy sử dụng `sampleId=mega`, cài đặt Plugin EasyAR Sense Unity chính thức cho Mega và sử dụng trang web EasyAR hoặc phiên Mega Studio đã đăng nhập để tìm thư viện bản địa hóa đám mây, bộ lưu trữ Mega Block, Tên khối và ID khối. Kết quả thiết bị đã đạt yêu cầu APK cài đặt/launch bằng chứng cộng với việc bản địa hóa thiết bị thực được quan sát dựa trên Mega Block đã chọn.

Nhập Plugin EasyAR Unity chính thức và các cảnh mẫu từ trang tải xuống EasyAR hoặc Mẫu trình quản lý gói Unity trước khi kỳ vọng quá trình chạy thiết bị thực sẽ thành công. Nếu `easyar_generate_import_checklist` báo cáo ứng cử viên PackageCache `Samples~` nhưng không có cảnh được nhập, hãy chạy `easyar_generate_sample_import_guide`; đối với tính năng Theo dõi hình ảnh, hướng dẫn này cũng kiểm tra quá trình nhập `Samples~/StreamingAssets/ImageTargets/ImageTargets.unitypackage` chính thức để các bản dựng thiết bị có thể tải `Assets/StreamingAssets/EasyARSamples/ImageTargets/namecard.jpg`, `namecard.etd` và `idback.etd`. Đối với Nhận dạng đám mây, hướng dẫn này hướng dẫn người dùng nhập `ImageTracking_CloudRecognition` từ Trình quản lý gói vào `Assets/Samples`.

`SAMPLE_IMPORT_GUIDE.md` danh sách `Assets/Samples/...` vị trí nhập dự kiến ​​và cuộc gọi xác minh sau nhập. Nếu mẫu phù hợp đã có trong `Library/PackageCache/**/Samples~` cục bộ, `easyar_import_sample_from_package_cache` có thể sao chép mẫu đó vào `Assets/Samples` cho mẫu tập trung. Sau khi nhập, hãy chạy danh sách kiểm tra nhập được liệt kê, tính sẵn sàng và các lệnh gọi tập trung trước khi tiếp tục tự động hóa hàng loạt Unity.

Khi không chắc chắn phải làm gì tiếp theo, hãy gọi lại `easyar_next_workflow_step`. Nó kiểm tra trạng thái nhập, tính sẵn sàng, cấu hình cục bộ, trạng thái cài đặt cảnh/Build, xem xét tập lệnh, trình chặn xác thực thiết bị và cấu phần phần mềm chuyển giao, sau đó trả về lệnh gọi MCP được đề xuất tiếp theo.

Để tạo toàn bộ gói chuyển giao an toàn cho phạm vi tập trung:

```text
easyar_write_focused_handoff_pack projectPath=/path/to/UnityProject sampleId=all platform=android accountStage=logged-in
```

Gói cố tình không ghi `RUN_RESULT.md` hoặc `CODE_CHANGE.md` đã được chuyển; những thứ đó vẫn là các tạo phẩm dựa trên bằng chứng sau khi chạy thiết bị thực hoặc chỉnh sửa tập lệnh thực.

## 4. Chuẩn bị Dự án Unity

Gọi:

```text
easyar_inspect_unity_project projectPath=/path/to/UnityProject
easyar_prepare_unity_project projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_check_sample_readiness projectPath=/path/to/UnityProject sampleId=image-tracking
```

`easyar_prepare_unity_project` cũng tạo một sổ tay tập trung trong `Assets/EasyARGenerated/<sampleId>/RUNBOOK.md`. Để theo dõi hình ảnh, nó tạo một thư mục dàn dựng nội dung mục tiêu. Đối với Nhận dạng đám mây, nó tạo một thư mục ghi chú thông tin xác thực trên đám mây. Đối với Mega, nó tạo ghi chú Mega local-materials, tạo các kiểm tra xác thực cho sự hiện diện thông tin xác thực Cài đặt EasyAR cục bộ và nhắc người dùng đặt `LocationInputMode` thành `Onsite` để xác thực thiết bị thực.

Sao chép `ProjectSettings/EasyAR/easyar.local.json.example` sang `ProjectSettings/EasyAR/easyar.local.json` và điền thông tin xác thực cục bộ chính thức vào đó hoặc ghi tệp cục bộ từ các bí mật được môi trường hỗ trợ:

Ví dụ được tạo là hợp lệ JSON với khối `_instructions`. Nó cho người dùng lần đầu biết những giá trị nào đến từ đăng ký EasyAR/login, rằng Nhận dạng đám mây/CRS cần AppId, Nhận dạng mục tiêu cuối máy khách URL, API KEY và API Bí mật cho Unity CloudRecognizer API Quyền truy cập khóa, giá trị nào không bao giờ được dán vào cuộc trò chuyện và môi trường nào các biến có thể được sử dụng với `easyar_write_local_config_from_env`.

Đối với tài liệu chuyển giao mà một công cụ AI hoặc đồng đội khác có thể tiếp tục từ:

```text
easyar_write_local_config_handoff projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android accountStage=not-registered
easyar_write_local_config_form projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android accountStage=not-registered
```

`LOCAL_CONFIG_FORM.md` là thứ an toàn nhất để trao cho người dùng lần đầu sau khi đăng ký/login: nó hiển thị từng đường dẫn JSON, trạng thái bắt buộc cho mẫu đã chọn, trình giữ chỗ, nguồn chính thức, thay thế env-var và lệnh xác thực mà không chứa các giá trị bí mật.

```bash
export EASYAR_ACCOUNT_TOKEN=your_local_easyar_account_token_if_required
export EASYAR_LICENSE_KEY=your_easyar_sense_license_key
export EASYAR_BUNDLE_IDENTIFIER=com.company.easyarsample
export EASYAR_CLOUD_APP_ID=your_cloud_recognition_app_id
export EASYAR_CLOUD_SERVER_ADDRESS=https://your_crs_client_target_recognition_url
export EASYAR_CLOUD_API_KEY=your_cloud_recognition_api_key
export EASYAR_CLOUD_API_SECRET=your_cloud_recognition_api_secret
```

Chỉ sử dụng `EASYAR_ACCOUNT_TOKEN` ở đây làm tài liệu cấu hình Unity cục bộ tùy chọn nếu quy trình làm việc EasyAR đã chọn có ứng dụng sử dụng mã thông báo tài khoản cục bộ riêng. Các lần chạy Theo dõi hình ảnh hiện tại và CRS khóa cục bộ MVP không yêu cầu nó.

```text
easyar_write_local_config_from_env projectPath=/path/to/UnityProject sampleId=cloud-recognition targetPlatform=android
```

Công cụ ghi chỉ đọc các giá trị bí mật từ môi trường cục bộ, ghi `ProjectSettings/EasyAR/easyar.local.json` và chỉ trả về sự hiện diện của trường, tên env bị thiếu, trạng thái xác thực và hành động tiếp theo. Nó không trả lại mã thông báo, khóa cấp phép, API KEY, `appKey` hoặc `appSecret`.

Sau đó xác thực mà không tiết lộ bí mật:

```text
easyar_validate_local_config projectPath=/path/to/UnityProject
```

Trước khi xây dựng sang thiết bị di động, hãy xuất bản sao thời gian chạy bị bỏ qua mà ứng dụng có thể đọc từ `StreamingAssets`:

```text
easyar_create_local_config_bridge projectPath=/path/to/UnityProject sampleId=cloud-recognition overwrite=true
easyar_run_unity_method projectPath=/path/to/UnityProject executeMethod=EasyAR.EditorTools.EasyARLocalConfigBridge.ExportRuntimeConfig
```

B cầu ghi bản sao thời gian chạy được thu nhỏ vào `Assets/StreamingAssets/EasyAR/easyar.runtime.json` sau khi xác thực các trường bắt buộc và áp dụng cấu hình dịch vụ Trình nhận dạng đám mây toàn cầu EasyAR cho các mẫu chính thức sử dụng GlobalConfig. Tệp thời gian chạy bị git bỏ qua và chỉ dành cho các bản dựng thiết bị cục bộ. Nó chỉ bao gồm các trường mà mẫu di động cần trong thời gian chạy, chẳng hạn như khóa cấp phép EasyAR, Nhận dạng đám mây `appId`/`serverAddress`/`apiKey`/`apiSecret` và mã nhận dạng Unity; nó không xuất mã thông báo tài khoản EasyAR, mật khẩu trang web hoặc giá trị `appSecret` cũ.

Trước bất kỳ lệnh bó Unity nào, hãy viết báo cáo thiết lập thực thi Unity:

```text
easyar_unity_environment
easyar_write_unity_environment_report projectPath=/path/to/UnityProject sampleId=image-tracking
```
Các bản ghi
`UNITY_ENVIRONMENT.md` đã phát hiện thấy các ứng cử viên có thể thực thi của Unity, giá trị `EASYAR_UNITY_PATH` được đề xuất và lệnh `easyar_run_unity_compile_check` chạy thử. Nó không khởi chạy Unity và không chứa bí mật tài khoản EasyAR hoặc Cloud Getting.

## 5. Định cấu hình cài đặt bản dựng

Trước tiên, hãy áp dụng cài đặt trình phát trên thiết bị di động cho các mẫu có khả năng chụp ảnh:

```text
easyar_create_mobile_settings_helper projectPath=/path/to/UnityProject sampleId=image-tracking platform=android bundleIdentifier=com.company.easyarsample overwrite=true
easyar_run_unity_method projectPath=/path/to/UnityProject executeMethod=EasyAR.EditorTools.EasyARMobileSettingsHelper.ConfigureMobileSettings
```

Sau khi nhập cảnh mẫu chính thức, hãy gọi:

```text
easyar_create_build_settings_helper projectPath=/path/to/UnityProject sampleId=image-tracking platform=android overwrite=true
easyar_run_unity_method projectPath=/path/to/UnityProject executeMethod=EasyAR.EditorTools.EasyARBuildSettingsHelper.ConfigureBuildSettings
```

Đối với chẩn đoán có thể lặp lại, hãy chuyển `logPath=Logs/mcp-easyar-ConfigureBuildSettings.log` hoặc làm theo đầu ra `easyar_generate_run_sequence`, bao gồm đường dẫn nhật ký cục bộ của dự án cho lệnh gọi hàng loạt Unity.

Khi `sampleId` được cung cấp, `easyar_run_unity_compile_check` và `easyar_run_unity_method` sẽ trả về chẩn đoán nhật ký tập trung cùng với `suggestedRunResultCall`. `easyar_generate_run_sequence` bao gồm các đối số `sampleId`, `platform` và dự án cục bộ `logPath` trên các bước hàng loạt của Unity nên lệnh gọi `easyar_write_run_result` được đề xuất có thể cập nhật `Assets/EasyARGenerated/<sampleId>/RUN_RESULT.md` sau khi biên dịch, Cài đặt bản dựng, xác thực mẫu, bản dựng hoặc thử thiết bị.

Trước khi chạy thiết bị thực, hãy tạo biểu mẫu kết quả có thể điền:

```text
easyar_write_device_run_result_form projectPath=/path/to/UnityProject sampleId=image-tracking platform=android device="Pixel 8 Android 15" buildOutputPath=Builds/image-tracking.apk
easyar_write_device_run_result_form projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android device="Pixel 8 Android 15" buildOutputPath=Builds/cloud-recognition.apk
```

`DEVICE_RUN_RESULT_FORM.md` chứa các lời nhắc bằng chứng bắt buộc cùng với hai mẫu đối số `easyar_write_run_result`. Sử dụng mẫu bản nháp an toàn cho các lần thử bị chặn hoặc không thành công. Chỉ sử dụng mẫu đã chuyển sau mỗi bước bắt buộc của thiết bị vật lý, sau đó thay thế phần giữ chỗ bằng bằng chứng được quan sát.

Để xác thực thiết bị Android, hãy sử dụng trình trợ giúp adb sau khi APK tồn tại:

```text
easyar_android_device_status
easyar_android_install_apk projectPath=/path/to/UnityProject sampleId=image-tracking apkPath=Builds/image-tracking.apk
easyar_android_start_app projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_android_collect_logcat projectPath=/path/to/UnityProject sampleId=image-tracking relativePath=Logs/mcp-easyar-DeviceLog-image-tracking.log
```

Lặp lại trình tự tương tự với `sampleId=cloud-recognition` và `apkPath=Builds/cloud-recognition.apk`. Những người trợ giúp này chỉ chứng minh việc cài đặt, khởi chạy và ghi lại nhật ký. `RUN_RESULT.md` cuối cùng chỉ nên được đánh dấu `passed` sau khi thiết bị vật lý cũng đáp ứng tiêu chí mẫu trực quan trong `DEVICE_VALIDATION.md`. Đối với Theo dõi hình ảnh, một biện pháp kiểm tra thực tế có thể lặp lại là hiển thị hình ảnh mục tiêu đã biết trên màn hình máy tính và hướng điện thoại được kết nối vào đó cho đến khi mẫu báo cáo mục tiêu dự kiến. Đối với Nhận dạng đám mây, mục tiêu được nhận dạng phải được tải lên thư viện EasyAR Cloud Nhận dạng.

Sau khi `RUN_RESULT.md` được ghi lại, hãy tạo báo cáo hoàn thành tập trung cuối cùng:

```text
easyar_write_completion_report projectPath=/path/to/UnityProject sampleId=image-tracking platform=android
easyar_write_completion_report projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
```

`COMPLETION_REPORT.md` phân tích cú pháp `RUN_RESULT.md` mới nhất, kiểm tra lại mức độ sẵn sàng tập trung trước chuyến bay, xác minh trình chặn xác thực thiết bị và tóm tắt chẩn đoán nhật ký Unity mới nhất. Nó báo cáo `not-run` khi không có kết quả chạy nào, `blocked` hoặc `failed` khi bằng chứng mới nhất không được thông qua và `passed` chỉ khi mẫu tập trung có thiết bị được ghi cộng với bước thiết bị thực/device-validation đã vượt qua. Thành công chỉ biên dịch hoặc chỉ xây dựng vẫn bị chặn.

Đối với phạm vi tập trung hiện tại, Theo dõi hình ảnh tổng hợp, Nhận dạng đám mây và Mega:

```text
easyar_write_focused_scope_status projectPath=/path/to/UnityProject platform=android
```

`FOCUSED_SCOPE_STATUS.md` báo cáo xem tất cả các mẫu tập trung đã hoàn chỉnh hay chưa và liệt kê hành động tiếp theo cho từng mẫu chưa hoàn chỉnh. Các mẫu bị trì hoãn sẽ không có trạng thái này cho đến khi người dùng yêu cầu tiếp tục.

MCP khách hàng có thể đọc `easyar://workflow/focused-scope` hoặc sử dụng lời nhắc `easyar-close-focused-scope` khi chuyển toàn bộ quá trình tập trung sang một công cụ AI khác.

Trước khi gắn thẻ, xuất bản hoặc gọi quá trình triển khai hoàn tất, hãy tạo ma trận bằng chứng sản xuất:

```text
easyar_write_deployment_readiness projectPath=/path/to/UnityProject
easyar_write_production_validation projectPath=/path/to/UnityProject platform=android verificationEvidence=not-provided
```

`PRODUCTION_VALIDATION.md` cố tình nghiêm ngặt. Nó vẫn chưa hoàn thiện cho đến khi các tệp phát hành, điểm cuối tài khoản EasyAR chính thức, các lệnh xác minh được ghi lại, báo cáo truy cập chính thức và tất cả các báo cáo hoàn thành mẫu tập trung đều cung cấp bằng chứng thực tế. Sau khi các lệnh xác minh được chuyển cho cam kết phát hành, hãy tạo lại nó bằng `verificationEvidence=passed`.

Đối với xác minh kho lưu trữ/package, hãy chạy:

```bash
npm run security:check
npm run release:check
```

Trước thẻ xuất bản hoặc phát hành npm thực, hãy thực thi cổng sản xuất cuối cùng:

```bash
EASYAR_RELEASE_REQUIRE_PRODUCTION_READY=1 npm run release:check
```

Đối với gói npm, hãy sử dụng quy trình làm việc thủ công GitHub Actions `Release` sau khi định cấu hình môi trường `npm-publish` được bảo vệ. Quy trình làm việc chạy cổng nghiêm ngặt trước `npm publish --provenance`, do đó việc xuất bản gói không thể bỏ qua bằng chứng thiết bị thực và điểm cuối chính thức. Để kiểm tra bản phát hành cục bộ, hãy đặt `EASYAR_RELEASE_PROJECT_PATH` thành dự án Unity chứa các cấu phần phần mềm mẫu tập trung đã được thông qua. Đối với người chạy bản phát hành GitHub, hãy đặt `EASYAR_RELEASE_EVIDENCE_PATH=docs/release-evidence/focused-scope.android.json` sau khi tạo tệp bằng chứng an toàn đó với `easyar_write_release_evidence`.

`npm run release:check` báo cáo hai dòng sẵn sàng. Đối với ứng cử viên phát hành khóa cục bộ gồm ba mẫu hiện tại, `Local-key MVP ready: yes` có nghĩa là gói/install tài liệu đã vượt qua, quá trình xác minh đã được thông qua và bằng chứng an toàn đã cam kết chứng minh tính năng Theo dõi hình ảnh, Nhận dạng đám mây và Mega đã được chạy trên Android. `Production ready: yes` chặt chẽ hơn và vẫn bị chặn cho đến khi các biến điểm cuối và kiểm tra quyền truy cập chính thức của tài khoản EasyAR/license/download/cloud được kết nối.

Đối với bản phân phối chỉ dành cho GitHub trước khi xuất bản npm, hãy chạy quy trình làm việc thủ công `GitHub Release` của GitHub Actions với `gate=local-key-mvp`. Nó thực thi `EASYAR_RELEASE_REQUIRE_LOCAL_KEY_MVP=1`, đóng gói dự án với `npm pack` và tải tarball lên dưới dạng nội dung Bản phát hành GitHub. Chỉ sử dụng quy trình làm việc `Release` hiện có cho npm sau khi cổng API chính thức sản xuất sẵn sàng.

Sau khi định cấu hình các điểm cuối sản xuất hoặc dàn EasyAR chính thức, hãy chạy API canary chính thức:

```bash
EASYAR_CANARY_PROJECT_PATH=/path/to/UnityProject EASYAR_CANARY_PLATFORM=android npm run official-api:canary
```

Canary sử dụng cùng các biến env điểm cuối như máy chủ MCP, kiểm tra cả mẫu tập trung và chỉ in id trình chặn an toàn.

Để kết nối hợp đồng điểm cuối cục bộ trước khi tồn tại các dịch vụ phụ trợ thực sự, hãy chạy `npm run official-api:stub` trong một shell, xuất các biến điểm cuối mà nó in trong shell khác, sau đó chạy `npm run official-api:canary`. Sơ khai chỉ trả về siêu dữ liệu cố định và không được sử dụng làm dịch vụ tài khoản sản xuất.

Sử dụng `.env.example` làm danh sách kiểm tra biến không bí mật đầy đủ. Giữ `EASYAR_RELEASE_REQUIRE_PRODUCTION_READY=1` cho thẻ phát hành cuối cùng, xuất bản npm hoặc môi trường CI được bảo vệ; giữ nó không được đặt hoặc `0` trong khi lặp lại cục bộ.

Sau khi nhập nội dung EasyAR chính thức và định cấu hình Cài đặt bản dựng, hãy chạy trình xác thực mẫu tập trung vào phía Unity đã tạo:

```text
easyar_create_sample_validation_helper projectPath=/path/to/UnityProject sampleId=image-tracking overwrite=true
easyar_run_unity_method projectPath=/path/to/UnityProject executeMethod=EasyAR.EditorTools.EasyARSampleValidationHelper.ValidateFocusedSample
```

Trình xác thực bỏ qua các tệp trợ giúp MCP đã tạo khi kiểm tra tín hiệu nhập EasyAR chính thức và yêu cầu cảnh mẫu tập trung phù hợp phải là cảnh Cài đặt bản dựng được bật đầu tiên.

## 6. Thêm mã dự án

Đối với logic mẫu chung, hãy gọi:

```text
easyar_write_config_integration_audit projectPath=/path/to/UnityProject sampleId=image-tracking
easyar_write_programming_context projectPath=/path/to/UnityProject sampleId=image-tracking goal="Show content when an image target is found"
easyar_write_code_plan projectPath=/path/to/UnityProject sampleId=image-tracking goal="Show content when an image target is found"
easyar_create_mono_behaviour projectPath=/path/to/UnityProject relativePath=Assets/Scripts/ImageTargetContentController.cs className=ImageTargetContentController kind=image-tracking
```

Đọc `CONFIG_INTEGRATION.md` và `PROGRAMMING_CONTEXT.md` trước `CODE_PLAN.md` khi một công cụ AI hoặc nhà phát triển con người khác đang đảm nhận công việc tập lệnh. Quá trình kiểm tra cấu hình chỉ tới những người sử dụng thông tin xác thực có khả năng được cấp phép/cloud theo đường dẫn và tín hiệu; nó không in các giá trị bí mật cục bộ.

MCP khách hàng cũng có thể đọc `easyar://workflow/programming` trước khi chỉnh sửa tập lệnh Unity C#. Nó tóm tắt các cấu phần phần mềm cần thiết trước khi chỉnh sửa, quy tắc chỉnh sửa trong phạm vi, kiểm tra sau chỉnh sửa và thứ tự bàn giao cho Codex, Claude hoặc nhà phát triển con người.

`CODE_PLAN.md` bao gồm các lệnh gọi xác minh có cấu trúc. Sau khi chỉnh sửa tập lệnh, hãy chạy lệnh gọi `easyar_review_csharp_scripts` và `easyar_run_unity_compile_check` được liệt kê, sau đó sử dụng `suggestedRunResultCall` của công cụ biên dịch để cập nhật `RUN_RESULT.md`.

Đối với mã tùy chỉnh, hãy sử dụng:

```text
easyar_write_csharp_file
```

Xem lại các tập lệnh được tạo hoặc chỉnh sửa trước khi biên dịch:

```text
easyar_review_csharp_scripts projectPath=/path/to/UnityProject
easyar_write_code_change_summary projectPath=/path/to/UnityProject sampleId=image-tracking goal="Summarize script changes" targetFiles='["Assets/Scripts/ImageTargetContentController.cs"]'
easyar_run_unity_compile_check projectPath=/path/to/UnityProject sampleId=image-tracking platform=android logPath=Logs/mcp-easyar-CodeCompileCheck.log
```

## 7. Kiểm tra mức độ sẵn sàng cuối cùng

Gọi:

```text
easyar_check_sample_readiness projectPath=/path/to/UnityProject sampleId=image-tracking
```

Khi `ready` là `true`, hãy mở Unity hoặc sử dụng chế độ hàng loạt để chạy trình trợ giúp trình chỉnh sửa đã tạo, sau đó xây dựng thành thiết bị Android hoặc iOS thực để xác thực máy ảnh/tracking.

## 8. Tạo Trình trợ giúp bản dựng thiết bị

Sau khi cài đặt bản dựng được định cấu hình, hãy tạo phương thức bản dựng tĩnh:

```text
easyar_create_device_build_helper projectPath=/path/to/UnityProject platform=android outputPath=Builds/EasyARSample.apk overwrite=true
easyar_run_unity_method projectPath=/path/to/UnityProject executeMethod=EasyAR.EditorTools.EasyARDeviceBuildHelper.Build
```

Đối với iOS, hãy sử dụng thư mục đầu ra như `Builds/iOS` và hoàn tất đăng nhập vào Xcode hoặc Cài đặt trình phát Unity.

## 9. Nhật ký gỡ lỗi

Nếu quá trình biên dịch Unity, tự động hóa trình soạn thảo hoặc xây dựng thiết bị không thành công, hãy chuyển đoạn trích nhật ký có liên quan trở lại máy chủ MCP:

```text
easyar_analyze_unity_log sampleId=image-tracking logText="..."
```

Đối với tệp nhật ký cục bộ:

```text
easyar_analyze_unity_log sampleId=cloud-recognition logPath=/path/to/Editor.log
```

Để cho phép máy chủ MCP tự động tìm nhật ký Unity mới nhất:

```text
easyar_analyze_latest_unity_log projectPath=/path/to/UnityProject sampleId=cloud-recognition
```

Công cụ này phân loại giấy phép EasyAR phổ biến, nhập plugin, quyền máy ảnh, biên dịch C#, Android/Gradle, ký iOS và các vấn đề về cảnh mẫu. Với `sampleId=image-tracking` hoặc `sampleId=cloud-recognition`, nó bổ sung thêm nội dung mục tiêu tập trung, thông tin xác thực trên đám mây và chẩn đoán mạng.

## 9. Gửi vấn đề GitHub

Khi một mẫu tập trung vẫn không thành công sau khi tạo các bước kiểm tra, hãy tạo một báo cáo được biên tập lại:

```text
easyar_write_support_bundle projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android
easyar_write_run_result projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android overallStatus=blocked
easyar_write_issue_report projectPath=/path/to/UnityProject sampleId=cloud-recognition platform=android overallStatus=blocked
```

Dán nội dung của `Assets/EasyARGenerated/<sampleId>/ISSUE_REPORT.md` vào vấn đề GitHub và đính kèm hoặc tham chiếu `SUPPORT_BUNDLE.md`, `RUN_RESULT.md`, `SCENE_AUDIT.md` và đường dẫn nhật ký Unity được liệt kê ở đó. Xem lại báo cáo trước khi đăng và xóa mọi giấy phép riêng tư, mã thông báo, appKey, appSecret, ký, cấp phép hoặc dữ liệu tài khoản.
