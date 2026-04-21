import React from "react";

// Matches http(s)://… and www.… URLs, stops at whitespace and common trailing punctuation.
const URL_REGEX = /(\b(?:https?:\/\/|www\.)[^\s<]+[^\s<.,;:!?)\]}'"])/gi;

/**
 * Renders a text string with auto-detected URLs converted into clickable links.
 * Preserves line breaks. Safe: uses React text nodes, never dangerouslySetInnerHTML.
 */
export const linkifyText = (text: string): React.ReactNode => {
  if (!text) return null;
  const lines = text.split("\n");

  return lines.map((line, lineIdx) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    URL_REGEX.lastIndex = 0;

    while ((match = URL_REGEX.exec(line)) !== null) {
      const url = match[0];
      const start = match.index;
      if (start > lastIndex) parts.push(line.slice(lastIndex, start));
      const href = url.startsWith("http") ? url : `https://${url}`;
      parts.push(
        <a
          key={`${lineIdx}-${start}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline underline-offset-2 hover:opacity-80 break-words"
        >
          {url}
        </a>
      );
      lastIndex = start + url.length;
    }
    if (lastIndex < line.length) parts.push(line.slice(lastIndex));

    return (
      <React.Fragment key={lineIdx}>
        {parts.length ? parts : line}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};
