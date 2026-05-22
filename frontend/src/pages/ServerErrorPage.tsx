import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';

export function ServerErrorPage() {
  return (
    <AppShell title="Error del servidor">
      <div className="error-page">
        <h2>500</h2>
        <p>Ocurrió un error en el servidor. Intenta de nuevo en unos momentos.</p>
        <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
          Reintentar
        </button>
        <Link to="/inicio" className="back-link" style={{ display: 'block', marginTop: 16 }}>
          Volver al inicio
        </Link>
      </div>
    </AppShell>
  );
}
