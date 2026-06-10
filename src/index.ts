#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { access, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

type SampleInfo = {
  id: string;
  name: string;
  description: string;
  unityScenes: string[];
  requiredCapabilities: string[];
  setupNotes: string[];
};

const samples: SampleInfo[] = [
  {
    id: "hello-ar",
    name: "Hello AR",
    description: "Minimal EasyAR scene for camera permission, ARSession startup, and device tracking validation.",
    unityScenes: ["HelloAR", "HelloAR_SparseSpatialMap"],
    requiredCapabilities: ["Camera permission", "EasyAR Sense Unity plugin"],
    setupNotes: [
      "Import the official EasyAR Sense Unity package for the target SDK version.",
      "Set the EasyAR license key in the project before building to device.",
      "Use Android or iOS build target for real device validation."
    ]
  },
  {
    id: "image-tracking",
    name: "Image Tracking",
    description: "Detect and track planar image targets, then anchor Unity content to the target pose.",
    unityScenes: ["ImageTracking", "ImageTracker", "ImageTarget"],
    requiredCapabilities: ["Camera permission", "Image target assets", "EasyAR license key"],
    setupNotes: [
      "Add target images through the EasyAR target workflow used by the imported sample.",
      "Check target physical size and texture import settings.",
      "Test on a real device with stable lighting."
    ]
  },
  {
    id: "surface-tracking",
    name: "Surface Tracking",
    description: "Place virtual content on detected surfaces using EasyAR motion tracking features.",
    unityScenes: ["SurfaceTracking", "MotionTracking"],
    requiredCapabilities: ["Camera permission", "Motion tracking support", "Device sensors"],
    setupNotes: [
      "Confirm the target device supports required tracking modes.",
      "Keep AR camera prefab and session lifecycle components from the official sample.",
      "Build to device; most surface tracking workflows cannot be fully validated in the Editor."
    ]
  },
  {
    id: "cloud-recognition",
    name: "Cloud Recognition",
    description: "Recognize targets through EasyAR cloud services and use results to drive AR content.",
    unityScenes: ["CloudRecognition", "CloudRecognizer"],
    requiredCapabilities: ["Network access", "Cloud recognition credentials", "EasyAR license key"],
    setupNotes: [
      "Configure official EasyAR cloud recognition credentials from the registered account.",
      "Verify network permissions and service region before testing.",
      "Avoid committing secrets; inject them through local config or CI secrets."
    ]
  }
];

const officialInfo = {
  capturedAt: "2026-06-10",
  docs: {
    samples: "https://www.easyar.cn/doc/en/develop/samples.html",
    downloads: "https://www.easyar.com/view/download.html",
    downloadHistory: "https://www.easyar.com/view/downloadHistory.html"
  },
  packageVersions: {
    easyarSenseUnityPlugin: "4002.0.0",
    easyarSenseUnityPluginForMega: "4002.0.0",
    easyarXrExtensionPackage: "4000.0.0",
    easyarSenseNative: "4.9.0"
  },
  notes: [
    "The official sample apps page says Unity samples are obtained from the Unity plugin download page and then imported according to the quickstart.",
    "This MCP server does not bypass account or enterprise download gates; connect it to official EasyAR account APIs before enabling private downloads."
  ]
};

const server = new McpServer({
  name: "easyar-official-mcp-server",
  version: "0.1.0"
});

server.resource(
  "easyar-samples-catalog",
  "easyar://samples/catalog",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(samples, null, 2)
      }
    ]
  })
);

server.resource(
  "easyar-official-info",
  "easyar://official/info",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(officialInfo, null, 2)
      }
    ]
  })
);

server.resource(
  "easyar-unity-checklist",
  "easyar://unity/checklist",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "text/markdown",
        text: [
          "# EasyAR Unity Checklist",
          "",
          "1. Use an official EasyAR account and license key.",
          "2. Import the EasyAR Sense Unity package that matches the target Unity version.",
          "3. Keep generated SDK assets and sample scenes inside the Unity project.",
          "4. Configure Android/iOS camera permissions and build target.",
          "5. Validate tracking samples on a real device.",
          "6. Keep account tokens, license keys, and cloud credentials out of source control."
        ].join("\n")
      }
    ]
  })
);

server.tool(
  "easyar_list_samples",
  "List known EasyAR Unity sample categories and setup requirements.",
  {},
  async () => jsonText(samples)
);

server.tool(
  "easyar_official_info",
  "Return official EasyAR links and package versions captured by this MCP server.",
  {},
  async () => jsonText(officialInfo)
);

server.tool(
  "easyar_generate_sample_plan",
  "Generate a step-by-step plan for preparing and running an EasyAR Unity sample.",
  {
    sampleId: z.string().describe("Sample id from easyar_list_samples, for example image-tracking."),
    unityVersion: z.string().optional().describe("Unity version used by the project."),
    platform: z.enum(["android", "ios", "editor", "unknown"]).default("unknown")
  },
  async ({ sampleId, unityVersion, platform }) => {
    const sample = findSample(sampleId);
    const auth = readAuthConfig();
    const plan = [
      `Sample: ${sample.name}`,
      `Unity version: ${unityVersion ?? "not specified"}`,
      `Target platform: ${platform}`,
      "",
      "Authorized access:",
      auth.hasToken
        ? `- EASYAR_API_TOKEN is configured for ${auth.apiBaseUrl}.`
        : `- Configure EASYAR_API_TOKEN for ${auth.apiBaseUrl} before downloading account-scoped SDKs or cloud data.`,
      "",
      "Preparation:",
      ...sample.setupNotes.map((note) => `- ${note}`),
      "",
      "Unity workflow:",
      "- Run easyar_inspect_unity_project against the project path.",
      "- Import the official EasyAR Unity package if the project does not contain EasyAR assets.",
      "- Run easyar_prepare_unity_project to create an Editor helper, local config template, and secret ignore rules.",
      "- Build to a real Android/iOS device when the sample requires camera, motion tracking, or cloud recognition.",
      "",
      "Required capabilities:",
      ...sample.requiredCapabilities.map((capability) => `- ${capability}`)
    ].join("\n");

    return markdownText(plan);
  }
);

server.tool(
  "easyar_inspect_unity_project",
  "Inspect a Unity project and report EasyAR/sample readiness signals.",
  {
    projectPath: z.string().describe("Absolute or current-working-directory-relative Unity project path.")
  },
  async ({ projectPath }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);

    const checks = {
      projectPath: root,
      hasAssets: await exists(path.join(root, "Assets")),
      hasPackagesManifest: await exists(path.join(root, "Packages", "manifest.json")),
      hasProjectSettings: await exists(path.join(root, "ProjectSettings", "ProjectVersion.txt")),
      unityVersion: await readUnityVersion(root),
      easyarSignals: await findFiles(root, ["Assets", "Packages"], /easyar/i, 80),
      sampleScenes: await findFiles(root, ["Assets"], /\.(unity)$/i, 120)
    };

    return jsonText(checks);
  }
);

server.tool(
  "easyar_prepare_unity_project",
  "Prepare a Unity project for an authorized EasyAR sample workflow by creating editor helpers, local config templates, and secret ignore rules.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Sample id from easyar_list_samples."),
    overwrite: z.boolean().default(false).describe("Whether to replace existing generated files.")
  },
  async ({ projectPath, sampleId, overwrite }) => {
    const root = resolveProjectPath(projectPath);
    await ensureDirectory(root);
    const sample = findSample(sampleId);

    const editorDir = path.join(root, "Assets", "Editor");
    const configDir = path.join(root, "ProjectSettings", "EasyAR");
    await mkdir(editorDir, { recursive: true });
    await mkdir(configDir, { recursive: true });

    const runnerPath = path.join(editorDir, "EasyARSampleRunner.cs");
    const configExamplePath = path.join(configDir, "easyar.local.json.example");
    const localConfigPath = path.join(configDir, "easyar.local.json");
    const gitignorePath = path.join(root, ".gitignore");

    const written: string[] = [];
    await writeGeneratedFile(runnerPath, buildSampleRunner(sample), overwrite, written);
    await writeGeneratedFile(configExamplePath, buildLocalConfigExample(sample), overwrite, written);
    await ensureGitignoreEntries(gitignorePath, [
      "ProjectSettings/EasyAR/easyar.local.json",
      "ProjectSettings/EasyAR/*.secret.json"
    ]);

    return jsonText({
      projectPath: root,
      sample: sample.name,
      written,
      localConfig: localConfigPath,
      instructions: [
        `Copy ${path.relative(root, configExamplePath)} to ${path.relative(root, localConfigPath)}.`,
        "Fill the local file with the EasyAR license key and official account-scoped credentials.",
        "Do not commit the local config file; .gitignore has been updated to protect it.",
        "Import the official EasyAR Unity Plugin package from the EasyAR download page before opening the generated runner."
      ]
    });
  }
);

server.tool(
  "easyar_create_sample_runner",
  "Create a Unity Editor script that opens EasyAR sample scenes by name.",
  {
    projectPath: z.string().describe("Unity project path."),
    sampleId: z.string().describe("Sample id from easyar_list_samples.")
  },
  async ({ projectPath, sampleId }) => {
    const root = resolveProjectPath(projectPath);
    const sample = findSample(sampleId);
    const editorDir = path.join(root, "Assets", "Editor");
    await mkdir(editorDir, { recursive: true });

    const filePath = path.join(editorDir, "EasyARSampleRunner.cs");
    await writeFile(filePath, buildSampleRunner(sample), "utf8");

    return jsonText({
      created: filePath,
      sample: sample.name,
      nextStep: "In Unity, use Tools/EasyAR/Open Sample Scene, or call EasyAR.EditorTools.EasyARSampleRunner.OpenSampleScene in batch mode."
    });
  }
);

server.tool(
  "easyar_write_csharp_file",
  "Create or replace a C# script inside a Unity project. The file must stay inside the project and end with .cs.",
  {
    projectPath: z.string().describe("Unity project path."),
    relativePath: z.string().describe("Relative file path inside the Unity project, for example Assets/Scripts/Foo.cs."),
    contents: z.string().describe("Complete C# file contents.")
  },
  async ({ projectPath, relativePath, contents }) => {
    const root = resolveProjectPath(projectPath);
    const target = path.resolve(root, relativePath);
    assertInside(root, target);
    if (!target.endsWith(".cs")) {
      throw new Error("easyar_write_csharp_file only writes .cs files.");
    }

    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, contents, "utf8");
    return jsonText({ written: target, bytes: Buffer.byteLength(contents, "utf8") });
  }
);

server.tool(
  "easyar_run_unity_method",
  "Run a Unity static editor method in batch mode for project automation.",
  {
    projectPath: z.string().describe("Unity project path."),
    executeMethod: z.string().describe("Fully qualified static method, for example EasyAR.EditorTools.EasyARSampleRunner.OpenSampleScene."),
    unityPath: z.string().optional().describe("Unity executable path. Defaults to EASYAR_UNITY_PATH or Unity on PATH."),
    timeoutSeconds: z.number().int().positive().max(1800).default(300)
  },
  async ({ projectPath, executeMethod, unityPath, timeoutSeconds }) => {
    const root = resolveProjectPath(projectPath);
    const unity = unityPath ?? process.env.EASYAR_UNITY_PATH ?? "Unity";
    const result = await runUnity(unity, root, executeMethod, timeoutSeconds);
    return jsonText(result);
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

function findSample(sampleId: string): SampleInfo {
  const sample = samples.find((candidate) => candidate.id === sampleId);
  if (!sample) {
    throw new Error(`Unknown sampleId "${sampleId}". Use easyar_list_samples first.`);
  }
  return sample;
}

function readAuthConfig() {
  return {
    apiBaseUrl: process.env.EASYAR_API_BASE_URL ?? "https://www.easyar.cn",
    hasToken: Boolean(process.env.EASYAR_API_TOKEN)
  };
}

function resolveProjectPath(projectPath: string): string {
  return path.resolve(process.cwd(), projectPath);
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function ensureDirectory(dirPath: string) {
  const info = await stat(dirPath);
  if (!info.isDirectory()) {
    throw new Error(`${dirPath} is not a directory.`);
  }
}

async function readUnityVersion(root: string): Promise<string | null> {
  const versionFile = path.join(root, "ProjectSettings", "ProjectVersion.txt");
  try {
    const text = await readFile(versionFile, "utf8");
    const match = text.match(/m_EditorVersion:\s*(.+)/);
    return match?.[1]?.trim() ?? null;
  } catch {
    return null;
  }
}

async function findFiles(root: string, relativeDirs: string[], pattern: RegExp, limit: number): Promise<string[]> {
  const found: string[] = [];
  for (const relativeDir of relativeDirs) {
    const start = path.join(root, relativeDir);
    if (await exists(start)) {
      await walk(start, pattern, found, limit);
    }
  }
  return found.map((filePath) => path.relative(root, filePath));
}

async function walk(dirPath: string, pattern: RegExp, found: string[], limit: number): Promise<void> {
  if (found.length >= limit) {
    return;
  }

  const entries = await readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (found.length >= limit) {
      return;
    }

    if (entry.name === "Library" || entry.name === "Temp" || entry.name === "Obj") {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, pattern, found, limit);
    } else if (pattern.test(fullPath)) {
      found.push(fullPath);
    }
  }
}

function assertInside(root: string, target: string) {
  const relative = path.relative(root, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Target path must stay inside the Unity project.");
  }
}

function buildSampleRunner(sample: SampleInfo): string {
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

function buildLocalConfigExample(sample: SampleInfo): string {
  return `${JSON.stringify(
    {
      sampleId: sample.id,
      sampleName: sample.name,
      easyar: {
        apiBaseUrl: "https://www.easyar.cn",
        accountToken: "paste-official-registered-user-token-here",
        licenseKey: "paste-easyar-license-key-here",
        cloudRecognition: {
          appId: "",
          appKey: "",
          appSecret: ""
        }
      },
      unity: {
        targetPlatform: "android",
        notes: sample.setupNotes
      }
    },
    null,
    2
  )}\n`;
}

async function writeGeneratedFile(filePath: string, contents: string, overwrite: boolean, written: string[]) {
  if (!overwrite && await exists(filePath)) {
    return;
  }
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, "utf8");
  written.push(filePath);
}

async function ensureGitignoreEntries(gitignorePath: string, entries: string[]) {
  let current = "";
  if (await exists(gitignorePath)) {
    current = await readFile(gitignorePath, "utf8");
  }

  const lines = new Set(current.split(/\r?\n/).filter(Boolean));
  let changed = false;
  for (const entry of entries) {
    if (!lines.has(entry)) {
      lines.add(entry);
      changed = true;
    }
  }

  if (changed) {
    await writeFile(gitignorePath, `${Array.from(lines).join("\n")}\n`, "utf8");
  }
}

function escapeCsharp(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}

async function runUnity(unity: string, projectPath: string, executeMethod: string, timeoutSeconds: number) {
  const args = [
    "-batchmode",
    "-quit",
    "-projectPath",
    projectPath,
    "-executeMethod",
    executeMethod
  ];

  return new Promise<{ command: string; exitCode: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(unity, args, { stdio: ["ignore", "pipe", "pipe"] });
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Unity command timed out after ${timeoutSeconds} seconds.`));
    }, timeoutSeconds * 1000);

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (exitCode) => {
      clearTimeout(timeout);
      resolve({
        command: [unity, ...args].join(" "),
        exitCode,
        stdout: stdout.slice(-12000),
        stderr: stderr.slice(-12000)
      });
    });
  });
}

function jsonText(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

function markdownText(text: string) {
  return {
    content: [
      {
        type: "text" as const,
        text
      }
    ]
  };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
