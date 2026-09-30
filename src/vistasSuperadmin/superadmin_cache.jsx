import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock3, Database, RefreshCw, Trash2 } from "lucide-react";

import "./superadmin_cache.css";
import HeaderSuperadmin from "../componentesSuperadmin/header_superadmin";
import FooterSuperadmin from "../componentesSuperadmin/footer_superadmin";
import EmptyState from "../componentesCompartidos/EmptyState";
import { clearCache, getCacheEntries, getCacheStats } from "../cache/cacheStore";
import { UsuariosGetAll } from "../servicies/API_Usuario";
import { EmpresasGetAll } from "../servicies/API_Empresa";
import { SedesGetAll } from "../servicies/API_Sede";
import { GaragesGetAll } from "../servicies/API_Garage";
import { ReservasGetAll } from "../servicies/API_Reserva";
import { VehiculosGetAll } from "../servicies/API_Vehiculo";
import { MarcasGetAll } from "../servicies/API_Marca";
import { ModelosGetAll } from "../servicies/API_Modelo";
import { RolesGetAll } from "../servicies/API_Rol";

const CACHE_LABELS = {
  usuarios: "Usuarios",
  empresas: "Empresas",
  sedes: "Sedes",
  garages: "Garages",
  reservas: "Reservas",
  vehiculos: "Vehículos",
  marcas: "Marcas",
  modelos: "Modelos",
  roles: "Roles",
  conflictos: "Conflictos",
};

const obtenerTipo = (key) => CACHE_LABELS[key.split(":")[0]] || "Datos del sistema";

const formatearDuracion = (remainingMs) => {
  if (remainingMs <= 0) return "Vencida";
  const segundos = Math.ceil(remainingMs / 1000);
  if (segundos < 60) return `${segundos} s`;
  const minutos = Math.ceil(segundos / 60);
  return minutos < 60 ? `${minutos} min` : `${Math.ceil(minutos / 60)} h`;
};

export default function SuperadminCache() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState(() => getCacheEntries());
  const [actualizando, setActualizando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const sincronizarVista = () => setEntries(getCacheEntries());

  const actualizarCache = async () => {
    setActualizando(true);
    setMensaje("");
    clearCache();

    try {
      await Promise.all([
        UsuariosGetAll({ force: true }),
        EmpresasGetAll({ force: true }),
        SedesGetAll({ force: true }),
        GaragesGetAll({ force: true }),
        ReservasGetAll({ force: true }),
        VehiculosGetAll({ force: true }),
        MarcasGetAll({ force: true }),
        ModelosGetAll({ force: true }),
        RolesGetAll({ force: true }),
      ]);
      setMensaje("La caché se actualizó correctamente.");
    } catch (error) {
      console.error("Error updating system cache:", error);
      setMensaje("Algunos datos no pudieron actualizarse. Intentá nuevamente.");
    } finally {
      sincronizarVista();
      setActualizando(false);
    }
  };

  const borrarCache = () => {
    if (!window.confirm("¿Querés borrar toda la caché de datos? Tu sesión seguirá abierta.")) return;
    clearCache();
    sincronizarVista();
    setMensaje("Caché borrada correctamente.");
  };

  const stats = getCacheStats();

  return (
    <div className="cache-page">
      <HeaderSuperadmin />
      <main className="cache-main">
        <header className="cache-header">
          <div className="cache-title-row">
            <button type="button" className="cache-back" onClick={() => navigate("/superadmin_dashboard")} aria-label="Volver al panel de control">
              <ArrowLeft size={19} />
            </button>
            <div>
              <span className="cache-eyebrow">Mantenimiento del sistema</span>
              <h1>Administración de caché</h1>
              <p>Consultá y renová los datos temporales utilizados por SmartLot.</p>
            </div>
          </div>
          <div className="cache-actions">
            <button type="button" className="cache-action cache-action--refresh" onClick={actualizarCache} disabled={actualizando}>
              <RefreshCw size={17} className={actualizando ? "cache-spin" : ""} />
              {actualizando ? "Actualizando..." : "Actualizar caché"}
            </button>
            <button type="button" className="cache-action cache-action--delete" onClick={borrarCache} disabled={actualizando || entries.length === 0}>
              <Trash2 size={17} />
              Borrar caché
            </button>
          </div>
        </header>

        <section className="cache-summary" aria-label="Resumen de caché">
          <div className="cache-summary-icon"><Database size={23} /></div>
          <div><span>Entradas activas</span><strong>{stats.entries}</strong></div>
          <div><span>Solicitudes pendientes</span><strong>{stats.pendingRequests}</strong></div>
        </section>

        {mensaje ? <p className="cache-message" role="status" aria-live="polite">{mensaje}</p> : null}

        <section className="cache-content" aria-labelledby="cache-grid-title">
          <div className="cache-section-heading">
            <div>
              <h2 id="cache-grid-title">Contenido almacenado</h2>
              <p>Cada tarjeta representa una respuesta disponible en memoria.</p>
            </div>
            <span>{entries.length} {entries.length === 1 ? "elemento" : "elementos"}</span>
          </div>

          {entries.length > 0 ? (
            <div className="cache-grid">
              {entries.map((entry) => (
                <article className="cache-card" key={entry.key}>
                  <div className="cache-card-top">
                    <span className="cache-card-icon"><Database size={18} /></span>
                    <span className={`cache-status ${entry.expired ? "cache-status--expired" : ""}`}>
                      {entry.expired ? "Vencida" : "Activa"}
                    </span>
                  </div>
                  <h3>{obtenerTipo(entry.key)}</h3>
                  <code>{entry.key}</code>
                  <div className="cache-expiry">
                    <Clock3 size={14} />
                    <span>Vence en {formatearDuracion(entry.remainingMs)}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Database}
              title="La caché está vacía"
              description="Actualizá la caché para descargar nuevamente los datos del sistema."
              action={{ label: "Actualizar caché", icon: RefreshCw, onClick: actualizarCache, disabled: actualizando }}
            />
          )}
        </section>
      </main>
      <FooterSuperadmin />
    </div>
  );
}
