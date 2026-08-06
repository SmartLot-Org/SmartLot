import { useState, useRef } from 'react';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import "./formulario_zona.css";
import FieldValidation from "../components/FieldValidation";
import SelectorDiasOperativos from "./selector_dias_operativos";

const libraries = ['places'];

function FormularioZona({
    formData,
    onChange,
    sedes = [],
    fieldsValidation = {},
    onCoordenadasChange,
    hideSede = false
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_FRONTEND_KEY,
    libraries
  });
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
    const [es24Horas, setEs24Horas] = useState(false);
    const aperturaRef = useRef(null);
    const cierreRef = useRef(null);

    const getDisplayName = (item) => item?.nombre || item?.name || item?.descripcion || item?.tipo || '';

    return (
        <div className="formulario-zona">
            <div className="header-formulario-zona">
                <h3>Informacion General</h3>
                <p>
                    Define la identidad y ubicacion del nuevo garage.
                </p>
            </div>

            <div className="bloque-formulario-zona">
                <div className="input-group">
                <input
                    type="text"
                    placeholder=" "
                    value={formData.nombre || ''}
                    onChange={(e) => onChange('nombre', e.target.value)}
                    autoComplete="off"
                    required
                />
                    <label>Nombre del garage</label>
                    {fieldsValidation.nombre && (
                      <FieldValidation conditions={fieldsValidation.nombre.conditions} isTouched={fieldsValidation.nombre.isTouched} />
                    )}
                </div>
               <section className='inputsNivelYSede'>
                     <div className="fila-inputs">
                    <div className="inputNivelPlanta input-group">
                        <input
                            type="number"
                            placeholder=" "
                            value={formData.piso ?? ''}
                            onChange={(e) => onChange('piso', e.target.value === '' ? '' : e.target.value)}
                            autoComplete="off"
                            required
                        />
                        <label>Nivel / Planta</label>
                        {fieldsValidation.piso && (
                          <FieldValidation conditions={fieldsValidation.piso.conditions} isTouched={fieldsValidation.piso.isTouched} />
                        )}
                    </div>
                </div>

                {!hideSede && <div className= {`inputSede input-group menu-dropdown-item ${isOpenSede ? 'dropdown-open' : ''} ${formData.id_sede ? 'has-selected-value' : ''}`}>
                    <div
                        className="dropdown-trigger-clean"
                        onClick={() => setIsOpenSede(!isOpenSede)}
                    >
                        <span className="selected-display-text">
                            {formData.id_sede && sedes.length > 0
                                ? getDisplayName(sedes.find(s => Number(s.id) === Number(formData.id_sede)))
                                : ''
                            }
                        </span>

                        <svg className="chevron-arrow-svg" viewBox="0 0 24 24">
                            <path d="M7 10l5 5 5-5H7z" fill="currentColor" />
                        </svg>
                    </div>

                    <ul className="submenu-custom-list">
                        {sedes.map((sede) => (
                            <li
                                key={sede.id}
                                className="submenu-custom-option"
                                onClick={() => {
                                    onChange('id_sede', Number(sede.id));
                                    setIsOpenSede(false);
                                }}
                            >
                                <span className="submenu-custom-link">
                                    {getDisplayName(sede)}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <label>Sede</label>
                </div>}

               </section>
              
                <div className={`input-group ${formData.ubicacion ? 'has-value' : ''}`}>
                    {isLoaded ? (
                        <Autocomplete
                            onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }}
                            onPlaceChanged={handlePlaceChanged}
                        >
                            <input
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
                            type="text"
                            placeholder=" "
                            value={formData.ubicacion || ''}
                            onChange={(e) => onChange('ubicacion', e.target.value)}
                            autoComplete="off"
                            required
                        />
                    )}
                    <label>Ubicacion</label>
                    {fieldsValidation.ubicacion && (
                      <FieldValidation conditions={fieldsValidation.ubicacion.conditions} isTouched={fieldsValidation.ubicacion.isTouched} />
                    )}
                </div>

                <div className="fila-inputs fila-horarios">
                    <div className="input-group input-group-time">
                        <input
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
                        <label>Hora de apertura</label>
                        {fieldsValidation.hora_apertura && (
                          <FieldValidation conditions={fieldsValidation.hora_apertura.conditions} isTouched={fieldsValidation.hora_apertura.isTouched} />
                        )}
                    </div>

                    <div className="input-group input-group-time">
                        <input
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
                        <label>Hora de cierre</label>
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
