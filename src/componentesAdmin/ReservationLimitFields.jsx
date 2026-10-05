export default function ReservationLimitFields({ limited, value, onLimitedChange, onValueChange, disabled = false }) {
  return (
    <fieldset className="reservation-limit-fields" disabled={disabled}>
      <legend>Reservas vigentes</legend>
      <label><input type="radio" name="reservation-limit-mode" checked={!limited} onChange={() => onLimitedChange(false)} /> Sin límite</label>
      <label><input type="radio" name="reservation-limit-mode" checked={limited} onChange={() => onLimitedChange(true)} /> Limitar reservas</label>
      {limited && <label>Máximo de reservas activas
        <input aria-label="Máximo de reservas activas" type="number" min="0" max="32767" step="1" required value={value} onChange={(event) => onValueChange(event.target.value)} />
      </label>}
      <p>0 bloquea nuevas reservas. Las reservas existentes continúan válidas. El límite incluye todos los garages y modalidades de pago.</p>
    </fieldset>
  );
}
