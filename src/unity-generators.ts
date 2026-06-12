import type { SampleInfo } from "./samples.js";
import type { buildPlatforms, deviceBuildPlatforms, mobilePlatforms, monoBehaviourKinds } from "./catalog.js";

export function buildSampleRunner(sample: SampleInfo): string {
  const sceneNames = sample.unityScenes.map((scene) => `        "${escapeCsharp(scene)}"`).join(",\n");
  return `using System;
using System.Linq;
using UnityEditor;
using UnityEditor.SceneManagement;

namespace EasyAR.EditorTools
{
    public static class EasyARSampleRunner
    {
        private static readonly string[] SceneNameHints =
        {
${sceneNames}
        };

        [MenuItem("Tools/EasyAR/Open Sample Scene")]
        public static void OpenSampleScene()
        {
            var scene = AssetDatabase.FindAssets("t:Scene")
                .Select(AssetDatabase.GUIDToAssetPath)
                .FirstOrDefault(path => SceneNameHints.Any(hint => path.IndexOf(hint, StringComparison.OrdinalIgnoreCase) >= 0));

            if (string.IsNullOrEmpty(scene))
            {
                throw new InvalidOperationException("No matching EasyAR sample scene found. Import the official ${escapeCsharp(sample.name)} sample first.");
            }

            EditorSceneManager.OpenScene(scene);
            UnityEngine.Debug.Log("Opened EasyAR sample scene: " + scene);
        }
    }
}
`;
}

export function buildBuildSettingsHelper(sample: SampleInfo, platform: typeof buildPlatforms[number]): string {
  const sceneNames = sample.unityScenes.map((scene) => `            "${escapeCsharp(scene)}"`).join(",\n");
  const switchTarget = buildTargetSwitchSnippet(platform);
  return `using System;
using System.Linq;
using UnityEditor;

namespace EasyAR.EditorTools
{
    public static class EasyARBuildSettingsHelper
    {
        private static readonly string[] SceneNameHints =
        {
${sceneNames}
        };

        [MenuItem("Tools/EasyAR/Configure Build Settings")]
        public static void ConfigureBuildSettings()
        {
            var scene = AssetDatabase.FindAssets("t:Scene")
                .Select(AssetDatabase.GUIDToAssetPath)
                .FirstOrDefault(path => SceneNameHints.Any(hint => path.IndexOf(hint, StringComparison.OrdinalIgnoreCase) >= 0));

            if (string.IsNullOrEmpty(scene))
            {
                throw new InvalidOperationException("No matching EasyAR sample scene found. Import the official ${escapeCsharp(sample.name)} sample first.");
            }

            var existingScenes = EditorBuildSettings.scenes
                .Where(item => item != null && !string.IsNullOrEmpty(item.path) && item.path != scene)
                .ToList();
            existingScenes.Insert(0, new EditorBuildSettingsScene(scene, true));
            EditorBuildSettings.scenes = existingScenes.ToArray();

${switchTarget}
            UnityEngine.Debug.Log("Configured EasyAR Build Settings with sample scene: " + scene);
        }
    }
}
`;
}

export function buildSampleValidationHelper(sample: SampleInfo): string {
  const sceneNames = sample.unityScenes.map((scene) => `            "${escapeCsharp(scene)}"`).join(",\n");
  const sampleValidation = sample.id === "image-tracking"
    ? `            var targetAssets = AssetDatabase.FindAssets("")
                .Select(AssetDatabase.GUIDToAssetPath)
                .Where(IsImageTrackingTargetAsset)
                .ToArray();
            if (targetAssets.Length == 0)
            {
                throw new InvalidOperationException("No Image Tracking target asset hints found. Add target images, target data, or official Image Tracking sample assets under Assets.");
            }
            if (!HasOfficialImageTargetsStreamingAssets())
            {
                throw new InvalidOperationException("Official Image Tracking StreamingAssets are missing. Import Samples~/StreamingAssets/ImageTargets/ImageTargets.unitypackage so Assets/StreamingAssets/EasyARSamples/ImageTargets contains namecard.jpg, namecard.etd, and idback.etd.");
            }
            UnityEngine.Debug.Log("Validated Image Tracking target asset hints: " + string.Join(", ", targetAssets.Take(5)));
`
    : sample.id === "cloud-recognition"
      ? `            var localConfigPath = Path.Combine(Directory.GetCurrentDirectory(), "ProjectSettings", "EasyAR", "easyar.local.json");
            if (!File.Exists(localConfigPath))
            {
                throw new InvalidOperationException("Cloud Recognition requires ProjectSettings/EasyAR/easyar.local.json.");
            }
            var localConfig = File.ReadAllText(localConfigPath);
            if (!ContainsConfiguredJsonString(localConfig, "appId") || !ContainsConfiguredJsonString(localConfig, "serverAddress") || !ContainsConfiguredJsonString(localConfig, "apiKey") || !ContainsConfiguredJsonString(localConfig, "apiSecret"))
            {
                throw new InvalidOperationException("Cloud Recognition requires appId, serverAddress, apiKey, and apiSecret in easyar.local.json.");
            }
            UnityEngine.Debug.Log("Validated Cloud Recognition local credential presence without printing secret values.");
`
      : sample.id === "mega"
        ? `            var megaAssets = AssetDatabase.FindAssets("")
                .Select(AssetDatabase.GUIDToAssetPath)
                .Where(IsMegaAssetSignal)
                .ToArray();
            if (megaAssets.Length == 0)
            {
                throw new InvalidOperationException("No Mega sample or Mega Block asset hints found. Import the official EasyAR Sense Unity Plugin for Mega and load the selected Mega Block first.");
            }
            ValidateMegaSettings();
            ValidateMegaLocationInputMode(scene);
            ValidateMegaBlockRoot(scene);
            UnityEngine.Debug.Log("Validated Mega asset hints without printing service credentials: " + string.Join(", ", megaAssets.Take(5)));
`
        : `            throw new InvalidOperationException("This generated validation helper is only focused on Image Tracking, Cloud Recognition, and Mega.");
`;

  return `using System;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using UnityEditor;

namespace EasyAR.EditorTools
{
    public static class EasyARSampleValidationHelper
    {
        private static readonly string[] SceneNameHints =
        {
${sceneNames}
        };

        [MenuItem("Tools/EasyAR/Validate Focused Sample")]
        public static void ValidateFocusedSample()
        {
            var easyarAssets = AssetDatabase.FindAssets("EasyAR")
                .Select(AssetDatabase.GUIDToAssetPath)
                .Where(IsOfficialEasyARAssetSignal)
                .ToArray();
            if (easyarAssets.Length == 0)
            {
                throw new InvalidOperationException("No official EasyAR asset signals found. Import the official EasyAR Unity Plugin package first. Generated MCP helper files do not count.");
            }

            var scene = AssetDatabase.FindAssets("t:Scene")
                .Select(AssetDatabase.GUIDToAssetPath)
                .FirstOrDefault(IsMatchingSampleScene);
            if (string.IsNullOrEmpty(scene))
            {
                throw new InvalidOperationException("No matching ${escapeCsharp(sample.name)} scene found. Import the official focused sample scene first.");
            }

            var sceneInBuildSettings = EditorBuildSettings.scenes
                .Any(item => item != null && item.enabled && item.path == scene);
            if (!sceneInBuildSettings)
            {
                throw new InvalidOperationException("Matching sample scene is not enabled in Build Settings. Run EasyARBuildSettingsHelper.ConfigureBuildSettings first.");
            }

            var firstEnabledScene = EditorBuildSettings.scenes
                .Where(item => item != null && item.enabled && !string.IsNullOrEmpty(item.path))
                .Select(item => item.path)
                .FirstOrDefault();
            if (!string.Equals(firstEnabledScene, scene, StringComparison.Ordinal))
            {
                throw new InvalidOperationException("Matching sample scene is enabled but is not the first enabled Build Settings scene. Run EasyARBuildSettingsHelper.ConfigureBuildSettings again.");
            }

${sampleValidation}
            UnityEngine.Debug.Log("EasyAR focused sample validation passed for ${escapeCsharp(sample.name)}. Scene: " + scene + ". EasyAR signals: " + easyarAssets.Length + ".");
        }

        private static bool IsMatchingSampleScene(string path)
        {
            return !IsGeneratedSupportAsset(path)
                && SceneNameHints.Any(hint => path.IndexOf(hint, StringComparison.OrdinalIgnoreCase) >= 0);
        }

        private static bool IsOfficialEasyARAssetSignal(string path)
        {
            return !IsGeneratedSupportAsset(path)
                && !IsGeneratedEditorHelper(path)
                && path.IndexOf("EasyAR", StringComparison.OrdinalIgnoreCase) >= 0;
        }

        private static bool IsImageTrackingTargetAsset(string path)
        {
            if (IsGeneratedSupportAsset(path) || IsGeneratedEditorHelper(path))
            {
                return false;
            }

            var normalized = path.Replace('\\\\', '/');
            var extension = Path.GetExtension(path);
            var hasTargetExtension = string.Equals(extension, ".jpg", StringComparison.OrdinalIgnoreCase)
                || string.Equals(extension, ".jpeg", StringComparison.OrdinalIgnoreCase)
                || string.Equals(extension, ".png", StringComparison.OrdinalIgnoreCase)
                || string.Equals(extension, ".json", StringComparison.OrdinalIgnoreCase)
                || string.Equals(extension, ".xml", StringComparison.OrdinalIgnoreCase)
                || string.Equals(extension, ".etd", StringComparison.OrdinalIgnoreCase);
            return hasTargetExtension
                && (normalized.IndexOf("/ImageTargets/", StringComparison.OrdinalIgnoreCase) >= 0
                    || normalized.IndexOf("/Targets/", StringComparison.OrdinalIgnoreCase) >= 0
                    || normalized.IndexOf("target", StringComparison.OrdinalIgnoreCase) >= 0);
        }

        private static bool IsMegaAssetSignal(string path)
        {
            if (IsGeneratedSupportAsset(path) || IsGeneratedEditorHelper(path))
            {
                return false;
            }

            var normalized = path.Replace('\\\\', '/');
            return normalized.IndexOf("Mega", StringComparison.OrdinalIgnoreCase) >= 0
                || normalized.IndexOf("MegaBlock", StringComparison.OrdinalIgnoreCase) >= 0
                || normalized.IndexOf("CloudLocalizer", StringComparison.OrdinalIgnoreCase) >= 0
                || normalized.IndexOf("TiantanSkyPalace", StringComparison.OrdinalIgnoreCase) >= 0;
        }

        private static bool HasOfficialImageTargetsStreamingAssets()
        {
            return File.Exists(Path.Combine(Directory.GetCurrentDirectory(), "Assets", "StreamingAssets", "EasyARSamples", "ImageTargets", "namecard.jpg"))
                && File.Exists(Path.Combine(Directory.GetCurrentDirectory(), "Assets", "StreamingAssets", "EasyARSamples", "ImageTargets", "namecard.etd"))
                && File.Exists(Path.Combine(Directory.GetCurrentDirectory(), "Assets", "StreamingAssets", "EasyARSamples", "ImageTargets", "idback.etd"));
        }

        private static void ValidateMegaSettings()
        {
            var settingsPath = Path.Combine(Directory.GetCurrentDirectory(), "Assets", "XR", "Settings", "EasyAR Settings.asset");
            if (!File.Exists(settingsPath))
            {
                throw new InvalidOperationException("Mega requires Assets/XR/Settings/EasyAR Settings.asset with local package license and Global Mega Block service config.");
            }

            var settings = File.ReadAllText(settingsPath);
            var block = ExtractYamlBlock(settings, "GlobalMegaBlockLocalizationServiceConfig");
            var missing = new[]
            {
                HasConfiguredYamlScalar(settings, "LicenseKey") ? null : "LicenseKey",
                HasConfiguredYamlScalar(block, "AppID") ? null : "GlobalMegaBlock.AppID",
                HasConfiguredYamlScalar(block, "ServerAddress") ? null : "GlobalMegaBlock.ServerAddress",
                HasConfiguredYamlScalar(block, "APIKey") ? null : "GlobalMegaBlock.APIKey",
                HasConfiguredYamlScalar(block, "APISecret") ? null : "GlobalMegaBlock.APISecret"
            }
                .Where(item => item != null)
                .ToArray();
            if (missing.Length > 0)
            {
                throw new InvalidOperationException("Mega EasyAR Settings missing configured field presence: " + string.Join(", ", missing) + ". Fill values locally; do not paste secrets into chat.");
            }
        }

        private static void ValidateMegaLocationInputMode(string scenePath)
        {
            var scene = File.ReadAllText(scenePath);
            var match = Regex.Match(scene, @"locationInputMode:\\s*(\\d+)");
            if (!match.Success)
            {
                throw new InvalidOperationException("Mega scene does not serialize locationInputMode. Set Location Input Mode to Onsite for Android phone validation, or Simulator for the documented PICO 4 Ultra Enterprise headset path.");
            }
            if (match.Groups[1].Value == "0")
            {
                return;
            }
            if (match.Groups[1].Value == "1" && IsPicoHeadsetProject())
            {
                UnityEngine.Debug.Log("Mega LocationInputMode is Simulator in a PICO headset project. This is accepted for PICO 4 Ultra Enterprise because the headset does not expose an Android GPS provider; the EasyAR Simulator diagnostics caution should be recorded in run evidence.");
                return;
            }
            throw new InvalidOperationException("Mega LocationInputMode must be Onsite (0) for Android phone validation. Simulator (1) is accepted only for the documented PICO 4 Ultra Enterprise headset path.");
        }

        private static bool IsPicoHeadsetProject()
        {
            var manifestPath = Path.Combine(Directory.GetCurrentDirectory(), "Packages", "manifest.json");
            var manifest = File.Exists(manifestPath) ? File.ReadAllText(manifestPath) : string.Empty;
            if (manifest.IndexOf("com.unity.xr.picoxr", StringComparison.OrdinalIgnoreCase) >= 0 ||
                manifest.IndexOf("com.easyar.sense.ext.pico", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return true;
            }
            return Directory.GetFiles(Path.Combine(Directory.GetCurrentDirectory(), "Assets"), "*", SearchOption.AllDirectories)
                .Any(path => path.IndexOf("PicoFrameSource", StringComparison.OrdinalIgnoreCase) >= 0 ||
                             path.IndexOf("PXR_", StringComparison.OrdinalIgnoreCase) >= 0 ||
                             path.IndexOf("picoxr", StringComparison.OrdinalIgnoreCase) >= 0);
        }
        }

        private static void ValidateMegaBlockRoot(string scenePath)
        {
            var scene = File.ReadAllText(scenePath);
            var matches = Regex.Matches(scene, @"BlockRootSource:\\s*(\\d+)[\\s\\S]*?blockRoot:\\s*\\{fileID:\\s*([^}\\s]+)[^}]*\\}");
            if (matches.Count == 0)
            {
                throw new InvalidOperationException("Mega scene does not serialize BlockHolder BlockRootSource. Confirm the scene has a BlockHolder before real-device validation.");
            }

            foreach (Match match in matches)
            {
                var source = match.Groups[1].Value;
                var fileId = match.Groups[2].Value;
                if (source == "0" && fileId == "0")
                {
                    throw new InvalidOperationException("Mega BlockHolder uses External BlockRootSource with an empty blockRoot. Set BlockRootSource to Internal/Mixed, or assign a BlockRoot generated by Mega Studio, before real-device validation.");
                }
            }
        }

        private static string ExtractYamlBlock(string yaml, string key)
        {
            var match = Regex.Match(yaml, @"^  " + Regex.Escape(key) + @":\\s*\\n([\\s\\S]*?)(?:\\n  [A-Za-z].*:|\\z)", RegexOptions.Multiline);
            return match.Success ? match.Groups[1].Value : string.Empty;
        }

        private static bool HasConfiguredYamlScalar(string yaml, string key)
        {
            var match = Regex.Match(yaml, @"^\\s*" + Regex.Escape(key) + @":\\s*(.*)$", RegexOptions.Multiline);
            if (!match.Success)
            {
                return false;
            }
            var value = match.Groups[1].Value.Trim();
            return value.Length > 0
                && value.IndexOf("paste-", StringComparison.OrdinalIgnoreCase) < 0
                && value.IndexOf("placeholder", StringComparison.OrdinalIgnoreCase) < 0
                && value.IndexOf("your_", StringComparison.OrdinalIgnoreCase) < 0;
        }

        private static bool IsGeneratedSupportAsset(string path)
        {
            return path.Replace('\\\\', '/').StartsWith("Assets/EasyARGenerated/", StringComparison.OrdinalIgnoreCase);
        }

        private static bool IsGeneratedEditorHelper(string path)
        {
            var normalized = path.Replace('\\\\', '/');
            return normalized.StartsWith("Assets/Editor/EasyAR", StringComparison.OrdinalIgnoreCase)
                && string.Equals(Path.GetExtension(normalized), ".cs", StringComparison.OrdinalIgnoreCase);
        }

        private static bool ContainsConfiguredJsonString(string json, string key)
        {
            var match = Regex.Match(json, "\\\\\\"" + Regex.Escape(key) + "\\\\\\"\\\\s*:\\\\s*\\\\\\"([^\\\\\\"]*)\\\\\\"");
            if (!match.Success)
            {
                return false;
            }
            var value = match.Groups[1].Value.Trim();
            return value.Length > 0
                && value.IndexOf("paste-", StringComparison.OrdinalIgnoreCase) < 0
                && value.IndexOf("placeholder", StringComparison.OrdinalIgnoreCase) < 0
                && value.IndexOf("your_", StringComparison.OrdinalIgnoreCase) < 0;
        }
    }
}
`;
}

export function buildLocalConfigBridgeEditor(sample: SampleInfo): string {
  const cloudValidation = sample.id === "cloud-recognition"
    ? `            RequireConfiguredJsonString(json, "appId", "Cloud Recognition appId is missing or still a placeholder.");
            RequireConfiguredJsonString(json, "serverAddress", "Cloud Recognition serverAddress is missing or still a placeholder.");
            RequireConfiguredJsonString(json, "apiKey", "Cloud Recognition apiKey is missing or still a placeholder.");
            RequireConfiguredJsonString(json, "apiSecret", "Cloud Recognition apiSecret is missing or still a placeholder.");
`
    : "";
  const runtimeCloudFields = sample.id === "cloud-recognition"
    ? `                + "    ,\\"cloudRecognition\\": {\\n"
                + "      \\"appId\\": \\"" + JsonEscape(ReadOptionalJsonString(json, "appId")) + "\\",\\n"
                + "      \\"serverAddress\\": \\"" + JsonEscape(ReadOptionalJsonString(json, "serverAddress")) + "\\",\\n"
                + "      \\"apiKey\\": \\"" + JsonEscape(ReadOptionalJsonString(json, "apiKey")) + "\\",\\n"
                + "      \\"apiSecret\\": \\"" + JsonEscape(ReadOptionalJsonString(json, "apiSecret")) + "\\"\\n"
                + "    }\\n"`
    : "";
  const applyCloudRecognizerConfig = sample.id === "cloud-recognition"
    ? `
            ApplyCloudRecognizerGlobalConfig(json);
`
    : "";
  const cloudRecognizerConfigMethods = sample.id === "cloud-recognition"
    ? `
        private static void ApplyCloudRecognizerGlobalConfig(string json)
        {
            var settings = easyar.EasyARSettings.Instance;
            if (settings == null)
            {
                throw new InvalidOperationException("EasyAR Settings asset is missing. Open EasyAR > Sense > Configuration or import the EasyAR Sense Unity Plugin settings before exporting runtime config.");
            }

            settings.GlobalCloudRecognizerServiceConfig.AppID = ReadConfiguredJsonString(json, "appId");
            settings.GlobalCloudRecognizerServiceConfig.ServerAddress = ReadConfiguredJsonString(json, "serverAddress");
            settings.GlobalCloudRecognizerServiceConfig.APIKey = ReadConfiguredJsonString(json, "apiKey");
            settings.GlobalCloudRecognizerServiceConfig.APISecret = ReadConfiguredJsonString(json, "apiSecret");
            EditorUtility.SetDirty(settings);
            AssetDatabase.SaveAssets();
        }
`
    : "";

  return `using System;
using System.IO;
using System.Text.RegularExpressions;
using UnityEditor;

namespace EasyAR.EditorTools
{
    public static class EasyARLocalConfigBridge
    {
        private const string SourceRelativePath = "ProjectSettings/EasyAR/easyar.local.json";
        private const string RuntimeRelativePath = "Assets/StreamingAssets/EasyAR/easyar.runtime.json";

        [MenuItem("Tools/EasyAR/Export Local Config For Runtime")]
        public static void ExportRuntimeConfig()
        {
            var projectRoot = Directory.GetCurrentDirectory();
            var sourcePath = Path.Combine(projectRoot, SourceRelativePath);
            if (!File.Exists(sourcePath))
            {
                throw new InvalidOperationException("Missing " + SourceRelativePath + ". Fill it locally before exporting runtime config.");
            }

            var json = File.ReadAllText(sourcePath);
            RequireConfiguredJsonString(json, "licenseKey", "EasyAR licenseKey is missing or still a placeholder.");
${cloudValidation}
            var targetPath = Path.Combine(projectRoot, RuntimeRelativePath);
            Directory.CreateDirectory(Path.GetDirectoryName(targetPath));
            File.WriteAllText(targetPath, BuildRuntimeJson(json));
            AssetDatabase.ImportAsset(RuntimeRelativePath);
${applyCloudRecognizerConfig}            UnityEngine.Debug.Log("Exported EasyAR runtime config to " + RuntimeRelativePath + " and applied EasyAR global service config without printing secret values. The file must stay ignored by git.");
        }

        private static void RequireConfiguredJsonString(string json, string key, string message)
        {
            if (!ContainsConfiguredJsonString(json, key))
            {
                throw new InvalidOperationException(message);
            }
        }

        private static bool ContainsConfiguredJsonString(string json, string key)
        {
            var match = Regex.Match(json, "\\\\\\"" + Regex.Escape(key) + "\\\\\\"\\\\s*:\\\\s*\\\\\\"([^\\\\\\"]*)\\\\\\"");
            if (!match.Success)
            {
                return false;
            }
            var value = match.Groups[1].Value.Trim();
            return value.Length > 0
                && value.IndexOf("paste-", StringComparison.OrdinalIgnoreCase) < 0
                && value.IndexOf("placeholder", StringComparison.OrdinalIgnoreCase) < 0
                && value.IndexOf("your_", StringComparison.OrdinalIgnoreCase) < 0;
        }

        private static string BuildRuntimeJson(string json)
        {
            return "{\\n"
                + "  \\"easyar\\": {\\n"
                + "    \\"licenseKey\\": \\"" + JsonEscape(ReadConfiguredJsonString(json, "licenseKey")) + "\\"\\n"
${runtimeCloudFields}
                + "  },\\n"
                + "  \\"unity\\": {\\n"
                + "    \\"targetPlatform\\": \\"" + JsonEscape(ReadOptionalJsonString(json, "targetPlatform")) + "\\",\\n"
                + "    \\"bundleIdentifier\\": \\"" + JsonEscape(ReadOptionalJsonString(json, "bundleIdentifier")) + "\\"\\n"
                + "  }\\n"
                + "}\\n";
        }
${cloudRecognizerConfigMethods}

        private static string ReadConfiguredJsonString(string json, string key)
        {
            var value = ReadOptionalJsonString(json, key);
            return ContainsConfiguredValue(value) ? value : string.Empty;
        }

        private static string ReadOptionalJsonString(string json, string key)
        {
            var match = Regex.Match(json, "\\\\\\"" + Regex.Escape(key) + "\\\\\\"\\\\s*:\\\\s*\\\\\\"([^\\\\\\"]*)\\\\\\"");
            return match.Success ? match.Groups[1].Value.Trim() : string.Empty;
        }

        private static bool ContainsConfiguredValue(string value)
        {
            return value.Length > 0
                && value.IndexOf("paste-", StringComparison.OrdinalIgnoreCase) < 0
                && value.IndexOf("placeholder", StringComparison.OrdinalIgnoreCase) < 0
                && value.IndexOf("your_", StringComparison.OrdinalIgnoreCase) < 0;
        }

        private static string JsonEscape(string value)
        {
            return (value ?? string.Empty)
                .Replace("\\\\", "\\\\\\\\")
                .Replace("\\"", "\\\\\\"")
                .Replace("\\r", "\\\\r")
                .Replace("\\n", "\\\\n");
        }
    }
}
`;
}

export function buildLocalConfigBridgeRuntime(): string {
  return `using System;
using System.Collections;
using System.Text.RegularExpressions;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.Networking;

namespace EasyAR.Samples.Generated
{
    public sealed class EasyARLocalConfigRuntime : MonoBehaviour
    {
        private const string RuntimeRelativePath = "EasyAR/easyar.runtime.json";

        public static EasyARLocalConfigRuntime Instance { get; private set; }

        [SerializeField] private UnityEvent onConfigLoaded = new UnityEvent();

        private bool loadOnAwake = true;
        private bool dontDestroyOnLoad = true;
        private Coroutine loadRoutine;
        public bool Loaded { get; private set; }
        public string LicenseKey { get; private set; }
        public string BundleIdentifier { get; private set; }
        public string CloudRecognitionAppId { get; private set; }
        public string CloudRecognitionServerAddress { get; private set; }
        public string CloudRecognitionApiKey { get; private set; }
        public string CloudRecognitionApiSecret { get; private set; }

        public bool HasLicenseKey => IsConfigured(LicenseKey);
        public bool HasCloudRecognitionCredentials =>
            IsConfigured(CloudRecognitionAppId)
            && IsConfigured(CloudRecognitionServerAddress)
            && IsConfigured(CloudRecognitionApiKey)
            && IsConfigured(CloudRecognitionApiSecret);

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            if (dontDestroyOnLoad)
            {
                DontDestroyOnLoad(gameObject);
            }

            if (loadOnAwake)
            {
                loadRoutine = StartCoroutine(Load());
            }
        }

        private void OnDisable()
        {
            if (loadRoutine != null)
            {
                StopCoroutine(loadRoutine);
                loadRoutine = null;
            }
        }

        public IEnumerator Load()
        {
            var path = System.IO.Path.Combine(Application.streamingAssetsPath, RuntimeRelativePath);
            string json;
            if (path.Contains("://") || path.Contains(":///"))
            {
                using (var request = UnityWebRequest.Get(path))
                {
                    yield return request.SendWebRequest();
                    if (request.result != UnityWebRequest.Result.Success)
                    {
                        Debug.LogError("EasyAR runtime config could not be loaded from StreamingAssets. Export it before building.");
                        yield break;
                    }
                    json = request.downloadHandler.text;
                }
            }
            else
            {
                if (!System.IO.File.Exists(path))
                {
                    Debug.LogError("EasyAR runtime config is missing from StreamingAssets. Export it before building.");
                    yield break;
                }
                json = System.IO.File.ReadAllText(path);
            }

            ApplyJson(json);
            Loaded = true;
            Debug.Log("EasyAR runtime config loaded. License present: " + HasLicenseKey + ", cloud credentials present: " + HasCloudRecognitionCredentials + ".");
            if (onConfigLoaded != null)
            {
                onConfigLoaded.Invoke();
            }
        }

        public void ApplyJson(string json)
        {
            LicenseKey = ReadString(json, "licenseKey");
            BundleIdentifier = ReadString(json, "bundleIdentifier");
            CloudRecognitionAppId = ReadString(json, "appId");
            CloudRecognitionServerAddress = ReadString(json, "serverAddress");
            CloudRecognitionApiKey = ReadString(json, "apiKey");
            CloudRecognitionApiSecret = ReadString(json, "apiSecret");
        }

        private static string ReadString(string json, string key)
        {
            var match = Regex.Match(json ?? string.Empty, "\\\\\\"" + Regex.Escape(key) + "\\\\\\"\\\\s*:\\\\s*\\\\\\"([^\\\\\\"]*)\\\\\\"");
            return match.Success ? match.Groups[1].Value.Trim() : string.Empty;
        }

        private static bool IsConfigured(string value)
        {
            return !string.IsNullOrWhiteSpace(value)
                && value.IndexOf("paste-", StringComparison.OrdinalIgnoreCase) < 0
                && value.IndexOf("placeholder", StringComparison.OrdinalIgnoreCase) < 0
                && value.IndexOf("your_", StringComparison.OrdinalIgnoreCase) < 0;
        }
    }
}
`;
}

export function buildDeviceBuildHelper(
  platform: typeof deviceBuildPlatforms[number],
  outputPath: string,
  developmentBuild: boolean
): string {
  const target = deviceBuildTarget(platform);
  const options = developmentBuild ? "BuildOptions.Development" : "BuildOptions.None";
  return `using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.Build.Reporting;

namespace EasyAR.EditorTools
{
    public static class EasyARDeviceBuildHelper
    {
        private const string OutputPath = "${escapeCsharp(outputPath)}";

        [MenuItem("Tools/EasyAR/Build Device Player")]
        public static void Build()
        {
            ${target.switchTarget}

            var scenes = EditorBuildSettings.scenes
                .Where(scene => scene != null && scene.enabled && !string.IsNullOrEmpty(scene.path))
                .Select(scene => scene.path)
                .ToArray();

            if (scenes.Length == 0)
            {
                throw new InvalidOperationException("No enabled scenes found in Build Settings. Run EasyARBuildSettingsHelper.ConfigureBuildSettings first.");
            }

            var outputDirectory = Path.GetDirectoryName(OutputPath);
            if (!string.IsNullOrEmpty(outputDirectory))
            {
                Directory.CreateDirectory(outputDirectory);
            }

            var report = BuildPipeline.BuildPlayer(scenes, OutputPath, ${target.buildTarget}, ${options});
            if (report.summary.result != BuildResult.Succeeded)
            {
                throw new InvalidOperationException("EasyAR player build failed: " + report.summary.result);
            }

            UnityEngine.Debug.Log("EasyAR player build succeeded: " + OutputPath);
        }
    }
}
`;
}

export function buildMobileSettingsHelper(
  platform: typeof mobilePlatforms[number],
  bundleIdentifier: string,
  cameraUsageDescription: string | null,
  minSdkVersion: number | null
): string {
  const iosCameraText = cameraUsageDescription ?? "EasyAR uses the camera to provide augmented reality tracking.";
  const androidMinSdk = minSdkVersion ?? 23;
  const body = platform === "android"
    ? `            PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.Android, BundleIdentifier);
            PlayerSettings.Android.minSdkVersion = (AndroidSdkVersions)${androidMinSdk};
            PlayerSettings.Android.forceInternetPermission = true;
            PlayerSettings.Android.forceSDCardPermission = false;
            EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.Android, BuildTarget.Android);
`
    : `            PlayerSettings.SetApplicationIdentifier(BuildTargetGroup.iOS, BundleIdentifier);
            PlayerSettings.iOS.cameraUsageDescription = CameraUsageDescription;
            EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.iOS, BuildTarget.iOS);
`;

  return `using UnityEditor;

namespace EasyAR.EditorTools
{
    public static class EasyARMobileSettingsHelper
    {
        private const string BundleIdentifier = "${escapeCsharp(bundleIdentifier)}";
        private const string CameraUsageDescription = "${escapeCsharp(iosCameraText)}";

        [MenuItem("Tools/EasyAR/Configure Mobile Settings")]
        public static void ConfigureMobileSettings()
        {
${body}
            PlayerSettings.use32BitDisplayBuffer = false;
            UnityEngine.Debug.Log("Configured EasyAR mobile player settings for ${escapeCsharp(platform)} with bundle identifier: " + BundleIdentifier);
        }
    }
}
`;
}

export function deviceBuildTarget(platform: typeof deviceBuildPlatforms[number]) {
  if (platform === "android") {
    return {
      buildTarget: "BuildTarget.Android",
      switchTarget: "EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.Android, BuildTarget.Android);"
    };
  }

  if (platform === "ios") {
    return {
      buildTarget: "BuildTarget.iOS",
      switchTarget: "EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.iOS, BuildTarget.iOS);"
    };
  }

  return {
    buildTarget: "BuildTarget.StandaloneOSX",
    switchTarget: "EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.Standalone, BuildTarget.StandaloneOSX);"
  };
}

export function buildTargetSwitchSnippet(platform: typeof buildPlatforms[number]): string {
  if (platform === "android") {
    return `            EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.Android, BuildTarget.Android);
`;
  }

  if (platform === "ios") {
    return `            EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.iOS, BuildTarget.iOS);
`;
  }

  if (platform === "standalone") {
    return `            EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.Standalone, BuildTarget.StandaloneOSX);
`;
  }

  return "            // No build target switch requested.\n";
}

export function buildLocalConfigExample(sample: SampleInfo): string {
  const needsCloudRecognition = sample.id === "cloud-recognition";
  const needsMega = sample.id === "mega";
  return `${JSON.stringify(
    {
      _instructions: {
        purpose: "Copy this file to easyar.local.json and fill it locally after official EasyAR registration/login.",
        officialAccountFlow: [
          "Register or log in through https://www.easyar.cn/ or the EasyAR development center in a browser.",
          "Create or locate the EasyAR Sense license for the Unity bundle/package identifier below.",
          ...(needsCloudRecognition
            ? ["Create or locate Cloud Recognition/CRS credentials in the official EasyAR account: the Cloud Recognition/CRS library AppId, Client-end Target Recognition URL, API KEY, and API Secret."]
            : needsMega
              ? ["Use the already logged-in EasyAR website or Mega Studio session to find the cloud localization library and Mega Block identifiers; Unity runtime uses local EasyAR/Mega settings rather than website login."]
              : ["Cloud Recognition credentials can stay empty for the Image Tracking focused sample."])
        ],
        neverShareInChat: [
          "EasyAR website password",
          "SMS/email/authenticator verification codes",
          "easyar.accountToken",
          "easyar.licenseKey",
          "easyar.cloudRecognition.serverAddress",
          "easyar.cloudRecognition.apiKey",
          "easyar.cloudRecognition.apiSecret",
          "easyar.cloudRecognition.appKey",
          "easyar.cloudRecognition.appSecret",
          "easyar.mega.apiKey",
          "easyar.mega.apiSecret",
          "easyar.mega.licenseKey"
        ],
        envAlternative: {
          tool: "easyar_write_local_config_from_env",
          accountToken: ["EASYAR_ACCOUNT_TOKEN"],
          licenseKey: ["EASYAR_LICENSE_KEY", "EASYAR_SENSE_LICENSE_KEY"],
          bundleIdentifier: ["EASYAR_BUNDLE_IDENTIFIER", "EASYAR_UNITY_BUNDLE_IDENTIFIER"],
          cloudAppId: ["EASYAR_CLOUD_APP_ID", "EASYAR_CLOUD_RECOGNITION_APP_ID"],
          cloudServerAddress: ["EASYAR_CLOUD_SERVER_ADDRESS", "EASYAR_CLOUD_RECOGNITION_SERVER_ADDRESS", "EASYAR_CRS_SERVER_ADDRESS", "EASYAR_CRS_RECOGNITION_URL"],
          cloudApiKey: ["EASYAR_CLOUD_API_KEY", "EASYAR_CLOUD_RECOGNITION_API_KEY", "EASYAR_CLOUD_APP_KEY", "EASYAR_CLOUD_RECOGNITION_APP_KEY"],
          cloudApiSecret: ["EASYAR_CLOUD_API_SECRET", "EASYAR_CLOUD_RECOGNITION_API_SECRET", "EASYAR_CLOUD_APP_SECRET", "EASYAR_CLOUD_RECOGNITION_APP_SECRET"],
          megaAppId: ["EASYAR_MEGA_APP_ID"],
          megaServerAddress: ["EASYAR_MEGA_SERVER", "EASYAR_MEGA_SERVER_ADDRESS"],
          megaApiKey: ["EASYAR_MEGA_API_KEY"],
          megaApiSecret: ["EASYAR_MEGA_API_SECRET"]
        },
        validation: "Run easyar_validate_local_config after editing. The MCP server reports field presence and placeholders only, never secret values."
      },
      sampleId: sample.id,
      sampleName: sample.name,
      easyar: {
        apiBaseUrl: "https://www.easyar.cn",
        accountToken: "",
        licenseKey: "local-only-placeholder-fill-in-ignored-config",
        cloudRecognition: {
          appId: "",
          serverAddress: "",
          apiKey: "",
          apiSecret: "",
          appKey: "",
          appSecret: "",
          credentialMode: ""
        },
        mega: {
          cloudLocalizationLibraryName: needsMega ? "local-only-placeholder-fill-from-logged-in-easyar-website" : "",
          megaBlockStorageName: needsMega ? "local-only-placeholder-fill-from-mega-studio" : "",
          megaBlockName: needsMega ? "local-only-placeholder-fill-from-mega-studio" : "",
          megaBlockId: needsMega ? "local-only-placeholder-fill-from-mega-studio" : "",
          appId: needsMega ? "local-only-placeholder-fill-from-easyar-cloud-localization-library" : "",
          serverAddress: needsMega ? "local-only-placeholder-fill-from-local-mega-settings" : "",
          apiKey: needsMega ? "local-only-placeholder-fill-locally-never-share" : "",
          apiSecret: needsMega ? "local-only-placeholder-fill-locally-never-share" : "",
          locationInputMode: needsMega ? "Onsite for Android phone validation; Simulator for documented PICO 4 Ultra Enterprise headset validation" : ""
        }
      },
      unity: {
        targetPlatform: "android",
        bundleIdentifier: defaultBundleIdentifier(sample),
        notes: sample.setupNotes
      }
    },
    null,
    2
  )}\n`;
}

export function buildFocusedSampleRunbook(sample: SampleInfo): string {
  const commonSteps = [
    `# ${sample.name} Runbook`,
    "",
    `Sample id: \`${sample.id}\``,
    `Implementation status: \`${sample.implementationStatus}\``,
    "",
    "## Before Unity",
    "",
    "1. Run `easyar_write_account_onboarding` and `easyar_write_account_materials` if the EasyAR account, license, or Cloud Recognition credentials are not ready.",
    "2. Run `easyar_write_unity_environment_report` to record `EASYAR_UNITY_PATH` setup before any Unity batch command.",
    "3. Run `easyar_write_focused_preflight` and read `PREFLIGHT.md` before executing Unity automation.",
    "4. Import the official EasyAR Unity Plugin and matching official sample scenes.",
    "5. Copy `ProjectSettings/EasyAR/easyar.local.json.example` to `ProjectSettings/EasyAR/easyar.local.json` or run `easyar_write_local_config_from_env`.",
    "6. Fill the local EasyAR license key and account-scoped values without committing the file.",
    "7. Run `easyar_validate_local_config` and `easyar_check_sample_readiness`.",
    "",
    "## Unity Automation",
    "",
    "1. Run `EasyAR.EditorTools.EasyARMobileSettingsHelper.ConfigureMobileSettings`.",
    "2. Run `EasyAR.EditorTools.EasyARBuildSettingsHelper.ConfigureBuildSettings`.",
    "3. Open the matching official sample scene with `EasyAR.EditorTools.EasyARSampleRunner.OpenSampleScene` if needed.",
    "4. Build and test on a real Android or iOS device."
  ];

  if (sample.id === "image-tracking") {
    return [
      ...commonSteps,
      "",
      "## Image Tracking Checklist",
      "",
      "1. Add target images or official Image Tracking target assets under `Assets`.",
      "2. Confirm target physical size and image quality in the EasyAR target workflow.",
      "3. Keep target texture import settings stable after the sample is working.",
      "4. Test with stable lighting and a printed or screen-displayed target.",
      "",
      "Expected readiness checks:",
      "",
      "- `image-target-assets` should find a target image, target JSON/XML, `.etd`, or similarly named asset.",
      "- `sample-scene` should find an official Image Tracking scene."
    ].join("\n") + "\n";
  }

  if (sample.id === "cloud-recognition") {
    return [
      ...commonSteps,
      "",
      "## Cloud Recognition Checklist",
      "",
      "1. Fill `easyar.cloudRecognition.appId` and `apiKey` in local config. Legacy `appKey`/`appSecret` aliases are still accepted.",
      "2. Confirm network access is allowed on the target platform.",
      "3. Create or verify the cloud database/target library in the official EasyAR account.",
      "4. Upload at least one test target image to the Cloud Recognition library and keep a non-secret library name, target count, or dashboard URL for evidence.",
      "5. Test on a real device with a network path to the selected EasyAR cloud recognition service.",
      "",
      "Expected readiness checks:",
      "",
      "- `cloud-recognition-credentials` should report CRS AppId + API Key configured.",
      "- The EasyAR account should show at least one uploaded Cloud Recognition target image for the selected AppId/API KEY.",
      "- `sample-scene` should find an official Cloud Recognition scene."
    ].join("\n") + "\n";
  }

  if (sample.id === "mega") {
    return [
      ...commonSteps,
      "",
      "## Mega Checklist",
      "",
      "1. Install the official EasyAR Sense Unity Plugin for Mega from the EasyAR download page.",
      "2. Use the already logged-in EasyAR website or Mega Studio session to locate the cloud localization library, Mega Block storage, Mega Block name, and Block ID.",
      "3. Load or bind the selected Mega Block in Unity/Mega Studio before building.",
      "4. Configure `Assets/XR/Settings/EasyAR Settings.asset` locally with the package-bound Sense license plus Global Mega Block AppID, server address, API Key, and API Secret. Do not paste those values into chat.",
      "5. Set Mega `LocationInputMode` to `Onsite` for Android phone validation. For PICO 4 Ultra Enterprise, use the official EasyAR Unity XR device extension package, keep only `PicoFrameSource`, and use `Simulator` location input because the headset does not expose an Android GPS provider.",
      "6. Confirm Android minSdk is at least 24 when ONNX Runtime is included, and prefer ARM64 for device builds.",
      "7. If the project uses HybridCLR, run the HybridCLR Installer and `HybridCLR/Generate/All` for the same build target before APK packaging.",
      "8. For PICO 4 Ultra Enterprise, install PICO Unity Integration SDK 3.1.0 or newer, use a `4.x XR正式版` EasyAR license whose package name matches the APK, and validate while wearing/activating the headset in the mapped environment.",
      "9. Validate on a real Android phone or PICO headset in or near the mapped environment; emulator/editor launch does not prove Mega localization.",
      "",
      "Expected readiness checks:",
      "",
      "- `mega-assets` should find Mega, MegaBlock, CloudLocalizer, or project-specific Mega scene assets.",
      "- `mega-settings` should report local license and Global Mega Block credential presence without printing secret values.",
      "- `mega-location-input-mode` should report `Onsite` for Android phone validation, or `Simulator` with PICO headset signals for the documented PICO 4 Ultra Enterprise path.",
      "- `sample-scene` should find an official or project Mega scene.",
      "- `RUN_RESULT.md` should record build success plus real-device localization evidence without secret values."
    ].join("\n") + "\n";
  }

  return [
    ...commonSteps,
    "",
    "This sample is deferred in the current run-through scope. Use `image-tracking`, `cloud-recognition`, or `mega` first."
  ].join("\n") + "\n";
}

export function defaultBundleIdentifier(sample: SampleInfo | null): string {
  const suffix = sample?.id.replace(/[^a-z0-9]+/gi, "").toLowerCase() || "sample";
  return `com.easyar.generated.${suffix}`;
}

export function buildMonoBehaviourTemplate(className: string, kind: typeof monoBehaviourKinds[number]): string {
  const header = `using UnityEngine;

namespace EasyAR.Samples.Generated
{
    public sealed class ${className} : MonoBehaviour
    {`;
  const footer = `    }
}
`;

  if (kind === "image-tracking") {
    return `${header}
        [SerializeField] private GameObject contentRoot;

        private void Awake()
        {
            SetContentVisible(false);
        }

        public void OnTargetFound()
        {
            SetContentVisible(true);
        }

        public void OnTargetLost()
        {
            SetContentVisible(false);
        }

        private void SetContentVisible(bool visible)
        {
            if (contentRoot != null)
            {
                contentRoot.SetActive(visible);
            }
        }
${footer}`;
  }

  if (kind === "surface-placement") {
    return `${header}
        [SerializeField] private Camera arCamera;
        [SerializeField] private GameObject placementPrefab;
        [SerializeField] private LayerMask placementMask = ~0;

        private GameObject currentPlacement;

        private void Update()
        {
            if (Input.touchCount == 0 || Input.GetTouch(0).phase != TouchPhase.Began)
            {
                return;
            }

            var ray = arCamera != null
                ? arCamera.ScreenPointToRay(Input.GetTouch(0).position)
                : new Ray(transform.position, transform.forward);

            if (Physics.Raycast(ray, out var hit, 10f, placementMask))
            {
                Place(hit.point, hit.normal);
            }
        }

        private void Place(Vector3 position, Vector3 normal)
        {
            if (placementPrefab == null)
            {
                Debug.LogWarning("Placement prefab is not assigned.");
                return;
            }

            if (currentPlacement == null)
            {
                currentPlacement = Instantiate(placementPrefab);
            }

            currentPlacement.transform.SetPositionAndRotation(position, Quaternion.LookRotation(normal));
        }
${footer}`;
  }

  if (kind === "cloud-recognition") {
    return `${header}
        [SerializeField] private string expectedTargetName;
        [SerializeField] private GameObject recognizedContent;

        private void Awake()
        {
            SetRecognized(false);
        }

        public void OnCloudTargetRecognized(string targetName)
        {
            var matched = string.IsNullOrEmpty(expectedTargetName) || expectedTargetName == targetName;
            SetRecognized(matched);
            Debug.Log("EasyAR cloud recognition result: " + targetName);
        }

        public void OnCloudRecognitionLost()
        {
            SetRecognized(false);
        }

        private void SetRecognized(bool recognized)
        {
            if (recognizedContent != null)
            {
                recognizedContent.SetActive(recognized);
            }
        }
${footer}`;
  }

  if (kind === "mega") {
    return `${header}
        [SerializeField] private GameObject localizedContent;
        [SerializeField] private string megaBlockName;

        private bool localized;

        private void Awake()
        {
            SetLocalized(false);
        }

        public void OnMegaLocalized()
        {
            localized = true;
            SetLocalized(true);
            Debug.Log("Mega localization succeeded" + (string.IsNullOrEmpty(megaBlockName) ? "." : " for block: " + megaBlockName + "."));
        }

        public void OnMegaLocalizationLost()
        {
            localized = false;
            SetLocalized(false);
            Debug.Log("Mega localization lost.");
        }

        private void SetLocalized(bool visible)
        {
            if (localizedContent != null)
            {
                localizedContent.SetActive(visible);
            }
        }
${footer}`;
  }

  return `${header}
        [SerializeField] private bool logLifecycle = true;

        private void OnEnable()
        {
            if (logLifecycle)
            {
                Debug.Log("${className} enabled.");
            }
        }

        private void OnDisable()
        {
            if (logLifecycle)
            {
                Debug.Log("${className} disabled.");
            }
        }
${footer}`;
}

export function escapeCsharp(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}
