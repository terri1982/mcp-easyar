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
