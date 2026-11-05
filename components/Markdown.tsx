import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

type HastNode = { type: string; tagName?: string; value?: string; children?: HastNode[]; properties?: Record<string, unknown> };

const textOf = (node: HastNode): string =>
  node.type === "text" ? (node.value ?? "") : (node.children ?? []).map(textOf).join("");

/** Marks paragraphs that open with **Definition.** or **Theorem.** so they can be set apart. */
function rehypeStatements() {
  return (tree: HastNode) => {
    const visit = (node: HastNode) => {
      if (node.type === "element" && node.tagName === "p") {
        const first = node.children?.find((c) => !(c.type === "text" && !c.value?.trim()));
        if (first?.type === "element" && first.tagName === "strong") {
          const label = textOf(first).trim();
          const cls = label.startsWith("Definition") ? "def" : label.startsWith("Theorem") ? "thm" : null;
          if (cls) node.properties = { ...node.properties, className: [cls] };
        }
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

export function Markdown({ source }: { source: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeStatements]}>
      {source}
    </ReactMarkdown>
  );
}
