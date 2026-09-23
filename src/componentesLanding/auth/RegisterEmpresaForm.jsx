import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { Building2, CircleCheck, User } from "lucide-react";
import apiClient from "../../api/client";
import RegisterField from "./RegisterField";

const SOLO_LETRAS = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SOLO_DIGITOS = /^\d{7,15}$/;
const ESPECIALES_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/g;

const DEFAULT_VALUES = {
  nombre: "",
  apellido: "",
  email: "",
  telefono: "",
  contraseña: "",
  confirmar: "",
  empresa_nombre: "",
  empresa_descripcion: "",
};

const NOMBRE_RULES = {
  required: "El nombre es obligatorio.",
  validate: {
    minLength: (value) => value.trim().length >= 2 || "El nombre debe tener al menos 2 caracteres.",
    onlyLetters: (value) => SOLO_LETRAS.test(value.trim()) || "El nombre solo puede contener letras.",
  },
};

const APELLIDO_RULES = {
  required: "El apellido es obligatorio.",
  validate: {
    minLength: (value) => value.trim().length >= 2 || "El apellido debe tener al menos 2 caracteres.",
    onlyLetters: (value) => SOLO_LETRAS.test(value.trim()) || "El apellido solo puede contener letras.",
  },
};

const EMAIL_RULES = {
  required: "El email es obligatorio.",
  validate: (value) => EMAIL_REGEX.test(value.trim()) || "Ingresá un email válido.",
};

const TELEFONO_RULES = {
  validate: (value) =>
    value.trim() === "" || SOLO_DIGITOS.test(value.trim()) || "El teléfono debe contener entre 7 y 15 dígitos.",
};

const CONTRASEÑA_RULES = {
  required: "La contraseña es obligatoria.",
  minLength: { value: 8, message: "La contraseña debe tener al menos 8 caracteres." },
  validate: {
    specialCharacters: (value) =>
      (value.match(ESPECIALES_REGEX) || []).length >= 2 || "Incluí al menos 2 caracteres especiales.",
    numbers: (value) => (value.match(/\d/g) || []).length >= 2 || "Incluí al menos 2 números.",
    uppercase: (value) => (value.match(/[A-Z]/g) || []).length >= 2 || "Incluí al menos 2 mayúsculas.",
  },
};

export default function RegisterEmpresaForm() {
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [enviado, setEnviado] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState("");
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, touchedFields, isSubmitting, isSubmitted },
  } = useForm({
    defaultValues: DEFAULT_VALUES,
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const getFieldState = (name) => ({
    error: errors[name],
    isTouched: Boolean(touchedFields[name]),
    showError: Boolean(touchedFields[name] || isSubmitted),
  });

  const onSubmit = async (values) => {
    setError("");
    if (cooldown > 0) {
      setError(`Espere ${cooldown}s antes de reintentar.`);
      return;
    }

    try {
      const emailNormalizado = values.email.trim().toLowerCase();
      await apiClient.post(
        "/api/solicitud-registro",
        {
          nombre: values.nombre.trim(),
          apellido: values.apellido.trim(),
          email: emailNormalizado,
          telefono: values.telefono.trim() === "" ? null : values.telefono.trim(),
          contraseña: values.contraseña,
          empresa_nombre: values.empresa_nombre.trim(),
          empresa_descripcion:
            values.empresa_descripcion.trim() === "" ? null : values.empresa_descripcion.trim(),
        },
        { _skipAuthRedirect: true, _skipToast: true }
      );
      setEmailEnviado(emailNormalizado);
      reset();
      setEnviado(true);
    } catch (err) {
      const msg = err.response?.data?.message || "Error de conexión.";
      setError(msg);
      if (err.response?.status === 429) {
        const retryAfter = parseInt(err.response?.headers?.["retry-after"] || "900", 10);
        setCooldown(retryAfter);
      }
    }
  };

  const onInvalid = () => {
    setError("Revisá los campos marcados.");
  };

  if (enviado) {
    return (
      <div className="flex flex-col items-center text-center gap-4 py-6" aria-live="polite">
        <span className="register-success-pop flex items-center justify-center w-20 h-20 rounded-full bg-green-50 border border-green-200">
          <CircleCheck size={44} className="text-green-600" aria-hidden="true" />
        </span>
        <h2 className="font-display text-2xl font-extrabold text-brand-warm">¡Solicitud enviada!</h2>
        <p className="text-brand-muted text-sm md:text-base leading-relaxed max-w-sm">
          Recibimos el registro de tu empresa. Un superadmin la validará a la brevedad y te
          avisaremos a <strong className="text-brand-warm">{emailEnviado}</strong>.
        </p>
        <Link
          to="/login"
          className="mt-2 font-semibold text-brand-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
      <div className="auth-stagger flex items-center gap-2 mt-1">
        <User size={16} className="text-brand-blue" aria-hidden="true" />
        <h3 className="font-display font-bold text-brand-warm">Tus datos</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RegisterField id="reg-emp-nombre" label="Nombre" autoComplete="given-name" {...register("nombre", NOMBRE_RULES)} {...getFieldState("nombre")} />
        <RegisterField id="reg-emp-apellido" label="Apellido" autoComplete="family-name" {...register("apellido", APELLIDO_RULES)} {...getFieldState("apellido")} />
      </div>

      <RegisterField id="reg-emp-email" label="Correo electrónico" type="email" autoComplete="email" {...register("email", EMAIL_RULES)} {...getFieldState("email")} />
      <RegisterField id="reg-emp-telefono" label="Teléfono (opcional)" type="tel" inputMode="numeric" autoComplete="tel" {...register("telefono", TELEFONO_RULES)} {...getFieldState("telefono")} />
      <RegisterField id="reg-emp-contraseña" label="Contraseña" type="password" autoComplete="new-password" {...register("contraseña", CONTRASEÑA_RULES)} {...getFieldState("contraseña")} />
      <RegisterField
        id="reg-emp-confirmar"
        label="Confirmar contraseña"
        type="password"
        autoComplete="new-password"
        {...register("confirmar", {
          required: "La confirmación de contraseña es obligatoria.",
          deps: ["contraseña"],
          validate: (value) => value === getValues("contraseña") || "Las contraseñas no coinciden.",
        })}
        {...getFieldState("confirmar")}
      />

      <div className="auth-stagger flex items-center gap-2 mt-2">
        <Building2 size={16} className="text-brand-blue" aria-hidden="true" />
        <h3 className="font-display font-bold text-brand-warm">Datos de tu empresa</h3>
      </div>

      <RegisterField
        id="reg-emp-empresa-nombre"
        label="Nombre de la empresa"
        autoComplete="organization"
        {...register("empresa_nombre", {
          required: "El nombre de la empresa es obligatorio.",
          validate: (value) => value.trim().length >= 2 || "El nombre de la empresa debe tener al menos 2 caracteres.",
        })}
        {...getFieldState("empresa_nombre")}
      />
      <RegisterField
        id="reg-emp-empresa-descripcion"
        label="Descripción (opcional)"
        textarea
        rows={3}
        placeholder="Contanos brevemente a qué se dedica tu empresa"
        {...register("empresa_descripcion", {
          maxLength: { value: 1000, message: "La descripción no puede superar los 1000 caracteres." },
        })}
        {...getFieldState("empresa_descripcion")}
      />

      <button
        type="submit"
        disabled={isSubmitting || cooldown > 0}
        className="auth-stagger mt-2 w-full rounded-xl bg-brand-blue px-8 py-4 text-white font-bold text-lg shadow-lg shadow-brand-blue/20 transition-all duration-300 hover:bg-brand-deep hover:shadow-brand-deep/25 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {cooldown > 0 ? `Espere ${cooldown}s` : isSubmitting ? "Enviando..." : "Enviar solicitud"}
      </button>

      {error && <p className="text-sm text-red-600 mt-1 text-center" role="alert">{error}</p>}
    </form>
  );
}
