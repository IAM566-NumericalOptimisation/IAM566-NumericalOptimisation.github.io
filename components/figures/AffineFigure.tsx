"use client";

import { LaTeX, Line, MovablePoint, Point, Vector, useMovablePoint } from "mafs";
import { useState } from "react";
import { Action, C, Plane, Readout, Segmented, Slider, Stage, Tex, fmt, useTween } from "@/components/kit";

type V = [number, number];
type Which = "V" | "A";

const dot = (u: V, v: V) => u[0] * v[0] + u[1] * v[1];
const add = (u: V, v: V): V => [u[0] + v[0], u[1] + v[1]];
const scale = (t: number, v: V): V => [t * v[0], t * v[1]];
/** Snap to the quarter grid, and never to the zero vector: the notes need a ≠ 0. */
const snapNonzero = ([x, y]: V): V => {
  const s: V = [Math.round(x * 4) / 4, Math.round(y * 4) / 4];
  return s[0] === 0 && s[1] === 0 ? [0.25, 0] : s;
};

/**
 * The line {x : aᵀx = level}, as a base point (its point nearest the origin)
 * plus multiples of the direction d = (-a₂, a₁), which is orthogonal to a.
 */
export function line(a: V, level: number) {
  const n2 = dot(a, a);
  return { base: scale(level / n2, a), d: [-a[1], a[0]] as V };
}

/** Is aᵀv on the chosen level? (Points are built exactly, so the tolerance is only for rounding.) */
export const onLevel = (a: V, v: V, level: number) => Math.abs(dot(a, v) - level) < 1e-9 * (1 + Math.abs(level));

export function AffineFigure() {
  const a = useMovablePoint([1, 1], { color: C.ink, constrain: snapNonzero });
  const [b, setB] = useState(4);
  const [which, setWhich] = useState<Which>("A");
  const [alpha, setAlpha] = useState(2);
  // p, q and x₀ are stored as multiples of d, so they ride along when a or b changes
  const [s, setS] = useState(1);
  const [t, setT] = useState(-3);
  const [r, setR] = useState(-2);
  // 0 → 1 slides a copy of V along x₀ until it lies on A
  const slide = useTween(1, 1400);

  const level = which === "A" ? b : 0;
  const Vline = line(a.point, 0);
  const Aline = line(a.point, b);
  const home = which === "A" ? Aline : Vline;
  const { d } = home;
  const at = (k: number) => add(home.base, scale(k, d));
  /** the parameter of the point of the chosen line nearest to p, on the quarter grid */
  const param = (base: V, p: V) => Math.round((dot([p[0] - base[0], p[1] - base[1]], d) / dot(d, d)) * 4) / 4;

  const p = at(s);
  const q = at(t);
  const x0 = add(Aline.base, scale(r, d));
  const sum = add(p, q);
  const ap = scale(alpha, p);
  const sumIn = onLevel(a.point, sum, level);
  const apIn = onLevel(a.point, ap, level);
  const zeroIn = level === 0;
  const tone = which === "A" ? C.copper : C.teal;
  const set = which === "A" ? "A" : "V";
  const rel = (yes: boolean) => (yes ? "=" : "\\ne");

  return (
    <Stage
      hint="drag a, p, q and x₀"
      controls={
        <>
          <Segmented
            label="Where p and q live"
            value={which}
            onChange={(w) => setWhich(w)}
            options={[
              { value: "V", tex: "V:\\ a^\\mathsf{T}x = 0" },
              { value: "A", tex: "A:\\ a^\\mathsf{T}x = b" },
            ]}
          />
          <Slider tex="b" value={b} min={-6} max={6} step={0.5} onChange={setB} />
          <Slider tex="\alpha" value={alpha} min={-2} max={3} step={0.25} onChange={setAlpha} />
          <Action onClick={() => (slide.set(0), slide.to(1))}>
            Translate <Tex tex="V" /> by <Tex tex="x_0" />
          </Action>
          <Action
            onClick={() => {
              a.setPoint([1, 1]);
              setB(4);
              setWhich("A");
              setS(1);
              setT(-3);
              setR(-2);
              setAlpha(2);
            }}
          >
            The notes&apos; example
          </Action>
        </>
      }
      readout={
        <Readout
          tex={`a^\\mathsf{T}p = ${fmt(dot(a.point, p))},\\quad a^\\mathsf{T}q = ${fmt(dot(a.point, q))},\\qquad a^\\mathsf{T}(p+q) = ${fmt(dot(a.point, sum))} ${rel(sumIn)} ${fmt(level)},\\qquad a^\\mathsf{T}(${fmt(alpha)}\\,p) = ${fmt(dot(a.point, ap))} ${rel(apIn)} ${fmt(level)}`}
          items={[
            { label: `p + q in ${set}`, tex: sumIn ? "\\text{yes}" : "\\text{no}", tone: sumIn ? "teal" : "copper" },
            { label: `αp in ${set}`, tex: apIn ? "\\text{yes}" : "\\text{no}", tone: apIn ? "teal" : "copper" },
            { label: `0 in ${set}`, tex: zeroIn ? "\\text{yes}" : "\\text{no}", tone: zeroIn ? "teal" : "copper" },
            { label: "x₀", tex: `(${fmt(x0[0])},\\ ${fmt(x0[1])})` },
          ]}
        />
      }
      caption={
        <>
          The teal line is <Tex tex="V" /> and the copper line is <Tex tex="A" />; both are orthogonal to <Tex tex="a" />. Since{" "}
          <Tex tex="a^\mathsf{T}(p+q) = a^\mathsf{T}p + a^\mathsf{T}q" /> and <Tex tex="a^\mathsf{T}(\alpha p) = \alpha\, a^\mathsf{T}p" />, sums and
          multiples of points of <Tex tex="V" /> give <Tex tex="0" /> again and stay in <Tex tex="V" />. For points of <Tex tex="A" /> they give{" "}
          <Tex tex="2b" /> and <Tex tex="\alpha b" />, which equal <Tex tex="b" /> only when <Tex tex="b = 0" /> (or <Tex tex="\alpha = 1" />), and then{" "}
          <Tex tex="A" /> is <Tex tex="V" />. Moving <Tex tex="V" /> by any one solution <Tex tex="x_0" /> gives <Tex tex="A" />; in the notes&apos;
          example, <Tex tex="a = (1,1)^\mathsf{T}" />, <Tex tex="b = 4" /> and <Tex tex="x_0 = (4,0)^\mathsf{T}" />.
        </>
      }
    >
      <Plane x={[-5, 9]} y={[-4, 7]} height={460}>
        <Line.ThroughPoints point1={[0, 0]} point2={Vline.d} color={C.teal} weight={2.5} />
        <Line.ThroughPoints point1={Aline.base} point2={add(Aline.base, Aline.d)} color={C.copper} weight={2.5} style={b === 0 ? "dashed" : "solid"} />
        {slide.value > 0 && slide.value < 1 ? (
          <Line.ThroughPoints point1={scale(slide.value, x0)} point2={add(scale(slide.value, x0), Vline.d)} color={C.teal} weight={2} opacity={0.6} style="dashed" />
        ) : null}
        {/* where p + q and αp land when they leave: the parallel line at their level */}
        {!sumIn ? <Line.ThroughPoints point1={sum} point2={add(sum, d)} color={C.blue} weight={1} opacity={0.4} style="dashed" /> : null}
        {!apIn ? <Line.ThroughPoints point1={ap} point2={add(ap, d)} color={C.violet} weight={1} opacity={0.4} style="dashed" /> : null}

        <Vector tip={x0} color={C.muted} weight={1.5} style="dashed" />
        <Vector tip={a.point} color={C.ink} weight={3} />
        <Line.Segment point1={p} point2={sum} color={C.blue} weight={1} style="dashed" />
        <Line.Segment point1={q} point2={sum} color={C.blue} weight={1} style="dashed" />
        <Vector tip={sum} color={C.blue} weight={2} opacity={0.8} />
        <Vector tip={ap} color={C.violet} weight={2} opacity={0.8} />
        <Point x={0} y={0} color={zeroIn ? C.teal : C.muted} />

        <LaTeX at={[a.x + 0.35, a.y + 0.35]} tex="a" color={C.ink} />
        <LaTeX at={add(x0, [0.4, -0.45])} tex="x_0" color={C.muted} />
        <LaTeX at={add(sum, [0.55, 0.35])} tex="p+q" color={C.blue} />
        <LaTeX at={add(ap, [0.5, 0.35])} tex="\alpha p" color={C.violet} />
        <LaTeX at={add(p, [0.4, 0.4])} tex="p" color={tone} />
        <LaTeX at={add(q, [0.4, 0.4])} tex="q" color={tone} />

        <MovablePoint point={x0} color={C.muted} constrain={(z) => add(Aline.base, scale(param(Aline.base, z), d))} onMove={(z) => setR(param(Aline.base, z))} />
        <MovablePoint point={p} color={tone} constrain={(z) => at(param(home.base, z))} onMove={(z) => setS(param(home.base, z))} />
        <MovablePoint point={q} color={tone} constrain={(z) => at(param(home.base, z))} onMove={(z) => setT(param(home.base, z))} />
        {a.element}
      </Plane>
    </Stage>
  );
}
