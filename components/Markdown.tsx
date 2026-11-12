import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

type HastNode = { type: string; tagName?: string; value?: string; children?: HastNode[]; properties?: Record<string, unknown> };

const textOf = (node: HastNode): string =>
  node.type === "text" ? (node.value ?? "") : (node.children ?? []).map(textOf).join("");

const THEOREMS = ["Theorem", "Proposition", "Lemma", "Corollary"];

/**
 * Marks paragraphs by their opening bold label: **Definition.** and **Theorem.**
 * (also Proposition, Lemma, Corollary) are set apart, **Extension.** is a
 * remark that goes beyond the source notes, and a **Solution.** paragraph is
 * folded into a closed <details> so that it opens only on request.
 */
function rehypeStatements() {
  return (tree: HastNode) => {
    const visit = (node: HastNode) => {
      node.children = node.children?.map((child) => {
        if (child.type !== "element" || child.tagName !== "p") return child;
        const first = child.children?.find((c) => !(c.type === "text" && !c.value?.trim()));
        if (first?.type !== "element" || first.tagName !== "strong") return child;
        const label = textOf(first).trim();
        if (label.startsWith("Solution") && node.tagName !== "details") {
          return {
            type: "element",
            tagName: "details",
            properties: { className: ["solution"] },
            children: [{ type: "element", tagName: "summary", properties: {}, children: [{ type: "text", value: "Show solution" }] }, child],
          };
        }
        const cls = label.startsWith("Definition") ? "def" : THEOREMS.some((t) => label.startsWith(t)) ? "thm" : label.startsWith("Extension") ? "remark" : null;
        if (cls) child.properties = { ...child.properties, className: [cls] };
        return child;
      });
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

function Prose({ source }: { source: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeStatements]}>
      {source}
    </ReactMarkdown>
  );
}

/** One table cell: inline markdown and math, without the wrapping paragraph. */
function Cell({ source }: { source: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} components={{ p: ({ children }) => <>{children}</> }}>
      {source}
    </ReactMarkdown>
  );
}

const cellsOf = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

/**
 * A pipe table (header row, a |---| rule, body rows) as a <table>. The site
 * has no GFM plugin, so tables are split out here and their cells rendered as
 * inline markdown; everything else goes through the usual pipeline.
 */
function Table({ lines }: { lines: string[] }) {
  const [head, , ...body] = lines.map(cellsOf);
  return (
    <table>
      <thead>
        <tr>
          {head.map((c, i) => (
            <th key={i}>
              <Cell source={c} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {body.map((row, r) => (
          <tr key={r}>
            {row.map((c, i) => (
              <td key={i}>
                <Cell source={c} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Markdown({ source }: { source: string }) {
  // split into runs of table lines and runs of everything else
  const parts: { table: boolean; lines: string[] }[] = [];
  for (const line of source.split("\n")) {
    const table = line.trimStart().startsWith("|");
    const last = parts[parts.length - 1];
    if (last && last.table === table) last.lines.push(line);
    else parts.push({ table, lines: [line] });
  }
  const isTable = (p: { table: boolean; lines: string[] }) => p.table && p.lines.length >= 2 && /^\s*\|?\s*:?-{3,}/.test(p.lines[1]);
  if (!parts.some(isTable)) return <Prose source={source} />;
  return (
    <>
      {parts.map((p, i) => (isTable(p) ? <Table key={i} lines={p.lines} /> : <Prose key={i} source={p.lines.join("\n")} />))}
    </>
  );
}
