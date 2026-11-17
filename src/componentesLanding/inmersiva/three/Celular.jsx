import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Vector3 } from 'three';
import { CELULAR, DEMO } from '../contenido/secciones';
import { useUI } from '../estado/store';
import { G1 } from './mundo';
import { vivo } from './vivo';

const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ANCLA = [G1.x1 + 0.35, 0, G1.z0 + 0.6];   // junto a la esquina del garage que da a la calle

// Celular de la reserva: una pantalla de ejemplo de la app que acompaña a la
// planta del garage. Al avanzar el scroll (fx.llenas) el empleado elige un día
// por vez y lo reserva, mientras en el plano se pintan las plazas. Decorativo
// (el escenario es aria-hidden); el contenido real está en la sección.
const nodo = { raiz: null, dias: [], boton: null, plaza: null, cuenta: null };

export function CapaCelular() {
  return (
    <div ref={(el) => { nodo.raiz = el; }} className="plano-celular" style={{ opacity: 0 }}>
      <div className="plano-celular__pantalla">
        <header>
          <b>{CELULAR.titulo}</b>
          <small>{CELULAR.sede}</small>
        </header>
        <ol>
          {CELULAR.dias.map((d, i) => (
            <li key={d} ref={(el) => { nodo.dias[i] = el; }}>
              <span>{d}</span>
              <b>{16 + i}</b>
            </li>
          ))}
        </ol>
        <p className="plano-celular__horario">{CELULAR.horario}</p>
        <p className="plano-celular__plaza" ref={(el) => { nodo.plaza = el; }} />
        <div className="plano-celular__boton" ref={(el) => { nodo.boton = el; }}>{CELULAR.boton}</div>
        <p className="plano-celular__cuenta" ref={(el) => { nodo.cuenta = el; }} />
        <small className="plano-celular__aviso">{DEMO.aviso}</small>
      </div>
    </div>
  );
}

export function ProyectorCelular() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new Vector3(), []);
  const previo = useRef({ dia: -1, hecho: null, cuenta: -1 });

  useFrame(() => {
    if (!nodo.raiz) return;
    const { tapa, acceso, consumos, llenas } = vivo.fx;
    const o = limitar((tapa - 0.85) / 0.15) * (1 - limitar(acceso * 5)) * (1 - limitar(consumos * 5));
    nodo.raiz.style.opacity = o.toFixed(2);
    if (o < 0.01) return;

    v.set(ANCLA[0], ANCLA[1], ANCLA[2]).project(camera);
    const px = (v.x * 0.5 + 0.5) * size.width;
    const py = (-v.y * 0.5 + 0.5) * size.height;
    // Junto al garage, pero siempre dentro de la pantalla (y lejos de la regla).
    const ancho = nodo.raiz.offsetWidth;
    const alto = nodo.raiz.offsetHeight;
    const x = Math.max(size.width * 0.45, Math.min(px + 24, size.width - ancho - 72));
    const y = Math.max(76, Math.min(py - alto / 2, size.height - alto - 16)) + (1 - o) * 16;
    nodo.raiz.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;

    // Un día por cada quinto del llenado; en la segunda mitad de cada tramo se confirma.
    // Con un día elegido en la nota, el celular muestra esa reserva ya hecha.
    const elegido = useUI.getState().diaElegido;
    const tramo = Math.min(4.999, llenas * 5);
    const dia = elegido ?? Math.floor(tramo);
    const hecho = elegido != null || (llenas > 0.001 && (tramo - dia > 0.55 || llenas >= 1));
    const p = previo.current;
    if (dia !== p.dia) {
      nodo.dias.forEach((el, i) => el?.toggleAttribute('data-activo', i === dia));
      nodo.plaza.textContent = `${CELULAR.plaza} ${CELULAR.plazas[dia]} · ${CELULAR.dias[dia]} ${16 + dia}`;
      p.dia = dia;
    }
    if (hecho !== p.hecho) {
      nodo.boton.textContent = hecho ? `${CELULAR.hecho} ✓` : CELULAR.boton;
      nodo.boton.toggleAttribute('data-hecho', hecho);
      p.hecho = hecho;
    }
    const cuenta = Math.round(DEMO.plazasDelTrato * llenas);
    if (cuenta !== p.cuenta) {
      nodo.cuenta.textContent = `${cuenta} / ${DEMO.plazasDelTrato} ${DEMO.reservadas}`;
      p.cuenta = cuenta;
    }
  });
  return null;
}
