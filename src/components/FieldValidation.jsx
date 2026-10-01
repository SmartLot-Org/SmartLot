import './FieldValidation.css';

export default function FieldValidation({ conditions = [], isTouched }) {
  if (!isTouched || conditions.every((condition) => condition.met)) return null;

  const hasAnyMet = conditions.some((c) => c.met);

  return (
    <ul className={`fv-list ${hasAnyMet ? 'fv-list--active' : ''}`}>
      {conditions.map((condition, index) => (
        <li
          key={index}
          className={`fv-item ${condition.met ? 'fv-item--met' : 'fv-item--unmet'}`}
        >
          <span className="fv-icon">
            {condition.met ? (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            )}
          </span>
          <span className="fv-label">{condition.label}</span>
        </li>
      ))}
    </ul>
  );
}
