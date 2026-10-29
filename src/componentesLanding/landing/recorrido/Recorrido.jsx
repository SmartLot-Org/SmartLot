import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { pasoActivo } from '../../../helpers/recorridoLanding';
import { recorrido } from '../contenido';
import EscenarioRecorrido from './EscenarioRecorrido';
import PlantaSvg from './PlantaSvg';
import { rigRecorrido } from './rigRecorrido';
import useModoRecorrido from './useModoRecorrido';

gsap.registerPlugin(useGSAP, ScrollTrigger);

const { pasos } = recorrido;
const TOTAL = pasos.length;

function Numeral({ indice }) {
  return (
    <div className="font-display text-5xl font-black leading-none text-brand-blue tabular-nums">
      {indice + 1}
      <span className="text-2xl font-bold text-brand-muted"> de {TOTAL}</span>
    </div>
  );
}

function Progreso({ indice }) {
  return (
    <div className="mt-6 flex gap-1.5" aria-hidden="true">
      {pasos.map((p, i) => {
        let tono = 'bg-slate-300';
        if (i < indice) tono = 'bg-brand-deep';
        if (i === indice) tono = 'bg-brand-blue';
        return <span key={p.id} className={`h-1 flex-1 rounded-full ${tono}`} />;
      })}
    </div>
  );
}

// Flujo normal, una planta por paso: sin WebGL2, con reduced motion o ?sin3d.
function RecorridoEstatico() {
  return (
    <section
      id="recorrido"
      data-modo="estatico"
      aria-labelledby="recorrido-titulo"
      className="relative z-10 py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-6 text-left">
        {/* El margen va en el contenedor: .landing-page h2 fija margin: 0. */}
        <header className="mb-12 md:mb-16">
          <h2 id="recorrido-titulo" className="titulo-relato">{recorrido.titulo}</h2>
        </header>
        <ol className="grid gap-14 md:gap-20">
          {pasos.map((paso, i) => (
            <li key={paso.id} className="grid items-center gap-6 md:grid-cols-[1.15fr_1fr] md:gap-12">
              <figure className="m-0 rounded-[14px] border border-brand-navy/10 bg-white p-3 md:p-4">
                <PlantaSvg paso={i} titulo={paso.figura} />
              </figure>
              <div>
                <Numeral indice={i} />
                <h3 className="mt-4 text-2xl font-semibold leading-tight text-brand-warm md:text-3xl">
                  {paso.titulo}
                </h3>
                <p className="texto-relato mt-3 max-w-[42ch]">{paso.cuerpo}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// Escenario fijo con la maqueta y un panel por paso que pasa por encima. Un
// solo ScrollTrigger escribe el rig; la escena lo lee en cada frame y el paso
// discreto solo actualiza React cuando cambia.
function RecorridoInmersivo() {
  const ref = useRef(null);
  const [paso, setPaso] = useState(0);

  useGSAP(
    () => {
      const sincronizar = (self) => {
        rigRecorrido.progreso = self.progress;
        const actual = pasoActivo(self.progress, TOTAL);
        setPaso((previo) => (previo === actual ? previo : actual));
      };
      const entrar = (self) => {
        rigRecorrido.entrada = self.progress;
      };
      ScrollTrigger.create({
        trigger: ref.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: sincronizar,
        onRefresh: sincronizar,
      });
      ScrollTrigger.create({
        trigger: ref.current,
        start: 'top bottom',
        end: 'top top',
        onUpdate: entrar,
        onRefresh: entrar,
      });
      return () => {
        rigRecorrido.progreso = 0;
        rigRecorrido.entrada = 0;
      };
    },
    { scope: ref },
  );

  return (
    <section
      id="recorrido"
      ref={ref}
      data-modo="inmersivo"
      aria-labelledby="recorrido-titulo"
      className="relative z-10"
    >
      <div className="sticky top-0 h-svh overflow-hidden bg-brand-bg">
        <EscenarioRecorrido paso={paso} />
      </div>
      <div className="relative -mt-[100svh]">
        {pasos.map((p, i) => (
          <article
            key={p.id}
            aria-labelledby={`paso-${p.id}`}
            className="flex h-svh items-end pb-4 sm:pb-8 md:pb-[9svh]"
          >
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
              <div className="max-w-md rounded-[14px] border border-brand-navy/10 bg-white/90 p-6 text-left shadow-lg backdrop-blur-md md:p-8">
                {i === 0 && (
                  <h2 id="recorrido-titulo" className="recorrido-etiqueta">
                    {recorrido.titulo}
                  </h2>
                )}
                <Numeral indice={i} />
                <h3 id={`paso-${p.id}`} className="mt-4 text-2xl font-semibold leading-tight text-brand-warm md:text-3xl">
                  {p.titulo}
                </h3>
                <p className="texto-relato mt-3">{p.cuerpo}</p>
                <Progreso indice={i} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function Recorrido() {
  const modo = useModoRecorrido();

  // Cambiar de modo en caliente (p. ej. activar reduced motion) cambia el alto
  // de la página: los demás ScrollTrigger tienen que volver a medirse.
  useEffect(() => {
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [modo]);

  return modo === 'inmersivo' ? <RecorridoInmersivo /> : <RecorridoEstatico />;
}
