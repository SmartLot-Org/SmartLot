import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Un solo loop: gsap.ticker mueve a Lenis y cada scroll de Lenis avisa a
// ScrollTrigger. Un requestAnimationFrame propio competiría con el ticker y
// metería jitter en el escenario fijo del recorrido.
//
// Sin `anchors`: Lenis no cancela el salto nativo del hash, así que las
// anclas (incluido "Saltar al contenido") siguen siendo nativas y mueven el
// foco; Lenis solo se resincroniza con ese scroll.
export function initSmoothScroll() {
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);

  const tick = (time) => lenis.raf(time * 1000); // el ticker va en segundos, Lenis en ms
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return () => {
    gsap.ticker.remove(tick);
    // Valores por defecto de GSAP: los paneles siguen usando el ticker.
    gsap.ticker.lagSmoothing(500, 33);
    lenis.destroy();
  };
}
