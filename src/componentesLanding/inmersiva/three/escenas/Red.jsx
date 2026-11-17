import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { BufferAttribute, BufferGeometry } from 'three';
import { GARAGES, OFICINA } from '../mundo';
import { MAT } from '../paleta';
import { vivo } from '../vivo';

const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ANCHO = 0.62;
const TRAZO = 0.7;     // largo de cada trazo del punteado
const HUECO = 0.45;

// Recorrido por las calles desde la oficina hasta un garage: sale por el lado
// que le queda, toma la calle de la manzana del garage y entra por su frente.
function recorrido(g) {
  const lado = g.cx >= 0 ? 1 : -1;
  const sx = 6 * lado;
  const fila = Math.round(g.cz / 12);
  const zs = fila === 0 ? 6 : g.cz > 0 ? fila * 12 - 6 : fila * 12 + 6;
  const zFin = zs < g.cz ? g.z0 : g.z1;
  return [[OFICINA.x1 * lado, 0], [sx, 0], [sx, zs], [g.cx, zs], [g.cx, zFin]];
}

// Cinta punteada sobre la calle, en orden: se dibuja de a poco con setDrawRange.
function cintaPunteada(puntos) {
  const caras = [];
  for (let s = 0; s < puntos.length - 1; s++) {
    const [a, b] = [puntos[s], puntos[s + 1]];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len < 1e-6) continue;
    const ux = (b[0] - a[0]) / len;
    const uz = (b[1] - a[1]) / len;
    const nx = (-uz * ANCHO) / 2;
    const nz = (ux * ANCHO) / 2;
    for (let t = 0; t < len; t += TRAZO + HUECO) {
      const t1 = Math.min(len, t + TRAZO);
      const p0x = a[0] + ux * t, p0z = a[1] + uz * t, p1x = a[0] + ux * t1, p1z = a[1] + uz * t1;
      caras.push(p0x + nx, 0.07, p0z + nz, p0x - nx, 0.07, p0z - nz, p1x - nx, 0.07, p1z - nz,
        p0x + nx, 0.07, p0z + nz, p1x - nx, 0.07, p1z - nz, p1x + nx, 0.07, p1z + nz);
    }
  }
  return { caras: new Float32Array(caras) };
}

// El garage del trato ya tiene su ruta: la red suma las de los otros seis.
const RUTAS = GARAGES.slice(1).map((g) => {
  const puntos = recorrido(g);
  const { caras } = cintaPunteada(puntos);
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(caras, 3));
  return { geo, triangulos: caras.length / 9 };
});

// La red en el cierre: desde la oficina se trazan, una tras otra, las rutas a
// los garages que se suman. Acompaña a fx.red.
export function Red() {
  const mallas = useRef([]);

  useFrame(() => {
    const { red, tapa } = vivo.fx;
    const visible = red > 0.01 && tapa < 0.05;
    MAT.red.opacity = 0.9;
    RUTAS.forEach((r, i) => {
      const malla = mallas.current[i];
      const avance = visible ? limitar(red * 1.7 - i * 0.12) : 0;
      malla.visible = avance > 0.001;
      malla.geometry.setDrawRange(0, Math.floor(r.triangulos * avance) * 3);
    });
  });

  return (
    <group>
      {RUTAS.map((r, i) => (
        <mesh key={i} ref={(el) => { mallas.current[i] = el; }} geometry={r.geo} material={MAT.red} renderOrder={5} visible={false} />
      ))}
    </group>
  );
}
