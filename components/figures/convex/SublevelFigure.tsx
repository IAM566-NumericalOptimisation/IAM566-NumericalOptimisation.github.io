"use client";

import { Circle, LaTeX, Line, MovablePoint, Plot, Point, Polygon } from "mafs";
import { useState } from "react";
import { Action, C, Plane, Readout, Segmented, Slider, Stage, Tex } from "@/components/kit";
import { FN1, chord, ring, sublevel, texNum, type V2 } from "@/lib/convex/models";

// CF-05. How does the accepted input set change as the threshold rises?

type Id = "bowl" | "ring" | "diamond" | "sqrtabs";

const FN: Record<Id, { tex: string; f: (p: V2) => number; profile: (r: number) => number}> = {
  bowl: { tex: "x_1^2+x_2^2", f: ([x, y]) => x * x + y * y, profile: (r) => r * r },
  ring: { tex: "(x_1^2+x_2^2-1)^2", f: ring, profile: (r) => (r * r - 1) ** 2 },
  diamond: { tex: "|x_1|+|x_2|", f: ([x, y]) => Math.abs(x) + Math.abs(y), profile: (r) => Math.abs(r) },
  sqrtabs: { tex: "\\sqrt{|x|}", f: ([x]) => Math.sqrt(Math.abs(x)), profile: (r) => Math.sqrt(Math.abs(r)) },
};

const START: Record<Id, { alpha: number; p: V2; q: V2 }> = {
  bowl: { alpha: 1, p: [-0.6, -0.4], q: [0.5, 0.6] },
  ring: { alpha: 0.25, p: [1, 0], q: [-1, 0] },
  diamond: { alpha: 1, p: [-0.5, 0.3], q: [0.6, -0.2] },
  sqrtabs: { alpha: 1, p: [0, 0], q: [4, 0] },
};

const ALPHA_MAX = 2.5;
const EXT = 2.2;
const snap = (v: number) => Math.round(v * 20) / 20;
const near2 = (a: V2, b: V2) => Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;

/** Is the segment p–q inside {f ≤ α}? Checked at finitely many points only: an observation, not a proof. */
function sampledSegment(f: (p: V2) => number, alpha: number, p: V2, q: V2, n = 200) {
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const z: V2 = [(1 - t) * p[0] + t * q[0], (1 - t) * p[1] + t * q[1]];
    if (f(z) > alpha + 1e-12) return { inside: false, at: z as V2 | null };
  }
  return { inside: true, at: null as V2 | null };
}

const diamondPts = (r: number): V2[] => [
  [r, 0],
  [0, r],
  [-r, 0],
  [0, -r],
];

export function SublevelFigure() {
  const [id, setId] = useState<Id>("ring");
  const [alpha, setAlpha] = useState(START.ring.alpha);
  const [pts, setPts] = useState<{ p: V2; q: V2 }>({ p: START.ring.p, q: START.ring.q });
  const [showSub, setShowSub] = useState(true);
  const [showLevel, setShowLevel] = useState(true);
  const fn = FN[id];
  const S = sublevel(id, alpha);
  const oneD = id === "sqrtabs";

  const choose = (next: Id) => {
    setId(next);
    setAlpha(START[next].alpha);
    setPts({ p: START[next].p, q: START[next].q });
  };
  const reset = () => {
    choose("ring");
    setShowSub(true);
    setShowLevel(true);
  };

  // exact description of C_alpha
  const a = texNum(alpha);
  let setTex = "";
  switch (S.kind) {
    case "empty":
      setTex = `C_{${a}}=\\varnothing`;
      break;
    case "point":
      setTex = `C_{0}=\\{(0,0)\\}`;
      break;
    case "disk":
      setTex =
        id === "ring"
          ? `C_{${a}}=\\{\\|x\\|^2\\le 1+\\sqrt\\alpha\\},\\ r=\\sqrt{${texNum(1 + Math.sqrt(alpha))}}\\ \\text{(hole closed)}`
          : `C_{${a}}=\\{\\|x\\|_2\\le\\sqrt\\alpha\\},\\ r=${texNum(S.r)}`;
      break;
    case "circle":
      setTex = `C_{0}=\\{\\|x\\|_2=1\\}`;
      break;
    case "annulus":
      setTex = `C_{${a}}=\\{${texNum(1 - Math.sqrt(alpha))}\\le\\|x\\|^2\\le${texNum(1 + Math.sqrt(alpha))}\\},\\ r_{\\rm in}=\\sqrt{${texNum(1 - Math.sqrt(alpha))}},\\ r_{\\rm out}=\\sqrt{${texNum(1 + Math.sqrt(alpha))}}`;
      break;
    case "diamond":
      setTex = `C_{${a}}=\\{|x_1|+|x_2|\\le ${a}\\}`;
      break;
    case "interval":
      setTex = `C_{${a}}=[-\\alpha^2,\\alpha^2]=[${texNum(S.lo)},\\ ${texNum(S.hi)}]`;
      break;
  }

  const check = oneD ? null : sampledSegment(fn.f, alpha, pts.p, pts.q);
  const ringWitness = id === "ring" && ((near2(pts.p, [1, 0]) && near2(pts.q, [-1, 0])) || (near2(pts.p, [-1, 0]) && near2(pts.q, [1, 0])));
  const mid: V2 = [(pts.p[0] + pts.q[0]) / 2, (pts.p[1] + pts.q[1]) / 2];
  const pIn = fn.f(pts.p) <= alpha + 1e-12;
  const qIn = fn.f(pts.q) <= alpha + 1e-12;
  const segBad = !!check && pIn && qIn && !check.inside;
  const ch = chord(FN1.sqrtabs.f, 0, 4, 0.5);
  const fill = C.teal;

  const set2D = (
    <Plane x={[-EXT, EXT]} y={[-1.7, 1.7]} height={340}>
      {showSub && S.kind === "disk" ? <Circle center={[0, 0]} radius={S.r} color={fill} fillOpacity={0.22} strokeOpacity={0} /> : null}
      {showSub && S.kind === "annulus" ? (
        <>
          <Circle center={[0, 0]} radius={S.rout} color={fill} fillOpacity={0.22} strokeOpacity={0} />
          <Circle center={[0, 0]} radius={S.rin} color="var(--surface)" fillOpacity={1} strokeOpacity={0} />
        </>
      ) : null}
      {showSub && S.kind === "diamond" ? <Polygon points={diamondPts(S.r)} color={fill} fillOpacity={0.22} strokeOpacity={0} /> : null}
      {showSub && (S.kind === "point" || S.kind === "circle") ? (
        S.kind === "point" ? <Point x={0} y={0} color={fill} /> : <Circle center={[0, 0]} radius={1} color={fill} fillOpacity={0} weight={6} strokeOpacity={0.5} />
      ) : null}
      {/* level set {f = α}: boundary curves, plus the origin for the ring at α = 1 */}
      {showLevel && S.kind === "disk" ? <Circle center={[0, 0]} radius={S.r} color={C.blue} fillOpacity={0} weight={2.5} /> : null}
      {showLevel && S.kind === "circle" ? <Circle center={[0, 0]} radius={1} color={C.blue} fillOpacity={0} weight={2.5} /> : null}
      {showLevel && S.kind === "annulus" ? (
        <>
          <Circle center={[0, 0]} radius={S.rout} color={C.blue} fillOpacity={0} weight={2.5} />
          <Circle center={[0, 0]} radius={S.rin} color={C.blue} fillOpacity={0} weight={2.5} />
        </>
      ) : null}
      {showLevel && S.kind === "diamond" ? <Polygon points={diamondPts(S.r)} color={C.blue} fillOpacity={0} weight={2.5} /> : null}
      {showLevel && (S.kind === "point" || (id === "ring" && alpha === 1)) ? <Point x={0} y={0} color={C.blue} svgCircleProps={{ r: 4 }} /> : null}
      {S.kind === "empty" ? <LaTeX at={[0, 1.3]} tex="C_\alpha=\varnothing" color={C.faint} /> : null}

      <Line.Segment point1={pts.p} point2={pts.q} color={segBad || (ringWitness && alpha < 1) ? C.red : C.copper} weight={2.5} style="dashed" />
      <Point x={mid[0]} y={mid[1]} color={segBad || (ringWitness && alpha < 1) ? C.red : C.copper} svgCircleProps={{ r: 4.5 }} />
      {segBad && check?.at ? <LaTeX at={check.at} tex="\times" color={C.red} /> : null}
      <MovablePoint point={pts.p} onMove={([x, y]) => setPts((s) => ({ ...s, p: [snap(x), snap(y)] }))} color={C.ink} />
      <MovablePoint point={pts.q} onMove={([x, y]) => setPts((s) => ({ ...s, q: [snap(x), snap(y)] }))} color={C.ink} />
      <LaTeX at={[pts.p[0] + 0.14, pts.p[1] + 0.24]} tex="p" color={C.ink} />
      <LaTeX at={[pts.q[0] - 0.14, pts.q[1] + 0.24]} tex="q" color={C.ink} />
    </Plane>
  );

  // the graph along x2 = 0 (or of √|x| itself) against the threshold
  const xr: V2 = oneD ? [-5, 5.6] : [-EXT, EXT];
  const slice = (
    <Plane x={xr} y={oneD ? [-0.5, 2.8] : [-0.4, ALPHA_MAX + 0.3]} height={oneD ? 340 : 340} stretch>
      <Plot.OfX y={fn.profile} color={C.blue} weight={3} />
      <Line.Segment point1={[xr[0], alpha]} point2={[xr[1], alpha]} color={C.faint} weight={1.5} style="dashed" />
      <LaTeX at={[xr[0] + (xr[1] - xr[0]) * 0.07, alpha + 0.18]} tex="\alpha" color={C.muted} />
      {S.kind === "disk" || S.kind === "diamond" ? <Line.Segment point1={[-S.r, 0]} point2={[S.r, 0]} color={fill} weight={6} opacity={0.6} /> : null}
      {S.kind === "interval" ? <Line.Segment point1={[S.lo, 0]} point2={[S.hi, 0]} color={fill} weight={6} opacity={0.6} /> : null}
      {S.kind === "annulus" ? (
        <>
          <Line.Segment point1={[-S.rout, 0]} point2={[-S.rin, 0]} color={fill} weight={6} opacity={0.6} />
          <Line.Segment point1={[S.rin, 0]} point2={[S.rout, 0]} color={fill} weight={6} opacity={0.6} />
        </>
      ) : null}
      {S.kind === "point" ? <Point x={0} y={0} color={fill} /> : null}
      {S.kind === "circle" ? (
        <>
          <Point x={-1} y={0} color={fill} />
          <Point x={1} y={0} color={fill} />
        </>
      ) : null}
      {!oneD ? <LaTeX at={[EXT * 0.62, ALPHA_MAX]} tex={"f(x_1,0)"} color={C.blue} /> : null}
      {oneD ? (
        <>
          <Line.Segment point1={[0, 0]} point2={[4, 2]} color={C.copper} weight={2.5} style="dashed" />
          <Line.Segment point1={[2, ch.ell]} point2={[2, ch.fz]} color={C.red} weight={4} />
          <Point x={2} y={ch.fz} color={C.blue} />
          <Point x={2} y={ch.ell} color={C.copper} />
          <Point x={0} y={0} color={C.ink} svgCircleProps={{ r: 4 }} />
          <Point x={4} y={2} color={C.ink} svgCircleProps={{ r: 4 }} />
          <LaTeX at={[1.1, 1.75]} tex="f(2)=\sqrt2" color={C.blue} />
          <LaTeX at={[2.6, 0.75]} tex="\ell=1" color={C.copper} />
        </>
      ) : null}
    </Plane>
  );

  return (
    <Stage
      hint={oneD ? "slide α" : "slide α; drag p and q"}
      controls={
        <>
          <Segmented
            label="Function"
            value={id}
            onChange={choose}
            options={[
              { value: "bowl", tex: "\\|x\\|_2^2" },
              { value: "ring", tex: "(\\|x\\|_2^2-1)^2" },
              { value: "diamond", tex: "\\|x\\|_1" },
              { value: "sqrtabs", tex: "\\sqrt{|x|}" },
            ]}
          />
          <Slider tex="\alpha" value={alpha} min={-0.5} max={ALPHA_MAX} step={0.01} onChange={setAlpha} show={texNum(alpha, 2)} />
          <Action onClick={() => setAlpha(-0.25)} pressed={alpha < 0}>
            <Tex tex="\alpha<0" />
          </Action>
          <Action onClick={() => setAlpha(0)} pressed={alpha === 0}>
            <Tex tex="\alpha=0" />
          </Action>
          {id === "ring" ? (
            <Action onClick={() => setAlpha(0.25)} pressed={alpha === 0.25}>
              <Tex tex="\alpha=\tfrac14" />
            </Action>
          ) : null}
          <Action onClick={() => setAlpha(1)} pressed={alpha === 1}>
            <Tex tex="\alpha=1" />
          </Action>
          {!oneD ? (
            <>
              <Action onClick={() => setShowSub((v) => !v)} pressed={showSub}>
                Sublevel <Tex tex="f\le\alpha" />
              </Action>
              <Action onClick={() => setShowLevel((v) => !v)} pressed={showLevel}>
                Level <Tex tex="f=\alpha" />
              </Action>
            </>
          ) : null}
          {id === "ring" ? (
            <Action onClick={() => setPts({ p: [1, 0], q: [-1, 0] })}>
              Witness <Tex tex="(\pm1,0)" />
            </Action>
          ) : null}
          <Action onClick={reset}>Reset</Action>
          {!oneD ? (
            <>
              <Slider tex="p_1" value={pts.p[0]} min={-EXT} max={EXT} step={0.05} onChange={(v) => setPts((s) => ({ ...s, p: [v, s.p[1]] }))} show={texNum(pts.p[0], 2)} />
              <Slider tex="p_2" value={pts.p[1]} min={-1.6} max={1.6} step={0.05} onChange={(v) => setPts((s) => ({ ...s, p: [s.p[0], v] }))} show={texNum(pts.p[1], 2)} />
              <Slider tex="q_1" value={pts.q[0]} min={-EXT} max={EXT} step={0.05} onChange={(v) => setPts((s) => ({ ...s, q: [v, s.q[1]] }))} show={texNum(pts.q[0], 2)} />
              <Slider tex="q_2" value={pts.q[1]} min={-1.6} max={1.6} step={0.05} onChange={(v) => setPts((s) => ({ ...s, q: [s.q[0], v] }))} show={texNum(pts.q[1], 2)} />
            </>
          ) : null}
        </>
      }
      readout={
        <>
          <Readout
            tex={`f(x)=${fn.tex},\\qquad ${setTex}`}
            items={
              oneD
                ? [
                    { label: "sublevel set", tex: alpha < 0 ? "\\varnothing" : "\\text{an interval}", tone: "teal" },
                    { label: "chord 0–4 at 2", tex: `f(2)=\\sqrt2>1=\\ell`, tone: "copper" },
                  ]
                : [
                    { label: "f(p)", tex: `${texNum(fn.f(pts.p))}\\ ${pIn ? "\\le" : ">"}\\ \\alpha`, tone: pIn ? "teal" : undefined },
                    { label: "f(q)", tex: `${texNum(fn.f(pts.q))}\\ ${qIn ? "\\le" : ">"}\\ \\alpha`, tone: qIn ? "teal" : undefined },
                    { label: "f(midpoint)", tex: texNum(fn.f(mid)), tone: "copper" },
                  ]
            }
          />
        </>
      }
      caption={
        <>
          <strong>How does the accepted input set change as the threshold rises?</strong> Teal is the sublevel set <Tex tex="C_\alpha=\{f\le\alpha\}" />, blue the level
          set <Tex tex="\{f=\alpha\}" />, and the {oneD ? "plot" : "slice panel"} shows the same threshold against the graph{oneD ? "" : " along the slice "}
          {oneD ? null : <Tex tex="x_2=0" />}. For the ring the set is empty, then the unit circle, then an annulus; at <Tex tex="\alpha=1" /> the hole closes and the
          origin joins. Convex functions have convex sublevel sets, but <Tex tex="\sqrt{|x|}" /> shows the converse fails: every <Tex tex="C_\alpha" /> is an
          interval, while its chord from <Tex tex="0" /> to <Tex tex="4" /> runs below the graph.
        </>
      }
    >
      {oneD ? (
        slice
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap" }}>
          <div style={{ flex: "1.4 1 320px", minWidth: 0 }}>{set2D}</div>
          <div style={{ flex: "1 1 240px", minWidth: 0, borderLeft: "1px solid var(--line)" }}>{slice}</div>
        </div>
      )}
    </Stage>
  );
}
