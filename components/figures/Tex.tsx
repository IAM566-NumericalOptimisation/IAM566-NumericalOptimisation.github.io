"use client";

import katex from "katex";

export function Tex({ source, display = false }: { source: string; display?: boolean }) {
  const html = katex.renderToString(source, {
    throwOnError: false,
    displayMode: display,
  });
  if (display) return <div dangerouslySetInnerHTML={{ __html: html }} />;
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
