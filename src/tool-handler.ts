import { relative } from "node:path";
import { packageRoot } from "./paths.js";

type ToolContent = {
  type: "text";
  text: string;
};

type ToolErrorResult = {
  isError: true;
  content: ToolContent[];
};

export type ToolHandler = (...args: unknown[]) => unknown | Promise<unknown>;
export type ToolRegistrar = (name: string, ...args: unknown[]) => unknown;

function replaceAllLiteral(text: string, search: string, replacement: string) {
  return search ? text.split(search).join(replacement) : text;
}

export function sanitizeToolErrorText(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  const home = process.env.HOME;
  let text = raw;

  text = replaceAllLiteral(text, packageRoot, "<package-root>");
  if (home) {
    text = replaceAllLiteral(text, home, "~");
  }

  const relativeToPackage = relative(process.cwd(), packageRoot);
  if (relativeToPackage && !relativeToPackage.startsWith("..")) {
    text = replaceAllLiteral(text, relativeToPackage, "<package-root>");
  }

  return text;
}

export function toolErrorResult(toolName: string, error: unknown): ToolErrorResult {
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: `Tool ${toolName} failed: ${sanitizeToolErrorText(error)}`
      }
    ]
  };
}

export function wrapToolHandler(toolName: string, handler: ToolHandler): ToolHandler {
  return async (...args: unknown[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      return toolErrorResult(toolName, error);
    }
  };
}

export function createToolRegistrar(
  serverTool: ToolRegistrar,
  options: { shouldRegisterTool?: (name: string) => boolean } = {}
): ToolRegistrar {
  return (name: string, ...args: unknown[]) => {
    if (options.shouldRegisterTool && !options.shouldRegisterTool(name)) {
      return undefined;
    }

    const describedArgs = typeof args[0] === "string" && name.startsWith("easyar_generate_")
      ? [`Deprecated: use the matching easyar_write_* tool with output=\"inline\" when available. ${args[0]}`, ...args.slice(1)]
      : args;
    const lastArg = describedArgs.at(-1);
    const wrappedArgs = typeof lastArg === "function"
      ? [...describedArgs.slice(0, -1), wrapToolHandler(name, lastArg as ToolHandler)]
      : describedArgs;

    return serverTool(name, ...wrappedArgs);
  };
}
