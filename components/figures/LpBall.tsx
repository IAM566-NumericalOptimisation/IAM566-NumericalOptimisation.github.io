"use client";

import { LaTeX, Line, Point, Polygon, Text } from "mafs";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Action, C, Plane, Readout, Segmented, Slider, Stage, Tex, fmt, useTween } from "@/components/kit";
import { tryCreateSpace, v3 } from "./space";
import styles from "./space.module.css";

type V = [number, number];

/** The Lp "norm" for any p > 0, and the max norm at p = Infinity. For p < 1 it is not a norm. */
export function lp(x: readonly number[], p: number) {
  if (!Number.isFinite(p)) return Math.max(...x.map(Math.abs));
  return x.reduce((s, v) => s + Math.abs(v) ** p, 0) ** (1 / p);
}

/** Radius of the slice x3 = c of the unit ball: { |x1|^p + |x2|^p <= 1 - |c|^p } is the Lp disc of that radius. */
export const sliceRadius = (p: number, c: number) => (Number.isFinite(p) ? Math.max(0, 1 - Math.abs(c) ** p) ** (1 / p) : Math.abs(c) <= 1 ? 1 : 0);

/** Points of the Lp circle of radius r in the plane, by scaling each direction to norm r. */
export function circle(p: number, r: number, n = 480): V[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / n;
    const d: V = [Math.cos(a), Math.sin(a)];
    const s = r / lp(d, p);
    return [d[0] * s, d[1] * s];
  });
}

// p runs on a log scale, p = 0.5 * 20^s for s in [0, 1], so 1/2, 1 and 2 are evenly spread
const P0 = 0.5;
const toS = (p: number) => Math.log(p / P0) / Math.log(20);
const toP = (s: number) => Math.round(P0 * 20 ** s * 1000) / 1000;

// the surface is a subdivided cube pushed out radially: its face centres are the axes (the
// octahedron's corners) and its face edges are the cube's edges, so p = 1 and p = infinity stay sharp
const N = 48;
const FACES: [THREE.Vector3, THREE.Vector3, THREE.Vector3][] = [
  [v3(1, 0, 0), v3(0, 1, 0), v3(0, 0, 1)],
  [v3(-1, 0, 0), v3(0, 0, 1), v3(0, 1, 0)],
  [v3(0, 1, 0), v3(0, 0, 1), v3(1, 0, 0)],
  [v3(0, -1, 0), v3(1, 0, 0), v3(0, 0, 1)],
  [v3(0, 0, 1), v3(1, 0, 0), v3(0, 1, 0)],
  [v3(0, 0, -1), v3(0, 1, 0), v3(1, 0, 0)],
];

function ballGeometry() {
  const dirs: number[] = [];
  const index: number[] = [];
  FACES.forEach(([n, a, b], f) => {
    for (let i = 0; i <= N; i++) {
      for (let j = 0; j <= N; j++) {
        const d = n.clone().addScaledVector(a, (2 * i) / N - 1).addScaledVector(b, (2 * j) / N - 1).normalize();
        dirs.push(d.x, d.y, d.z);
      }
    }
    const base = f * (N + 1) * (N + 1);
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const k = base + i * (N + 1) + j;
        index.push(k, k + N + 1, k + 1, k + 1, k + N + 1, k + N + 2);
      }
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(dirs.length), 3));
  geometry.setIndex(index);
  return { geometry, dirs: Float32Array.from(dirs) };
}

export function LpBall() {
  const hostRef = useRef<HTMLDivElement>(null);
  const draw = useRef<((p: number, c: number) => void) | null>(null);
  const [failed, setFailed] = useState(false);
  const [infinite, setInfinite] = useState(false);
  const [c, setC] = useState(0);
  const s = useTween(toS(2), 900);
  const pendingInf = useRef(false);
  const p = infinite ? Infinity : toP(s.value);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const space = tryCreateSpace(host, { position: v3(4.4, -3.8, 2.9), axis: 1.7, labelClass: styles.label });
    if (!space) return setFailed(true);
    const { geometry, dirs } = ballGeometry();
    const positions = geometry.getAttribute("position") as THREE.BufferAttribute;
    const material = space.paint(
      new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false, roughness: 0.55, metalness: 0 }),
      "teal",
    );
    const ball = new THREE.Mesh(geometry, material);
    space.scene.add(ball);
    const sheet = space.paint(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false }), "ink");
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), sheet);
    space.scene.add(plane);
    const rim = space.line("ink", 2.5);
    const sliceLabel = space.label("x_3=0", "muted");

    draw.current = (pp, cc) => {
      for (let i = 0; i < dirs.length; i += 3) {
        const r = 1 / lp([dirs[i], dirs[i + 1], dirs[i + 2]], pp);
        positions.setXYZ(i / 3, dirs[i] * r, dirs[i + 1] * r, dirs[i + 2] * r);
      }
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
      space.paint(material, pp < 1 ? "copper" : "teal");
      plane.position.set(0, 0, cc);
      const pts = circle(pp, sliceRadius(pp, cc), 240).map(([x, y]) => v3(x, y, cc));
      rim.setPoints([...pts, pts[0]]);
      sliceLabel.position.set(-1.25, -1.25, cc);
      sliceLabel.setTex(`x_3=${fmt(cc, 2)}`);
    };
    return () => {
      draw.current = null;
      space.dispose();
    };
  }, []);

  useEffect(() => draw.current?.(p, c), [p, c]);

  // the sweep and the infinity preset run s up to 1 (p = 10) and then switch to p = infinity
  useEffect(() => {
    if (pendingInf.current && s.value >= 1) {
      pendingInf.current = false;
      setInfinite(true);
    }
  }, [s.value]);

  const toward = (target: number | "inf", ms?: number) => {
    setInfinite(false);
    pendingInf.current = target === "inf";
    s.to(target === "inf" ? 1 : toS(target), ms);
  };

  const rho = sliceRadius(p, c);
  const curve = circle(p, rho);
  const pTex = Number.isFinite(p) ? fmt(p, 2) : "\\infty";
  const notes = lp([3, -4], p);
  const pair = lp([1, 1], p);
  const convex = p >= 1;
  const mid: V = [rho / 2, rho / 2];
  const preset = infinite ? "inf" : [0.5, 1, 2].includes(p) ? String(p) : "";

  return (
    <Stage
      hint="drag to turn the ball"
      controls={
        <>
          <Segmented
            label="Exponent p"
            value={preset}
            onChange={(v) => toward(v === "inf" ? "inf" : Number(v))}
            options={[
              { value: "0.5", tex: "p=\\tfrac12" },
              { value: "1", tex: "p=1" },
              { value: "2", tex: "p=2" },
              { value: "inf", tex: "p=\\infty" },
            ]}
          />
          <Slider
            tex="p"
            value={s.value}
            min={0}
            max={1}
            step={0.005}
            show={pTex}
            onChange={(v) => {
              pendingInf.current = false;
              setInfinite(false);
              s.set(v);
            }}
          />
          <Slider tex="x_3" value={c} min={-0.9} max={0.9} step={0.05} onChange={setC} />
          <Action
            primary
            onClick={() => {
              s.set(0);
              toward("inf", 9000);
            }}
          >
            Sweep <Tex tex="p" /> from <Tex tex="\tfrac12" /> to <Tex tex="\infty" />
          </Action>
        </>
      }
      readout={
        <Readout
          tex={
            Number.isFinite(p)
              ? `\\|x\\|_{${pTex}} = \\Big(\\sum_{i=1}^{3} |x_i|^{${pTex}}\\Big)^{1/${pTex}},\\qquad \\|(3,-4)\\|_{${pTex}} = ${fmt(notes, 3)}`
              : `\\|x\\|_\\infty = \\max_i |x_i|,\\qquad \\|(3,-4)\\|_\\infty = ${fmt(notes, 3)}`
          }
          items={[
            {
              label: "triangle inequality",
              tex: `\\|e_1+e_2\\|_{${pTex}} = ${fmt(pair, 3)} ${pair <= 2 + 1e-12 ? "\\le" : ">"} 2 = \\|e_1\\|_{${pTex}}+\\|e_2\\|_{${pTex}}`,
              tone: pair > 2 + 1e-12 ? "copper" : "teal",
            },
            { label: "unit ball", tex: convex ? "\\text{convex}" : "\\text{not convex}", tone: convex ? "teal" : "copper" },
            {
              label: "slice",
              tex: Number.isFinite(p) ? `|x_1|^{${pTex}}+|x_2|^{${pTex}} \\le 1-|x_3|^{${pTex}} = ${fmt(rho ** p, 3)}` : `\\max(|x_1|,|x_2|) \\le 1`,
            },
          ]}
        />
      }
      caption={
        <>
          The surface is the unit sphere <Tex tex="\|x\|_p=1" /> in <Tex tex="\mathbb{R}^3" />, and the right pane is its slice at the chosen height, with the slices for{" "}
          <Tex tex="p=1" /> and <Tex tex="p=\infty" /> dashed for comparison. As <Tex tex="p" /> grows the ball grows from the octahedron through the round ball to the cube. Below{" "}
          <Tex tex="p=1" /> the surface bends inward: at <Tex tex="p=\tfrac12" /> the midpoint of the chord from <Tex tex="e_1" /> to <Tex tex="e_2" /> lies outside, and{" "}
          <Tex tex="\|e_1+e_2\|_{1/2}=4>2" />, so the triangle inequality fails. The notes&apos; <Tex tex="(3,-4)" /> has norms <Tex tex="7" />, <Tex tex="5" /> and <Tex tex="4" /> at{" "}
          <Tex tex="p=1,2,\infty" />.
        </>
      }
    >
      <div className={styles.panes}>
        <div className={`${styles.pane} ${styles.host}`} ref={hostRef} role="img" aria-label="The unit sphere of the Lp norm in three dimensions, with a horizontal slicing plane">
          {failed ? <p className={styles.fallback}>This view needs WebGL, which is not available here.</p> : null}
        </div>
        <div className={styles.pane}>
          <p className={styles.paneLabel}>
            <Tex tex={`x_3=${fmt(c, 2)}`} />
          </p>
          <Plane x={[-1.4, 1.4]} y={[-1.4, 1.4]} height={440}>
            <Polygon points={circle(1, sliceRadius(1, c), 8)} color={C.muted} fillOpacity={0} weight={1} strokeStyle="dashed" />
            <Polygon points={circle(Infinity, sliceRadius(Infinity, c), 8)} color={C.muted} fillOpacity={0} weight={1} strokeStyle="dashed" />
            <Polygon points={curve} color={convex ? C.teal : C.copper} fillOpacity={0.16} weight={2.5} />
            {rho > 0.05 ? (
              <>
                <Line.Segment point1={[rho, 0]} point2={[0, rho]} color={C.violet} style="dashed" weight={1.5} />
                <Point x={rho} y={0} color={C.ink} />
                <Point x={0} y={rho} color={C.ink} />
                <Point x={mid[0]} y={mid[1]} color={lp(mid, p) > rho + 1e-12 ? C.copper : C.teal} />
              </>
            ) : null}
            {c === 0 ? (
              <>
                <LaTeX at={[1.12, -0.14]} tex="e_1" color={C.ink} />
                <LaTeX at={[-0.16, 1.12]} tex="e_2" color={C.ink} />
                <LaTeX at={[mid[0] + 0.32, mid[1] + 0.16]} tex="\tfrac12(e_1+e_2)" color={C.violet} />
              </>
            ) : null}
            <Text x={1} y={0} attach="s" size={11} color={C.faint}>
              1
            </Text>
            <Text x={0} y={-1} attach="w" size={11} color={C.faint}>
              −1
            </Text>
          </Plane>
        </div>
      </div>
    </Stage>
  );
}
