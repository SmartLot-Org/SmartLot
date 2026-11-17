import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Vector3 } from 'three';
import { GARAGES_DEMO, MIRA } from '../contenido/secciones';
import { EDIFICIOS, GARAGES } from './mundo';
import { puntero } from './puntero';
import { vivo } from './vivo';

// Capa HTML de la interacción con el mouse: la mira de plano (con la cota del
// edificio apuntado) y la ficha del garage. Decorativa, como el
// resto del escenario (aria-hidden): los datos son de ejemplo y así se rotulan.
const nodo = { mira: null, cruz: null, dato: null, ficha: null, nombre: null, libres: null, distancia: null };
const registrar = (clave) => (el) => { nodo[clave] = el; };

export function CapaInteraccion() {
  return (
    <>
      <div ref={registrar('ficha')} className="plano-ficha" data-visible="false">
        <span className="plano-senal-e">E</span>
        <strong ref={registrar('nombre')} />
        <p><b ref={registrar('libres')} /> {GARAGES_DEMO.libres}</p>
        <p ref={registrar('distancia')} />
        <small>{GARAGES_DEMO.aviso}</small>
      </div>
      <div ref={registrar('mira')} className="plano-mira" data-visible="false">
        <span ref={registrar('cruz')} className="plano-mira__cruz" />
        <span ref={registrar('dato')} className="plano-mira__dato" />
      </div>
    </>
  );
}

// Va dentro del Canvas: mueve la mira con el cursor y ancla la ficha al garage.
export function ProyectorInteraccion() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new Vector3(), []);
  const previo = useRef({ dato: '', modo: '', ficha: -1, visibleMira: false, visibleFicha: false });

  useFrame(() => {
    if (!nodo.mira) return;
    const p = previo.current;

    // ── Mira ──
    const verMira = puntero.activo && !puntero.sobreUI;
    if (verMira !== p.visibleMira) {
      p.visibleMira = verMira;
      nodo.mira.dataset.visible = String(verMira);
    }
    if (verMira) {
      const x = puntero.cx.toFixed(1);
      const y = puntero.cy.toFixed(1);
      nodo.cruz.style.transform = `translate(${x}px,${y}px)`;
      nodo.dato.style.transform = `translate(${x}px,${y}px)`;
      let dato = '';
      let modo = 'suelo';
      if (puntero.garage >= 0) {
        dato = `${GARAGES_DEMO.lista[puntero.garage].nombre} · ${GARAGES_DEMO.ver}`;
        modo = 'garage';
      } else if (puntero.edificio >= 0) {
        dato = `${MIRA.edificio} · ${Math.round(EDIFICIOS[puntero.edificio].h * 10)} m ${MIRA.alto}`;
        modo = 'edificio';
      }
      if (dato !== p.dato) { p.dato = dato; nodo.dato.textContent = dato; }
      if (modo !== p.modo) {
        p.modo = modo;
        nodo.mira.dataset.modo = modo;
        // Sobre un garage el cursor avisa que se puede hacer clic.
        const raiz = nodo.mira.closest('.plano');
        if (raiz) raiz.style.cursor = modo === 'garage' ? 'pointer' : '';
      }
    }

    // ── Ficha: la del garage fijado con clic o, si no, la del que está bajo el cursor ──
    const ig = puntero.fijado >= 0 ? puntero.fijado : puntero.garage;
    const verFicha = ig >= 0 && vivo.fx.tapa < 0.05;
    if (verFicha !== p.visibleFicha) {
      p.visibleFicha = verFicha;
      nodo.ficha.dataset.visible = String(verFicha);
    }
    if (ig >= 0 && ig !== p.ficha) {
      p.ficha = ig;
      const datos = GARAGES_DEMO.lista[ig];
      nodo.nombre.textContent = datos.nombre;
      nodo.libres.textContent = String(datos.libres);
      nodo.distancia.textContent = `${GARAGES[ig].metros} m ${GARAGES_DEMO.desde}`;
    }
    nodo.ficha.dataset.fijada = String(puntero.fijado >= 0);
    if (p.ficha >= 0) {
      const g = GARAGES[p.ficha];
      v.set(g.cx, g.h + 0.4, g.cz).project(camera);
      const px = (v.x * 0.5 + 0.5) * size.width;
      const py = (-v.y * 0.5 + 0.5) * size.height;
      nodo.ficha.style.setProperty('--x', `${px.toFixed(1)}px`);
      nodo.ficha.style.setProperty('--y', `${py.toFixed(1)}px`);
    }
  });
  return null;
}
