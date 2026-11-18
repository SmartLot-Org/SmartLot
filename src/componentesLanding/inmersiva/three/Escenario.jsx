// Lo común a las composiciones 3D de las páginas del plano: el Canvas, el monitor de
// rendimiento, la cámara, el puente de frames, el aviso del primer cuadro, el contexto
// perdido y los colores desde los tokens. Cada página trae sus escenas (children, dentro
// del Canvas) y sus capas HTML (capas, encima del Canvas). Todo acá es decorativo.
import { PerformanceMonitor } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useUI } from '../estado/store';
import { rig } from '../scroll/rig';
import { CameraRig } from './CameraRig';
import { colorear } from './paleta';
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

// CameraRig va primero y FirstFrame al final: los useFrame corren en el orden en que se
// montan, así la cámara y `vivo` quedan escritos antes de que las escenas los lean.
// `conIntro` en false: la página no tiene el cajetín de entrada de la home, así que el
// plano no lo espera (si no, en una primera visita no se dibujaría nunca).
export function Escenario({ children, capas, conIntro = true }) {
  const tier = useUI((s) => s.tier);
  const setTier = useUI((s) => s.setTier);
  const perderContexto = useUI((s) => s.perderContexto);
  const [listo, setListo] = useState(false);
  const escenario = useRef(null);
  const reducido = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  // Los materiales toman sus colores de los tokens CSS de .plano.
  useEffect(() => {
    colorear(escenario.current.closest('.plano'));
    rig.requestFrame();
  }, []);

  // El plano se dibuja de nuevo cada vez que se monta.
  useEffect(() => { vivo.intro = 0; vivo.listo = false; }, []);

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
          // Al salir de la página, R3F libera el contexto a propósito con el lienzo ya
          // fuera de la página: eso no es una falla y no tiene que dejarla sin 3D.
          const lienzo = gl.domElement;
          lienzo.addEventListener('webglcontextlost', (e) => {
            if (!lienzo.isConnected) return;
            e.preventDefault();
            perderContexto();
          }, { once: true });
        }}
      >
        <PerformanceMonitor onDecline={() => setTier('low')} onIncline={() => setTier('high')} flipflops={3} onFallback={() => setTier('low')} />
        <CameraRig conIntro={conIntro} />
        {children}
        <FrameBridge />
        <FirstFrame onReady={() => setListo(true)} />
      </Canvas>
      {capas}
    </div>
  );
}
