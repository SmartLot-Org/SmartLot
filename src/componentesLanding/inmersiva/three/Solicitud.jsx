import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Vector3 } from 'three';
import { G1 } from './mundo';
import { vivo } from './vivo';

const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ANCLA = [G1.x1 + 0.35, G1.h, G1.z0 + 0.6];   // la esquina de tu garage que da a la calle

// La solicitud de una empresa como la ve el dueño en /duenio-garage/tratos
// (GestionTratosGarage.jsx): llega con la línea del pedido y, con el scroll, pasa de
// "Pendiente" a "Trato aceptado" justo antes de que el techo se pinte (regla 5: nada se
// activa sin tu confirmación). Se va cuando se levanta el techo y no vuelve después de
// las reservas. Decorativa, como todo el escenario (aria-hidden): los datos son de
// ejemplo y así se rotulan.
const nodo = { raiz: null, estado: null };

export function CapaSolicitud({ solicitud }) {
  return (
    <div ref={(el) => { nodo.raiz = el; }} className="plano-solicitud" style={{ opacity: 0 }}>
      <header>
        <b>{solicitud.empresa}</b>
        <span ref={(el) => { nodo.estado = el; }} className="plano-solicitud__estado">{solicitud.estado.pendiente}</span>
      </header>
      <p className="plano-solicitud__garage">
        <small>{solicitud.garage.etiqueta}</small>
        <strong>{solicitud.garage.nombre}</strong>
        <small>{solicitud.sede}</small>
      </p>
      <p className="plano-solicitud__cantidad"><strong>{solicitud.cocheras}</strong> {solicitud.detalle}</p>
      <div className="plano-solicitud__acciones">
        <span data-accion="aceptar">{solicitud.acciones.aceptar}</span>
        <span data-accion="rechazar">{solicitud.acciones.rechazar}</span>
      </div>
      <small className="plano-solicitud__aviso">{solicitud.aviso}</small>
    </div>
  );
}

export function ProyectorSolicitud({ solicitud }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new Vector3(), []);
  const previo = useRef(null);

  useFrame(() => {
    if (!nodo.raiz) return;
    const { traza, trato, tapa, llenas, fuera } = vivo.fx;
    const o = limitar((traza - 0.6) / 0.25) * (1 - limitar(tapa * 3)) * (1 - limitar(llenas * 4)) * (1 - fuera) * vivo.aparecen;
    nodo.raiz.style.opacity = o.toFixed(2);
    if (o < 0.01) return;

    const aceptada = trato >= 0.5;
    if (aceptada !== previo.current) {
      nodo.raiz.toggleAttribute('data-aceptada', aceptada);
      nodo.estado.textContent = aceptada ? solicitud.estado.aceptado : solicitud.estado.pendiente;
      previo.current = aceptada;
    }

    v.set(ANCLA[0], ANCLA[1], ANCLA[2]).project(camera);
    const px = (v.x * 0.5 + 0.5) * size.width;
    const py = (-v.y * 0.5 + 0.5) * size.height;
    // Junto a tu garage, pero siempre dentro de la pantalla y lejos de la regla.
    const ancho = nodo.raiz.offsetWidth;
    const alto = nodo.raiz.offsetHeight;
    const x = Math.max(16, Math.min(px + 24, size.width - ancho - 72));
    const y = Math.max(76, Math.min(py - alto * 0.5, size.height - alto - 16)) + (1 - o) * 12;
    nodo.raiz.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
  });
  return null;
}
