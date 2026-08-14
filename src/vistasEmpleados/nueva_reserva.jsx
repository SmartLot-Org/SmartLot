import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { ArrowLeft, Building2, Car, CalendarDays, CheckCircle2, Clock, MapPin, ParkingCircle, WalletCards } from "lucide-react";
import HeaderEmpleado from "../componentesEmpleado/header_empleado";
import FormularioReserva from "../componentesEmpleado/form_reserva";
import { ReservasCreate } from "../servicies/API_Reserva";
import { VehiculosGetAll } from "../servicies/API_Vehiculo";
import { GaragesGetAll } from "../servicies/API_Garage";
import { UsuariosGetById } from "../servicies/API_Usuario";
import { useAuth } from "../contexts/useAuth";
import "./nueva_reserva.css";
import FooterEmpleado from "../componentesEmpleado/footer_empleado";
import { mensajeAmigable } from "../helpers/erroresMensajes";
import ConfirmacionReservaPaga from "../componentesEmpleado/confirmacion_reserva_paga";

// Mock temporal: reemplazar por la respuesta del backend en una etapa posterior.
const disponibilidadPagaMock = {
  hay_cupo_corporativo: false,
  hay_cupo_pago: true,
  lugares_pagos_disponibles: 4,
  precio: 8500,
};

const disponibilidadCorporativaMock = {
  hay_cupo_corporativo: true,
  hay_cupo_pago: true,
  lugares_pagos_disponibles: 4,
  precio: 8500,
};

const obtenerDisponibilidadMock = (garage) => {
  const nombreGarage = obtenerCampo(garage, [
    "nombre",
    "name",
    "descripcion",
    "ubicacion",
    "nombre_garage",
    "garage_nombre",
    "nombre_zona",
  ]).toLocaleLowerCase("es-AR");

  return nombreGarage.trim() === "caballito"
    ? disponibilidadPagaMock
    : disponibilidadCorporativaMock;
};

const formatearPrecio = (precio) => new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
}).format(precio);

const formatearFecha = (fecha) => {
  if (!fecha) return "—";
  const [year, month, day] = fecha.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "long", year: "numeric" })
    .format(new Date(year, month - 1, day));
};

const obtenerCampo = (item, claves, fallback = "") => {
  if (!item || typeof item !== "object") return fallback;
  for (const clave of claves) {
    const valor = item[clave];
    if (valor !== undefined && valor !== null && valor !== "") return valor;
  }
  return fallback;
};

const obtenerListado = (datos) => {
  if (Array.isArray(datos)) return datos;
  if (Array.isArray(datos?.datos)) return datos.datos;
  if (Array.isArray(datos?.data)) return datos.data;
  if (Array.isArray(datos?.vehiculos)) return datos.vehiculos;
  if (Array.isArray(datos?.value)) return datos.value;
  return [];
};

const obtenerObjeto = (datos) => {
  if (!datos || Array.isArray(datos)) return null;
  return datos.usuario ?? datos.datos ?? datos.data ?? datos;
};

const obtenerIdUsuario = (usuario) =>
  usuario?.id_usuario ??
  usuario?.idUsuario ??
  usuario?.usuario_id ??
  usuario?.usuarioId ??
  usuario?.id ??
  usuario?._id ??
  usuario?.usuario?.id_usuario ??
  usuario?.usuario?.idUsuario ??
  usuario?.usuario?.id ??
  usuario?.datos?.id_usuario ??
  usuario?.datos?.idUsuario ??
  usuario?.datos?.id;

const obtenerIdSedeUsuario = (item) =>
  item?.id_sede ??
  item?.idSede ??
  item?.sede_id ??
  item?.sedeId ??
  item?.sede?.id ??
  item?.sede?.id_sede ??
  item?.usuario?.id_sede ??
  item?.usuario?.idSede ??
  item?.datos?.id_sede ??
  item?.datos?.idSede;

const obtenerIdGarage = (garage) =>
  garage?.id_garage ??
  garage?.idGarage ??
  garage?.garage_id ??
  garage?.garageId ??
  garage?.id ??
  garage?._id;

const esGarageActivo = (garage) => {
  const estado = garage?.estado ?? garage?.activo ?? garage?.status;

  if (estado === undefined || estado === null || estado === "") return true;
  if (typeof estado === "boolean") return estado;
  if (typeof estado === "number") return estado === 1;

  if (typeof estado === "string") {
    const estadoNormalizado = estado.trim().toLowerCase();
    return ["true", "activo", "activa", "abierto", "habilitado", "1"].includes(estadoNormalizado);
  }

  return true;
};

const obtenerNumeroValido = (...valores) => {
  for (const valor of valores) {
    const numero = Number(valor);
    if (Number.isFinite(numero)) return numero;
  }
  return null;
};

const NuevaReservaSkeleton = () => (
  <div className="reserva-skeleton-card" aria-label="Cargando formulario de reserva">
    <div className="reserva-skeleton-field">
      <span className="reserva-skeleton-line reserva-skeleton-label" />
      <span className="reserva-skeleton-block reserva-skeleton-input" />
    </div>

    <div className="reserva-skeleton-time-row">
      {Array.from({ length: 2 }).map((_, index) => (
        <div className="reserva-skeleton-field" key={index}>
          <span className="reserva-skeleton-line reserva-skeleton-label reserva-skeleton-label-short" />
          <span className="reserva-skeleton-block reserva-skeleton-input" />
        </div>
      ))}
    </div>

    {Array.from({ length: 2 }).map((_, index) => (
      <div className="reserva-skeleton-field" key={index}>
        <span className="reserva-skeleton-line reserva-skeleton-label" />
        <span className="reserva-skeleton-block reserva-skeleton-input" />
      </div>
    ))}

    <span className="reserva-skeleton-block reserva-skeleton-button" />
  </div>
);

const NuevaReserva = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario } = useAuth();
  const copiaReserva = location.state?.copiaReserva || null;
  const [loading, setLoading] = useState(false);
  const [loadingVehiculos, setLoadingVehiculos] = useState(true);
  const [vehiculos, setVehiculos] = useState([]);
  const [garages, setGarages] = useState([]);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const [consultandoDisponibilidad, setConsultandoDisponibilidad] = useState(false);
  const [disponibilidad, setDisponibilidad] = useState(null);
  const [reservaPendiente, setReservaPendiente] = useState(null);
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const formularioRef = useRef(null);
  const resultadoRef = useRef(null);
  const disponibilidadTimerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(disponibilidadTimerRef.current), []);

  useEffect(() => {
    if (!disponibilidad) return;
    resultadoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [disponibilidad]);

  useEffect(() => {
    let montado = true;

    const cargarVehiculos = async () => {
      setLoadingVehiculos(true);
      setMensaje({ tipo: "", texto: "" });

      const idUsuarioSesion = obtenerNumeroValido(obtenerIdUsuario(usuario));
      const [resultado, garagesResultado] = await Promise.all([
        VehiculosGetAll(),
        GaragesGetAll(),
      ]);
      if (!montado) return;

      if (resultado.respuesta) {
        const usuarioResponse = idUsuarioSesion
          ? await UsuariosGetById(idUsuarioSesion)
          : { respuesta: false, datos: null };
        if (!montado) return;

        const perfilUsuario = usuarioResponse.respuesta
          ? obtenerObjeto(usuarioResponse.datos) || usuario
          : usuario;
        const idUsuario = obtenerNumeroValido(obtenerIdUsuario(perfilUsuario), idUsuarioSesion);
        const vehiculosUsuario = obtenerListado(resultado.datos).filter((vehiculo) =>
          Number(vehiculo.id_usuario ?? vehiculo.idUsuario ?? vehiculo.usuario_id) === idUsuario
        );
        setVehiculos(vehiculosUsuario);

        const garages = garagesResultado.respuesta ? obtenerListado(garagesResultado.datos) : [];
        const idSedeUsuario = obtenerNumeroValido(obtenerIdSedeUsuario(perfilUsuario), obtenerIdSedeUsuario(usuario));
        // La API ya limita los garages mediante los tratos de la sede del usuario.
        const garagesDeSede = idSedeUsuario
          ? garages.filter(esGarageActivo)
          : [];

        setGarages(garagesDeSede);

        if (vehiculosUsuario.length === 0) {
          setMensaje({ tipo: "error", texto: "No tenes vehiculos registrados para crear una reserva." });
        } else if (!idSedeUsuario) {
          setMensaje({ tipo: "error", texto: "No se pudo identificar tu sede para cargar garages." });
        } else if (garagesDeSede.length === 0) {
          setMensaje({ tipo: "error", texto: "No hay garages disponibles para tu sede." });
        }
      } else {
        setMensaje({ tipo: "error", texto: "No se pudieron cargar tus vehiculos." });
      }

      setLoadingVehiculos(false);
    };

    cargarVehiculos();

    return () => {
      montado = false;
    };
  }, [usuario]);

  const crearReservaCorporativa = async (datosFormulario) => {
    setLoading(true);
    setMensaje({ tipo: "", texto: "" });

    const idVehiculo = obtenerNumeroValido(datosFormulario.id_vehiculo, datosFormulario.idVehiculo);
    const vehiculoSeleccionado = vehiculos.find((vehiculo) => {
      const id = vehiculo.id_vehiculo ?? vehiculo.idVehiculo ?? vehiculo.id ?? vehiculo._id;
      return Number(id) === idVehiculo;
    });
    const idUsuario = obtenerNumeroValido(
      obtenerIdUsuario(usuario),
      vehiculoSeleccionado?.id_usuario,
      vehiculoSeleccionado?.idUsuario,
      vehiculoSeleccionado?.usuario_id,
      vehiculoSeleccionado?.usuarioId
    );
    const idGarage = obtenerNumeroValido(
      datosFormulario.id_garage,
      datosFormulario.idGarage
    );
    const garageSeleccionado = garages.find((g) => Number(obtenerIdGarage(g)) === idGarage);
    const nombreGarage = obtenerCampo(garageSeleccionado, ["nombre", "name", "descripcion", "ubicacion", "nombre_garage", "garage_nombre", "nombre_zona", "direccion"]) || "";

    if (!idUsuario) {
      setLoading(false);
      setMensaje({ tipo: "error", texto: "No se pudo identificar tu usuario para crear la reserva." });
      return;
    }

    if (!idGarage) {
      setLoading(false);
      setMensaje({ tipo: "error", texto: "No se pudo identificar el garage para crear la reserva." });
      return;
    }

    if (!garageSeleccionado) {
      setLoading(false);
      setMensaje({ tipo: "error", texto: "El garage seleccionado no fue encontrado o no pertenece a tu sede." });
      return;
    }

    const payloadReserva = {
      ...datosFormulario,
      fecha_entrada: datosFormulario.fecha_entrada,
      fecha_salida: datosFormulario.fecha_salida,
      id_usuario: idUsuario,
      id_vehiculo: idVehiculo,
      id_garage: idGarage,
    };

    try {
      const resultado = await ReservasCreate(payloadReserva);

      if (!resultado.respuesta) {
        setLoading(false);
        setMensaje({ tipo: "error", texto: mensajeAmigable(resultado.datos, nombreGarage) });
        return;
      }

      setLoading(false);

      Swal.fire({
        icon: "success",
        title: "¡Reserva creada con éxito!",
        text: "Tu plaza de estacionamiento ha sido reservada correctamente.",
        confirmButtonText: "Volver al inicio",
        confirmButtonColor: "#2563eb",
      }).then(() => {
        navigate("/empleados_dashboard");
      });
    } catch {
      setLoading(false);
      setMensaje({
        tipo: "error",
        texto: "Hubo un error al procesar la reserva. Intentalo de nuevo.",
      });
    }
  };

  const handleReservationSubmit = (datosFormulario) => {
    window.clearTimeout(disponibilidadTimerRef.current);
    setConsultandoDisponibilidad(true);
    setMensaje({ tipo: "", texto: "" });
    setDisponibilidad(null);

    disponibilidadTimerRef.current = window.setTimeout(() => {
      setReservaPendiente({
        ...datosFormulario,
        ...datosFormulario._metaData,
        fechaFormateada: formatearFecha(datosFormulario._metaData?.fecha),
      });
      const garageSeleccionado = garages.find(
        (garage) => Number(obtenerIdGarage(garage)) === Number(datosFormulario.idGarage)
      );
      setDisponibilidad(obtenerDisponibilidadMock(garageSeleccionado));
      setConsultandoDisponibilidad(false);
      disponibilidadTimerRef.current = null;
    }, 350);
  };

  const limpiarResultado = () => {
    window.clearTimeout(disponibilidadTimerRef.current);
    disponibilidadTimerRef.current = null;
    setConsultandoDisponibilidad(false);
    setDisponibilidad(null);
    setReservaPendiente(null);
    setModalPagoAbierto(false);
  };

  const elegirOtroGarage = () => {
    limpiarResultado();
    formularioRef.current?.limpiarGarage();
  };

  const handleContinuarPago = () => {
    setModalPagoAbierto(false);
    Swal.fire({
      icon: "info",
      title: "Integración con Mercado Pago pendiente",
      confirmButtonText: "Entendido",
      confirmButtonColor: "#2563eb",
    });
  };

  const detalleReserva = reservaPendiente && (
    <dl className="disponibilidad-detalle">
      <div><dt><MapPin size={16} /> Garage</dt><dd>{reservaPendiente.ubicacion}</dd></div>
      <div><dt><CalendarDays size={16} /> Fecha</dt><dd>{reservaPendiente.fechaFormateada}</dd></div>
      <div><dt><Clock size={16} /> Horario</dt><dd>{reservaPendiente.horaInicio} a {reservaPendiente.horaFin}</dd></div>
      <div><dt><Car size={16} /> Vehículo</dt><dd>{reservaPendiente.vehiculo}</dd></div>
    </dl>
  );

  return (
    <div>

      <div className="nuevaReserva-contenedor">
        <HeaderEmpleado />
        <main className="nuevaReserva-contenido" role="main">
          <div className="animate-back">
            <button
              className="boton-back"
              onClick={() => navigate("/empleados_dashboard")}
              aria-label="Volver al panel"
            >
              <ArrowLeft size={20} />
            </button>
          </div>

          <header className="textosTitulos animate-texts">
            <h1>Nueva Reserva</h1>
            <p>Reserva tu plaza de estacionamiento para tu proxima jornada.</p>
          </header>

          {mensaje.texto && (
            <div className={`form-feedback alert-${mensaje.tipo}`} role="alert">
              <p>{mensaje.texto}</p>
            </div>
          )}

          <section className={`formularioReserva${disponibilidad ? " formularioReserva--oculto" : ""}`}>
            {loadingVehiculos ? (
              <NuevaReservaSkeleton />
            ) : (
              <FormularioReserva
                ref={formularioRef}
                onSubmit={handleReservationSubmit}
                onSelectionChange={limpiarResultado}
                loading={loading || consultandoDisponibilidad}
                vehiculos={vehiculos}
                garages={garages}
                initialData={copiaReserva}
                obtenerDisponibilidad={obtenerDisponibilidadMock}
              />
            )}
          </section>

          {disponibilidad && reservaPendiente && (
            <section ref={resultadoRef} className={`disponibilidad-card disponibilidad-card--${disponibilidad.hay_cupo_corporativo ? "corporativa" : disponibilidad.hay_cupo_pago ? "paga" : "sin-cupo"}`} aria-live="polite">
              {disponibilidad.hay_cupo_corporativo ? (
                <>
                  <div className="disponibilidad-card__icon"><CheckCircle2 size={24} /></div>
                  <div className="disponibilidad-card__heading"><span>Cupo corporativo disponible</span><h2>Tu empresa cubre esta reserva</h2><p>Podés continuar con el flujo habitual sin ningún cargo.</p></div>
                  {detalleReserva}
                  <div className="disponibilidad-total"><span>Total</span><strong>$0</strong></div>
                  <button className="disponibilidad-button disponibilidad-button--primary" type="button" disabled={loading} onClick={() => crearReservaCorporativa(reservaPendiente)}>{loading ? "Procesando..." : "Crear reserva"}</button>
                </>
              ) : disponibilidad.hay_cupo_pago ? (
                <>
                  <div className="disponibilidad-card__icon"><WalletCards size={24} /></div>
                  <div className="disponibilidad-card__heading"><span>Lugar pago disponible</span><h2>El cupo gratuito de tu empresa se agotó</h2><p>Todavía podés reservar este garage utilizando un lugar pago.</p></div>
                  {detalleReserva}
                  <div className="disponibilidad-places"><ParkingCircle size={18} /><span><strong>{disponibilidad.lugares_pagos_disponibles}</strong> lugares pagos disponibles</span></div>
                  <div className="disponibilidad-total"><span>Precio final</span><strong>{formatearPrecio(disponibilidad.precio)}</strong></div>
                  <div className="disponibilidad-actions">
                    <button className="disponibilidad-button disponibilidad-button--primary" type="button" onClick={() => setModalPagoAbierto(true)}>Reservar y pagar</button>
                    <button className="disponibilidad-button disponibilidad-button--secondary" type="button" onClick={elegirOtroGarage}>Elegir otro garage</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="disponibilidad-card__icon"><Building2 size={24} /></div>
                  <div className="disponibilidad-card__heading"><span>Sin disponibilidad</span><h2>Este garage no tiene lugares disponibles</h2><p>Probá seleccionando otro garage para la misma fecha y horario.</p></div>
                  {detalleReserva}
                  <button className="disponibilidad-button disponibilidad-button--secondary" type="button" onClick={elegirOtroGarage}>Buscar otro garage</button>
                </>
              )}
            </section>
          )}
        </main>
        <FooterEmpleado />
      </div>

      <ConfirmacionReservaPaga
        abierto={modalPagoAbierto}
        reserva={reservaPendiente}
        precioFormateado={formatearPrecio(disponibilidad?.precio || 0)}
        onClose={() => setModalPagoAbierto(false)}
        onContinuar={handleContinuarPago}
      />
     
    </div>
      );
};

      export default NuevaReserva;
