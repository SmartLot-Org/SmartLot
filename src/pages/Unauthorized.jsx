import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="unauthorized-page" style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', gap: '1rem', padding: '2rem'
    }}>
      <h1 style={{ fontSize: '4rem', fontWeight: '800', color: '#d32f2f', margin: 0 }}>403</h1>
      <h2 style={{ margin: 0 }}>Acceso Denegado</h2>
      <p style={{ color: '#666', textAlign: 'center', maxWidth: '400px' }}>
        No tenés permisos suficientes para acceder a esta página.
      </p>
      <Link to="/login" style={{
        padding: '0.75rem 2rem', backgroundColor: '#2563EB', color: 'white',
        borderRadius: '8px', textDecoration: 'none', fontWeight: '600'
      }}>
        Volver al inicio
      </Link>
    </div>
  );
}
