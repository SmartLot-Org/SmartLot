import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { RingGeometry } from 'three';
import { G1, G2, G3, PLAZAS_RESERVADAS, RESERVADAS, RUTA, SUMADOS } from '../mundo';
import { MAT } from '../paleta';
import { vivo } from '../vivo';

const centro = (g) => [(g.x0 + g.x1) / 2, (g.z0 + g.z1) / 2];
const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const CICLO = 2.6;          // segundos por onda
const ONDAS = 2;

// Señales vivas del plano, todas en azul señal:
// - ondas que salen de cada garage con plazas (en la home, el del trato cuando
//   acepta y los sumados en el cierre; cada página trae sus focos),
// - un punto que recorre la ruta oficina → garage una vez trazada,
// - un destello en cada plaza en el momento en que se reserva.
const FOCOS = [
  { c: centro(G1), peso: (fx) => fx.trato * (1 - limitar(fx.tapa * 2)) },
  { c: centro(G2), peso: (fx) => 1 - limitar(fx.tapa * 2) },
  { c: centro(G3), peso: (fx) => 1 - limitar(fx.tapa * 2) },
  ...SUMADOS.map((g, i) => ({ c: centro(g), peso: (fx) => limitar(fx.red * 1.6 - i * 0.2) })),
];

// Ruta como polilínea con largo acumulado, para ubicar el punto que la recorre.
const TRAMOS = RUTA.slice(1).map((b, i) => {
  const a = RUTA[i];
  return { a, b, len: Math.hypot(b[0] - a[0], b[1] - a[1]) };
});
const LARGO_RUTA = TRAMOS.reduce((s, t) => s + t.len, 0);
const PAUSA = 10;           // unidades de "espera" al llegar, antes de volver a salir
function enRuta(d, destino) {
  let resto = d;
  for (const t of TRAMOS) {
    if (resto <= t.len) {
      const u = resto / t.len;
      destino[0] = t.a[0] + (t.b[0] - t.a[0]) * u;
      destino[1] = t.a[1] + (t.b[1] - t.a[1]) * u;
      return destino;
    }
    resto -= t.len;
  }
  destino[0] = RUTA.at(-1)[0];
  destino[1] = RUTA.at(-1)[1];
  return destino;
}

function nuevoMat() {
  const m = MAT.pulso.clone();
  m.opacity = 0;
  return m;
}

// Geometrías y materiales del módulo (como en paleta.js): se escriben en cada frame.
const geo = {
  anillo: new RingGeometry(0.9, 1, 56).rotateX(-Math.PI / 2),
  disco: new RingGeometry(0, 1, 28).rotateX(-Math.PI / 2),
  cuadro: new RingGeometry(0, Math.SQRT1_2, 4, 1, Math.PI / 4).rotateX(-Math.PI / 2),
};
// Un material por onda. Las páginas se turnan (hay una por vez), así que comparten
// estos; si una trae más focos que la home, se suman los que falten.
const ondas = [];
const materialesDeOnda = (focos) => {
  while (ondas.length < focos.length * ONDAS) ondas.push(nuevoMat());
  return ondas;
};
materialesDeOnda(FOCOS);
const mats = { punto: nuevoMat(), estela: nuevoMat(), plaza: nuevoMat() };

export function Pulsos({ focos = FOCOS }) {
  const refsOndas = useRef([]);
  const punto = useRef(null);
  const estela = useRef(null);
  const plaza = useRef(null);
  const ultima = useRef({ n: 0, t: -10 });
  const p = useMemo(() => [0, 0], []);
  const materiales = useMemo(() => materialesDeOnda(focos), [focos]);

  useFrame(() => {
    const { fx, tiempo, aparecen } = vivo;
    const color = MAT.pulso.color;

    // Ondas: escala y opacidad salen de la fase; se apagan con el zoom de planta.
    focos.forEach((f, i) => {
      const peso = f.peso(fx) * aparecen;
      for (let k = 0; k < ONDAS; k++) {
        const m = materiales[i * ONDAS + k];
        const el = refsOndas.current[i * ONDAS + k];
        const fase = ((tiempo / CICLO) + k / ONDAS + i * 0.21) % 1;
        el.visible = peso > 0.01;
        if (!el.visible) continue;
        m.color.copy(color);
        m.opacity = peso * 0.55 * (1 - fase) ** 2;
        el.scale.setScalar(2.6 + fase * 7);
      }
    });

    // Punto que viaja por la ruta: sale de la oficina, llega, espera y vuelve a salir.
    // Con tu garage fuera del mapa (garages) no hay a dónde llegar.
    const ruta = fx.traza > 0.99 ? (1 - limitar(fx.tapa * 2)) * (1 - fx.fuera) : 0;
    punto.current.visible = ruta > 0.01;
    estela.current.visible = ruta > 0.01;
    if (ruta > 0.01) {
      const ciclo = (tiempo * 9) % (LARGO_RUTA + PAUSA);
      enRuta(Math.min(ciclo, LARGO_RUTA), p);
      const llega = limitar((ciclo - LARGO_RUTA) / PAUSA);
      const latido = (tiempo * 1.6) % 1;
      punto.current.position.set(p[0], 0.08, p[1]);
      estela.current.position.set(p[0], 0.07, p[1]);
      estela.current.scale.setScalar(0.5 + latido * 1.6);
      mats.punto.color.copy(color);
      mats.estela.color.copy(color);
      mats.punto.opacity = ruta * (1 - llega);
      mats.estela.opacity = ruta * 0.5 * (1 - latido) * (1 - llega);
    }

    // Destello en la plaza que se acaba de reservar.
    const n = Math.round(RESERVADAS * fx.llenas);
    if (n !== ultima.current.n) {
      if (n > ultima.current.n) ultima.current.t = tiempo;
      ultima.current.n = n;
    }
    const destello = fx.tapa > 0.5 && n > 0 ? Math.max(0, 1 - (tiempo - ultima.current.t) / 0.7) : 0;
    plaza.current.visible = destello > 0.01;
    if (destello > 0.01) {
      const [x0, z0, x1, z1] = PLAZAS_RESERVADAS[n - 1];
      const crece = 1 + (1 - destello) * 0.9;
      plaza.current.position.set((x0 + x1) / 2, 0.06, (z0 + z1) / 2);
      plaza.current.scale.set((x1 - x0) * crece, 1, (z1 - z0) * crece);
      mats.plaza.color.copy(color);
      mats.plaza.opacity = destello * 0.6;
    }
  });

  return (
    <group>
      {focos.map((f, i) => Array.from({ length: ONDAS }, (_, k) => (
        <mesh
          key={`${i}-${k}`}
          ref={(el) => { refsOndas.current[i * ONDAS + k] = el; }}
          geometry={geo.anillo}
          material={materiales[i * ONDAS + k]}
          position={[f.c[0], 0.05, f.c[1]]}
          visible={false}
        />
      )))}
      <mesh ref={estela} geometry={geo.anillo} material={mats.estela} visible={false} />
      <mesh ref={punto} geometry={geo.disco} material={mats.punto} scale={0.42} visible={false} renderOrder={6} />
      <mesh ref={plaza} geometry={geo.cuadro} material={mats.plaza} visible={false} />
    </group>
  );
}
