import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Key, CheckCircle, ArrowLeft, LogIn } from 'lucide-react';
import apiClient from '../api/client';
import { getUserHomeRoute } from '../helpers/roles';
import './Login.css';

export default function ForgotPassword() {
  const [paso, setPaso] = useState('email');
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [mostrarCambio, setMostrarCambio] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('El email es requerido.'); return; }
    if (cooldown > 0) { setError(`Espere ${cooldown}s antes de reintentar.`); return; }

    setLoading(true);
    try {
      await apiClient.post('/api/usuario/recuperar-clave', {
        email: email.trim().toLowerCase()
      }, { _skipAuthRedirect: true });
      setPaso('codigo');
    } catch (err) {
      const msg = err.response?.data?.message || 'Error de conexión.';
      setError(msg);

      if (err.response?.status === 429) {
        const retryAfter = parseInt(err.response?.headers?.['retry-after'] || '900', 10);
        setCooldown(retryAfter);
      }
    } finally {
      setLoading(false);
    }
  };

  const validarCodigoBase = () => {
    if (!email.trim()) { setError('El email es requerido.'); return false; }
    if (!codigo.trim()) { setError('El código es requerido.'); return false; }
    if (!/^\d{6}$/.test(codigo)) { setError('El código debe ser de 6 dígitos.'); return false; }
    if (cooldown > 0) { setError(`Espere ${cooldown}s antes de reintentar.`); return false; }
    return true;
  };

  const handleLoginConCodigo = async (e) => {
    e?.preventDefault();
    setError('');
    if (!validarCodigoBase()) return;

    setLoading(true);
    try {
      const res = await apiClient.post('/api/usuario/login-con-codigo', {
        email: email.trim().toLowerCase(),
        codigo: codigo.trim()
      }, { _skipAuthRedirect: true });

      const usuario = res.data?.usuario;
      window.location.href = getUserHomeRoute(usuario);
    } catch (err) {
      const msg = err.response?.data?.message || 'Error de conexión.';
      setError(msg);
      if (err.response?.status === 429) {
        const retryAfter = parseInt(err.response?.headers?.['retry-after'] || '900', 10);
        setCooldown(retryAfter);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestablecer = async (e) => {
    e.preventDefault();
    setError('');

    if (!validarCodigoBase()) return;
    if (!password) { setError('La contraseña es requerida.'); return; }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      setError('La contraseña debe tener al menos 8 caracteres, mayúsculas, minúsculas y números.');
      return;
    }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden.'); return; }

    setLoading(true);
    try {
      await apiClient.post('/api/usuario/restablecer-clave', {
        email: email.trim().toLowerCase(),
        codigo: codigo.trim(),
        contraseña: password
      }, { _skipAuthRedirect: true });
      setPaso('exito');
    } catch (err) {
      const msg = err.response?.data?.message || 'Error de conexión.';
      setError(msg);

      if (err.response?.status === 429) {
        const retryAfter = parseInt(err.response?.headers?.['retry-after'] || '900', 10);
        setCooldown(retryAfter);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderEmailStep = () => (
    <form className="login-form" onSubmit={handleEmailSubmit}>
      <label className="login-campo">
        <span className="login-campo-label">Correo electrónico</span>
        <div className="login-input-wrapper">
          <Mail size={18} className="login-input-icon" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@empresa.com"
            autoComplete="email"
            required
          />
        </div>
      </label>

      {error && (
        <div className="login-error" role="alert">
          {error}
        </div>
      )}

      <button
        type="submit"
        className="login-boton"
        disabled={loading || cooldown > 0}
      >
        <Key size={18} />
        {cooldown > 0
          ? `Espere ${cooldown}s`
          : loading ? 'Enviando...' : 'Enviar código'}
      </button>
    </form>
  );

  const renderCodigoStep = () => (
    <div className="login-form">
      <label className="login-campo">
        <span className="login-campo-label">Correo electrónico</span>
        <div className="login-input-wrapper">
          <Mail size={18} className="login-input-icon" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@empresa.com"
            autoComplete="email"
            required
          />
        </div>
      </label>

      <label className="login-campo">
        <span className="login-campo-label">Código de verificación</span>
        <div className="login-input-wrapper">
          <Key size={18} className="login-input-icon" />
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            autoComplete="one-time-code"
            required
            className="login-codigo-input"
            maxLength={6}
          />
        </div>
      </label>

      {error && (
        <div className="login-error" role="alert">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleLoginConCodigo}
        className="login-boton"
        disabled={loading || cooldown > 0}
      >
        <LogIn size={18} />
        {cooldown > 0
          ? `Espere ${cooldown}s`
          : loading ? 'Ingresando...' : 'Ingresar con código'}
      </button>

      <div className="login-separador">
        <span>o</span>
      </div>

      {!mostrarCambio ? (
        <button
          type="button"
          className="login-boton login-boton--secundario"
          onClick={() => setMostrarCambio(true)}
        >
          <Lock size={18} />
          Cambiar contraseña
        </button>
      ) : (
        <form onSubmit={handleRestablecer} className="login-form" style={{ gap: '16px', marginTop: 0 }}>
          <label className="login-campo">
            <span className="login-campo-label">Nueva contraseña</span>
            <div className="login-input-wrapper">
              <Lock size={18} className="login-input-icon" />
              <input
                type={verPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="login-toggle-password"
                onClick={() => setVerPassword((prev) => !prev)}
                aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          <label className="login-campo">
            <span className="login-campo-label">Confirmar contraseña</span>
            <div className="login-input-wrapper">
              <Lock size={18} className="login-input-icon" />
              <input
                type={verPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </div>
          </label>

          <button
            type="submit"
            className="login-boton"
            disabled={loading || cooldown > 0}
          >
            <Lock size={18} />
            {cooldown > 0
              ? `Espere ${cooldown}s`
              : loading ? 'Restableciendo...' : 'Restablecer contraseña'}
          </button>

          <button
            type="button"
            className="login-link-secundario"
            onClick={() => setMostrarCambio(false)}
          >
            Cancelar cambio
          </button>
        </form>
      )}
    </div>
  );

  const renderExitoStep = () => (
    <div className="login-form">
      <div className="login-ok">
        <CheckCircle size={48} className="login-ok-icon" />
        <h3 className="login-ok-titulo">¡Contraseña restablecida!</h3>
        <p className="login-ok-mensaje">
          Tu contraseña ha sido actualizada exitosamente.
          Ya puedes iniciar sesión con tu nueva contraseña.
        </p>
        <Link to="/login" className="login-boton">
          <ArrowLeft size={18} />
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );

  return (
    <div className="login-page">
      <div className="login-glow login-glow--uno" aria-hidden="true" />
      <div className="login-glow login-glow--dos" aria-hidden="true" />

      <main className="login-card">
        <div className="login-brand">
          <span className="login-brand-icon">
            <Key size={26} />
          </span>
          <span className="login-brand-nombre">SmartLot</span>
        </div>

        <h1 className="login-titulo">Recuperar Contraseña</h1>
        <p className="login-subtitulo">
          {paso === 'email' && 'Te enviaremos un código de verificación a tu correo'}
          {paso === 'codigo' && 'Ingresá el código para iniciar sesión o cambiá tu contraseña (opcional)'}
          {paso === 'exito' && ''}
        </p>

        {paso === 'email' && renderEmailStep()}
        {paso === 'codigo' && renderCodigoStep()}
        {paso === 'exito' && renderExitoStep()}

        <p className="login-pie">
          <Link to="/login">← Volver al inicio de sesión</Link>
        </p>
      </main>
    </div>
  );
}
