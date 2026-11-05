"use client";

import { LaTeX, Line, Polygon, Vector, useMovablePoint } from "mafs";
import { Action, C, Plane, Readout, Stage, Tex, fmt, useTween, vecTex } from "@/components/kit";

type V = [number, number];

const lerp = (a: V, b: V, t: number): V => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const snap = ([x, y]: V): V => [Math.round(x * 4) / 4, Math.round(y * 4) / 4];

/** Coordinates of x in the basis (u, v) by Cramer's rule; null when u, v are dependent. */
export function coordinates(u: V, v: V, x: V) {
  const det = u[0] * v[1] - u[1] * v[0];
  if (Math.abs(det) < 1e-9) return { det, c: null as V | null };
  return { det, c: [(x[0] * v[1] - x[1] * v[0]) / det, (u[0] * x[1] - u[1] * x[0]) / det] as V };
}

export function BasisFigure() {
  const b1 = useMovablePoint([1, 0], { color: C.teal, constrain: snap });
  const b2 = useMovablePoint([1, 1], { color: C.copper, constrain: snap });
  const x = useMovablePoint([5, 2], { color: C.blue, constrain: snap });
  // t = 0 shows the standard basis, t = 1 the chosen one; in between the grid moves
  const morph = useTween(1, 1400);
  const t = morph.value;
  const u = lerp([1, 0], b1.point, t);
  const v = lerp([0, 1], b2.point, t);
  const { det, c } = coordinates(u, v, x.point);
  const N = 12;

  return (
    <Stage
      hint="drag b₁, b₂ and x"
      controls={
        <>
          <Action primary onClick={() => (morph.set(0), morph.to(1))}>
            Morph from <Tex tex="e_1, e_2" />
          </Action>
          <Action
            onClick={() => {
              b1.setPoint([1, 0]);
              b2.setPoint([1, 1]);
              x.setPoint([5, 2]);
            }}
          >
            The notes&apos; basis
          </Action>
          <Action
            onClick={() => {
              b1.setPoint([1, 0.5]);
              b2.setPoint([2, 1]);
            }}
          >
            A dependent pair
          </Action>
        </>
      }
      readout={
        <Readout
          tex={
            c
              ? `${vecTex(x.point)} = ${fmt(c[0], 2)}\\,${vecTex(b1.point)} + ${fmt(c[1], 2)}\\,${vecTex(b2.point)},\\qquad [x]_B = (${fmt(c[0], 2)},\\ ${fmt(c[1], 2)})`
              : `\\det\\,[\\,b_1\\ b_2\\,] = 0:\\ \\text{the vectors are dependent, span a line, and are not a basis}`
          }
          items={[
            { label: "det [b₁ b₂]", tex: fmt(det, 2), tone: Math.abs(det) < 1e-9 ? "copper" : "teal" },
            { label: "dimension of the span", tex: Math.abs(det) < 1e-9 ? "1" : "2" },
          ]}
        />
      }
      caption={
        <>
          The grid is every integer combination of the basis. The teal and copper legs are the only way to reach{" "}
          <Tex tex="x" /> along it, and their lengths in units of <Tex tex="b_1" /> and <Tex tex="b_2" /> are the coordinates{" "}
          <Tex tex="[x]_B" />. With the notes&apos; basis, <Tex tex="(5,2)=3b_1+2b_2" />. When the two vectors line up, the grid
          collapses onto a line and the coordinates stop existing.
        </>
      }
    >
      <Plane x={[-2, 7]} y={[-2, 4.5]} height={440}>
        {Math.abs(det) > 1e-9
          ? Array.from({ length: 2 * N + 1 }, (_, k) => k - N).flatMap((i) => [
              <Line.Segment key={`a${i}`} point1={[i * u[0] - N * v[0], i * u[1] - N * v[1]]} point2={[i * u[0] + N * v[0], i * u[1] + N * v[1]]} color={C.muted} opacity={0.18} weight={1} />,
              <Line.Segment key={`b${i}`} point1={[i * v[0] - N * u[0], i * v[1] - N * u[1]]} point2={[i * v[0] + N * u[0], i * v[1] + N * u[1]]} color={C.muted} opacity={0.18} weight={1} />,
            ])
          : <Line.ThroughPoints point1={[0, 0]} point2={Math.hypot(...u) > 1e-9 ? u : v} color={C.copper} style="dashed" />}
        <Polygon points={[[0, 0], u, [u[0] + v[0], u[1] + v[1]], v]} color={C.teal} fillOpacity={0.08} weight={0} />
        {c ? (
          <>
            <Vector tail={[0, 0]} tip={[c[0] * u[0], c[0] * u[1]]} color={C.teal} weight={4} opacity={0.55} />
            <Vector tail={[c[0] * u[0], c[0] * u[1]]} tip={x.point} color={C.copper} weight={4} opacity={0.55} />
          </>
        ) : null}
        <Vector tip={u} color={C.teal} weight={3} />
        <Vector tip={v} color={C.copper} weight={3} />
        <LaTeX at={[u[0] + 0.25, u[1] - 0.35]} tex="b_1" color={C.teal} />
        <LaTeX at={[v[0] - 0.35, v[1] + 0.3]} tex="b_2" color={C.copper} />
        <LaTeX at={[x.x + 0.35, x.y + 0.35]} tex="x" color={C.blue} />
        {b1.element}
        {b2.element}
        {x.element}
      </Plane>
    </Stage>
  );
}
