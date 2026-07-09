export type InlineNode =
  | { type: "text"; text: string }
  | { type: "strong"; children: InlineNode[] }
  | { type: "em"; children: InlineNode[] }
  | { type: "code"; text: string }
  | { type: "link"; href: string; children: InlineNode[] };

export type MarkdownBlock =
  | { type: "paragraph"; children: InlineNode[] }
  | { type: "heading"; level: 2 | 3 | 4; children: InlineNode[] }
  | { type: "list"; ordered: boolean; items: InlineNode[][] }
  | { type: "quote"; children: InlineNode[] }
  | { type: "divider" }
  | { type: "mono"; text: string };

const HEADING_PATTERN = /^(#{1,6})\s+(.*)$/;
const BULLET_PATTERN = /^[-*+]\s+(.*)$/;
const ORDERED_PATTERN = /^\d{1,3}[.)]\s+(.*)$/;
const QUOTE_PATTERN = /^>\s?(.*)$/;
const DIVIDER_PATTERN = /^(?:-{3,}|\*{3,}|_{3,})$/;
const FENCE_PATTERN = /^(?:```|~~~)/;
const SAFE_LINK_PATTERN = /^(?:https?:\/\/|mailto:|\/|#)/i;

/**
 * Разбирает markdown-текст в блоки. Парсер потоко-безопасный:
 * незакрытые маркеры в конце текста не ломают вывод, а рендерятся
 * как обычный текст, поэтому его можно вызывать на каждый чанк стрима.
 */
export function parseMarkdown(source: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = source.replace(/\r\n?/g, "\n").split("\n");

  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let quote: string[] = [];
  let fence: string[] | null = null;

  function flushParagraph() {
    if (paragraph.length === 0) {
      return;
    }
    const text = paragraph.join(" ").trim();
    paragraph = [];
    if (text) {
      blocks.push({ type: "paragraph", children: parseInline(text) });
    }
  }

  function flushList() {
    if (!list) {
      return;
    }
    blocks.push({
      type: "list",
      ordered: list.ordered,
      items: list.items.map((item) => parseInline(item)),
    });
    list = null;
  }

  function flushQuote() {
    if (quote.length === 0) {
      return;
    }
    const text = quote.join(" ").trim();
    quote = [];
    if (text) {
      blocks.push({ type: "quote", children: parseInline(text) });
    }
  }

  function flushAll() {
    flushParagraph();
    flushList();
    flushQuote();
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (fence !== null) {
      if (FENCE_PATTERN.test(trimmed)) {
        blocks.push({ type: "mono", text: fence.join("\n").trimEnd() });
        fence = null;
      } else {
        fence.push(rawLine);
      }
      continue;
    }

    if (FENCE_PATTERN.test(trimmed)) {
      flushAll();
      fence = [];
      continue;
    }

    if (!trimmed) {
      flushAll();
      continue;
    }

    if (DIVIDER_PATTERN.test(trimmed)) {
      flushAll();
      blocks.push({ type: "divider" });
      continue;
    }

    const headingMatch = trimmed.match(HEADING_PATTERN);
    if (headingMatch) {
      flushAll();
      const marker = headingMatch[1] ?? "##";
      const level = Math.min(Math.max(marker.length, 2), 4) as 2 | 3 | 4;
      blocks.push({
        type: "heading",
        level,
        children: parseInline((headingMatch[2] ?? "").trim()),
      });
      continue;
    }

    const quoteMatch = trimmed.match(QUOTE_PATTERN);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      quote.push(quoteMatch[1] ?? "");
      continue;
    }

    const bulletMatch = trimmed.match(BULLET_PATTERN);
    if (bulletMatch) {
      flushParagraph();
      flushQuote();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(bulletMatch[1] ?? "");
      continue;
    }

    const orderedMatch = trimmed.match(ORDERED_PATTERN);
    if (orderedMatch) {
      flushParagraph();
      flushQuote();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(orderedMatch[1] ?? "");
      continue;
    }

    if (list && rawLine.startsWith("  ")) {
      const lastIndex = list.items.length - 1;
      if (lastIndex >= 0) {
        list.items[lastIndex] = `${list.items[lastIndex]} ${trimmed}`;
        continue;
      }
    }

    if (quote.length > 0) {
      quote.push(trimmed);
      continue;
    }

    flushList();
    paragraph.push(trimmed);
  }

  if (fence !== null) {
    // Незакрытый фенс в конце потока: показываем накопленное содержимое.
    const text = fence.join("\n").trimEnd();
    if (text) {
      blocks.push({ type: "mono", text });
    }
  }
  flushAll();

  return blocks;
}

/** Разбирает инлайновую разметку: **жирный**, *курсив*, `код`, [ссылки](url). */
export function parseInline(source: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let buffer = "";
  let index = 0;

  function flushBuffer() {
    if (buffer) {
      nodes.push({ type: "text", text: buffer });
      buffer = "";
    }
  }

  while (index < source.length) {
    const char = source[index];

    if (char === "`") {
      const closing = source.indexOf("`", index + 1);
      if (closing > index) {
        flushBuffer();
        nodes.push({ type: "code", text: source.slice(index + 1, closing) });
        index = closing + 1;
        continue;
      }
    }

    if (source.startsWith("**", index) || source.startsWith("__", index)) {
      const marker = source.slice(index, index + 2);
      const closing = source.indexOf(marker, index + 2);
      if (closing > index + 2) {
        flushBuffer();
        nodes.push({
          type: "strong",
          children: parseInline(source.slice(index + 2, closing)),
        });
        index = closing + 2;
        continue;
      }
    }

    if (char === "*" || char === "_") {
      const closing = findEmphasisEnd(source, index + 1, char);
      if (closing > index + 1) {
        flushBuffer();
        nodes.push({
          type: "em",
          children: parseInline(source.slice(index + 1, closing)),
        });
        index = closing + 1;
        continue;
      }
    }

    if (char === "[") {
      const link = matchLink(source, index);
      if (link) {
        flushBuffer();
        nodes.push({
          type: "link",
          href: link.href,
          children: parseInline(link.label),
        });
        index = link.end;
        continue;
      }
    }

    buffer += char;
    index += 1;
  }

  flushBuffer();
  return nodes;
}

function findEmphasisEnd(source: string, from: number, marker: string): number {
  for (let index = from; index < source.length; index += 1) {
    if (source[index] !== marker) {
      continue;
    }
    // Не считать `**` закрытием одиночного маркера.
    if (source[index + 1] === marker) {
      index += 1;
      continue;
    }
    if (index > from) {
      return index;
    }
  }
  return -1;
}

function matchLink(
  source: string,
  from: number,
): { label: string; href: string; end: number } | null {
  const labelEnd = source.indexOf("]", from + 1);
  if (labelEnd < 0 || source[labelEnd + 1] !== "(") {
    return null;
  }
  const hrefEnd = source.indexOf(")", labelEnd + 2);
  if (hrefEnd < 0) {
    return null;
  }
  const label = source.slice(from + 1, labelEnd);
  const href = source.slice(labelEnd + 2, hrefEnd).trim();
  if (!label || !SAFE_LINK_PATTERN.test(href)) {
    return null;
  }
  return { label, href, end: hrefEnd + 1 };
}
