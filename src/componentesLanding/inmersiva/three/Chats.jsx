import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Vector3 } from 'three';
import { COMPARAR } from '../contenido/secciones';
import { ANCLAS } from './mundo';
import { vivo } from './vivo';

const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Cómo se arregla hoy: globos de chat sobre la oficina mientras los autos dan
// vueltas. Aparecen de a uno con fx.vueltas y se van cuando el deslizador
// pasa a "con SmartLot" (que apaga las vueltas). Decorativos (aria-hidden).
const nodo = { raiz: null, globos: [] };

export function CapaChats() {
  return (
    <div ref={(el) => { nodo.raiz = el; }} className="plano-chats">
      {COMPARAR.chats.map((c, i) => (
        <p key={i} ref={(el) => { nodo.globos[i] = el; }} className="plano-chat">
          <b>{c.de}</b>
          {c.texto}
        </p>
      ))}
    </div>
  );
}

export function ProyectorChats() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new Vector3(), []);
  const previo = useRef(-1);

  useFrame(() => {
    if (!nodo.raiz) return;
    const { vueltas, tapa } = vivo.fx;
    const o = limitar(vueltas * 2.5) * (1 - tapa);
    nodo.raiz.style.opacity = o.toFixed(2);
    if (o < 0.01) {
      previo.current = -1;
      nodo.globos.forEach((g) => g?.removeAttribute('data-visible'));
      return;
    }
    const [x, y, z] = ANCLAS.oficina;
    v.set(x, y, z).project(camera);
    const px = (v.x * 0.5 + 0.5) * size.width;
    const py = (-v.y * 0.5 + 0.5) * size.height;
    const alto = nodo.raiz.offsetHeight;
    // A la derecha de la oficina y siempre dentro de la pantalla.
    const left = Math.min(px + 36, size.width - nodo.raiz.offsetWidth - 72);
    const top = Math.max(76, py - alto - 10);
    nodo.raiz.style.transform = `translate(${left.toFixed(1)}px,${top.toFixed(1)}px)`;

    const n = Math.floor(limitar((vueltas - 0.2) / 0.75) * COMPARAR.chats.length + 0.0001);
    if (n !== previo.current) {
      nodo.globos.forEach((g, i) => g?.toggleAttribute('data-visible', i < n));
      previo.current = n;
    }
  });
  return null;
}
