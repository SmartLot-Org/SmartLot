import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DEMO } from '../contenido/secciones';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const aNumero = (importe) => Number(importe.replace(/\D/g, ''));
const formato = new Intl.NumberFormat('es-AR');

// El detalle de consumos como lo muestra el producto: tiempo, tarifa e importe
// por reserva. Los valores son de demostración y la tabla lo dice.
export function TablaConsumos() {
  const { titulo, columnas, filas, total, exportar } = DEMO.consumos;
  const raiz = useRef(null);
  const cifra = useRef(null);

  // Las filas se cargan una por una y el total cuenta hasta su valor. El texto
  // final ya está en el HTML: con movimiento reducido no se toca.
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const contador = { v: 0 };
      const tl = gsap.timeline({ scrollTrigger: { trigger: raiz.current, start: 'top 90%', toggleActions: 'play none none reverse' } });
      // Opacidad y no autoAlpha: las filas siguen en el árbol de accesibilidad antes de entrar.
      tl.from(raiz.current.querySelectorAll('tbody tr'), { opacity: 0, x: -12, duration: 0.45, ease: 'power2.out', stagger: 0.09 })
        .to(contador, {
          v: aNumero(total.importe), duration: 1.1, ease: 'power3.out',
          onUpdate: () => { cifra.current.textContent = `$ ${formato.format(Math.round(contador.v))}`; },
        }, '-=0.2');
      return () => { cifra.current.textContent = total.importe; };
    });
  }, { scope: raiz });

  return (
    <div ref={raiz} className="plano-planilla">
      <table>
        <caption>
          {titulo} <small>{DEMO.aviso}</small>
        </caption>
        <thead>
          <tr>
            {columnas.map((c, i) => <th key={c} scope="col" className={i ? 'num' : undefined}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.reserva}>
              <th scope="row">{f.reserva}</th>
              <td className="num">{f.tiempo}</td>
              <td className="num">{f.tarifa}</td>
              <td className="num">{f.importe}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" colSpan={3}>{total.etiqueta}</th>
            <td ref={cifra} className="num">{total.importe}</td>
          </tr>
        </tfoot>
      </table>
      <p>{exportar}</p>
    </div>
  );
}
