import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useUI } from '../estado/store';
import { aplicarComparacion, avancesFinales, componer, PESOS } from './estado';
import { CONSULTA_VERTICAL, rig } from './rig';
import { velocidadScroll } from './smoothScroll';

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
      let ultimos = avancesFinales(0);
      const escribir = (avances) => {
        ultimos = avances;
        componer(avances, vertical, rig);
        aplicarComparacion(rig, useUI.getState().comparar, avances, vertical);
        rig.requestFrame();
      };
      // El deslizador antes / con SmartLot recompone sin esperar al scroll.
      const soltarComparar = useUI.subscribe((s, previo) => {
        if (s.comparar !== previo.comparar) escribir(ultimos);
      });
      rig.vertical = vertical;
      rig.snap = reducido;

      if (reducido) {
        // Sin recorrido: al cambiar de sección se muestra su estado final.
        escribir(avancesFinales(0));
        els.forEach((el, i) => ScrollTrigger.create({
          trigger: el, start: 'top center', end: 'bottom center',
          onToggle: (self) => { if (self.isActive) escribir(avancesFinales(i)); },
        }));
        return soltarComparar;
      }

      // Inercia: la velocidad del scroll pasa al dibujo y a las notas (--inercia).
      const raiz = scope.current?.closest('.plano');
      let inercia = 0;
      const medirVelocidad = () => {
        rig.velocidad = velocidadScroll();
        inercia += (Math.max(-1, Math.min(1, rig.velocidad / 45)) - inercia) * 0.18;
        if (Math.abs(inercia) < 0.001) inercia = 0;
        raiz?.style.setProperty('--inercia', inercia.toFixed(3));
      };
      gsap.ticker.add(medirVelocidad);
      const soltarVelocidad = () => {
        soltarComparar();
        gsap.ticker.remove(medirVelocidad);
        rig.velocidad = 0;
        raiz?.style.removeProperty('--inercia');
      };

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
      return soltarVelocidad;
    });
  }, { scope, dependencies: [sin3d, mostrar3d], revertOnUpdate: true }); // la versión sin 3D cambia el layout
}
