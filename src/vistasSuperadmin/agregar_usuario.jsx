import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CircleCheck } from "lucide-react";

import "./agregar_usuario.css";
import HeaderSuperadmin from "../componentesSuperadmin/header_superadmin";
import BotonGenerico from "../componentesAdmin/boton_generico";
import { UsuariosCreate, UsuariosGetAll } from "../servicies/API_Usuario";
import { EmpresasGetAll } from "../servicies/API_Empresa";
import { SedesGetAll } from "../servicies/API_Sede";
import { GaragesGetAll } from "../servicies/API_Garage";
import useLiveValidation from "../hooks/useLiveValidation";
import FieldValidation from "../components/FieldValidation";
import { showToast } from "../helpers/toast";

const obtenerListado = (datos) => {
  if (Array.isArray(datos)) return datos;
  if (Array.isArray(datos?.usuarios)) return datos.usuarios;
  if (Array.isArray(datos?.datos)) return datos.datos;
  if (Array.isArray(datos?.data)) return datos.data;
  return [];
};

const normalizarEmail = (email) => email.trim().toLowerCase();

const obtenerMensajeError = (datos, fallback) => {
  if (typeof datos === "string") return datos;
  return datos?.message || datos?.mensaje || datos?.error || fallback;
};

const ROLE_OPTIONS = [
  { id: 1, label: "Admin" },
  { id: 4, label: "Superadmin" },
  { id: 5, label: "Dueño de garage" },
  { id: 2, label: "Empleado" },
  { id: 3, label: "Garagista" },
];

const ROLES_NEED_EMPRESA = [1, 2, 3];
const ROLES_NEED_SEDE = [1, 2, 3];
const ROLES_NEED_GARAGE = [3];

const AgregarUsuarioSkeleton = () => (
  <section className="agregar-usuario-form agregar-usuario-form-skeleton" aria-label="Cargando formulario">
    <div className="agregar-usuario-grid">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="input-skeleton-superadmin" key={index}>
          <span className="skeleton-line skeleton-form-label" />
          <span className="skeleton-line skeleton-form-control" />
        </div>
      ))}
    </div>
    <div className="agregar-usuario-actions">
      <span className="skeleton-line skeleton-form-button" />
      <span className="skeleton-line skeleton-form-button secondary" />
    </div>
  </section>
);

function AgregarUsuario() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    contraseña: "",
    id_rol: "",
    id_empresa: "",
    id_sede: "",
    id_garage: "",
  });

  const [empresas, setEmpresas] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [garages, setGarages] = useState([]);
  const [sedesFiltradas, setSedesFiltradas] = useState([]);
  const [garagesFiltrados, setGaragesFiltrados] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);

  const idRol = Number(formData.id_rol);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoadingCatalogos(true);
      try {
        const [empRes, sedRes, garRes] = await Promise.all([
          EmpresasGetAll(),
          SedesGetAll(),
          GaragesGetAll(),
        ]);
        if (!mounted) return;
        if (empRes.respuesta) setEmpresas(obtenerListado(empRes.datos));
        if (sedRes.respuesta) setSedes(obtenerListado(sedRes.datos));
        if (garRes.respuesta) setGarages(obtenerListado(garRes.datos));
      } finally {
        if (mounted) setLoadingCatalogos(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (formData.id_empresa) {
      setSedesFiltradas(
        sedes.filter((s) => Number(s.id_empresa) === Number(formData.id_empresa))
      );
      setFormData((prev) => ({ ...prev, id_sede: "", id_garage: "" }));
    } else {
      setSedesFiltradas([]);
      setFormData((prev) => ({ ...prev, id_sede: "", id_garage: "" }));
    }
  }, [formData.id_empresa]);

  useEffect(() => {
    if (formData.id_sede) {
      setGaragesFiltrados(
        garages.filter((g) => Number(g.id_sede) === Number(formData.id_sede))
      );
      setFormData((prev) => ({ ...prev, id_garage: "" }));
    } else {
      setGaragesFiltrados([]);
      setFormData((prev) => ({ ...prev, id_garage: "" }));
    }
  }, [formData.id_sede]);

  const handleChange = (field, value) => {
    handleChangeWithTouch(field, value, setFormData);
  };

  const getSchema = () => ({
    nombre: [
      { rule: (v) => v?.trim().length > 0, message: "Requerido" },
      { rule: (v) => v?.trim().length >= 2, message: "Mínimo 2 caracteres" },
      { rule: (v) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(v?.trim()), message: "Solo letras" },
    ],
    apellido: [
      { rule: (v) => v?.trim().length > 0, message: "Requerido" },
      { rule: (v) => v?.trim().length >= 2, message: "Mínimo 2 caracteres" },
      { rule: (v) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(v?.trim()), message: "Solo letras" },
    ],
    email: [
      { rule: (v) => v?.trim().length > 0, message: "Requerido" },
      { rule: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v?.trim()), message: "Email inválido" },
    ],
    contraseña: [
      { rule: (v) => v?.length > 0, message: "Requerido" },
      { rule: (v) => v?.length >= 8, message: "Mínimo 8 caracteres" },
      { rule: (v) => (v?.match(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/g) || []).length >= 2, message: "Mínimo 2 caracteres especiales" },
      { rule: (v) => (v?.match(/\d/g) || []).length >= 2, message: "Mínimo 2 números" },
      { rule: (v) => (v?.match(/[A-Z]/g) || []).length >= 2, message: "Mínimo 2 mayúsculas" },
    ],
    telefono: [
      { rule: (v) => !v || v.trim().length === 0 || /^[+]{0,1}[0-9\s-()]+$/.test(v.trim()), message: "Solo números, espacios, guiones, +, ()" },
      { rule: (v) => !v || v.trim().length === 0 || v.trim().replace(/\D/g, "").length >= 7, message: "Mínimo 7 dígitos" },
    ],
    id_rol: [
      { rule: (v) => v !== "", message: "Selecciona un rol" },
    ],
  });

  const { isValid, touched, handleChangeWithTouch } = useLiveValidation(formData, getSchema());

  const buildConditions = (fieldName) => {
    const schema = getSchema();
    if (!schema[fieldName]) return [];
    const value = formData[fieldName];
    return schema[fieldName].map((item) => {
      const ruleFn = item.rule;
      const message = item.message;
      return { label: message, met: ruleFn(value) };
    });
  };

  const handleGuardar = async () => {
    setError("");

    if (!isValid) {
      setError("Corrige los errores antes de guardar.");
      return;
    }

    if (ROLES_NEED_EMPRESA.includes(idRol) && !formData.id_empresa) {
      setError("Debes seleccionar una empresa para este rol.");
      return;
    }

    if (ROLES_NEED_GARAGE.includes(idRol) && !formData.id_garage) {
      setError("Debes seleccionar un garage para este rol.");
      return;
    }

    setLoading(true);

    const emailNormalizado = normalizarEmail(formData.email);
    const usuariosResponse = await UsuariosGetAll();

    if (!usuariosResponse.respuesta) {
      setLoading(false);
      setError("No se pudo validar el email antes de crear el usuario.");
      return;
    }

    const emailYaExiste = obtenerListado(usuariosResponse.datos).some((usuario) => {
      if (!usuario?.email) return false;
      return normalizarEmail(usuario.email) === emailNormalizado;
    });

    if (emailYaExiste) {
      setLoading(false);
      setError("Ya existe un usuario con ese email.");
      return;
    }

    const payload = {
      id_rol: idRol,
      nombre: formData.nombre.trim(),
      apellido: formData.apellido.trim(),
      email: emailNormalizado,
      telefono: formData.telefono.trim(),
      contraseña: formData.contraseña,
      id_empresa: ROLES_NEED_EMPRESA.includes(idRol) ? Number(formData.id_empresa) : '',
      id_sede: ROLES_NEED_SEDE.includes(idRol)
        ? formData.id_sede === "sede_general"
          ? null
          : Number(formData.id_sede) || ''
        : '',
      id_garage: ROLES_NEED_GARAGE.includes(idRol) ? Number(formData.id_garage) || '' : '',
    };

    const response = await UsuariosCreate(payload);

    if (response.respuesta) {
      showToast(`Usuario ${emailNormalizado} creado. Se enviara una notificacion al email.`, "success");
      navigate("/superadmin/gestion_usuarios", { replace: true });
    } else {
      setLoading(false);
      setError(obtenerMensajeError(response.datos, "Error al crear el usuario."));
    }
  };

  const needsEmpresa = ROLES_NEED_EMPRESA.includes(idRol);
  const needsSede = ROLES_NEED_SEDE.includes(idRol);
  const needsGarage = ROLES_NEED_GARAGE.includes(idRol);

  return (
    <div className="agregar-usuario-page">
      <HeaderSuperadmin />
      <main className="agregar-usuario-main">
        <div className="agregar-usuario-top">
          <button className="boton-back" onClick={() => navigate("/superadmin/gestion_usuarios")}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <p>SUPERADMIN</p>
            <h1>Agregar Usuario</h1>
          </div>
        </div>

        {loadingCatalogos ? (
          <AgregarUsuarioSkeleton />
        ) : (
        <section className="agregar-usuario-form">
          <div className="agregar-usuario-grid">
            <div className="input-group-superadmin">
              <label>Nombre</label>
              <input
                type="text"
                placeholder="Ej: Juan"
                value={formData.nombre}
                onChange={(e) => handleChange("nombre", e.target.value)}
                autoComplete="off"
                required
              />
              <FieldValidation conditions={buildConditions("nombre")} isTouched={touched.nombre} />
            </div>

            <div className="input-group-superadmin">
              <label>Apellido</label>
              <input
                type="text"
                placeholder="Ej: Pérez"
                value={formData.apellido}
                onChange={(e) => handleChange("apellido", e.target.value)}
                autoComplete="off"
                required
              />
              <FieldValidation conditions={buildConditions("apellido")} isTouched={touched.apellido} />
            </div>

            <div className="input-group-superadmin">
              <label>Email</label>
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                autoComplete="off"
                required
              />
              <FieldValidation conditions={buildConditions("email")} isTouched={touched.email} />
            </div>

            <div className="input-group-superadmin">
              <label>Teléfono</label>
              <input
                type="tel"
                placeholder="+54 11 1234-5678"
                value={formData.telefono}
                onChange={(e) => handleChange("telefono", e.target.value)}
                autoComplete="off"
                required
              />
              <FieldValidation conditions={buildConditions("telefono")} isTouched={touched.telefono} />
            </div>

            <div className="input-group-superadmin">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="8 caracteres, 2 especiales, 2 números y 2 mayúsculas"
                value={formData.contraseña}
                onChange={(e) => handleChange("contraseña", e.target.value)}
                autoComplete="new-password"
                required
              />
              <FieldValidation conditions={buildConditions("contraseña")} isTouched={touched.contraseña} />
            </div>

            <div className="input-group-superadmin">
              <label>Rol</label>
              <select
                value={formData.id_rol}
                onChange={(e) => handleChange("id_rol", e.target.value)}
                autoComplete="off"
                required
              >
                <option value="">Seleccionar rol...</option>
                {ROLE_OPTIONS.map((rol) => (
                  <option key={rol.id} value={rol.id}>
                    {rol.label}
                  </option>
                ))}
              </select>
            </div>

            {needsEmpresa && (
              <div className="input-group-superadmin">
                <label>Empresa</label>
                <select
                  value={formData.id_empresa}
                  onChange={(e) => handleChange("id_empresa", e.target.value)}
                  autoComplete="off"
                  required={needsEmpresa}
                >
                  <option value="">Seleccionar empresa...</option>
                  {empresas.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {needsSede && (
              <div className="input-group-superadmin">
                <label>Sede</label>
                <select
                  value={formData.id_sede}
                  onChange={(e) => handleChange("id_sede", e.target.value)}
                  disabled={!formData.id_empresa}
                  autoComplete="off"
                  required={needsSede}
                >
                  <option value="">
                    {formData.id_empresa ? "Seleccionar sede..." : "Primero elige una empresa"}
                  </option>
                  {idRol === 1 && (
                    <option value="sede_general">Admin general de la empresa</option>
                  )}
                  {sedesFiltradas.map((sede) => (
                    <option key={sede.id} value={sede.id}>
                      {sede.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {needsGarage && (
              <div className="input-group-superadmin">
                <label>Garage</label>
                <select
                  value={formData.id_garage}
                  onChange={(e) => handleChange("id_garage", e.target.value)}
                  disabled={!formData.id_sede}
                  autoComplete="off"
                  required={needsGarage}
                >
                  <option value="">
                    {formData.id_sede ? "Seleccionar garage..." : "Primero elige una sede"}
                  </option>
                  {garagesFiltrados.map((gar) => (
                    <option key={gar.id_garage || gar.id} value={gar.id_garage || gar.id}>
                      {gar.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error && <p className="form-error-superadmin">{error}</p>}

          <div className="agregar-usuario-actions">
            <BotonGenerico
              className="btn-guardar-grande"
              onClick={handleGuardar}
              disabled={loading}
            >
              <CircleCheck size={20} color="white" />
              <span>{loading ? "Guardando..." : "Guardar usuario"}</span>
            </BotonGenerico>

            <BotonGenerico
              style={{ backgroundColor: "grey" }}
              className="btn-cancelar-grande"
              onClick={() => navigate("/superadmin/gestion_usuarios", { replace: true })}
            >
              <span>Cancelar</span>
            </BotonGenerico>
          </div>
        </section>
        )}
      </main>
    </div>
  );
}

export default AgregarUsuario;
