import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/useAuth';
import { Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react';
import { ReservasGetAll } from '../servicies/API_Reserva';
import { UsuariosGetAll } from '../servicies/API_Usuario';
import { GaragesGetAll } from '../servicies/API_Garage';
import "./tabla_reservas_panelControl.css";

const AVATAR_COLORS = ["blue", "orange", "green", "purple", "pink", "teal"];
const ITEMS_PER_PAGE = 3;

const obtenerListado = (datos) => {
  if (Array.isArray(datos)) return datos;
  if (Array.isArray(datos?.datos)) return datos.datos;
  if (Array.isArray(datos?.data)) return datos.data;
  if (Array.isArray(datos?.reservas)) return datos.reservas;
  if (Array.isArray(datos?.value)) return datos.value;
  return [];
};

const tieneZonaHoraria = (valor) => /[zZ]$|[+-]\d{2}:?\d{2}$/.test(valor);

const extraerFechaStr = (datetime) => {
  if (!datetime) return "";
  const valor = String(datetime);
  if (tieneZonaHoraria(valor)) {
    const fecha = new Date(valor);
    if (!Number.isNaN(fecha.getTime())) {
      return new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "America/Argentina/Buenos_Aires",
      }).format(fecha);
    }
  }
  const conEspacio = valor.split(" ");
  if (conEspacio.length > 1) return conEspacio[0];
  return valor.split("T")[0];
};

const extraerHoraLocal = (fechaStr) => {
  if (!fechaStr) return "--:--";
  const valor = String(fechaStr);
  if (/^\d{2}:\d{2}/.test(valor)) return valor.slice(0, 5);
  if (tieneZonaHoraria(valor)) {
    const fecha = new Date(valor);
    if (!Number.isNaN(fecha.getTime())) {
      return new Intl.DateTimeFormat("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "America/Argentina/Buenos_Aires",
      }).format(fecha);
    }
  }
  if (valor.includes("T")) {
    const hora = valor.split("T")[1]?.slice(0, 5);
    return hora || "--:--";
  }
  const partes = valor.split(" ");
  if (partes.length > 1) return partes[1].slice(0, 5);
  return "--:--";
};

const obtenerFechaHoraReserva = (reserva, clavesFechaCompleta, clavesHora) => {
  for (const clave of clavesFechaCompleta) {
    const valor = reserva[clave];
    if (valor !== undefined && valor !== null && valor !== "") return valor;
  }

  const fecha = reserva.fecha ?? reserva.fecha_reserva ?? reserva.fechaReserva;
  if (!fecha) return "";

  for (const clave of clavesHora) {
    const hora = reserva[clave];
    if (hora !== undefined && hora !== null && hora !== "") {
      return `${String(fecha).split(/[T ]/)[0]}T${String(hora)}`;
    }
  }

  return fecha;
};

const obtenerOrdenFechaHora = (fechaHora) => {
  if (!fechaHora) return 0;
  const valor = String(fechaHora);
  if (/^\d{2}:\d{2}/.test(valor)) return 0;
  const fecha = new Date(tieneZonaHoraria(valor) ? valor : valor.replace(" ", "T"));
  return Number.isNaN(fecha.getTime()) ? 0 : fecha.getTime();
};

const esMismaFecha = (fechaA, fechaB) =>
  fechaA.getFullYear() === fechaB.getFullYear() &&
  fechaA.getMonth() === fechaB.getMonth() &&
  fechaA.getDate() === fechaB.getDate();

const formatearFecha = (fecha) => {
  if (!fecha) return "Sin fecha";
  const fechaReserva = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(fechaReserva.getTime())) return fecha;
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);
  const manana = new Date();
  manana.setDate(hoy.getDate() + 1);
  if (esMismaFecha(fechaReserva, ayer)) return "Ayer";
  if (esMismaFecha(fechaReserva, hoy)) return "Hoy";
  if (esMismaFecha(fechaReserva, manana)) return "Mañana";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
  }).format(fechaReserva);
};

export default function TablaReservasPanleControl() {
  const { usuario } = useAuth();
  const [reservasCrudas, setReservasCrudas] = useState([]);
  const [usuariosMap, setUsuariosMap] = useState({});
  const [garagesList, setGaragesList] = useState([]);
  const [garagesMap, setGaragesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [activeChip, setActiveChip] = useState("Todas");
  const [isOpen, setIsOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [fechaReferenciaOrden] = useState(() => Date.now());

  useEffect(() => {
    let montado = true;

    const fetchData = async () => {
      setLoading(true);
      setError("");

      try {
        const [resRes, usuRes, garRes] = await Promise.all([
          ReservasGetAll(),
          UsuariosGetAll(),
          GaragesGetAll(),
        ]);

        if (!montado) return;

        const usuariosArray = obtenerListado(usuRes.datos);
        const uMap = {};
        usuariosArray.forEach((u) => {
          const id = u.id ?? u.id_usuario ?? u._id;
          uMap[id] = u;
        });
        setUsuariosMap(uMap);

        const garArray = obtenerListado(garRes.datos);

        // GaragesGetAll ya llega acotado por los tratos de la sede o empresa autenticada.
        const garagesFiltrados = garArray;

        const gMap = {};
        garagesFiltrados.forEach((g) => {
          const id = g.id_garage ?? g.idGarage ?? g.id ?? g._id;
          gMap[id] = g.nombre || g.name || g.descripcion || "Garage";
        });
        setGaragesMap(gMap);
        setGaragesList(garagesFiltrados);

        const reservasArray = obtenerListado(resRes.datos);
        setReservasCrudas(reservasArray);
      } catch (err) {
        console.error("Error al cargar datos del panel:", err);
        if (montado) setError("Error al conectar con el servidor.");
      } finally {
        if (montado) setLoading(false);
      }
    };

    fetchData();
    return () => { montado = false; };
  }, [usuario]);

  const reservasNormalizadas = useMemo(() => {
    const adminIdSede = Number(usuario?.id_sede);
    const empresaAdmin = Number(usuario?.id_empresa);
    const adminSinSede = !adminIdSede || isNaN(adminIdSede);
    const tieneEmpresa = !isNaN(empresaAdmin) && empresaAdmin > 0;

    const userIdsPermitidos = new Set();
    Object.values(usuariosMap).forEach((u) => {
      const userId = Number(u.id ?? u.id_usuario ?? u._id);
      if (!adminSinSede) {
        if (Number(u.id_sede ?? u.idSede) === adminIdSede) {
          userIdsPermitidos.add(userId);
        }
      } else if (tieneEmpresa) {
        if (Number(u.id_empresa ?? u.idEmpresa) === empresaAdmin) {
          userIdsPermitidos.add(userId);
        }
      } else {
        userIdsPermitidos.add(userId);
      }
    });

    const filtrarActivo = !adminSinSede || tieneEmpresa;
    let reservasScope = reservasCrudas;
    if (filtrarActivo && userIdsPermitidos.size > 0) {
      reservasScope = reservasCrudas.filter((r) => {
        const idUsuario = Number(r.id_usuario ?? r.idUsuario ?? r.usuario_id);
        return userIdsPermitidos.has(idUsuario);
      });
    }

    return reservasScope.map((r) => {
      const idUsuario = r.id_usuario ?? r.idUsuario ?? r.usuario_id;
      const userData = usuariosMap[idUsuario] ?? {};
      const nombre = userData.nombre ?? "";
      const apellido = userData.apellido ?? "";
      const nombreCompleto = `${nombre} ${apellido}`.trim() || "Usuario";
      const iniciales = ((nombre[0] ?? "") + (apellido[0] ?? "")).toUpperCase() || "?";
      const colorIdx = Number(idUsuario) % AVATAR_COLORS.length;

      const idGarage = r.id_garage ?? r.idGarage ?? r.garage_id;
      const garageNombre = garagesMap[idGarage] ?? "Garage";

      const fechaEntrada = obtenerFechaHoraReserva(
        r,
        ["fecha_entrada", "fechaEntrada", "fecha_inicio", "fechaInicio"],
        ["hora_entrada", "horaEntrada", "hora_inicio", "horaInicio"]
      );
      const fechaSalida = obtenerFechaHoraReserva(
        r,
        ["fecha_salida", "fechaSalida", "fecha_fin", "fechaFin"],
        ["hora_salida", "horaSalida", "hora_fin", "horaFin"]
      );

      const fechaStr = extraerFechaStr(fechaEntrada);
      const fechaDisplay = formatearFecha(fechaStr);
      const horaInicio = extraerHoraLocal(fechaEntrada);
      const horaFin = extraerHoraLocal(fechaSalida);
      const fechaOrden = obtenerOrdenFechaHora(fechaEntrada);

      const plaza = r.plaza ?? r.nro_plaza ?? r.numero_plaza ?? r.espacio ?? "—";
      const zona = r.nombre_zona ?? r.zona ?? r.nivel ?? r.sector ?? "—";

      return {
        id: r.id ?? r.id_reserva,
        iniciales,
        nombre: nombreCompleto,
        color: AVATAR_COLORS[colorIdx],
        plaza,
        zona,
        id_garage: idGarage,
        garage_nombre: garageNombre,
        fecha: fechaDisplay,
        hora: `${horaInicio} - ${horaFin}`,
        email: userData.email ?? "",
        telefono: userData.telefono ?? "",
        userId: idUsuario,
        fechaOrden,
      };
    }).sort((a, b) => {
      if (!a.fechaOrden && !b.fechaOrden) return 0;
      if (!a.fechaOrden) return 1;
      if (!b.fechaOrden) return -1;
      return Math.abs(a.fechaOrden - fechaReferenciaOrden) - Math.abs(b.fechaOrden - fechaReferenciaOrden);
    });
  }, [reservasCrudas, usuariosMap, garagesMap, usuario, fechaReferenciaOrden]);

  const chips = useMemo(() => {
    const nombresGarages = garagesList
      .map((g) => g.nombre || g.name || g.descripcion || "Garage")
      .filter(Boolean);
    return ["Todas", "Hoy", ...nombresGarages];
  }, [garagesList]);

  const filteredData = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return reservasNormalizadas.filter((item) => {
      const coincideBusqueda =
        !query ||
        item.nombre.toLowerCase().includes(query) ||
        item.plaza.toLowerCase().includes(query) ||
        item.zona.toLowerCase().includes(query) ||
        item.garage_nombre.toLowerCase().includes(query);

      let coincideChip = true;
      if (activeChip === "Hoy") {
        coincideChip = item.fecha.toLowerCase().includes("hoy");
      } else if (activeChip !== "Todas") {
        coincideChip = item.garage_nombre === activeChip;
      }

      return coincideBusqueda && coincideChip;
    });
  }, [reservasNormalizadas, searchTerm, activeChip]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  }, [filteredData]);

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, safeCurrentPage]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage(p => Math.max(Math.min(p, totalPages) - 1, 1));
  }, [totalPages]);

  const goToNextPage = useCallback(() => {
    setCurrentPage(p => Math.min(Math.min(p, totalPages) + 1, totalPages));
  }, [totalPages]);

  const goToPage = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const pageButtons = useMemo(() => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }, [totalPages]);

  return (
    <div className="reservations-container">
      <div className="filter-bar">
        <div className="filter-bar__title-row">
          <ClipboardList size={22} className="filter-bar__title-icon" />
          <h2 className="reservations-title">Tabla de reservas</h2>
        </div>
        <div className="filter-bar__search-wrap">
          <Search size={20} className="filter-bar__search-icon" />
          <input
            type="text"
            placeholder="Buscar usuario, plaza o garage..."
            className="filter-bar__input"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {!loading && (
        <div className="chips-group">
          {chips.map((chip) => (
            <button
              key={chip}
              className={`chip ${activeChip === chip ? "chip--active" : ""}`}
              onClick={() => {
                setActiveChip(chip);
                setCurrentPage(1);
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      <div className="reservations-table-wrapper">
        <table className="reservations-table">
          <thead className="reservations-table__head" onClick={() => setIsOpen(o => !o)}>
            <tr>
              <th>
                <span className="reservations-table__head-toggle">
                  {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  USUARIO
                </span>
              </th>
              <th>PLAZA / ZONA</th>
              <th>FECHA / HORA</th>
            </tr>
          </thead>
          {isOpen && (
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className="reservations-table__empty">
                    Cargando reservas...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="3" className="reservations-table__empty">
                    {error}
                  </td>
                </tr>
              ) : reservasNormalizadas.length === 0 ? (
                <tr>
                  <td colSpan="3" className="reservations-table__empty">
                    No hay reservas disponibles
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="3" className="reservations-table__empty">
                    No se encontraron reservas para &quot;{searchTerm}&quot;
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={item.id} className="reservations-table__row">
                    <td data-label="USUARIO">
                      <div className="user-info">
                        <div className={`user-info__avatar user-info__avatar--${item.color}`}>
                          {item.iniciales}
                        </div>
                        <div
                          className="user-info__trigger"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            if (window.innerHeight - rect.bottom < 280) {
                              e.currentTarget.classList.add("user-info__trigger--up");
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.classList.remove("user-info__trigger--up");
                          }}
                        >
                          <span className="user-info__name">{item.nombre}</span>
                          {(item.email || item.telefono) && (
                            <div className="user-info__popover">
                              <div className="user-info__popover-header">
                                <div className="user-info__popover-avatar">{item.iniciales}</div>
                                <div>
                                  <div className="user-info__popover-name">{item.nombre}</div>
                                  {item.email && <div className="user-info__popover-email">{item.email}</div>}
                                </div>
                              </div>
                              <div className="user-info__popover-details">
                                {item.telefono && <span className="user-info__popover-detail">{item.telefono}</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td data-label="PLAZA / ZONA">
                      <div className="cell-block">
                        <span className="cell-block__title">{item.plaza}</span>
                        <span className="cell-block__subtitle">{item.zona}</span>
                      </div>
                    </td>
                    <td data-label="FECHA / HORA">
                      <div className="cell-block">
                        <span className="cell-block__title">{item.fecha}</span>
                        <span className="cell-block__subtitle">{item.hora}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          )}
        </table>
      </div>

      {isOpen && (
        <footer className="pagination">
          <span className="pagination__info">
            {loading
              ? "Cargando..."
              : totalPages <= 1
                ? `Mostrando ${filteredData.length} de ${reservasNormalizadas.length} reservas`
                : `Página ${safeCurrentPage} de ${totalPages} (${filteredData.length} reservas)`
            }
          </span>
          {totalPages > 1 && (
            <div className="pagination__controls">
              <button
                className="pagination__btn"
                onClick={goToPrevPage}
                disabled={safeCurrentPage <= 1}
                aria-label="Página anterior"
              >
                <ChevronLeft size={18} />
              </button>
              {pageButtons.map(page => (
                <button
                  key={page}
                  className={`pagination__btn ${safeCurrentPage === page ? "pagination__btn--active" : ""}`}
                  onClick={() => goToPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="pagination__btn"
                onClick={goToNextPage}
                disabled={safeCurrentPage >= totalPages}
                aria-label="Siguiente página"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </footer>
      )}
    </div>
  );
}
