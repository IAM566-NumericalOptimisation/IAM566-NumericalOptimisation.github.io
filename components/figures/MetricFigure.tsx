"use client";

import { Circle, LaTeX, Line, Point, Polygon, useMovablePoint } from "mafs";
import { useState } from "react";
import { C, Plane, Readout, Segmented, Slider, Stage, Tex, fmt } from "@/components/kit";

type V = [number, number];
export type Kind = "l1" | "l2" | "linf" | "d0";

const snap = ([x, y]: V): V => [Math.round(x * 4) / 4, Math.round(y * 4) / 4];

const KINDS: { value: Kind; tex: string; formula: string }[] = [
  { value: "l1", tex: "\\|\\cdot\\|_1", formula: "\\|x-y\\|_1" },
  { value: "l2", tex: "\\|\\cdot\\|_2", formula: "\\|x-y\\|_2" },
  { value: "linf", tex: "\\|\\cdot\\|_\\infty", formula: "\\|x-y\\|_\\infty" },
  { value: "d0", tex: "d_0", formula: "d_0(x,y)" },
];

/** The four distances of the figure: three induced by norms, and the discrete metric. */
export function dist(kind: Kind, a: V, b: V) {
  const dx = Math.abs(a[0] - b[0]);
  const dy = Math.abs(a[1] - b[1]);
  if (kind === "l1") return dx + dy;
  if (kind === "l2") return Math.hypot(dx, dy);
  if (kind === "linf") return Math.max(dx, dy);
  return dx === 0 && dy === 0 ? 0 : 1;
}

/** The ball {p : d(c, p) ≤ r} as a polygon (the Euclidean one is drawn as a circle). */
function ballPoints(kind: Kind, c: V, r: number): V[] {
  if (kind === "l1") return [[c[0] + r, c[1]], [c[0], c[1] + r], [c[0] - r, c[1]], [c[0], c[1] - r]];
  if (kind === "linf") return [[c[0] + r, c[1] + r], [c[0] - r, c[1] + r], [c[0] - r, c[1] - r], [c[0] + r, c[1] - r]];
  // the discrete ball of radius 1 already contains every point of the plane
  return [[-20, -20], [20, -20], [20, 20], [-20, 20]];
}

export function MetricFigure() {
  const x = useMovablePoint([-1, -0.5], { color: C.ink, constrain: snap });
  const y = useMovablePoint([1.25, 1], { color: C.blue, constrain: snap });
  const z = useMovablePoint([1.5, -1], { color: C.copper, constrain: snap });
  const [kind, setKind] = useState<Kind>("l2");
  const [alpha, setAlpha] = useState(2);

  const k = KINDS.find((q) => q.value === kind)!;
  const dxy = dist(kind, x.point, y.point);
  const dxz = dist(kind, x.point, z.point);
  const dzy = dist(kind, z.point, y.point);
  const ax: V = [alpha * x.x, alpha * x.y];
  const ay: V = [alpha * y.x, alpha * y.y];
  const scaled = dist(kind, ax, ay);
  const homogeneous = Math.abs(scaled - Math.abs(alpha) * dxy) < 1e-9;
  const A = fmt(alpha);

  // how each metric walks from x to y: along the axes, straight, by the longer leg, or in one jump
  const route =
    kind === "l1" ? (
      <>
        <Line.Segment point1={x.point} point2={[y.x, x.y]} color={C.ink} weight={3} />
        <Line.Segment point1={[y.x, x.y]} point2={y.point} color={C.ink} weight={3} />
      </>
    ) : kind === "l2" ? (
      <Line.Segment point1={x.point} point2={y.point} color={C.ink} weight={3} />
    ) : kind === "linf" ? (
      <>
        <Line.Segment point1={x.point} point2={y.point} color={C.ink} weight={1} style="dashed" />
        {Math.abs(y.x - x.x) >= Math.abs(y.y - x.y) ? (
          <Line.Segment point1={x.point} point2={[y.x, x.y]} color={C.ink} weight={3} />
        ) : (
          <Line.Segment point1={x.point} point2={[x.x, y.y]} color={C.ink} weight={3} />
        )}
      </>
    ) : (
      <Line.Segment point1={x.point} point2={y.point} color={C.ink} weight={2} style="dashed" />
    );

  return (
    <Stage
      hint="drag x, y and z"
      controls={
        <>
          <Segmented label="Metric" value={kind} onChange={setKind} options={KINDS.map(({ value, tex }) => ({ value, tex }))} />
          <Slider tex="\alpha" value={alpha} min={-2} max={3} step={0.25} onChange={setAlpha} />
        </>
      }
      readout={
        <Readout
          tex={`d(x,y) = ${k.formula} = ${fmt(dxy)}, \\qquad d(x,z) + d(z,y) = ${fmt(dxz)} + ${fmt(dzy)} = ${fmt(dxz + dzy)}\\ \\ge\\ d(x,y)`}
          items={[
            {
              label: "scaling both points by α",
              tex: `d(${A}x,\\,${A}y) = ${fmt(scaled)}\\ ${homogeneous ? "=" : "\\ne"}\\ |${A}|\\,d(x,y) = ${fmt(Math.abs(alpha) * dxy)}`,
              tone: homogeneous ? "teal" : "copper",
            },
            { label: "ball around x through y", tex: kind === "d0" ? (dxy === 0 ? "\\{x\\}" : "\\mathbb{R}^2") : `\\text{radius } ${fmt(dxy)}` },
          ]}
        />
      }
      caption={
        <>
          The shaded set is the ball around <Tex tex="x" /> through <Tex tex="y" />, and the solid path is how the chosen metric measures the
          gap: along the axes for <Tex tex="\|\cdot\|_1" />, straight for <Tex tex="\|\cdot\|_2" />, the longer leg for{" "}
          <Tex tex="\|\cdot\|_\infty" />, and a single jump of <Tex tex="1" /> for <Tex tex="d_0" />. The dashed detour through <Tex tex="z" /> is
          never shorter, which is the triangle inequality. The violet pair is <Tex tex="\alpha x, \alpha y" />. The three norms scale the distance
          by <Tex tex="|\alpha|" />. For <Tex tex="x \ne y" />, <Tex tex="d_0" /> stays <Tex tex="1" /> for every <Tex tex="\alpha \ne 0" />, so it
          fails whenever <Tex tex="|\alpha| \ne 1" /> and <Tex tex="\alpha \ne 0" />. That is why it comes from no norm.
        </>
      }
    >
      <Plane x={[-3.5, 3.5]} y={[-2.6, 2.6]} height={420}>
        {kind === "l2" ? (
          <Circle center={x.point} radius={dxy} color={C.teal} fillOpacity={0.1} weight={1.5} />
        ) : (
          <Polygon points={ballPoints(kind, x.point, dxy)} color={C.teal} fillOpacity={0.1} weight={kind === "d0" ? 0 : 1.5} />
        )}
        {/* the triangle x → z → y against the direct gap */}
        <Line.Segment point1={x.point} point2={z.point} color={C.copper} weight={1.5} style="dashed" />
        <Line.Segment point1={z.point} point2={y.point} color={C.copper} weight={1.5} style="dashed" />
        {route}
        {/* the scaled pair αx, αy */}
        <Line.Segment point1={ax} point2={ay} color={C.violet} weight={1} opacity={0.6} style="dashed" />
        <Point x={ax[0]} y={ax[1]} color={C.violet} opacity={0.7} svgCircleProps={{ r: 4 }} />
        <Point x={ay[0]} y={ay[1]} color={C.violet} opacity={0.7} svgCircleProps={{ r: 4 }} />
        <LaTeX at={[ax[0] - 0.35, ax[1] - 0.3]} tex="\alpha x" color={C.violet} />
        <LaTeX at={[ay[0] + 0.35, ay[1] + 0.3]} tex="\alpha y" color={C.violet} />

        <LaTeX at={[x.x - 0.3, x.y - 0.3]} tex="x" color={C.ink} />
        <LaTeX at={[y.x + 0.3, y.y + 0.3]} tex="y" color={C.blue} />
        <LaTeX at={[z.x + 0.3, z.y - 0.3]} tex="z" color={C.copper} />
        {z.element}
        {x.element}
        {y.element}
      </Plane>
    </Stage>
  );
}
