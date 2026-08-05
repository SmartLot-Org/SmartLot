const PRICE_FIELDS = [
  ['precio_auto', 'Precio por hora - Auto'],
  ['precio_moto', 'Precio por hora - Moto'],
  ['precio_pickup', 'Precio por hora - Pickup'],
];

export default function FormularioPreciosGarage({ values, onChange, disabled = false }) {
  return (
    <fieldset className="garage-price-fields" disabled={disabled}>
      <legend>Precios por hora</legend>
      <div className="garage-price-grid">
        {PRICE_FIELDS.map(([name, label]) => (
          <label key={name}>
            <span>{label}</span>
            <input type="number" min="0" step="0.01" inputMode="decimal" value={values[name] ?? ''}
              onChange={(event) => onChange(name, event.target.value)} placeholder="Sin definir" />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
