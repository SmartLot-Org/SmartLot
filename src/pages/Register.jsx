import { useState } from 'react';
import apiClient from '../api/client';
import PasswordStrength from '../components/PasswordStrength';
import useLiveValidation from '../hooks/useLiveValidation';
import FieldValidation from '../components/FieldValidation';

const validationSchema = {
  nombre: [
    { rule: (v) => v?.trim().length > 0, message: 'Requerido' },
    { rule: (v) => v?.trim().length >= 2, message: 'Mínimo 2 caracteres' },
    { rule: (v) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(v), message: 'Solo letras' },
  ],
  apellido: [
    { rule: (v) => v?.trim().length > 0, message: 'Requerido' },
    { rule: (v) => v?.trim().length >= 2, message: 'Mínimo 2 caracteres' },
    { rule: (v) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(v), message: 'Solo letras' },
  ],
  email: [
    { rule: (v) => v?.trim().length > 0, message: 'Requerido' },
    { rule: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), message: 'Formato inválido (ej: user@correo.com)' },
  ],
  contraseña: [
    { rule: (v) => v?.length > 0, message: 'Requerido' },
    { rule: (v) => v?.length >= 8, message: 'Mínimo 8 caracteres' },
    { rule: (v) => /[A-Z]/.test(v), message: 'Al menos una mayúscula' },
    { rule: (v) => /[a-z]/.test(v), message: 'Al menos una minúscula' },
    { rule: (v) => /\d/.test(v), message: 'Al menos un número' },
  ],
};

export default function Register() {
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', contraseña: ''
  });
  const [serverError, setServerError] = useState('');

  const { isValid, touched, getFieldProps } = useLiveValidation(form, validationSchema);

  const registerField = (name) => getFieldProps(name, setForm);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!isValid) return;

    try {
      const payload = {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        email: form.email.trim(),
        contraseña: form.contraseña,
      };
      await apiClient.post('/api/usuario/register', payload);
      window.location.href = '/login?registro=exitoso';
    } catch (err) {
      setServerError(err.response?.data?.message || 'Error al registrar.');
    }
  };

  const buildConditions = (field) => {
    if (!validationSchema[field]) return [];
    const value = form[field];
    return validationSchema[field].map((item) => {
      if (typeof item === 'function') {
        const result = item(value);
        return { label: result.message, met: result.rule(value) };
      }
      return { label: item.message, met: item.rule(value) };
    });
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="off">
      <h1>Registro</h1>

      <input name="nombre" placeholder="Nombre" value={form.nombre}
             {...registerField('nombre')} autoComplete="off" />
      <FieldValidation conditions={buildConditions('nombre')} isTouched={touched.nombre} />

      <input name="apellido" placeholder="Apellido" value={form.apellido}
             {...registerField('apellido')} autoComplete="off" />
      <FieldValidation conditions={buildConditions('apellido')} isTouched={touched.apellido} />

      <input name="email" type="email" placeholder="Email" value={form.email}
             {...registerField('email')} autoComplete="off" />
      <FieldValidation conditions={buildConditions('email')} isTouched={touched.email} />

      <input name="contraseña" type="password" placeholder="Contraseña"
             value={form.contraseña} {...registerField('contraseña')} autoComplete="new-password" />
      <PasswordStrength password={form.contraseña} />
      <FieldValidation conditions={buildConditions('contraseña')} isTouched={touched.contraseña} />

      {serverError && <div className="error">{serverError}</div>}

      <button type="submit">Crear Cuenta</button>
    </form>
  );
}
