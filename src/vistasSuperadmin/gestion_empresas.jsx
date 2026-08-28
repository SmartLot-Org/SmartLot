import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Building2, Check, ChevronDown, CirclePlus, MapPin, Pencil, Trash2, X } from "lucide-react";
import Swal from "sweetalert2";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import "./gestion_empresas.css";
import HeaderSuperadmin from "../componentesSuperadmin/header_superadmin";
import FooterSuperadmin from "../componentesSuperadmin/footer_superadmin";
import BotonGenerico from "../componentesAdmin/boton_generico";
import AuditoriaPanel from "../componentesCompartidos/AuditoriaPanel";
import { Z_INDEX } from "../helpers/zIndex";
import { EmpresasDelete, EmpresasGetAll, EmpresasGetAuditoria, EmpresasUpdate } from "../servicies/API_Empresa";
import { SedesDelete, SedesGetAll, SedesUpdate } from "../servicies/API_Sede";

gsap.registerPlugin(useGSAP);

const obtenerListado = (datos) => Array.isArray(datos) ? datos : Array.isArray(datos?.datos) ? datos.datos : Array.isArray(datos?.data) ? datos.data : [];
const obtenerActor = (item, tipo) => item?.[`${tipo}ByNombre`]?.trim?.() || item?.[`${tipo}ByEmail`] || "Usuario no disponible";
const crearAuditoria = (items) => items.flatMap((item) => {
  const eventos = [];
  if (item.UpdateAt) eventos.push({ id: `${item.id}-update-${item.UpdateAt}`, accion: "Editada", clase: "update", entidad: item.nombre || `Empresa ${item.id}`, actor: obtenerActor(item, "Update"), fecha: item.UpdateAt });
  if (item.DeleteAt || item.Borrado === true) eventos.push({ id: `${item.id}-delete-${item.DeleteAt || "deleted"}`, accion: "Borrada", clase: "delete", entidad: item.nombre || `Empresa ${item.id}`, actor: obtenerActor(item, "Delete"), fecha: item.DeleteAt });
  return eventos;
}).sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

const SkeletonCard = () => <div className="empresa-card-skeleton"><div className="skeleton-line skeleton-empresa-icon" /><div className="skeleton-empresa-body"><span className="skeleton-line skeleton-empresa-name" /><span className="skeleton-line skeleton-empresa-desc" /></div></div>;

function GestionEmpresas() {
  const navigate = useNavigate();
  const location = useLocation();
  const [empresas, setEmpresas] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [auditoria, setAuditoria] = useState([]);
  const [loadingAuditoria, setLoadingAuditoria] = useState(true);
  const [empresaAbierta, setEmpresaAbierta] = useState(() => Number(location.state?.empresaId) || null);
  const [editingEmpresaId, setEditingEmpresaId] = useState(null);
  const [editEmpresa, setEditEmpresa] = useState({ nombre: "", descripcion: "" });
  const [editingSedeId, setEditingSedeId] = useState(null);
  const [editSede, setEditSede] = useState({ nombre: "", descripcion: "", ubicacion: "" });

  useEffect(() => {
    let mounted = true;
    Promise.all([EmpresasGetAll(), SedesGetAll(), EmpresasGetAuditoria()]).then(([empresasRes, sedesRes, auditRes]) => {
      if (!mounted) return;
      if (empresasRes.respuesta) setEmpresas(obtenerListado(empresasRes.datos)); else setError("No se pudieron cargar las empresas.");
      if (sedesRes.respuesta) setSedes(obtenerListado(sedesRes.datos));
      if (auditRes.respuesta) setAuditoria(crearAuditoria(obtenerListado(auditRes.datos)));
      setLoading(false);
      setLoadingAuditoria(false);
    });
    return () => { mounted = false; };
  }, []);

  const sedesPorEmpresa = useMemo(() => {
    const mapa = new Map();
    sedes.forEach((sede) => {
      const id = Number(sede.id_empresa);
      mapa.set(id, [...(mapa.get(id) || []), sede]);
    });
    return mapa;
  }, [sedes]);

  useGSAP(() => {
    if (!loading && empresas.length) gsap.fromTo(".empresa-panel", { y: 14, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, duration: 0.35, ease: "power2.out" });
  }, [loading, empresas.length]);

  const recargarAuditoria = async () => {
    setLoadingAuditoria(true);
    const res = await EmpresasGetAuditoria();
    if (res.respuesta) setAuditoria(crearAuditoria(obtenerListado(res.datos)));
    setLoadingAuditoria(false);
  };

  const guardarEmpresa = async () => {
    if (!editEmpresa.nombre.trim()) return Swal.fire("Error", "El nombre es requerido.", "error");
    const res = await EmpresasUpdate(editingEmpresaId, { nombre: editEmpresa.nombre.trim(), descripcion: editEmpresa.descripcion.trim() });
    if (!res.respuesta) return Swal.fire("Error", res.datos?.message || "No se pudo actualizar.", "error");
    setEmpresas((prev) => prev.map((e) => e.id === editingEmpresaId ? { ...e, ...res.datos, nombre: editEmpresa.nombre.trim(), descripcion: editEmpresa.descripcion.trim() } : e));
    setEditingEmpresaId(null);
    await recargarAuditoria();
    Swal.fire({ title: "Actualizada", text: "Empresa actualizada correctamente.", icon: "success", timer: 1200, showConfirmButton: false, zIndex: Z_INDEX.SWAL_DIALOG });
  };

  const eliminarEmpresa = async (empresa) => {
    const result = await Swal.fire({ title: "¿Eliminar empresa?", text: `${empresa.nombre} será eliminada del sistema.`, icon: "warning", showCancelButton: true, confirmButtonColor: "#EF4444", confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar", reverseButtons: true, zIndex: Z_INDEX.SWAL_DIALOG });
    if (!result.isConfirmed) return;
    const res = await EmpresasDelete(empresa.id);
    if (!res.respuesta) return Swal.fire("Error", "No se pudo eliminar.", "error");
    setEmpresas((prev) => prev.filter((e) => e.id !== empresa.id));
    await recargarAuditoria();
  };

  const guardarSede = async () => {
    if (!editSede.nombre.trim()) return Swal.fire("Error", "El nombre es requerido.", "error");
    const sede = sedes.find((item) => item.id === editingSedeId);
    const payload = { ...sede, ...editSede, nombre: editSede.nombre.trim(), descripcion: editSede.descripcion.trim(), ubicacion: editSede.ubicacion.trim() };
    const res = await SedesUpdate(editingSedeId, payload);
    if (!res.respuesta) return Swal.fire("Error", res.datos?.message || "No se pudo actualizar.", "error");
    setSedes((prev) => prev.map((item) => item.id === editingSedeId ? payload : item));
    setEditingSedeId(null);
    Swal.fire({ title: "Actualizada", text: "Sede actualizada correctamente.", icon: "success", timer: 1200, showConfirmButton: false });
  };

  const eliminarSede = async (sede) => {
    const result = await Swal.fire({ title: "¿Eliminar sede?", text: `${sede.nombre} será eliminada del sistema.`, icon: "warning", showCancelButton: true, confirmButtonColor: "#EF4444", confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar", reverseButtons: true, zIndex: Z_INDEX.SWAL_DIALOG });
    if (!result.isConfirmed) return;
    const res = await SedesDelete(sede.id);
    if (!res.respuesta) return Swal.fire("Error", "No se pudo eliminar.", "error");
    setSedes((prev) => prev.filter((item) => item.id !== sede.id));
  };

  return <div className="gestion-empresas-page"><HeaderSuperadmin /><main className="gestion-empresas-main">
    <div className="gestion-empresas-top"><button className="boton-back" onClick={() => navigate("/superadmin_dashboard")} aria-label="Volver"><ArrowLeft size={20} /></button><div><p>SUPERADMIN</p><h1>Empresas y sedes</h1><span className="gestion-subtitulo">Seleccioná una empresa para administrar sus sedes</span></div></div>
    <section className="empresas-resumen" aria-label="Resumen"><div className="stats-card-empresa"><div className="stats-header-empresa"><h4>Empresas</h4><Building2 size={22} /></div><h2>{loading ? "—" : empresas.length}</h2><p>Registradas</p></div><div className="stats-card-empresa stats-card-sedes"><div className="stats-header-empresa"><h4>Sedes</h4><MapPin size={22} /></div><h2>{loading ? "—" : sedes.length}</h2><p>En todas las empresas</p></div></section>
    <div className="empresas-actions"><BotonGenerico className="btn-nueva-empresa" onClick={() => navigate("/superadmin/agregar_empresa")}><CirclePlus size={20} /><span>Nueva empresa</span></BotonGenerico></div>
    <AuditoriaPanel titulo="Auditoría de empresas" descripcion="Últimas ediciones y borrados registrados." eventos={auditoria} loading={loadingAuditoria} maxItems={8} />
    {loading ? <div className="empresas-grid">{Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}</div> : error ? <p className="empresas-feedback-error">{error}</p> : <div className="empresas-lista">{empresas.map((empresa) => {
      const abierta = Number(empresaAbierta) === Number(empresa.id);
      const sedesEmpresa = sedesPorEmpresa.get(Number(empresa.id)) || [];
      return <article className={`empresa-panel${abierta ? " abierta" : ""}`} key={empresa.id}><div className="empresa-card">
        {editingEmpresaId === empresa.id ? <><div className="empresa-card-edit"><input value={editEmpresa.nombre} onChange={(e) => setEditEmpresa((p) => ({ ...p, nombre: e.target.value }))} placeholder="Nombre" /><textarea value={editEmpresa.descripcion} onChange={(e) => setEditEmpresa((p) => ({ ...p, descripcion: e.target.value }))} placeholder="Descripción" rows={2} /></div><div className="empresa-card-edit-actions"><button className="edit-btn save" onClick={guardarEmpresa}><Check size={18} /></button><button className="edit-btn cancel" onClick={() => setEditingEmpresaId(null)}><X size={18} /></button></div></> : <><button className="empresa-selector" onClick={() => setEmpresaAbierta(abierta ? null : empresa.id)} aria-expanded={abierta}><span className="empresa-card-icon"><Building2 size={22} /></span><span className="empresa-card-info"><strong>{empresa.nombre}</strong><small>{empresa.descripcion || "Sin descripción"}</small><span className="empresa-sedes-count"><MapPin size={13} /> {sedesEmpresa.length} {sedesEmpresa.length === 1 ? "sede" : "sedes"}</span></span><ChevronDown className="empresa-chevron" size={20} /></button><div className="empresa-card-actions"><button className="empresa-action-btn edit" onClick={() => { setEditingEmpresaId(empresa.id); setEditEmpresa({ nombre: empresa.nombre || "", descripcion: empresa.descripcion || "" }); }} aria-label="Editar empresa"><Pencil size={16} /></button><button className="empresa-action-btn delete" onClick={() => eliminarEmpresa(empresa)} aria-label="Eliminar empresa"><Trash2 size={16} /></button></div></>}
      </div>{abierta ? <div className="sedes-desplegable"><div className="sedes-desplegable-header"><div><span>SEDES DE LA EMPRESA</span><h3>{empresa.nombre}</h3></div><BotonGenerico className="btn-nueva-sede-inline" onClick={() => navigate("/superadmin/agregar_sede", { state: { empresaId: empresa.id } })}><CirclePlus size={18} /><span>Nueva sede</span></BotonGenerico></div>
        {sedesEmpresa.length === 0 ? <div className="sedes-vacio"><MapPin size={28} /><p>Esta empresa todavía no tiene sedes.</p></div> : <div className="sedes-inline-grid">{sedesEmpresa.map((sede) => <div className="sede-inline-card" key={sede.id}>{editingSedeId === sede.id ? <><div className="sede-inline-edit"><input value={editSede.nombre} onChange={(e) => setEditSede((p) => ({ ...p, nombre: e.target.value }))} placeholder="Nombre" /><textarea value={editSede.descripcion} onChange={(e) => setEditSede((p) => ({ ...p, descripcion: e.target.value }))} placeholder="Descripción" rows={2} /><input value={editSede.ubicacion} onChange={(e) => setEditSede((p) => ({ ...p, ubicacion: e.target.value }))} placeholder="Ubicación" /></div><div className="sede-inline-actions"><button className="edit-btn save" onClick={guardarSede}><Check size={18} /></button><button className="edit-btn cancel" onClick={() => setEditingSedeId(null)}><X size={18} /></button></div></> : <><span className="sede-inline-icon"><MapPin size={19} /></span><div className="sede-inline-info"><h4>{sede.nombre}</h4><p>{sede.descripcion || "Sin descripción"}</p>{sede.ubicacion ? <small>{sede.ubicacion}</small> : null}</div><div className="sede-inline-actions"><button className="empresa-action-btn edit" onClick={() => { setEditingSedeId(sede.id); setEditSede({ nombre: sede.nombre || "", descripcion: sede.descripcion || "", ubicacion: sede.ubicacion || "" }); }} aria-label="Editar sede"><Pencil size={15} /></button><button className="empresa-action-btn delete" onClick={() => eliminarSede(sede)} aria-label="Eliminar sede"><Trash2 size={15} /></button></div></>}</div>)}</div>}
      </div> : null}</article>;
    })}</div>}
  </main><FooterSuperadmin /></div>;
}

export default GestionEmpresas;
