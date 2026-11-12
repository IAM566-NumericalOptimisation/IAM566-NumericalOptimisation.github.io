"use client";

import { LaTeX, Line, MovablePoint, Plot, Point, Polygon } from "mafs";
import { useState } from "react";
import { Action, C, Plane, Readout, Slider, Stage, Tex } from "@/components/kit";
import { jensen, texNum, type V2 } from "@/lib/convex/models";

// CF-11 (optional extension). How far is the average of values above the value of the average?

const X0 = [-1, 0, 2];
const W0 = [1, 1, 1];
const f = (x: number) => x * x;
const snap = (v: number) => Math.round(v * 4) / 4;
const clampX = (v: number) => Math.min(2.25, Math.max(-2, snap(v)));

export function JensenFigure() {
  const [xs, setXs] = useState<number[]>(X0);
  const [ws, setWs] = useState<number[]>(W0);
  const j = jensen(xs, ws);
  const setX = (i: number, v: number) => setXs((o) => o.map((x, k) => (k === i ? clampX(v) : x)));
  const setW = (i: number, v: number) => setWs((o) => o.map((w, k) => (k === i ? v : w)));

  const hull: V2[] = xs
    .map((x, i) => [x, f(x), ws[i]] as const)
    .filter((p) => p[2] > 0)
    .sort((a, b) => a[0] - b[0])
    .map(([x, y]) => [x, y]);

  return (
    <Stage
      hint="drag the points along the graph, or use the sliders"
      controls={
        <>
          {xs.map((x, i) => (
            <Slider key={`x${i}`} tex={`x_${i + 1}`} value={x} min={-2} max={2.25} step={0.25} onChange={(v) => setX(i, v)} show={texNum(x, 2)} />
          ))}
          {ws.map((w, i) => (
            <Slider key={`w${i}`} tex={`\\omega_${i + 1}`} value={w} min={0} max={3} step={0.25} onChange={(v) => setW(i, v)} show={texNum(w, 2)} />
          ))}
          <Action onClick={() => (setXs(X0), setWs(W0))}>Reset</Action>
        </>
      }
      readout={
        j ? (
          <>
            <Readout
              tex={`\\bar x = \\textstyle\\sum_i w_i x_i = ${texNum(j.mean)},\\quad \\sum_i w_i x_i^2 = ${texNum(j.meanSq)},\\quad \\bar x^{\\,2} = ${texNum(j.sqMean)},\\quad \\text{gap} = ${texNum(j.gap)} = \\textstyle\\sum_i w_i (x_i-\\bar x)^2`}
              items={[{ label: "normalized weights w = ω / Σω", tex: `(${j.w.map((w) => texNum(w)).join(",\\ ")})` }]}
            />
          </>
        ) : (
          <p style={{ margin: "1rem 0 0", color: "var(--muted)" }}>All weights are zero: at least one positive weight is needed to form an average.</p>
        )
      }
      caption={
        <>
          <strong>How far is the average of the values above the value of the average?</strong> The raw weights <Tex tex="\omega_i\ge0" /> are divided by their sum to
          give <Tex tex="w_i" />. The copper point is the weighted mean of the graph points <Tex tex="(x_i,x_i^2)" />; it lies in their convex hull, above the graph. The blue
          point is <Tex tex="(\bar x,\bar x^2)" />. For <Tex tex="f(x)=x^2" /> the vertical gap between them is exactly the weighted variance. A point with weight zero
          (hollow) takes no part in the average or in the equality condition. This figure illustrates an extension beyond the course notes.
        </>
      }
    >
      <Plane x={[-2.6, 3]} y={[-0.8, 5.6]} height={360} stretch>
        <Plot.OfX y={f} color={C.blue} weight={3} />
        {hull.length >= 2 ? <Polygon points={hull} color={C.copper} fillOpacity={0.1} strokeOpacity={0.5} weight={1.5} strokeStyle="dashed" /> : null}
        {xs.map((x, i) =>
          ws[i] > 0 ? null : <Point key={`h${i}`} x={x} y={f(x)} color={C.faint} svgCircleProps={{ r: 6, style: { fill: "var(--surface)", stroke: "var(--faint)", strokeWidth: 2 } }} />,
        )}
        {j ? (
          <>
            <Line.Segment point1={[j.mean, 0]} point2={[j.mean, j.meanSq]} color={C.faint} weight={1} style="dashed" />
            {j.gap > 1e-9 ? <Line.Segment point1={[j.mean, j.sqMean]} point2={[j.mean, j.meanSq]} color={C.teal} weight={4} /> : null}
            <Point x={j.mean} y={j.meanSq} color={C.copper} svgCircleProps={{ r: 6 }} />
            <Point x={j.mean} y={j.sqMean} color={C.blue} svgCircleProps={{ r: 6 }} />
            <LaTeX at={[j.mean + 0.55, j.meanSq + 0.3]} tex="\textstyle\sum w_i x_i^2" color={C.copper} />
            <LaTeX at={[j.mean + 0.35, j.sqMean - 0.35]} tex="\bar x^{\,2}" color={C.blue} />
            <Point x={j.mean} y={0} color={C.ink} svgCircleProps={{ r: 4 }} />
            <LaTeX at={[j.mean, -0.45]} tex="\bar x" color={C.ink} />
          </>
        ) : null}
        {xs.map((x, i) => (
          <g key={i}>
            <MovablePoint point={[x, f(x)]} onMove={([v]) => setX(i, v)} constrain={([v]) => [clampX(v), f(clampX(v))]} color={ws[i] > 0 ? C.ink : C.faint} />
            <LaTeX at={[x - 0.3, f(x) + 0.35]} tex={`x_${i + 1}`} color={C.ink} />
          </g>
        ))}
      </Plane>
    </Stage>
  );
}
