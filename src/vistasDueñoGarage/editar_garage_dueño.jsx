import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HeaderDueñoGarage from '../componentesDueñoGarage/header_dueño_garage';
import FooterDueñoGarage from '../componentesDueñoGarage/footer_dueño_garage';
import FormularioPreciosGarage from '../componentesCompartidos/FormularioPreciosGarage';
import { GaragesGetById, GaragesUpdate } from '../servicies/API_Garage';
import { buildGaragePricesPayload } from '../helpers/prices';
import './duenio_garage.css';

export default function EditarGarageDueño() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    GaragesGetById(id, { force: true }).then((response) => {
      if (!active) return;
      if (!response.respuesta) setError(response.datos?.message || 'No se pudo cargar el garage. Puede que no tengas permiso.');
      else setForm({
        nombre: response.datos.nombre ?? '', ubicacion: response.datos.ubicacion ?? '',
        hora_apertura: response.datos.hora_apertura ?? '', hora_cierre: response.datos.hora_cierre ?? '',
        estado: response.datos.estado ?? true, capacidad: response.datos.capacidad ?? 0,
        precio_pickup: response.datos.precio_pickup ?? '', precio_auto: response.datos.precio_auto ?? '', precio_moto: response.datos.precio_moto ?? '',
      });
      setLoading(false);
    });
    return () => { active = false; };
  }, [id]);

  const change = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const save = async () => {
    setError(''); setSuccess('');
    try {
      const capacidad = Number(form.capacidad);
      if (!Number.isInteger(capacidad) || capacidad < 0) throw new Error('La capacidad debe ser un entero mayor o igual a 0.');
      const payload = { nombre: form.nombre.trim(), ubicacion: form.ubicacion.trim(), hora_apertura: form.hora_apertura || null,
        hora_cierre: form.hora_cierre || null, estado: Boolean(form.estado), capacidad, ...buildGaragePricesPayload(form) };
      setSaving(true);
      const response = await GaragesUpdate(id, payload);
      if (!response.respuesta) throw new Error(response.datos?.message || 'No se pudo actualizar el garage.');
      setSuccess('Garage actualizado correctamente.');
      setForm((current) => ({ ...current, ...response.datos }));
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return <div className="duenio-garage-page"><HeaderDueñoGarage /><main className="duenio-garage-shell duenio-form-shell">
    <button className="duenio-back-button" onClick={() => navigate('/duenio-garage/dashboard')}>Volver</button>
    <section className="duenio-section-head left"><span>Garage propio</span><h1>Editar garage</h1><p>Las ocupaciones se administran desde los flujos operativos y no pueden editarse aquí.</p></section>
    {loading && <p>Cargando garage...</p>}{error && <p className="duenio-feedback error">{error}</p>}{success && <p className="duenio-feedback success">{success}</p>}
    {form && <div className="duenio-form-card"><label>Nombre<input value={form.nombre} onChange={(e) => change('nombre', e.target.value)} /></label>
      <label>Ubicación<input value={form.ubicacion} onChange={(e) => change('ubicacion', e.target.value)} /></label>
      <label>Capacidad total<input type="number" min="0" step="1" value={form.capacidad} onChange={(e) => change('capacidad', e.target.value)} /></label>
      <FormularioPreciosGarage values={form} onChange={change} disabled={saving} />
    </div>}
    {form && <div className="duenio-form-actions"><button onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button><button className="secondary" onClick={() => navigate('/duenio-garage/dashboard')} disabled={saving}>Cancelar</button></div>}
  </main><FooterDueñoGarage /></div>;
}
