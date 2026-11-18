import { useEffect } from 'react';
import { CELULAR, ELEGIR, SECCIONES } from '../contenido/secciones';
import { useUI } from '../estado/store';
import { rig } from '../scroll/rig';

const MI_SECCION = SECCIONES.findIndex((s) => s.piezas?.includes('elegirDia'));

// Elegí un día: cinco botones (Lun a Vie). Al tocar uno, el celular muestra esa
// reserva y en la planta se resalta su plaza. Tocar el mismo día otra vez lo
// suelta y el dibujo vuelve a seguir al scroll. Al salir de la sección se suelta.
export function ElegirDia() {
  const elegido = useUI((s) => s.diaElegido);
  const setDiaElegido = useUI((s) => s.setDiaElegido);
  const seccion = useUI((s) => s.seccion);

  useEffect(() => { if (seccion !== MI_SECCION) setDiaElegido(null); }, [seccion, setDiaElegido]);
  useEffect(() => () => setDiaElegido(null), [setDiaElegido]);

  return (
    <div className="plano-dias">
      <p className="plano-dias__titulo" id="elegir-dia-titulo">{ELEGIR.titulo}</p>
      <div className="plano-dias__botones" role="group" aria-labelledby="elegir-dia-titulo">
        {CELULAR.dias.map((d, i) => (
          <button
            key={d}
            type="button"
            aria-pressed={elegido === i}
            onClick={() => {
              setDiaElegido(elegido === i ? null : i);
              rig.requestFrame();   // con movimiento reducido el 3D dibuja a pedido
            }}
          >
            <span>{d}</span>
            <b>{16 + i}</b>
          </button>
        ))}
      </div>
      <p className="plano-dias__ayuda" aria-live="polite">
        {elegido == null
          ? ELEGIR.ayuda
          : <>{CELULAR.dias[elegido]} {16 + elegido} · <strong>{CELULAR.plaza} {CELULAR.plazas[elegido]}</strong> · {CELULAR.horario}</>}
      </p>
    </div>
  );
}
