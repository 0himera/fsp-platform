export function parseLabels(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of text.split(/\r?\n/).filter((r) => r.trim())) {
    const sep = line.indexOf(",");
    if (sep > 0) result[line.slice(0, sep).trim()] = line.slice(sep + 1).trim();
  }
  return result;
}
