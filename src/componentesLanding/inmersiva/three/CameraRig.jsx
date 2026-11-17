import { useFrame, useThree } from '@react-three/fiber';
import { easing } from 'maath';
import { useEffect, useLayoutEffect } from 'react';
import { rig } from '../scroll/rig';
import { puntero, escucharPuntero } from './puntero';
import { vivo } from './vivo';

const ALTO = 95;                    // unidades visibles en alto con zoom 1 (950 m)
const DIR = [0.5576, 0.6134, 0.5576]; // (1, 1.1, 1) normalizado: axonométrica de reposo
const AZIMUT = Math.atan2(DIR[0], DIR[2]);
const ELEVACION = Math.asin(DIR[1]);
const GIRO = 0.07;                  // radianes de giro máximo con el cursor en el borde
const CABECEO = 0.045;
const INERCIA = 0.55;               // segundos: el cursor arrastra la cámara con retardo
const LEJOS = 300;
const SUAVIZADO = 0.2;              // segundos; el único amortiguado de todo el relato
const INTRO = 1.9;                  // segundos que tarda el plano en dibujarse

// Lee rig (lo escribe el director), lo amortigua una sola vez y lo deja en `vivo`.
// También encuadra: el dibujo va a la derecha en horizontal y arriba en vertical,
// porque el resto de la pantalla es del texto.
export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  useLayoutEffect(() => {
    if (rig.vertical) camera.setViewOffset(size.width, size.height, 0, size.height * 0.15, size.width, size.height);
    else camera.setViewOffset(size.width, size.height, -size.width * 0.16, 0, size.width, size.height);
    vivo.listo = false; // al cambiar el encuadre, el próximo frame salta sin viajar
    rig.requestFrame();
    return () => camera.clearViewOffset();
  }, [camera, size]);

  useEffect(() => escucharPuntero(), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const salto = rig.snap || !vivo.listo;
    if (salto) {
      Object.assign(vivo.cam, rig.cam);
      Object.assign(vivo.fx, rig.fx);
    } else {
      easing.damp(vivo.cam, 'x', rig.cam.x, SUAVIZADO, dt);
      easing.damp(vivo.cam, 'z', rig.cam.z, SUAVIZADO, dt);
      easing.damp(vivo.cam, 'lz', rig.cam.lz, SUAVIZADO, dt);
      for (const k in vivo.fx) easing.damp(vivo.fx, k, rig.fx[k], SUAVIZADO, dt);
      vivo.tiempo += dt;
    }
    vivo.listo = true;
    vivo.intro = rig.snap ? 1 : Math.min(1, vivo.intro + dt / INTRO);
    vivo.aparecen = Math.min(1, Math.max(0, (vivo.intro - 0.25) / 0.4));

    // Paralaje: el cursor gira apenas la axonometría (con inercia), así la
    // ciudad se siente un volumen. Con movimiento reducido no se mueve.
    const quieto = rig.snap;
    easing.damp(vivo.mira, 'x', quieto ? 0 : puntero.x, INERCIA, dt);
    easing.damp(vivo.mira, 'y', quieto ? 0 : puntero.y, INERCIA, dt);
    const az = AZIMUT - vivo.mira.x * GIRO;
    const el = ELEVACION + vivo.mira.y * CABECEO;
    const dx = Math.cos(el) * Math.sin(az);
    const dy = Math.sin(el);
    const dz = Math.cos(el) * Math.cos(az);

    const { x, z, lz } = vivo.cam;
    vivo.pxPorUnidad = (state.size.height / ALTO) * Math.exp(lz);
    state.camera.zoom = vivo.pxPorUnidad;
    state.camera.position.set(x + dx * LEJOS, dy * LEJOS, z + dz * LEJOS);
    state.camera.lookAt(x, 0, z);
    state.camera.updateProjectionMatrix();
    state.camera.updateMatrixWorld();
  });
  return null;
}
