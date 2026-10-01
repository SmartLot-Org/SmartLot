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

  useEffect(() => {
    let active = true;
    GaragesGetById(id, { force: true }).then((response) => {
      if (!active) return;
      if (!response.respuesta) {
        setError(response.datos?.message || 'No se pudo cargar el garage. Puede que no tengas permiso.');
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
    });
    return () => { active = false; };
  }, [id]);

  const change = (name, value) => setForm((current) => {
    if (typeof name === 'object' && name !== null) return { ...current, ...name };
    return { ...current, [name]: value, ...(name === 'ubicacion' ? { latitud: null, longitud: null } : {}) };
  });
  const changeCoordenadas = ({ lat, lng }) => setForm((current) => ({ ...current, latitud: lat, longitud: lng }));

  const isDirty = useMemo(() => formHasDirtyChanges(form, initialForm), [form, initialForm]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'Tienes cambios sin guardar en el garage. ¿Seguro que deseas salir?';
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
        text: 'Has modificado el garage. Si sales ahora, perderás las modificaciones.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#64748B',
        confirmButtonText: 'Salir sin guardar',
        cancelButtonText: 'Permanecer aquí',
        reverseButtons: true,
        zIndex: Z_INDEX.SWAL_DIALOG,
      });
      if (!result.isConfirmed) return;
    }
    navigate('/duenio-garage/dashboard');
  };

  const save = async () => {
    setError('');
    try {
      if (form.nombre.trim().length < 3) throw new Error('El nombre debe tener al menos 3 caracteres.');
      if (form.piso === '' || !Number.isInteger(Number(form.piso))) throw new Error('El nivel / planta debe ser un número entero.');
      if (form.ubicacion.trim().length < 5 || form.latitud === null || form.longitud === null) throw new Error('Seleccioná una ubicación válida de las sugerencias.');
      const horarioValido = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (!horarioValido.test(form.hora_apertura) || !horarioValido.test(form.hora_cierre) || form.hora_apertura >= form.hora_cierre) throw new Error('Ingresá horarios válidos: la apertura debe ser anterior al cierre.');
      const capacidad_reservas = Number(form.capacidad_reservas);
      const capacidad_para_no_reservas = Number(form.capacidad_para_no_reservas);
      if (![capacidad_reservas, capacidad_para_no_reservas].every((value) => Number.isInteger(value) && value >= 0)) throw new Error('Las capacidades deben ser enteros mayores o iguales a 0.');
      const capacidad = capacidad_reservas + capacidad_para_no_reservas;
      if (!Number.isInteger(capacidad) || capacidad < 0) throw new Error('La capacidad debe ser un entero mayor o igual a 0.');
      if (!form.dias.length) throw new Error('Seleccioná al menos un día de disponibilidad.');
      const payload = { piso: String(form.piso).trim(), latitud: Number(form.latitud), longitud: Number(form.longitud), capacidad_reservas, capacidad_para_no_reservas, nombre: form.nombre.trim(), ubicacion: form.ubicacion.trim(), hora_apertura: form.hora_apertura || null,
        hora_cierre: form.hora_cierre || null, estado: Boolean(form.estado), capacidad, dias: form.dias, ...buildGaragePricesPayload(form) };
      setSaving(true);
      const response = await GaragesUpdate(id, payload);
      if (!response.respuesta) throw new Error(response.datos?.message || 'No se pudo actualizar el garage.');
      const merged = { ...form, ...payload, ...response.datos, hora_apertura: (response.datos?.hora_apertura ?? form.hora_apertura).slice(0, 5), hora_cierre: (response.datos?.hora_cierre ?? form.hora_cierre).slice(0, 5), dias: normalizeDays(response.datos?.dias ?? form.dias) };
      setForm(merged);
      setInitialForm({ ...merged });
      showSuccessToast();
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return <div className="duenio-garage-page"><HeaderDueñoGarage /><main className="duenio-garage-main"><div className="duenio-form-wrap">
    <button type="button" className="duenio-back-button" onClick={volverADashboard} aria-label="Volver al panel del dueño"><ArrowLeft size={20} /></button>
    <section className="duenio-section-head left"><span>Garage propio</span><h1>Editar garage</h1><p>Las ocupaciones se administran desde los flujos operativos y no pueden editarse aquí.</p></section>
    {loading && <SkeletonFormularioGarage />}{error && <p className="duenio-feedback error">{error}</p>}
    {form && <fieldset className="form-garage" disabled={saving} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
      <FormularioZona formData={form} onChange={change} hideSede onCoordenadasChange={changeCoordenadas} />
      <FormularioCapacidad formData={form} onChange={change} />
      <FormularioPreciosGarage values={form} onChange={change} disabled={saving} />
    </fieldset>}
    {form && <div className="duenio-form-actions"><button onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button><button className="secondary" onClick={volverADashboard} disabled={saving}>Cancelar</button></div>}
  </div></main><FooterDueñoGarage /></div>;
}
