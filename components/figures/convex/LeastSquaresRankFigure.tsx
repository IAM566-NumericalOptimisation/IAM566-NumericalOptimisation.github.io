"use client";

import { Circle, LaTeX, Line, MovablePoint, Plot, Point, Vector } from "mafs";
import { useState } from "react";
import { Action, C, Plane, Readout, Segmented, Slider, Stage, Tex } from "@/components/kit";
import { quadLevel } from "@/lib/convex/levels";
import { LINE_T, RANK1, eig2, lineA, lstsq2, rank1, texNum, type M2, type V2 } from "@/lib/convex/models";

// CF-10. How do different parameters give the same fit to the data?

type Mode = "rank1" | "full";
const B0 = [1, 2, 4];
const snap = (v: number, h = 0.25) => Math.round(v / h) * h;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const vec = (v: number[], d = 3) => `(${v.map((x) => texNum(x, d)).join(",\\ ")})`;
const pair = { display: "flex", flexWrap: "wrap" } as const;

export function LeastSquaresRankFigure() {
  const [mode, setMode] = useState<Mode>("rank1");
  const [s, setS] = useState(0);
  const [b, setB] = useState<number[]>(B0);

  const tabs = (
    <Segmented
      label="Example"
      value={mode}
      onChange={setMode}
      options={[
        { value: "rank1", text: "Rank one" },
        { value: "full", text: "Full column rank" },
      ]}
    />
  );

  if (mode === "rank1") {
    const r = rank1(RANK1.b, s);
    const pred = r.fit[0];
    const norm2 = r.x[0] ** 2 + r.x[1] ** 2;
    const rad = Math.hypot(...r.xd);
    // level lines of f = 7 + (3/2)(x1 + 2x2 - 3)^2
    const levels = [0.5, 2, 6.5].map((c) => Math.sqrt(c / 1.5));
    const toS = ([x1, x2]: V2) => clamp(snap(((x1 - r.xd[0]) * -2 + (x2 - r.xd[1]) * 1) / 5, 0.05), -1.2, 1.2);
    return (
      <Stage
        hint="slide s, or drag x along the teal line"
        controls={
          <>
            {tabs}
            <Slider tex="s" value={s} min={-1.2} max={1.2} step={0.05} onChange={setS} show={texNum(s, 2)} />
            <Action onClick={() => setS(0)}>
              Minimum norm, <Tex tex="s=0" />
            </Action>
            <Action onClick={() => (setMode("rank1"), setS(0), setB(B0))}>Reset</Action>
          </>
        }
        readout={
          <>
            <Readout
              tex={`x = x^\\dagger + s(-2,1) = ${vec(r.x)},\\quad Ax = ${vec(r.fit)},\\quad b - Ax = ${vec(r.res)},\\quad \\tfrac12\\|Ax-b\\|^2 = ${texNum(r.f)}`}
              items={[
                { label: "‖x‖²", tex: `\\tfrac95 + 5s^2 = ${texNum(norm2)}`, tone: "copper" },
                { label: "rank A", tex: "1" },
                { label: "singular values", tex: "\\sqrt{15},\\ 0" },
                { label: "eigenvalues of AᵀA", tex: "15,\\ 0" },
              ]}
            />
          </>
        }
        caption={
          <>
            <strong>How do different parameters give the same fit?</strong> Every row of <Tex tex="A" /> is <Tex tex="(1,2)" />, so the model predicts one constant{" "}
            <Tex tex="x_1+2x_2" /> for all three targets <Tex tex="b=(1,2,6)" /> (left: observations, not inputs on a line). The best constant is their mean, 3.
            On the right, the level sets of the objective are parallel lines and the optimal set is the teal line <Tex tex="x_1+2x_2=3" />. Moving along the null
            direction <Tex tex="(-2,1)" /> changes the parameters and their norm, but not <Tex tex="Ax" />, the residual or the objective. The pseudoinverse picks{" "}
            <Tex tex="x^\dagger" />, the foot of the perpendicular from the origin.
          </>
        }
      >
        <div style={pair}>
          <div style={{ flex: "2 1 240px", minWidth: 0 }}>
            <Plane x={[0.3, 3.7]} y={[-0.6, 7]} height={340} stretch grid={false}>
              <Line.Segment point1={[0.3, 0]} point2={[3.7, 0]} color={C.faint} weight={1} />
              <Line.Segment point1={[0.4, pred]} point2={[3.6, pred]} color={C.blue} weight={2.5} />
              <LaTeX at={[3.35, pred + 0.45]} tex="Ax" color={C.blue} />
              {RANK1.b.map((bi, i) => (
                <g key={i}>
                  <Line.Segment point1={[i + 1, pred]} point2={[i + 1, bi]} color={C.copper} weight={3} />
                  <Point x={i + 1} y={bi} color={C.ink} />
                  <LaTeX at={[i + 1 + 0.36, (pred + bi) / 2]} tex={`r_${i + 1}=${texNum(r.res[i])}`} color={C.copper} />
                  <LaTeX at={[i + 1, -0.35]} tex={`i=${i + 1}`} color={C.muted} />
                </g>
              ))}
            </Plane>
          </div>
          <div style={{ flex: "3 1 300px", minWidth: 0, borderLeft: "1px solid var(--line)" }}>
            <Plane x={[-3.4, 4.4]} y={[-1.2, 3]} height={340}>
              {levels.flatMap((k) =>
                [k, -k].map((sg) => <Line.ThroughPoints key={`${k}${sg}`} point1={[3 + sg, 0]} point2={[1 + sg, 1]} color={C.blue} weight={1} style="dashed" opacity={0.45} />),
              )}
              <Line.ThroughPoints point1={[3, 0]} point2={[1, 1]} color={C.teal} weight={3.5} />
              <LaTeX at={[-2.3, 2.95 - 0.3]} tex="X^*" color={C.teal} />
              <Circle center={[0, 0]} radius={rad} color={C.faint} fillOpacity={0} strokeStyle="dashed" />
              <Line.Segment point1={[0, 0]} point2={r.xd} color={C.faint} weight={1.5} style="dashed" />
              <Point x={0} y={0} color={C.faint} />
              <Point x={r.xd[0]} y={r.xd[1]} color={C.teal} svgCircleProps={{ r: 5 }} />
              <LaTeX at={[r.xd[0] + 0.15, r.xd[1] - 0.45]} tex="x^\dagger" color={C.teal} />
              {Math.abs(s) > 1e-9 ? <Vector tail={r.xd} tip={r.x} color={C.copper} weight={2.5} /> : null}
              <MovablePoint
                point={r.x}
                onMove={(pt) => setS(toS(pt as V2))}
                constrain={(pt) => {
                  const t = toS(pt as V2);
                  return [r.xd[0] - 2 * t, r.xd[1] + t];
                }}
                color={C.ink}
              />
              <LaTeX at={[r.x[0] - 0.1, r.x[1] + 0.45]} tex="x" color={C.ink} />
            </Plane>
          </div>
        </div>
      </Stage>
    );
  }

  const A = lineA();
  const r = lstsq2(A, b);
  const M: M2 = [
    [3, 3],
    [3, 5],
  ];
  const [m1, m2] = eig2(M);
  const th = 0.5 * Math.atan2(2 * M[0][1], M[0][0] - M[1][1]);
  const win = { x: [r.x[0] - 2.4, r.x[0] + 2.4] as V2, y: [r.x[1] - 1.5, r.x[1] + 1.5] as V2 };
  const setBi = (i: number, v: number) => setB((old) => old.map((x, j) => (j === i ? clamp(snap(v), -1, 5) : x)));

  return (
    <Stage
      hint="drag the data points, or use the sliders"
      controls={
        <>
          {tabs}
          {b.map((bi, i) => (
            <Slider key={i} tex={`y_${i + 1}`} value={bi} min={-1} max={5} step={0.25} onChange={(v) => setBi(i, v)} show={texNum(bi, 2)} />
          ))}
          <Action onClick={() => setB(B0)}>
            The chapter&apos;s data <Tex tex="(1,2,4)" />
          </Action>
          <Action onClick={() => (setMode("full"), setB(B0))}>Reset</Action>
        </>
      }
      readout={
        <>
          <Readout
            tex={`x^* = ${vec(r.x)},\\quad \\widehat y(t) = ${texNum(r.x[0])} ${r.x[1] < 0 ? "-" : "+"} ${texNum(Math.abs(r.x[1]))}\\,t,\\quad b - Ax^* = ${vec(r.res)},\\quad f^* = ${texNum(r.f)}`}
            items={[
              { label: "rank A", tex: "2" },
              { label: "eigenvalues of AᵀA", tex: `4\\pm\\sqrt{10} \\approx ${texNum(m1, 3)},\\ ${texNum(m2, 3)}` },
              { label: "singular values", tex: `${texNum(Math.sqrt(m1), 3)},\\ ${texNum(Math.sqrt(m2), 3)}` },
              { label: "solver", tex: "\\text{QR (Gram–Schmidt)}" },
            ]}
          />
        </>
      }
      caption={
        <>
          <strong>When is the best-fitting parameter unique?</strong> Here the inputs are <Tex tex="t=0,1,2" /> and the model is the line{" "}
          <Tex tex="y=x_1+x_2t" />. Left: the data, the fitted line (blue) and the residuals <Tex tex="r=b-Ax^*" /> (copper). Right: the same state in parameter space,
          where the objective has elliptical level sets <Tex tex="f^*+\tfrac12(x-x^*)^TA^TA(x-x^*)" /> around a single point. The derivation uses the normal equations{" "}
          <Tex tex="A^TAx=A^Tb" />; the figure computes with a QR factorization. With the chapter&apos;s data, <Tex tex="x^*=(5/6,3/2)" /> and{" "}
          <Tex tex="f^*=1/12" />.
        </>
      }
    >
      <div style={pair}>
        <div style={{ flex: "3 1 300px", minWidth: 0 }}>
          <Plane x={[-0.6, 2.6]} y={[-1.5, 5.5]} height={340} stretch>
            <Plot.OfX y={(t) => r.x[0] + r.x[1] * t} color={C.blue} weight={2.5} />
            {LINE_T.map((t, i) => (
              <g key={i}>
                <Line.Segment point1={[t, r.fit[i]]} point2={[t, b[i]]} color={C.copper} weight={3} />
                <LaTeX at={[t + 0.22, (r.fit[i] + b[i]) / 2]} tex={`r_${i + 1}`} color={C.copper} />
                <MovablePoint point={[t, b[i]]} onMove={([, y]) => setBi(i, y)} constrain={([, y]) => [t, clamp(snap(y), -1, 5)]} color={C.ink} />
              </g>
            ))}
            <LaTeX at={[2.3, r.x[0] + r.x[1] * 2.3 + 0.5]} tex="\widehat y" color={C.blue} />
          </Plane>
        </div>
        <div style={{ flex: "2 1 240px", minWidth: 0, borderLeft: "1px solid var(--line)" }}>
          <Plane x={win.x} y={win.y} height={340}>
            {[0.1, 0.5, 1.2].flatMap((c) =>
              quadLevel(m1, m2, th, c, 4).map((pc, i) => (
                <Plot.Parametric key={`${c}-${i}`} t={pc.domain} xy={(u) => {
                  const [a, bb] = pc.xy(u);
                  return [a + r.x[0], bb + r.x[1]];
                }} color={C.blue} weight={1.5} opacity={0.6} />
              )),
            )}
            <Point x={r.x[0]} y={r.x[1]} color={C.teal} svgCircleProps={{ r: 6 }} />
            <LaTeX at={[r.x[0] + 0.35, r.x[1] + 0.3]} tex="x^*" color={C.teal} />
            <LaTeX at={[win.x[0] + 0.5, win.y[0] + 0.25]} tex="x_1" color={C.muted} />
            <LaTeX at={[win.x[0] + 0.25, win.y[1] - 0.3]} tex="x_2" color={C.muted} />
          </Plane>
        </div>
      </div>
    </Stage>
  );
}
