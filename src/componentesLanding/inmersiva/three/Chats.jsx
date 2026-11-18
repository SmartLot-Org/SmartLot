import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Vector3 } from 'three';
import { COMPARAR } from '../contenido/secciones';
import { useUI } from '../estado/store';
import { ANCLAS } from './mundo';
import { vivo } from './vivo';

const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const UMBRAL = 0.12;   // apenas los autos empiezan a dar vueltas, estalla el chat

// Dónde cae cada globo (px dentro de la capa) y cuánto se tuerce: desordenados
// a propósito, encimándose un poco, como un grupo de chat que no para.
const DESORDEN = [
  [0, 0, -3], [214, 18, 2], [26, 66, 1.5], [244, 88, -2], [0, 136, 2.5],
  [196, 152, -1.5], [38, 208, -2], [252, 222, 3], [8, 274, 1], [214, 290, -2.5],
];

// Orden en que se van al deslizar hacia "con SmartLot": salteado, no de abajo
// para arriba, así el desorden se va despejando de a poco.
const SE_VAN = [9, 2, 6, 0, 4, 8, 1, 5, 7, 3];
const CASCADA = 1200;  // ms hasta que terminan de llegar todos

// Cómo se arregla hoy: globos de chat junto a un punto del dibujo (en la home, la
// oficina) mientras los autos dan vueltas. Cuando arrancan las vueltas aparecen
// todos en cascada rápida (tiempo, no scroll); a medida que el deslizador de la
// home avanza hacia "con SmartLot" se van yendo de a uno, hasta no quedar ninguno.
// Decorativos (aria-hidden). Cada página trae sus mensajes, su ancla y de dónde
// sale el deslizador; por defecto, los de la home.
const nodo = { raiz: null, globos: [] };
const compararDeLaHome = () => useUI.getState().comparar;

export function CapaChats({ mensajes = COMPARAR.chats }) {
  return (
    <div ref={(el) => { nodo.raiz = el; }} className="plano-chats">
      {mensajes.map((c, i) => {
        const [x, y, giro] = DESORDEN[i % DESORDEN.length];
        return (
          <p
            key={i}
            ref={(el) => { nodo.globos[i] = el; }}
            className="plano-chat"
            style={{ left: x, top: y, '--giro': `${giro}deg`, '--orden': i }}
          >
            <b>{c.de}</b>
            {c.texto}
          </p>
        );
      })}
    </div>
  );
}

export function ProyectorChats({ mensajes = COMPARAR.chats, ancla = ANCLAS.oficina, comparar = compararDeLaHome }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new Vector3(), []);
  const previo = useRef({ visibles: false, desde: 0, asentado: false, quedan: -1 });

  useFrame(() => {
    if (!nodo.raiz) return;
    const { vueltas, tapa } = vivo.fx;
    const o = limitar(vueltas * 4) * (1 - tapa);
    nodo.raiz.style.opacity = o.toFixed(2);

    const p = previo.current;
    const visibles = o > 0.01 && vueltas > UMBRAL;
    if (visibles !== p.visibles) {
      nodo.raiz.toggleAttribute('data-caos', visibles);
      p.visibles = visibles;
      p.desde = performance.now();
    }
    // Terminada la cascada, los que vuelven (deslizador hacia "hoy") lo hacen sin espera.
    const asentado = visibles && performance.now() - p.desde > CASCADA;
    if (asentado !== p.asentado) {
      nodo.raiz.toggleAttribute('data-asentado', asentado);
      p.asentado = asentado;
    }
    // Con el deslizador hacia "con SmartLot" quedan cada vez menos mensajes.
    const total = mensajes.length;
    const quedan = Math.round(total * (1 - comparar()));
    if (quedan !== p.quedan) {
      const fuera = new Set(SE_VAN.filter((i) => i < total).slice(0, total - quedan));
      nodo.globos.forEach((g, i) => g?.toggleAttribute('data-fuera', fuera.has(i)));
      p.quedan = quedan;
    }
    if (o < 0.01) return;

    const [x, y, z] = ancla;
    v.set(x, y, z).project(camera);
    const px = (v.x * 0.5 + 0.5) * size.width;
    const py = (-v.y * 0.5 + 0.5) * size.height;
    // A la derecha del ancla y siempre dentro de la pantalla. En horizontal
    // la nota ocupa la mitad izquierda: los chats van en la otra mitad (antes de
    // la regla) y se achican si no entran. En vertical, la escala la pone el CSS.
    const horizontal = size.width > size.height;
    if (horizontal) nodo.raiz.style.scale = Math.min(1, (size.width * 0.5 - 80) / nodo.raiz.offsetWidth).toFixed(3);
    else nodo.raiz.style.removeProperty('scale');
    const caja = nodo.raiz.getBoundingClientRect();
    const minimo = horizontal ? size.width * 0.5 : 8;
    const left = Math.max(minimo, Math.min(px + 24, size.width - caja.width - 72));
    const top = Math.max(76, Math.min(py - caja.height * 0.45, size.height - caja.height - 16));
    // `translate` (no `transform`): así el desplazamiento no se multiplica por la escala.
    nodo.raiz.style.translate = `${left.toFixed(1)}px ${top.toFixed(1)}px`;
  });
  return null;
}
