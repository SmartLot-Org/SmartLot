import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';

gsap.registerPlugin(useGSAP);

// Botón magnético: con mouse, el botón sigue un poco al cursor mientras está
// encima y vuelve a su lugar al salir. Sin efecto en
// táctil ni con movimiento reducido.
export function useMagnetico(ref, fuerza = 0.28) {
  useGSAP(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const x = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' });
      const y = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' });
      const mover = (e) => {
        const r = el.getBoundingClientRect();
        x((e.clientX - (r.left + r.width / 2)) * fuerza);
        y((e.clientY - (r.top + r.height / 2)) * fuerza);
      };
      // Sin rebote: DESIGN.md no admite easing elástico.
      const soltar = () => gsap.to(el, { x: 0, y: 0, duration: 0.35, ease: 'power3.out', overwrite: true });
      el.addEventListener('pointermove', mover);
      el.addEventListener('pointerleave', soltar);
      return () => {
        el.removeEventListener('pointermove', mover);
        el.removeEventListener('pointerleave', soltar);
        gsap.set(el, { x: 0, y: 0 });
      };
    });
  }, { dependencies: [fuerza] });
}
