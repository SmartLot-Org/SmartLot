// Chunk 3D: se carga con lazy() desde Landing, que no lo monta con tier
// 'static', con ?sin3d ni antes de inicializar. Todo acá es decorativo.
import { PerformanceMonitor } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useUI } from '../estado/store';
import { rig } from '../scroll/rig';
import { CameraRig } from './CameraRig';
import { Acceso } from './escenas/Acceso';
import { Ciudad } from './escenas/Ciudad';
import { Garage } from './escenas/Garage';
import { Trato } from './escenas/Trato';
import { Vueltas } from './escenas/Vueltas';
import { colorear } from './paleta';
import { Proyector, Rotulos } from './Rotulos';
import { vivo } from './vivo';

// La capa DOM pide frames (movimiento reducido, frameloop "demand") sin importar R3F.
function FrameBridge() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    rig.requestFrame = () => invalidate();
    return () => { rig.requestFrame = () => {}; };
  }, [invalidate]);
  return null;
}

// Avisa una sola vez, cuando ya se dibujó el primer frame con las escenas montadas.
function FirstFrame({ onReady }) {
  const hecho = useRef(false);
  useFrame(() => {
    if (hecho.current) return;
    hecho.current = true;
    onReady();
  });
  return null;
}

export default function Experience() {
  const tier = useUI((s) => s.tier);
  const tema = useUI((s) => s.tema);
  const setTier = useUI((s) => s.setTier);
  const [listo, setListo] = useState(false);
  const escenario = useRef(null);
  const reducido = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  // Los materiales toman sus colores de los tokens CSS de .plano (según el tema).
  useEffect(() => {
    colorear(escenario.current.closest('.plano'));
    rig.requestFrame();
  }, [tema]);

  // El plano se dibuja de nuevo cada vez que se monta.
  useEffect(() => { vivo.intro = 0; vivo.listo = false; }, []);

  // Al desmontar, R3F libera el contexto WebGL a propósito: eso no es una pérdida.
  const montado = useRef(true);
  useEffect(() => {
    montado.current = true;
    return () => { montado.current = false; };
  }, []);

  return (
    <div ref={escenario} className="plano-escenario" data-listo={listo} aria-hidden="true">
      <Canvas
        orthographic
        flat
        dpr={tier === 'high' ? [1, 2] : 1}
        frameloop={reducido ? 'demand' : 'always'}
        camera={{ near: 1, far: 1000, position: [300, 330, 300] }}
        // `gl` se lee una sola vez, al crear el contexto: no depende del tier.
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          // En celular el contexto WebGL se puede perder: se pasa a la versión estática.
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            if (!montado.current) return;
            e.preventDefault();
            setTier('static');
          }, { once: true });
        }}
      >
        <PerformanceMonitor onDecline={() => setTier('low')} onIncline={() => setTier('high')} flipflops={3} onFallback={() => setTier('low')} />
        <CameraRig />
        {/* Geometrías y materiales son del módulo: no se descartan al desmontar una escena. */}
        <group dispose={null}>
          <Ciudad />
          <Trato />
          <Vueltas />
          <Garage />
          <Acceso />
        </group>
        <Proyector />
        <FrameBridge />
        <FirstFrame onReady={() => setListo(true)} />
      </Canvas>
      <Rotulos />
    </div>
  );
}
