import React, { type ReactNode } from "react";

export function messageLink(value: string): string | undefined {
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : undefined; } catch { return undefined; }
}
function inline(text: string): ReactNode[] {
  // Deliberately limited Markdown. React escapes all raw text; HTML is never interpreted.
  const pattern = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|\[[^\]\n]+\]\([^\s)]+\)|https?:\/\/[^\s<>]+)/g;
  const nodes: ReactNode[] = []; let offset = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index!; nodes.push(text.slice(offset, start)); const token = match[0];
    if (token.startsWith("*")) nodes.push(<strong key={start}>{token.replace(/^\*{1,2}|\*{1,2}$/g, "")}</strong>);
    else {
      const link = /^\[([^\]]+)\]\((.+)\)$/.exec(token);
      const href = messageLink(link?.[2] ?? token);
      nodes.push(href ? <a key={start} href={href} target="_blank" rel="noopener noreferrer nofollow">{link?.[1] ?? token}</a> : token);
    }
    offset = start + token.length;
  }
  nodes.push(text.slice(offset)); return nodes;
}
export function SafeMessage({ text }: { text: string }) {
  const lines = text.split(/\r?\n/); const blocks: ReactNode[] = [];
  for (let i = 0; i < lines.length; i++) {
    const match = /^\s*(?:[-*•]|\d+[.)])\s+(.+)$/.exec(lines[i]);
    if (match) {
      const items: ReactNode[] = []; const start = i;
      while (i < lines.length) {
        const item = /^\s*(?:[-*•]|\d+[.)])\s+(.+)$/.exec(lines[i]); if (!item) break;
        items.push(<li key={i}>{inline(item[1])}</li>); i++;
      }
      i--; blocks.push(<ul key={start}>{items}</ul>);
    } else blocks.push(<p key={i}>{lines[i] ? inline(lines[i]) : <br />}</p>);
  }
  return <div className="safe-message">{blocks}</div>;
}
