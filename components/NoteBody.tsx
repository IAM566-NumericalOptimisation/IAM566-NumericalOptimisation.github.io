import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import { AffineFigure } from "@/components/figures/AffineFigure";
import { CauchyFigure } from "@/components/figures/CauchyFigure";
import { EigenFigure } from "@/components/figures/EigenFigure";
import { GramSchmidt } from "@/components/figures/GramSchmidt";
import { LpBall } from "@/components/figures/LpBall";
import { ProjectionFigure } from "@/components/figures/ProjectionFigure";
import { SpanFigure } from "@/components/figures/SpanFigure";
import { SubspacesFigure } from "@/components/figures/SubspacesFigure";

const figures: Record<string, ReactNode> = {
  Affine: <AffineFigure />,
  Span: <SpanFigure />,
  LpBall: <LpBall />,
  Cauchy: <CauchyFigure />,
  Projection: <ProjectionFigure />,
  GramSchmidt: <GramSchmidt />,
  Subspaces: <SubspacesFigure />,
  Eigen: <EigenFigure />,
};

export function NoteBody({ content }: { content: string }) {
  const parts = content.split(/^\[\[([A-Za-z]+)\]\]\s*$/m);
  const blocks: ReactNode[] = [];

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      blocks.push(<div key={`fig-${i}`}>{figures[parts[i]] ?? null}</div>);
      continue;
    }
    const markdown = parts[i].trim();
    if (!markdown) continue;
    blocks.push(
      <ReactMarkdown
        key={`md-${i}`}
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeSlug, rehypeKatex]}
      >
        {markdown}
      </ReactMarkdown>,
    );
  }

  return <div className="prose">{blocks}</div>;
}
