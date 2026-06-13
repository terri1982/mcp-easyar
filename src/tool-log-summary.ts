export function summarizeLog(logText: string) {
  const lines = logText.split(/\r?\n/);
  return {
    totalLines: lines.length,
    errorLines: lines.filter((line) => /\b(error|exception|failed|failure)\b/i.test(line)).length,
    warningLines: lines.filter((line) => /\b(warning|warn)\b/i.test(line)).length,
    mentionsEasyAR: /easyar/i.test(logText),
    mentionsAndroid: /android|gradle|apk/i.test(logText),
    mentionsIOS: /\bios\b|xcode|provisioning|codesign/i.test(logText)
  };
}
