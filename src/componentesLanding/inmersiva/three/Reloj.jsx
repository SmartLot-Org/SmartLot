import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Vector3 } from 'three';
import { DEMO, GARAGES_DEMO, JORNADA } from '../contenido/secciones';
import { horaDe, ocupacionDe, textoHora } from './jornada';
import { ANCLAS } from './mundo';
import { vivo } from './vivo';

const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Reloj de la jornada: un cuadrante con agujas y la hora, junto al garage del
// trato, con cuántas de sus plazas están ocupadas. Decorativo (aria-hidden).
const nodo = { raiz: null, hora: null, horario: null, minutero: null, ocupadas: null };

export function CapaReloj() {
  return (
    <div ref={(el) => { nodo.raiz = el; }} className="plano-reloj" style={{ opacity: 0 }}>
      <svg viewBox="-20 -20 40 40" width="44" height="44" aria-hidden="true">
        <circle r="18" className="plano-reloj__esfera" />
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1="0" y1="-15.5" x2="0" y2={i % 3 ? -14 : -12.5} transform={`rotate(${i * 30})`} />
        ))}
        <line ref={(el) => { nodo.horario = el; }} className="plano-reloj__horario" x1="0" y1="2" x2="0" y2="-9" />
        <line ref={(el) => { nodo.minutero = el; }} className="plano-reloj__minutero" x1="0" y1="3" x2="0" y2="-14" />
        <circle r="1.6" className="plano-reloj__eje" />
      </svg>
      <p>
        <b ref={(el) => { nodo.hora = el; }}>07:00</b>
        <span>{GARAGES_DEMO.lista[0].nombre}</span>
        <span ref={(el) => { nodo.ocupadas = el; }} />
      </p>
    </div>
  );
}

export function ProyectorReloj() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new Vector3(), []);
  const previo = useRef({ hora: '', ocupadas: -1 });

  useFrame(() => {
    if (!nodo.raiz) return;
    const { hora, red, tapa } = vivo.fx;
    const o = limitar(hora * 25) * (1 - limitar(red * 4)) * (1 - limitar(tapa * 2));
    nodo.raiz.style.opacity = o.toFixed(2);
    if (o < 0.01) return;

    const [x, y, z] = ANCLAS.g1;
    v.set(x, y, z).project(camera);
    const px = (v.x * 0.5 + 0.5) * size.width;
    const py = (-v.y * 0.5 + 0.5) * size.height;
    const ancho = nodo.raiz.offsetWidth;
    const alto = nodo.raiz.offsetHeight;
    const left = Math.max(16, Math.min(px + 28, size.width - ancho - 72));
    const top = Math.max(76, Math.min(py - alto - 18, size.height - alto - 16));
    nodo.raiz.style.transform = `translate(${left.toFixed(1)}px,${top.toFixed(1)}px)`;

    const h = horaDe(hora);
    // Agujas: el horario da media vuelta en la jornada; el minutero, una por hora.
    nodo.horario.setAttribute('transform', `rotate(${((h % 12) * 30).toFixed(1)})`);
    nodo.minutero.setAttribute('transform', `rotate(${((h % 1) * 360).toFixed(1)})`);
    const p = previo.current;
    const texto = textoHora(h);
    if (texto !== p.hora) { nodo.hora.textContent = texto; p.hora = texto; }
    const ocupadas = Math.round(DEMO.plazasDelTrato * ocupacionDe(0, h));
    if (ocupadas !== p.ocupadas) {
      nodo.ocupadas.textContent = `${ocupadas} / ${DEMO.plazasDelTrato} ${JORNADA.ocupadas}`;
      p.ocupadas = ocupadas;
    }
  });
  return null;
}
