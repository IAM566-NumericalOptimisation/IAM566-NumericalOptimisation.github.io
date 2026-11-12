"use client";

import { Ellipse, LaTeX, Line, Point, Polygon } from "mafs";
import { useState } from "react";
import { Action, C, Plane, Readout, Segmented, Slider, Stage, Tex } from "@/components/kit";
import { OPT2, texNum, type V2 } from "@/lib/convex/models";

// CF-03. If the minimum is not a single point, what kind of set can it be?

type Id = "valley" | "diag" | "bowl" | "family";

const LEVELS = [0.25, 1, 2.25];
const DIAG_LEVELS = [0.04, 0.16, 0.36, 0.64];
const START = { p: -1, q: 1.2, t: 0.5, mu: 0.25 };
const DIAG_START = { p: 0.15, q: 0.8 };

/** The part of the line x1 + x2 = k inside the unit square, or null. */
function diagSegment(k: number): [V2, V2] | null {
  const lo = Math.max(0, k - 1);
  const hi = Math.min(1, k);
  if (lo > hi) return null;
  return [
    [lo, k - lo],
    [hi, k - hi],
  ];
}

export function OptimalSetFigure() {
  const [id, setId] = useState<Id>("valley");
  const [st, setSt] = useState(START);
  const set = (p: Partial<typeof START>) => setSt((s) => ({ ...s, ...p }));
  const choose = (next: Id) => {
    setId(next);
    setSt(next === "diag" ? { ...START, ...DIAG_START } : START);
  };
  const { p, q, t, mu } = st;

  // which optimal set: the family with μ = 0 is the valley
  const flat = id === "valley" || (id === "family" && mu === 0);
  const kind: "line" | "segment" | "point" = id === "diag" ? "segment" : flat ? "line" : "point";
  const f: (x: V2) => number = id === "family" ? ([a, b]) => a * a + mu * b * b : OPT2[id].f;

  // two minimizers, parametrized along the optimal set
  const along = (s: number): V2 => (kind === "segment" ? [s, 1 - s] : [0, s]);
  const u = along(p);
  const v = along(q);
  const z: V2 = [(1 - t) * u[0] + t * v[0], (1 - t) * u[1] + t * v[1]];
  const fz = f(z);

  const box = id === "diag" ? { x: [-0.35, 1.35] as V2, y: [-0.25, 1.25] as V2 } : { x: [-3.2, 3.2] as V2, y: [-2.2, 2.2] as V2 };
  const pRange: V2 = kind === "segment" ? [0, 1] : [-2, 2];

  const contours =
    id === "diag" ? (
      <>
        <Polygon
          points={[
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
          ]}
          color={C.teal}
          fillOpacity={0.06}
          weight={1.5}
        />
        {DIAG_LEVELS.flatMap((c) => [1 - Math.sqrt(c), 1 + Math.sqrt(c)]).map((k) => {
          const seg = diagSegment(k);
          return seg ? <Line.Segment key={k} point1={seg[0]} point2={seg[1]} color={C.blue} weight={1.2} opacity={0.55} /> : null;
        })}
      </>
    ) : flat ? (
      LEVELS.flatMap((c) => [-Math.sqrt(c), Math.sqrt(c)]).map((x) => (
        <Line.Segment key={x} point1={[x, -3]} point2={[x, 3]} color={C.blue} weight={1.2} opacity={0.55} />
      ))
    ) : (
      LEVELS.map((c) => (
        <Ellipse key={c} center={[0, 0]} radius={[Math.sqrt(c), id === "family" ? Math.sqrt(c / mu) : Math.sqrt(c)]} color={C.blue} fillOpacity={0} weight={1.2} strokeOpacity={0.55} />
      ))
    );

  const optimal =
    kind === "segment" ? (
      <Line.Segment point1={[0, 1]} point2={[1, 0]} color={C.teal} weight={6} opacity={0.7} />
    ) : kind === "line" ? (
      <Line.Segment point1={[0, -3]} point2={[0, 3]} color={C.teal} weight={6} opacity={0.7} />
    ) : (
      <Point x={0} y={0} color={C.teal} svgCircleProps={{ r: 7 }} />
    );

  const setTex = kind === "segment" ? "X^*=\\{(s,1-s):0\\le s\\le1\\}" : kind === "line" ? "X^*=\\{(0,s):s\\in\\mathbb R\\}" : "X^*=\\{(0,0)\\}";
  const fTex = id === "family" ? `x_1^2+${texNum(mu, 2)}\\,x_2^2` : OPT2[id].tex;

  return (
    <Stage
      hint={kind === "point" ? "one minimizer only" : "choose two minimizers"}
      controls={
        <>
          <Segmented
            label="Function"
            value={id}
            onChange={choose}
            options={[
              { value: "valley", tex: "x_1^2" },
              { value: "diag", tex: "(x_1+x_2-1)^2" },
              { value: "bowl", tex: "x_1^2+x_2^2" },
              { value: "family", tex: "x_1^2+\\mu x_2^2" },
            ]}
          />
          {id === "family" ? <Slider tex="\mu" value={mu} min={0} max={2} step={0.01} onChange={(v) => set({ mu: v })} show={texNum(mu, 2)} /> : null}
          {kind !== "point" ? (
            <>
              <Slider tex={kind === "segment" ? "u = (p,1-p),\\ p" : "u = (0,p),\\ p"} value={p} min={pRange[0]} max={pRange[1]} step={0.05} onChange={(v) => set({ p: v })} show={texNum(p, 2)} />
              <Slider tex={kind === "segment" ? "v = (q,1-q),\\ q" : "v = (0,q),\\ q"} value={q} min={pRange[0]} max={pRange[1]} step={0.05} onChange={(v) => set({ q: v })} show={texNum(q, 2)} />
              <Slider tex="t" value={t} min={0} max={1} step={0.01} onChange={(v) => set({ t: v })} show={texNum(t, 2)} />
            </>
          ) : null}
          {id === "family" ? (
            <>
              <Action onClick={() => set({ mu: 0 })}>
                <Tex tex="\mu = 0" />
              </Action>
              <Action onClick={() => set({ mu: 0.02 })}>
                <Tex tex="\mu = 0.02" />
              </Action>
            </>
          ) : null}
          <Action
            onClick={() => {
              setId("valley");
              setSt(START);
            }}
          >
            Reset
          </Action>
        </>
      }
      readout={
        <>
          <Readout
            tex={
              kind === "point"
                ? `f(x)=${fTex},\\qquad f^*=0,\\qquad ${setTex}`
                : `f(z_t) = f\\big((1-t)u+tv\\big) = f(${texNum(z[0], 3)},\\,${texNum(z[1], 3)}) = ${texNum(fz, 6)} = f^*`
            }
            items={
              kind === "point"
                ? [{ label: "optimal set", tex: setTex, tone: "teal" }]
                : [
                    { label: "optimal set", tex: setTex, tone: "teal" },
                    { label: "f(u), f(v)", tex: `${texNum(f(u))},\\ ${texNum(f(v))}` },
                    { label: "z_t", tex: `(${texNum(z[0], 3)},\\,${texNum(z[1], 3)})` },
                  ]
            }
          />
        </>
      }
      caption={
        <>
          <strong>If the minimum is not a single point, what kind of set can it be?</strong> Blue curves are exact level sets, teal is the optimal set{" "}
          <Tex tex="X^*" />. For two minimizers <Tex tex="u,v" />, convexity gives <Tex tex="f(z_t)\le(1-t)f(u)+tf(v)=f^*" />, and nothing feasible is
          below <Tex tex="f^*" />, so the whole segment is optimal: a line for <Tex tex="x_1^2" />, a segment for <Tex tex="(x_1+x_2-1)^2" /> on the
          unit square, a single point for the strictly convex bowl. In the family <Tex tex="x_1^2+\mu x_2^2" /> only <Tex tex="\mu=0" /> gives a line;
          any <Tex tex="\mu>0" />, however small, gives the unique minimizer <Tex tex="(0,0)" />.
        </>
      }
    >
      <Plane x={box.x} y={box.y} height={360} grid={id !== "diag"}>
        {contours}
        {optimal}
        <LaTeX at={kind === "segment" ? [0.72, 0.5] : kind === "line" ? [0.45, 1.85] : [0.45, 0.35]} tex="X^*" color={C.teal} />
        {kind !== "point" ? (
          <>
            <Line.Segment point1={u} point2={v} color={C.copper} weight={3} />
            <Point x={u[0]} y={u[1]} color={C.ink} />
            <Point x={v[0]} y={v[1]} color={C.ink} />
            <Point x={z[0]} y={z[1]} color={C.copper} svgCircleProps={{ r: 6 }} />
            <LaTeX at={[u[0] - (kind === "segment" ? 0.09 : 0.3), u[1]]} tex="u" color={C.ink} />
            <LaTeX at={[v[0] - (kind === "segment" ? 0.09 : 0.3), v[1]]} tex="v" color={C.ink} />
            <LaTeX at={[z[0] + (kind === "segment" ? 0.1 : 0.35), z[1]]} tex="z_t" color={C.copper} />
          </>
        ) : null}
      </Plane>
    </Stage>
  );
}
