import { useId } from 'react';
import './ReservationLimitFields.css';

export default function ReservationLimitFields({ limited, value, onLimitedChange, onValueChange, error, inputRef, disabled = false }) {
  const id = useId();
  const helpId = `${id}-ayuda`;
  const errorId = `${id}-error`;

  return (
    <fieldset className="reservation-limit-fields" disabled={disabled}>
      <legend>Límite de reservas activas</legend>
      <div className="reservation-limit-options">
        <label>
          <input type="radio" name={id} checked={!limited} onChange={() => onLimitedChange(false)} />
          Sin límite
        </label>
        <label>
          <input type="radio" name={id} checked={limited} onChange={() => onLimitedChange(true)} />
          Con límite
        </label>
      </div>
      {limited && (
        <div className="reservation-limit-maximum">
          <label htmlFor={id}>Máximo de reservas<span aria-hidden="true"> *</span></label>
          <input
            ref={inputRef}
            id={id}
            type="number"
            min="0"
            max="32767"
            step="1"
            required
            value={value}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${errorId} ${helpId}` : helpId}
            onChange={(event) => onValueChange(event.target.value)}
          />
          {error && <p className="reservation-limit-field-error" id={errorId} role="alert">{error}</p>}
          <p id={helpId} className="reservation-limit-help">
            Usá 0 para bloquear nuevas reservas. Las reservas existentes siguen vigentes. El límite aplica a todos los garages y modalidades de pago.
          </p>
        </div>
      )}
    </fieldset>
  );
}
