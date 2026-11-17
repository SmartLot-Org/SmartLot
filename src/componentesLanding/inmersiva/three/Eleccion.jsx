import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { BufferAttribute, BufferGeometry, Vector3 } from 'three';
import { CELULAR } from '../contenido/secciones';
import { useUI } from '../estado/store';
import { PLAZAS_RESERVADAS } from './mundo';
import { MAT } from './paleta';
import { vivo } from './vivo';

const limitar = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// Número de plaza del celular → plaza del dibujo. Se eligen plazas del trato
// del centro de la planta en pantalla (ordenadas por x − z, que en la
// axonometría crece hacia la derecha): a la izquierda está la nota y a la
// derecha, el celular.
const CENTRO = [8, 11, 14, 17];   // posiciones en ese orden: salteadas, no pegadas
const INDICE = (() => {
  const aLaVista = PLAZAS_RESERVADAS
    .map((p, i) => ({ i, k: (p[0] + p[2]) / 2 - (p[1] + p[3]) / 2 }))
    .sort((a, b) => b.k - a.k);
  const mapa = {};
  for (const numero of CELULAR.plazas) {
    if (!(numero in mapa)) mapa[numero] = aLaVista[CENTRO[Object.keys(mapa).length]].i;
  }
  return mapa;
})();
const plazaDelDia = (dia) => PLAZAS_RESERVADAS[INDICE[CELULAR.plazas[dia]]];

// Cuadrado unitario (relleno) y su contorno: se escalan sobre la plaza elegida.
const RELLENO = new BufferGeometry();
RELLENO.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1]), 3));
const BORDE = new BufferGeometry();
BORDE.setAttribute('position', new BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0]), 3));
const HOLGURA = 0.08;

// Opacidad compartida por la marca 3D y la etiqueta HTML.
const opacidad = (dia) => {
  if (dia == null) return 0;
  const { tapa, acceso, consumos } = vivo.fx;
  return limitar((tapa - 0.6) / 0.4) * (1 - limitar(acceso * 4)) * (1 - limitar(consumos * 4));
};

// Etiqueta "Plaza N" sobre la plaza elegida (decorativa: el texto real está
// en la nota). Se proyecta en cada frame como los demás rótulos.
const nodo = { raiz: null, texto: null };

export function CapaEleccion() {
  return (
    <div ref={(el) => { nodo.raiz = el; }} className="plano-eleccion" style={{ opacity: 0 }}>
      <span ref={(el) => { nodo.texto = el; }} />
    </div>
  );
}

export function ProyectorEleccion() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new Vector3(), []);
  const previo = useRef(-1);

  useFrame(() => {
    if (!nodo.raiz) return;
    const dia = useUI.getState().diaElegido;
    const o = opacidad(dia);
    nodo.raiz.style.opacity = o.toFixed(2);
    if (o < 0.01) return;
    if (dia !== previo.current) {
      nodo.texto.textContent = `${CELULAR.plaza} ${CELULAR.plazas[dia]}`;
      // Reinicia el salto de entrada al cambiar de día.
      nodo.raiz.removeAttribute('data-salta');
      void nodo.raiz.offsetWidth;
      nodo.raiz.setAttribute('data-salta', '');
      previo.current = dia;
    }
    const [x0, z0, x1, z1] = plazaDelDia(dia);
    v.set((x0 + x1) / 2, 0.1, (z0 + z1) / 2).project(camera);
    const px = (v.x * 0.5 + 0.5) * size.width;
    const py = (-v.y * 0.5 + 0.5) * size.height;
    nodo.raiz.style.translate = `${px.toFixed(1)}px ${py.toFixed(1)}px`;
  });
  return null;
}

// La plaza del día elegido en la nota de la reserva: se marca en tinta y late
// (con movimiento reducido queda fija). Solo con la planta a la vista.
export function Eleccion() {
  const grupo = useRef(null);

  useFrame(() => {
    const dia = useUI.getState().diaElegido;
    const o = opacidad(dia);
    grupo.current.visible = o > 0.01;
    if (!grupo.current.visible) return;
    const [x0, z0, x1, z1] = plazaDelDia(dia);
    grupo.current.position.set(x0 - HOLGURA, 0.08, z0 - HOLGURA);
    grupo.current.scale.set(x1 - x0 + HOLGURA * 2, 1, z1 - z0 + HOLGURA * 2);
    const latido = 0.5 + 0.5 * Math.sin(vivo.tiempo * 5);
    MAT.eleccion.opacity = o * (0.55 + 0.35 * latido);
    MAT.eleccionLinea.opacity = o;
  });

  return (
    <group ref={grupo} visible={false}>
      <mesh geometry={RELLENO} material={MAT.eleccion} renderOrder={7} />
      <lineSegments geometry={BORDE} material={MAT.eleccionLinea} renderOrder={8} />
    </group>
  );
}
