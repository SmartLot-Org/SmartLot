import { DIAS_SEMANA } from "../helpers/diasSemana";
import FieldValidation from "../components/FieldValidation";
import "./selector_dias_operativos.css";

function SelectorDiasOperativos({ value = [], onChange, validation }) {
  const todosSeleccionados = value.length === DIAS_SEMANA.length;

  const toggleDia = (diaApi) => {
    const index = value.indexOf(diaApi);
    if (index >= 0) {
      onChange(value.filter(d => d !== diaApi));
    } else {
      onChange([...value, diaApi]);
    }
  };

  const toggleTodosLosDias = () => {
    if (todosSeleccionados) {
      onChange([]);
    } else {
      onChange(DIAS_SEMANA.map(d => d.api));
    }
  };

  return (
    <div className="dops-panel">
      <div className="dops-header">
        <span className="dops-title">Días operativos</span>
      </div>

      {validation && (
        <FieldValidation conditions={validation.conditions} isTouched={validation.isTouched} />
      )}

      <div className="dops-grid">
        <label
          className={`dops-chip ${todosSeleccionados ? 'dops-chip--active' : ''}`}
        >
          <input
            type="checkbox"
            checked={todosSeleccionados}
            onChange={toggleTodosLosDias}
          />
          <span className="dops-chip-content">
            <span className="dops-mark">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2.5 2.5 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span className="dops-chip-name">Toda la semana</span>
            <span className="dops-chip-hint">Lun–Dom</span>
          </span>
        </label>

        {DIAS_SEMANA.map((dia) => {
          const seleccionado = value.includes(dia.api);
          return (
            <label
              key={dia.api}
              className={`dops-chip ${seleccionado ? 'dops-chip--active' : ''}`}
            >
              <input
                type="checkbox"
                checked={seleccionado}
                onChange={() => toggleDia(dia.api)}
              />
              <span className="dops-chip-content">
                <span className="dops-mark">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <span className="dops-chip-name">{dia.display}</span>
              </span>
            </label>
          );
        })}
      </div>

      <div className="dops-footer">
        <span className="dops-count">
          <span className="dops-count-num">{value.length}</span>
          <span className="dops-count-den">/{DIAS_SEMANA.length} días</span>
        </span>
        <span className="dops-track">
          <span
            className="dops-track-fill"
            style={{ transform: `translateX(${(value.length / DIAS_SEMANA.length) * 100 - 100}%)` }}
          />
        </span>
      </div>
    </div>
  );
}

export default SelectorDiasOperativos;
