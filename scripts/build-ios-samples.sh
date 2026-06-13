#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Build iOS archives/IPAs from the EasyAR Unity sample Xcode projects.

Required:
  EASYAR_IOS_TEAM_ID=<Apple Developer Team ID>

Optional:
  EASYAR_IOS_EXPORT_METHOD=development|ad-hoc|app-store|enterprise
    Default: development

  EASYAR_IOS_INSTALL=1
    Install exported IPAs to the first connected iPhone using devicectl.

  EASYAR_IOS_CONFIGURATION=Debug|Release
    Default: Debug

  EASYAR_IOS_OUTPUT_DIR=<path>
    Default: ./Builds/iOSPackages

  EASYAR_IOS_PROJECT_ROOT=<path>
    Default: current working directory.

  EASYAR_IOS_SAMPLE_NAMES="image-tracking cloud-recognition mega"
    Space-separated sample ids to package.

  EASYAR_IOS_<SAMPLE>_XCODEPROJ=<path>
    Optional per-sample Xcode project override. SAMPLE is uppercased with
    non-alphanumeric characters converted to underscores, for example:
    EASYAR_IOS_IMAGE_TRACKING_XCODEPROJ=/path/to/Unity-iPhone.xcodeproj

Examples:
  EASYAR_IOS_TEAM_ID=ABCDE12345 npm run ios:package
  EASYAR_IOS_TEAM_ID=ABCDE12345 EASYAR_IOS_INSTALL=1 npm run ios:package
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

require_tool() {
  local tool="$1"
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "Missing required tool: $tool" >&2
    exit 2
  fi
}

require_xcrun_tool() {
  local tool="$1"
  if ! xcrun --find "$tool" >/dev/null 2>&1; then
    echo "Missing Xcode tool: $tool" >&2
    echo "Install full Xcode, open it once, then run:" >&2
    echo "  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer" >&2
    exit 2
  fi
}

TEAM_ID="${EASYAR_IOS_TEAM_ID:-}"
if [[ -z "$TEAM_ID" ]]; then
  echo "EASYAR_IOS_TEAM_ID is required." >&2
  usage >&2
  exit 2
fi

EXPORT_METHOD="${EASYAR_IOS_EXPORT_METHOD:-development}"
CONFIGURATION="${EASYAR_IOS_CONFIGURATION:-Debug}"
OUTPUT_DIR="${EASYAR_IOS_OUTPUT_DIR:-$(pwd)/Builds/iOSPackages}"
PROJECT_ROOT="${EASYAR_IOS_PROJECT_ROOT:-$(pwd)}"
SAMPLE_NAMES_TEXT="${EASYAR_IOS_SAMPLE_NAMES:-image-tracking cloud-recognition mega}"
INSTALL="${EASYAR_IOS_INSTALL:-0}"

require_tool /usr/libexec/PlistBuddy
require_xcrun_tool xcodebuild
if [[ "$INSTALL" == "1" ]]; then
  require_xcrun_tool devicectl
fi

mkdir -p "$OUTPUT_DIR"

EXPORT_OPTIONS="$OUTPUT_DIR/exportOptions.plist"
cat > "$EXPORT_OPTIONS" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>$EXPORT_METHOD</string>
  <key>teamID</key>
  <string>$TEAM_ID</string>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>compileBitcode</key>
  <false/>
  <key>destination</key>
  <string>export</string>
</dict>
</plist>
PLIST

read -r -a SAMPLE_NAMES <<< "$SAMPLE_NAMES_TEXT"

project_for_sample() {
  local sample="$1"
  local env_name normalized
  normalized="$(printf '%s' "$sample" | tr '[:lower:]' '[:upper:]' | sed -E 's/[^A-Z0-9]+/_/g')"
  env_name="EASYAR_IOS_${normalized}_XCODEPROJ"
  if [[ -n "${!env_name:-}" ]]; then
    printf '%s\n' "${!env_name}"
    return
  fi
  printf '%s\n' "$PROJECT_ROOT/Builds/iOS/$sample/Unity-iPhone.xcodeproj"
}

install_ipa() {
  local ipa="$1"
  local device_json device_id

  device_json="$(xcrun devicectl list devices --json-output - 2>/dev/null || true)"
  device_id="$(printf '%s' "$device_json" | /usr/bin/python3 -c '
import json, sys
try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)
for device in data.get("result", {}).get("devices", []):
    props = device.get("deviceProperties", {})
    if props.get("platform") == "iOS" and device.get("connectionProperties", {}).get("transportType"):
        print(device.get("identifier", ""))
        break
')"

  if [[ -z "$device_id" ]]; then
    echo "No connected iPhone was found by devicectl." >&2
    return 1
  fi

  xcrun devicectl device install app --device "$device_id" "$ipa"
}

for i in "${!SAMPLE_NAMES[@]}"; do
  name="${SAMPLE_NAMES[$i]}"
  project="$(project_for_sample "$name")"

  if [[ ! -d "$project" ]]; then
    echo "Missing Xcode project for $name: $project" >&2
    exit 1
  fi

  sample_dir="$OUTPUT_DIR/$name"
  archive_path="$sample_dir/$name.xcarchive"
  export_path="$sample_dir/export"
  rm -rf "$sample_dir"
  mkdir -p "$export_path"

  echo "==> Archiving $name"
  xcodebuild archive \
    -project "$project" \
    -scheme "Unity-iPhone" \
    -configuration "$CONFIGURATION" \
    -destination "generic/platform=iOS" \
    -archivePath "$archive_path" \
    DEVELOPMENT_TEAM="$TEAM_ID" \
    CODE_SIGN_STYLE=Automatic \
    -allowProvisioningUpdates

  echo "==> Exporting $name"
  xcodebuild -exportArchive \
    -archivePath "$archive_path" \
    -exportOptionsPlist "$EXPORT_OPTIONS" \
    -exportPath "$export_path" \
    -allowProvisioningUpdates

  ipa="$(find "$export_path" -maxdepth 1 -name '*.ipa' -print -quit)"
  if [[ -z "$ipa" ]]; then
    echo "No IPA was exported for $name." >&2
    exit 1
  fi

  echo "IPA: $ipa"
  if [[ "$INSTALL" == "1" ]]; then
    echo "==> Installing $name"
    install_ipa "$ipa"
  fi
done

echo "Done. Output: $OUTPUT_DIR"
