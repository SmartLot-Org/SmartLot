import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { DEMO } from '../contenido/secciones';
import { rig } from '../scroll/rig';

// Contador que acompaña al dibujo: lee rig en el ticker de GSAP y escribe el
// texto por ref, sin pasar por el estado de React. Es decorativo (aria-hidden):
// la cifra es un dato de ejemplo del plano, no una métrica del producto.
export function Dato() {
  const cifra = useRef(null);

  useEffect(() => {
    let ultima = -1;
    const leer = () => {
      const n = Math.round(DEMO.plazasDelTrato * rig.fx.llenas);
      if (n === ultima || !cifra.current) return;
      ultima = n;
      cifra.current.textContent = String(n);
    };
    gsap.ticker.add(leer);
    return () => gsap.ticker.remove(leer);
  }, []);

  return (
    <p className="plano-dato" aria-hidden="true">
      <strong ref={cifra}>0</strong>
      <span>de {DEMO.plazasDelTrato} {DEMO.reservadas}</span>
      <small>{DEMO.aviso}</small>
    </p>
  );
}
