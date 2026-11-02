"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { watchTheme } from "@/components/theme";
import { Tex } from "./Tex";
import { COPPER, GREEN, INK, arrow, axes, bindDrag, dot, mountPlane, near, rightAngle, rule, text } from "./plane";
import type { View } from "./plane";
import { BLUE as BLUE_HEX, COPPER as COPPER_HEX, GREEN as GREEN_HEX, createStage, disposeShaft, fmt, makeShaft, recolor, setShaft, setThemeColor } from "./scene";
import styles from "./figures.module.css";

type Pair = [number, number];

const U = new THREE.Vector3(-2, 1, 0);
const V = new THREE.Vector3(-3, 0, 1);
const NORMAL = new THREE.Vector3(1, 2, 3);

function split(b: Pair) {
  const c = (b[0] + 2 * b[1]) / 5;
  const proj: Pair = [c, 2 * c];
  const residual: Pair = [b[0] - proj[0], b[1] - proj[1]];
  const solvable = Math.hypot(residual[0], residual[1]) < 0.08;
  return { c, proj, residual, solvable };
}

function pointAt(c: number, s: number, t: number) {
  return new THREE.Vector3(c, 0, 0).addScaledVector(U, s).addScaledVector(V, t);
}

export function SubspacesFigure() {
  const spaceRef = useRef<HTMLCanvasElement>(null);
  const planeRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<View | null>(null);
  const syncRef = useRef<(b: Pair, s: number, t: number) => void>(() => {});
  const drawRef = useRef<() => void>(() => {});
  const [b, setB] = useState<Pair>([2, 4]);
  const [s, setS] = useState(0);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const stateRef = useRef({ b, s, t });
  stateRef.current = { b, s, t };

  useEffect(() => {
    const canvas = spaceRef.current;
    if (!canvas) return;
    const { scene, renderer, controls, resize } = createStage(
      canvas,
      new THREE.Vector3(7.4, 5.6, 7.6),
      new THREE.Vector3(0.5, 0.35, 0.25),
    );
    const nHat = NORMAL.clone().normalize();
    const discMaterial = (color: number, opacity: number) => {
      const material = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
        roughness: 1,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      });
      setThemeColor(material, color);
      return material;
    };
    const nullDisc = new THREE.Mesh(new THREE.CircleGeometry(3.8, 80), discMaterial(GREEN_HEX, 0.2));
    const solDisc = new THREE.Mesh(new THREE.CircleGeometry(3.8, 80), discMaterial(BLUE_HEX, 0.28));
    nullDisc.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), nHat);
    solDisc.quaternion.copy(nullDisc.quaternion);
    const row = makeShaft(COPPER_HEX, 0.032);
    setShaft(row, nHat.clone().multiplyScalar(3.5));
    const rowMat = new THREE.LineBasicMaterial({ color: COPPER_HEX });
    setThemeColor(rowMat, COPPER_HEX);
    const rowLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([nHat.clone().multiplyScalar(-3.6), nHat.clone().multiplyScalar(3.6)]),
      rowMat,
    );
    const particular = makeShaft(0x6f675e, 0.028);
    const slide = makeShaft(GREEN_HEX, 0.036);
    const markerMat = new THREE.MeshStandardMaterial({ color: 0x1c1b18, roughness: 0.4 });
    setThemeColor(markerMat, 0x1c1b18);
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.09, 22, 16), markerMat);
    const guide = (dir: THREE.Vector3) => {
      const material = new THREE.LineBasicMaterial({ color: 0x8a8175 });
      setThemeColor(material, 0x8a8175);
      return new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), dir.clone()]), material);
    };
    const uLine = guide(U);
    const vLine = guide(V);
    scene.add(nullDisc, solDisc, rowLine, row, particular, slide, marker, uLine, vLine);

    const placeLine = (line: THREE.Line, origin: THREE.Vector3, dir: THREE.Vector3) => {
      const pos = line.geometry.getAttribute("position") as THREE.BufferAttribute;
      const a = origin.clone().addScaledVector(dir, -1.15);
      const c = origin.clone().addScaledVector(dir, 1.15);
      pos.setXYZ(0, a.x, a.y, a.z);
      pos.setXYZ(1, c.x, c.y, c.z);
      pos.needsUpdate = true;
    };

    syncRef.current = (_b, ss, tt) => {
      const { c } = split(_b);
      const x0 = new THREE.Vector3(c, 0, 0);
      const x = pointAt(c, ss, tt);
      solDisc.position.copy(nHat.clone().multiplyScalar(c / Math.sqrt(14)));
      setShaft(particular, x0);
      setShaft(slide, x.clone().sub(x0), x0);
      marker.position.copy(x);
      placeLine(uLine, x0, U);
      placeLine(vLine, x0, V);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    let frame = 0;
    const loop = () => {
      frame = requestAnimationFrame(loop);
      controls.update();
      renderer.render(scene, controls.object as THREE.PerspectiveCamera);
    };
    loop();
    const stopTheme = watchTheme(() => recolor(scene));
    return () => {
      stopTheme();
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      [row, particular, slide].forEach(disposeShaft);
      nullDisc.geometry.dispose();
      solDisc.geometry.dispose();
      (nullDisc.material as THREE.Material).dispose();
      (solDisc.material as THREE.Material).dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const canvas = planeRef.current;
    if (!canvas) return;
    const draw = () => drawRef.current();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    const unbind = bindDrag(
      canvas,
      (px, py) => {
        const view = viewRef.current;
        if (!view) return null;
        const { b: point } = stateRef.current;
        return near(view, point[0], point[1], px, py, 18) ? "b" : null;
      },
      (_id, px, py) => {
        const view = viewRef.current;
        if (!view) return;
        setPlaying(false);
        setB([view.wx(px), view.wy(py)]);
      },
    );
    const stopTheme = watchTheme(draw);
    return () => {
      stopTheme();
      observer.disconnect();
      unbind();
    };
  }, []);

  useEffect(() => {
    drawRef.current = () => {
      const canvas = planeRef.current;
      if (!canvas) return;
      const { b: point } = stateRef.current;
      const { proj, residual } = split(point);
      const view = mountPlane(canvas, 0.5, 1.5, 4.4);
      viewRef.current = view;
      if (!view) return;
      axes(view);
      rule(view, 0, 0, 1, 2, GREEN, 1.4);
      rule(view, 0, 0, -2, 1, COPPER, 1.05, [4, 4]);
      arrow(view, 0, 0, proj[0], proj[1], GREEN, 1.8);
      arrow(view, proj[0], proj[1], point[0], point[1], COPPER, 1.7);
      if (Math.hypot(residual[0], residual[1]) > 0.12) {
        rightAngle(view, proj[0], proj[1], residual[0], residual[1], 1, 2);
      }
      dot(view, point[0], point[1], INK, 4.5);
      text(view, point[0], point[1], "b");
      text(view, proj[0], proj[1], "Ax", GREEN);
    };
    drawRef.current();
    syncRef.current(b, s, t);
  }, [b, s, t]);

  useEffect(() => {
    if (!playing) return;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const angle = (now - started) / 1000;
      setS(Math.round(Math.cos(angle) * 70) / 100);
      setT(Math.round(Math.sin(angle) * 55) / 100);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const { c, proj, residual, solvable } = split(b);
  const x = pointAt(c, s, t);
  const formula = solvable
    ? `b=(${fmt(b[0])},${fmt(b[1])})\\in\\mathcal{R}(A),\\quad x=(${fmt(x.x)},${fmt(x.y)},${fmt(x.z)}),\\quad Ax=(${fmt(proj[0])},${fmt(proj[1])})`
    : `b=(${fmt(b[0])},${fmt(b[1])})\\notin\\mathcal{R}(A),\\quad \\operatorname{proj}b=(${fmt(proj[0])},${fmt(proj[1])}),\\quad b-\\operatorname{proj}b=(${fmt(residual[0])},${fmt(residual[1])})`;

  return (
    <figure className={styles.figure}>
      <div className={styles.views}>
        <div>
          <p className={styles.viewLabel}>
            <Tex source="\mathcal{N}(A)\ \text{and}\ \mathcal{R}(A^\mathsf{T})" />
          </p>
          <canvas ref={spaceRef} className={styles.canvas} aria-label="Nullspace plane, the parallel plane of solutions, and the row space line" />
        </div>
        <div>
          <p className={styles.viewLabel}>
            <Tex source="\mathcal{R}(A)\ \text{and}\ \mathcal{N}(A^\mathsf{T})" />
          </p>
          <canvas ref={planeRef} className={`${styles.canvas} ${styles.plane}`} aria-label="Column space in the plane. Drag b." />
        </div>
      </div>
      <div className={styles.controls}>
        <label>
          s
          <input
            type="range"
            min={-1}
            max={1}
            step={0.01}
            value={s}
            aria-label="Nullspace coordinate s"
            onChange={(event) => {
              setPlaying(false);
              setS(Number(event.target.value));
            }}
          />
        </label>
        <label>
          t
          <input
            type="range"
            min={-1}
            max={1}
            step={0.01}
            value={t}
            aria-label="Nullspace coordinate t"
            onChange={(event) => {
              setPlaying(false);
              setT(Number(event.target.value));
            }}
          />
        </label>
        <button type="button" className={styles.text} aria-pressed={playing} onClick={() => setPlaying((on) => !on)}>
          {playing ? "Stop" : "Slide"}
        </button>
        <button
          type="button"
          className={styles.text}
          onClick={() => {
            setPlaying(false);
            setB([2, 4]);
            setS(0);
            setT(0);
          }}
        >
          Reachable
        </button>
        <button
          type="button"
          className={styles.text}
          onClick={() => {
            setPlaying(false);
            setB([-1, 3]);
            setS(0);
            setT(0);
          }}
        >
          No solution
        </button>
      </div>
      <div className={styles.formula}>
        <Tex source={formula} display />
      </div>
      <figcaption className={styles.caption}>
        Drag <Tex source="b" /> in the plane. <Tex source="Ax" /> can land only on the column line <Tex source="\operatorname{span}\{(1,2)\}" />. The sliders add <Tex source="s(-2,1,0)+t(-3,0,1)" /> and the point slides in the parallel flat while <Tex source="Ax" /> stays put: those two directions are the nullspace. Off the line, the copper remainder is parallel to <Tex source="(-2,1)" />, the left nullspace, and the equation has no solution. The line piercing the flats is the row space, orthogonal to both.
      </figcaption>
    </figure>
  );
}
