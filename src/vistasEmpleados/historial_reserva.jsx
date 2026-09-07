import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TarjetaReserva from "../componentesEmpleado/tarjeta_reserva";
import ModalDetalleReserva from "../componentesEmpleado/modal_detalle_reserva";
import HeaderEmpleado from "../componentesEmpleado/header_empleado";
import FooterEmpleado from "../componentesEmpleado/footer_empleado";
import { useAuth } from "../contexts/useAuth";
import { ReservasGetByUsuario } from "../servicies/API_Reserva";
import "./historial_reserva.css";

const obtenerCampo = (item, claves, fallback = "") => {
  if (!item || typeof item !== "object") return fallback;
  for (const clave of claves) {
    const valor = item[clave];
    if (valor !== undefined && valor !== null && valor !== "") return valor;
  }
  return fallback;
};

const normalizarFechaHora = (valor) => {
  if (!valor) return null;
  const texto = String(valor).trim().replace(" ", "T");
  const fecha = new Date(texto);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

// La API devuelve instantes con offset (ej. "...T14:00:00.000Z"): convertir a
// hora local AR en vez de recortar el string, que mostraba la hora UTC.
const tieneZonaHoraria = (valor) => /(?:Z|[+-]\d{2}:?\d{2})$/.test(String(valor).trim());

const extraerFecha = (valor) => {
  if (!valor) return "";
  const texto = String(valor).trim();
  if (tieneZonaHoraria(texto)) {
    const fecha = new Date(texto);
    if (!Number.isNaN(fecha.getTime())) {
      return new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "America/Argentina/Buenos_Aires",
      }).format(fecha);
    }
  }
  return texto.split(/[T ]/)[0] || "";
};

const extraerHora = (valor) => {
  if (!valor) return "";
  const texto = String(valor).trim();
  if (tieneZonaHoraria(texto)) {
    const fecha = new Date(texto);
    if (!Number.isNaN(fecha.getTime())) {
      return new Intl.DateTimeFormat("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "America/Argentina/Buenos_Aires",
      }).format(fecha);
    }
  }
  const partes = texto.split(/[T ]/);
  const hora = partes.length > 1 ? partes[1] : partes[0];
  return hora ? hora.substring(0, 5) : "";
};

const esValorVerdadero = (valor) => {
  if (valor === true || valor === 1) return true;
  if (valor === false || valor === 0 || valor == null) return false;
  if (typeof valor !== "string") return false;

  const texto = valor.trim().toLowerCase();
  if (!texto || ["false", "0", "no", "null", "undefined"].includes(texto)) return false;
  if (["true", "1", "si", "sí", "completo", "completado"].includes(texto)) return true;
  return !Number.isNaN(new Date(valor).getTime());
};

const tieneSalidaRegistrada = (reserva) =>
  [
    obtenerCampo(reserva, ["salida", "egreso", "check_out", "checkOut", "salio"]),
    obtenerCampo(reserva, ["salida_registrada", "salidaRegistrada"]),
    obtenerCampo(reserva, ["fecha_salida_real", "fechaSalidaReal"]),
    obtenerCampo(reserva, ["hora_salida_real", "horaSalidaReal"]),
  ].some(esValorVerdadero);

const esValorEstado = (valor) => {
  if (typeof valor !== "string") return false;
  const texto = valor.trim().toLowerCase();
  return ["true", "false", "1", "0", "si", "sÃ­", "no", "completo", "completado"].includes(texto);
};

const obtenerFechaHoraReal = (reserva, camposFechaHora, camposFecha, camposHora) => {
  for (const campo of camposFechaHora) {
    const valor = obtenerCampo(reserva, [campo]);
    if (typeof valor === "boolean" || valor === 0 || valor === 1) continue;
    if (esValorEstado(valor)) continue;

    const fecha = normalizarFechaHora(valor);
    if (fecha) return fecha;
  }

  const fecha = obtenerCampo(reserva, camposFecha);
  const hora = obtenerCampo(reserva, camposHora);
  return normalizarFechaHora(fecha && hora ? `${fecha}T${hora}` : "");
};

const obtenerIdUsuario = (usuario) =>
  usuario?.id ?? usuario?.id_usuario ?? usuario?.idUsuario ?? usuario?.usuario_id ?? usuario?.usuarioId;

const obtenerSalidaReserva = (reserva) => {
  const salidaDesdeReal = obtenerFechaHoraReal(
    reserva,
    [
      "fecha_salida_real",
      "fechaSalidaReal",
      "hora_salida_real",
      "horaSalidaReal",
      "salida_registrada",
      "salidaRegistrada",
      "check_out",
      "checkOut",
      "salida",
      "egreso",
    ],
    [
      "fecha_salida_real",
      "fechaSalidaReal",
      "fecha_salida",
      "fechaSalida",
      "fecha",
      "fecha_reserva",
      "fechaReserva",
    ],
    ["hora_salida_real", "horaSalidaReal"]
  );
  if (salidaDesdeReal) return salidaDesdeReal;

  const fechaSalidaCompleta = obtenerCampo(reserva, [
    "fecha_salida",
    "fechaSalida",
    "fecha_finalizacion",
    "fechaFinalizacion",
    "fecha_fin",
    "fechaFin",
  ]);

  const salidaDesdeCompleta = normalizarFechaHora(fechaSalidaCompleta);
  if (salidaDesdeCompleta) return salidaDesdeCompleta;

  const fecha = obtenerCampo(reserva, ["fecha", "fecha_reserva", "fechaReserva"]);
  const horaSalida = obtenerCampo(reserva, ["hora_salida", "horaSalida", "hora_fin", "horaFin"]);
  const salidaProgramada = normalizarFechaHora(fecha && horaSalida ? `${fecha}T${horaSalida}` : "");
  if (salidaProgramada) return salidaProgramada;

  return null;
};

const normalizarReservaHistorial = (reserva) => {
  const fechaEntrada = obtenerCampo(reserva, ["fecha_entrada", "fechaEntrada", "fecha_inicio", "fechaInicio"]);
  const fechaSalida = obtenerCampo(reserva, [
    "fecha_salida",
    "fechaSalida",
    "fecha_finalizacion",
    "fechaFinalizacion",
    "fecha_fin",
    "fechaFin",
  ]);
  const fechaEntradaReal = obtenerCampo(reserva, ["fecha_entrada_real", "fechaEntradaReal"]);
  const fechaSalidaReal = obtenerCampo(reserva, ["fecha_salida_real", "fechaSalidaReal"]);
  const fecha = obtenerCampo(reserva, ["fecha", "fecha_reserva", "fechaReserva"], extraerFecha(fechaEntrada || fechaSalida));

  return {
    ...reserva,
    fecha,
    hora_entrada: obtenerCampo(reserva, ["hora_entrada_real", "horaEntradaReal"], "") ||
      obtenerCampo(reserva, ["hora_entrada", "horaEntrada", "hora_inicio", "horaInicio"], extraerHora(fechaEntradaReal || fechaEntrada)),
    hora_salida: obtenerCampo(reserva, ["hora_salida_real", "horaSalidaReal"], "") ||
      obtenerCampo(reserva, ["hora_salida", "horaSalida", "hora_fin", "horaFin"], extraerHora(fechaSalidaReal || fechaSalida)),
  };
};

function HistorialReservaSkeleton() {
  return (
    <>
      <div className="historial-title-skeleton" aria-label="Cargando historial">
        <span className="historial-skeleton-line historial-skeleton-title" />
        <span className="historial-skeleton-line historial-skeleton-subtitle" />
      </div>

      <section className="historial-section historial-section--current historial-skeleton-section">
        <div className="historial-section-header">
          <span className="historial-skeleton-line historial-skeleton-kicker" />
          <span className="historial-skeleton-line historial-skeleton-heading" />
        </div>

        <div className="historial-skeleton-card">
          <span className="historial-skeleton-block historial-skeleton-plaza" />
          <div className="historial-skeleton-card-info">
            <span className="historial-skeleton-line historial-skeleton-card-title" />
            <span className="historial-skeleton-line historial-skeleton-card-text" />
            <span className="historial-skeleton-line historial-skeleton-card-chip" />
          </div>
          <span className="historial-skeleton-block historial-skeleton-action" />
        </div>
      </section>

      <section className="historial-section historial-section--past">
        <div className="historial-section-header">
          <span className="historial-skeleton-line historial-skeleton-kicker" />
          <span className="historial-skeleton-line historial-skeleton-heading" />
        </div>

        <div className="historial-skeleton-card">
          <span className="historial-skeleton-block historial-skeleton-plaza" />
          <div className="historial-skeleton-card-info">
            <span className="historial-skeleton-line historial-skeleton-card-title historial-skeleton-card-title-short" />
            <span className="historial-skeleton-line historial-skeleton-card-text" />
          </div>
          <span className="historial-skeleton-block historial-skeleton-action" />
        </div>
        <span className="historial-skeleton-block historial-skeleton-toggle" />
      </section>
    </>
  );
}

function HistorialReserva() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const idUsuario = obtenerIdUsuario(usuario);
  const [ultimaReserva, setUltimaReserva] = useState(null);
  const [reservasPasadas, setReservasPasadas] = useState([]);
  const [mostrarMasPasadas, setMostrarMasPasadas] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);

  const handleReservaClick = (reserva) => {
    setReservaSeleccionada(reserva);
  };

  const handleCopyReserva = (reserva) => {
    const horaInicio = reserva.hora_entrada?.substring(0, 5) || "";
    const horaFin = reserva.hora_salida?.substring(0, 5) || "";
    const idGarage = Number(reserva.id_garage ?? reserva.idGarage ?? reserva.garage_id ?? reserva.garageId) || 0;
    const idVehiculo = Number(reserva.id_vehiculo ?? reserva.idVehiculo ?? reserva.vehiculo_id ?? reserva.vehiculoId) || 0;

    navigate("/nueva_reserva", {
      state: {
        copiaReserva: { horaInicio, horaFin, idGarage, idVehiculo },
      },
    });
  };

  useEffect(() => {
    if (!idUsuario) {
      setUltimaReserva(null);
      setReservasPasadas([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    ReservasGetByUsuario(idUsuario, { force: true }).then((res) => {
      if (cancelled) return;

      const datos = Array.isArray(res?.datos) ? res.datos : [];

      const ahora = new Date();
      const pasadas = datos
        .map((reserva) => {
          const salida = obtenerSalidaReserva(reserva);
          return salida ? { reserva: normalizarReservaHistorial(reserva), salida } : null;
        })
        .filter((item) => item && item.salida <= ahora)
        .sort((a, b) => {
          const diferenciaSalida = b.salida.getTime() - a.salida.getTime();
          if (diferenciaSalida !== 0) return diferenciaSalida;

          const idA = Number(a.reserva.id_reserva ?? a.reserva.id ?? 0);
          const idB = Number(b.reserva.id_reserva ?? b.reserva.id ?? 0);
          return idB - idA;
        })
        .map((item) => item.reserva);

      setUltimaReserva(pasadas[0] || null);
      setReservasPasadas(pasadas.slice(1));
      setLoading(false);
    }).catch(() => {
      if (!cancelled) {
        setUltimaReserva(null);
        setReservasPasadas([]);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [idUsuario]);

  const reservaPasadaPrincipal = reservasPasadas[0] || null;
  const restoReservasPasadas = reservasPasadas.slice(1);
  const tieneMasReservasPasadas = restoReservasPasadas.length > 0;
  const sinReservas = !loading && !ultimaReserva && reservasPasadas.length === 0;

  return (
    <div className="historial-page">
      <HeaderEmpleado />
      <main className="historial-main">
        {loading ? (
          <HistorialReservaSkeleton />
        ) : (
          <>
            <h1>Historial de Reservas</h1>
            <p>Tus estacionamientos registrados.</p>

            <section className="historial-section historial-section--current">
              <div className="historial-section-header">
                <span>Resumen</span>
                <h2>Ultima reserva</h2>
              </div>

              {sinReservas ? (
                <div className="historial-empty-note">
                  No tenes reservas en tu historial.
                </div>
              ) : ultimaReserva ? (
                <TarjetaReserva reserva={ultimaReserva} variant="historyPast" onClick={handleReservaClick} onCopy={handleCopyReserva} />
              ) : null}
            </section>

            {reservasPasadas.length > 0 && (
              <section className="historial-section historial-section--past">
                <div className="historial-section-header">
                  <span>Actividad</span>
                  <h2>Reservas pasadas</h2>
                </div>

                {reservaPasadaPrincipal && (
                  <TarjetaReserva
                    key={reservaPasadaPrincipal.id_reserva}
                    reserva={reservaPasadaPrincipal}
                    variant="historyPast"
                    onClick={handleReservaClick}
                    onCopy={handleCopyReserva}
                  />
                )}

                {tieneMasReservasPasadas && (
                  <button
                    type="button"
                    className={`historial-toggle${mostrarMasPasadas ? " historial-toggle--open" : ""}`}
                    onClick={() => setMostrarMasPasadas((prev) => !prev)}
                    aria-expanded={mostrarMasPasadas}
                  >
                    <span>{mostrarMasPasadas ? "Mostrar menos" : `Mostrar mas (${restoReservasPasadas.length})`}</span>
                    <span className="historial-toggle-arrow" aria-hidden="true">&gt;</span>
                  </button>
                )}

                <div className={`historial-rest${mostrarMasPasadas ? " historial-rest--open" : ""}`}>
                  {restoReservasPasadas.map((reserva) => (
                    <TarjetaReserva
                      key={reserva.id_reserva}
                      reserva={reserva}
                      variant="historyPast"
                      onClick={handleReservaClick}
                      onCopy={handleCopyReserva}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <FooterEmpleado />

      {reservaSeleccionada && (
        <ModalDetalleReserva
          reserva={reservaSeleccionada}
          onClose={() => setReservaSeleccionada(null)}
          onCopy={handleCopyReserva}
        />
      )}
    </div>
  );
}

export default HistorialReserva;
