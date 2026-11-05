"use client";

import { LaTeX, Line, MovablePoint, Polygon, Polyline, Vector } from "mafs";
import { useState } from "react";
import { Action, C, Plane, Readout, Segmented, Slider, Stage, Tex, fmt, useTween } from "@/components/kit";

type V = [number, number];
/** a b / c d, row-major, so the columns are (a, c) and (b, d) */
export type M = [number, number, number, number];

const PRESETS: { name: string; m: M }[] = [
  { name: "Notes", m: [4, -5, 2, -3] },
  { name: "Symmetric", m: [2, 1, 1, 2] },
  { name: "Shear", m: [1, 1, 0, 1] },
  { name: "Rotation", m: [0, -1, 1, 0] },
  { name: "Projection", m: [0.5, 0.5, 0.5, 0.5] },
  { name: "Reflection", m: [1, 0, 0, -1] },
];

// the window: column tips are kept inside it
const X: V = [-6.5, 6.5];
const Y: V = [-4.5, 4.5];
const snap = ([x, y]: V): V => [Math.min(6, Math.max(-6, Math.round(x * 4) / 4)), Math.min(4.25, Math.max(-4.25, Math.round(y * 4) / 4))];

/** (1-t)I + tA: the straight path from the identity to A. */
export const along = (m: M, t: number): M => [1 - t + t * m[0], t * m[1], t * m[2], 1 - t + t * m[3]];
export const apply = (m: M, [x, y]: V): V => [m[0] * x + m[1] * y, m[2] * x + m[3] * y];
export const det = (m: M) => m[0] * m[3] - m[1] * m[2];

export type Eigen = { real: true; pairs: { lambda: number; v: V }[] } | { real: false; re: number; im: number };

/** Real eigenpairs of a 2x2 matrix from its trace and determinant, unit eigenvectors. */
export function eigen(m: M): Eigen {
  const [a, b, c, d] = m;
  const tr = a + d;
  const dt = a * d - b * c;
  const disc = (tr * tr) / 4 - dt;
  if (disc < -1e-9) return { real: false, re: tr / 2, im: Math.sqrt(-disc) };
  const s = Math.sqrt(Math.max(0, disc));
  const lams = s < 1e-9 ? [tr / 2] : [tr / 2 + s, tr / 2 - s];
  const pairs: { lambda: number; v: V }[] = [];
  for (const lambda of lams) {
    // a row of A - lambda I, turned a quarter, spans its null space
    let v: V = [b, lambda - a];
    if (Math.hypot(...v) < 1e-9) v = [lambda - d, c];
    if (Math.hypot(...v) < 1e-9) {
      // A = lambda I: every direction is an eigenvector; show the axes
      pairs.push({ lambda, v: [1, 0] }, { lambda, v: [0, 1] });
      continue;
    }
    const n = Math.hypot(...v);
    // the sign is free; choose the one with a positive first nonzero entry, as in the notes' (5,2)
    const sg = Math.abs(v[0]) > 1e-9 ? Math.sign(v[0]) : Math.sign(v[1]);
    pairs.push({ lambda, v: [(sg * v[0]) / n, (sg * v[1]) / n] });
  }
  return { real: true, pairs };
}

/** A direction in small integers when it has one, as the notes write (5,2); else three decimals. */
export function direction(v: V) {
  const small = Math.min(...v.filter((x) => Math.abs(x) > 1e-9).map(Math.abs));
  for (let d = 1; d <= 6; d++) {
    const w = v.map((x) => (x / small) * d);
    if (w.every((x) => Math.abs(x - Math.round(x)) < 1e-6)) return `(${w.map((x) => fmt(Math.round(x), 0)).join(",\\ ")})`;
  }
  return `(${fmt(v[0], 3)},\\ ${fmt(v[1], 3)})`;
}

const matTex = (m: M) => `\\begin{bmatrix}${fmt(m[0], 2)} & ${fmt(m[1], 2)}\\\\ ${fmt(m[2], 2)} & ${fmt(m[3], 2)}\\end{bmatrix}`;

export function TransformFigure() {
  const [m, setM] = useState<M>(PRESETS[0].m);
  // t = 0 is the identity, t = 1 is A
  const morph = useTween(1, 1800);
  const t = morph.value;
  const mt = along(m, t);
  const dt = det(mt);
  const e = eigen(m);
  const preset = PRESETS.find((p) => p.m.every((v, i) => v === m[i]))?.name ?? "";

  const play = (next: M) => {
    setM(next);
    morph.set(0);
    morph.to(1);
  };
  const moveColumn = (j: 0 | 1, [x, y]: V) => {
    const next = [...m] as M;
    next[j] = x;
    next[2 + j] = y;
    setM(next);
    morph.set(1);
  };

  // where the grid lines of the plane land
  const N = 10;
  const grid = Array.from({ length: 2 * N + 1 }, (_, k) => k - N).flatMap((i) => [
    <Line.Segment key={`v${i}`} point1={apply(mt, [i, -N])} point2={apply(mt, [i, N])} color={C.blue} opacity={i === 0 ? 0.5 : 0.2} weight={1} />,
    <Line.Segment key={`h${i}`} point1={apply(mt, [-N, i])} point2={apply(mt, [N, i])} color={C.blue} opacity={i === 0 ? 0.5 : 0.2} weight={1} />,
  ]);
  const circle: V[] = Array.from({ length: 121 }, (_, i) => apply(mt, [Math.cos((i / 120) * 2 * Math.PI), Math.sin((i / 120) * 2 * Math.PI)]));
  const square = ([[0, 0], [1, 0], [1, 1], [0, 1]] as V[]).map((p) => apply(mt, p));
  const c1 = apply(mt, [1, 0]);
  const c2 = apply(mt, [0, 1]);
  const flipped = dt < -1e-9;
  const tone = (i: number) => (i === 0 ? C.teal : C.copper);

  const eig = e.real
    ? `\\lambda = ${[...new Set(e.pairs.map((p) => fmt(p.lambda, 3)))].join(",\\ ")}`
    : `\\lambda = ${fmt(e.re, 3)} \\pm ${fmt(e.im, 3)}\\,i`;

  return (
    <Stage
      hint="drag Ae₁ and Ae₂"
      controls={
        <>
          <Segmented label="Matrix" value={preset} onChange={(name) => play(PRESETS.find((p) => p.name === name)!.m)} options={PRESETS.map((p) => ({ value: p.name, text: p.name }))} />
          <Slider tex="t" value={t} min={0} max={1} step={0.01} onChange={(v) => morph.set(v)} />
          <Action primary onClick={() => play(m)}>
            Apply <Tex tex="A" />
          </Action>
        </>
      }
      readout={
        <Readout
          tex={`(1-t)I+tA = ${matTex(mt)},\\qquad A = ${matTex(m)}`}
          items={[
            { label: "area of the square", tex: `|\\det((1-t)I+tA)| = ${fmt(Math.abs(dt), 3)}`, tone: flipped ? "copper" : "teal" },
            { label: "det A, tr A", tex: `${fmt(det(m), 3)},\\ ${fmt(m[0] + m[3], 3)}`, tone: det(m) < -1e-9 ? "copper" : undefined },
            { label: "eigenvalues", tex: e.real ? eig : `${eig}\\ \\text{(no real eigenvector)}` },
            ...(e.real ? e.pairs.slice(0, 2).map((p, i) => ({ label: `eigenline ${i + 1}`, tex: `\\operatorname{span}\\{${direction(p.v)}\\}`, tone: (i === 0 ? "teal" : "copper") as "teal" | "copper" })) : []),
          ]}
        />
      }
      caption={
        <>
          The plane moves from <Tex tex="I" /> to <Tex tex="A" /> along <Tex tex="(1-t)I+tA" />. The blue grid is where the square grid lands, and the blue arrows are the columns{" "}
          <Tex tex="Ae_1" /> and <Tex tex="Ae_2" />. The unit square becomes a parallelogram of area <Tex tex="|\det|" />, copper once the orientation flips, and the unit circle becomes an
          ellipse. A vector on a dashed eigenline stays on it the whole way and is only stretched, by <Tex tex="\lambda" /> at the end. For the notes&apos;{" "}
          <Tex tex="A" /> these are <Tex tex="\lambda=2" /> along <Tex tex="(5,2)" /> and <Tex tex="\lambda=-1" /> along <Tex tex="(1,1)" />. The rotation has no eigenline, the shear has one,
          and the projection flattens the plane onto a line, so its determinant is <Tex tex="0" />.
        </>
      }
    >
      <Plane x={X} y={Y} height={460}>
        {grid}
        <Polygon points={square} color={flipped ? C.copper : C.teal} fillOpacity={0.22} weight={1.5} />
        <Polyline points={circle} color={C.ink} weight={1.5} fillOpacity={0} />
        {e.real
          ? e.pairs.slice(0, 2).map(({ lambda, v }, i) => {
              // the unit eigenvector v goes to ((1-t) + t lambda) v
              const s = 1 - t + t * lambda;
              const at = Math.min(5.2 / Math.max(Math.abs(v[0]), 1e-9), 3.6 / Math.max(Math.abs(v[1]), 1e-9));
              return (
                <g key={i}>
                  <Line.ThroughPoints point1={[0, 0]} point2={v} color={tone(i)} style="dashed" opacity={0.7} />
                  <Vector tip={[s * v[0], s * v[1]]} color={tone(i)} weight={5} opacity={0.75} />
                  <LaTeX at={[at * v[0] + 0.45 * -v[1] * (i ? -1 : 1), at * v[1] + 0.45 * v[0] * (i ? -1 : 1)]} tex={`\\lambda=${fmt(lambda, 2)}`} color={tone(i)} />
                </g>
              );
            })
          : null}
        <Vector tip={c1} color={C.blue} weight={3} />
        <Vector tip={c2} color={C.blue} weight={3} />
        <LaTeX at={[c1[0] + 0.35, c1[1] - 0.4]} tex="Ae_1" color={C.blue} />
        <LaTeX at={[c2[0] - 0.45, c2[1] + 0.4]} tex="Ae_2" color={C.blue} />
        <MovablePoint point={c1} color={C.blue} constrain={(p) => snap(p as V)} onMove={(p) => moveColumn(0, p as V)} />
        <MovablePoint point={c2} color={C.blue} constrain={(p) => snap(p as V)} onMove={(p) => moveColumn(1, p as V)} />
      </Plane>
    </Stage>
  );
}
