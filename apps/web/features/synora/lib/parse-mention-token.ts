export type MentionToken = {
  start: number;
  end: number;
  query: string;
};

export function parseMentionToken(
  value: string,
  caret: number,
): MentionToken | null {
  const left = value.slice(0, caret);
  const atIndex = left.lastIndexOf("@");
  if (atIndex === -1) return null;

  const prevChar = atIndex > 0 ? left[atIndex - 1] : "";
  if (prevChar && !/\s/.test(prevChar)) return null;

  const query = left.slice(atIndex + 1);
  if (/\s/.test(query)) return null;

  return {
    start: atIndex,
    end: caret,
    query: query.toLowerCase(),
  };
}
