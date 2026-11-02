"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { watchTheme } from "@/components/theme";
import { Tex } from "./Tex";
import { tone } from "./plane";
import { GREEN, INK, createStage, makeArrow, recolor, setArrow, setThemeColor, fmt } from "./scene";
import styles from "./figures.module.css";

const SAMPLE = new THREE.Vector3(0.7, 0.45, 0.35);

function lpNorm(x: number, y: number, z: number, p: number) {
  if (!Number.isFinite(p)) return Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
  return (Math.abs(x) ** p + Math.abs(y) ** p + Math.abs(z) ** p) ** (1 / p);
}

export function LpBall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sliceRef = useRef<HTMLCanvasElement>(null);
  const updateRef = useRef<(p: number) => void>(() => {});
  const [p, setP] = useState(2);
  const [infinite, setInfinite] = useState(false);
  const [playing, setPlaying] = useState(false);
  const value = infinite ? Infinity : p;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { scene, renderer, controls, resize } = createStage(canvas, new THREE.Vector3(3.5, 2.6, 3.7));
    const segU = 80;
    const segV = 48;
    const positions = new Float32Array((segU + 1) * (segV + 1) * 3);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const index: number[] = [];
    for (let i = 0; i < segV; i++) {
      for (let j = 0; j < segU; j++) {
        const a = i * (segU + 1) + j;
        index.push(a, a + segU + 1, a + 1, a + 1, a + segU + 1, a + segU + 2);
      }
    }
    geom.setIndex(index);
    const material = new THREE.MeshStandardMaterial({
      color: GREEN,
      roughness: 0.48,
      metalness: 0.02,
      transparent: true,
      opacity: 0.86,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    setThemeColor(material, GREEN);
    scene.add(new THREE.Mesh(geom, material));
    const sample = makeArrow(INK);
    scene.add(sample);
    setArrow(sample, SAMPLE);

    updateRef.current = (next) => {
      let t = 0;
      for (let i = 0; i <= segV; i++) {
        const phi = (Math.PI * i) / segV;
        for (let j = 0; j <= segU; j++) {
          const theta = (2 * Math.PI * j) / segU;
          const x = Math.sin(phi) * Math.cos(theta);
          const y = Math.sin(phi) * Math.sin(theta);
          const z = Math.cos(phi);
          const n = lpNorm(x, y, z, next);
          const s = n === 0 ? 0 : 1 / n;
          positions[t++] = x * s;
          positions[t++] = y * s;
          positions[t++] = z * s;
        }
      }
      geom.attributes.position.needsUpdate = true;
      geom.computeVertexNormals();
      setThemeColor(material, next < 1 ? 0x8a3e2a : GREEN);
    };
    updateRef.current(2);

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
      geom.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    updateRef.current(value);
    drawSlice(sliceRef.current, value);
    return watchTheme(() => {
      updateRef.current(value);
      drawSlice(sliceRef.current, value);
    });
  }, [value]);

  useEffect(() => {
    if (!playing) return;
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const u = ((now - started) % 9000) / 9000;
      const sweep = u < 0.82 ? 1 + (u / 0.82) * 15 : Infinity;
      if (sweep === Infinity) {
        setInfinite(true);
      } else {
        setInfinite(false);
        setP(Math.round(sweep * 20) / 20);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const length = lpNorm(SAMPLE.x, SAMPLE.y, SAMPLE.z, value);
  const sum = 2 ** (1 / (Number.isFinite(value) ? value : 80));
  const pTex = infinite ? "\\infty" : fmt(value);
  const formula = [
    `\\|x\\|_p=\\left(\\sum_i |x_i|^p\\right)^{1/p},\\quad p=${pTex}`,
    `\\qquad \\|v\\|_p=${fmt(length)}`,
    length <= 1 ? "\\le 1" : "> 1",
    value < 1
      ? `\\qquad \\|e_1\\|_p+\\|e_2\\|_p=2 < \\|e_1+e_2\\|_p=${fmt(sum)}`
      : "",
  ].join(" ");

  return (
    <figure className={styles.figure}>
      <div className={styles.views}>
        <div>
          <p className={styles.viewLabel}>
            <Tex source="\mathbb{R}^3" />
          </p>
          <canvas ref={canvasRef} className={styles.canvas} aria-label="Unit sphere of the Lp norm in three dimensions" />
        </div>
        <div>
          <p className={styles.viewLabel}>
            <Tex source="x_3=0" />
          </p>
          <canvas ref={sliceRef} className={styles.slice} aria-label="Planar slice of the Lp unit circle" />
        </div>
      </div>
      <div className={styles.controls}>
        <label>
          p
          <input
            type="range"
            min={0.5}
            max={12}
            step={0.1}
            value={infinite ? 12 : p}
            aria-label="Exponent p"
            onChange={(event) => {
              setPlaying(false);
              setInfinite(false);
              setP(Number(event.target.value));
            }}
          />
        </label>
        <button
          type="button"
          className={styles.text}
          aria-pressed={infinite}
          onClick={() => {
            setPlaying(false);
            setInfinite((on) => !on);
          }}
        >
          p = ∞
        </button>
        <button type="button" className={styles.text} aria-pressed={playing} onClick={() => setPlaying((on) => !on)}>
          {playing ? "Stop" : "Play"}
        </button>
      </div>
      <div className={styles.formula}>
        <Tex source={formula} display />
      </div>
      <figcaption className={styles.caption}>
        The surface is <Tex source="\|x\|_p=1" />. As <Tex source="p" /> grows it passes from the octahedron through the sphere to the cube. For <Tex source="p<1" /> the straight segment between <Tex source="e_1" /> and <Tex source="e_2" /> leaves the set, so the triangle inequality fails.
      </figcaption>
    </figure>
  );
}

function drawSlice(canvas: HTMLCanvasElement | null, p: number) {
  if (!canvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || 280;
  const h = canvas.clientHeight || 320;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;
  const scale = Math.min(w, h) * 0.36;
  ctx.strokeStyle = tone("rgba(28,27,24,0.25)");
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(16, cy);
  ctx.lineTo(w - 12, cy);
  ctx.moveTo(cx, 14);
  ctx.lineTo(cx, h - 16);
  ctx.stroke();
  ctx.strokeStyle = tone(p < 1 ? "#8a3e2a" : "#1d4e48");
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let i = 0; i <= 360; i++) {
    const theta = (i * Math.PI) / 180;
    const x = Math.cos(theta);
    const y = Math.sin(theta);
    const n = Number.isFinite(p) ? (Math.abs(x) ** p + Math.abs(y) ** p) ** (1 / p) : Math.max(Math.abs(x), Math.abs(y));
    const px = cx + (x / n) * scale;
    const py = cy - (y / n) * scale;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
}
