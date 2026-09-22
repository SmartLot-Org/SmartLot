import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, CirclePlus, Building2, Pencil, Trash2, X, Check } from "lucide-react";
import { Autocomplete } from "@react-google-maps/api";
import Swal from "sweetalert2";
import { Z_INDEX } from "../helpers/zIndex";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import "./gestion_sedes.css";
import HeaderSuperadmin from "../componentesSuperadmin/header_superadmin";
import FooterSuperadmin from "../componentesSuperadmin/footer_superadmin";
import BotonGenerico from "../componentesAdmin/boton_generico";
import { SedesGetAll, SedesUpdate, SedesDelete } from "../servicies/API_Sede";
import { useGoogleMaps } from "../contexts/useGoogleMaps";
import { EmpresasGetAll } from "../servicies/API_Empresa";

gsap.registerPlugin(useGSAP);

const obtenerListado = (datos) => {
  if (Array.isArray(datos)) return datos;
  if (Array.isArray(datos?.datos)) return datos.datos;
  if (Array.isArray(datos?.data)) return datos.data;
  return [];
};

const SkeletonCard = () => (
  <div className="sede-card-skeleton">
    <div className="skeleton-line skeleton-sede-icon" />
    <div className="skeleton-sede-body">
      <span className="skeleton-line skeleton-sede-name" />
      <span className="skeleton-line skeleton-sede-empresa" />
      <span className="skeleton-line skeleton-sede-ubicacion" />
    </div>
  </div>
);

function GestionSedes() {
  const navigate = useNavigate();
  const [sedes, setSedes] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [empresaMap, setEmpresaMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editUbicacion, setEditUbicacion] = useState("");
  const [editLatitud, setEditLatitud] = useState(null);
  const [editLongitud, setEditLongitud] = useState(null);

  const { isLoaded, loadError } = useGoogleMaps();
  if (loadError) console.warn('gestion_sedes: Google Maps no cargó:', loadError);

  const autocompleteRef = useRef(null);

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current.getPlace();
    if (place?.geometry) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const direccion = place.formatted_address || "";
      setEditUbicacion(direccion);
      setEditLatitud(lat);
      setEditLongitud(lng);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const [sedesRes, empresasRes] = await Promise.all([SedesGetAll(), EmpresasGetAll()]);
      if (!mounted) return;

      if (sedesRes.respuesta) {
        setSedes(obtenerListado(sedesRes.datos));
      } else {
        setError("No se pudieron cargar las sedes.");
      }

      if (empresasRes.respuesta) {
        const list = obtenerListado(empresasRes.datos);
        setEmpresas(list);
        setEmpresaMap(Object.fromEntries(list.map((e) => [Number(e.id), e.nombre])));
      }

      setLoading(false);
    };
    load();
    return () => { mounted = false; };
  }, []);

  const sedesFiltradas = useMemo(() => {
    if (!filtroEmpresa) return sedes;
    return sedes.filter((s) => Number(s.id_empresa) === Number(filtroEmpresa));
  }, [sedes, filtroEmpresa]);

  const handleEdit = (sede) => {
    setEditingId(sede.id);
    setEditNombre(sede.nombre || "");
    setEditDescripcion(sede.descripcion || "");
    setEditUbicacion(sede.ubicacion || "");
    setEditLatitud(sede.latitud ?? null);
    setEditLongitud(sede.longitud ?? null);
  };

  const handleSaveEdit = async () => {
    if (!editNombre.trim()) {
      Swal.fire("Error", "El nombre es requerido.", "error");
      return;
    }
    const sede = sedes.find((s) => s.id === editingId);
    const res = await SedesUpdate(editingId, {
      id_empresa: sede?.id_empresa,
      nombre: editNombre.trim(),
      descripcion: editDescripcion.trim(),
      ubicacion: editUbicacion.trim(),
      latitud: editLatitud,
      longitud: editLongitud,
    });
    if (res.respuesta) {
      setSedes((prev) =>
        prev.map((s) =>
          s.id === editingId
            ? { ...s, nombre: editNombre.trim(), descripcion: editDescripcion.trim(), ubicacion: editUbicacion.trim(), latitud: editLatitud, longitud: editLongitud }
            : s
        )
      );
      setEditingId(null);
      Swal.fire({ title: "Actualizada", text: "Sede actualizada correctamente.", icon: "success", timer: 1200, showConfirmButton: false, zIndex: Z_INDEX.SWAL_DIALOG });
    } else {
      Swal.fire("Error", res.datos?.message || "No se pudo actualizar.", "error");
    }
  };

  const handleDelete = async (id, nombre) => {
    const result = await Swal.fire({
      title: "Eliminar sede?",
      text: `${nombre} será eliminada del sistema.`,
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
    const res = await SedesDelete(id);
    if (res.respuesta) {
      setSedes((prev) => prev.filter((s) => s.id !== id));
      Swal.fire("Eliminada", "Sede eliminada correctamente.", "success");
    } else {
      Swal.fire("Error", "No se pudo eliminar.", "error");
    }
  };

  const empresasDisponibles = useMemo(
    () => empresas.map((empresa) => Number(empresa.id)),
    [empresas]
  );

  useGSAP(() => {
    if (!loading && sedesFiltradas.length > 0) {
      gsap.fromTo(
        ".sede-card",
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.06, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [loading, sedesFiltradas]);

  return (
    <div className="gestion-sedes-page">
      <HeaderSuperadmin />
      <main className="gestion-sedes-main">
        <div className="gestion-sedes-top">
          <button className="boton-back" onClick={() => navigate("/superadmin_dashboard")}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <p>SUPERADMIN</p>
            <h1>Gestión de Sedes</h1>
          </div>
        </div>

        {loading ? (
          <div className="sedes-stats-skeleton">
            <div className="stats-card-skeleton"><span className="skeleton-line skeleton-stat-label" /><span className="skeleton-line skeleton-stat-valor" /></div>
          </div>
        ) : (
          <div className="sedes-stats">
            <div className="stats-card-sede">
              <div className="stats-header-sede">
                <h4>Total sedes</h4>
                <MapPin size={22} />
              </div>
              <h2>{sedes.length}</h2>
              <p>Registradas en la base de datos</p>
            </div>
          </div>
        )}

        <div className="sedes-toolbar">
          <BotonGenerico className="btn-nueva-sede" onClick={() => navigate("/superadmin/agregar_sede")}>
            <CirclePlus size={20} />
            <span>Nueva sede</span>
          </BotonGenerico>

          <div className="sedes-filter">
            <select value={filtroEmpresa} onChange={(e) => setFiltroEmpresa(e.target.value)}>
              <option value="">Todas las empresas</option>
              {empresasDisponibles.map((idEmp) => (
                <option key={idEmp} value={idEmp}>
                  {empresaMap[idEmp] || `Empresa ${idEmp}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="sedes-grid">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <p className="sedes-feedback-error">{error}</p>
        ) : sedesFiltradas.length === 0 ? (
          <p className="sedes-feedback">
            {filtroEmpresa ? "No hay sedes para la empresa seleccionada." : "No hay sedes registradas."}
          </p>
        ) : (
          <div className="sedes-grid">
            {sedesFiltradas.map((sede) => (
              <div key={sede.id} className="sede-card">
                {editingId === sede.id ? (
                  <>
                    <div className="sede-card-edit">
                      <input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} placeholder="Nombre" />
                      <textarea value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)} placeholder="Descripción" rows={2} />
                      {isLoaded ? (
                        <Autocomplete
                          onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }}
                          onPlaceChanged={handlePlaceChanged}
                        >
                          <input type="text" value={editUbicacion} onChange={(e) => setEditUbicacion(e.target.value)} placeholder="Ubicación" />
                        </Autocomplete>
                      ) : (
                        <input type="text" value={editUbicacion} onChange={(e) => setEditUbicacion(e.target.value)} placeholder="Ubicación" />
                      )}
                    </div>
                    <div className="sede-card-edit-actions">
                      <button className="edit-btn save" onClick={handleSaveEdit}><Check size={18} /></button>
                      <button className="edit-btn cancel" onClick={() => setEditingId(null)}><X size={18} /></button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="sede-card-header">
                      <div className="sede-card-icon">
                        <MapPin size={22} />
                      </div>
                      <div className="sede-card-info">
                        <h3>{sede.nombre}</h3>
                        <span className="sede-empresa-badge">
                          <Building2 size={12} />
                          {empresaMap[Number(sede.id_empresa)] || `Empresa ${sede.id_empresa}`}
                        </span>
                        <p className="sede-descripcion">{sede.descripcion || "Sin descripción"}</p>
                        {sede.ubicacion && <p className="sede-ubicacion">{sede.ubicacion}</p>}
                      </div>
                    </div>
                    <div className="sede-card-actions">
                      <button className="sede-action-btn edit" onClick={() => handleEdit(sede)} aria-label="Editar">
                        <Pencil size={16} />
                      </button>
                      <button className="sede-action-btn delete" onClick={() => handleDelete(sede.id, sede.nombre)} aria-label="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <FooterSuperadmin />
    </div>
  );
}

export default GestionSedes;
