import "./tarjeta_garages.css";
import { Pencil, MapPin, Clock } from "lucide-react";
import { getDiaDisplay } from "../helpers/diasSemana";

function TarjetaGarage({
  titulo,
  plazas,
  estado,
  capacidad,
  dias,
  imagen,
  ultimoReporte,
  onClick,
  relaciones = [],
}) {
  const estaAbierto = estado?.toLowerCase() === "abierto";

  return (
    <article className="tarjeta-garage" onClick={onClick}>
      <div className="garage-media">
        <img src={imagen} alt={titulo} className="garage-img" />

        <span
          className={`estado-garage ${
            estaAbierto ? "estado-abierto" : "estado-cerrado"
          }`}
        >
          {estado}
        </span>
      </div>

      <div className="garage-content">
        <div className="garage-header">
          <h3>{titulo}</h3>

          <button
            className="btn-editar"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            aria-label={`Editar ${titulo}`}
          >
            <Pencil size={18} />
          </button>
        </div>

        <div className="garage-meta">
          <span>
            <MapPin size={17} />
            {plazas} plazas
          </span>

          <span>
            <Clock size={17} />
            {ultimoReporte}
          </span>

          {relaciones.length > 0 ? (
            <span className="garage-badges">
              {relaciones.map((relacion) => (
                <span key={`${relacion.idEmpresa}:${relacion.idSede}`}>
                  <span className="badge-empresa">{relacion.empresaNombre}</span>
                  <span className="badge-sede">{relacion.sedeNombre}</span>
                </span>
              ))}
            </span>
          ) : <span className="garage-badges">Sin tratos</span>}
        </div>

        {Array.isArray(dias) && dias.length > 0 && (
          <div className="garage-dias">
            {dias.map((dia) => (
              <span key={dia} className="garage-dia-pill">{getDiaDisplay(dia)}</span>
            ))}
          </div>
        )}

        <div className="capacidad-container">
          <div className="capacidad-label">
            <span>Capacidad</span>
            <strong>{capacidad}</strong>
          </div>

          <div className="barra-capacidad">
            <div className="barra-fill" style={{ width: capacidad }} />
          </div>
        </div>
      </div>
    </article>
  );
}

export default TarjetaGarage;
