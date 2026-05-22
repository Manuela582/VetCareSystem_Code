import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';

export function NotFoundPage() {
  return (
    <AppShell title="Página no encontrada">
      <div className="error-page">
        <h2>404</h2>
        <p>La ruta que buscas no existe en VetCare.</p>
        <Link to="/inicio" className="btn-primary">
          Ir al inicio
        </Link>
      </div>
    </AppShell>
  );
}
