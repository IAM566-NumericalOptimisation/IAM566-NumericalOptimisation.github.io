import type { ReactNode } from "react";
import { AffineFigure } from "./AffineFigure";
import { ChordGapFigure } from "./convex/ChordGapFigure";
import { LocalGlobalFigure } from "./convex/LocalGlobalFigure";
import { OptimalSetFigure } from "./convex/OptimalSetFigure";
import { EpigraphFigure } from "./convex/EpigraphFigure";
import { SublevelFigure } from "./convex/SublevelFigure";
import { TangentFigure } from "./convex/TangentFigure";
import { LowerBoundFigure } from "./convex/LowerBoundFigure";
import { CurvatureFigure } from "./convex/CurvatureFigure";
import { DomainMattersFigure } from "./convex/DomainMattersFigure";
import { LeastSquaresRankFigure } from "./convex/LeastSquaresRankFigure";
import { JensenFigure } from "./convex/JensenFigure";
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
  // 6 Convex Functions
  ChordGap: { title: "Graph height and chord height", node: <ChordGapFigure /> },
  LocalGlobal: { title: "Local minimum, global minimum", node: <LocalGlobalFigure /> },
  OptimalSet: { title: "The shape of the optimal set", node: <OptimalSetFigure /> },
  Epigraph: { title: "Epigraph and hypograph", node: <EpigraphFigure /> },
  Sublevel: { title: "Sublevel sets under a rising threshold", node: <SublevelFigure /> },
  Tangent: { title: "Secant, tangent and the gradient inequality", node: <TangentFigure /> },
  LowerBound: { title: "Tangent lower bounds and feasible directions", node: <LowerBoundFigure /> },
  Curvature: { title: "Directional curvature of a quadratic", node: <CurvatureFigure /> },
  DomainMatters: { title: "The same formula on two domains", node: <DomainMattersFigure /> },
  LeastSquaresRank: { title: "Least squares, rank and the null direction", node: <LeastSquaresRankFigure /> },
  Jensen: { title: "Finite Jensen and weighted variance", node: <JensenFigure /> },
};
