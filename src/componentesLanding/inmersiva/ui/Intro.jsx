import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { INTRO } from '../contenido/secciones';
import { marcarIntroVista, useUI } from '../estado/store';

gsap.registerPlugin(useGSAP, DrawSVGPlugin, ScrambleTextPlugin);

const CARACTERES = '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ·:';

// Entrada de la landing: el cajetín de un plano técnico se dibuja, se completa
// como si lo tipeara un plotter y se levanta para mostrar la ciudad. Corre una
// vez por sesión; con movimiento reducido no aparece (ver store).
// Es decorativo: el h1 del hero ya está en el HTML debajo.
export function Intro() {
  const activa = useUI((s) => s.intro);
  const setIntro = useUI((s) => s.setIntro);
  const raiz = useRef(null);

  useGSAP(() => {
    if (!activa) return;
    marcarIntroVista();
    const q = gsap.utils.selector(raiz);
    const tl = gsap.timeline({ onComplete: () => setIntro(false) });
    tl.from(q('.plano-intro__marco'), { drawSVG: 0, duration: 0.7, ease: 'power2.inOut' })
      .from(q('.plano-intro__division'), { drawSVG: 0, duration: 0.45, ease: 'power2.out', stagger: 0.06 }, '-=0.25')
      .from(q('.plano-intro__logo'), { autoAlpha: 0, scale: 0.6, duration: 0.5, ease: 'back.out(2)' }, '-=0.35')
      .to(q('.plano-intro__titulo'), { duration: 0.6, scrambleText: { text: INTRO.titulo, chars: CARACTERES, speed: 0.6 } }, '<')
      .from(q('.plano-intro__clave'), { autoAlpha: 0, x: -6, duration: 0.3, stagger: 0.07 }, '-=0.3');
    q('.plano-intro__valor').forEach((el, i) => {
      tl.to(el, { duration: 0.45, scrambleText: { text: INTRO.filas[i][1], chars: CARACTERES, speed: 0.8 } }, i ? '<0.1' : '-=0.15');
    });
    tl.to(q('.plano-intro__cajetin'), { y: -24, autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, '+=0.35')
      .to(raiz.current, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.75, ease: 'expo.inOut' }, '-=0.2');
  }, { scope: raiz, dependencies: [activa] });

  if (!activa) return null;
  return (
    <div ref={raiz} className="plano-intro" aria-hidden="true">
      <div className="plano-intro__cajetin">
        <svg className="plano-intro__trazo" viewBox="0 0 360 200" preserveAspectRatio="none">
          <rect className="plano-intro__marco" x="0.5" y="0.5" width="359" height="199" />
          <line className="plano-intro__division" x1="0" y1="96" x2="360" y2="96" />
          <line className="plano-intro__division" x1="0" y1="130" x2="360" y2="130" />
          <line className="plano-intro__division" x1="0" y1="164" x2="360" y2="164" />
          <line className="plano-intro__division" x1="96" y1="96" x2="96" y2="200" />
        </svg>
        <div className="plano-intro__cabecera">
          <img className="plano-intro__logo" src="/landing/marca.webp" alt="" width="34" height="48" />
          <span className="plano-intro__titulo">&nbsp;</span>
        </div>
        <dl className="plano-intro__filas">
          {INTRO.filas.map(([clave]) => (
            <div key={clave}>
              <dt className="plano-intro__clave">{clave}</dt>
              <dd className="plano-intro__valor">&nbsp;</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
