import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import FieldValidation from "../../components/FieldValidation";

const INPUT_CLASS =
  "peer w-full px-5 pt-6 pb-2.5 bg-brand-surface/70 border border-brand-deep/10 rounded-xl text-brand-warm text-base outline-none transition-all duration-300 ease-out focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20";
const LABEL_CLASS =
  "font-body absolute left-5 top-4 text-brand-muted text-base pointer-events-none transition-all duration-300 ease-out peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-brand-muted peer-focus:top-2 peer-focus:text-xs peer-focus:text-brand-blue peer-not-placeholder-shown:top-2 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-brand-muted";

export default function RegisterField({
  id,
  label,
  type = "text",
  autoComplete,
  value,
  onChange,
  onBlur,
  conditions = [],
  isTouched = false,
  textarea = false,
  rows = 3,
  hint,
  ...rest
}) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  if (textarea) {
    return (
      <div className="auth-stagger">
        <label htmlFor={id} className="font-body block text-sm font-semibold text-brand-warm mb-1.5">
          {label}
        </label>
        <textarea
          id={id}
          rows={rows}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className="w-full px-5 py-3.5 bg-brand-surface/70 border border-brand-deep/10 rounded-xl text-brand-warm text-base outline-none transition-all duration-300 ease-out focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 resize-y"
          {...rest}
        />
        <FieldValidation conditions={conditions} isTouched={isTouched} />
        {hint && <p className="text-xs text-brand-muted mt-1">{hint}</p>}
      </div>
    );
  }

  return (
    <div className="auth-stagger">
      <div className="relative">
        <input
          type={isPassword ? (visible ? "text" : "password") : type}
          id={id}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder=" "
          autoComplete={autoComplete}
          className={`${INPUT_CLASS} ${isPassword ? "pr-12" : ""}`}
          {...rest}
        />
        <label htmlFor={id} className={LABEL_CLASS}>
          {label}
        </label>
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded"
          >
            {visible ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      <FieldValidation conditions={conditions} isTouched={isTouched} />
      {hint && <p className="text-xs text-brand-muted mt-1">{hint}</p>}
    </div>
  );
}
