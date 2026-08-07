import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
  TrendingUp,
  BarChart3,
  Users,
  Clock,
  Zap
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import "./admin_reportes_analisis.css";
import Header from '../componentesAdmin/header_admin';
import FooterEmpleado from '../componentesAdmin/footer_admin';
import { exportarReporteExcel } from '../util/exportar_reportes_excel';
import { useAuth } from '../contexts/useAuth';
import { GaragesGetAll } from "../servicies/API_Garage";
import { UsuariosGetAll } from "../servicies/API_Usuario";
import { ReservasGetAll } from "../servicies/API_Reserva";
import { exportarReportePDF } from "../util/exportar_reporte_pdf";
import logoSmartLot from "../Imagenes/Logo_SmartLot-removebg-preview.png";

const REPORTES_MIN_LOADING_MS = 650;

const obtenerListado = (datos) => {
  if (Array.isArray(datos)) return datos;
  if (Array.isArray(datos?.datos)) return datos.datos;
  if (Array.isArray(datos?.data)) return datos.data;
  if (Array.isArray(datos?.reservas)) return datos.reservas;
  if (Array.isArray(datos?.usuarios)) return datos.usuarios;
  return [];
};

const obtenerIdUsuario = (item) => item?.id_usuario ?? item?.idUsuario ?? item?.usuario_id ?? item?.id;
const TIME_ZONE_AR = "America/Argentina/Buenos_Aires";

const tieneZonaHoraria = (valor) => /[zZ]$|[+-]\d{2}:?\d{2}$/.test(valor);

const obtenerCampo = (item, claves) => {
  for (const clave of claves) {
    const valor = item?.[clave];
    if (valor !== undefined && valor !== null && valor !== "") return valor;
  }
  return "";
};

const obtenerFechaHoraReserva = (reserva, clavesFechaCompleta, clavesHora) => {
  const fechaCompleta = obtenerCampo(reserva, clavesFechaCompleta);
  if (fechaCompleta) return fechaCompleta;

  const fecha = obtenerCampo(reserva, ["fecha", "fecha_reserva", "fechaReserva"]);
  if (!fecha) return "";

  const hora = obtenerCampo(reserva, clavesHora);
  if (hora) return `${String(fecha).split(/[T ]/)[0]}T${String(hora)}`;

  return fecha;
};

const obtenerFechaEntradaReserva = (reserva) =>
  obtenerFechaHoraReserva(
    reserva,
    ["fecha_entrada", "fechaEntrada", "fecha_inicio", "fechaInicio"],
    ["hora_entrada", "horaEntrada", "hora_inicio", "horaInicio"]
  );

const obtenerFechaSalidaReserva = (reserva) =>
  obtenerFechaHoraReserva(
    reserva,
    ["fecha_salida", "fechaSalida", "fecha_finalizacion", "fechaFinalizacion", "fecha_fin", "fechaFin"],
    ["hora_salida", "horaSalida", "hora_fin", "horaFin"]
  );

const formateadorHoraLocal = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  hourCycle: "h23",
  timeZone: TIME_ZONE_AR,
});

const formateadorFechaLocal = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: TIME_ZONE_AR,
});

const extraerMinutosLocales = (fechaHora) => {
  if (!fechaHora) return null;
  const valor = String(fechaHora);

  if (/^\d{1,2}:\d{2}/.test(valor)) {
    const [hora, minutos] = valor.split(":").map(Number);
    return hora * 60 + minutos;
  }

  if (tieneZonaHoraria(valor)) {
    const fecha = new Date(valor);
    if (!Number.isNaN(fecha.getTime())) {
      const [hora, minutos] = formateadorHoraLocal.format(fecha).split(":").map(Number);
      return hora * 60 + minutos;
    }
  }

  const match = valor.match(/[T ](\d{1,2}):(\d{2})/);
  if (!match) return null;

  return Number(match[1]) * 60 + Number(match[2]);
};

const parsearFechaHora = (fechaHora) => {
  if (!fechaHora) return null;
  const valor = String(fechaHora);
  if (/^\d{1,2}:\d{2}/.test(valor)) return null;
  const valorNormalizado = /^\d{4}-\d{2}-\d{2}$/.test(valor)
    ? `${valor}T00:00:00`
    : valor.replace(" ", "T");
  const fecha = new Date(tieneZonaHoraria(valor) ? valor : valorNormalizado);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

const obtenerFechaLocalISO = (fechaHora) => {
  if (!fechaHora) return "";
  const valor = String(fechaHora);

  if (tieneZonaHoraria(valor)) {
    const fecha = new Date(valor);
    return Number.isNaN(fecha.getTime()) ? "" : formateadorFechaLocal.format(fecha);
  }

  return valor.split(/[T ]/)[0] || "";
};

const obtenerDiaSemanaLocal = (fechaHora) => {
  const fechaIso = obtenerFechaLocalISO(fechaHora);
  if (!fechaIso) return null;
  const fecha = new Date(`${fechaIso}T00:00:00`);
  return Number.isNaN(fecha.getTime()) ? null : fecha.getDay();
};

const calcularHorasEntre = (entrada, salida) => {
  const fechaEntrada = parsearFechaHora(entrada);
  const fechaSalida = parsearFechaHora(salida);

  if (fechaEntrada && fechaSalida) {
    const diff = (fechaSalida - fechaEntrada) / (1000 * 60 * 60);
    return diff > 0 ? diff : null;
  }

  const minutosEntrada = extraerMinutosLocales(entrada);
  const minutosSalida = extraerMinutosLocales(salida);
  if (minutosEntrada === null || minutosSalida === null) return null;

  const duracion = minutosSalida > minutosEntrada
    ? minutosSalida - minutosEntrada
    : (24 * 60 - minutosEntrada) + minutosSalida;

  return duracion > 0 ? duracion / 60 : null;
};

const sumarOcupacionPorHora = (acumulador, minutosEntrada, minutosSalida) => {
  let inicio = minutosEntrada;
  let fin = minutosSalida;
  if (fin <= inicio) fin += 24 * 60;

  for (let hora = 0; hora < 24; hora++) {
    const inicioHora = hora * 60;
    const finHora = inicioHora + 60;
    const solapamiento = Math.max(0, Math.min(fin, finHora) - Math.max(inicio, inicioHora));
    const solapamientoDiaSiguiente = Math.max(0, Math.min(fin, finHora + 24 * 60) - Math.max(inicio, inicioHora + 24 * 60));
    acumulador[hora] += solapamiento + solapamientoDiaSiguiente;
  }
};

const formatearRangoHoras = (horaInicio, duracionHoras = 2) => {
  const horaFin = (horaInicio + duracionHoras) % 24;
  return `${String(horaInicio).padStart(2, "0")}:00 - ${String(horaFin).padStart(2, "0")}:00`;
};

const obtenerIntervaloReserva = (reserva) => {
  const entrada = obtenerFechaEntradaReserva(reserva);
  const salida = obtenerFechaSalidaReserva(reserva);
  const inicio = parsearFechaHora(entrada);
  const fin = parsearFechaHora(salida);

  if (!inicio || !fin) return null;

  if (fin <= inicio) {
    const finAjustado = new Date(fin);
    finAjustado.setDate(finAjustado.getDate() + 1);
    return { inicio, fin: finAjustado };
  }

  return { inicio, fin };
};

const seSolapaConRango = (reserva, inicioRango, finRango) => {
  const intervalo = obtenerIntervaloReserva(reserva);
  return Boolean(intervalo && intervalo.inicio < finRango && intervalo.fin > inicioRango);
};

const contarReservasEnRango = (reservas, inicioRango, finRango) =>
  reservas.filter((reserva) => seSolapaConRango(reserva, inicioRango, finRango)).length;

const obtenerRangoPeriodo = (fecha, granularidad) => {
  const inicio = new Date(fecha);
  inicio.setHours(0, 0, 0, 0);

  switch (granularidad) {
    case "dia": {
      const fin = new Date(inicio);
      fin.setDate(inicio.getDate() + 1);
      return { inicio, fin };
    }
    case "semana": {
      const diaSemana = inicio.getDay();
      inicio.setDate(inicio.getDate() - ((diaSemana + 6) % 7));
      const fin = new Date(inicio);
      fin.setDate(inicio.getDate() + 7);
      return { inicio, fin };
    }
    case "mes": {
      inicio.setDate(1);
      const fin = new Date(inicio);
      fin.setMonth(inicio.getMonth() + 1);
      return { inicio, fin };
    }
    case "año": {
      inicio.setMonth(0, 1);
      const fin = new Date(inicio);
      fin.setFullYear(inicio.getFullYear() + 1);
      return { inicio, fin };
    }
    default:
      return { inicio, fin: new Date(inicio) };
  }
};

const calcularHorasPico = (reservasPeriodo) => {
  const horaOcupada = Array(24).fill(0);

  reservasPeriodo.forEach((r) => {
    const entrada = obtenerFechaEntradaReserva(r);
    const salida = obtenerFechaSalidaReserva(r);
    const minutosEntrada = extraerMinutosLocales(entrada);
    const minutosSalida = extraerMinutosLocales(salida);
    if (minutosEntrada !== null && minutosSalida !== null && minutosEntrada !== minutosSalida) {
      sumarOcupacionPorHora(horaOcupada, minutosEntrada, minutosSalida);
    }
  });

  let mejorRango = "";
  let mejorSuma = 0;
  for (let h = 0; h < 24; h++) {
    const suma = horaOcupada[h] + horaOcupada[(h + 1) % 24];
    if (suma > mejorSuma) {
      mejorSuma = suma;
      mejorRango = formatearRangoHoras(h);
    }
  }

  return mejorRango || "—";
};

const normalizarGranularidadLabel = (granularidad) => {
  if (granularidad === "dia") return "Dia";
  if (granularidad === "semana") return "Semana";
  if (granularidad === "mes") return "Mes";
  return "Año";
};

const limitarPorcentaje = (valor) => Math.min(100, Math.max(0, Number(valor) || 0));

const cargarImagenBase64 = async (src) => {
  const response = await fetch(src);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="trend-tooltip">
        <span className="trend-tooltip__day">{label}</span>
        <span className="trend-tooltip__value">{data.valor}%</span>
        {data.count !== undefined && (
          <span className="trend-tooltip__count">{data.count} reservas</span>
        )}
        <div className="trend-tooltip__bar">
          <div className="trend-tooltip__fill" style={{ width: `${data.valor}%` }} />
        </div>
      </div>
    );
  }
  return null;
};

const ReportesSkeleton = () => (
  <>
    <section className="reportes-section">
      <div className="export-actions">
        <article className="report-btn-skeleton" aria-label="Cargando accion de exportacion">
          <span className="reportes-skeleton-icon" />
          <div className="report-btn__content">
            <span className="reportes-skeleton-line reportes-skeleton-title" />
            <span className="reportes-skeleton-line reportes-skeleton-subtitle" />
          </div>
        </article>
      </div>
    </section>

    <section className="kpi-grid" aria-label="Cargando indicadores">
      {Array.from({ length: 4 }).map((_, index) => (
        <article className="kpi-card kpi-card-skeleton" key={index}>
          <div className="kpi-card__header">
            <span className="reportes-skeleton-icon" />
            <span className="reportes-skeleton-line reportes-skeleton-kpi-label" />
          </div>
          <span className="reportes-skeleton-line reportes-skeleton-kpi-value" />
        </article>
      ))}
    </section>

    <section className="reportes-section" aria-label="Cargando grafico de tendencia">
      <div className="reportes-section__title-container">
        <span className="reportes-skeleton-small-icon" />
        <span className="reportes-skeleton-line reportes-skeleton-section-title" />
      </div>
      <div className="trend-chart-wrapper trend-chart-wrapper-skeleton">
        <span className="reportes-skeleton-axis reportes-skeleton-axis-y" />
        <div className="reportes-skeleton-area-chart">
          <div className="reportes-skeleton-area-chart-bg">
            <svg className="reportes-skeleton-svg" viewBox="0 0 460 190" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="skelGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#64748b" stopOpacity="0.20" />
                  <stop offset="40%" stopColor="#94a3b8" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="skelGradGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#94a3b8" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="skelLineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#cbd5e1" />
                  <stop offset="60%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
                <filter id="skelBlur">
                  <feGaussianBlur stdDeviation="8" />
                </filter>
              </defs>
              <g className="skel-grid-group">
                {[38, 76, 114, 152].map((y, i) => (
                  <line key={y} x1="0" y1={y} x2="460" y2={y}
                    stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4"
                    className="skel-grid-line" style={{ animationDelay: `${i * 0.08}s` }} />
                ))}
              </g>
              <path className="skel-area-glow"
                d="M30,135 Q63,105 96.7,97.5 Q130,80 163.3,75 Q196.7,100 230,105 Q263.3,80 296.7,67.5 Q330,50 363.3,45 Q396.7,75 430,90 L430,180 L30,180 Z"
                fill="url(#skelGradGlow)" filter="url(#skelBlur)" />
              <path className="skel-area-fill"
                d="M30,135 Q63,105 96.7,97.5 Q130,80 163.3,75 Q196.7,100 230,105 Q263.3,80 296.7,67.5 Q330,50 363.3,45 Q396.7,75 430,90 L430,180 L30,180 Z"
                fill="url(#skelGrad)" />
              <path className="skel-line"
                d="M30,135 Q63,105 96.7,97.5 Q130,80 163.3,75 Q196.7,100 230,105 Q263.3,80 296.7,67.5 Q330,50 363.3,45 Q396.7,75 430,90"
                fill="none" stroke="url(#skelLineGrad)" strokeWidth="3" strokeLinecap="round" />
              {[
                { x: 30, y: 135 }, { x: 96.7, y: 97.5 }, { x: 163.3, y: 75 },
                { x: 230, y: 105 }, { x: 296.7, y: 67.5 }, { x: 363.3, y: 45 }, { x: 430, y: 90 },
              ].map((d, i) => (
                <g key={i} className="skel-dot-group" style={{ animationDelay: `${0.25 + i * 0.1}s` }}>
                  <circle cx={d.x} cy={d.y} r="10" fill="#94a3b8" className="skel-dot-glow" />
                  <circle cx={d.x} cy={d.y} r="0" fill="#cbd5e1" stroke="#ffffff" strokeWidth="2.5" className="skel-dot">
                    <animate attributeName="r" values="0;5;3.5;4.5;4" dur="0.45s" begin={`${0.25 + i * 0.1}s`} fill="freeze" />
                  </circle>
                </g>
              ))}
            </svg>
          </div>
        </div>
        <span className="reportes-skeleton-axis reportes-skeleton-axis-x" />
      </div>
    </section>
  </>
);

const generarGraficoTendenciaPng = (tendencia) => {
  if (!tendencia || tendencia.length < 2) return null;

  const canvas = document.createElement("canvas");
  const ancho = 560;
  const alto = 240;
  const escala = 2;

  canvas.width = ancho * escala;
  canvas.height = alto * escala;

  const ctx = canvas.getContext("2d");
  ctx.scale(escala, escala);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, ancho, alto);

  const margen = { top: 18, right: 18, bottom: 36, left: 48 };
  const areaAncho = ancho - margen.left - margen.right;
  const areaAlto = alto - margen.top - margen.bottom;
  const maxValor = 100;
  const yMin = margen.top;
  const yMax = margen.top + areaAlto;
  const limitarY = (valor) => Math.min(yMax, Math.max(yMin, valor));

  const catmullRom = (p0, p1, p2, p3, t) => {
    const t2 = t * t, t3 = t2 * t;
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  };

  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#e2e8f0";

  for (let i = 0; i <= 4; i++) {
    const valor = (maxValor / 4) * i;
    const y = margen.top + areaAlto - (valor / maxValor) * areaAlto;
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "right";
    ctx.fillText(`${Math.round(valor)}%`, margen.left - 8, y + 4);
    ctx.beginPath();
    ctx.moveTo(margen.left, y);
    ctx.lineTo(ancho - margen.right, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  const puntos = tendencia.map((item, index) => ({
    x: margen.left + (areaAncho / (tendencia.length - 1)) * index,
    y: margen.top + areaAlto - (limitarPorcentaje(item.valor) / maxValor) * areaAlto,
    valor: limitarPorcentaje(item.valor),
    dia: item.dia,
  }));
  const curva = [];
  const segs = 40;
  for (let i = 0; i < puntos.length - 1; i++) {
    const p0 = puntos[Math.max(0, i - 1)];
    const p1 = puntos[i];
    const p2 = puntos[i + 1];
    const p3 = puntos[Math.min(puntos.length - 1, i + 2)];
    for (let t = 0; t <= segs; t++) {
      const tt = t / segs;
      curva.push({
        x: catmullRom(p0.x, p1.x, p2.x, p3.x, tt),
        y: limitarY(catmullRom(p0.y, p1.y, p2.y, p3.y, tt)),
      });
    }
  }

  const unicos = [];
  for (let i = 0; i < curva.length; i++) {
    if (i === 0 || Math.abs(curva[i].x - curva[i - 1].x) > 0.01 || Math.abs(curva[i].y - curva[i - 1].y) > 0.01) {
      unicos.push(curva[i]);
    }
  }

  const gradFill = ctx.createLinearGradient(0, margen.top, 0, margen.top + areaAlto);
  gradFill.addColorStop(0, "rgba(37, 99, 235, 0.35)");
  gradFill.addColorStop(0.4, "rgba(59, 130, 246, 0.12)");
  gradFill.addColorStop(1, "rgba(59, 130, 246, 0.02)");

  ctx.beginPath();
  ctx.moveTo(unicos[0].x, margen.top + areaAlto);
  unicos.forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.lineTo(unicos[unicos.length - 1].x, margen.top + areaAlto);
  ctx.closePath();
  ctx.fillStyle = gradFill;
  ctx.fill();

  const gradStroke = ctx.createLinearGradient(0, 0, ancho, 0);
  gradStroke.addColorStop(0, "#1d4ed8");
  gradStroke.addColorStop(1, "#60a5fa");

  ctx.beginPath();
  ctx.moveTo(unicos[0].x, unicos[0].y);
  for (let i = 1; i < unicos.length; i++) ctx.lineTo(unicos[i].x, unicos[i].y);
  ctx.strokeStyle = gradStroke;
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();

  puntos.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#2563eb";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.stroke();
  });

  ctx.fillStyle = "#64748b";
  ctx.font = "bold 11px -apple-system, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  puntos.forEach((p) => ctx.fillText(p.dia, p.x, alto - 14));

  return canvas.toDataURL("image/png");
};

const CustomDot = (props) => {
  const { cx, cy, index } = props;
  if (!cx || !cy) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="#2563eb"
      stroke="#ffffff"
      strokeWidth={2.5}
      style={{ animationDelay: `${0.6 + index * 0.08}s` }}
      className="trend-chart-dot"
    />
  );
};

const CustomActiveDot = (props) => {
  const { cx, cy } = props;
  if (!cx || !cy) return null;
  return (
    <>
      <circle cx={cx} cy={cy} r={10} fill="rgba(37, 99, 235, 0.12)" stroke="none" />
      <circle cx={cx} cy={cy} r={6} fill="#2563eb" stroke="#ffffff" strokeWidth={3} />
    </>
  );
};

const AnimatedNumber = ({ value, suffix = "", duration = 1800, startDelay = 0 }) => {
  const [display, setDisplay] = useState(0);
  const [highlight, setHighlight] = useState(false);
  const rafRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (typeof value !== "number") return;

    timerRef.current = setTimeout(() => {
      setHighlight(true);
      const startTime = performance.now();
      const to = Math.max(0, value);
      const step = (now) => {
        const t = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        setDisplay(Math.round(to * ease));
        if (t < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          setHighlight(false);
        }
      };
      rafRef.current = requestAnimationFrame(step);
    }, startDelay);

    return () => {
      clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration, startDelay]);

  if (typeof value !== "number") return <>{value}</>;
  return <span className={highlight ? "kpi-counter--highlight" : ""}>{display.toLocaleString()}{suffix}</span>;
};

export default function AdminReportesAnalisis() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [garages, setGarages] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportando, setExportando] = useState(false);
  const [granularidad, setGranularidad] = useState("semana");
  const [fechaActual, setFechaActual] = useState(() => new Date());

  useEffect(() => {
    let montado = true;

    const fetchData = async () => {
      const inicioCarga = Date.now();
      setLoading(true);
      setError("");

      try {
        const [garRes, usuRes, resRes] = await Promise.all([
          GaragesGetAll(),
          UsuariosGetAll(),
          ReservasGetAll(),
        ]);

        if (!montado) return;

        const garArray = obtenerListado(garRes.datos);
        const usuArray = obtenerListado(usuRes.datos);
        const resArray = obtenerListado(resRes.datos);

        const adminIdSede = Number(usuario?.id_sede);
        const empresaAdmin = Number(usuario?.id_empresa);
        const tieneEmpresa = !isNaN(empresaAdmin) && empresaAdmin > 0;

        let garagesFiltrados = garArray;
        let usuariosFiltrados = usuArray;
        let reservasFiltradas = resArray;

        if (adminIdSede) {
          const userIds = new Set(
            usuArray.filter((u) => Number(u.id_sede ?? u.idSede) === adminIdSede).map((u) => Number(obtenerIdUsuario(u)))
          );
          usuariosFiltrados = usuArray.filter((u) => userIds.has(Number(obtenerIdUsuario(u))));
          const garageIds = new Set(garagesFiltrados.map((g) => Number(g.id_garage ?? g.idGarage ?? g.id)));
          reservasFiltradas = resArray.filter((r) => garageIds.has(Number(r.id_garage ?? r.idGarage ?? r.garage_id)));
        } else if (tieneEmpresa) {
          const userIds = new Set(
            usuArray.filter((u) => Number(u.id_empresa ?? u.idEmpresa) === empresaAdmin).map((u) => Number(obtenerIdUsuario(u)))
          );
          usuariosFiltrados = usuArray.filter((u) => userIds.has(Number(obtenerIdUsuario(u))));
          const garageIds = new Set(garagesFiltrados.map((g) => Number(g.id_garage ?? g.idGarage ?? g.id)));
          reservasFiltradas = resArray.filter((r) => garageIds.has(Number(r.id_garage ?? r.idGarage ?? r.garage_id)));
        }

        setGarages(garagesFiltrados);
        setUsuarios(usuariosFiltrados);
        setReservas(reservasFiltradas);
      } catch (err) {
        console.error("Error al cargar datos de reportes:", err);
        if (montado) setError("Error al cargar los datos.");
      } finally {
        const tiempoRestante = Math.max(0, REPORTES_MIN_LOADING_MS - (Date.now() - inicioCarga));
        if (tiempoRestante > 0) {
          await new Promise((resolve) => setTimeout(resolve, tiempoRestante));
        }
        if (montado) setLoading(false);
      }
    };

    fetchData();
    return () => { montado = false; };
  }, [usuario]);

  const datosReporte = useMemo(() => {
    let totalOcupados = 0;
    let totalCapacidad = 0;
    garages.forEach((g) => {
      totalOcupados += Number(g.ocupacion_reservas || 0) + Number(g.ocupacion_no_reservas || 0);
      totalCapacidad += Number(g.capacidad_reservas || 0) + Number(g.capacidad_para_no_reservas || 0);
    });
    const ocupacionMedia = totalCapacidad > 0 ? Math.round((totalOcupados / totalCapacidad) * 100) : 0;

    const usuariosActivos = usuarios.filter((u) => u.activo !== false && Number(u.id_rol) !== 1).length;

    let totalHoras = 0;
    let count = 0;
    reservas.forEach((r) => {
      const entrada = obtenerFechaEntradaReserva(r);
      const salida = obtenerFechaSalidaReserva(r);
      const diff = calcularHorasEntre(entrada, salida);
      if (diff !== null && diff < 24) {
        totalHoras += diff;
        count++;
      }
    });
    const tiempoPromedio = count > 0 ? `${(totalHoras / count).toFixed(1)} hrs` : "—";

    const horaOcupada = Array(24).fill(0);
    reservas.forEach((r) => {
      const entrada = obtenerFechaEntradaReserva(r);
      const salida = obtenerFechaSalidaReserva(r);
      const minutosEntrada = extraerMinutosLocales(entrada);
      const minutosSalida = extraerMinutosLocales(salida);
      if (minutosEntrada !== null && minutosSalida !== null && minutosEntrada !== minutosSalida) {
        sumarOcupacionPorHora(horaOcupada, minutosEntrada, minutosSalida);
      }
    });
    let mejorRango = "";
    let mejorSuma = 0;
    for (let h = 0; h < 24; h++) {
      const suma = horaOcupada[h] + horaOcupada[(h + 1) % 24];
      if (suma > mejorSuma) {
        mejorSuma = suma;
        mejorRango = formatearRangoHoras(h);
      }
    }
    const horasPico = mejorRango || "—";

    const diasSemana = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
    const diaCount = [0, 0, 0, 0, 0, 0, 0];
    reservas.forEach((r) => {
      const entrada = obtenerFechaEntradaReserva(r);
      if (entrada) {
        const dia = obtenerDiaSemanaLocal(entrada);
        if (dia !== null) {
          diaCount[dia]++;
        }
      }
    });
    const maxCount = Math.max(...diaCount, 1);
    const tendencia = diasSemana.map((dia, i) => ({
      dia,
      valor: Math.round((diaCount[i] / maxCount) * 100),
    }));

    return { ocupacionMedia, usuariosActivos, tiempoPromedio, horasPico, tendencia };
  }, [garages, usuarios, reservas]);

  const tendenciaDinamica = useMemo(() => {
    if (!reservas.length) return [];
    const { inicio: inicioPeriodo } = obtenerRangoPeriodo(fechaActual, granularidad);
    let buckets = [];

    switch (granularidad) {
      case "dia": {
        buckets = Array.from({ length: 24 }, (_, h) => {
          const inicio = new Date(inicioPeriodo);
          inicio.setHours(h, 0, 0, 0);
          const fin = new Date(inicio);
          fin.setHours(h + 1, 0, 0, 0);
          const count = contarReservasEnRango(reservas, inicio, fin);
          return { dia: `${String(h).padStart(2, "0")}:00`, count };
        });
        break;
      }
      case "semana": {
        const diasSemana = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
        buckets = diasSemana.map((nombre, i) => {
          const inicio = new Date(inicioPeriodo);
          inicio.setDate(inicioPeriodo.getDate() + i);
          const fin = new Date(inicio);
          fin.setDate(inicio.getDate() + 1);
          const count = contarReservasEnRango(reservas, inicio, fin);
          return { dia: nombre, count };
        });
        break;
      }
      case "mes": {
        const año = inicioPeriodo.getFullYear();
        const mes = inicioPeriodo.getMonth();
        const diasEnMes = new Date(año, mes + 1, 0).getDate();
        buckets = Array.from({ length: diasEnMes }, (_, d) => {
          const inicio = new Date(año, mes, d + 1);
          const fin = new Date(inicio);
          fin.setDate(inicio.getDate() + 1);
          const count = contarReservasEnRango(reservas, inicio, fin);
          return { dia: String(d + 1), count };
        });
        break;
      }
      case "año": {
        const añoNum = inicioPeriodo.getFullYear();
        const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        buckets = meses.map((nombre, i) => {
          const inicio = new Date(añoNum, i, 1);
          const fin = new Date(añoNum, i + 1, 1);
          const count = contarReservasEnRango(reservas, inicio, fin);
          return { dia: nombre, count };
        });
        break;
      }
    }

    const maxCount = Math.max(...buckets.map((b) => b.count), 1);
    return buckets.map((b) => ({ ...b, valor: Math.round((b.count / maxCount) * 100) }));
  }, [reservas, granularidad, fechaActual]);

  const periodLabel = useMemo(() => {
    switch (granularidad) {
      case "dia":
        return fechaActual.toLocaleDateString("es-AR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      case "semana": {
        const diaSemana = fechaActual.getDay();
        const lunes = new Date(fechaActual);
        lunes.setDate(fechaActual.getDate() - ((diaSemana + 6) % 7));
        const domingo = new Date(lunes);
        domingo.setDate(lunes.getDate() + 6);
        const fmtInicio = lunes.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
        const fmtFin = domingo.toLocaleDateString("es-AR", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        return `${fmtInicio} - ${fmtFin}`;
      }
      case "mes":
        return fechaActual.toLocaleDateString("es-AR", {
          month: "long",
          year: "numeric",
        });
      case "año":
        return String(fechaActual.getFullYear());
      default:
        return "";
    }
  }, [granularidad, fechaActual]);

  const reservasPeriodo = useMemo(() => {
    const { inicio, fin } = obtenerRangoPeriodo(fechaActual, granularidad);
    return reservas.filter((reserva) => seSolapaConRango(reserva, inicio, fin));
  }, [reservas, granularidad, fechaActual]);

  const datosReporteVisible = useMemo(() => ({
    ...datosReporte,
    horasPico: calcularHorasPico(reservasPeriodo),
    tendencia: tendenciaDinamica,
    granularidad,
    granularidadLabel: normalizarGranularidadLabel(granularidad),
    periodo: periodLabel,
    reservasTotales: reservasPeriodo.length,
    etiquetaDimension: granularidad === "dia" ? "Hora" : granularidad === "año" ? "Mes" : "Dia",
  }), [datosReporte, reservasPeriodo, tendenciaDinamica, granularidad, periodLabel]);

  const puedeAvanzar = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    switch (granularidad) {
      case "dia": {
        const sig = new Date(fechaActual);
        sig.setDate(fechaActual.getDate() + 1);
        sig.setHours(0, 0, 0, 0);
        return sig <= hoy;
      }
      case "semana": {
        const sig = new Date(fechaActual);
        sig.setDate(fechaActual.getDate() + 7);
        return sig <= hoy;
      }
      case "mes": {
        const sig = new Date(fechaActual);
        sig.setMonth(fechaActual.getMonth() + 1);
        sig.setDate(1);
        return sig <= hoy;
      }
      case "año": {
        const sig = new Date(fechaActual);
        sig.setFullYear(fechaActual.getFullYear() + 1);
        sig.setMonth(0, 1);
        return sig <= hoy;
      }
      default:
        return false;
    }
  }, [granularidad, fechaActual]);

  const navegarAtras = () => {
    const nueva = new Date(fechaActual);
    switch (granularidad) {
      case "dia":
        nueva.setDate(fechaActual.getDate() - 1);
        break;
      case "semana":
        nueva.setDate(fechaActual.getDate() - 7);
        break;
      case "mes":
        nueva.setMonth(fechaActual.getMonth() - 1);
        break;
      case "año":
        nueva.setFullYear(fechaActual.getFullYear() - 1);
        break;
    }
    setFechaActual(nueva);
  };

  const navegarAdelante = () => {
    const nueva = new Date(fechaActual);
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    switch (granularidad) {
      case "dia":
        nueva.setDate(fechaActual.getDate() + 1);
        break;
      case "semana":
        nueva.setDate(fechaActual.getDate() + 7);
        break;
      case "mes":
        nueva.setMonth(fechaActual.getMonth() + 1);
        break;
      case "año":
        nueva.setFullYear(fechaActual.getFullYear() + 1);
        break;
    }
    if (nueva <= hoy) setFechaActual(nueva);
  };

  const navegarConTransicion = (ruta) => {
    if (document.startViewTransition) {
      document.startViewTransition(() => navigate(ruta, { replace: true }));
    } else {
      navigate(ruta, { replace: true });
    }
  };

  const exportarExcel = async () => {
    if (loading || exportando) return;
    try {
      setExportando(true);
      const graficoTendencia = generarGraficoTendenciaPng(datosReporteVisible.tendencia);
      await exportarReporteExcel(datosReporteVisible, { graficoTendencia });
    } catch (errorExportacion) {
      console.error("No se pudo exportar el reporte a Excel:", errorExportacion);
    } finally {
      setExportando(false);
    }
  };
  const exportarPDF = async () => {
    if (loading || exportando) return;
    try {
      setExportando(true);
      const graficoTendencia = generarGraficoTendenciaPng(datosReporteVisible.tendencia);
      const logoBase64 = await cargarImagenBase64(logoSmartLot);
      exportarReportePDF(datosReporteVisible, {
        graficoTendencia,
        logoBase64,
      });
    } catch (errorExportacion) {
      console.error("No se pudo exportar el reporte a PDF:", errorExportacion);
    } finally {
      setExportando(false);
    }
  };
  const kpis = [
    {
      label: "Ocupacion Media",
      value: loading ? "—" : `${datosReporte.ocupacionMedia}%`,
      raw: loading ? null : datosReporte.ocupacionMedia,
      suffix: "%",
      icon: BarChart3,
      color: "#1d4ed8",
      bg: "#eff6ff",
    },
    {
      label: "Usuarios Activos",
      value: loading ? "—" : datosReporte.usuariosActivos.toLocaleString(),
      raw: loading ? null : datosReporte.usuariosActivos,
      suffix: "",
      icon: Users,
      color: "#059669",
      bg: "#ecfdf5",
    },
    {
      label: "Tiempo Promedio",
      value: loading ? "—" : datosReporte.tiempoPromedio,
      icon: Clock,
      color: "#d97706",
      bg: "#fffbeb",
    },
    {
      label: "Horas Pico",
      value: loading ? "—" : datosReporteVisible.horasPico,
      icon: Zap,
      color: "#dc2626",
      bg: "#fef2f2",
    },
  ];

  return (
    <div className="admin-panel admin-reportes-page">
      <Header />
      <header className="admin-panel__header">
        <button
          className="admin-panel__back-btn"
          onClick={() => navegarConTransicion("/admin_panel_de_control")}
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="admin-panel__title">Reportes y Analisis</h1>
          <p className="admin-panel__subtitle">
            Visualiza el rendimiento general y las auditorias del sistema.
          </p>
        </div>
      </header>

      {loading ? (
        <ReportesSkeleton />
      ) : (
        <>
          <section className="reportes-section">
            <div className="export-actions">
              <button className="report-btn report-btn--excel" onClick={exportarExcel} disabled={loading || exportando}>
                <div className="report-btn__icon-wrapper">
                  <FileText size={24} className="report-btn__icon" />
                </div>
                <div className="report-btn__content">
                  <span className="report-btn__title">Exportar a Excel</span>
                  <span className="report-btn__subtitle">Reporte en XLSX</span>
                </div>
              </button>
              <button className="report-btn report-btn--pdf" onClick={exportarPDF} disabled={loading || exportando}>
                <div className="report-btn__icon-wrapper">
                  <FileText size={24} className="report-btn__icon" />
                </div>
                <div className="report-btn__content">
                  <span className="report-btn__title">Exportar a PDF</span>
                  <span className="report-btn__subtitle">Reporte en PDF</span>
                </div>
              </button>
            </div>
          </section>

          {error && (
            <p style={{ color: "#dc2626", padding: "12px 0", fontWeight: 600 }} role="alert">
              {error}
            </p>
          )}

          <section className="kpi-grid">
            {kpis.map((kpi, i) => (
              <article className="kpi-card" key={kpi.label} style={{ animationDelay: `${0.15 + i * 0.08}s` }}>
                <div className="kpi-card__header">
                  <div className="kpi-card__icon-wrapper" style={{ backgroundColor: kpi.bg, color: kpi.color }}>
                    <kpi.icon size={22} />
                  </div>
                  <span className="kpi-card__label">{kpi.label}</span>
                </div>
                <span className="kpi-card__value kpi-card__value--animate">
                  {kpi.raw !== undefined ? (
                    <AnimatedNumber value={kpi.raw} suffix={kpi.suffix || ""} startDelay={(0.65 + i * 0.08) * 1000} />
                  ) : (
                    kpi.value
                  )}
                </span>
              </article>
            ))}
          </section>

          <section className="reportes-section">
            <div className="reportes-section__title-container">
              <TrendingUp size={20} className="reportes-section__icon" />
              <h2 className="reportes-section__title">Tendencia de Ocupacion</h2>
            </div>
            <div className="trend-controls">
              <div className="trend-granularidad">
                {["dia", "semana", "mes", "año"].map((g) => (
                  <button
                    key={g}
                    className={`trend-granularidad-btn ${granularidad === g ? "active" : ""}`}
                    onClick={() => setGranularidad(g)}
                  >
                    {g === "dia" ? "Día" : g === "semana" ? "Semana" : g === "mes" ? "Mes" : "Año"}
                  </button>
                ))}
              </div>
              <div className="trend-nav">
                <button className="trend-nav-btn" onClick={navegarAtras} aria-label="Anterior">
                  <ChevronLeft size={20} />
                </button>
                <span className="trend-nav-label">{periodLabel}</span>
                <button
                  className="trend-nav-btn"
                  onClick={navegarAdelante}
                  disabled={!puedeAvanzar}
                  aria-label="Siguiente"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            <div className="trend-chart-wrapper">
              <div className="trend-chart-accent" />
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={tendenciaDinamica} margin={{ top: 16, right: 12, left: -8, bottom: 8 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                      <stop offset="40%" stopColor="#3b82f6" stopOpacity={0.12} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="areaStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#1d4ed8" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                    <filter id="areaGlow">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="2 4"
                    stroke="#e2e8f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="dia"
                    tick={{ fontSize: 13, fill: "#64748b", fontWeight: 600, letterSpacing: "0.02em" }}
                    axisLine={{ stroke: "#e2e8f0", strokeWidth: 1 }}
                    tickLine={false}
                    dy={6}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 13, fill: "#475569", fontWeight: 600, letterSpacing: "0.02em" }}
                    axisLine={false}
                    tickLine={false}
                    dx={-2}
                    width={48}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: "#94a3b8", strokeDasharray: "3 3", strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    stroke="url(#areaStroke)"
                    strokeWidth={3}
                    fill="url(#areaGradient)"
                    filter="url(#areaGlow)"
                    animationDuration={1200}
                    animationEasing="ease-out"
                    dot={<CustomDot />}
                    activeDot={CustomActiveDot}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="trend-chart-footer">
                <span className="trend-chart-footer__dot" />
                <span>
                  {granularidad === "dia"
                    ? "Reservas por hora del día seleccionado"
                    : granularidad === "semana"
                      ? "Reservas por día de la semana"
                      : granularidad === "mes"
                        ? "Reservas por día del mes"
                        : "Reservas por mes del año"}
                </span>
              </div>
            </div>
          </section>
        </>
      )}

      <FooterEmpleado />
    </div>
  );
}
