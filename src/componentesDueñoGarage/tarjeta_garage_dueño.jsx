import { useEffect, useRef, useState } from "react";
import { Archive, ArrowUpRight, Clock3, MapPin, MoreVertical, ParkingCircle, Pencil, RotateCcw, ShieldCheck } from "lucide-react";
import { getDiaDisplay } from "../helpers/diasSemana";
import "./tarjeta_garage_dueño.css";
import { formatARS } from "../helpers/prices";

function TarjetaGarageDueño({ garage, porcentajeOcupacion = 0, onClick, onBorrador, onRestaurar, esBorrador }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef(null);
  const nombre = garage.nombre || garage.name || garage.descripcion || "Garage sin nombre";
  const capacidad = Number(garage.capacidad || 0);
  const piso = garage.piso ? `Nivel ${garage.piso}` : "Sin nivel";
  const estadoActivo = garage.estado === true || garage.estado === 1 || String(garage.estado).toLowerCase() === "activo" || String(garage.estado).toLowerCase() === "abierto";

  useEffect(() => {
    if (!menuAbierto) return;

    const manejarClickFuera = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuAbierto(false);
      }
    };

    document.addEventListener("mousedown", manejarClickFuera);
    return () => document.removeEventListener("mousedown", manejarClickFuera);
  }, [menuAbierto]);

  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <article className={`duenio-garage-card${esBorrador ? " is-draft" : ""}`}>
      <div className="duenio-garage-card-top">
        <span className={`duenio-garage-state${esBorrador ? " is-draft" : (estadoActivo ? " is-open" : " is-closed")}`}>
          <ShieldCheck size={15} />
          {esBorrador ? "Borrador" : (estadoActivo ? "Operativo" : "Cerrado")}
        </span>

        <div className="duenio-garage-card-top-actions">
          {!esBorrador && (
            <button onClick={onClick} aria-label={`Ver detalle de ${nombre}`}>
              <ArrowUpRight size={19} />
            </button>
          )}
          {!esBorrador && (
            <div className="duenio-card-menu" ref={menuRef}>
              <button onClick={() => setMenuAbierto((prev) => !prev)} aria-label="Acciones del garage" className="duenio-card-menu-toggle">
                <MoreVertical size={18} />
              </button>
              {menuAbierto && (
                <div className="duenio-card-menu-list">
                  <button onClick={() => { cerrarMenu(); onClick(); }}><Pencil size={16}/> Editar</button>
                  <button className="danger" onClick={() => { cerrarMenu(); onBorrador?.(); }}><Archive size={16}/> Mover a borrador</button>
                </div>
              )}
            </div>
          )}
          {esBorrador && (
            <button onClick={onRestaurar} aria-label={`Restaurar ${nombre}`} className="duenio-restore-btn">
              <RotateCcw size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="duenio-garage-prices">
        <span>Auto <strong>{formatARS(garage.precio_auto)}</strong></span>
        <span>Moto <strong>{formatARS(garage.precio_moto)}</strong></span>
        <span>Pickup <strong>{formatARS(garage.precio_pickup)}</strong></span>
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

      {esBorrador && (
        <button className="duenio-card-restore-cta" onClick={onRestaurar}>
          <RotateCcw size={16} />
          Restaurar garage
        </button>
      )}
    </article>
  );
}

export default TarjetaGarageDueño;
