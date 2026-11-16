import { useFrame, useThree } from '@react-three/fiber';
import { easing } from 'maath';
import { useLayoutEffect } from 'react';
import { rig } from '../scroll/rig';
import { vivo } from './vivo';

const ALTO = 95;                    // unidades visibles en alto con zoom 1 (950 m)
const DIR = [0.5576, 0.6134, 0.5576]; // (1, 1.1, 1) normalizado: axonométrica fija
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

    const { x, z, lz } = vivo.cam;
    vivo.pxPorUnidad = (state.size.height / ALTO) * Math.exp(lz);
    state.camera.zoom = vivo.pxPorUnidad;
    state.camera.position.set(x + DIR[0] * LEJOS, DIR[1] * LEJOS, z + DIR[2] * LEJOS);
    state.camera.lookAt(x, 0, z);
    state.camera.updateProjectionMatrix();
    state.camera.updateMatrixWorld();
  });
  return null;
}
