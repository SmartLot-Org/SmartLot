import { useMemo } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useUI } from '../estado/store';
import { crearGuion } from './guion';
import { CONSULTA_VERTICAL, rig } from './rig';
import { velocidadScroll } from './smoothScroll';

gsap.registerPlugin(useGSAP, ScrollTrigger);

// El director: el ÚNICO que escribe rig.
// Mide con ScrollTrigger cuánto avanzó cada sección (entrada: de asomar por abajo
// a llegar arriba; estadía: el resto) y compone el estado con funciones puras.
// Al ser una función de la posición, el relato es reversible y no depende del
// orden en que se actualicen los triggers.
// La coreografía es de la página (pagina.guion). Sin guion o sin escena, solo
// marca la sección activa y no escribe rig.
export function useStoryTimeline(scope, pagina) {
  const setSeccion = useUI((s) => s.setSeccion);
  const sin3d = useUI((s) => s.sin3d);
  const mostrar3d = useUI((s) => s.inicializado && s.tier !== 'static' && !s.sin3d) && !!pagina.escena;
  // crearGuion es puro y la página es un objeto fijo: se arma una vez por página.
  const guion = useMemo(() => (pagina.guion ? crearGuion(pagina) : null), [pagina]);

  useGSAP(() => {
    const els = gsap.utils.toArray('[data-seccion]');
    els.forEach((el, i) => ScrollTrigger.create({
      trigger: el, start: 'top center', end: 'bottom center',
      onToggle: (self) => { if (self.isActive) setSeccion(i); },
    }));
    if (!mostrar3d || !guion) return;

    const mm = gsap.matchMedia();
    mm.add({
      movimiento: '(prefers-reduced-motion: no-preference)',
      reducido: '(prefers-reduced-motion: reduce)',
      vertical: CONSULTA_VERTICAL,
    }, (ctx) => {
      const { reducido, vertical } = ctx.conditions;
      const { pesos } = guion;
      let ultimos = guion.avancesFinales(0);
      const escribir = (avances) => {
        ultimos = avances;
        guion.componer(avances, vertical, rig);
        pagina.guion.ajustar?.(rig, avances, vertical);
        rig.requestFrame();
      };
      // Los controles de la nota que mueven el dibujo (el deslizador de la home,
      // el interruptor de garages) recomponen sin esperar al scroll.
      const soltarControles = pagina.guion.suscribir?.(() => escribir(ultimos)) ?? (() => {});
      rig.vertical = vertical;
      rig.snap = reducido;

      if (reducido) {
        // Sin recorrido: al cambiar de sección se muestra su estado final.
        escribir(guion.avancesFinales(0));
        els.forEach((el, i) => ScrollTrigger.create({
          trigger: el, start: 'top center', end: 'bottom center',
          onToggle: (self) => { if (self.isActive) escribir(guion.avancesFinales(i)); },
        }));
        return soltarControles;
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
        soltarControles();
        gsap.ticker.remove(medirVelocidad);
        rig.velocidad = 0;
        raiz?.style.removeProperty('--inercia');
      };

      const entrada = pesos.map((_, i) => (i === 0 ? 1 : 0));
      const estadia = pesos.map(() => 0);
      const avances = pesos.map(() => 0);
      const actualizar = () => {
        for (let i = 0; i < pesos.length; i++) avances[i] = entrada[i] + estadia[i] * (pesos[i] - 1);
        escribir(avances);
      };
      els.forEach((el, i) => {
        if (i > 0) {
          const medir = (self) => { entrada[i] = self.progress; actualizar(); };
          ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'top top', scrub: true, onUpdate: medir, onRefresh: medir });
        }
        if (pesos[i] > 1) {
          const medir = (self) => { estadia[i] = self.progress; actualizar(); };
          ScrollTrigger.create({ trigger: el, start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: medir, onRefresh: medir });
        }
      });
      actualizar();
      return soltarVelocidad;
    });
  }, { scope, dependencies: [sin3d, mostrar3d, guion], revertOnUpdate: true }); // la versión sin 3D cambia el layout
}
