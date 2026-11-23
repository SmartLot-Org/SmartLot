import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { Vector3 } from 'three';
import { TarjetaBusqueda } from '../ui/garages/FichaBusqueda';
import { G1 } from './mundo';
import { vivo } from './vivo';

const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
// La tarjeta va arriba a la derecha de tu garage, en la manzana baja que queda libre
// entre la sede de 300 m y el garage de la derecha, y la flecha sube hasta ella desde la
// esquina derecha del techo, así no cruza el volumen ni tapa tu garage.
const ORIGEN = [G1.x1, G1.h, G1.z0];
const ESCALA = { horizontal: 0.92, vertical: 0.8 };   // en el celular la tarjeta va más chica
const QUIEBRE = 18;   // px del último tramo, recto, antes de la tarjeta (como las cotas)
const PUNTA = 5;      // px de cada lado de la punta abierta
const AIRE = 6;       // px entre la punta y el borde de la tarjeta
// px: cuánto se corre el borde izquierdo de la tarjeta desde la esquina, y cuánto aire
// queda entre la esquina y el borde de abajo de la tarjeta (ahí va la flecha).
const SALIDA = { horizontal: [-64, 76], vertical: [-40, 44] };
const BARRA = { horizontal: 88, vertical: 76 };
const REGLA = 88;     // en horizontal, a la derecha está la regla de la página
// Tramos de fx.ficha: la flecha se traza rápido y la tarjeta entra apenas llega.
const TRAZO = 0.5;
const ENTRA = [0.4, 0.75];

// "Así te ve una empresa" en el dibujo (/para-garages, sección `mapa`): una guía fina
// del plano, como las cotas, que sale de tu garage y lleva a la tarjeta del listado de
// "Buscar garages" con tus datos. Es la misma tarjeta de la ficha de la nota
// (TarjetaBusqueda): la nota la conserva como texto, porque el escenario es aria-hidden
// y esto es decorativo. Solo opacidad, transform y el trazo del SVG; nunca visibility.
const nodo = { raiz: null, guia: null, punto: null, punta: null, tarjeta: null, nota: null };

export function CapaFichaMapa({ busqueda, seccion }) {
  return (
    <div
      ref={(el) => {
        nodo.raiz = el;
        // La nota de la sección: en vertical la tarjeta no baja de su borde de arriba.
        nodo.nota = el?.closest('.plano')?.querySelector(`#${seccion} .plano-nota`) ?? null;
      }}
      className="plano-ficha-mapa"
      style={{ opacity: 0 }}
    >
      <svg className="plano-ficha-mapa__flecha">
        <polyline ref={(el) => { nodo.guia = el; }} pathLength="1" strokeDasharray="1 1" strokeDashoffset="1" />
        <circle ref={(el) => { nodo.punto = el; }} r="2.5" opacity="0" />
        <polyline ref={(el) => { nodo.punta = el; }} opacity="0" />
      </svg>
      <div ref={(el) => { nodo.tarjeta = el; }} className="plano-ficha-mapa__tarjeta" data-ui="busqueda" style={{ opacity: 0 }}>
        <p className="plano-ficha-mapa__titulo">{busqueda.titulo} <small>{busqueda.aviso}</small></p>
        <TarjetaBusqueda />
      </div>
    </div>
  );
}

export function ProyectorFichaMapa() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const v = useMemo(() => new Vector3(), []);
  // La tarjeta mide lo mismo mientras no cambien la pantalla ni la fuente: se mide una
  // vez por tamaño, no en cada frame.
  const medida = useRef({ clave: '', ancho: 0, alto: 0 });
  useEffect(() => {
    let vigente = true;
    document.fonts?.ready.then(() => {
      if (!vigente) return;
      medida.current.clave = '';
      invalidate();
    });
    return () => { vigente = false; };
  }, [invalidate]);

  useFrame(() => {
    if (!nodo.raiz) return;
    const { ficha, fuera, tapa } = vivo.fx;
    const presencia = vivo.aparecen * (1 - fuera) * (1 - limitar(tapa * 3));
    // El amortiguado deja la ficha apenas por encima de 0 un rato: debajo de 0,01 no se ve.
    const visible = presencia > 0.01 && ficha > 0.01;
    nodo.raiz.style.opacity = visible ? presencia.toFixed(2) : '0';
    if (!visible) return;

    const vertical = vivo.vertical;
    const lado = vertical ? 'vertical' : 'horizontal';
    const escala = ESCALA[lado];
    const W = size.width;
    const H = size.height;
    const m = medida.current;
    const clave = `${W}x${H}`;
    if (m.clave !== clave) {
      m.ancho = nodo.tarjeta.offsetWidth;
      m.alto = nodo.tarjeta.offsetHeight;
      m.clave = clave;
    }
    const ancho = m.ancho * escala;
    const alto = m.alto * escala;
    v.set(ORIGEN[0], ORIGEN[1], ORIGEN[2]).project(camera);
    const ax = (v.x * 0.5 + 0.5) * W;
    const ay = (-v.y * 0.5 + 0.5) * H;

    // La tarjeta arriba a la derecha de tu garage y la flecha sube hasta su borde de
    // abajo. En horizontal no pisa la nota ni la regla; en vertical no baja de la nota.
    const [sx, sy] = SALIDA[lado];
    const izquierda = vertical ? 16 : Math.max(24, W * 0.06) + Math.min(480, W * 0.44) + 24;
    const derecha = W - ancho - (vertical ? 16 : REGLA);
    const piso = vertical ? (nodo.nota?.getBoundingClientRect().top ?? H * 0.6) - 12 : H - 16;
    const x = Math.max(izquierda, Math.min(ax + sx, derecha));
    const y = Math.max(BARRA[lado], Math.min(ay - sy - alto, piso - alto));
    const bx = Math.max(x + 24, Math.min(ax + 32, x + ancho - 24));
    const by = y + alto + AIRE;
    const puntos = [[ax, ay], [bx, Math.min(ay, by + QUIEBRE)], [bx, by]];
    const punta = [[bx - PUNTA, by + PUNTA], [bx, by], [bx + PUNTA, by + PUNTA]];
    const lista = (ps) => ps.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(' ');

    const trazo = limitar(ficha / TRAZO);
    nodo.guia.setAttribute('points', lista(puntos));
    nodo.guia.setAttribute('stroke-dashoffset', (1 - trazo).toFixed(3));
    nodo.punto.setAttribute('cx', ax.toFixed(1));
    nodo.punto.setAttribute('cy', ay.toFixed(1));
    nodo.punto.setAttribute('opacity', limitar(trazo * 8).toFixed(2));
    nodo.punta.setAttribute('points', lista(punta));
    nodo.punta.setAttribute('opacity', limitar((trazo - 0.9) / 0.1).toFixed(2));

    // La tarjeta entra cuando la flecha llega, subiendo apenas desde ella. Con
    // movimiento reducido el fx llega entero de un salto: aparece quieta, en su lugar.
    const entra = limitar((ficha - ENTRA[0]) / (ENTRA[1] - ENTRA[0]));
    const viaje = (1 - entra) * 8;
    nodo.tarjeta.style.opacity = entra.toFixed(2);
    nodo.tarjeta.style.transform = `translate(${x.toFixed(1)}px,${(y + viaje).toFixed(1)}px) scale(${escala})`;
  });
  return null;
}
