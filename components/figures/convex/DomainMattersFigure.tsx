"use client";

import { LaTeX, Line, Plot, Point, Polygon, Vector } from "mafs";
import { useState } from "react";
import { Action, C, Plane, Readout, Segmented, Slider, Stage, Tex } from "@/components/kit";
import { cubicSaddleLevel } from "@/lib/convex/levels";
import { cubicSaddle, cubicSaddleHess, definiteness, eig2, texNum, type V2 } from "@/lib/convex/models";

// CF-09. Why does the same formula give a global optimum on one domain and not on another?

type Dom = "all" | "half";
const X: V2 = [-3.2, 3.2];
const Y: V2 = [-2.4, 2.4];
const LEVELS = [-2.5, -2, -1, 0, 1, 2, 3.5];
const EPS = 1e-3; // left edge for drawing on the open half-plane; x1 = 0 itself is excluded
const START: V2 = [1.5, 0.8];

export function DomainMattersFigure() {
  const [dom, setDom] = useState<Dom>("half");
  const [p, setP] = useState<V2>(START);
  const lo = dom === "half" ? EPS : X[0];
  const probe: V2 = [dom === "half" ? Math.max(0.05, p[0]) : p[0], p[1]];
  const fp = cubicSaddle(probe);
  const H = cubicSaddleHess(probe);
  const cls = definiteness(eig2(H));
  const g: V2 = [3 * probe[0] ** 2 - 3, 2 * probe[1]];

  return (
    <Stage
      hint="move the probe with the sliders"
      controls={
        <>
          <Segmented
            label="Domain"
            value={dom}
            onChange={setDom}
            options={[
              { value: "half", tex: "x_1 > 0" },
              { value: "all", tex: "\\mathbb R^2" },
            ]}
          />
          <Slider tex="p_1" value={probe[0]} min={dom === "half" ? 0.05 : -2.8} max={2.8} step={0.05} onChange={(v) => setP([v, p[1]])} show={texNum(probe[0], 2)} />
          <Slider tex="p_2" value={p[1]} min={-2} max={2} step={0.05} onChange={(v) => setP([p[0], v])} show={texNum(p[1], 2)} />
          <Action onClick={() => setP([1, 0])}>
            Probe at <Tex tex="(1,0)" />
          </Action>
          {dom === "all" ? (
            <Action onClick={() => setP([-1, 0])}>
              Probe at <Tex tex="(-1,0)" />
            </Action>
          ) : null}
          <Action onClick={() => (setDom("half"), setP(START))}>Reset</Action>
        </>
      }
      readout={
        <>
          <Readout
            tex={`f(p) = ${texNum(fp, 3)},\\quad \\nabla f(p) = (${texNum(g[0], 3)},\\ ${texNum(g[1], 3)}),\\quad H(p) = \\begin{pmatrix}${texNum(H[0][0], 2)} & 0\\\\ 0 & 2\\end{pmatrix}`}
            items={[
              { label: "H(p)", tex: `\\text{${cls}}` },
              { label: "f(1,0)", tex: "-2", tone: "teal" },
              ...(dom === "all" ? [{ label: "f(-3,0)", tex: "-18" }] : []),
            ]}
          />
        </>
      }
      caption={
        <>
          <strong>Why does the same formula give a global optimum on one domain and not on another?</strong> Level curves of{" "}
          <Tex tex="f(x)=x_1^3-3x_1+x_2^2" /> are drawn exactly. On the open half-plane <Tex tex="x_1>0" /> (the dashed wall <Tex tex="x_1=0" /> is not part of it) the
          Hessian <Tex tex="\operatorname{diag}(6x_1,2)" /> is positive definite and <Tex tex="(1,0)" /> is the unique global minimizer. On all of{" "}
          <Tex tex="\mathbb R^2" /> the same point is only a local minimum: the function continues to fall without bound to the left, beyond any window. Red marks a level below <Tex tex="f(1,0)=-2" />.
          The lowest point visible in the window is not a minimizer.
        </>
      }
    >
      <Plane x={X} y={Y} height={380} stretch>
        {dom === "half" ? (
          <>
            <Polygon
              points={[
                [X[0] - 1, Y[0] - 1],
                [0, Y[0] - 1],
                [0, Y[1] + 1],
                [X[0] - 1, Y[1] + 1],
              ]}
              color={C.faint}
              fillOpacity={0.12}
              strokeOpacity={0}
            />
            <Line.Segment point1={[0, Y[0] - 1]} point2={[0, Y[1] + 1]} color={C.ink} weight={2} style="dashed" />
            <LaTeX at={[-1.5, 1.8]} tex="\text{outside the domain}" color={C.muted} />
            <LaTeX at={[-0.95, -2.05]} tex="x_1 = 0\ \text{excluded}" color={C.muted} />
          </>
        ) : null}
        {LEVELS.flatMap((c) =>
          cubicSaddleLevel(c, lo, X[1] + 0.3).map((piece, i) => (
            <Plot.Parametric key={`${c}-${i}`} t={piece.domain} xy={piece.xy} color={c < -2 ? C.red : C.blue} weight={1.8} opacity={0.35 + (0.6 * (3.5 - c)) / 6} />
          )),
        )}
        {dom === "all" ? (
          <>
            <Vector tail={[-1.9, 0]} tip={[-2.85, 0]} color={C.red} weight={3} />
            <LaTeX at={[-2.3, 0.4]} tex="f\to-\infty" color={C.red} />
            <Point x={-1} y={0} color={C.red} svgCircleProps={{ r: 6 }} />
            <LaTeX at={[-1, -0.45]} tex="\text{saddle}" color={C.red} />
          </>
        ) : null}
        <Point x={1} y={0} color={C.teal} svgCircleProps={{ r: 7 }} />
        <LaTeX at={[1.1, 0.62]} tex={dom === "half" ? "\\text{unique global min}" : "\\text{local, not global}"} color={C.teal} />
        <Point x={probe[0]} y={probe[1]} color={C.ink} svgCircleProps={{ r: 5 }} />
        <LaTeX at={[probe[0] + 0.25, probe[1] + 0.3]} tex="p" color={C.ink} />
      </Plane>
    </Stage>
  );
}
