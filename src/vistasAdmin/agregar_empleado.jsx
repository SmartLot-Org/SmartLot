import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import FormularioInfoPersonal from "../componentesAdmin/formulario_infoPersonal";
import Header from "../componentesAdmin/header_admin";
import "./agregar_empleado.css"
import BotonGenerico from "../componentesAdmin/boton_generico";
import { UsuariosCreate } from "../servicies/API_Usuario";
import { VehiculosCreate } from "../servicies/API_Vehiculo";
import { ModelosGetAll } from "../servicies/API_Modelo";
import { SedesGetAll } from "../servicies/API_Sede";
import useLiveValidation from "../hooks/useLiveValidation";
import ReservationLimitFields from "../componentesAdmin/ReservationLimitFields";
import { parseReservationLimit } from "../helpers/reservationPolicy";

const obtenerListado = (datos) => {
  if (Array.isArray(datos)) return datos;
  if (Array.isArray(datos?.datos)) return datos.datos;
  if (Array.isArray(datos?.data)) return datos.data;
  if (Array.isArray(datos?.value)) return datos.value;
  return [];
};

function AgregarEmpleado() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    contraseña: '',
    id_sede: usuario?.id_sede ?? '',
    id_empresa: usuario?.id_empresa ?? '',
    patente: '',
    id_modelo: null
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [limited, setLimited] = useState(false);
  const [limitValue, setLimitValue] = useState('');
  const [limitError, setLimitError] = useState('');
  const limitInputRef = useRef(null);
  const [, setModelos] = useState([]);
  const [sedes, setSedes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const [modelosRes, sedesRes] = await Promise.all([
        ModelosGetAll(),
        SedesGetAll(),
      ]);
      if (modelosRes.respuesta) {
        setModelos(obtenerListado(modelosRes.datos));
      }
      if (sedesRes.respuesta) {
        const todas = obtenerListado(sedesRes.datos);
        const empresaAdmin = Number(usuario?.id_empresa);
        const sedeAdmin = todas.filter((s) => {
          if (!usuario?.id_sede) {
            return !isNaN(empresaAdmin) && empresaAdmin > 0 && Number(s.id_empresa) === empresaAdmin;
          }
          return Number(s.id) === Number(usuario?.id_sede) &&
            Number(s.id_empresa) === empresaAdmin;
        });
        setSedes(sedeAdmin);
        if (usuario?.id_sede) {
          setFormData((prev) => ({
            ...prev,
            id_sede: Number(usuario.id_sede),
            id_empresa: empresaAdmin,
          }));
        } else if (!isNaN(empresaAdmin) && empresaAdmin > 0) {
          setFormData((prev) => ({
            ...prev,
            id_empresa: empresaAdmin,
          }));
        }
      }
    };
    fetchData();
  }, [usuario]);

  const getSchema = () => ({
    nombre: [
      { rule: (v) => v?.trim().length > 0, message: 'Requerido' },
      { rule: (v) => v?.trim().length >= 2, message: 'Mínimo 2 caracteres' },
      { rule: (v) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(v), message: 'Solo letras' },
    ],
    apellido: [
      { rule: (v) => v?.trim().length > 0, message: 'Requerido' },
      { rule: (v) => v?.trim().length >= 2, message: 'Mínimo 2 caracteres' },
      { rule: (v) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(v), message: 'Solo letras' },
    ],
    email: [
      { rule: (v) => v?.trim().length > 0, message: 'Requerido' },
      { rule: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), message: 'Email inválido' },
    ],
    contraseña: [
      { rule: (v) => v?.trim().length > 0, message: 'Requerido' },
      { rule: (v) => v?.length >= 8, message: 'Mínimo 8 caracteres' },
      { rule: (v) => (v?.match(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/g) || []).length >= 2, message: 'Mínimo 2 caracteres especiales' },
      { rule: (v) => (v?.match(/\d/g) || []).length >= 2, message: 'Mínimo 2 números' },
      { rule: (v) => (v?.match(/[A-Z]/g) || []).length >= 2, message: 'Mínimo 2 mayúsculas' },
    ],
    telefono: [
      { rule: (v) => !v || v.trim().length === 0 || /^[+]{0,1}[0-9\s-()]+$/.test(v.trim()), message: 'Solo números, espacios, guiones, +, ()' },
      { rule: (v) => !v || v.trim().length === 0 || v.trim().replace(/\D/g, '').length >= 7, message: 'Mínimo 7 dígitos' },
    ],
    patente: [
      { rule: (v) => !v || v.trim().length === 0 || /^[a-zA-Z0-9]{6,8}$/.test(v.trim()), message: '6-8 caracteres alfanuméricos' },
    ],
    id_modelo: [
      { rule: (v) => v === null || v === undefined || v === '' || !isNaN(Number(v)), message: 'Selecciona un modelo' },
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

  const fieldsValidation = {};
  Object.keys(getSchema()).forEach((field) => {
    fieldsValidation[field] = {
      conditions: buildConditions(field),
      isTouched: touched[field],
    };
  });

  const handleChangeWithTouchWrapper = (field, value) => {
    handleChangeWithTouch(field, value, setFormData);
  };

  const handleGuardarEmpleado = async (event) => {
    event.preventDefault();
    if (loading) return;
    setError('');
    setLimitError('');
    let limiteReservasActivas;
    try { limiteReservasActivas = parseReservationLimit(limited, limitValue); }
    catch (error) {
      setLimitError(error.message);
      limitInputRef.current?.focus();
      return;
    }

    if (!isValid) {
      setError('Revisá los datos personales antes de guardar.');
      return;
    }

    const patenteIngresada = formData.patente && formData.patente.trim();
    const modeloSeleccionado = formData.id_modelo;

    if ((patenteIngresada && !modeloSeleccionado) || (!patenteIngresada && modeloSeleccionado)) {
      setError('Completá la patente y seleccioná un modelo para guardar el vehículo.');
      return;
    }

    if (!formData.id_empresa) {
      setError('No pudimos identificar tu empresa. Volvé a iniciar sesión e intentá de nuevo.');
      return;
    }

    setLoading(true);

    const payload = {
      limiteReservasActivas,
      id_rol: 2,
      nombre: formData.nombre.trim(),
      apellido: formData.apellido.trim(),
      id_sede: Number(formData.id_sede) || null,
      email: formData.email.trim(),
      telefono: formData.telefono.trim(),
      contraseña: formData.contraseña,
      id_empresa: Number(formData.id_empresa) || null
    };

    const response = await UsuariosCreate(payload);

    if (!response.respuesta) {
      setLoading(false);
      const serverMsg = response.datos?.message || response.datos || 'Error al crear el usuario.';
      setError(typeof serverMsg === 'string' ? serverMsg : 'No se pudo crear el empleado.');
      return;
    }

    if (response.respuesta) {
      if (patenteIngresada && modeloSeleccionado) {
        try {
          const createdUser = response.datos;
          const idUsuario = createdUser?.id || createdUser?.insertId || (Array.isArray(createdUser) ? createdUser[0]?.id : null);

          if (idUsuario) {
            const vehRes = await VehiculosCreate({
              id_usuario: Number(idUsuario),
              id_modelo: Number(modeloSeleccionado),
              patente: patenteIngresada.toUpperCase()
            });

            if (!vehRes.respuesta) {
              setLoading(false);
              const msg = vehRes.datos?.message || vehRes.datos || 'Error al crear el vehículo.';
              setError(typeof msg === 'string' ? msg : 'No se pudo guardar el vehículo.');
              return;
            }
          }
        } catch (vehErr) {
          console.error("Error al guardar el vehículo del empleado:", vehErr);
          setLoading(false);
          setError('Se creó el empleado, pero no se pudo guardar su vehículo.');
          return;
        }
      }
      setLoading(false);
      navigate('/gestion_de_empleados', { replace: true });
    } else {
      setLoading(false);
      setError('No se pudo guardar el empleado. Revisá los datos e intentá de nuevo.');
    }
  };

  return (
    <div className="agregar-empleado-page">
      <Header />
      <main className="agregar-empleado-contenido">
        <h1>Agregar empleado</h1>
        <form noValidate onSubmit={handleGuardarEmpleado}>
          <FormularioInfoPersonal
            infoPersonalTitulo="Información Personal"
            labels={{
              nombre: 'Nombre',
              apellido: 'Apellido',
              email: 'Correo electrónico',
              telefono: 'Número de teléfono',
              contraseña: 'Contraseña',
              sede: 'Sede',
            }}
            formData={formData}
            onChange={handleChangeWithTouchWrapper}
            sedes={sedes}
            isSedeDisabled={!!usuario?.id_sede}
            fieldsValidation={fieldsValidation}
          >
            <div className="agregar-empleado-limite">
              <ReservationLimitFields
                limited={limited}
                value={limitValue}
                onLimitedChange={(enabled) => { setLimited(enabled); setLimitError(''); }}
                onValueChange={(value) => { setLimitValue(value); setLimitError(''); }}
                error={limitError}
                inputRef={limitInputRef}
                disabled={loading}
              />
            </div>
            {error && <p className="reservation-limit-error" role="alert">{error}</p>}
            <div className="reservation-limit-actions">
              <BotonGenerico
                className="reservation-limit-button reservation-limit-button-secondary"
                onClick={() => navigate('/gestion_de_empleados', { replace: true })}
              >
                Cancelar
              </BotonGenerico>
              <BotonGenerico type="submit" className="reservation-limit-button" disabled={loading}>
                {loading ? 'Guardando…' : 'Guardar empleado'}
              </BotonGenerico>
            </div>
          </FormularioInfoPersonal>
        </form>
      </main>
    </div>
  );
}

export default AgregarEmpleado;
