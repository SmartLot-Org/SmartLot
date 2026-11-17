import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { BufferAttribute, BufferGeometry, DoubleSide, Mesh, MeshBasicMaterial, Raycaster, Vector2 } from 'three';
import { geometria } from '../geometria';
import { caja, CARAS_GARAGES, cuadro, EDIFICIOS, GARAGES, MUNDO } from '../mundo';
import { MAT } from '../paleta';
import { puntero } from '../puntero';
import { vivo } from '../vivo';

const TRIANGULOS_POR_CAJA = 10;       // caja(): 5 caras × 2 triángulos
const ZOOM_MAXIMO = Math.log(4);      // solo a escala de ciudad
const ALZA = 0.9;                     // el volumen "se levanta" un poco al pasar

// Contorno y techo del volumen realzado: del módulo, se reescriben al cambiar.
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

const doble = () => new MeshBasicMaterial({ side: DoubleSide });

// Un garage tiene ficha solo cuando está marcado en el plano: los tres del
// inicio siempre; los que se suman, desde que se pintan en el cierre.
const garageActivo = (i) => i < 3 || vivo.fx.red > 0.5;

// Qué hay bajo el cursor: un rayo contra los garages y los edificios.
// Deja el resultado en `puntero` (lo leen la mira y la ficha) y realza en azul
// señal el volumen apuntado, que se alza apenas.
export function Realce() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const blancos = useMemo(() => ({
    ciudad: new Mesh(geometria(MUNDO.ciudad.caras), doble()),
    garages: new Mesh(geometria(CARAS_GARAGES), doble()),
  }), []);
  const rayo = useMemo(() => new Raycaster(), []);
  const ndc = useMemo(() => new Vector2(), []);
  const grupo = useRef(null);
  const estado = useRef({ clave: '', intensidad: 0, alto: 1 });

  useFrame((_, delta) => {
    const s = estado.current;
    const ciudad = vivo.cam.lz < ZOOM_MAXIMO && vivo.fx.tapa < 0.05 && vivo.aparecen > 0.99;
    const habilitado = puntero.activo && !puntero.sobreUI && ciudad;
    if (!ciudad) puntero.fijado = -1;

    if (!habilitado) {
      puntero.edificio = -1;
      puntero.garage = -1;
    } else {
      // Se mide en cada frame: con el scroll la cámara se mueve aunque el mouse no.
      const r = gl.domElement.getBoundingClientRect();
      ndc.set(((puntero.cx - r.left) / r.width) * 2 - 1, -((puntero.cy - r.top) / r.height) * 2 + 1);
      rayo.setFromCamera(ndc, camera);

      const g = rayo.intersectObject(blancos.garages, false)[0];
      const ig = g ? Math.floor(g.faceIndex / TRIANGULOS_POR_CAJA) : -1;
      puntero.garage = ig >= 0 && garageActivo(ig) ? ig : -1;
      const e = puntero.garage < 0 ? rayo.intersectObject(blancos.ciudad, false)[0] : null;
      puntero.edificio = e ? Math.floor(e.faceIndex / TRIANGULOS_POR_CAJA) : -1;
    }

    // El volumen a realzar: el garage con ficha fijada, o lo que está bajo el cursor.
    const ig = puntero.fijado >= 0 ? puntero.fijado : puntero.garage;
    const clave = ig >= 0 ? `g${ig}` : puntero.edificio >= 0 ? `e${puntero.edificio}` : '';
    if (clave !== s.clave) {
      if (clave) {
        const volumen = ig >= 0 ? GARAGES[ig] : EDIFICIOS[puntero.edificio];
        dibujar(volumen);
        s.alto = volumen.h;
        s.intensidad = 0;       // cada volumen nuevo se alza desde abajo
      }
      s.clave = clave;
    }

    const objetivo = ciudad && clave ? 1 : 0;
    s.intensidad += (objetivo - s.intensidad) * Math.min(1, delta * (objetivo ? 9 : 5));
    grupo.current.visible = s.intensidad > 0.01;
    if (!grupo.current.visible) return;
    MAT.realce.opacity = s.intensidad;
    MAT.realceTecho.opacity = s.intensidad * 0.22;
    // Escala en Y desde el suelo: el contorno crece de h a h + ALZA.
    grupo.current.scale.y = 1 + (ALZA / s.alto) * s.intensidad;
  });

  return (
    <group ref={grupo} visible={false} renderOrder={7}>
      <lineSegments geometry={geo.aristas} material={MAT.realce} renderOrder={7} />
      <mesh geometry={geo.techo} material={MAT.realceTecho} renderOrder={7} />
    </group>
  );
}
