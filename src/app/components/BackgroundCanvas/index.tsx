"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

/**
 * 粒子背景（約2,000点）
 * - 常時ゆる回転＋ドリフト（ポインタ不動でも自然に揺れる）
 * - ポインタ/タップ/スクロール周辺で局所反発
 * - positions配列を直接更新（attr.needsUpdate = true）
 * - reduced-motion / 非表示タブで停止
 */
function Stars() {
  const pointsRef = useRef<THREE.Points>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matRef = useRef<any>(null);

  const [motionRatio, setMotionRatio] = useState(1);
  const [pulse, setPulse] = useState(0); // 触れたときのサイズブースト
  const baseSize = 0.12;

  // 作用点（-1..1 正規化）
  const pointer = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 元位置（固定）と作業用
  const positions = useMemo(() => {
    const n = 2000;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 1.2 + Math.random() * 1.3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  const work = useMemo(() => new Float32Array(positions), [positions]);

  // --- ドリフト用の乱数（各軸: 速度/位相/振幅） ---
  const drift = useMemo(() => {
    const n = positions.length / 3;
    const speed = new Float32Array(n);
    const phaseX = new Float32Array(n);
    const phaseY = new Float32Array(n);
    const phaseZ = new Float32Array(n);
    const ampX = new Float32Array(n);
    const ampY = new Float32Array(n);
    const ampZ = new Float32Array(n);

    for (let i = 0; i < n; i++) {
      // 速度はゆっくり（0.15〜0.4 rad/sec）
      speed[i] = 0.1 + Math.random() * 0.25;
      // 各軸の初期位相
      phaseX[i] = Math.random() * Math.PI * 2;
      phaseY[i] = Math.random() * Math.PI * 2;
      phaseZ[i] = Math.random() * Math.PI * 2;
      // 振幅はごく小さく（0.01〜0.045）
      const baseAmp = 0.1 + Math.random() * 0.035;
      ampX[i] = baseAmp;
      ampY[i] = baseAmp * (0.9 + Math.random() * 0.2);
      ampZ[i] = baseAmp * (0.9 + Math.random() * 0.2);
    }
    return { speed, phaseX, phaseY, phaseZ, ampX, ampY, ampZ, t: 0 };
  }, [positions]);

  // reduced-motion / visibility
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const update = () => setMotionRatio(mq?.matches ? 0 : 1);
    update();
    mq?.addEventListener?.("change", update);

    const onVis = () =>
      setMotionRatio(() =>
        document.hidden
          ? 0
          : window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
          ? 0
          : 1
      );
    document.addEventListener("visibilitychange", onVis);

    return () => {
      mq?.removeEventListener?.("change", update);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // 画面全体の入力を拾う（Canvasが下層でもOK）
  useEffect(() => {
    const toNDC = (clientX: number, clientY: number) => {
      const x = (clientX / window.innerWidth) * 2 - 1;
      const y = -((clientY / window.innerHeight) * 2 - 1);
      pointer.current.x = x;
      pointer.current.y = y;
    };

    const onMove = (e: PointerEvent) => toNDC(e.clientX, e.clientY);
    const onDown = () => setPulse(0.8);
    const onWheel = () => setPulse((p) => Math.max(p, 0.6));
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) toNDC(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current || motionRatio === 0) return;

    // --- 常時のゆる回転（ベース） ---
    const rot = delta * 0.02 * motionRatio;
    pointsRef.current.rotation.y += rot;

    // --- ポインタ方向へのパララックス ---
    const targetX = pointer.current.y * 0.3;
    const targetY = pointer.current.x * 0.3;
    pointsRef.current.rotation.x +=
      (targetX - pointsRef.current.rotation.x) * 0.04 * motionRatio;
    pointsRef.current.rotation.y +=
      (targetY - pointsRef.current.rotation.y) * 0.04 * motionRatio;

    // --- タイム進行（ドリフト用） ---
    drift.t += delta;

    // 影響設定
    const radius = 0.6 + pulse * 0.2; // 触れている間は広め
    const strength = 0.25 + pulse * 0.25; // 触れている間は強め
    const influenceScale = 1.6; // NDC→シーン座標ざっくりマッピング
    const cx = pointer.current.x * influenceScale;
    const cy = pointer.current.y * influenceScale;

    // スプリング強度（原位置+ドリフトへの戻り）
    const spring = 0.075;

    const n = work.length / 3;
    for (let i = 0; i < n; i++) {
      const bi = i * 3;

      // 原位置
      const bx = positions[bi];
      const by = positions[bi + 1];
      const bz = positions[bi + 2];

      // --- ドリフト基準（原位置に対して微小な揺れを加算） ---
      const w = drift.speed[i];
      const dxDrift = Math.sin(drift.t * w + drift.phaseX[i]) * drift.ampX[i];
      const dyDrift =
        Math.sin(drift.t * (w * 0.9) + drift.phaseY[i]) * drift.ampY[i];
      const dzDrift =
        Math.sin(drift.t * (w * 1.1) + drift.phaseZ[i]) * drift.ampZ[i];

      const tx = bx + dxDrift;
      const ty = by + dyDrift;
      const tz = bz + dzDrift;

      // 現在位置
      let x = work[bi];
      let y = work[bi + 1];
      let z = work[bi + 2];

      // --- ローカル反発（x,y平面の距離で判定） ---
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < radius) {
        const t = 1 - dist / radius; // 0..1
        const force = strength * (t * t);
        const inv = dist > 1e-4 ? 1 / dist : 0;
        x += dx * inv * force;
        y += dy * inv * force;
      }

      // --- ドリフト目標へスプリング戻り（なめらかに追従） ---
      x += (tx - x) * spring;
      y += (ty - y) * spring;
      z += (tz - z) * spring;

      work[bi] = x;
      work[bi + 1] = y;
      work[bi + 2] = z;
    }

    // BufferAttribute更新
    const attr = (
      pointsRef.current.geometry as THREE.BufferGeometry
    ).getAttribute("position") as THREE.BufferAttribute;
    attr.needsUpdate = true;

    // サイズのパルス減衰
    if (matRef.current) {
      const targetSize = baseSize * (1 + pulse);
      matRef.current.size += (targetSize - matRef.current.size) * 0.15;
    }
    if (pulse > 0.001) setPulse((p) => p * 0.9);
  });

  return (
    <Points ref={pointsRef} positions={work} stride={3}>
      <PointMaterial
        ref={matRef}
        size={baseSize}
        sizeAttenuation
        depthWrite={false}
        transparent
        opacity={0.9}
        color="#0b6585"
      />
    </Points>
  );
}

export default function BackgroundCanvas() {
  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{ position: [0, 0, 3.5], fov: 60 }}
      gl={{ antialias: true, powerPreference: "low-power", alpha: true }}
    >
      <ambientLight intensity={0.4} />
      <Stars />
    </Canvas>
  );
}
