import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';

// A real halo, not a hard-edged ring. Two stacked smoothstep falloffs
// (ring + outer glow) plus a re-scaled inner cutout produce a soft band
// whose thickness is constant in vUv space. uIntensity modulates overall
// brightness so the active level's halo can be tied to scroll progress.
// Explicit precision declarations: fragment shader is mediump (cheap
// desktop/mobile parity), vertex shader defaults to highp (positions).
const ParkingGlowMaterial = shaderMaterial(
  {
    uTime: 0,
    uIntensity: 1,
    uColor: new THREE.Color('#2563EB'),
    uRingRadius: 0.62,
    uRingWidth: 0.05,
    uGlowWidth: 0.22,
  },
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    precision mediump float;

    uniform float uTime;
    uniform float uIntensity;
    uniform vec3 uColor;
    uniform float uRingRadius;
    uniform float uRingWidth;
    uniform float uGlowWidth;

    varying vec2 vUv;

    void main() {
      // Distance from the texture center (0.5, 0.5) — the plane is square
      // so this is a true radial distance, no aspect correction needed.
      float d = distance(vUv, vec2(0.5));

      // Inner core ring — a bright band of half-width uRingWidth around
      // uRingRadius. smoothstep gives a soft but readable edge.
      float ring = smoothstep(uRingRadius + uRingWidth, uRingRadius, d)
                 * smoothstep(uRingRadius - uRingWidth, uRingRadius, d);

      // Outer halo — same band but with a much wider, weaker falloff so it
      // reads as a glow rather than another ring. Math-based (mix of two
      // smoothsteps), no branching.
      float glow = smoothstep(uRingRadius + uGlowWidth, uRingRadius, d)
                 * smoothstep(uRingRadius - uRingWidth, uRingRadius + uGlowWidth * 0.25, d)
                 * 0.45;

      // Pulse slows down at low intensity (calm) and brightens at peaks.
      float pulse = 0.7 + 0.3 * sin(uTime * 1.6);
      float alpha = (ring + glow) * pulse * uIntensity;

      // Pre-multiplied-ish blend: color fades with alpha so the dark bg
      // shows through naturally without a hard cutoff.
      gl_FragColor = vec4(uColor, clamp(alpha, 0.0, 1.0));
    }
  `
);

extend({ ParkingGlowMaterial });

export default ParkingGlowMaterial;
