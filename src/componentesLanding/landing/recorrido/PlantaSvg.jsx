import { useId } from 'react';

// Planta cenital del garage de ejemplo, un estado por paso del recorrido. Es
// el respaldo sin 3D (sin WebGL2, reduced motion o ?sin3d) y usa la misma
// demarcación que la maqueta: celeste = solicitada, azul = trato activo.
const SEPARADORES = Array.from({ length: 11 }, (_, i) => 40 + i * 56);
const PLAZAS_TRATO = Array.from({ length: 5 }, (_, i) => 323 + i * 56);
const COLUMNAS = [
  [34, 144], [314, 144], [594, 144],
  [34, 284], [314, 284], [594, 284],
];
const TEXTO = 'fill-brand-muted font-body';

function Vehiculo({ x, y, vertical = false }) {
  return (
    <rect
      x={x}
      y={y}
      width={vertical ? 22 : 42}
      height={vertical ? 42 : 22}
      rx="4"
      className="fill-brand-deep"
    />
  );
}

export default function PlantaSvg({ paso, titulo, className = '' }) {
  const idCuadricula = useId();
  const accesible = Boolean(titulo);
  const conTrato = paso >= 1;
  const barreraAbierta = paso === 3;

  return (
    <svg
      viewBox="-90 0 730 460"
      className={`block h-auto w-full ${className}`}
      {...(accesible ? { role: 'img' } : { 'aria-hidden': 'true' })}
    >
      {accesible && <title>{titulo}</title>}
      <defs>
        <pattern id={idCuadricula} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0 L0 0 L0 20" fill="none" strokeWidth="1" className="stroke-brand-deep/[0.06]" />
        </pattern>
      </defs>
      <rect x="-90" y="0" width="730" height="460" fill={`url(#${idCuadricula})`} />
      <rect x="20" y="20" width="600" height="400" className="fill-white" />

      {PLAZAS_TRATO.map((x) => (
        <rect
          key={x}
          x={x}
          y="43"
          width="50"
          height="104"
          rx="2"
          className={conTrato ? 'fill-brand-blue' : 'fill-brand-sky stroke-brand-deep'}
          {...(conTrato ? {} : { strokeWidth: 1, strokeDasharray: '4 3' })}
        />
      ))}
      {paso >= 2 && (
        <rect x="329" y="49" width="38" height="92" rx="1" fill="none" strokeWidth="3" className="stroke-white" />
      )}

      <g strokeWidth="1.5" className="stroke-brand-deep">
        {SEPARADORES.map((x) => (
          <line key={`a${x}`} x1={x} y1="40" x2={x} y2="150" />
        ))}
        {SEPARADORES.map((x) => (
          <line key={`b${x}`} x1={x} y1="290" x2={x} y2="400" />
        ))}
      </g>
      <line x1="60" y1="220" x2="600" y2="220" strokeWidth="2" strokeDasharray="12 10" className="stroke-slate-400" />
      <g className="fill-brand-deep">
        {COLUMNAS.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="12" height="12" />
        ))}
      </g>
      <path d="M20 180 L20 20 L620 20 L620 420 L20 420 L20 260" fill="none" strokeWidth="2" className="stroke-brand-deep" />

      {paso === 4 && (
        <path
          d="M-20 220 L300 220 Q348 220 348 170 L348 118"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          className="stroke-brand-blue"
        />
      )}

      <line
        x1="44"
        y1="178"
        x2="44"
        y2={barreraAbierta ? 194 : 252}
        strokeWidth="4"
        strokeLinecap="round"
        className="stroke-brand-deep"
      />
      <rect x="40" y="170" width="8" height="8" className="fill-brand-deep" />
      <circle cx="57" cy="174" r="5" className={barreraAbierta ? 'fill-green-500' : 'fill-slate-300'} />

      <path d="M2 220 L15 220 M10 215 L15 220 L10 225" fill="none" strokeWidth="1.5" className="stroke-brand-deep" />
      <text x="-84" y="196" fontSize="13" fontWeight="600" className={TEXTO}>
        Ingreso
      </text>

      {paso === 2 && <Vehiculo x={-74} y={209} />}
      {paso === 3 && <Vehiculo x={64} y={209} />}
      {paso === 4 && <Vehiculo x={337} y={74} vertical />}

      <text x="20" y="447" fontSize="12" className={TEXTO}>
        Planta, nivel 1
      </text>
      <text x="620" y="447" textAnchor="end" fontSize="12" className={TEXTO}>
        Garage de ejemplo
      </text>
    </svg>
  );
}
