import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

// Texto cinético de las secciones (nunca del hero, que es HTML quieto desde el
// primer render): al asomar, el título sube palabra por palabra desde una
// máscara y el resto de la nota lo sigue. Con movimiento reducido o `activo`
// en false no se parte nada y el texto queda quieto.
export function useTituloCinetico(ref, { activo, dependencias = [] }) {
  useGSAP(() => {
    if (!activo) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const nota = ref.current.querySelector('.plano-nota');
      const titulo = nota.querySelector('h2');
      const resto = nota.querySelectorAll(':scope > :not(h2)');
      SplitText.create(titulo, {
        type: 'words',
        mask: 'words',
        aria: 'auto',
        wordsClass: 'plano-palabra',
        autoSplit: true,
        onSplit: (self) => {
          const tl = gsap.timeline({
            scrollTrigger: { trigger: ref.current, start: 'top 82%', toggleActions: 'play none none reverse' },
          });
          // El resto entra solo con opacidad: con autoAlpha quedaba fuera del árbol de
          // accesibilidad hasta revelarse, y el lector de pantalla no lo encontraba.
          tl.from(self.words, { yPercent: 110, rotate: 4, duration: 0.9, ease: 'expo.out', stagger: 0.06 })
            .from(resto, { y: 14, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08 }, '-=0.55');
          return tl;
        },
      });
    });
  }, { scope: ref, dependencies: [activo, ...dependencias], revertOnUpdate: true });
}
