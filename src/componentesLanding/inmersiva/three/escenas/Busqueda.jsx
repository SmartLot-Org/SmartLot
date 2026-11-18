import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { BufferAttribute, BufferGeometry } from 'three';
import { hallazgo } from '../hallazgos';
import { SEDES } from '../mundo';
import { MAT } from '../paleta';
import { vivo } from '../vivo';

const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const suave = (t) => (t < 0.5 ? 2 * t * t : 1 - (2 - 2 * t) ** 2 / 2);

// Círculo unitario en el suelo: cada anillo lo escala. Línea de 1 px, como las aristas.
const CIRCULO = (() => {
  const LADOS = 160;
  const p = new Float32Array(LADOS * 3);
  for (let i = 0; i < LADOS; i++) {
    const a = (i / LADOS) * Math.PI * 2;
    p[i * 3] = Math.cos(a);
    p[i * 3 + 2] = Math.sin(a);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(p, 3));
  return g;
})();
const VELOCIDAD = 6.5;          // unidades por segundo: todas las búsquedas avanzan igual de lento
const ALCANCE = 1.35;           // el eco pasa un poco más allá de tu garage
// Solo a escala de ciudad: más cerca, los anillos cruzarían la cuadra y la planta.
const CIUDAD = Math.log(1.95);
const CUADRA = Math.log(2.25);
const ANILLOS = SEDES.map((s, i) => ({ c: [s.cx, s.cz], radio: s.radio, ciclo: (s.radio * ALCANCE) / VELOCIDAD, desfase: i * 0.27 }));
// Un material por anillo, cada uno con su opacidad; el color sigue a MAT.busqueda.
const MATERIALES = ANILLOS.map(() => ({ eco: MAT.busqueda.clone(), compas: MAT.busqueda.clone() }));

// La búsqueda de garages alrededor de cada sede, en tinta media, como la marca de un
// compás. Mientras una sede no encontró tu garage (fuera del mapa, o antes de buscar),
// su eco sale lento y pasa de largo. Con fx.busqueda, el compás de cada sede se abre
// hasta tu garage y queda ahí. Con movimiento reducido el eco queda quieto, con el
// radio que llega a tu garage.
export function Busqueda() {
  const ecos = useRef([]);
  const compases = useRef([]);

  useFrame(() => {
    const { fx, tiempo } = vivo;
    const ciudad = limitar((CUADRA - vivo.cam.lz) / (CUADRA - CIUDAD));
    const base = fx.sedes * vivo.aparecen * (1 - limitar(fx.tapa * 2)) * ciudad;
    const quieto = tiempo === 0;
    const color = MAT.busqueda.color;

    ANILLOS.forEach((a, i) => {
      const s = hallazgo(fx.busqueda, i);
      const encontrado = s * (1 - fx.fuera);
      const { eco, compas } = MATERIALES[i];

      const anillo = ecos.current[i];
      let o = base * (1 - encontrado);
      let r = a.radio;
      if (!quieto) {
        const fase = (tiempo / a.ciclo + a.desfase) % 1;
        r = 0.6 + fase * a.radio * ALCANCE;
        o *= 1.3 * (1 - fase) ** 1.3 * limitar(fase * 14);
      }
      anillo.visible = o > 0.01;
      if (anillo.visible) {
        eco.color.copy(color);
        eco.opacity = Math.min(0.75, o * 0.75);
        anillo.scale.set(r, 1, r);
      }

      const arco = compases.current[i];
      const oc = base * (1 - fx.fuera) * (1 - fx.llegan) * (s > 0.001 ? 1 : 0);
      arco.visible = oc > 0.01;
      if (arco.visible) {
        compas.color.copy(color);
        compas.opacity = oc * 0.9;
        const rc = Math.max(0.01, a.radio * suave(s));
        arco.scale.set(rc, 1, rc);
      }
    });
  });

  return (
    <group>
      {ANILLOS.map((a, i) => (
        <group key={i} position={[a.c[0], 0.04, a.c[1]]}>
          <lineLoop ref={(el) => { ecos.current[i] = el; }} geometry={CIRCULO} material={MATERIALES[i].eco} visible={false} />
          <lineLoop ref={(el) => { compases.current[i] = el; }} geometry={CIRCULO} material={MATERIALES[i].compas} visible={false} />
        </group>
      ))}
    </group>
  );
}
