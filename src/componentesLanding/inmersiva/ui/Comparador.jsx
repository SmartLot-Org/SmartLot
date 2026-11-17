import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { COMPARAR } from '../contenido/secciones';
import { useUI } from '../estado/store';

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Deslizador "hoy / con SmartLot": mueve el dibujo entre el caos de hoy (autos
// dando vueltas, arreglos por chat) y el trato ordenado. Es un input range
// común, así funciona con teclado y lectores de pantalla.
// La primera vez que se ve, se asoma solo un poco para invitar a usarlo.
export function Comparador() {
  const comparar = useUI((s) => s.comparar);
  const setComparar = useUI((s) => s.setComparar);
  const raiz = useRef(null);
  const tocado = useRef(false);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const proxy = { v: 0 };
      const asomo = gsap.timeline({ paused: true, onUpdate: () => { if (!tocado.current) setComparar(proxy.v); } })
        .to(proxy, { v: 0.32, duration: 0.7, ease: 'power2.inOut' }, 0.6)
        .to(proxy, { v: 0, duration: 0.8, ease: 'power2.inOut' }, '+=0.35');
      ScrollTrigger.create({
        trigger: raiz.current, start: 'top 85%', once: true,
        onEnter: () => { if (!tocado.current && useUI.getState().comparar === 0) asomo.play(); },
      });
    });
  }, { scope: raiz });

  const valor = Math.round(comparar * 100);
  const despues = comparar >= 0.5;
  return (
    <div ref={raiz} className="plano-comparar" style={{ '--valor': comparar }}>
      <div className="plano-comparar__rotulos" aria-hidden="true">
        <span data-activo={!despues}>{COMPARAR.antes}</span>
        <span data-activo={despues}>{COMPARAR.despues}</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={valor}
        aria-label={COMPARAR.etiqueta}
        aria-valuetext={despues ? COMPARAR.despues : COMPARAR.antes}
        onPointerDown={() => { tocado.current = true; }}
        onKeyDown={() => { tocado.current = true; }}
        onChange={(e) => { tocado.current = true; setComparar(Number(e.target.value) / 100); }}
      />
      <small>{COMPARAR.ayuda}</small>
    </div>
  );
}
