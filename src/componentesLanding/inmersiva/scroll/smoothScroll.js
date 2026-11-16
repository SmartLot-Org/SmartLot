import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
let lenis = null;

// UN loop: gsap.ticker → lenis.raf; cada scroll de Lenis → ScrollTrigger.update.
// Lenis respeta prefers-reduced-motion y deja el táctil nativo.
export function initSmoothScroll() {
  // En celular la barra del navegador cambia el alto al aparecer y desaparecer.
  // Sin esto, cada cambio dispara un refresh y la cámara salta.
  ScrollTrigger.config({ ignoreMobileResize: true });

  lenis = new Lenis({ lerp: 0.1, smoothWheel: true, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  const tick = (time) => lenis?.raf(time * 1000); // el ticker va en segundos; Lenis, en ms
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  return () => {
    gsap.ticker.remove(tick);
    gsap.ticker.lagSmoothing(500, 33);
    lenis?.destroy();
    lenis = null;
  };
}

export function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { duration: 1.2 });
  else el.scrollIntoView();
}
