import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CONSUMOS } from '../../contenido/garages';

gsap.registerPlugin(useGSAP, ScrollTrigger);

// "Consumos por empresa" con las columnas de la pantalla del dueño
// (vistasDueñoGarage/cuentas_por_cobrar.jsx): tres filas y el total que suman.
// Entra fila por fila y el total al final, solo con opacidad: el texto está en el
// HTML desde el primer render y sigue en el árbol de accesibilidad mientras entra.
export function TablaConsumosGarage() {
  const { titulo, aviso, columnas, filas, total, pie } = CONSUMOS;
  const raiz = useRef(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(raiz.current.querySelectorAll('tbody tr, tfoot tr'), {
        opacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.09,
        scrollTrigger: { trigger: raiz.current, start: 'top 90%', toggleActions: 'play none none reverse' },
      });
    });
  }, { scope: raiz });

  return (
    <div ref={raiz} className="plano-planilla garages-consumos" data-ui="consumos">
      <table>
        <caption>
          {titulo} <small>{aviso}</small>
        </caption>
        <thead>
          <tr>
            {columnas.map((c, i) => <th key={c} scope="col" className={i ? 'num' : undefined}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.empresa}>
              <th scope="row">{f.empresa}</th>
              <td className="num">{f.reservas}</td>
              <td className="num">{f.tiempo}</td>
              <td className="num">{f.importe}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">{total.etiqueta}</th>
            <td className="num">{total.reservas}</td>
            <td className="num">{total.tiempo}</td>
            <td className="num">{total.importe}</td>
          </tr>
        </tfoot>
      </table>
      <p>{pie}</p>
    </div>
  );
}
