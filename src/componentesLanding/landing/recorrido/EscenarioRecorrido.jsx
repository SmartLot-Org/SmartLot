import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react';
import PlantaSvg from './PlantaSvg';

// La capa DOM nunca importa three: la escena llega en su propio chunk.
const EscenaGarage = lazy(() => import('./EscenaGarage'));

// Si el contexto WebGL no se puede crear (o se pierde al iniciar), el
// escenario muestra la planta estática del paso en lugar de quedar vacío.
class LimiteEscena extends Component {
  state = { fallo: false };

  static getDerivedStateFromError() {
    return { fallo: true };
  }

  componentDidCatch(error) {
    console.warn('[Recorrido] La escena 3D no pudo iniciar; se muestra la planta estática.', error);
  }

  render() {
    return this.state.fallo ? this.props.respaldo : this.props.children;
  }
}

// El Canvas se monta recién cuando el recorrido está cerca y se pausa cuando
// sale de pantalla: fuera de la sección no consume GPU ni batería.
export default function EscenarioRecorrido({ paso }) {
  const ref = useRef(null);
  const [montado, setMontado] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observador = new IntersectionObserver(
      ([entrada]) => {
        setVisible(entrada.isIntersecting);
        if (entrada.isIntersecting) setMontado(true);
      },
      { rootMargin: '300px 0px' },
    );
    observador.observe(ref.current);
    return () => observador.disconnect();
  }, []);

  return (
    <div ref={ref} className="absolute inset-0" aria-hidden="true">
      {montado && (
        <LimiteEscena
          respaldo={
            <div className="flex h-full items-start justify-center px-4 pt-24 md:items-center md:justify-end md:px-12 md:pt-0">
              <PlantaSvg paso={paso} className="max-w-3xl" />
            </div>
          }
        >
          <Suspense fallback={null}>
            <EscenaGarage activa={visible} />
          </Suspense>
        </LimiteEscena>
      )}
    </div>
  );
}
