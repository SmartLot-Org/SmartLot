import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { ArrowLeft, Building2, Car, CalendarDays, CheckCircle2, Clock, MapPin, ParkingCircle, WalletCards } from "lucide-react";
import HeaderEmpleado from "../componentesEmpleado/header_empleado";
import FormularioReserva from "../componentesEmpleado/form_reserva";
import { ReservasCreate, ReservasQuote, ReservasGetByUsuario, ReservasLiberarRetencion } from "../servicies/API_Reserva";
import { PagosCrearPreferenciaReserva } from "../servicies/API_Pagos";
import { VehiculosGetAll } from "../servicies/API_Vehiculo";
import { GaragesGetAll } from "../servicies/API_Garage";
import { UsuariosGetById } from "../servicies/API_Usuario";
import { useAuth } from "../contexts/useAuth";
import "./nueva_reserva.css";
import FooterEmpleado from "../componentesEmpleado/footer_empleado";
import { mensajeAmigable } from "../helpers/erroresMensajes";
import ConfirmacionReservaPaga from "../componentesEmpleado/confirmacion_reserva_paga";

const disponibilidadInicial = {
  hay_cupo_corporativo: true,
  hay_cupo_pago: false,
  lugares_pagos_disponibles: 0,
  precio: 0,
};

const obtenerDisponibilidadInicial = () => disponibilidadInicial;

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

const obtenerUrlCheckout = (datos) => {
  const enlace = datos?.initPoint ?? datos?.init_point ?? datos?.sandboxInitPoint ?? datos?.sandbox_init_point;
  if (!enlace) return null;
  try {
    const url = new URL(enlace);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || !/(^|\.)mercadopago\.com(\.ar)?$/.test(host)) return null;
    return url.href;
  } catch {
    return null;
  }
};

// Las reservas guardan timestamp sin zona (hora local AR). La API devuelve
// "YYYY-MM-DD HH:mm:ss" y el formulario envia "-03:00": se normaliza ambos
// al mismo instante para poder compararlos sin depender de la zona horaria
// del navegador.
const fechaReservaATiempo = (valor) => {
  if (!valor) return null;
  const fecha = new Date(String(valor).replace(" ", "T").slice(0, 19) + "-03:00");
  return Number.isNaN(fecha.getTime()) ? null : fecha.getTime();
};

const mismasFechasReserva = (a, b) => {
  const tiempoA = fechaReservaATiempo(a);
  const tiempoB = fechaReservaATiempo(b);
  return tiempoA !== null && tiempoB !== null && Math.abs(tiempoA - tiempoB) < 1000;
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
  const [reservaPendientePago, setReservaPendientePago] = useState(null);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [errorPago, setErrorPago] = useState("");
  const procesandoPagoRef = useRef(false);
  const formularioRef = useRef(null);
  const resultadoRef = useRef(null);
  const disponibilidadTimerRef = useRef(null);
  const reservaSolicitudRef = useRef(0);

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

  const crearReservaCorporativa = async (datosFormulario, solicitudId = reservaSolicitudRef.current) => {
    if (solicitudId !== reservaSolicitudRef.current) return;

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
      setConsultandoDisponibilidad(false);
      setMensaje({ tipo: "error", texto: "No se pudo identificar tu usuario para crear la reserva." });
      return;
    }

    if (!idGarage) {
      setLoading(false);
      setConsultandoDisponibilidad(false);
      setMensaje({ tipo: "error", texto: "No se pudo identificar el garage para crear la reserva." });
      return;
    }

    if (!garageSeleccionado) {
      setLoading(false);
      setConsultandoDisponibilidad(false);
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
        setConsultandoDisponibilidad(false);
        setMensaje({ tipo: "error", texto: mensajeAmigable(resultado.datos, nombreGarage) });
        return;
      }

      setLoading(false);
      setConsultandoDisponibilidad(false);

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
      setConsultandoDisponibilidad(false);
      setMensaje({
        tipo: "error",
        texto: "Hubo un error al procesar la reserva. Intentalo de nuevo.",
      });
    }
  };

  const handleReservationSubmit = async (datosFormulario) => {
    const solicitudId = ++reservaSolicitudRef.current;
    window.clearTimeout(disponibilidadTimerRef.current);
    setConsultandoDisponibilidad(true);
    setMensaje({ tipo: "", texto: "" });
    setDisponibilidad(null);

    disponibilidadTimerRef.current = window.setTimeout(async () => {
      const reservaBase = {
        ...datosFormulario,
        ...datosFormulario._metaData,
        fechaFormateada: formatearFecha(datosFormulario._metaData?.fecha),
      };
      setReservaPendiente(reservaBase);
      const idGarage = Number(datosFormulario.idGarage);
      const quoteRes = await ReservasQuote({
        id_garage: idGarage,
        id_vehiculo: datosFormulario.id_vehiculo ?? datosFormulario.idVehiculo,
        fecha_entrada: datosFormulario.fecha_entrada,
        fecha_salida: datosFormulario.fecha_salida,
        dia: datosFormulario.dia,
      });

      if (solicitudId !== reservaSolicitudRef.current) return;

      if (!quoteRes.respuesta) {
        setConsultandoDisponibilidad(false);
        setMensaje({ tipo: "error", texto: quoteRes.datos?.message || "No se pudo verificar la disponibilidad en este momento." });
        return;
      }
      const quote = quoteRes.datos;

      // El cupo corporativo no requiere una segunda confirmacion: la reserva
      // se crea al completar el primer envio del formulario.
      if (quote.requierePago === false) {
        disponibilidadTimerRef.current = null;
        await crearReservaCorporativa(reservaBase, solicitudId);
        return;
      }

      setDisponibilidad({
        hay_cupo_corporativo: quote.requierePago === false,
        hay_cupo_pago: quote.requierePago,
        lugares_pagos_disponibles: quote.requierePago ? 1 : 0,
        precio: Number(quote.importe),
        ...quote,
      });
      setConsultandoDisponibilidad(false);
      disponibilidadTimerRef.current = null;
    }, 350);
  };

  const limpiarResultado = () => {
    reservaSolicitudRef.current += 1;
    window.clearTimeout(disponibilidadTimerRef.current);
    disponibilidadTimerRef.current = null;
    setConsultandoDisponibilidad(false);
    setDisponibilidad(null);
    setReservaPendiente(null);
    setReservaPendientePago(null);
    setErrorPago("");
    setModalPagoAbierto(false);
  };

  const elegirOtroGarage = () => {
    void liberarRetencionActiva();
    limpiarResultado();
    formularioRef.current?.limpiarGarage();
  };

  // Suelta el lugar retenido por una reserva pendiente de pago (el usuario
  // abandono el checkout). Si no se libera a mano, el backend la expira solo
  // al vencer la retencion.
  const liberarRetencionActiva = async () => {
    const retencion = reservaPendientePago;
    setReservaPendientePago(null);
    if (!retencion || retencion.estado !== "pendiente_pago") return;

    const resultado = await ReservasLiberarRetencion(retencion.id);
    if (resultado.respuesta) {
      setMensaje({ tipo: "success", texto: "Se liberó el lugar que había quedado retenido por el pago." });
    }
  };

  const cerrarModalPago = () => {
    setModalPagoAbierto(false);
    void liberarRetencionActiva();
  };

  // Si el usuario abandono el checkout de Mercado Pago y vuelve a intentar,
  // su retencion anterior sigue vigente (10 minutos) y el backend rechaza la
  // creacion con 409: se reutiliza esa reserva retenida en lugar de fallar.
  const buscarRetencionVigente = async () => {
    const idUsuario = obtenerNumeroValido(obtenerIdUsuario(usuario));
    const idGarage = Number(reservaPendiente?.id_garage ?? reservaPendiente?.idGarage);
    const idVehiculo = Number(reservaPendiente?.id_vehiculo ?? reservaPendiente?.idVehiculo);
    if (!idUsuario || !Number.isFinite(idGarage) || !Number.isFinite(idVehiculo)) return null;

    const resultado = await ReservasGetByUsuario(idUsuario, { force: true });
    const vigente = obtenerListado(resultado.datos).find((item) =>
      Number(item.id_garage ?? item.idGarage) === idGarage &&
      Number(item.id_vehiculo ?? item.idVehiculo) === idVehiculo &&
      (item.estado_reserva ?? item.estado) === "pendiente_pago" &&
      (item.responsable_pago ?? "empleado") === "empleado" &&
      item.retencion_pago_hasta &&
      new Date(item.retencion_pago_hasta) > new Date() &&
      mismasFechasReserva(item.fecha_entrada, reservaPendiente.fecha_entrada) &&
      mismasFechasReserva(item.fecha_salida, reservaPendiente.fecha_salida)
    );
    if (!vigente) return null;

    return {
      id: vigente.id ?? vigente.id_reserva,
      importe: Number(vigente.importe_estimado),
      estado: vigente.estado_reserva ?? vigente.estado,
      retencion: vigente.retencion_pago_hasta,
    };
  };

  const handleContinuarPago = async () => {
    if (procesandoPagoRef.current || !reservaPendiente || !disponibilidad?.requierePago) return;
    procesandoPagoRef.current = true;
    setProcesandoPago(true);
    setErrorPago("");

    try {
      let reserva = reservaPendientePago;
      if (!reserva) {
        const creada = await ReservasCreate({
          id_garage: reservaPendiente.id_garage ?? reservaPendiente.idGarage,
          id_vehiculo: reservaPendiente.id_vehiculo ?? reservaPendiente.idVehiculo,
          fecha_entrada: reservaPendiente.fecha_entrada,
          fecha_salida: reservaPendiente.fecha_salida,
          dia: reservaPendiente.dia,
        });
        if (creada.respuesta) {
          const datos = creada.datos?.data ?? creada.datos?.reserva ?? creada.datos;
          const id = Number(datos?.id ?? datos?.id_reserva);
          if (!Number.isInteger(id) || id <= 0) {
            setErrorPago("La reserva se creó, pero el servidor no devolvió su ID. Revisá tus reservas antes de intentar de nuevo.");
            return;
          }
          reserva = { id, importe: Number(datos.importe_estimado), estado: datos.estado_reserva, retencion: datos.retencion_pago_hasta ?? null };
          setReservaPendientePago(reserva);
        } else {
          const reutilizada = await buscarRetencionVigente();
          if (!reutilizada) {
            setErrorPago(creada.datos?.message || "No se pudo retener el lugar. Volvé a verificar la disponibilidad.");
            return;
          }
          reserva = reutilizada;
          setReservaPendientePago(reutilizada);
        }
      }

      if (reserva.estado === "confirmada") {
        setModalPagoAbierto(false);
        navigate("/empleados_dashboard");
        return;
      }
      if (reserva.estado !== "pendiente_pago") {
        setErrorPago("La reserva no quedó pendiente de pago. Revisá su estado antes de intentar de nuevo.");
        return;
      }
      if (!Number.isFinite(reserva.importe) || reserva.importe <= 0) {
        setErrorPago("El servidor no devolvió un importe válido para esta reserva.");
        return;
      }
      if (Math.round(reserva.importe * 100) !== Math.round(Number(disponibilidad.precio) * 100)) {
        setDisponibilidad((actual) => ({ ...actual, precio: reserva.importe }));
        setErrorPago("El precio cambió al retener el lugar. Revisá el nuevo importe y continuá nuevamente.");
        return;
      }

      const preferencia = await PagosCrearPreferenciaReserva(reserva.id);
      if (!preferencia.respuesta) {
        setErrorPago(preferencia.datos?.message || "No se pudo iniciar el pago. Intentá nuevamente mientras la reserva siga vigente.");
        return;
      }
      const url = obtenerUrlCheckout(preferencia.datos);
      if (!url) {
        setErrorPago("Mercado Pago no devolvió un enlace válido. Intentá nuevamente mientras la reserva siga vigente.");
        return;
      }
      try {
        sessionStorage.setItem("mp_pending_orderId", `reserva-${reserva.id}`);
      } catch { /* La vuelta también trae external_reference en la URL. */ }
      window.location.assign(url);
    } catch {
      setErrorPago("No se pudo preparar el pago. Intentá nuevamente.");
    } finally {
      procesandoPagoRef.current = false;
      setProcesandoPago(false);
    }
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
                obtenerDisponibilidad={obtenerDisponibilidadInicial}
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
                  <p className="disponibilidad-auto-confirmada" role="status">La reserva se crea automáticamente al confirmar el formulario.</p>
                </>
              ) : disponibilidad.hay_cupo_pago ? (
                <>
                  <div className="disponibilidad-card__icon"><WalletCards size={24} /></div>
                  <div className="disponibilidad-card__heading"><span>Lugar pago disponible</span><h2>Esta reserva requiere pago</h2><p>Podés retener el lugar y completar el pago con Mercado Pago.</p></div>
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
        retencionPagoHasta={reservaPendientePago?.retencion || null}
        onClose={cerrarModalPago}
        onContinuar={handleContinuarPago}
        procesando={procesandoPago}
        error={errorPago}
      />
     
    </div>
      );
};

      export default NuevaReserva;
