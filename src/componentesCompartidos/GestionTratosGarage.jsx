import { useCallback, useEffect, useMemo, useState } from 'react';
import { GaragesGetAll } from '../servicies/API_Garage';
import { EmpresasGetAll } from '../servicies/API_Empresa';
import { TratosCreate, TratosDelete, TratosGetAll, TratosGetByEmpresa, TratosUpdate } from '../servicies/API_TratoEmpresaGarage';
import { buildTratoPayload } from '../helpers/tratos';
import { formatARS } from '../helpers/prices';

const list = (value) => Array.isArray(value) ? value : Array.isArray(value?.datos) ? value.datos : [];
const initialForm = { id_empresa: '', id_garage: '', cantidad_cocheras: '', precio_pickup: '', precio_auto: '' };

export default function GestionTratosGarage({ usuario, mode }) {
  const [tratos, setTratos] = useState([]); const [garages, setGarages] = useState([]); const [empresas, setEmpresas] = useState([]);
  const [form, setForm] = useState(initialForm); const [editing, setEditing] = useState(null); const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');

  const load = useCallback(async (force = false) => {
    setLoading(true); setError('');
    const idEmpresa = Number(usuario?.id_empresa);
    const tratosPromise = mode === 'admin' && Number.isInteger(idEmpresa) && idEmpresa > 0
      ? TratosGetByEmpresa(idEmpresa, { force }) : TratosGetAll({ force });
    const [tratosRes, garagesRes, empresasRes] = await Promise.all([tratosPromise, GaragesGetAll({ force }), EmpresasGetAll({ force })]);
    if (!tratosRes.respuesta) { setTratos([]); setError(tratosRes.status === 403 ? 'No tenés permiso para consultar estos tratos.' : tratosRes.datos?.message || 'No se pudieron cargar los tratos.'); }
    else setTratos(list(tratosRes.datos));
    if (garagesRes.respuesta) setGarages(list(garagesRes.datos));
    if (empresasRes.respuesta) setEmpresas(list(empresasRes.datos));
    else if (mode === 'admin' && idEmpresa > 0) setEmpresas([{ id: idEmpresa, nombre: `Empresa #${idEmpresa}` }]);
    setLoading(false);
  }, [mode, usuario?.id_empresa]);
  useEffect(() => { const timer = window.setTimeout(() => load(), 0); return () => window.clearTimeout(timer); }, [load]);

  const empresaMap = useMemo(() => new Map(empresas.map((e) => [Number(e.id), e.nombre])), [empresas]);
  const garageMap = useMemo(() => new Map(garages.map((g) => [Number(g.id), g.nombre])), [garages]);
  const companyOptions = empresas.length ? empresas : [...new Set(tratos.map((t) => Number(t.id_empresa)))].map((id) => ({ id, nombre: `Empresa #${id}` }));
  const canCreate = garages.length > 0 && companyOptions.length > 0;
  const change = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const submit = async (event) => {
    event.preventDefault(); setError(''); setSuccess('');
    try {
      const payload = editing ? buildTratoPayload({ cantidad_cocheras: form.cantidad_cocheras, precio_pickup: form.precio_pickup, precio_auto: form.precio_auto }, { partial: true }) : buildTratoPayload(form);
      setSaving(true); const response = editing ? await TratosUpdate(editing, payload) : await TratosCreate(payload);
      if (!response.respuesta) throw new Error(response.datos?.message || 'No se pudo guardar el trato.');
      setSuccess(editing ? 'Trato actualizado.' : 'Trato creado.'); setEditing(null); setForm(initialForm); await load(true);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  const edit = (trato) => { setEditing(trato.id); setForm({ ...initialForm, cantidad_cocheras: trato.cantidad_cocheras, precio_pickup: trato.precio_pickup, precio_auto: trato.precio_auto }); };
  const remove = async (id) => { if (!window.confirm('¿Eliminar este trato de forma permanente?')) return; setSaving(true); const response = await TratosDelete(id); if (!response.respuesta) setError(response.datos?.message || 'No se pudo eliminar el trato.'); else { setTratos((items) => items.filter((item) => item.id !== id)); setSuccess('Trato eliminado.'); } setSaving(false); };

  return <section className="tratos-manager">
    <div className="duenio-requests-summary"><div><span>Tratos</span><strong>{loading ? '...' : tratos.length}</strong></div><div><span>Cocheras comprometidas</span><strong>{tratos.reduce((sum, t) => sum + Number(t.cantidad_cocheras || 0), 0)}</strong></div><div><span>Empresas asociadas</span><strong>{new Set(tratos.map((t) => t.id_empresa)).size}</strong></div></div>
    {error && <p className="duenio-feedback error">{error}</p>}{success && <p className="duenio-feedback success">{success}</p>}
    {!canCreate && !loading && <p className="duenio-feedback error">No hay empresas y garages autorizados disponibles para crear un trato. El backend debe permitir consultar al menos una empresa real.</p>}
    <form className="duenio-form-card" onSubmit={submit}>
      {!editing && <><label>Empresa<select value={form.id_empresa} onChange={(e) => change('id_empresa', e.target.value)} required><option value="">Seleccionar</option>{companyOptions.map((e) => <option key={e.id} value={e.id}>{e.nombre || `Empresa #${e.id}`}</option>)}</select></label>
      <label>Garage<select value={form.id_garage} onChange={(e) => change('id_garage', e.target.value)} required><option value="">Seleccionar</option>{garages.map((g) => <option key={g.id} value={g.id}>{g.nombre || `Garage #${g.id}`}</option>)}</select></label></>}
      <label>Cantidad de cocheras<input type="number" min="1" step="1" value={form.cantidad_cocheras} onChange={(e) => change('cantidad_cocheras', e.target.value)} required /></label>
      <label>Precio pickup<input type="number" min="0" step="0.01" value={form.precio_pickup} onChange={(e) => change('precio_pickup', e.target.value)} required /></label>
      <label>Precio auto<input type="number" min="0" step="0.01" value={form.precio_auto} onChange={(e) => change('precio_auto', e.target.value)} required /></label>
      <div className="duenio-form-actions"><button disabled={saving || (!editing && !canCreate)}>{saving ? 'Guardando...' : editing ? 'Actualizar trato' : 'Crear trato'}</button>{editing && <button type="button" className="secondary" onClick={() => { setEditing(null); setForm(initialForm); }}>Cancelar</button>}</div>
    </form>
    {loading ? <p>Cargando tratos...</p> : tratos.length === 0 ? <section className="duenio-empty-state"><h3>No hay tratos registrados.</h3><p>Los acuerdos reales aparecerán aquí.</p></section> : <div className="tratos-table-wrap"><table><thead><tr><th>ID</th><th>Empresa</th><th>Garage</th><th>Fecha</th><th>Cocheras</th><th>Auto</th><th>Pickup</th><th>Acciones</th></tr></thead><tbody>{tratos.map((t) => <tr key={t.id}><td>#{t.id}</td><td>{empresaMap.get(Number(t.id_empresa)) || `Empresa #${t.id_empresa}`}</td><td>{garageMap.get(Number(t.id_garage)) || `Garage #${t.id_garage}`}</td><td>{t.created_at ? new Date(t.created_at).toLocaleDateString('es-AR') : 'Sin fecha'}</td><td>{t.cantidad_cocheras}</td><td>{formatARS(t.precio_auto)}</td><td>{formatARS(t.precio_pickup)}</td><td><button onClick={() => edit(t)} disabled={saving}>Editar</button><button onClick={() => remove(t.id)} disabled={saving}>Eliminar</button></td></tr>)}</tbody></table></div>}
  </section>;
}
