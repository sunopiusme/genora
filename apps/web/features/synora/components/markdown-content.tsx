"use client";

import { memo, useMemo, type ReactNode } from "react";

import { parseMarkdown, type InlineNode, type MarkdownBlock } from "../lib/markdown";
import styles from "./markdown-content.module.css";

type MarkdownContentProps = {
  content: string;
  isStreaming?: boolean;
};

export const MarkdownContent = memo(function MarkdownContent({
  content,
  isStreaming = false,
}: MarkdownContentProps) {
  const blocks = useMemo(() => parseMarkdown(content), [content]);

  return (
    <div className={styles.root} data-streaming={isStreaming || undefined}>
      {blocks.map((block, index) => (
        <MarkdownBlockView key={index} block={block} />
      ))}
    </div>
  );
});

function MarkdownBlockView({ block }: { block: MarkdownBlock }) {
  switch (block.type) {
    case "paragraph":
      return <p className={styles.paragraph}>{renderInline(block.children)}</p>;
    case "heading": {
      if (block.level === 2) {
        return <h2 className={styles.heading2}>{renderInline(block.children)}</h2>;
      }
      if (block.level === 3) {
        return <h3 className={styles.heading3}>{renderInline(block.children)}</h3>;
      }
      return <h4 className={styles.heading4}>{renderInline(block.children)}</h4>;
    }
    case "list":
      return block.ordered ? (
        <ol className={styles.list}>
          {block.items.map((item, index) => (
            <li key={index} className={styles.listItem}>
              {renderInline(item)}
            </li>
          ))}
        </ol>
      ) : (
        <ul className={styles.list}>
          {block.items.map((item, index) => (
            <li key={index} className={styles.listItem}>
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
    case "quote":
      return (
        <blockquote className={styles.quote}>
          {renderInline(block.children)}
        </blockquote>
      );
    case "divider":
      return <hr className={styles.divider} />;
    case "mono":
      return <pre className={styles.mono}>{block.text}</pre>;
  }
}

function renderInline(nodes: InlineNode[]): ReactNode {
  return nodes.map((node, index) => {
    switch (node.type) {
      case "text":
        return node.text;
      case "strong":
        return <strong key={index}>{renderInline(node.children)}</strong>;
      case "em":
        return <em key={index}>{renderInline(node.children)}</em>;
      case "code":
        return (
          <code key={index} className={styles.inlineCode}>
            {node.text}
          </code>
        );
      case "link":
        return (
          <a
            key={index}
            href={node.href}
            className={styles.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            {renderInline(node.children)}
          </a>
        );
    }
  });
}
