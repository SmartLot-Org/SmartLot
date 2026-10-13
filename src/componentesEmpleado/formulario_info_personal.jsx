// src/componentesEmpleado/formulario_info_personal.jsx
import { User } from "lucide-react";
import FieldValidation from "../components/FieldValidation";

export default function FormularioInfoPersonal({ data = {}, onChange, telefonoFieldValidation }) {
  return (
    <section
      className=" inforpersonal-contenedor formulario-seccion animate-section" 
      style={{ border: "none", padding: 0, margin: 0 }}
    >
      <div className="form-card-header" style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div className="icon-badge-box" style={{ width: "36px", height: "36px", background: "#DBEAFE", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <User size={20} style={{ color: "#2563EB" }} />
        </div>
        <h2 className="formulario-subtitulo" style={{ margin: 0, borderBottom: "none", paddingBottom: 0 }}>
          Información Personal
        </h2>
      </div>

      <div className="formulario-grid">
        <div className="formulario-fila-doble">
          <div className="formulario-grupo">
            <label htmlFor="nombre">Nombre</label>
            <input
              type="text"
              id="nombre"
              className="formulario-input"
              value={data.nombre || ""}
              readOnly
              tabIndex={-1}
              autoComplete="off"
              style={{ cursor: "default", opacity: 1, backgroundColor: "#f1f5f9", color: "#1E293B", borderColor: "#e2e8f0" }}
            />
          </div>

          <div className="formulario-grupo">
            <label htmlFor="apellido">Apellido</label>
            <input
              type="text"
              id="apellido"
              className="formulario-input"
              value={data.apellido || ""}
              readOnly
              tabIndex={-1}
              autoComplete="off"
              style={{ cursor: "default", opacity: 1, backgroundColor: "#f1f5f9", color: "#1E293B", borderColor: "#e2e8f0" }}
            />
          </div>
        </div>

          <div className="formulario-grupo">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              className="formulario-input"
              value={data.email || ""}
              readOnly
              tabIndex={-1}
              autoComplete="off"
              style={{ cursor: "default", opacity: 1, backgroundColor: "#f1f5f9", color: "#1E293B", borderColor: "#e2e8f0" }}
            />
          </div>

        <div className="formulario-grupo">
          <label htmlFor="telefono">Teléfono</label>
          <input
            type="tel"
            id="telefono"
            name="telefono"
            className="formulario-input"
            value={data.telefono || ""}
            onChange={(e) => {
              onChange(e);
              if (telefonoFieldValidation?.inputProps?.onChange) {
                telefonoFieldValidation.inputProps.onChange(e);
              }
            }}
            onBlur={(e) => {
              if (telefonoFieldValidation?.inputProps?.onBlur) {
                telefonoFieldValidation.inputProps.onBlur(e);
              }
            }}
            autoComplete="off"
            required
          />
          {telefonoFieldValidation && (
            <FieldValidation
              conditions={telefonoFieldValidation.conditions}
              isTouched={telefonoFieldValidation.isTouched}
            />
          )}
        </div>
      </div>
    </section>
  );
}