import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useUI } from '../estado/store';
import { avancesFinales, componer, PESOS } from './estado';
import { CONSULTA_VERTICAL, rig } from './rig';

gsap.registerPlugin(useGSAP, ScrollTrigger);

// El director: el ÚNICO que escribe rig.
// Mide con ScrollTrigger cuánto avanzó cada sección (entrada: de asomar por abajo
// a llegar arriba; estadía: el resto) y compone el estado con funciones puras.
// Al ser una función de la posición, el relato es reversible y no depende del
// orden en que se actualicen los triggers.
export function useStoryTimeline(scope) {
  const setSeccion = useUI((s) => s.setSeccion);
  const sin3d = useUI((s) => s.sin3d);
  const mostrar3d = useUI((s) => s.inicializado && s.tier !== 'static' && !s.sin3d);

  useGSAP(() => {
    const els = gsap.utils.toArray('[data-seccion]');
    els.forEach((el, i) => ScrollTrigger.create({
      trigger: el, start: 'top center', end: 'bottom center',
      onToggle: (self) => { if (self.isActive) setSeccion(i); },
    }));
    if (!mostrar3d) return;

    const mm = gsap.matchMedia();
    mm.add({
      movimiento: '(prefers-reduced-motion: no-preference)',
      reducido: '(prefers-reduced-motion: reduce)',
      vertical: CONSULTA_VERTICAL,
    }, (ctx) => {
      const { reducido, vertical } = ctx.conditions;
      const escribir = (avances) => {
        componer(avances, vertical, rig);
        rig.requestFrame();
      };
      rig.vertical = vertical;
      rig.snap = reducido;

      if (reducido) {
        // Sin recorrido: al cambiar de sección se muestra su estado final.
        escribir(avancesFinales(0));
        els.forEach((el, i) => ScrollTrigger.create({
          trigger: el, start: 'top center', end: 'bottom center',
          onToggle: (self) => { if (self.isActive) escribir(avancesFinales(i)); },
        }));
        return;
      }

      const entrada = PESOS.map((_, i) => (i === 0 ? 1 : 0));
      const estadia = PESOS.map(() => 0);
      const avances = PESOS.map(() => 0);
      const actualizar = () => {
        for (let i = 0; i < PESOS.length; i++) avances[i] = entrada[i] + estadia[i] * (PESOS[i] - 1);
        escribir(avances);
      };
      els.forEach((el, i) => {
        if (i > 0) {
          const medir = (self) => { entrada[i] = self.progress; actualizar(); };
          ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'top top', scrub: true, onUpdate: medir, onRefresh: medir });
        }
        if (PESOS[i] > 1) {
          const medir = (self) => { estadia[i] = self.progress; actualizar(); };
          ScrollTrigger.create({ trigger: el, start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: medir, onRefresh: medir });
        }
      });
      actualizar();
    });
  }, { scope, dependencies: [sin3d, mostrar3d], revertOnUpdate: true }); // la versión sin 3D cambia el layout
}
