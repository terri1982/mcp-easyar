import { access, readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const root = process.cwd();
const docsRoot = path.join(root, "docs");
const locales = ["ja", "vi"];
const localeDirectories = new Set(["ja", "vi", "zh-CN"]);

const canonicalDocs = (await listMarkdownFiles(docsRoot))
  .filter((relativePath) => !localeDirectories.has(relativePath.split("/")[0]))
  .sort();

const failures = [];

for (const locale of locales) {
  const localeRoot = path.join(docsRoot, locale);
  const indexPath = path.join(localeRoot, "README.md");
  const indexText = await readFile(indexPath, "utf8");
  const sourceManifest = JSON.parse(await readFile(path.join(localeRoot, "source-manifest.json"), "utf8"));
  const localizedDocs = (await listMarkdownFiles(localeRoot))
    .filter((relativePath) => relativePath !== "README.md")
    .sort();

  compareLists(canonicalDocs, localizedDocs, `${locale} documentation inventory`);

  for (const relativePath of canonicalDocs) {
    const sourcePath = path.join(docsRoot, relativePath);
    const localizedPath = path.join(localeRoot, relativePath);
    const [sourceText, localizedText] = await Promise.all([
      readFile(sourcePath, "utf8"),
      readFile(localizedPath, "utf8")
    ]);
    const sourceHash = createHash("sha256").update(sourceText).digest("hex");
    if (sourceManifest[relativePath] !== sourceHash) {
      failures.push(`${locale}/source-manifest.json is stale for ${relativePath}.`);
    }

    const sourceLines = sourceText.split(/\r?\n/).length;
    const localizedLines = localizedText.split(/\r?\n/).length;
    if (localizedLines < sourceLines * 0.8) {
      failures.push(`${locale}/${relativePath} is abbreviated: ${localizedLines} lines for ${sourceLines} source lines.`);
    }
    if (localizedText.includes("__MCPPH_") || /<x\s+id=/.test(localizedText)) {
      failures.push(`${locale}/${relativePath} contains an unresolved translation placeholder.`);
    }

    const sourceCodeBlocks = extractCodeBlocks(sourceText);
    const localizedCodeBlocks = extractCodeBlocks(localizedText);
    if (JSON.stringify(sourceCodeBlocks) !== JSON.stringify(localizedCodeBlocks)) {
      failures.push(`${locale}/${relativePath} changed a fenced code block.`);
    }

    const indexTarget = relativePath.split("/").map(encodeURI).join("/");
    const indexHasTarget = relativePath === "easyar-mega-wechat-miniprogram-mcp.md"
      ? indexText.includes(`/docs/${locale}/${indexTarget}`)
      : indexText.includes(`(${indexTarget})`);
    if (!indexHasTarget) {
      failures.push(`${locale}/README.md does not link to ${relativePath}.`);
    }
  }

  const localeFiles = ["README.md", ...localizedDocs];
  for (const relativePath of localeFiles) {
    const filePath = path.join(localeRoot, relativePath);
    const text = await readFile(filePath, "utf8");
    const fenceCount = (text.match(/^```/gm) ?? []).length;
    if (fenceCount % 2 !== 0) {
      failures.push(`${locale}/${relativePath} has an unmatched fenced code block.`);
    }
    await validateLinks(filePath, text, locale);
  }

  const topReadme = await readFile(path.join(root, `README.${locale}.md`), "utf8");
  if (!topReadme.includes(`docs/${locale}/README.md`)) {
    failures.push(`README.${locale}.md does not link to the localized documentation index.`);
  }
  if (!topReadme.includes("v0.1.0-local-key.41")) {
    failures.push(`README.${locale}.md does not reference v0.1.0-local-key.41.`);
  }
}

if (failures.length > 0) {
  console.error("Localized documentation check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Localized documentation check passed: ${canonicalDocs.length} source documents x ${locales.length} locales.`);
}

async function listMarkdownFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...await listMarkdownFiles(path.join(directory, entry.name), relativePath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(relativePath);
    }
  }
  return files;
}

function compareLists(expected, actual, label) {
  const missing = expected.filter((item) => !actual.includes(item));
  const extra = actual.filter((item) => !expected.includes(item));
  if (missing.length > 0) {
    failures.push(`${label} is missing: ${missing.join(", ")}.`);
  }
  if (extra.length > 0) {
    failures.push(`${label} has unexpected files: ${extra.join(", ")}.`);
  }
}

function extractCodeBlocks(markdown) {
  return [...markdown.matchAll(/^```[^\n]*\n[\s\S]*?^```\s*$/gm)].map((match) => match[0].trimEnd());
}

async function validateLinks(filePath, markdown, locale) {
  const links = [...markdown.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1]);
  for (const target of links) {
    if (/^(?:https?:|mailto:|#)/.test(target)) {
      continue;
    }
    const rawTarget = decodeURI(target.split("#")[0].split("?")[0]);
    if (!rawTarget || rawTarget.includes(" ")) {
      continue;
    }
    const resolved = path.resolve(path.dirname(filePath), rawTarget);
    try {
      await access(resolved);
    } catch {
      failures.push(`${path.relative(root, filePath)} has a broken link: ${target}.`);
      continue;
    }
    const relativeToDocs = path.relative(docsRoot, resolved).split(path.sep).join("/");
    if (relativeToDocs.endsWith(".md") && canonicalDocs.includes(relativeToDocs)) {
      failures.push(`${path.relative(root, filePath)} links to the source-language document ${relativeToDocs} instead of docs/${locale}.`);
    }
  }
}
