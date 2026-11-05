import type { ReactNode } from "react";
import { AffineFigure } from "./AffineFigure";
import { BasisFigure } from "./BasisFigure";
import { CauchyFigure } from "./CauchyFigure";
import { EigenFigure } from "./EigenFigure";
import { GramSchmidt } from "./GramSchmidt";
import { LpBall } from "./LpBall";
import { MetricFigure } from "./MetricFigure";
import { ProjectionFigure } from "./ProjectionFigure";
import { SpanFigure } from "./SpanFigure";
import { SubspacesFigure } from "./SubspacesFigure";
import { SupInfFigure } from "./SupInfFigure";
import { TransformFigure } from "./TransformFigure";

/** Every figure a note can name with [[Name]], with the title shown above it. */
export const FIGURES: Record<string, { title: string; node: ReactNode }> = {
  SupInf: { title: "Bounds that are approached", node: <SupInfFigure /> },
  Affine: { title: "Subspace and affine space", node: <AffineFigure /> },
  Span: { title: "Span and dependence", node: <SpanFigure /> },
  Basis: { title: "A basis and its coordinates", node: <BasisFigure /> },
  Metric: { title: "Metrics and norms", node: <MetricFigure /> },
  LpBall: { title: "Unit balls of the Lp norms", node: <LpBall /> },
  Cauchy: { title: "Angle and Cauchy–Schwarz", node: <CauchyFigure /> },
  Projection: { title: "Projection onto a line", node: <ProjectionFigure /> },
  GramSchmidt: { title: "Gram–Schmidt, step by step", node: <GramSchmidt /> },
  Subspaces: { title: "The four subspaces", node: <SubspacesFigure /> },
  Transform: { title: "A matrix moves the plane", node: <TransformFigure /> },
  Eigen: { title: "Powers along the eigenlines", node: <EigenFigure /> },
};
