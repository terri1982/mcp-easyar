export function jsonText(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

export function structuredJsonText(value: unknown, structuredContent?: Record<string, unknown>) {
  const structured = structuredContent
    ?? (value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown>
      : { items: value });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2)
      }
    ],
    structuredContent: structured
  };
}

export function markdownText(text: string) {
  return {
    content: [
      {
        type: "text" as const,
        text
      }
    ]
  };
}
