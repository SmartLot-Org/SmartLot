import { ArrowUpRight, Clock3, MapPin, ParkingCircle, ShieldCheck } from "lucide-react";
import { getDiaDisplay } from "../helpers/diasSemana";
import "./tarjeta_garage_dueño.css";

function TarjetaGarageDueño({ garage, porcentajeOcupacion = 0, onClick }) {
  const nombre = garage.nombre || garage.name || garage.descripcion || "Garage sin nombre";
  const capacidad = Number(garage.capacidad || 0);
  const piso = garage.piso ? `Nivel ${garage.piso}` : "Sin nivel";
  const estadoActivo = garage.estado === true || garage.estado === 1 || String(garage.estado).toLowerCase() === "activo" || String(garage.estado).toLowerCase() === "abierto";

  return (
    <article className="duenio-garage-card">
      <div className="duenio-garage-card-top">
        <span className={`duenio-garage-state${estadoActivo ? " is-open" : " is-closed"}`}>
          <ShieldCheck size={15} />
          {estadoActivo ? "Operativo" : "Cerrado"}
        </span>
        <button onClick={onClick} aria-label={`Ver detalle de ${nombre}`}>
          <ArrowUpRight size={19} />
        </button>
      </div>

      <div className="duenio-garage-title">
        <span className="duenio-garage-index">SL Garage</span>
        <h3>{nombre}</h3>
      </div>

      <div className="duenio-garage-mapline">
        <MapPin size={17} />
        <span>{garage.ubicacion || "Ubicacion pendiente"}</span>
      </div>

      <div className="duenio-garage-metrics">
        <div>
          <ParkingCircle size={18} />
          <strong>{capacidad}</strong>
          <span>plazas</span>
        </div>
        <div>
          <Clock3 size={18} />
          <strong>{piso}</strong>
          <span>{garage.hora_apertura && garage.hora_cierre ? `${garage.hora_apertura} - ${garage.hora_cierre}` : "Horario no definido"}</span>
        </div>
      </div>

      {Array.isArray(garage.dias) && garage.dias.length > 0 && (
        <div className="duenio-garage-days">
          {garage.dias.slice(0, 7).map((dia) => (
            <span key={dia}>{getDiaDisplay(dia)}</span>
          ))}
        </div>
      )}

      <div className="duenio-garage-occupancy">
        <div>
          <span>Ocupacion actual</span>
          <strong>{porcentajeOcupacion}%</strong>
        </div>
        <div className="duenio-garage-bar">
          <span style={{ width: `${porcentajeOcupacion}%` }} />
        </div>
      </div>
    </article>
  );
}

export default TarjetaGarageDueño;
