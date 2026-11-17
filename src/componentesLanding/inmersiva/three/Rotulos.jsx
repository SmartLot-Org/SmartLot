import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Vector3 } from 'three';
import { ROTULOS } from '../contenido/secciones';
import { ANCLAS, LLEGADA, MUNDO, azar, posicionAuto } from './mundo';
import { vivo } from './vivo';

const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Rótulos del plano: HTML anclado a puntos del dibujo. Son decorativos (el
// escenario entero es aria-hidden); el contenido real está en las secciones.
const ROTULADOS = [
  { id: 'oficina', ancla: ANCLAS.oficina, clase: 'plano-rotulo', texto: ROTULOS.oficina, opacidad: (fx) => vivo.aparecen * (1 - fx.tapa) },
  { id: 'g1', ancla: ANCLAS.g1, clase: 'plano-senal-e', texto: ROTULOS.senal, opacidad: (fx) => vivo.aparecen * (1 - fx.tapa) },
  { id: 'g2', ancla: ANCLAS.g2, clase: 'plano-senal-e', texto: ROTULOS.senal, opacidad: () => vivo.aparecen },
  { id: 'g3', ancla: ANCLAS.g3, clase: 'plano-senal-e', texto: ROTULOS.senal, opacidad: () => vivo.aparecen },
  ...ANCLAS.sumados.map((ancla, i) => ({ id: `s${i}`, ancla, clase: 'plano-senal-e', texto: ROTULOS.senal, opacidad: (fx) => limitar(fx.red * 1.6 - i * 0.2) })),
  { id: 'cota', ancla: ANCLAS.cota, clase: 'plano-cota', texto: `${MUNDO.ruta.metros} m`, opacidad: (fx) => limitar((fx.traza - 0.55) / 0.2) * (1 - fx.tapa) },
  { id: 'entrada', ancla: ANCLAS.entrada, clase: 'plano-rotulo', texto: ROTULOS.entrada, debajo: true, opacidad: (fx) => fx.tapa * (1 - limitar(fx.acceso * 3)) * (1 - limitar(fx.consumos * 3)) },
];

// Un QR de mentira (no codifica nada): tres esquinas de referencia y módulos sorteados con semilla fija.
function modulosQr() {
  const N = 13;
  const rng = azar(42);
  const esquina = (f, c) => {
    for (const [f0, c0] of [[0, 0], [0, N - 5], [N - 5, 0]]) {
      const df = f - f0;
      const dc = c - c0;
      if (df >= 0 && df < 5 && dc >= 0 && dc < 5) {
        const borde = df === 0 || df === 4 || dc === 0 || dc === 4;
        return borde || (df === 2 && dc === 2) ? 1 : 0;
      }
      if (df >= -1 && df < 6 && dc >= -1 && dc < 6) return 0;
    }
    return -1;
  };
  const m = [];
  for (let f = 0; f < N; f++) {
    for (let c = 0; c < N; c++) {
      const e = esquina(f, c);
      if (e === 1 || (e === -1 && rng() < 0.5)) m.push([c, f]);
    }
  }
  return m;
}

const MODULOS = modulosQr();
const M = 3.4;

// Nodos de la capa HTML. Los registra Rotulos al montarse y los mueve Proyector
// en cada frame; viven fuera de React porque se escriben 60 veces por segundo.
const nodo = { capa: null, lente: null, haz: null, sello: null, pie: null };
const registrar = (clave) => (el) => { nodo[clave] = el; };

function Lente() {
  return (
    <div ref={registrar('lente')} className="plano-lente">
      <svg viewBox="0 0 168 168" overflow="visible">
        <line className="plano-lente__guia" x1="-28.5" y1="196.5" x2="24.6" y2="143.4" />
        <rect className="plano-lente__equipo" x="52" y="26" width="64" height="116" rx="9" />
        <g className="plano-lente__qr" transform="translate(61.9 46)">
          {MODULOS.map(([c, f]) => <rect key={`${c}-${f}`} x={c * M} y={f * M} width={M + 0.15} height={M + 0.15} />)}
          <rect x="0" y="56" width="30" height="3" opacity="0.55" />
          <rect x="0" y="64" width="20" height="3" opacity="0.3" />
        </g>
        <rect ref={registrar('haz')} className="plano-lente__haz" x="56" y="44" width="56" height="2.5" opacity="0" />
        <g ref={registrar('sello')} opacity="0" style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
          <circle className="plano-lente__sello" cx="84" cy="68" r="15" />
          <path className="plano-lente__tilde" d="M77 68.5l5 5 9.5-10.5" />
        </g>
      </svg>
      <span ref={registrar('pie')} className="plano-lente__pie" style={{ opacity: 0 }}>{ROTULOS.ingreso} {ROTULOS.hora}</span>
    </div>
  );
}

// Capa HTML de los rótulos y la lente de detalle.
export function Rotulos() {
  return (
    <div ref={registrar('capa')} className="plano-rotulos">
      {ROTULADOS.map((r) => <span key={r.id} className={r.clase}>{r.texto}</span>)}
      <Lente />
    </div>
  );
}

// Va dentro del Canvas: proyecta las anclas con la cámara de cada frame y mueve
// los rótulos por ref (transform y opacity), sin pasar por React.
export function Proyector() {
  const size = useThree((s) => s.size);
  const v = useMemo(() => new Vector3(), []);
  const previo = useRef({ lado: 0 });

  useEffect(() => { previo.current.lado = nodo.lente?.offsetWidth ?? 0; }, [size]);

  useFrame(({ camera }) => {
    if (!nodo.capa) return;
    const fx = vivo.fx;
    const W = size.width;
    const H = size.height;
    const hijos = nodo.capa.children;
    const proyectar = (ancla) => {
      v.set(ancla[0], ancla[1], ancla[2]).project(camera);
      return [(v.x * 0.5 + 0.5) * W, (-v.y * 0.5 + 0.5) * H];
    };

    ROTULADOS.forEach((r, i) => {
      const el = hijos[i];
      const o = r.opacidad(fx);
      el.style.opacity = o.toFixed(2);
      if (o < 0.01) return;
      const [px, py] = proyectar(r.ancla);
      el.style.transform = `translate(${px.toFixed(1)}px,${py.toFixed(1)}px) translate(-50%,${r.debajo ? '8px' : '-100%'})`;
    });

    // La lente sigue a la ventanilla del conductor.
    const lente = nodo.lente;
    const visible = limitar((fx.acceso - 0.55) / 0.35);
    lente.style.opacity = visible.toFixed(2);
    if (visible > 0.01) {
      const lado = previo.current.lado;
      const desvio = lado * 0.17;
      const [px, py] = proyectar([24.09, 0.12, posicionAuto(fx.ingreso) + 0.02]);
      lente.style.transform = `translate(${(px + desvio).toFixed(1)}px,${(py - lado - desvio).toFixed(1)}px)`;
      const escaneo = limitar((fx.ingreso - LLEGADA - 0.03) / 0.3);
      const hecho = limitar((fx.ingreso - 0.9) / 0.1);
      nodo.haz.setAttribute('y', (44 + escaneo * 46).toFixed(1));
      nodo.haz.setAttribute('opacity', escaneo > 0 && escaneo < 1 ? '1' : '0');
      nodo.sello.setAttribute('opacity', hecho.toFixed(2));
      nodo.sello.style.transform = `scale(${(0.9 + 0.1 * hecho).toFixed(3)})`;
      nodo.pie.style.opacity = hecho.toFixed(2);
    }
  });
  return null;
}
