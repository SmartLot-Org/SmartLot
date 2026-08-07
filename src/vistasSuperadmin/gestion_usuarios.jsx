import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  UserPlus,
  ArrowLeft,
  LogIn,
  ChevronDown,
  X,
  Archive,
  RotateCcw,
  Trash2,
  MapPin,
  Building2,
  Car,
  ShieldCheck,
  Filter, // <-- Nuevo icono
  SlidersHorizontal // <-- Nuevo icono
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Swal from "sweetalert2";
import { Z_INDEX } from "../helpers/zIndex";
import { guardarSuperadminBackup, guardarUsuarioImpersonado } from "../helpers/superadminSession";
import { useAuth } from "../contexts/useAuth";

import "./gestion_usuarios.css";
import HeaderSuperadmin from "../componentesSuperadmin/header_superadmin";
import FooterSuperadmin from "../componentesSuperadmin/footer_superadmin";
import BotonGenerico from "../componentesAdmin/boton_generico";
import ModalPortal from "../componentesCompartidos/ModalPortal";
import AuditoriaPanel from "../componentesCompartidos/AuditoriaPanel";
import {
  UsuariosGetAll,
  UsuariosGetAuditoria,
  UsuariosGetById,
  UsuariosDelete,
  UsuariosPatchEstado,
  UsuariosImpersonate,
} from "../servicies/API_Usuario";
import { EmpresasGetAll } from "../servicies/API_Empresa";
import { SedesGetAll } from "../servicies/API_Sede";
import { GaragesGetAll } from "../servicies/API_Garage";
import { getUserHomeRoute } from '../helpers/roles';
import { getUsuarioGarageIds, mergeUsuariosById } from '../helpers/usuarios';

gsap.registerPlugin(useGSAP);

const obtenerListado = (datos) => {
  if (Array.isArray(datos)) return datos;
  if (Array.isArray(datos?.datos)) return datos.datos;
  if (Array.isArray(datos?.data)) return datos.data;
  if (Array.isArray(datos?.usuarios)) return datos.usuarios;
  return [];
};

const ROLE_LABELS = {
  1: "Admin",
  2: "Empleado",
  3: "Garagista",
  4: "Superadmin",
  5: "Dueño de garage",
};

const ROLE_CLASSES = {
  1: "role-admin",
  2: "role-empleado",
  3: "role-garagista",
  4: "role-superadmin",
  5: "role-duenio-garage",
};

const ROLE_ORDER = [4, 5, 1, 3, 2];

const obtenerActorAuditoria = (item, tipo) => {
  const nombre = item?.[`${tipo}ByNombre`]?.trim?.();
  const email = item?.[`${tipo}ByEmail`];
  return nombre || email || "Usuario no disponible";
};

const crearEventosAuditoriaUsuario = (items) =>
  items
    .flatMap((item) => {
      const nombreUsuario = `${item.nombre || ""} ${item.apellido || ""}`.trim() || item.email || `Usuario ${item.id}`;
      const eventos = [];
      if (item.UpdateAt) {
        eventos.push({
          id: `${item.id}-update-${item.UpdateAt}`,
          accion: "Editado",
          clase: "update",
          entidad: nombreUsuario,
          actor: obtenerActorAuditoria(item, "Update"),
          fecha: item.UpdateAt,
        });
      }
      if (item.DeleteAt || item.Borrado === true) {
        eventos.push({
          id: `${item.id}-delete-${item.DeleteAt || "deleted"}`,
          accion: "Borrado",
          clase: "delete",
          entidad: nombreUsuario,
          actor: obtenerActorAuditoria(item, "Delete"),
          fecha: item.DeleteAt,
        });
      }
      return eventos;
    })
    .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

const obtenerOpcionesUnicas = (items, selector) =>
  Array.from(new Set(items.flatMap((item) => {
    const value = selector(item);
    return Array.isArray(value) ? value : [value];
  }).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" })
  );

function UserCardSkeleton() {
  return (
    <article className="usuario-card usuario-card-skeleton" aria-label="Cargando usuario">
      <div className="usuario-card-top">
        <span className="skeleton-line skeleton-usuario-avatar" />
        <div className="usuario-info skeleton-usuario-info">
          <span className="skeleton-line skeleton-usuario-name" />
          <span className="skeleton-line skeleton-usuario-role" />
        </div>
      </div>

      <div className="usuario-card-body">
        <span className="skeleton-line skeleton-usuario-email" />
        <span className="skeleton-line skeleton-usuario-phone" />
        <div className="usuario-metas">
          <span className="skeleton-line skeleton-usuario-meta" />
          <span className="skeleton-line skeleton-usuario-meta short" />
        </div>
      </div>

      <div className="usuario-card-footer skeleton-usuario-footer">
        <span className="skeleton-line skeleton-usuario-status" />
        <div className="usuario-actions">
          <span className="skeleton-line skeleton-usuario-login" />
          <span className="skeleton-line skeleton-usuario-action" />
        </div>
      </div>
    </article>
  );
}

const normalizarUsuario = (usuario, empresaMap, sedeMap, garageMap) => {
  const id = usuario.id ?? usuario.id_usuario ?? usuario._id;
  const nombreEmpresa = empresaMap[Number(usuario.id_empresa)] || null;
  const nombreSede = sedeMap[Number(usuario.id_sede)] || null;
  const idGarages = getUsuarioGarageIds(usuario);
  const nombresGarages = idGarages.map((idGarage) => garageMap[idGarage]).filter(Boolean);

  return {
    id,
    id_empresa: !isNaN(Number(usuario.id_empresa)) ? Number(usuario.id_empresa) : null,
    id_sede: usuario.id_sede ?? null,
    id_garage: idGarages[0] ?? null,
    id_garages: idGarages,
    nombre: `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim() || "Usuario sin nombre",
    email: usuario.email || "Sin email",
    telefono: usuario.telefono || "",
    id_rol: Number(usuario.id_rol),
    role: ROLE_LABELS[Number(usuario.id_rol)] || "Desconocido",
    empresa: nombreEmpresa,
    sede: nombreSede,
    garage: nombresGarages[0] ?? null,
    garages: nombresGarages,
    activo: usuario.activo !== false,
  };
};

const GestionUsuarios = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const dropdownRef = useRef(null); // Ref para el panel desplegable de filtros
  const buttonFilterRef = useRef(null); // Ref para el botón de filtros

  const [usuarios, setUsuarios] = useState([]);
  const [empresaMap, setEmpresaMap] = useState({});
  const [sedeMap, setSedeMap] = useState({});
  const [garageMap, setGarageMap] = useState({});
  const [auditoria, setAuditoria] = useState([]);
  const [loadingAuditoria, setLoadingAuditoria] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [searchArchivedTerm, setSearchArchivedTerm] = useState("");
  const [selectedRol, setSelectedRol] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState("");
  const [selectedSede, setSelectedSede] = useState("");
  const [selectedGarage, setSelectedGarage] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [showFilters, setShowFilters] = useState(false); // Estado para abrir/cerrar filtros
  const { usuario, setUsuario, setRoleTransition } = useAuth();

  // Detectar clics fuera del panel de filtros para cerrarlo automáticamente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showFilters &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonFilterRef.current &&
        !buttonFilterRef.current.contains(event.target)
      ) {
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilters]);

  // Contabilizamos cuántos filtros secundarios hay activos
  const activeFiltersCount = [selectedEmpresa, selectedSede, selectedGarage].filter(Boolean).length;

  useEffect(() => {
    setSelectedEmpresa("");
    setSelectedSede("");
    setSelectedGarage("");
  }, [selectedRol]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      setLoadingAuditoria(true);
      setError("");

      try {
        const [usuRes, empRes, sedRes, garRes, auditRes] = await Promise.all([
          UsuariosGetAll(),
          EmpresasGetAll(),
          SedesGetAll(),
          GaragesGetAll(),
          UsuariosGetAuditoria(),
        ]);

        if (!mounted) return;

        if (!usuRes.respuesta) {
          setError("No se pudieron cargar los usuarios.");
          setLoading(false);
          return;
        }

        const usuariosRaw = obtenerListado(usuRes.datos);
        const empresas = empRes.respuesta ? obtenerListado(empRes.datos) : [];
        const sedes = sedRes.respuesta ? obtenerListado(sedRes.datos) : [];
        const garages = garRes.respuesta ? obtenerListado(garRes.datos) : [];

        const eMap = Object.fromEntries(empresas.map((e) => [Number(e.id), e.nombre]));
        const sMap = Object.fromEntries(sedes.map((s) => [Number(s.id), s.nombre]));
        const gMap = {};
        garages.forEach((g) => {
          const id = g.id_garage ?? g.id ?? g._id;
          if (id != null) gMap[Number(id)] = g.nombre || g.name || g.descripcion || g.ubicacion || g.nombre_garage || g.garage_nombre || "Garage";
        });

        setEmpresaMap(eMap);
        setSedeMap(sMap);
        setGarageMap(gMap);
        setUsuarios(mergeUsuariosById(usuariosRaw).map((u) => normalizarUsuario(u, eMap, sMap, gMap)));
        if (auditRes.respuesta) {
          setAuditoria(crearEventosAuditoriaUsuario(obtenerListado(auditRes.datos)));
        }
      } catch (err) {
        console.error("Error loading user data:", err);
        setError("Ocurrió un error inesperado.");
      } finally {
        if (mounted) setLoading(false);
        if (mounted) setLoadingAuditoria(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, []);

  const recargarAuditoria = async () => {
    setLoadingAuditoria(true);
    const auditRes = await UsuariosGetAuditoria();
    if (auditRes.respuesta) {
      setAuditoria(crearEventosAuditoriaUsuario(obtenerListado(auditRes.datos)));
    }
    setLoadingAuditoria(false);
  };

  useEffect(() => {
    if (!showArchived) {
      setSearchArchivedTerm("");
      return;
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (e) => {
      if (e.key === "Escape") setShowArchived(false);
    };
    document.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [showArchived]);

  const empresasDisponibles = useMemo(() => {
    return obtenerOpcionesUnicas(
      usuarios.filter((u) => {
        if (u.activo === false) return false;
        if (selectedRol && u.id_rol !== Number(selectedRol)) return false;
        if (selectedSede && u.sede !== selectedSede) return false;
        if (selectedGarage && !u.garages.includes(selectedGarage)) return false;
        return true;
      }),
      (u) => u.empresa
    );
  }, [usuarios, selectedRol, selectedSede, selectedGarage]);

  const sedesDisponibles = useMemo(() => {
    return obtenerOpcionesUnicas(
      usuarios.filter((u) => {
        if (u.activo === false) return false;
        if (selectedRol && u.id_rol !== Number(selectedRol)) return false;
        if (selectedEmpresa && u.empresa !== selectedEmpresa) return false;
        if (selectedGarage && !u.garages.includes(selectedGarage)) return false;
        return true;
      }),
      (u) => u.sede
    );
  }, [usuarios, selectedRol, selectedEmpresa, selectedGarage]);

  const garagesDisponibles = useMemo(() => {
    return obtenerOpcionesUnicas(
      usuarios.filter((u) => {
        if (u.activo === false) return false;
        if (selectedRol && u.id_rol !== Number(selectedRol)) return false;
        if (selectedEmpresa && u.empresa !== selectedEmpresa) return false;
        if (selectedSede && u.sede !== selectedSede) return false;
        return u.garages.length > 0;
      }),
      (u) => u.garages
    );
  }, [usuarios, selectedRol, selectedEmpresa, selectedSede]);

  useEffect(() => {
    if (selectedEmpresa && !empresasDisponibles.includes(selectedEmpresa)) {
      setSelectedEmpresa("");
    }
  }, [empresasDisponibles, selectedEmpresa]);

  useEffect(() => {
    if (selectedSede && !sedesDisponibles.includes(selectedSede)) {
      setSelectedSede("");
    }
  }, [sedesDisponibles, selectedSede]);

  useEffect(() => {
    if (selectedGarage && !garagesDisponibles.includes(selectedGarage)) {
      setSelectedGarage("");
    }
  }, [garagesDisponibles, selectedGarage]);

  const usuariosFiltrados = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();

    return usuarios.filter((u) => {
      if (u.activo === false) return false;

      const coincideBusqueda =
        !query ||
        u.nombre.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query);

      const coincideRol = !selectedRol || u.id_rol === Number(selectedRol);
      const coincideEmpresa = !selectedEmpresa || u.empresa === selectedEmpresa;
      const coincideSede = !selectedSede || u.sede === selectedSede;
      const coincideGarage = !selectedGarage || u.garages.includes(selectedGarage);

      return coincideBusqueda && coincideRol && coincideEmpresa && coincideSede && coincideGarage;
    }).sort((a, b) => {
      const orderA = ROLE_ORDER.indexOf(a.id_rol);
      const orderB = ROLE_ORDER.indexOf(b.id_rol);
      if (orderA !== orderB) return orderA - orderB;
      if (!a.empresa && !b.empresa) return 0;
      if (!a.empresa) return 1;
      if (!b.empresa) return -1;
      return a.empresa.localeCompare(b.empresa, 'es', { sensitivity: 'base' });
    });
  }, [searchTerm, selectedRol, selectedEmpresa, selectedSede, selectedGarage, usuarios]);

  const usuariosArchivados = useMemo(() => {
    const query = searchArchivedTerm.toLowerCase().trim();
    return usuarios.filter((u) => {
      if (u.activo !== false) return false;
      if (!query) return true;
      return (
        u.nombre.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query)
      );
    });
  }, [searchArchivedTerm, usuarios]);

  const totalArchivados = useMemo(
    () => usuarios.filter((u) => u.activo === false).length,
    [usuarios]
  );

  const handleArchivar = async (id, nombre) => {
    const result = await Swal.fire({
      title: "¿Archivar a este usuario?",
      text: `${nombre} quedará inactivo.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563EB",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Sí, archivar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      zIndex: Z_INDEX.SWAL_DIALOG,
    });

    if (!result.isConfirmed) return;

    try {
      const response = await UsuariosPatchEstado(id, false);
      if (response.respuesta) {
        gsap.to(`.usuario-card-id-${id}`, {
          scale: 0.9,
          opacity: 0,
          duration: 0.25,
          ease: "power2.inOut",
          onComplete: () => {
            setUsuarios((prev) =>
              prev.map((u) => (u.id === id ? { ...u, activo: false } : u))
            );
            recargarAuditoria();
          },
        });
      } else {
        Swal.fire("Error", "No se pudo archivar.", "error");
      }
    } catch (err) {
      Swal.fire("Error de red", "Hubo un error al conectar.", "error");
    }
  };

  const handleRestaurar = async (id, nombre) => {
    try {
      const response = await UsuariosPatchEstado(id, true);
      if (response.respuesta) {
        setShowArchived(false);
        setUsuarios((prev) =>
          prev.map((u) => (u.id === id ? { ...u, activo: true } : u))
        );
        await recargarAuditoria();
        Swal.fire({
          title: "Restaurado",
          text: `${nombre} ha sido restaurado.`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
          zIndex: Z_INDEX.SWAL_DIALOG,
        });
      } else {
        Swal.fire("Error", "No se pudo restaurar.", "error");
      }
    } catch (err) {
      Swal.fire("Error de red", "Hubo un error al conectar.", "error");
    }
  };

  const handleEliminar = async (id, nombre) => {
    setShowArchived(false);
    const result = await Swal.fire({
      title: "¿Eliminar permanentemente?",
      text: `${nombre} será eliminado del sistema.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      zIndex: Z_INDEX.SWAL_DIALOG,
    });

    if (!result.isConfirmed) return;

    try {
      const response = await UsuariosDelete(id);
      if (response.respuesta) {
        setUsuarios((prev) => prev.filter((u) => u.id !== id));
        await recargarAuditoria();
        Swal.fire("Eliminado", "Usuario eliminado permanentemente.", "success");
      } else {
        Swal.fire("Error", "No se pudo eliminar.", "error");
      }
    } catch (err) {
      Swal.fire("Error de red", "Hubo un error al conectar.", "error");
    }
  };

  const handleLoginAs = async (targetUser) => {
    const result = await Swal.fire({
      title: `¿Ingresar como ${targetUser.nombre}?`,
      text: `Te loguearás con el rol de ${targetUser.role}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563EB",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Sí, ingresar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      zIndex: Z_INDEX.SWAL_DIALOG,
    });

    if (!result.isConfirmed) return;

    guardarSuperadminBackup(usuario);

    let userData = null;

    try {
      const res = await UsuariosImpersonate(targetUser.id);
      if (res.respuesta && res.datos) {
        userData = res.datos.usuario || res.datos;
      }
    } catch {
      // Fallback al targetUser si la API falla
    }

    const finalUser = userData || targetUser;
    guardarUsuarioImpersonado(finalUser);
    setRoleTransition(true);
    setUsuario(finalUser);

    navigate(getUserHomeRoute(finalUser));
  };

  // Animaciones iniciales
  useGSAP(
    () => {
      const header = containerRef.current?.querySelector(".usuarios-animate-header");
      const toolbar = containerRef.current?.querySelector(".usuarios-animate-toolbar");
      if (!header) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.8 } });
      tl.from(header, { y: 30, opacity: 0 });
      if (toolbar) tl.from(toolbar, { y: 20, opacity: 0 }, "-=0.5");
    },
    { scope: containerRef }
  );

  // Animación de lista de tarjetas
  useGSAP(() => {
    const cards = containerRef.current?.querySelectorAll(".usuario-card") ?? [];
    if (cards.length > 0) {
      gsap.fromTo(
        cards,
        { y: 16, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.04,
          duration: 0.35,
          ease: "power2.out",
          overwrite: "auto",
        }
      );
    }
  }, [usuariosFiltrados]);

  // Animación del modal de archivados
  useGSAP(() => {
    if (showArchived) {
      gsap.fromTo(
        ".modal-portal-overlay",
        { opacity: 0 },
        { opacity: 1, duration: 0.25, ease: "power2.out" }
      );
      gsap.fromTo(
        ".modal-archivados-panel",
        { y: 30, opacity: 0, scale: 0.97 },
        { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: "power3.out", delay: 0.05 }
      );
    }
  }, [showArchived]);

  // Animación del Dropdown de Filtros (AutoAlpha para mejor Performance)
  useGSAP(() => {
    if (showFilters) {
      gsap.fromTo(
        dropdownRef.current,
        { y: -10, autoAlpha: 0, scale: 0.98 },
        { y: 0, autoAlpha: 1, scale: 1, duration: 0.25, ease: "power2.out", display: "flex" }
      );
    } else {
      gsap.to(dropdownRef.current, {
        y: -10, autoAlpha: 0, scale: 0.98, duration: 0.2, ease: "power2.in", display: "none"
      });
    }
  }, [showFilters]);


  return (
    <div className="gestion-usuarios-page" ref={containerRef}>
      <HeaderSuperadmin />

      <main className="gestion-usuarios-main">
        <header className="gestion-usuarios-header">
          <div className="usuarios-header-left usuarios-animate-header">
            <button className="boton-back" onClick={() => navigate("/superadmin_dashboard")}>
              <ArrowLeft size={24} />
            </button>
            <div className="usuarios-titulos">
              <h1>Gestión de Usuarios</h1>
              <p>Administra todos los usuarios del sistema.</p>
            </div>
          </div>
          <div className="usuarios-animate-header usuarios-header-actions">
            <BotonGenerico
              className="btn-archivados"
              onClick={() => setShowArchived(true)}
            >
              <Archive size={20} />
              <span>Archivados</span>
              {totalArchivados > 0 && (
                <span className="archivados-count-badge">{totalArchivados}</span>
              )}
            </BotonGenerico>

            <BotonGenerico
              className="btn-primario"
              onClick={() => navigate("/superadmin/agregar_usuario")}
            >
              <UserPlus size={20} />
              <span>Agregar usuario</span>
            </BotonGenerico>
          </div>
        </header>

        {loading ? (
          <>
            <div className="usuarios-toolbar-skeleton">
              <div className="skeleton-search" />
              <div className="skeleton-role-pills" />
            </div>
            <div className="usuarios-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <UserCardSkeleton key={i} />
              ))}
            </div>
          </>
        ) : (
          <section className="usuarios-toolbar usuarios-animate-toolbar">
            
            {/* Agrupamos Búsqueda y Botón de Filtros */}
            <div className="usuarios-search-filter-group">
              <div className="usuarios-search">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o rol..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Contenedor relativo para el Popover de Filtros */}
              <div className="filtros-wrapper">
                <button 
                  ref={buttonFilterRef}
                  className={`btn-toggle-filtros ${activeFiltersCount > 0 ? 'activo' : ''}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter size={18} />
                  <span>Filtros</span>
                  {activeFiltersCount > 0 && (
                    <span className="filtros-badge">{activeFiltersCount}</span>
                  )}
                  <ChevronDown size={16} className={`chevron-filter ${showFilters ? 'open' : ''}`} />
                </button>

                {/* Panel Desplegable Animado */}
                <div className="filtros-dropdown-panel" ref={dropdownRef}>
                  <div className="filtros-dropdown-header">
                    <SlidersHorizontal size={16}/>
                    <span>Filtros avanzados</span>
                  </div>

                  <div className="filtros-dropdown-body">
                    <div className="form-group-filter">
                      <label>Empresa</label>
                      <div className="select-wrapper">
                        <select
                          value={selectedEmpresa}
                          onChange={(e) => {
                            setSelectedEmpresa(e.target.value);
                            setSelectedSede(""); // Reseteamos sede al cambiar empresa
                            setSelectedGarage("");
                          }}
                        >
                          <option value="">Todas las empresas</option>
                          {empresasDisponibles.map((emp) => (
                            <option key={emp} value={emp}>
                              {emp}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="chevron-select" />
                      </div>
                    </div>

                    <div className="form-group-filter">
                      <label>Sede</label>
                      <div className="select-wrapper">
                        <select
                          value={selectedSede}
                          onChange={(e) => {
                            setSelectedSede(e.target.value);
                            setSelectedGarage("");
                          }}
                        >
                          <option value="">Todas las sedes</option>
                          {sedesDisponibles.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="chevron-select" />
                      </div>
                    </div>

                    <div className="form-group-filter">
                      <label>Garage</label>
                      <div className="select-wrapper">
                        <select
                          value={selectedGarage}
                          onChange={(e) => setSelectedGarage(e.target.value)}
                        >
                          <option value="">Todos los garages</option>
                          {garagesDisponibles.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="chevron-select" />
                      </div>
                    </div>
                  </div>

                  {/* Footer del panel (Limpiar) */}
                  {activeFiltersCount > 0 && (
                    <div className="filtros-dropdown-footer">
                      <button
                        className="btn-limpiar-dropdown"
                        onClick={() => {
                          setSelectedEmpresa("");
                          setSelectedSede("");
                          setSelectedGarage("");
                        }}
                      >
                        <X size={14} />
                        Limpiar todos
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="usuarios-role-pills">
              <button
                className={`role-pill ${!selectedRol ? "active" : ""}`}
                onClick={() => setSelectedRol("")}
              >
                Todos
              </button>
              {ROLE_ORDER.map((rid) => (
                <button
                  key={rid}
                  className={`role-pill ${ROLE_CLASSES[rid]} ${Number(selectedRol) === rid ? "active" : ""}`}
                  onClick={() => setSelectedRol(String(rid))}
                >
                  {ROLE_LABELS[rid]}
                </button>
              ))}
            </div>
          </section>
        )}

        {!loading && (
          <AuditoriaPanel
            titulo="Auditoría de usuarios"
            descripcion="Últimas ediciones y borrados registrados."
            eventos={auditoria}
            loading={loadingAuditoria}
            maxItems={10}
          />
        )}

        {!loading && (
          <div className="usuarios-grid">
            {error && <div className="usuarios-feedback-error">{error}</div>}

            {!error && usuariosFiltrados.length > 0
              ? usuariosFiltrados.map((u) => (
                  <article
                    key={u.id}
                    className={`usuario-card usuario-card-id-${u.id}`}
                  >
                    <div className="usuario-card-top">
                      <div className="usuario-avatar">
                        {u.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="usuario-info">
                        <h3>{u.nombre}</h3>
                        <span className={`usuario-role-badge ${ROLE_CLASSES[u.id_rol]}`}>
                          <ShieldCheck size={12} />
                          {u.role}
                        </span>
                      </div>
                    </div>

                    <div className="usuario-card-body">
                      <p className="usuario-email">{u.email}</p>
                      {u.telefono && <p className="usuario-tel">{u.telefono}</p>}

                      <div className="usuario-metas">
                        {u.empresa && (
                          <span className="usuario-meta">
                            <Building2 size={13} />
                            {u.empresa}
                          </span>
                        )}
                        {u.sede && (
                          <span className={`usuario-meta ${u.id_rol === 1 ? 'usuario-meta-admin' : ''}`}>
                            <MapPin size={13} />
                            {u.sede}
                          </span>
                        )}
                        {u.garages.length > 0 && (
                          <span className={`usuario-meta ${u.id_rol === 3 ? 'usuario-meta-garage' : ''}`}>
                            <Car size={13} />
                            {u.garages.join(', ')}
                          </span>
                        )}
                        {u.id_rol === 1 && !u.sede && (
                          <span className="usuario-meta usuario-meta-admin">
                            <Building2 size={13} />
                            Admin General
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="usuario-card-footer">
                      <div className="usuario-status">
                        <div className="status-dot active"></div>
                        <span>Activo</span>
                      </div>

                      {u.id_rol !== 4 && (
                        <div className="usuario-actions">
                          <button
                            className="usuario-login-as-btn"
                            onClick={() => handleLoginAs(u)}
                            aria-label={`Ingresar como ${u.nombre}`}
                          >
                            <LogIn size={14} />
                            <span>Loguearte como</span>
                          </button>
                          <button
                            className="usuario-archive-btn"
                            onClick={() => handleArchivar(u.id, u.nombre)}
                            aria-label={`Archivar a ${u.nombre}`}
                          >
                            <Archive size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                ))
              : null}

            {!error && usuariosFiltrados.length === 0 && (
              <div className="usuarios-no-results">
                {searchTerm || activeFiltersCount > 0 ? (
                  <>
                    <p>No se encontraron resultados para tu búsqueda.</p>
                    <button 
                      className="btn-limpiar-dropdown" 
                      style={{marginTop: '12px', display: 'inline-flex'}}
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedEmpresa("");
                        setSelectedSede("");
                        setSelectedGarage("");
                      }}
                    >
                      Restablecer filtros
                    </button>
                  </>
                ) : (
                  <p>No hay usuarios registrados en esta categoría.</p>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL ARCHIVADOS (Se mantiene intacto) */}
      {showArchived && (
        <ModalPortal onClose={() => setShowArchived(false)}>
          <div
            className="modal-archivados-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-archivados-header">
              <div className="modal-archivados-title-group">
                <Archive size={24} />
                <h2>Usuarios Archivados</h2>
              </div>
              <button
                className="modal-archivados-close"
                onClick={() => setShowArchived(false)}
              >
                <X size={22} />
              </button>
            </div>

            <div className="modal-archivados-search">
              <div className="usuarios-search" style={{ width: "100%" }}>
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Buscar archivados..."
                  value={searchArchivedTerm}
                  onChange={(e) => setSearchArchivedTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-archivados-body">
              {totalArchivados === 0 ? (
                <div className="empty-archivados">
                  <Archive size={48} />
                  <p className="empty-text">No hay usuarios archivados</p>
                  <p className="empty-sub">
                    Los usuarios que archives aparecerán aquí.
                  </p>
                </div>
              ) : usuariosArchivados.length === 0 ? (
                <div className="usuarios-no-results" style={{ padding: "40px 20px" }}>
                  <p>No se encontraron archivados para "{searchArchivedTerm}"</p>
                </div>
              ) : (
                usuariosArchivados.map((u) => (
                  <article key={u.id} className="usuario-archivado-card">
                    <div className="usuario-archivado-top">
                      <div className="usuario-archivado-info">
                        <div className="usuario-avatar">{u.nombre.charAt(0).toUpperCase()}</div>
                        <div>
                          <h3>{u.nombre}</h3>
                          <span className={`usuario-role-badge ${ROLE_CLASSES[u.id_rol]}`}>
                            <ShieldCheck size={12} />
                            {u.role}
                          </span>
                        </div>
                      </div>
                      <span className="badge-archivado">Archivado</span>
                    </div>

                    <p className="usuario-email">{u.email}</p>

                    {u.empresa && (
                      <p className="usuario-meta">
                        <Building2 size={13} />
                        {u.empresa}
                      </p>
                    )}

                    <div className="usuario-archivado-actions">
                      {u.id_rol !== 4 && (
                        <>
                          <BotonGenerico
                            className="btn-restaurar"
                            onClick={() => handleRestaurar(u.id, u.nombre)}
                          >
                            <RotateCcw size={16} />
                            <span>Restaurar</span>
                          </BotonGenerico>
                          <BotonGenerico
                            className="btn-eliminar-archivado"
                            onClick={() => handleEliminar(u.id, u.nombre)}
                          >
                            <Trash2 size={16} />
                          </BotonGenerico>
                        </>
                      )}
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </ModalPortal>
      )}

      <FooterSuperadmin />
    </div>
  );
};

export default GestionUsuarios;
