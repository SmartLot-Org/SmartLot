import { Contact, ChevronDown } from 'lucide-react';
import "./formularios.css";
import { useRef, useState } from 'react';
import FieldValidation from "../components/FieldValidation";

function FormularioInfoPersonal({
    infoPersonalTitulo,
    labels,
    formData,
    onChange,
    sedes = [],
    isSedeDisabled = false,
    hideSede = false,
    fieldsValidation = {}
}) {
    const getDisplayName = (item) => item?.nombre || item?.name || item?.descripcion || item?.tipo || '';

    const [isOpenSede, setIsOpenSede] = useState(false);
    const [indiceResaltado, setIndiceResaltado] = useState(-1);
    const triggerSedeRef = useRef(null);
    const LISTBOX_SEDE_ID = 'info-personal-sede-listbox';

    const renderField = (fieldName, inputEl) => (
      <>
        {inputEl}
        {fieldsValidation[fieldName] && (
          <FieldValidation
            conditions={fieldsValidation[fieldName].conditions}
            isTouched={fieldsValidation[fieldName].isTouched}
          />
        )}
      </>
    );

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
        <section className="formulario-container">
            <div className="form-header">
                <Contact className="form-icon" size={24} aria-hidden="true" />
                <h2>{infoPersonalTitulo}</h2>
            </div>

            <div className="input-group">
                {renderField('nombre',
                  <input
                    id="info-personal-nombre"
                    type="text"
                    placeholder=" "
                    value={formData.nombre}
                    onChange={(e) => onChange('nombre', e.target.value)}
                    autoComplete="off"
                    required
                  />
                )}
                <label htmlFor="info-personal-nombre">{labels.nombre}</label>
            </div>

            <div className="input-group">
                {renderField('apellido',
                  <input
                    id="info-personal-apellido"
                    type="text"
                    placeholder=" "
                    value={formData.apellido}
                    onChange={(e) => onChange('apellido', e.target.value)}
                    autoComplete="off"
                    required
                  />
                )}
                <label htmlFor="info-personal-apellido">{labels.apellido}</label>
            </div>

            <div className="input-group">
                {renderField('email',
                  <input
                    id="info-personal-email"
                    type="email"
                    placeholder=" "
                    value={formData.email}
                    onChange={(e) => onChange('email', e.target.value)}
                    autoComplete="off"
                    required
                  />
                )}
                <label htmlFor="info-personal-email">{labels.email}</label>
            </div>

            <div className="input-group">
                {renderField('telefono',
                  <input
                    id="info-personal-telefono"
                    type="tel"
                    placeholder=" "
                    value={formData.telefono}
                    onChange={(e) => onChange('telefono', e.target.value)}
                    autoComplete="off"
                    required
                  />
                )}
                <label htmlFor="info-personal-telefono">{labels.telefono}</label>
            </div>

            <div className="input-group">
                {renderField('contraseña',
                  <input
                    id="info-personal-contraseña"
                    type="password"
                    placeholder=" "
                    value={formData.contraseña}
                    onChange={(e) => onChange('contraseña', e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                )}
                <label htmlFor="info-personal-contraseña">{labels.contraseña}</label>
            </div>

            {!hideSede && (
                <div className={`input-group menu-dropdown-item ${isOpenSede ? 'dropdown-open' : ''} ${formData.id_sede ? 'has-selected-value' : ''}`}>

                    <button
                        ref={triggerSedeRef}
                        id="info-personal-sede"
                        type="button"
                        role="combobox"
                        aria-expanded={isOpenSede}
                        aria-controls={LISTBOX_SEDE_ID}
                        aria-haspopup="listbox"
                        aria-activedescendant={isOpenSede && indiceResaltado >= 0 ? `${LISTBOX_SEDE_ID}-opt-${indiceResaltado}` : undefined}
                        className="dropdown-trigger-clean"
                        disabled={isSedeDisabled}
                        onClick={() => !isSedeDisabled && setIsOpenSede((abierto) => !abierto)}
                        onKeyDown={manejarTecladoSede}
                        style={isSedeDisabled ? { opacity: 0.5, cursor: 'not-allowed', backgroundColor: '#F1F5F9' } : {}}
                    >
                        <span className="selected-display-text">
                            {formData.id_sede
                                ? getDisplayName(sedes.find(s => s.id === formData.id_sede))
                                : ''}
                        </span>

                        <ChevronDown className="chevron-arrow-svg" size={20} aria-hidden="true" />
                    </button>

                    <ul
                        id={LISTBOX_SEDE_ID}
                        role="listbox"
                        aria-label={labels.sede || 'Sede'}
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
                    <label htmlFor="info-personal-sede">{labels.sede}</label>
                </div>
            )}
        </section>
    )
}
export default FormularioInfoPersonal;
