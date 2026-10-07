import { parse } from 'yaml';

export default function matter(source: string) {
  const match = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source);
  if (!match) return { data: {} as Record<string, unknown>, content: source };
  const parsed: unknown = parse(match[1], { maxAliasCount: 20 });
  const data = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? parsed as Record<string, unknown> : {};
  return { data, content: source.slice(match[0].length) };
}
