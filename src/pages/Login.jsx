import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, LogIn, Mail, ParkingSquare } from 'lucide-react';
import apiClient from '../api/client';
import './Login.css';
import { getUserHomeRoute } from '../helpers/roles';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('El email es requerido.'); return; }
    if (cooldown > 0) { setError(`Espere ${cooldown}s antes de reintentar.`); return; }

    setLoading(true);
    try {
      const res = await apiClient.post('/api/usuario/login', {
        email: email.trim(),
        contraseña: password,
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

  return (
    <div className="login-page">
      <div className="login-glow login-glow--uno" aria-hidden="true" />
      <div className="login-glow login-glow--dos" aria-hidden="true" />

      <main className="login-card">
        <div className="login-brand">
          <span className="login-brand-icon">
            <ParkingSquare size={26} />
          </span>
          <span className="login-brand-nombre">SmartLot</span>
        </div>

        <h1 className="login-titulo">Iniciar Sesión</h1>
        <p className="login-subtitulo">Ingresá a tu panel de gestión</p>

        <form className="login-form" onSubmit={handleSubmit}>
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
            <span className="login-campo-label">Contraseña</span>
            <div className="login-input-wrapper">
              <Lock size={18} className="login-input-icon" />
              <input
                type={verPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
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
            <LogIn size={18} />
            {cooldown > 0
              ? `Espere ${cooldown}s`
              : loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="login-pie">
          ¿No tenés cuenta?{' '}
          <Link to="/register">Registrate</Link>
        </p>
      </main>
    </div>
  );
}
