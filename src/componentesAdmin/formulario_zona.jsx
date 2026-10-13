import { useState, useRef } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { ChevronDown } from 'lucide-react';
import "./formulario_zona.css";
import FieldValidation from "../components/FieldValidation";
import SelectorDiasOperativos from "./selector_dias_operativos";
import { useGoogleMaps } from '../contexts/useGoogleMaps';

function FormularioZona({
    formData,
    onChange,
    sedes = [],
    fieldsValidation = {},
    onCoordenadasChange,
    hideSede = false,
    ubicacionFija
}) {
  const { isLoaded, loadError } = useGoogleMaps();
  if (loadError) console.warn('formulario_zona: Google Maps no cargó:', loadError);

  const autocompleteRef = useRef(null);

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current.getPlace();
    if (place?.geometry) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const direccion = place.formatted_address || '';
      onChange('ubicacion', direccion);
      if (onCoordenadasChange) {
        onCoordenadasChange({ lat, lng, direccion });
      }
    }
  };

    const [isOpenSede, setIsOpenSede] = useState(false);
    const [indiceResaltado, setIndiceResaltado] = useState(-1);
    const [es24Horas, setEs24Horas] = useState(false);
    const aperturaRef = useRef(null);
    const cierreRef = useRef(null);
    const triggerSedeRef = useRef(null);
    const LISTBOX_SEDE_ID = 'zona-sede-listbox';

    const getDisplayName = (item) => item?.nombre || item?.name || item?.descripcion || item?.tipo || '';

    const seleccionarSede = (sede) => {
        onChange('id_sede', Number(sede.id));
        setIsOpenSede(false);
        setIndiceResaltado(-1);
        triggerSedeRef.current?.focus();
    };

    // El foco se queda en el disparador y aria-activedescendant marca la opción activa.
    const manejarTecladoSede = (e) => {
        if (e.key === 'Escape') {
            setIsOpenSede(false);
            setIndiceResaltado(-1);
            return;
        }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (!isOpenSede) {
                setIsOpenSede(true);
                setIndiceResaltado(0);
                return;
            }
            if (!sedes.length) return;
            const delta = e.key === 'ArrowDown' ? 1 : -1;
            setIndiceResaltado((i) => (i + delta + sedes.length) % sedes.length);
            return;
        }
        if ((e.key === 'Enter' || e.key === ' ') && isOpenSede && indiceResaltado >= 0 && sedes[indiceResaltado]) {
            e.preventDefault();
            seleccionarSede(sedes[indiceResaltado]);
        }
    };

    return (
        <div className="formulario-zona">
            <div className="header-formulario-zona">
                <h3>Información general</h3>
                <p>
                    Definí la identidad y la ubicación del garage.
                </p>
            </div>

            <div className="bloque-formulario-zona">
                <div className="input-group">
                <input
                    id="zona-nombre"
                    type="text"
                    placeholder=" "
                    value={formData.nombre || ''}
                    onChange={(e) => onChange('nombre', e.target.value)}
                    autoComplete="off"
                    required
                />
                    <label htmlFor="zona-nombre">Nombre del garage</label>
                    {fieldsValidation.nombre && (
                      <FieldValidation conditions={fieldsValidation.nombre.conditions} isTouched={fieldsValidation.nombre.isTouched} />
                    )}
                </div>
               <section className='inputsNivelYSede'>
                     <div className="fila-inputs">
                    <div className="inputNivelPlanta input-group">
                        <input
                            id="zona-piso"
                            type="number"
                            placeholder=" "
                            value={formData.piso ?? ''}
                            onChange={(e) => onChange('piso', e.target.value === '' ? '' : e.target.value)}
                            autoComplete="off"
                            required
                        />
                        <label htmlFor="zona-piso">Nivel / Planta</label>
                        {fieldsValidation.piso && (
                          <FieldValidation conditions={fieldsValidation.piso.conditions} isTouched={fieldsValidation.piso.isTouched} />
                        )}
                    </div>
                </div>

                {!hideSede && <div className= {`inputSede input-group menu-dropdown-item ${isOpenSede ? 'dropdown-open' : ''} ${formData.id_sede ? 'has-selected-value' : ''}`}>
                    <button
                        ref={triggerSedeRef}
                        id="zona-sede"
                        type="button"
                        role="combobox"
                        aria-expanded={isOpenSede}
                        aria-controls={LISTBOX_SEDE_ID}
                        aria-haspopup="listbox"
                        aria-activedescendant={isOpenSede && indiceResaltado >= 0 ? `${LISTBOX_SEDE_ID}-opt-${indiceResaltado}` : undefined}
                        className="dropdown-trigger-clean"
                        onClick={() => setIsOpenSede((abierto) => !abierto)}
                        onKeyDown={manejarTecladoSede}
                    >
                        <span className="selected-display-text">
                            {formData.id_sede && sedes.length > 0
                                ? getDisplayName(sedes.find(s => Number(s.id) === Number(formData.id_sede)))
                                : ''
                            }
                        </span>

                        <ChevronDown className="chevron-arrow-svg" size={20} aria-hidden="true" />
                    </button>

                    <ul
                        id={LISTBOX_SEDE_ID}
                        role="listbox"
                        aria-label="Sede"
                        className="submenu-custom-list"
                    >
                        {sedes.map((sede, index) => (
                            <li
                                key={sede.id}
                                id={`${LISTBOX_SEDE_ID}-opt-${index}`}
                                role="option"
                                aria-selected={Number(sede.id) === Number(formData.id_sede)}
                                className={`submenu-custom-option ${index === indiceResaltado ? 'submenu-custom-option--activa' : ''}`}
                                onClick={() => seleccionarSede(sede)}
                            >
                                <span className="submenu-custom-link">
                                    {getDisplayName(sede)}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <label htmlFor="zona-sede">Sede</label>
                </div>}

               </section>

                <div className={`input-group ${formData.ubicacion ? 'has-value' : ''}`}>
                    {ubicacionFija !== undefined ? (
                        <input
                            id="zona-ubicacion"
                            type="text"
                            placeholder=" "
                            value={ubicacionFija || ''}
                            readOnly
                            required={Boolean(ubicacionFija)}
                            autoComplete="off"
                            aria-readonly="true"
                        />
                    ) : isLoaded ? (
                        <Autocomplete
                            onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }}
                            onPlaceChanged={handlePlaceChanged}
                        >
                            <input
                                id="zona-ubicacion"
                                type="text"
                                placeholder=" "
                                value={formData.ubicacion || ''}
                                onChange={(e) => onChange('ubicacion', e.target.value)}
                                autoComplete="off"
                                required
                            />
                        </Autocomplete>
                    ) : (
                        <input
                            id="zona-ubicacion"
                            type="text"
                            placeholder=" "
                            value={formData.ubicacion || ''}
                            onChange={(e) => onChange('ubicacion', e.target.value)}
                            autoComplete="off"
                            required
                        />
                    )}
                    <label htmlFor="zona-ubicacion">Ubicación</label>
                    {fieldsValidation.ubicacion && (
                      <FieldValidation conditions={fieldsValidation.ubicacion.conditions} isTouched={fieldsValidation.ubicacion.isTouched} />
                    )}
                </div>

                <div className="fila-inputs fila-horarios">
                    <div className="input-group input-group-time">
                        <input
                            id="zona-hora-apertura"
                            ref={aperturaRef}
                            type="time"
                            placeholder=" "
                            value={formData.hora_apertura || ''}
                            onChange={(e) => {
                                onChange('hora_apertura', e.target.value);
                                if (es24Horas) setEs24Horas(false);
                            }}
                            disabled={es24Horas}
                            autoComplete="off"
                            required={!es24Horas}
                        />
                        <label htmlFor="zona-hora-apertura">Hora de apertura</label>
                        {fieldsValidation.hora_apertura && (
                          <FieldValidation conditions={fieldsValidation.hora_apertura.conditions} isTouched={fieldsValidation.hora_apertura.isTouched} />
                        )}
                    </div>

                    <div className="input-group input-group-time">
                        <input
                            id="zona-hora-cierre"
                            ref={cierreRef}
                            type="time"
                            placeholder=" "
                            value={formData.hora_cierre || ''}
                            onChange={(e) => {
                                onChange('hora_cierre', e.target.value);
                                if (es24Horas) setEs24Horas(false);
                            }}
                            disabled={es24Horas}
                            autoComplete="off"
                            required={!es24Horas}
                        />
                        <label htmlFor="zona-hora-cierre">Hora de cierre</label>
                        {fieldsValidation.hora_cierre && (
                          <FieldValidation conditions={fieldsValidation.hora_cierre.conditions} isTouched={fieldsValidation.hora_cierre.isTouched} />
                        )}
                    </div>

                    <label className="checkbox-24-horas">
                        <input
                            type="checkbox"
                            checked={es24Horas}
                            onChange={(e) => {
                                const marcado = e.target.checked;
                                setEs24Horas(marcado);
                                if (marcado) {
                                    onChange('hora_apertura', '00:00');
                                    onChange('hora_cierre', '23:59');
                                } else {
                                    onChange('hora_apertura', '');
                                    onChange('hora_cierre', '');
                                }
                            }}
                        />
                        Abierto 24 horas
                    </label>
                </div>

                <SelectorDiasOperativos
                  value={formData.dias || []}
                  onChange={(arr) => onChange('dias', arr)}
                  validation={fieldsValidation.dias ? { conditions: fieldsValidation.dias.conditions, isTouched: fieldsValidation.dias.isTouched } : undefined}
                />
            </div>
        </div>
    );
}

export default FormularioZona;
