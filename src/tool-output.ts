import { z } from "zod";
import { jsonText, markdownText } from "./mcp-response.js";

export const outputModeSchema = z.enum(["file", "inline"]).default("file").describe("Return generated content inline or write it to a file. Defaults to file for backward compatibility.");
export type OutputMode = z.infer<typeof outputModeSchema>;

export function inlineMarkdownResult(markdown: string) {
  return markdownText(markdown);
}

export function inlineJsonResult(value: unknown) {
  return jsonText(value);
}

export function isInlineOutput(output: OutputMode | undefined) {
  return output === "inline";
}
