// src/componentesEmpleado/formulario_detalles_vehiculo.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Car, Plus, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import { VehiculosDelete } from "../servicies/API_Vehiculo";
import EmptyState from "../componentesCompartidos/EmptyState";
import BotonGenerico from "../componentesAdmin/boton_generico";
import "./formulario_vehiculo.css";

export default function FormularioDetallesVehiculo({ vehiculos = [], onVehiculoEliminado }) {
  const navigate = useNavigate();

  return (
    <section className="vehiculo-card-seccion formulario-seccion animate-section">
      <div className="form-card-header" style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div className="icon-badge-box" style={{ width: "36px", height: "36px", background: "rgb(239, 246, 255)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Car size={20} style={{ color: "rgb(59, 130, 246)" }} />
        </div>
        <h3 className="formulario-subtitulo" style={{ margin: 0, borderBottom: "none", paddingBottom: 0, flex: 1 }}>
          Mis Vehículos
        </h3>
        <button
          type="button"
          onClick={() => navigate("/agregar_vehiculo")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.35rem",
            height: "32px",
            padding: "0 0.75rem",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            color: "#3b82f6",
            fontWeight: 600,
            fontSize: "0.8rem",
            cursor: "pointer",
            transition: "background-color 0.2s, border-color 0.2s",
            whiteSpace: "nowrap",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#eff6ff";
            e.currentTarget.style.borderColor = "#3b82f6";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#ffffff";
            e.currentTarget.style.borderColor = "#e2e8f0";
          }}
        >
          <Plus size={15} />
          <span>Añadir</span>
        </button>
      </div>

      {vehiculos.length > 0 && (
        <div className="vehiculos-lista" style={{ marginBottom: "1.25rem" }}>
          {vehiculos.map((vehiculo, index) => {
            const marca = vehiculo?.marca?.nombre ?? vehiculo?.marca_nombre ?? vehiculo?.marca ?? "";
            const modelo = vehiculo?.modelo?.nombre ?? vehiculo?.modelo_nombre ?? vehiculo?.modelo ?? "";
            const patente = vehiculo?.patente ?? vehiculo?.placa ?? vehiculo?.matricula ?? "";
            const nombreCompleto = [marca, modelo].filter(Boolean).join(" ").trim();
            return (
              <div
                key={vehiculo.id ?? vehiculo.id_vehiculo ?? index}
                className="vehiculo-item-readonly"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.85rem 1rem",
                  backgroundColor: "#f8fafc",
                  borderRadius: "12px",
                  border: "1px solid #f1f5f9",
                  marginBottom: "0.5rem",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#0f172a" }}>
                    {nombreCompleto}
                  </span>
                  {patente && (
                    <span style={{ fontWeight: 500, fontSize: "0.8rem", color: "#64748b", textTransform: "uppercase" }}>
                      {patente}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#10b981",
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  <BotonGenerico
                    className="btn-eliminar-vehiculo"
                    onClick={async () => {
                      const result = await Swal.fire({
                        title: "¿Eliminar vehículo?",
                        text: `${marca} ${modelo}${patente ? ` (${patente})` : ""}`,
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#e11d48",
                        cancelButtonColor: "#64748b",
                        confirmButtonText: "Sí, eliminar",
                        cancelButtonText: "Cancelar",
                      });
                      if (!result.isConfirmed) return;
                      try {
                        const idVehiculo = vehiculo.id ?? vehiculo.id_vehiculo ?? vehiculo._id;
                        const res = await VehiculosDelete(idVehiculo);
                        if (res.respuesta && onVehiculoEliminado) {
                          onVehiculoEliminado(idVehiculo);
                        }
                      } catch (err) {
                        Swal.fire({ icon: "error", title: "Error", text: "No se pudo eliminar el vehículo." });
                      }
                    }}
                    aria-label="Eliminar vehículo"
                  >
                    <Trash2 size={16} />
                  </BotonGenerico>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {vehiculos.length === 0 && (
        <EmptyState
          size="sm"
          icon={Car}
          title="Sin vehículos registrados"
          description="Agregá un vehículo para poder hacer reservas más rápido."
          action={{ label: "Agregar vehículo", to: "/agregar_vehiculo", icon: Plus }}
        />
      )}

      <div className="access-status-badge">
        <span className={`badge-dot ${vehiculos.length > 0 ? "active" : ""}`}></span>
        <span className="badge-text">
          {vehiculos.length > 0
            ? `${vehiculos.length} vehículo${vehiculos.length !== 1 ? "s" : ""} registrado${vehiculos.length !== 1 ? "s" : ""}`
            : "Sin vehículo registrado"}
        </span>
      </div>
    </section>
  );
}
