"use client";

import { LaTeX, Line, Polyline, Vector, useMovablePoint } from "mafs";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Action, C, Plane, Readout, Segmented, Slider, Stage, Tex, fmt, useTween } from "@/components/kit";
import { disc, tryCreateSpace, v3 } from "./space";
import styles from "./space.module.css";

type V = [number, number];
type V3 = [number, number, number];

// A = [[1,2,3],[2,4,6]]: every column is a multiple of (1,2), every row a multiple of (1,2,3)
export const A = [
  [1, 2, 3],
  [2, 4, 6],
];
const ROW: V3 = [1, 2, 3];
const COL: V = [1, 2];
const N1: V3 = [-2, 1, 0];
const N2: V3 = [-3, 0, 1];
const LEFT: V = [-2, 1];

export const mul = (x: V3): V => A.map((r) => r[0] * x[0] + r[1] * x[1] + r[2] * x[2]) as V;
const dot = (a: readonly number[], b: readonly number[]) => a.reduce((s, v, i) => s + v * b[i], 0);

/**
 * Split b in R^2 along the column space and the left null space: b = c(1,2) + (b - c(1,2)).
 * The flat { x : Ax = c(1,2) } is (c,0,0) + N(A): the solutions when b is reachable,
 * the least-squares solutions when it is not.
 */
export function split(b: V) {
  const c = dot(b, COL) / dot(COL, COL);
  const hat: V = [c * COL[0], c * COL[1]];
  const rest: V = [b[0] - hat[0], b[1] - hat[1]];
  return { c, hat, rest, solvable: Math.hypot(...rest) < 1e-9 };
}

/** The point (c,0,0) + s n1 + t n2 of the flat. */
export const solution = (c: number, s: number, t: number): V3 => [c + s * N1[0] + t * N2[0], s * N1[1] + t * N2[1], s * N1[2] + t * N2[2]];

const snap = ([x, y]: V): V => [Math.round(x * 4) / 4, Math.round(y * 4) / 4];
const tup = (v: readonly number[]) => `(${v.map((x) => fmt(x, 3)).join(",")})`;

export function SubspacesFigure() {
  const hostRef = useRef<HTMLDivElement>(null);
  const draw = useRef<((c: number, solvable: boolean, s: number, t: number) => void) | null>(null);
  const [failed, setFailed] = useState(false);
  const b = useMovablePoint([2, 4], { color: C.ink, constrain: (p) => snap(p as V) });
  const [s, setS] = useState(0);
  const [t, setT] = useState(0);
  // one loop of x through the flat, starting and ending at the particular solution
  const slide = useTween(0, 6000);
  const sliding = useRef(false);
  useEffect(() => {
    if (!sliding.current) return;
    const a = 2 * Math.PI * slide.value;
    setS(1.2 * Math.sin(a));
    setT(0.9 * Math.sin(2 * a));
    if (slide.value >= 1) sliding.current = false;
  }, [slide.value]);
  const stopSlide = () => {
    sliding.current = false;
    slide.set(0);
  };

  const { c, hat, rest, solvable } = split(b.point);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const space = tryCreateSpace(host, { position: v3(9.5, -8.5, 6.5), target: v3(0.3, 0.3, 0.4), axis: 3.3, labelClass: styles.label });
    if (!space) return setFailed(true);
    const n = v3(...ROW).normalize();
    // the null space: the plane x1 + 2x2 + 3x3 = 0, orthogonal to the row
    disc(space, "teal", 3.4, n, 0.16);
    const flat = disc(space, "blue", 3.4, n, 0.2);
    const flatMaterial = flat.material as THREE.MeshStandardMaterial;
    space.line("copper", 2).setPoints([n.clone().multiplyScalar(-4.2), n.clone().multiplyScalar(4.2)]);
    space.arrow("copper", 0.05).aim(v3(...ROW));
    space.label("(1,2,3)", "copper", v3(...ROW).multiplyScalar(1.13));
    space.label("\\mathcal{R}(A^\\mathsf{T})", "copper", n.clone().multiplyScalar(-3.9));
    space.arrow("teal", 0.04).aim(v3(...N1));
    space.arrow("teal", 0.04).aim(v3(...N2));
    space.label("(-2,1,0)", "teal", v3(...N1).multiplyScalar(1.2));
    space.label("(-3,0,1)", "teal", v3(...N2).multiplyScalar(1.15));
    space.label("\\mathcal{N}(A)", "teal", v3(0, -2.6, 1.7).projectOnPlane(n));
    // the right angle between the row line and the plane, at the origin
    const d = v3(...N1).normalize().multiplyScalar(0.35);
    const m = n.clone().multiplyScalar(0.35);
    space.line("ink", 1.5).setPoints([d, d.clone().add(m), m]);
    const particular = space.arrow("ink", 0.035);
    const along = space.arrow("blue", 0.035);
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 16), space.paint(new THREE.MeshStandardMaterial({ roughness: 0.4 }), "ink"));
    const pierce = new THREE.Mesh(new THREE.SphereGeometry(0.065, 20, 14), space.paint(new THREE.MeshStandardMaterial({ roughness: 0.4 }), "copper"));
    space.scene.add(marker, pierce);
    const xLabel = space.label("x", "ink");
    const flatLabel = space.label("", "blue");

    draw.current = (cc, ok, ss, tt) => {
      flat.position.copy(n).multiplyScalar(cc / Math.sqrt(14));
      space.paint(flatMaterial, ok ? "blue" : "violet");
      flatMaterial.opacity = ok ? 0.22 : 0.12;
      const x0 = v3(cc, 0, 0);
      const x = v3(...solution(cc, ss, tt));
      particular.aim(x0);
      along.aim(x.clone().sub(x0), x0);
      marker.position.copy(x);
      // every point of the flat has the same component (c/14)(1,2,3) in the row space
      pierce.position.copy(v3(...ROW).multiplyScalar(cc / 14));
      xLabel.position.copy(x).add(v3(0, 0, 0.4));
      xLabel.setTex(ok ? "x" : "\\hat x");
      flatLabel.setTex(ok ? "x_0+\\mathcal{N}(A)" : "A\\hat x=\\hat b");
      flatLabel.position.copy(flat.position).add(v3(2.2, 1.6, 0).projectOnPlane(n));
    };
    return () => {
      draw.current = null;
      space.dispose();
    };
  }, []);

  useEffect(() => draw.current?.(c, solvable, s, t), [c, solvable, s, t]);

  const x = solution(c, s, t);
  const Ax = mul(x);
  const preset = b.x === 2 && b.y === 4 ? "in" : b.x === -1 && b.y === 3 ? "out" : "";
  const n = Math.hypot(...COL);
  const u: V = [COL[0] / n, COL[1] / n];
  const w: V = [LEFT[0] / Math.hypot(...LEFT), LEFT[1] / Math.hypot(...LEFT)];
  const side = Math.sign(dot(rest, w)) || 1;
  const back = c >= 0 ? -1 : 1;
  const mk = 0.28;
  const corner: V[] = [
    [hat[0] + back * mk * u[0], hat[1] + back * mk * u[1]],
    [hat[0] + back * mk * u[0] + side * mk * w[0], hat[1] + back * mk * u[1] + side * mk * w[1]],
    [hat[0] + side * mk * w[0], hat[1] + side * mk * w[1]],
  ];
  const x0 = tup([c, 0, 0]);

  return (
    <Stage
      hint="drag b; drag the left view to turn it"
      controls={
        <>
          <Segmented
            label="Right-hand side"
            value={preset}
            onChange={(v) => {
              stopSlide();
              setS(0);
              setT(0);
              b.setPoint(v === "in" ? [2, 4] : [-1, 3]);
            }}
            options={[
              { value: "in", tex: "b=(2,4)" },
              { value: "out", tex: "b=(-1,3)" },
            ]}
          />
          <Slider tex="s" value={s} min={-1.5} max={1.5} step={0.05} onChange={(v) => (stopSlide(), setS(v))} />
          <Slider tex="t" value={t} min={-1.5} max={1.5} step={0.05} onChange={(v) => (stopSlide(), setT(v))} />
          <Action
            primary
            onClick={() => {
              sliding.current = true;
              slide.set(0);
              slide.to(1);
            }}
          >
            Slide <Tex tex="x" /> through the flat
          </Action>
        </>
      }
      readout={
        <Readout
          tex={
            solvable
              ? `b = ${tup(b.point)} = ${fmt(c, 3)}\\,(1,2) \\in \\mathcal{R}(A):\\quad x = ${x0} + ${fmt(s, 2)}\\,(-2,1,0) + ${fmt(t, 2)}\\,(-3,0,1) = ${tup(x)},\\quad Ax = ${tup(Ax)}`
              : `b = ${tup(b.point)} \\notin \\mathcal{R}(A):\\quad \\hat b = ${tup(hat)},\\quad b-\\hat b = ${tup(rest)} \\in \\mathcal{N}(A^\\mathsf{T}),\\quad A\\hat x = ${tup(Ax)} \\text{ for } \\hat x = ${tup(x)}`
          }
          items={[
            { label: "rank", tex: "r = 1" },
            { label: "rank–nullity in ℝ³", tex: "\\dim\\mathcal{R}(A^\\mathsf{T}) + \\dim\\mathcal{N}(A) = 1 + 2 = 3", tone: "teal" },
            { label: "in ℝ²", tex: "\\dim\\mathcal{R}(A) + \\dim\\mathcal{N}(A^\\mathsf{T}) = 1 + 1 = 2", tone: "blue" },
            {
              label: "orthogonality",
              tex: `\\langle (1,2,3),(-2,1,0)\\rangle = ${dot(ROW, N1)},\\ \\langle (1,2,3),(-3,0,1)\\rangle = ${dot(ROW, N2)},\\ \\langle (1,2),(-2,1)\\rangle = ${dot(COL, LEFT)}`,
            },
          ]}
        />
      }
      caption={
        <>
          Left, the domain <Tex tex="\mathbb{R}^3" />: the null space is the teal plane <Tex tex="x_1+2x_2+3x_3=0" />, and the row space is the copper line through{" "}
          <Tex tex="(1,2,3)" />, at a right angle to it. Right, the codomain <Tex tex="\mathbb{R}^2" />: the column space is the teal line through <Tex tex="(1,2)" />, and the left null
          space is the dashed copper line through <Tex tex="(-2,1)" />. For <Tex tex="b=(2,4)" /> the solutions form the blue flat <Tex tex="(2,0,0)+\mathcal{N}(A)" />; the sliders move{" "}
          <Tex tex="x" /> in it and <Tex tex="Ax" /> stays <Tex tex="(2,4)" />. Every solution has the same row-space part, the copper dot where the line pierces the flat. For{" "}
          <Tex tex="b=(-1,3)" /> there is no solution: <Tex tex="b" /> is off the column line by <Tex tex="(-2,1)" />, a vector of the left null space, and the violet flat holds the
          least-squares solutions, those with <Tex tex="Ax=\hat b=(1,2)" />.
        </>
      }
    >
      <div className={styles.panes}>
        <div className={`${styles.pane} ${styles.host}`} ref={hostRef} role="img" aria-label="The domain R3 with the null space plane, the row space line and the flat of solutions">
          {failed ? <p className={styles.fallback}>This view needs WebGL, which is not available here.</p> : null}
        </div>
        <div className={styles.pane}>
          <p className={styles.paneLabel}>
            <Tex tex="\mathbb{R}^2" />
          </p>
          <Plane x={[-4, 4]} y={[-3, 5.5]} height={440}>
            <Line.ThroughPoints point1={[0, 0]} point2={COL} color={C.teal} weight={2.5} opacity={0.8} />
            <Line.ThroughPoints point1={[0, 0]} point2={LEFT} color={C.copper} style="dashed" opacity={0.8} />
            <LaTeX at={[2.55, 4.7]} tex="\mathcal{R}(A)" color={C.teal} />
            <LaTeX at={[-3.2, 2.15]} tex="\mathcal{N}(A^\mathsf{T})" color={C.copper} />
            {!solvable ? (
              <>
                {Math.hypot(...hat) > 0.3 ? <Polyline points={corner} color={C.ink} weight={1.5} fillOpacity={0} /> : null}
                <Vector tip={hat} color={C.teal} weight={4} />
                <Vector tail={hat} tip={b.point} color={C.copper} weight={3} />
                <LaTeX at={[hat[0] + 0.45, hat[1] - 0.3]} tex="\hat b" color={C.teal} />
              </>
            ) : (
              <Vector tip={b.point} color={C.teal} weight={4} />
            )}
            <LaTeX at={[b.x + 0.35, b.y + 0.35]} tex={solvable ? "b=Ax" : "b"} color={C.ink} />
            {b.element}
          </Plane>
        </div>
      </div>
    </Stage>
  );
}
