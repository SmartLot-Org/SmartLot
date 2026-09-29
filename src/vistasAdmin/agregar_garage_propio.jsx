import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CirclePlus, MapPin } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '../contexts/useAuth';
import Header from '../componentesAdmin/header_admin';
import FooterAdmin from '../componentesAdmin/footer_admin';
import FormularioZona from '../componentesAdmin/formulario_zona';
import FormularioCapacidad from '../componentesAdmin/formulario_capacidad';
import BotonGenerico from '../componentesAdmin/boton_generico';
import FormularioPreciosGarage from '../componentesCompartidos/FormularioPreciosGarage';
import { GaragePropioCreate, GaragesGetAll } from '../servicies/API_Garage';
import { SedesGetAll } from '../servicies/API_Sede';
import { buildGaragePricesPayload } from '../helpers/prices';
import { normalizeList } from '../helpers/tratos';
import useLiveValidation from '../hooks/useLiveValidation';
import './agregar_zona.css';
import './agregar_garage_propio.css';

const responseMessage = (response) => response?.datos?.message
  || response?.datos?.error
  || (typeof response?.datos === 'string' ? response.datos : null)
  || 'No se pudo crear el garage. Intentá nuevamente.';

export default function AgregarGaragePropio() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [formData, setFormData] = useState({
    nombre: '',
    piso: '',
    hora_apertura: '',
    hora_cierre: '',
    dias: [],
    capacidad_reservas: 1,
    capacidad_para_no_reservas: 0,
    precio_pickup: '',
    precio_auto: '',
    precio_moto: '',
  });
  const [sedes, setSedes] = useState([]);
  const [garages, setGarages] = useState([]);
  const [sedeId, setSedeId] = useState(usuario?.id_sede ? String(usuario.id_sede) : '');
  const [loadingData, setLoadingData] = useState(true);
  const [garageLookupUnavailable, setGarageLookupUnavailable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [sedesResponse, garagesResponse] = await Promise.all([
          SedesGetAll({ force: true }),
          GaragesGetAll({ force: true }),
        ]);
        if (!active) return;

        if (!sedesResponse.respuesta) {
          setError('No se pudieron cargar las sedes. Volvé a intentar más tarde.');
          setSedes([]);
          setSedeId('');
        } else {
          const empresaId = Number(usuario?.id_empresa);
          const propias = normalizeList(sedesResponse.datos).filter((sede) => (
            Number(sede.id_empresa) === empresaId
            && (!usuario?.id_sede || Number(sede.id) === Number(usuario.id_sede))
          ));
          setSedes(propias);
          const sedeUsuario = propias.find((sede) => Number(sede.id) === Number(usuario?.id_sede));
          if (sedeUsuario) setSedeId(String(sedeUsuario.id));
          else if (propias.length === 1) setSedeId(String(propias[0].id));
          else setSedeId('');
        }

        if (garagesResponse.respuesta) {
          setGarages(normalizeList(garagesResponse.datos));
          setGarageLookupUnavailable(false);
        } else {
          setGarages([]);
          setGarageLookupUnavailable(true);
        }
      } catch {
        if (!active) return;
        setSedes([]);
        setGarages([]);
        setSedeId('');
        setGarageLookupUnavailable(true);
        setError('No se pudieron cargar los datos de la sede. Volvé a intentar más tarde.');
      } finally {
        if (active) setLoadingData(false);
      }
    };

    load();
    return () => { active = false; };
  }, [usuario?.id_empresa, usuario?.id_sede]);

  const selectedSede = useMemo(
    () => sedes.find((sede) => String(sede.id) === String(sedeId)) || null,
    [sedes, sedeId]
  );
  const sedeYaTieneGarage = Boolean(sedeId) && garages.some((garage) => (
    garage.id_sede_propia !== null
    && garage.id_sede_propia !== undefined
    && Number(garage.id_sede_propia) === Number(sedeId)
  ));
  const direccionDisponible = Boolean(selectedSede?.ubicacion?.trim());

  const getSchema = () => ({
    nombre: [
      { rule: (value) => value?.trim().length > 0, message: 'Requerido' },
      { rule: (value) => value?.trim().length >= 3, message: 'Mínimo 3 caracteres' },
    ],
    piso: [
      { rule: (value) => value !== '' && value !== null && value !== undefined, message: 'Requerido' },
      { rule: (value) => value === '' || value === null || value === undefined || Number.isInteger(Number(value)), message: 'Debe ser un número entero' },
    ],
    hora_apertura: [
      { rule: (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || '')), message: 'Formato HH:MM requerido' },
    ],
    hora_cierre: [
      { rule: (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || '')), message: 'Formato HH:MM requerido' },
      () => ({ rule: () => !formData.hora_apertura || !formData.hora_cierre || formData.hora_apertura < formData.hora_cierre, message: 'La apertura debe ser anterior al cierre' }),
    ],
    capacidad_reservas: [
      { rule: (value) => value !== '' && value !== null && value !== undefined && Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 32767, message: 'Ingresá entre 1 y 32.767 cocheras reservables' },
    ],
    capacidad_para_no_reservas: [
      { rule: (value) => value !== '' && value !== null && value !== undefined && Number.isInteger(Number(value)) && Number(value) >= 0, message: 'Debe ser un entero mayor o igual a 0' },
    ],
    dias: [
      { rule: (value) => Array.isArray(value) && value.length > 0, message: 'Seleccioná al menos un día' },
    ],
  });

  const schema = getSchema();
  const { isValid, touched, handleChangeWithTouch } = useLiveValidation(formData, schema);
  const fieldsValidation = Object.fromEntries(Object.keys(schema).map((field) => {
    const conditions = schema[field].map((item) => {
      const config = typeof item === 'function' ? item(formData[field]) : item;
      return { label: config.message, met: config.rule(formData[field]) };
    });
    return [field, { conditions, isTouched: touched[field] }];
  }));

  const handleChange = (field, value) => {
    if (typeof field === 'object' && field !== null) {
      setFormData(field);
      return;
    }
    handleChangeWithTouch(field, value, setFormData);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setError('');
    if (!selectedSede) {
      setError('Seleccioná una sede para crear su garage propio.');
      return;
    }
    if (!direccionDisponible) {
      setError('La sede elegida no tiene una dirección registrada. Completá la dirección de la sede antes de continuar.');
      return;
    }
    if (sedeYaTieneGarage) {
      setError('Esta sede ya tiene un garage propio. Cada sede puede tener uno solo.');
      return;
    }
    if (!isValid) {
      setError('Corregí los campos marcados antes de guardar.');
      return;
    }

    let precios;
    try {
      precios = buildGaragePricesPayload(formData);
    } catch (validationError) {
      setError(validationError.message);
      return;
    }
    if (Object.values(precios).some((precio) => precio !== null && !Number.isInteger(precio))) {
      setError('Ingresá los precios en pesos enteros.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await GaragePropioCreate({
        id_sede: Number(selectedSede.id),
        nombre: formData.nombre.trim(),
        piso: Number(formData.piso),
        hora_apertura: formData.hora_apertura,
        hora_cierre: formData.hora_cierre,
        dias: formData.dias,
        capacidad_reservas: Number(formData.capacidad_reservas),
        capacidad_para_no_reservas: Number(formData.capacidad_para_no_reservas),
        ...precios,
      });
      if (!response.respuesta) throw new Error(responseMessage(response));

      await Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Garage propio creado y vinculado a la sede',
        showConfirmButton: false,
        timer: 1800,
        timerProgressBar: true,
      });
      navigate('/gestion_garages', { replace: true });
    } catch (submitError) {
      setError(submitError.message || 'No se pudo crear el garage. Intentá nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const formDataWithAddress = { ...formData, ubicacion: selectedSede?.ubicacion || '' };
  const submitDisabled = loadingData || submitting || !selectedSede || !direccionDisponible || sedeYaTieneGarage;

  return (
    <div className="agregar-zona garage-propio-page">
      <Header />
      <main className="contenido-agregar-zona">
        <header className="top-garage">
          <button type="button" className="boton-back" onClick={() => navigate('/gestion_garages')} aria-label="Volver a gestión de garages">
            <ArrowLeft size={24} />
          </button>
          <div className="info-top">
            <h1>Agregar garage</h1>
            <span>La dirección se toma de la sede seleccionada y el garage queda reservado para esa sede.</span>
          </div>
        </header>

        {loadingData ? <p className="garage-propio-feedback" role="status">Cargando sedes y garages…</p> : null}
        {!loadingData && !error && sedes.length === 0 ? (
          <section className="garage-propio-empty" role="status">
            <MapPin size={22} />
            <div><strong>No hay sedes disponibles</strong><p>Necesitás una sede de tu empresa para registrar su garage propio.</p></div>
          </section>
        ) : null}

        <div className="form-garage garage-propio-form">
          <fieldset className="garage-responsables garage-propio-sede" disabled={loadingData || submitting || Boolean(usuario?.id_sede)}>
            <legend>Sede del garage</legend>
            <label htmlFor="garage-propio-sede">Elegí la sede a la que va a pertenecer *</label>
            <select id="garage-propio-sede" value={sedeId} onChange={(event) => setSedeId(event.target.value)} required>
              <option value="">Seleccionar sede</option>
              {sedes.map((sede) => <option key={sede.id} value={sede.id}>{sede.nombre || `Sede ${sede.id}`}</option>)}
            </select>
            {selectedSede?.ubicacion ? (
              <p className="garage-propio-address-note"><MapPin size={16} /><span>La dirección del garage será <strong>{selectedSede.ubicacion}</strong>.</span></p>
            ) : null}
          </fieldset>

          {sedeYaTieneGarage ? <p className="garage-propio-alert" role="alert">Esta sede ya tiene un garage propio. No se puede crear un segundo.</p> : null}
          {!loadingData && selectedSede && !direccionDisponible ? <p className="garage-propio-alert" role="alert">La sede elegida no tiene una dirección registrada. Completá la dirección de la sede antes de continuar.</p> : null}
          {garageLookupUnavailable ? <p className="garage-propio-subtle" role="status">No se pudo consultar la disponibilidad de la sede; el servidor la verificará al guardar.</p> : null}

          <fieldset className="garage-propio-fields" disabled={loadingData || submitting || !selectedSede || sedeYaTieneGarage}>
            <FormularioZona
              formData={formDataWithAddress}
              onChange={handleChange}
              hideSede
              fieldsValidation={fieldsValidation}
              ubicacionFija={selectedSede?.ubicacion || ''}
            />
            <FormularioCapacidad formData={formData} onChange={handleChange} />
          </fieldset>
          <FormularioPreciosGarage values={formData} onChange={handleChange} disabled={loadingData || submitting || !selectedSede || sedeYaTieneGarage} integerOnly />
        </div>

        {error ? <p className="garage-propio-alert" role="alert">{error}</p> : null}
        <div className="acciones-garage">
          <BotonGenerico className="btn-guardar-grande" onClick={handleSubmit} disabled={submitDisabled}>
            <CirclePlus size={22} />
            <span>{submitting ? 'Creando garage…' : 'Crear garage propio'}</span>
          </BotonGenerico>
          <BotonGenerico className="btn-cancelar-grande" onClick={() => navigate('/gestion_garages')} disabled={submitting}>
            <span>Cancelar</span>
          </BotonGenerico>
        </div>
      </main>
      <FooterAdmin />
    </div>
  );
}
