"use client";

import { LaTeX, Line, Point, Polygon, Vector, useMovablePoint } from "mafs";
import { useState } from "react";
import { Action, C, Plane, Readout, Slider, Stage, Tex, fmt, useTween, vecTex } from "@/components/kit";

type V = [number, number];

const snap = ([x, y]: V): V => [Math.round(x * 4) / 4, Math.round(y * 4) / 4];
const det = (u: V, v: V) => u[0] * v[1] - u[1] * v[0];
const isZero = (v: V) => v[0] === 0 && v[1] === 0;
const EPS = 1e-9;

/**
 * Weights c, not all zero, with Σ cᵢ vᵢ = 0; null when the vectors are
 * independent. Handles two or three vectors in the plane.
 */
export function relation(vs: V[]): number[] | null {
  const [v1, v2, v3] = vs;
  const D = det(v1, v2);
  if (Math.abs(D) > EPS) {
    if (!v3) return null;
    // v₃ = c₁v₁ + c₂v₂ by Cramer's rule, so c₁v₁ + c₂v₂ − v₃ = 0
    return [det(v3, v2) / D, det(v1, v3) / D, -1];
  }
  const pad = vs.length === 3 ? [0] : [];
  if (isZero(v1)) return [1, 0, ...pad];
  // v₂ is a multiple λv₁ of the nonzero v₁, so λv₁ − v₂ = 0
  const lambda = Math.abs(v1[0]) > Math.abs(v1[1]) ? v2[0] / v1[0] : v2[1] / v1[1];
  return [lambda, -1, ...pad];
}

/** Σ cᵢ vᵢ in LaTeX, with zero weights dropped and unit weights written bare. */
export function comboTex(c: number[], names: string[]) {
  let out = "";
  c.forEach((ci, i) => {
    if (Math.abs(ci) < EPS) return;
    const mag = Math.abs(Math.abs(ci) - 1) < EPS ? "" : fmt(Math.abs(ci), 2);
    out += ci < 0 ? ` - ${mag}${names[i]}` : `${out ? " + " : ""}${mag}${names[i]}`;
  });
  return (out.startsWith(" - ") ? "-" + out.slice(3) : out) || "0";
}

/** Dimension of the span of vectors in the plane: 2, 1 or 0. */
export function rank(vs: V[]) {
  for (let i = 0; i < vs.length; i++) for (let j = i + 1; j < vs.length; j++) if (Math.abs(det(vs[i], vs[j])) > EPS) return 2;
  return vs.some((v) => !isZero(v)) ? 1 : 0;
}

const TARGET: V = [5, 2];

export function SpanFigure() {
  const v1 = useMovablePoint([1, 0], { color: C.teal, constrain: snap });
  const v2 = useMovablePoint([1, 1], { color: C.copper, constrain: snap });
  const v3 = useMovablePoint([2, 1], { color: C.violet, constrain: snap });
  const [third, setThird] = useState(false);
  const al = useTween(3, 1200);
  const be = useTween(2, 1200);
  const alpha = al.value;
  const beta = be.value;

  const a: V = [alpha * v1.x, alpha * v1.y];
  const w: V = [a[0] + beta * v2.x, a[1] + beta * v2.y];
  const shown = third ? [v1.point, v2.point, v3.point] : [v1.point, v2.point];
  const names = third ? ["v_1", "v_2", "v_3"] : ["v_1", "v_2"];
  const dim = rank(shown);
  const rel = relation(shown);
  const D = det(v1.point, v2.point);
  const along = shown.find((v) => !isZero(v));

  const solve = () => {
    // the weights of (5,2) in v₁, v₂: α = x₁ − x₂, β = x₂ for the notes' pair
    al.to(det(TARGET, v2.point) / D);
    be.to(det(v1.point, TARGET) / D);
  };

  return (
    <Stage
      hint={third ? "drag v₁, v₂ and v₃" : "drag v₁ and v₂"}
      controls={
        <>
          <Slider tex="\alpha" value={alpha} min={-4} max={4} step={0.25} onChange={al.set} show={fmt(alpha, 2)} />
          <Slider tex="\beta" value={beta} min={-4} max={4} step={0.25} onChange={be.set} show={fmt(beta, 2)} />
          {Math.abs(D) > EPS ? (
            <Action primary onClick={solve}>
              Reach <Tex tex="(5,2)" />
            </Action>
          ) : null}
          <Action pressed={third} onClick={() => setThird(!third)}>
            Add <Tex tex="v_3" />
          </Action>
          <Action
            onClick={() => {
              v1.setPoint([1, 0]);
              v2.setPoint([1, 1]);
              v3.setPoint([2, 1]);
              al.set(3);
              be.set(2);
            }}
          >
            The notes&apos; vectors
          </Action>
        </>
      }
      readout={
        <Readout
          tex={`${fmt(alpha, 2)}\\,${vecTex(v1.point)} + ${fmt(beta, 2)}\\,${vecTex(v2.point)} = ${vecTex(w)}`}
          items={[
            { label: "det [v₁ v₂]", tex: fmt(D, 2), tone: Math.abs(D) > EPS ? "teal" : "copper" },
            { label: "dimension of the span", tex: dim === 2 ? "2,\\ \\mathbb{R}^2" : dim === 1 ? "1,\\ \\text{a line}" : "0,\\ \\{0\\}" },
            rel
              ? { label: "dependent", tex: `${comboTex(rel, names)} = 0`, tone: "copper" }
              : { label: "independent", tex: `${names.map((_, i) => `c_${i + 1}`).join(" = ")} = 0\\ \\text{only}`, tone: "teal" },
          ]}
        />
      }
      caption={
        <>
          The blue arrow is <Tex tex="\alpha v_1 + \beta v_2" />, built tip to tail; the shading is every place it can reach. With the notes&apos;{" "}
          <Tex tex="v_1 = (1,0)^\mathsf{T}" /> and <Tex tex="v_2 = (1,1)^\mathsf{T}" /> that is the whole plane, and{" "}
          <Tex tex="(5,2)^\mathsf{T} = 3v_1 + 2v_2" />. Line the two up and the span collapses to a line, and the readout names a combination
          with weights not all zero that gives <Tex tex="0" />. Adding <Tex tex="v_3 = (2,1)^\mathsf{T}" /> adds nothing:{" "}
          <Tex tex="v_1 + v_2 - v_3 = 0" />, so the span is unchanged.
        </>
      }
    >
      <Plane x={[-3, 8]} y={[-3, 5]} height={440}>
        {dim === 2 ? (
          <Polygon points={[[-20, -20], [20, -20], [20, 20], [-20, 20]]} color={C.teal} fillOpacity={0.07} weight={0} />
        ) : dim === 1 && along ? (
          <Line.ThroughPoints point1={[0, 0]} point2={along} color={C.teal} weight={7} opacity={0.25} />
        ) : (
          <Point x={0} y={0} color={C.teal} />
        )}
        <Point x={TARGET[0]} y={TARGET[1]} color={C.muted} opacity={0.6} />
        <LaTeX at={[TARGET[0] + 0.45, TARGET[1] - 0.4]} tex="(5,2)" color={C.muted} />

        {/* tip to tail: αv₁, then βv₂ from its tip */}
        <Vector tip={a} color={C.teal} weight={4} opacity={0.45} />
        <Vector tail={a} tip={w} color={C.copper} weight={4} opacity={0.45} />
        <Vector tip={w} color={C.blue} weight={2.5} />
        <LaTeX at={[w[0] + 0.3, w[1] + 0.4]} tex="\alpha v_1 + \beta v_2" color={C.blue} />

        <Vector tip={v1.point} color={C.teal} weight={3} />
        <Vector tip={v2.point} color={C.copper} weight={3} />
        <LaTeX at={[v1.x + 0.3, v1.y - 0.4]} tex="v_1" color={C.teal} />
        <LaTeX at={[v2.x - 0.4, v2.y + 0.35]} tex="v_2" color={C.copper} />
        {third ? (
          <>
            <Vector tip={v3.point} color={C.violet} weight={3} />
            <LaTeX at={[v3.x + 0.35, v3.y + 0.35]} tex="v_3" color={C.violet} />
          </>
        ) : null}
        {v1.element}
        {v2.element}
        {third ? v3.element : null}
      </Plane>
    </Stage>
  );
}
