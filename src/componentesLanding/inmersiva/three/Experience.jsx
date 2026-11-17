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
import { Clima } from './escenas/Clima';
import { Estaciona } from './escenas/Estaciona';
import { Garage } from './escenas/Garage';
import { Jornada } from './escenas/Jornada';
import { Noche } from './escenas/Noche';
import { Onda } from './escenas/Onda';
import { Pin } from './escenas/Pin';
import { Pulsos } from './escenas/Pulsos';
import { Red } from './escenas/Red';
import { Realce } from './escenas/Realce';
import { Trafico } from './escenas/Trafico';
import { Trato } from './escenas/Trato';
import { Vueltas } from './escenas/Vueltas';
import { colorear } from './paleta';
import { CapaCelular, ProyectorCelular } from './Celular';
import { CapaEleccion, Eleccion, ProyectorEleccion } from './Eleccion';
import { CapaChats, ProyectorChats } from './Chats';
import { CapaInteraccion, ProyectorInteraccion } from './Interaccion';
import { CapaReloj, ProyectorReloj } from './Reloj';
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

// Día / noche: mientras los tokens CSS transicionan, los materiales se
// recolorean en cada frame; y `vivo.noche` va de 0 a 1 para las luces.
function CambioDeTema({ raiz, tema }) {
  const cambio = useRef({ desde: 0, ultimo: '' });
  useEffect(() => { cambio.current = { desde: performance.now(), ultimo: '' }; }, [tema]);
  useFrame((_, delta) => {
    const objetivo = tema === 'cianotipo' ? 1 : 0;
    vivo.noche += (objetivo - vivo.noche) * Math.min(1, delta * 3);
    const c = cambio.current;
    if (!c.desde || !raiz.current) return;
    // Se recolorea hasta que el token deja de cambiar (la transición CSS terminó),
    // aunque los frames vengan lentos.
    const plano = raiz.current.closest('.plano');
    const papel = getComputedStyle(plano).getPropertyValue('--papel');
    colorear(plano);
    if (papel === c.ultimo && performance.now() - c.desde > 950) c.desde = 0;
    c.ultimo = papel;
  });
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
          gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); setTier('static'); }, { once: true });
        }}
      >
        <PerformanceMonitor onDecline={() => setTier('low')} onIncline={() => setTier('high')} flipflops={3} onFallback={() => setTier('low')} />
        <CameraRig />
        {/* Geometrías y materiales son del módulo: no se descartan al desmontar una escena. */}
        <group dispose={null}>
          <Ciudad />
          <Clima />
          <Trato />
          <Vueltas />
          <Garage />
          <Estaciona />
          <Acceso />
          <Trafico />
          <Noche />
          <Pulsos />
          <Red />
          <Jornada />
          <Onda />
          <Eleccion />
          <Realce />
          <Pin />
        </group>
        <CambioDeTema raiz={escenario} tema={tema} />
        <Proyector />
        <ProyectorInteraccion />
        <ProyectorCelular />
        <ProyectorChats />
        <ProyectorReloj />
        <ProyectorEleccion />
        <FrameBridge />
        <FirstFrame onReady={() => setListo(true)} />
      </Canvas>
      <Rotulos />
      <CapaInteraccion />
      <CapaCelular />
      <CapaChats />
      <CapaReloj />
      <CapaEleccion />
    </div>
  );
}
