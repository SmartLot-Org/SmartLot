import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Vector3 } from 'three';
import { ANCLAS_ALTA, DIBUJO } from './alta';
import { G1 } from './mundo';
import { vivo } from './vivo';

const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const COLUMNA = { horizontal: 40, vertical: 24 };   // px entre tu garage y la columna de cotas
const AIRE = 8;          // px entre una cota y la siguiente
const QUIEBRE = 16;      // px del tramo horizontal de cada guía, antes de la cota

// Las cotas del alta (/para-garages): los datos que carga el dueño (ubicación, horario,
// plazas y tarifas) como cotas del plano, en una columna a la derecha de tu garage, cada
// una con su guía desde el volumen. Entran una tras otra cuando el volumen ya está
// dibujado. Decorativas, como todo el escenario (aria-hidden): el texto real está en la
// nota de la sección.
const nodo = { raiz: null, guias: [], puntos: [], cotas: [] };

export function CapaCotas({ cotas }) {
  const claves = Object.keys(cotas);
  return (
    <div ref={(el) => { nodo.raiz = el; }} className="plano-cotas" style={{ opacity: 0 }}>
      <svg className="plano-cotas__guias">
        {claves.map((c, i) => (
          <g key={c}>
            <polyline ref={(el) => { nodo.guias[i] = el; }} opacity="0" />
            <circle ref={(el) => { nodo.puntos[i] = el; }} r="2.5" opacity="0" />
          </g>
        ))}
      </svg>
      {claves.map((c, i) => (
        <span key={c} ref={(el) => { nodo.cotas[i] = el; }} className="plano-cota plano-cota--alta" style={{ opacity: 0 }}>{cotas[c]}</span>
      ))}
    </div>
  );
}

export function ProyectorCotas({ cotas }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const v = useMemo(() => new Vector3(), []);
  const anclas = useMemo(() => Object.keys(cotas).map((c) => ANCLAS_ALTA[c]), [cotas]);
  // El alto de cada cota depende del ancho de la columna (en vertical una cota larga
  // ocupa dos o tres renglones): se mide solo cuando ese ancho cambia.
  const medidas = useRef({ ancho: '', altos: [] });
  // Con la fuente definitiva los renglones cambian: se vuelve a medir.
  useEffect(() => {
    let vigente = true;
    document.fonts?.ready.then(() => {
      if (!vigente) return;
      medidas.current.ancho = '';
      invalidate();
    });
    return () => { vigente = false; };
  }, [invalidate]);

  useFrame(() => {
    if (!nodo.raiz) return;
    const { alta, fuera, tapa } = vivo.fx;
    const presencia = vivo.aparecen * fuera * (1 - tapa);
    // La última cota termina de entrar cuando fx.alta llega a 1.
    const paso = (1 - DIBUJO) / (anclas.length + 1);
    const visible = presencia > 0.01 && alta > DIBUJO;
    nodo.raiz.style.opacity = visible ? '1' : '0';
    if (!visible) return;

    const W = size.width;
    const H = size.height;
    v.set(G1.x1, G1.h, G1.z0).project(camera);   // la esquina de tu garage que queda más a la derecha
    const x = (v.x * 0.5 + 0.5) * W + (vivo.vertical ? COLUMNA.vertical : COLUMNA.horizontal);
    // En horizontal, a la derecha está la regla de la página.
    const ancho = `${Math.max(120, W - x - (vivo.vertical ? 16 : 88)).toFixed(0)}px`;
    const m = medidas.current;
    if (ancho !== m.ancho) {
      for (const cota of nodo.cotas) cota.style.maxWidth = ancho;
      m.altos = nodo.cotas.map((cota) => cota.offsetHeight);
      m.ancho = ancho;
    }
    // Cada cota a la altura de su guía, sin pisar a la de arriba.
    let piso = -Infinity;
    anclas.forEach((a, i) => {
      const o = limitar((alta - DIBUJO - i * paso) / (paso * 2)) * presencia;
      v.set(a[0], a[1], a[2]).project(camera);
      const ax = (v.x * 0.5 + 0.5) * W;
      const ay = (-v.y * 0.5 + 0.5) * H;
      const medio = m.altos[i] / 2;
      const y = Math.max(ay, piso + AIRE + medio);
      piso = y + medio;
      const cota = nodo.cotas[i];
      cota.style.opacity = o.toFixed(2);
      cota.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translateY(-50%)`;
      const guia = nodo.guias[i];
      guia.setAttribute('points', `${ax.toFixed(1)},${ay.toFixed(1)} ${(x - QUIEBRE).toFixed(1)},${y.toFixed(1)} ${(x - 4).toFixed(1)},${y.toFixed(1)}`);
      guia.setAttribute('opacity', o.toFixed(2));
      const punto = nodo.puntos[i];
      punto.setAttribute('cx', ax.toFixed(1));
      punto.setAttribute('cy', ay.toFixed(1));
      punto.setAttribute('opacity', o.toFixed(2));
    });
  });
  return null;
}
