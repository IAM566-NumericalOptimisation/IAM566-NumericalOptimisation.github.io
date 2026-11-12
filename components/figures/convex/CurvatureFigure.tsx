"use client";

import { LaTeX, Line, Plot, Point, Vector } from "mafs";
import { useState } from "react";
import { Action, C, Plane, Readout, Segmented, Slider, Stage, Stepper, Tex } from "@/components/kit";
import { quadLevel } from "@/lib/convex/levels";
import { eig2, hessian, quadForm, signOf, texNum, type V2 } from "@/lib/convex/models";

// CF-08. What does a matrix say about curvature in every direction?

type Q = { l1: number; l2: number; th: number; phi: number };

const PRESETS: Record<string, Q & { label: string }> = {
  pd: { label: "PD bowl", l1: 1, l2: 2, th: 0, phi: 30 },
  psd: { label: "singular PSD", l1: 0, l2: 2, th: 0, phi: 0 },
  saddle: { label: "saddle", l1: -1, l2: 2, th: 0, phi: 0 },
  nd: { label: "negative definite", l1: -1, l2: -2, th: 0, phi: 30 },
  zero: { label: "zero", l1: 0, l2: 0, th: 0, phi: 30 },
  diag: { label: "[[2,3],[3,2]]", l1: 5, l2: -1, th: 45, phi: -45 },
};

const STEPS = [
  "Choose a unit direction d.",
  "Restrict f to the line: ψ(s) = f(x + s d), here with x = 0.",
  "First derivative: ψ′(s) = ∇f(x + s d)ᵀ d.",
  "Second derivative: ψ″(s) = dᵀ H d, the curvature along d.",
  "H ⪰ 0 means ψ″ ≥ 0 for every d: every line restriction is convex.",
];
const LAST = STEPS.length - 1;
const LEVELS = [0.25, 1, 2.25, 4];
const rad = (deg: number) => (deg * Math.PI) / 180;

type Strict = "sq" | "quart" | "exp";
const STRICT: Record<Strict, { tex: string; f: (x: number) => number; d2: (x: number) => number; d2tex: string; note: string; strong: string }> = {
  sq: { tex: "x^2", f: (x) => x * x, d2: () => 2, d2tex: "2", note: "f'' = 2 > 0 \\text{ everywhere}", strong: "strictly convex and 2-strongly convex" },
  quart: {
    tex: "x^4",
    f: (x) => x ** 4,
    d2: (x) => 12 * x * x,
    d2tex: "12x^2",
    note: "f''(0) = 0,\\ \\text{yet the tangent gap } (y-x)^2((y+x)^2+2x^2) > 0",
    strong: "strictly convex, not strongly convex",
  },
  exp: { tex: "e^x", f: Math.exp, d2: Math.exp, d2tex: "e^x", note: "f'' = e^x > 0 \\text{ everywhere, but } \\inf f'' = 0", strong: "strictly convex (PD everywhere), not strongly convex on ℝ" },
};


export function CurvatureFigure() {
  const [tab, setTab] = useState<"quad" | "strict">("quad");
  const [q, setQ] = useState<Q>(PRESETS.pd);
  const [step, setStep] = useState(LAST);
  const [sid, setSid] = useState<Strict>("quart");
  const [x0, setX0] = useState(0);
  const set = (patch: Partial<Q>) => setQ((s) => ({ ...s, ...patch }));

  const tabs = (
    <Segmented
      label="View"
      value={tab}
      onChange={setTab}
      options={[
        { value: "quad", text: "Quadratic family" },
        { value: "strict", text: "Strictness" },
      ]}
    />
  );

  if (tab === "strict") {
    const s = STRICT[sid];
    return (
      <Stage
        hint="slide x₀ to read the curvature"
        controls={
          <>
            {tabs}
            <Segmented
              label="Function"
              value={sid}
              onChange={setSid}
              options={[
                { value: "sq", tex: "x^2" },
                { value: "quart", tex: "x^4" },
                { value: "exp", tex: "e^x" },
              ]}
            />
            <Slider tex="x_0" value={x0} min={-1.5} max={1.5} step={0.05} onChange={setX0} show={texNum(x0, 2)} />
            <Action onClick={() => (setSid("quart"), setX0(0))}>Reset</Action>
          </>
        }
        readout={
          <>
            <Readout tex={`f = ${s.tex},\\quad f''(x) = ${s.d2tex},\\quad f''(${texNum(x0, 2)}) = ${texNum(s.d2(x0), 3)}`} items={[{ label: "analytic note", tex: s.note }]} />
          </>
        }
        caption={
          <>
            <strong>Is strict convexity the same as positive curvature at every point?</strong> The blue graph and the violet second derivative share one axis. For{" "}
            <Tex tex="x^4" /> the curvature vanishes at zero, yet every chord lies strictly above the graph. For <Tex tex="e^x" /> the curvature is positive everywhere
            but has no positive lower bound, so “PD everywhere” does not give strong convexity.
          </>
        }
      >
        <Plane x={[-2, 2]} y={[-1, 6]} height={340} stretch>
          <Plot.OfX y={s.f} color={C.blue} weight={3} />
          <Plot.OfX y={s.d2} color={C.violet} weight={2} svgPathProps={{ strokeDasharray: "8 4 2 4" }} />
          <Line.Segment point1={[x0, 0]} point2={[x0, Math.min(6, s.d2(x0))]} color={C.violet} weight={1} style="dashed" />
          <Point x={x0} y={s.f(x0)} color={C.blue} />
          {s.d2(x0) < 6 ? <Point x={x0} y={s.d2(x0)} color={C.violet} /> : null}
          <LaTeX at={[1.75, Math.min(5.5, s.f(1.75)) - 0.5]} tex="f" color={C.blue} />
          <LaTeX at={[-1.75, Math.min(5.3, s.d2(-1.75)) + 0.45]} tex="f''" color={C.violet} />
        </Plane>
      </Stage>
    );
  }

  const H = hessian(q.l1, q.l2, rad(q.th));
  const d: V2 = [Math.cos(rad(q.phi)), Math.sin(rad(q.phi))];
  const curv = quadForm(H, d);
  const ev = eig2(H);
  const sign = signOf(curv);
  const dColor = sign === "negative" ? C.red : sign === "zero" ? C.faint : C.teal;
  const e1: V2 = [Math.cos(rad(q.th)), Math.sin(rad(q.th))];
  const e2: V2 = [-e1[1], e1[0]];
  const preset = Object.keys(PRESETS).find((k) => PRESETS[k].l1 === q.l1 && PRESETS[k].l2 === q.l2 && PRESETS[k].th === q.th) ?? "";

  const matTex = `\\begin{pmatrix}${texNum(H[0][0], 2)} & ${texNum(H[0][1], 2)}\\\\ ${texNum(H[1][0], 2)} & ${texNum(H[1][1], 2)}\\end{pmatrix}`;
  const stepTex = [
    `d = (\\cos\\varphi, \\sin\\varphi) = (${texNum(d[0], 3)},\\ ${texNum(d[1], 3)})`,
    `\\psi(s) = f(s\\,d) = \\tfrac12 s^2\\, d^THd = ${texNum(curv / 2, 3)}\\,s^2`,
    `\\psi'(s) = \\nabla f(s\\,d)^T d = s\\, d^THd = ${texNum(curv, 3)}\\,s`,
    `\\psi''(s) = d^THd = ${texNum(curv, 3)}`,
    `H = ${matTex},\\quad d^THd = ${texNum(curv, 3)} ${sign === "negative" ? "< 0" : "\\ge 0"}`,
  ][step];

  const R = 4.6;
  return (
    <Stage
      hint="the arrow is d; the right panel is f along that line"
      controls={
        <>
          {tabs}
          <Segmented label="Preset" value={preset} onChange={(k) => setQ(PRESETS[k])} options={Object.entries(PRESETS).map(([k, p]) => ({ value: k, text: p.label }))} />
          <Slider tex="\lambda_1" value={q.l1} min={-3} max={5} step={0.25} onChange={(v) => set({ l1: v })} show={texNum(q.l1, 2)} />
          <Slider tex="\lambda_2" value={q.l2} min={-3} max={5} step={0.25} onChange={(v) => set({ l2: v })} show={texNum(q.l2, 2)} />
          <Slider tex="\theta" value={q.th} min={0} max={180} step={5} onChange={(v) => set({ th: v })} show={`${q.th}^\\circ`} />
          <Slider tex="\varphi" value={q.phi} min={-180} max={180} step={5} onChange={(v) => set({ phi: v })} show={`${q.phi}^\\circ`} />
          <Stepper steps={STEPS} step={step} onStep={setStep} />
          <Action onClick={() => (setQ(PRESETS.pd), setStep(LAST))}>Reset</Action>
        </>
      }
      readout={
        <>
          <Readout
            tex={stepTex}
            items={[
              { label: "H", tex: matTex },
              { label: "eigenvalues", tex: `${texNum(ev[0], 3)},\\ ${texNum(ev[1], 3)}` },
              { label: "curvature dᵀHd", tex: texNum(curv, 3), tone: sign === "positive" ? "teal" : undefined },
            ]}
          />
        </>
      }
      caption={
        <>
          <strong>What does a matrix say about curvature in every direction?</strong> For <Tex tex="f(x)=\tfrac12x^THx" /> with{" "}
          <Tex tex="H=R(\theta)\operatorname{diag}(\lambda_1,\lambda_2)R(\theta)^T" />, the left panel draws exact level curves (blue for positive levels, red for negative,
          grey for level zero) and the dashed eigen-axes. The right panel is the restriction <Tex tex="\psi(s)=f(sd)=\tfrac12 s^2\,d^THd" />: a parabola opening up, flat,
          or down according to the sign of the curvature along <Tex tex="d" />. The preset <Tex tex="\left(\begin{smallmatrix}2&3\\3&2\end{smallmatrix}\right)" /> has positive
          diagonal entries, yet <Tex tex="d=(1,-1)/\sqrt2" /> gives curvature <Tex tex="-1" />.
        </>
      }
    >
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <div style={{ flex: "3 1 300px", minWidth: 0 }}>
          <Plane x={[-3.2, 3.2]} y={[-3.2, 3.2]} height={360} grid={false}>
            <Line.Segment point1={[-R, 0]} point2={[R, 0]} color={C.faint} weight={1} opacity={0.5} />
            <Line.Segment point1={[0, -R]} point2={[0, R]} color={C.faint} weight={1} opacity={0.5} />
            <Line.Segment point1={[-R * e1[0], -R * e1[1]]} point2={[R * e1[0], R * e1[1]]} color={C.faint} weight={1} style="dashed" opacity={0.8} />
            <Line.Segment point1={[-R * e2[0], -R * e2[1]]} point2={[R * e2[0], R * e2[1]]} color={C.faint} weight={1} style="dashed" opacity={0.8} />
            {[...LEVELS, ...LEVELS.map((c) => -c), 0].flatMap((c) =>
              quadLevel(q.l1, q.l2, rad(q.th), c, 6).map((p, i) => (
                <Plot.Parametric
                  key={`${c}-${i}`}
                  t={p.domain}
                  xy={p.xy}
                  color={c > 0 ? C.blue : c < 0 ? C.red : C.faint}
                  weight={c === 0 ? 1.5 : 2}
                  opacity={c === 0 ? 0.9 : 0.35 + 0.15 * LEVELS.indexOf(Math.abs(c))}
                />
              )),
            )}
            {step >= 1 ? <Line.Segment point1={[-R * d[0], -R * d[1]]} point2={[R * d[0], R * d[1]]} color={dColor} weight={1.5} style="dashed" opacity={0.6} /> : null}
            <Vector tip={[2 * d[0], 2 * d[1]]} color={dColor} weight={3.5} />
            <LaTeX at={[2.4 * d[0] - 0.25 * d[1], 2.4 * d[1] + 0.25 * d[0]]} tex="d" color={dColor} />
            <LaTeX at={[2.3 * e1[0] - 0.3 * e1[1], 2.3 * e1[1] + 0.3 * e1[0]]} tex="\lambda_1" color={C.muted} />
            <LaTeX at={[2.3 * e2[0] - 0.3 * e2[1], 2.3 * e2[1] + 0.3 * e2[0]]} tex="\lambda_2" color={C.muted} />
            <Point x={0} y={0} color={C.ink} />
          </Plane>
        </div>
        <div style={{ flex: "2 1 220px", minWidth: 0, borderLeft: "1px solid var(--line)" }}>
          <Plane x={[-2.2, 2.2]} y={[-5, 5]} height={360} stretch grid={false}>
            <Line.Segment point1={[-2.2, 0]} point2={[2.2, 0]} color={C.faint} weight={1} />
            <Line.Segment point1={[0, -5]} point2={[0, 5]} color={C.faint} weight={1} />
            {step >= 1 ? <Plot.OfX y={(s) => 0.5 * curv * s * s} color={dColor} weight={3} /> : null}
            {step === 2 ? <Plot.OfX y={(s) => curv * s} color={C.violet} weight={1.5} svgPathProps={{ strokeDasharray: "8 4 2 4" }} /> : null}
            <LaTeX at={[-1.15, 4.3]} tex={step >= 1 ? "\\psi(s)=f(sd)" : "\\psi"} color={C.muted} />
            {step === 2 ? <LaTeX at={[1.3, -4.2]} tex="\psi'(s)" color={C.violet} /> : null}
            <LaTeX at={[2, -0.5]} tex="s" color={C.muted} />
          </Plane>
        </div>
      </div>
    </Stage>
  );
}
