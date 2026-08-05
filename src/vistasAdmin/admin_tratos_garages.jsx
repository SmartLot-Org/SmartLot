import Header from '../componentesAdmin/header_admin';
import FooterAdmin from '../componentesAdmin/footer_admin';
import GestionTratosGarage from '../componentesCompartidos/GestionTratosGarage';
import { useAuth } from '../contexts/useAuth';
import '../vistasDueñoGarage/duenio_garage.css';

export default function AdminTratosGarages() {
  const { usuario } = useAuth();
  return <><Header /><main className="duenio-garage-shell"><section className="duenio-section-head left"><span>Empresas y garages</span><h1>Tratos de mi empresa</h1><p>Consultá y administrá los acuerdos autorizados por el backend.</p></section><GestionTratosGarage usuario={usuario} mode="admin" /></main><FooterAdmin /></>;
}
