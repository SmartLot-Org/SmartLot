import { Component, Fragment } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null, retryKey: 0 };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  handleRetry = () => {
    this.setState(prev => ({ hasError: false, error: null, retryKey: prev.retryKey + 1 }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', fontFamily: "var(--font-body, 'DM Sans', sans-serif)", color: 'var(--text-h, #1E293B)',
          background: 'var(--bg, #F5F7FB)', padding: '2rem', textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Algo salió mal</h1>
          <p style={{ color: 'var(--text, #475569)', marginBottom: '1.5rem', maxWidth: '400px' }}>
            Ocurrió un error inesperado. Esto puede deberse a un problema de conexión o a un error temporal.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={this.handleRetry}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/20"
              style={{
                minHeight: '40px', padding: '0.65rem 1.5rem', background: 'var(--accent, #2563EB)',
                color: 'var(--color-brand-surface, #FFFFFF)', border: 'none', borderRadius: '10px',
                cursor: 'pointer', fontSize: '0.95rem'
              }}
            >
              Reintentar
            </button>
            <button
              type="button"
              onClick={this.handleGoHome}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/20"
              style={{
                minHeight: '40px', padding: '0.65rem 1.5rem', background: 'var(--text, #475569)',
                color: 'var(--color-brand-surface, #FFFFFF)', border: 'none', borderRadius: '10px',
                cursor: 'pointer', fontSize: '0.95rem'
              }}
            >
              Volver al inicio
            </button>
          </div>
        </div>
      );
    }

    return <Fragment key={this.state.retryKey}>{this.props.children}</Fragment>;
  }
}
