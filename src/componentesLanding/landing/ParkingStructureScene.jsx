import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instances, Instance } from '@react-three/drei';
import { DoubleSide } from 'three';
import './parkingGlowMaterial';

function seededRandom(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

const LEVEL_GAP = 3.2;
const SPOTS_PER_LEVEL = 8;
const LEVEL_WIDTH = 4.6;
const LEVEL_DEPTH = 2.8;
const ACTIVE_COLOR = '#3B82F6';
const IDLE_COLOR = '#2A4270';
// Exactly 1.5x LEVEL_GAP — the point of *maximum* distance from every
// integer multiple of the gap (mod LEVEL_GAP it sits exactly at the
// halfway mark, 1.6). Any offset close to a multiple of the gap makes the
// camera's height coincidentally land near some *other* level's height at
// some point during the descent, viewing its spots edge-on/from underneath
// (invisible) — this value keeps it maximally clear of that at every point.
const CAMERA_HEIGHT_OFFSET = LEVEL_GAP * 1.5;
const CAMERA_PAN_AMPLITUDE = 2.2;
const CAMERA_Z_AMPLITUDE = 0.9; // small Z-bob so the descent reads as 3D,
// not as a pure Y-axis translate. Tied to scrollProgress so it's stable
// per scroll position (no jitter on reversal).

// Four corner pillars per level — instanced as one draw call across all
// levels. Reuses Instances' limit/range pattern with a base geometry that
// is shared, so no per-frame allocation.
const PILLAR_OFFSETS = [
  [ LEVEL_WIDTH / 2 - 0.2,  LEVEL_DEPTH / 2 - 0.2],
  [-LEVEL_WIDTH / 2 + 0.2,  LEVEL_DEPTH / 2 - 0.2],
  [ LEVEL_WIDTH / 2 - 0.2, -LEVEL_DEPTH / 2 + 0.2],
  [-LEVEL_WIDTH / 2 + 0.2, -LEVEL_DEPTH / 2 + 0.2],
];

export default function ParkingStructureScene({ scrollProgressRef, levelCount = 4 }) {
  const glowRef = useRef(null);
  const glowGroupRef = useRef(null);
  const activeLevelRef = useRef(-1);
  const [activeLevel, setActiveLevel] = useState(0);

  const spotPositions = useMemo(() => (
    Array.from({ length: levelCount * SPOTS_PER_LEVEL }, (_, i) => {
      const level = Math.floor(i / SPOTS_PER_LEVEL);
      const slot = i % SPOTS_PER_LEVEL;
      const jitter = seededRandom(i * 13) * 0.3 - 0.15;
      return {
        level,
        position: [
          (slot - (SPOTS_PER_LEVEL - 1) / 2) * 0.62,
          -level * LEVEL_GAP + 0.12,
          jitter,
        ],
      };
    })
  ), [levelCount]);

  // Pillar positions are stable per (level, corner) — memoized once so the
  // geometry stays put across renders. 4 corners × levelCount pillars.
  const pillarPositions = useMemo(() => {
    const out = [];
    for (let l = 0; l < levelCount; l++) {
      for (let c = 0; c < PILLAR_OFFSETS.length; c++) {
        const [px, pz] = PILLAR_OFFSETS[c];
        out.push({ position: [px, -l * LEVEL_GAP, pz] });
      }
    }
    return out;
  }, [levelCount]);

  // activeLevel only flips levelCount-1 times across the whole scroll range
  // (a handful of discrete transitions, not a per-frame value), so driving
  // which Instances group each spot belongs to via React state — rather than
  // mutating InstancedMesh.instanceColor imperatively — is the simpler,
  // guaranteed-correct choice here without violating the "no setState in the
  // render loop" rule.
  const idleSpots = useMemo(() => spotPositions.filter((s) => s.level !== activeLevel), [spotPositions, activeLevel]);
  const activeSpots = useMemo(() => spotPositions.filter((s) => s.level === activeLevel), [spotPositions, activeLevel]);

  useFrame((state, delta) => {
    const progress = scrollProgressRef.current ?? 0;
    // Continuous 0..(levelCount-1) position along the descent — the single
    // source of truth for both the camera target and which level counts as
    // "active". Deriving activeLevel from a *different* scale (e.g. equal
    // 1/levelCount buckets) than the camera's own motion causes the
    // highlighted level to drift out of sync with where the camera actually
    // is, most visibly right at the level-count boundaries.
    const levelProgress = progress * (levelCount - 1);
    const targetY = -levelProgress * LEVEL_GAP;
    const targetX = Math.sin(progress * Math.PI) * CAMERA_PAN_AMPLITUDE;
    // Z-bob traces a value symmetric around 10 (the initial camera Z) —
    // dolly in by up to CAMERA_Z_AMPLITUDE unit at mid-progress, back out
    // at the ends, so the very start and end keep the framing established
    // by the camera prop in <Canvas>.
    const targetZ = 10 - Math.sin(progress * Math.PI) * CAMERA_Z_AMPLITUDE;
    const lerp = Math.min(1, delta * 4);

    state.camera.position.y += (targetY + CAMERA_HEIGHT_OFFSET - state.camera.position.y) * lerp;
    state.camera.position.x += (targetX - state.camera.position.x) * lerp;
    state.camera.position.z += (targetZ - state.camera.position.z) * lerp;
    // Slight rightward look offset (-0.6 on x): parks the structure in the
    // viewport's right/center zone, clear of the left-side text column and
    // its narrow scrim, so the drawing reads fully lit.
    state.camera.lookAt(-0.6, targetY, 0);

    if (glowRef.current) {
      glowRef.current.uTime = state.clock.elapsedTime;
      // Brighten the halo as the active level's mid-progress approaches,
      // dim slightly at level boundaries so the ring "breathes" in sync
      // with the camera's arrival. Triangular wave in [0,1] within each
      // 1/(levelCount-1) sub-window, peaks at the midpoint.
      const local = (levelProgress - Math.floor(levelProgress))
        * 2 * (levelProgress > Math.floor(levelProgress) ? 1 : 0);
      const peak = 1 - Math.abs(local - 1);
      glowRef.current.uIntensity = 0.6 + 0.4 * peak;
    }

    const level = Math.min(levelCount - 1, Math.max(0, Math.round(levelProgress)));
    if (level !== activeLevelRef.current) {
      activeLevelRef.current = level;
      if (glowGroupRef.current) {
        glowGroupRef.current.position.y = -level * LEVEL_GAP + 0.2;
      }
      setActiveLevel(level);
    }
  });

  return (
    <group>
      <ambientLight intensity={0.7} />
      <pointLight position={[4, 6, 6]} intensity={1.0} color="#6C93D6" />
      <pointLight position={[-4, -3, -4]} intensity={0.45} color="#2563EB" />

      {/* Level slabs — one Instances draw call. Same as before; geometry
          unchanged (still recognizable as a parking-deck beam). */}
      <Instances limit={levelCount} range={levelCount}>
        <boxGeometry args={[LEVEL_WIDTH, 0.14, LEVEL_DEPTH]} />
        <meshStandardMaterial color="#1C2F52" emissive="#0C1E3F" emissiveIntensity={0.4} roughness={0.6} metalness={0.15} />
        {Array.from({ length: levelCount }).map((_, i) => (
          <Instance key={i} position={[0, -i * LEVEL_GAP, 0]} />
        ))}
      </Instances>

      {/* Corner pillars — gives each level a visible structural frame so
          the four slabs read as a stacked garage, not floating beams.
          Single Instances group = one draw call for all 4 × levelCount. */}
      <Instances limit={levelCount * 4} range={pillarPositions.length}>
        <cylinderGeometry args={[0.08, 0.08, LEVEL_GAP * 0.95, 6]} />
        <meshStandardMaterial color="#24395F" emissive="#0C1E3F" emissiveIntensity={0.25} roughness={0.7} />
        {pillarPositions.map((p, i) => (
          <Instance key={`pillar-${i}`} position={p.position} />
        ))}
      </Instances>

      {/* Spot planes — enlarged from 0.56×0.96 to 0.9×1.6 so each spot
          actually reads as a parking space at camera distance ~9–11 units.
          Two single-color Instances groups (idle vs. active) instead of
          one instance-colored mesh — simpler and renders reliably. */}
      <Instances limit={levelCount * SPOTS_PER_LEVEL} range={idleSpots.length}>
        <planeGeometry args={[0.9, 1.6]} />
        <meshBasicMaterial color={IDLE_COLOR} side={DoubleSide} toneMapped={false} />
        {idleSpots.map((s) => (
          <Instance key={`idle-${s.position.join(',')}`} position={s.position} rotation={[-Math.PI / 2, 0, 0]} />
        ))}
      </Instances>

      <Instances limit={SPOTS_PER_LEVEL} range={activeSpots.length}>
        <planeGeometry args={[0.9, 1.6]} />
        <meshBasicMaterial color={ACTIVE_COLOR} side={DoubleSide} toneMapped={false} />
        {activeSpots.map((s) => (
          <Instance key={`active-${s.position.join(',')}`} position={s.position} rotation={[-Math.PI / 2, 0, 0]} />
        ))}
      </Instances>

      {/* Halo plane — replaced the thin wire torus with a 6×6 plane using
          the parkingGlowMaterial. The plane is rotated flat; the shader
          draws the radial halo in vUv space. Bigger than the level so the
          outer glow can extend past the slab edge. */}
      <group ref={glowGroupRef}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[6, 6]} />
          <parkingGlowMaterial ref={glowRef} transparent />
        </mesh>
      </group>
    </group>
  );
}
