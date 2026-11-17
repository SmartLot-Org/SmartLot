import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { BufferAttribute, BufferGeometry, DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector2 } from 'three';
import { geometria } from '../geometria';
import { caja, cuadro, EDIFICIOS, MUNDO } from '../mundo';
import { MAT } from '../paleta';
import { puntero } from '../puntero';
import { vivo } from '../vivo';

const TRIANGULOS_POR_EDIFICIO = 10;   // caja(): 5 caras × 2 triángulos
const ZOOM_MAXIMO = Math.log(4);      // solo a escala de ciudad
const ALZA = 0.9;                     // el edificio "se levanta" un poco al pasar

// Contorno y techo del edificio realzado: del módulo, se reescriben al cambiar de edificio.
const geo = { aristas: new BufferGeometry(), techo: new BufferGeometry() };
geo.aristas.setAttribute('position', new BufferAttribute(new Float32Array(24 * 3), 3));
geo.techo.setAttribute('position', new BufferAttribute(new Float32Array(6 * 3), 3));

function dibujar(e) {
  const a = [];
  const t = [];
  caja(null, a, e.x0 - 0.05, e.z0 - 0.05, e.x1 + 0.05, e.z1 + 0.05, e.h);
  cuadro(t, e.x0, e.z0, e.x1, e.z1, e.h + 0.03);
  for (const [g, datos] of [[geo.aristas, a], [geo.techo, t]]) {
    g.attributes.position.array.set(datos);
    g.attributes.position.needsUpdate = true;
    g.computeBoundingSphere();
  }
}

// El edificio bajo el cursor se dibuja en azul señal y se alza apenas: la
// ciudad responde al mouse. Se busca con un rayo contra las caras de la ciudad
// (una sola malla: el índice del triángulo dice qué edificio es).
export function Realce() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const blanco = useMemo(() => new Mesh(geometria(MUNDO.ciudad.caras), new MeshBasicMaterial({ side: DoubleSide })), []);
  const rayo = useMemo(() => new Raycaster(), []);
  const ndc = useMemo(() => new Vector2(), []);
  const grupo = useRef(null);
  const estado = useRef({ actual: -1, intensidad: 0 });

  useFrame((_, delta) => {
    const s = estado.current;
    const habilitado = puntero.activo && vivo.cam.lz < ZOOM_MAXIMO && vivo.fx.tapa < 0.05 && vivo.aparecen > 0.99;

    if (habilitado && puntero.movido) {
      puntero.movido = false;
      const r = gl.domElement.getBoundingClientRect();
      ndc.set(((puntero.cx - r.left) / r.width) * 2 - 1, -((puntero.cy - r.top) / r.height) * 2 + 1);
      rayo.setFromCamera(ndc, camera);
      const golpe = rayo.intersectObject(blanco, false)[0];
      const indice = golpe ? Math.floor(golpe.faceIndex / TRIANGULOS_POR_EDIFICIO) : -1;
      if (indice !== s.actual) {
        if (indice >= 0) {
          dibujar(EDIFICIOS[indice]);
          s.intensidad = 0;       // cada edificio nuevo se alza desde abajo
        }
        s.actual = indice;
      }
    }

    const objetivo = habilitado && s.actual >= 0 ? 1 : 0;
    s.intensidad += (objetivo - s.intensidad) * Math.min(1, delta * (objetivo ? 9 : 5));
    grupo.current.visible = s.intensidad > 0.01;
    if (!grupo.current.visible) return;
    MAT.realce.opacity = s.intensidad;
    MAT.realceTecho.opacity = s.intensidad * 0.22;
    const e = EDIFICIOS[s.actual] ?? { h: 1 };
    // Escala en Y desde el suelo: el contorno crece de h a h + ALZA.
    grupo.current.scale.y = 1 + (ALZA / e.h) * s.intensidad;
  });

  return (
    <group ref={grupo} visible={false} renderOrder={7}>
      <lineSegments geometry={geo.aristas} material={MAT.realce} renderOrder={7} />
      <mesh geometry={geo.techo} material={MAT.realceTecho} renderOrder={7} />
    </group>
  );
}
