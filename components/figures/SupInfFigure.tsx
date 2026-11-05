"use client";

import { LaTeX, Line, Plot, Point } from "mafs";
import { useState } from "react";
import { Action, C, Plane, Readout, Segmented, Slider, Stage, Tex, fmt, useTween } from "@/components/kit";

type V = [number, number];
type Key = "interval" | "exp" | "ratio";

/**
 * The three examples of the notes. Each has a bound that the sequence x_k
 * approaches; `gap(k)` is the distance from the k-th term (or its value) to it.
 */
export const EXAMPLES: Record<Key, { bound: number; term: (k: number) => number; f?: (x: number) => number; gap: (k: number) => number }> = {
  // A = [1, 3): x_k = 3 - 2/(k+1) starts at the minimum 1 and climbs toward 3
  interval: { bound: 3, term: (k) => 3 - 2 / (k + 1), gap: (k) => 2 / (k + 1) },
  // e^{-x} on R: x_k = k/2 walks right, the values fall toward 0
  exp: { bound: 0, term: (k) => k / 2, f: (x) => Math.exp(-x), gap: (k) => Math.exp(-k / 2) },
  // x/(1+x) on x >= 0: x_k = k starts at the minimizer 0, the values climb toward 1
  ratio: { bound: 1, term: (k) => k, f: (x) => x / (1 + x), gap: (k) => 1 / (k + 1) },
};

const MAX_K = 16;

/** A small positive number for LaTeX: decimals while readable, then scientific. */
export function small(n: number) {
  if (n === 0) return "0";
  if (n >= 1e-3) return fmt(n, 4);
  const e = Math.floor(Math.log10(n));
  return `${fmt(n / 10 ** e, 2)}\\times 10^{${e}}`;
}

// where each example sits on the plane: (x, value) is drawn at (sx·x, sy·value)
const SCALE: Record<Key, { sx: number; sy: number; ticks: number[] }> = {
  interval: { sx: 2, sy: 1, ticks: [0, 1, 2, 3, 4] },
  exp: { sx: 1, sy: 2.5, ticks: [0, 2, 4, 6, 8] },
  ratio: { sx: 0.5, sy: 3, ticks: [0, 4, 8, 12, 16] },
};

/** A filled marker: the point belongs to the set. */
const Dot = ({ at, color, r = 6, opacity = 1 }: { at: V; color: string; r?: number; opacity?: number }) => (
  <Point x={at[0]} y={at[1]} color={color} opacity={opacity} svgCircleProps={{ r }} />
);
/** An open marker: the bound is approached but is not in the set. */
const Open = ({ at, color }: { at: V; color: string }) => (
  <Point x={at[0]} y={at[1]} color={color} svgCircleProps={{ r: 6, style: { fill: "var(--surface)", stroke: color, strokeWidth: 2.5 } }} />
);

export function SupInfFigure() {
  const [key, setKey] = useState<Key>("interval");
  const step = useTween(3, 3200);
  const k = Math.round(step.value);
  const ex = EXAMPLES[key];
  const { sx, sy, ticks } = SCALE[key];
  const P = (x: number, v: number): V => [x * sx, v * sy];
  const xk = ex.term(k);
  const fk = ex.f ? ex.f(xk) : xk;
  const gap = ex.gap(k);
  const earlier = Array.from({ length: k }, (_, j) => ex.term(j));

  const readout = {
    interval: (
      <Readout
        tex={`x_{${k}} = 3-\\tfrac{2}{${k + 1}} = ${fmt(xk, 4)} \\in A, \\qquad \\sup A - x_{${k}} = \\tfrac{2}{${k + 1}} = ${small(gap)}`}
        items={[
          { label: "inf A", tex: "1 = \\min A", tone: "teal" },
          { label: "sup A", tex: "3 \\notin A,\\ \\text{no maximum}", tone: "copper" },
          { label: "gap", tex: small(gap), tone: "blue" },
        ]}
      />
    ),
    exp: (
      <Readout
        tex={`f(x_{${k}}) = e^{-${fmt(xk)}} = ${small(fk)}, \\qquad f(x_{${k}}) - \\inf f = ${small(gap)} > 0`}
        items={[
          { label: "inf f", tex: "0,\\ \\text{not attained}", tone: "copper" },
          { label: "minimizer", tex: "\\text{none}" },
          { label: "gap", tex: small(gap), tone: "blue" },
        ]}
      />
    ),
    ratio: (
      <Readout
        tex={`f(x_{${k}}) = \\tfrac{${k}}{${k + 1}} = ${fmt(fk, 4)}, \\qquad \\sup f - f(x_{${k}}) = \\tfrac{1}{${k + 1}} = ${small(gap)}`}
        items={[
          { label: "inf f", tex: "0 = f(0) = \\min f", tone: "teal" },
          { label: "sup f", tex: "1,\\ \\text{not attained}", tone: "copper" },
          { label: "gap", tex: small(gap), tone: "blue" },
        ]}
      />
    ),
  }[key];

  const caption = {
    interval: (
      <>
        The terms <Tex tex="x_k = 3 - \tfrac{2}{k+1}" /> all lie in <Tex tex="A" />, start at the minimum <Tex tex="1" />, and come within{" "}
        <Tex tex="\tfrac{2}{k+1}" /> of <Tex tex="3" />. No smaller ceiling works, so <Tex tex="\sup A = 3" />, yet no term reaches it. A filled
        marker belongs to the set; an open one does not.
      </>
    ),
    exp: (
      <>
        Along <Tex tex="x_k = k/2" /> the values <Tex tex="e^{-k/2}" /> fall below any positive number, so <Tex tex="\inf e^{-x} = 0" />. The gap
        never closes, since <Tex tex="e^{-x} > 0" /> for every <Tex tex="x" />. The infimum is not attained and there is no minimizer.
      </>
    ),
    ratio: (
      <>
        On <Tex tex="x \ge 0" /> the values fill <Tex tex="[0,1)" />. The floor <Tex tex="0" /> is attained at <Tex tex="x^\star = 0" />, so it is a
        minimum. Along <Tex tex="x_k = k" /> the values <Tex tex="\tfrac{k}{k+1}" /> come within <Tex tex="\tfrac{1}{k+1}" /> of <Tex tex="1" />,
        which no <Tex tex="x" /> reaches: a supremum with no maximizer.
      </>
    ),
  }[key];

  // the x-axis with the example's own tick labels (the plane is drawn to scale per example)
  const axis = (
    <>
      <Line.Segment point1={[-1.4, 0]} point2={[8.6, 0]} color={C.muted} weight={1.5} />
      {ticks.map((t) => (
        <g key={t}>
          <Line.Segment point1={[t * sx, -0.08]} point2={[t * sx, 0.08]} color={C.muted} weight={1.5} />
          <LaTeX at={[t * sx, -0.38]} tex={String(t)} color={C.muted} />
        </g>
      ))}
    </>
  );

  return (
    <Stage
      hint="slide k, or press Approach"
      controls={
        <>
          <Segmented
            label="Example"
            value={key}
            onChange={setKey}
            options={[
              { value: "interval", tex: "[1,3)" },
              { value: "exp", tex: "e^{-x}" },
              { value: "ratio", tex: "\\frac{x}{1+x}" },
            ]}
          />
          <Slider tex="k" value={k} min={0} max={MAX_K} step={1} onChange={step.set} />
          <Action primary onClick={() => (step.set(0), step.to(MAX_K))}>
            Approach
          </Action>
        </>
      }
      readout={readout}
      caption={caption}
    >
      {key === "interval" ? (
        <Plane x={[-1, 8.8]} y={[-1.1, 2.3]} height={260} grid={false}>
          {axis}
          {/* the set A on the number line */}
          <Line.Segment point1={P(1, 0)} point2={P(3, 0)} color={C.teal} weight={6} opacity={0.45} />
          {earlier.map((t, j) => (
            <Dot key={j} at={P(t, 0)} color={C.blue} r={3.5} opacity={0.35} />
          ))}
          {/* the gap from the current term to the supremum */}
          <Line.Segment point1={[xk * sx, 0.55]} point2={[3 * sx, 0.55]} color={C.copper} weight={3} />
          <Line.Segment point1={[xk * sx, 0.1]} point2={[xk * sx, 0.55]} color={C.copper} weight={1} style="dashed" />
          <Dot at={P(1, 0)} color={C.teal} />
          <Open at={P(3, 0)} color={C.copper} />
          <Dot at={P(xk, 0)} color={C.blue} />
          <LaTeX at={[2, 1.6]} tex="\inf A = \min A = 1" color={C.teal} />
          <LaTeX at={[6.6, 1.6]} tex="\sup A = 3 \notin A" color={C.copper} />
          <LaTeX at={[xk * sx, -0.85]} tex={`x_{${k}}`} color={C.blue} />
        </Plane>
      ) : (
        <Plane x={[-1.4, 8.8]} y={[-0.9, 4.1]} height={400} grid={false}>
          {axis}
          <Line.Segment point1={[0, -0.2]} point2={[0, 4]} color={C.muted} weight={1.5} />
          {/* the bound, as a horizontal line */}
          <Line.Segment point1={[-0.8, ex.bound * sy]} point2={[8.6, ex.bound * sy]} color={C.copper} weight={1.5} style="dashed" />
          <LaTeX at={[7.4, ex.bound * sy + 0.35]} tex={key === "exp" ? "\\inf f = 0" : "\\sup f = 1"} color={C.copper} />
          <Plot.OfX y={(u) => sy * ex.f!(u / sx)} domain={key === "exp" ? [-0.6, 8.6] : [0, 8.6]} color={C.ink} weight={2.5} />
          {/* the set of values of f, on its own line at the left: (0, ∞) or [0, 1) */}
          <Line.Segment point1={[-0.8, 0]} point2={[-0.8, key === "exp" ? 4 : sy]} color={C.teal} weight={6} opacity={0.45} />
          <LaTeX at={[-0.8, key === "exp" ? -0.55 : 3.6]} tex={key === "exp" ? "f(\\mathbb R)" : "f([0,\\infty))"} color={C.teal} />
          {key === "ratio" ? (
            <>
              <Dot at={[-0.8, 0]} color={C.teal} />
              <Dot at={[0, 0]} color={C.teal} />
              <LaTeX at={[0.75, -0.5]} tex="x^\star = 0" color={C.teal} />
            </>
          ) : null}
          <Open at={[-0.8, ex.bound * sy]} color={C.copper} />
          {earlier.map((t, j) => (
            <Dot key={j} at={P(t, ex.f!(t))} color={C.blue} r={3.5} opacity={0.35} />
          ))}
          {/* the gap: the vertical distance from the current value to the bound */}
          <Line.Segment point1={P(xk, fk)} point2={P(xk, ex.bound)} color={C.copper} weight={3} />
          <Line.Segment point1={P(xk, fk)} point2={[-0.8, fk * sy]} color={C.blue} weight={1} opacity={0.5} style="dashed" />
          <Dot at={[-0.8, fk * sy]} color={C.blue} r={4} />
          <Dot at={P(xk, fk)} color={C.blue} />
          <LaTeX at={[xk * sx + 0.3, fk * sy + (key === "exp" ? 0.45 : -0.45)]} tex={`x_{${k}}`} color={C.blue} />
        </Plane>
      )}
    </Stage>
  );
}
