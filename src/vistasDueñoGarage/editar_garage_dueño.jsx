import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';
import HeaderDueñoGarage from '../componentesDueñoGarage/header_dueño_garage';
import FooterDueñoGarage from '../componentesDueñoGarage/footer_dueño_garage';
import FormularioPreciosGarage from '../componentesCompartidos/FormularioPreciosGarage';
import { SkeletonFormularioGarage } from '../componentesDueñoGarage/skeleton_admin_garage';
import FormularioZona from '../componentesAdmin/formulario_zona';
import FormularioCapacidad from '../componentesAdmin/formulario_capacidad';
import useLiveValidation from '../hooks/useLiveValidation';
import '../vistasAdmin/agregar_zona.css';
import { GaragesGetById, GaragesUpdate } from '../servicies/API_Garage';
import { buildGaragePricesPayload } from '../helpers/prices';
import { normalizeDays } from '../helpers/tratos';
import { Z_INDEX } from '../helpers/zIndex';
import './duenio_garage.css';

const CAMPOS_DIRTY = ['nombre', 'ubicacion', 'hora_apertura', 'hora_cierre', 'estado', 'piso', 'latitud', 'longitud', 'capacidad_reservas', 'capacidad_para_no_reservas', 'precio_pickup', 'precio_auto', 'precio_moto', 'dias'];

const formHasDirtyChanges = (a, b) => {
  if (!a || !b) return false;
  return CAMPOS_DIRTY.some((key) => {
    const va = a[key];
    const vb = b[key];
    if (Array.isArray(va) || Array.isArray(vb)) {
      return [...(va || [])].sort().join(',') !== [...(vb || [])].sort().join(',');
    }
    if (typeof va === 'number' || typeof vb === 'number') return Number(va ?? 0) !== Number(vb ?? 0);
    if (typeof va === 'boolean' || typeof vb === 'boolean') return Boolean(va) !== Boolean(vb);
    return String(va ?? '') !== String(vb ?? '');
  });
};

export default function EditarGarageDueño() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [initialForm, setInitialForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [cargaError, setCargaError] = useState('');
  const [intentoCarga, setIntentoCarga] = useState(0);

  useEffect(() => {
    let active = true;
    const cargarGarage = async () => {
      const response = await GaragesGetById(id, { force: true });
      if (!active) return;
      if (!response.respuesta) {
        setForm(null);
        setInitialForm(null);
        setCargaError('No se pudo cargar el garage. Revisá tu permiso e intentá de nuevo.');
      } else {
        const nuevoForm = {
          nombre: response.datos.nombre ?? '', ubicacion: response.datos.ubicacion ?? '',
          piso: response.datos.piso ?? '',
          latitud: response.datos.latitud ?? null, longitud: response.datos.longitud ?? null,
          capacidad_reservas: response.datos.capacidad_reservas ?? Math.max(0, Number(response.datos.capacidad ?? 0) - Number(response.datos.capacidad_para_no_reservas ?? 0)),
          capacidad_para_no_reservas: response.datos.capacidad_para_no_reservas ?? Math.max(0, Number(response.datos.capacidad ?? 0) - Number(response.datos.capacidad_reservas ?? response.datos.capacidad ?? 0)),
          hora_apertura: response.datos.hora_apertura?.slice(0, 5) ?? '', hora_cierre: response.datos.hora_cierre?.slice(0, 5) ?? '',
          estado: response.datos.estado ?? true, capacidad: response.datos.capacidad ?? 0,
          precio_pickup: response.datos.precio_pickup ?? '', precio_auto: response.datos.precio_auto ?? '', precio_moto: response.datos.precio_moto ?? '',
          dias: normalizeDays(response.datos.dias),
        };
        setForm(nuevoForm);
        setInitialForm({ ...nuevoForm });
      }
      setLoading(false);
    };

    cargarGarage();
    return () => { active = false; };
  }, [id, intentoCarga]);

  const recargarGarage = () => {
    setCargaError('');
    setLoading(true);
    setIntentoCarga((n) => n + 1);
  };

  const getSchema = () => ({
    nombre: [
      { rule: (v) => v?.trim().length > 0, message: 'Requerido' },
      { rule: (v) => v?.trim().length >= 3, message: 'Mínimo 3 caracteres' },
    ],
    piso: [
      { rule: (v) => v !== '' && v !== null && v !== undefined, message: 'Requerido' },
      { rule: (v) => !Number.isNaN(Number(v)) && Number.isInteger(Number(v)), message: 'Ingresá un número entero' },
    ],
    ubicacion: [
      { rule: (v) => v?.trim().length > 0, message: 'Requerido' },
      { rule: (v) => v?.trim().length >= 5, message: 'Mínimo 5 caracteres' },
      () => ({ rule: () => form?.latitud !== null && form?.latitud !== undefined && form?.longitud !== null && form?.longitud !== undefined, message: 'Seleccioná una ubicación válida del mapa' }),
    ],
    hora_apertura: [
      { rule: (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v || '')), message: 'Ingresá el horario en formato HH:MM' },
    ],
    hora_cierre: [
      { rule: (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(v || '')), message: 'Ingresá el horario en formato HH:MM' },
      () => ({ rule: () => !form?.hora_apertura || !form?.hora_cierre || form.hora_apertura < form.hora_cierre, message: 'La apertura debe ser anterior al cierre' }),
    ],
    capacidad_reservas: [
      { rule: (v) => v !== '' && v !== null && v !== undefined, message: 'Requerido' },
      { rule: (v) => Number.isInteger(Number(v)) && Number(v) >= 0, message: 'Ingresá un número entero mayor o igual a 0' },
    ],
    capacidad_para_no_reservas: [
      { rule: (v) => v !== '' && v !== null && v !== undefined, message: 'Requerido' },
      { rule: (v) => Number.isInteger(Number(v)) && Number(v) >= 0, message: 'Ingresá un número entero mayor o igual a 0' },
    ],
    dias: [
      { rule: (v) => Array.isArray(v) && v.length > 0, message: 'Seleccioná al menos un día' },
    ],
  });

  const { isValid, touched, handleChangeWithTouch, touch, touchAll } = useLiveValidation(form || {}, getSchema());

  const fieldsValidation = Object.keys(getSchema()).reduce((acc, field) => {
    acc[field] = {
      isTouched: touched[field],
      conditions: getSchema()[field].map((item) => {
        const ruleConfig = typeof item === 'function' ? item(form?.[field]) : item;
        return { label: ruleConfig.message, met: ruleConfig.rule(form?.[field]) };
      }),
    };
    return acc;
  }, {});

  const change = (name, value) => {
    if (typeof name === 'object' && name !== null) {
      Object.keys(name).forEach((campo) => touch(campo));
      setForm((current) => ({ ...current, ...name }));
      return;
    }
    handleChangeWithTouch(name, value, setForm);
    if (name === 'ubicacion') {
      setForm((current) => ({ ...current, latitud: null, longitud: null }));
    }
  };
  const changeCoordenadas = ({ lat, lng }) => {
    touch('ubicacion');
    setForm((current) => ({ ...current, latitud: lat, longitud: lng }));
  };

  const isDirty = useMemo(() => formHasDirtyChanges(form, initialForm), [form, initialForm]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'Tenés cambios sin guardar en el garage. ¿Seguro que querés salir?';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const showSuccessToast = () => {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Garage guardado correctamente',
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      zIndex: Z_INDEX.SWAL_TOAST,
    });
  };

  const volverADashboard = async () => {
    if (isDirty) {
      const result = await Swal.fire({
        title: 'Cambios sin guardar',
        text: 'Modificaste el garage. Si salís ahora, perdés las modificaciones.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#475569',
        confirmButtonText: 'Salir sin guardar',
        cancelButtonText: 'Permanecer acá',
        reverseButtons: true,
        zIndex: Z_INDEX.SWAL_DIALOG,
      });
      if (!result.isConfirmed) return;
    }
    navigate('/duenio-garage/dashboard');
  };

  const save = async () => {
    setError('');

    if (!isValid) {
      touchAll();
      setError('Corregí los campos marcados antes de guardar.');
      return;
    }

    try {
      const capacidad_reservas = Number(form.capacidad_reservas);
      const capacidad_para_no_reservas = Number(form.capacidad_para_no_reservas);
      const capacidad = capacidad_reservas + capacidad_para_no_reservas;
      const payload = { piso: String(form.piso).trim(), latitud: Number(form.latitud), longitud: Number(form.longitud), capacidad_reservas, capacidad_para_no_reservas, nombre: form.nombre.trim(), ubicacion: form.ubicacion.trim(), hora_apertura: form.hora_apertura || null,
        hora_cierre: form.hora_cierre || null, estado: Boolean(form.estado), capacidad, dias: form.dias, ...buildGaragePricesPayload(form) };
      setSaving(true);
      const response = await GaragesUpdate(id, payload);
      if (!response.respuesta) throw new Error(response.datos?.message || 'No se pudo actualizar el garage. Intentá de nuevo en unos segundos.');
      const merged = { ...form, ...payload, ...response.datos, hora_apertura: (response.datos?.hora_apertura ?? form.hora_apertura).slice(0, 5), hora_cierre: (response.datos?.hora_cierre ?? form.hora_cierre).slice(0, 5), dias: normalizeDays(response.datos?.dias ?? form.dias) };
      setForm(merged);
      setInitialForm({ ...merged });
      showSuccessToast();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return <div className="duenio-garage-page"><HeaderDueñoGarage /><main className="duenio-garage-main"><div className="duenio-form-wrap">
    <button type="button" className="duenio-back-button" onClick={volverADashboard} aria-label="Volver al panel del dueño"><ArrowLeft size={20} aria-hidden="true" focusable="false" /></button>
    <section className="duenio-section-head left"><h1>Editar garage</h1><p>Las ocupaciones se administran desde los flujos operativos y no pueden editarse aquí.</p></section>
    {loading && <SkeletonFormularioGarage />}
    {!loading && cargaError && (
      <div className="duenio-load-error" role="alert">
        <p>{cargaError}</p>
        <button type="button" onClick={recargarGarage}>Reintentar</button>
      </div>
    )}
    {error && <p className="duenio-feedback error" role="alert">{error}</p>}
    {form && <fieldset className="form-garage duenio-form-fieldset" disabled={saving}>
      <FormularioZona formData={form} onChange={change} hideSede fieldsValidation={fieldsValidation} onCoordenadasChange={changeCoordenadas} />
      <FormularioCapacidad formData={form} onChange={change} />
      <FormularioPreciosGarage values={form} onChange={change} disabled={saving} />
    </fieldset>}
    {form && <div className="duenio-form-actions"><button onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button><button className="secondary" onClick={volverADashboard} disabled={saving}>Cancelar</button></div>}
  </div></main><FooterDueñoGarage /></div>;
}
