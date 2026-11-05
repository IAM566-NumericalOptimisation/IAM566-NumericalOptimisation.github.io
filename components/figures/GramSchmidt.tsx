"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Action, Readout, Segmented, Stage, Tex, fmt, useTween } from "@/components/kit";
import { disc, tryCreateSpace, v3, type Role } from "./space";
import styles from "./space.module.css";

type V3 = [number, number, number];

const DATA: Record<"notes" | "dependent", V3[]> = {
  notes: [
    [1, 2, 2],
    [0, 3, 6],
    [6, 3, 3],
  ],
  // x3 = x1 + x2, so z3 = 0
  dependent: [
    [1, 2, 2],
    [0, 3, 6],
    [1, 5, 8],
  ],
};

const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

/**
 * Classical Gram-Schmidt as the notes write it: z_k = x_k - sum_j <x_k,z_j>/|z_j|^2 z_j,
 * q_k = z_k/|z_k|, and R with r_jj = |z_j|, r_ij = <x_j,q_i> above the diagonal.
 * A zero z_j (a dependent list) contributes no shadow and no q_j.
 */
export function gramSchmidt(xs: V3[]) {
  const zs: V3[] = [];
  const coeffs: number[][] = [];
  for (const x of xs) {
    const row: number[] = [];
    let z = x;
    for (const zj of zs) {
      const nn = dot(zj, zj);
      const c = nn < 1e-12 ? 0 : dot(x, zj) / nn;
      row.push(c);
      z = sub(z, scale(zj, c));
    }
    coeffs.push(row);
    zs.push(z.map((v) => (Math.abs(v) < 1e-12 ? 0 : v)) as V3);
  }
  const norms = zs.map((z) => Math.sqrt(dot(z, z)));
  const qs = zs.map((z, j) => (norms[j] < 1e-9 ? ([0, 0, 0] as V3) : scale(z, 1 / norms[j])));
  const R = xs.map((_, i) => xs.map((xj, j) => (j < i ? 0 : j === i ? norms[i] : dot(xj, qs[i]))));
  return { zs, coeffs, norms, qs, R };
}

/** A number with a small denominator as a fraction, as 1/3 is written in the frame q_j = z_j/3. */
export function nice(n: number) {
  for (const d of [1, 2, 3, 6, 9]) {
    const p = Math.round(n * d);
    if (Math.abs(n * d - p) < 1e-9) {
      if (d === 1) return String(p);
      const g = gcd(Math.abs(p), d);
      return d / g === 1 ? String(p / g) : `${p < 0 ? "-" : ""}\\tfrac{${Math.abs(p / g)}}{${d / g}}`;
    }
  }
  return fmt(n, 3);
}
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const tup = (v: V3) => `(${v.map(nice).join(",")})`;
const times = (c: number, body: string) => (Math.abs(c - 1) < 1e-12 ? body : Math.abs(c + 1) < 1e-12 ? `-${body}` : `${fmt(c, 3)}${body}`);
const ROLE: Role[] = ["teal", "blue", "violet"];
const STEPS = [
  { value: 0, tex: "x_j" },
  { value: 1, tex: "z_1" },
  { value: 2, tex: "z_2" },
  { value: 3, tex: "z_3" },
  { value: 4, tex: "q_j" },
];
const clamp = (t: number) => Math.min(1, Math.max(0, t));

export function GramSchmidt() {
  const hostRef = useRef<HTMLDivElement>(null);
  const draw = useRef<((xs: V3[], step: number, u: number) => void) | null>(null);
  const [failed, setFailed] = useState(false);
  const [data, setData] = useState<"notes" | "dependent">("notes");
  const [step, setStep] = useState(0);
  // u runs 0 -> 1 through the current step: shadows grow, the remainder appears, then slides home
  const phase = useTween(1, 2600);
  const xs = DATA[data];

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const space = tryCreateSpace(host, { position: v3(12, -10.5, 7.5), target: v3(1.6, 1.4, 2), axis: 6.2, labelClass: styles.label });
    if (!space) return setFailed(true);
    const originals = [0, 1, 2].map(() => space.arrow("muted", 0.03, 0.55));
    const xLabels = [0, 1, 2].map((i) => space.label(`x_${i + 1}`, "muted"));
    const built = [0, 1, 2].map((i) => space.arrow(ROLE[i], 0.06));
    const zLabels = [0, 1, 2].map((i) => space.label(`z_${i + 1}`, ROLE[i]));
    const shadows = [0, 1].map((j) => space.arrow(ROLE[j], 0.045, 0.5));
    const shadowLabels = [0, 1].map((j) => space.label("", ROLE[j]));
    const remainder = space.arrow("copper", 0.05);
    const plane = disc(space, "blue", 6.5, v3(0, 0, 1), 0.1);
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 48, 32),
      space.paint(new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.12, depthWrite: false, roughness: 1 }), "teal"),
    );
    space.scene.add(sphere);

    const tipLabel = (label: THREE.Object3D, tip: THREE.Vector3, show = true) => {
      label.visible = show && tip.length() > 0.05;
      label.position.copy(tip).addScaledVector(tip.clone().normalize(), 0.45);
    };

    draw.current = (rows, step, u) => {
      const { zs, coeffs, norms } = gramSchmidt(rows);
      const X = rows.map((r) => v3(...r));
      const Z = zs.map((z) => v3(...z));
      X.forEach((x, i) => {
        originals[i].aim(x);
        tipLabel(xLabels[i], x);
      });
      shadows.forEach((s, j) => {
        s.visible = false;
        shadowLabels[j].visible = false;
      });
      remainder.visible = false;
      plane.visible = false;
      sphere.visible = step === 4;

      // the finished vectors: z_j for j < step (and z_j at step 4, shrinking to q_j)
      Z.forEach((z, j) => {
        const done = step === 4 || j < step - 1 || (j === step - 1 && step === 1);
        if (!done) {
          built[j].visible = false;
          zLabels[j].visible = false;
          return;
        }
        let v = z.clone();
        if (step === 1) v.multiplyScalar(u);
        if (step === 4 && norms[j] > 1e-9) v = z.clone().multiplyScalar(1 - u + u / norms[j]);
        built[j].aim(v);
        zLabels[j].setTex(step === 4 && u > 0.5 ? `q_${j + 1}` : `z_${j + 1}`);
        tipLabel(zLabels[j], v);
      });

      if (step === 2 || step === 3) {
        const k = step - 1;
        const x = X[k];
        const a = clamp(u / 0.4);
        const b = clamp((u - 0.4) / 0.3);
        const c = clamp((u - 0.75) / 0.25);
        // the shadows on z_1, ..., z_{k-1}, laid head to tail
        const cursor = new THREE.Vector3();
        coeffs[k].forEach((coef, j) => {
          const shadow = Z[j].clone().multiplyScalar(coef * a);
          shadows[j].aim(shadow, cursor.clone());
          if (Math.abs(coef) > 1e-9 && a > 0.5) {
            shadowLabels[j].visible = true;
            shadowLabels[j].setTex(times(coef, `z_${j + 1}`));
            shadowLabels[j].position.copy(cursor).addScaledVector(shadow, 0.5).add(v3(0, 0, 0.35));
          }
          cursor.add(shadow);
        });
        // what remains: from the end of the shadows to x, then moved to the origin
        if (b > 0) {
          const rest = x.clone().sub(cursor).multiplyScalar(b);
          remainder.aim(rest, cursor.clone().multiplyScalar(1 - c));
          if (c >= 1) {
            remainder.visible = false;
            built[k].aim(Z[k]);
            zLabels[k].setTex(norms[k] < 1e-9 ? `z_${k + 1}=0` : `z_${k + 1}`);
            tipLabel(zLabels[k], Z[k].length() > 0.05 ? Z[k] : v3(0.3, 0.3, 0.3));
            zLabels[k].visible = true;
          }
        }
        if (step === 3 && norms[0] > 1e-9 && norms[1] > 1e-9) {
          plane.visible = true;
          plane.quaternion.setFromUnitVectors(v3(0, 0, 1), Z[0].clone().cross(Z[1]).normalize());
        }
      }
    };
    return () => {
      draw.current = null;
      space.dispose();
    };
  }, []);

  useEffect(() => draw.current?.(xs, step, phase.value), [xs, step, phase.value]);

  const go = (next: number) => {
    setStep(next);
    phase.set(0);
    phase.to(1);
  };

  const { zs, coeffs, norms, qs, R } = gramSchmidt(xs);
  const Q = [0, 1, 2].map((i) => qs.map((q) => q[i]));
  const matTex = (m: number[][]) => `\\begin{bmatrix}${m.map((r) => r.map(nice).join(" & ")).join("\\\\")}\\end{bmatrix}`;
  const ip = (i: number, j: number) => `\\langle z_${i + 1},z_${j + 1}\\rangle = ${fmt(dot(zs[i], zs[j]), 6)}`;
  const lengths = (k: number) => zs.slice(0, k).map((_, j) => ({ label: `‖z${"₁₂₃"[j]}‖`, tex: fmt(norms[j], 3), tone: "teal" as const }));
  const formula = (k: number) => {
    // written as the notes write it, x_k minus each shadow, with the inner product as it comes
    const terms = coeffs[k].map((_, j) => `-\\frac{${fmt(dot(xs[k], zs[j]), 3)}}{${fmt(norms[j] ** 2, 3)}}\\,z_${j + 1}`).join("");
    return `z_${k + 1} = x_${k + 1} ${terms} = ${tup(zs[k])}`;
  };

  let readout;
  if (step === 0) readout = <Readout tex={`x_1=${tup(xs[0])},\\quad x_2=${tup(xs[1])},\\quad x_3=${tup(xs[2])}`} />;
  else if (step === 1) readout = <Readout tex={`z_1 = x_1 = ${tup(zs[0])}`} items={lengths(1)} />;
  else if (step === 2) readout = <Readout tex={formula(1)} items={[{ label: "orthogonal", tex: ip(0, 1) }, ...lengths(2)]} />;
  else if (step === 3) readout = <Readout tex={formula(2)} items={[{ label: "orthogonal", tex: `${ip(0, 2)},\\ ${ip(1, 2)}` }, ...lengths(3)]} />;
  else
    readout = (
      <Readout
        tex={`A = \\begin{bmatrix}x_1 & x_2 & x_3\\end{bmatrix} = QR = ${matTex(Q)}${matTex(R)}`}
        items={[
          { label: "diagonal of R", tex: R.map((r, i) => fmt(r[i], 3)).join(",\\ "), tone: "teal" },
          { label: "q₁, q₂, q₃", tex: qs.map(tup).join(",\\ ") },
        ]}
      />
    );

  return (
    <Stage
      hint="drag to turn the view"
      controls={
        <>
          <Segmented label="Step" value={step} onChange={go} options={STEPS} />
          <Action primary onClick={() => go((step + 1) % 5)}>
            {step === 4 ? "Start again" : "Next step"}
          </Action>
          <Segmented
            label="The list"
            value={data}
            onChange={(d) => {
              setData(d);
              go(step);
            }}
            options={[
              { value: "notes", tex: "x_3=(6,3,3)" },
              { value: "dependent", tex: "x_3=x_1+x_2" },
            ]}
          />
        </>
      }
      readout={readout}
      caption={
        <>
          Pale arrows are the original vectors. At each step the shadows of <Tex tex="x_k" /> on the vectors already built are laid head to tail, in their colours; the copper arrow is what
          remains, and it slides to the origin to become <Tex tex="z_k" />. For <Tex tex="z_3" /> the two shadows add up to the shadow on the shaded plane{" "}
          <Tex tex="\operatorname{span}\{z_1,z_2\}" />. In the notes&apos; list the coefficient on <Tex tex="z_2" /> is <Tex tex="-1" />, because the angle is obtuse, and the list gives{" "}
          <Tex tex="z_1=(1,2,2)" />, <Tex tex="z_2=(-2,-1,2)" />, <Tex tex="z_3=(2,-2,1)" />, each of length <Tex tex="3" />, and the last step divides by <Tex tex="3" /> onto the unit
          sphere, so the diagonal of <Tex tex="R" /> is <Tex tex="3,3,3" />. With <Tex tex="x_3=x_1+x_2" /> nothing remains: <Tex tex="z_3=0" />.
        </>
      }
    >
      <div className={styles.host} ref={hostRef} role="img" aria-label="Gram-Schmidt in three dimensions: the original vectors, the shadows removed at each step, and the orthogonal vectors built">
        {failed ? <p className={styles.fallback}>This view needs WebGL, which is not available here.</p> : null}
      </div>
    </Stage>
  );
}
