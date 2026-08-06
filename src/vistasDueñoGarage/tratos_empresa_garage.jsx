import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import HeaderDueñoGarage from '../componentesDueñoGarage/header_dueño_garage';
import FooterDueñoGarage from '../componentesDueñoGarage/footer_dueño_garage';
import GestionTratosGarage from '../componentesCompartidos/GestionTratosGarage';
import { useAuth } from '../contexts/useAuth';
import './duenio_garage.css';

export default function TratosEmpresaGarage() {
  const navigate = useNavigate(); const { usuario } = useAuth();
  return <div className="duenio-garage-page"><HeaderDueñoGarage /><main className="duenio-garage-shell">
    <button type="button" className="duenio-back-button" onClick={() => navigate('/duenio-garage/dashboard')} aria-label="Volver al panel del dueño"><ArrowLeft size={20} /></button>
    <section className="duenio-section-head left"><span>Acuerdos reales</span><h1>Tratos con empresas</h1><p>Administrá cocheras y precios acordados para auto y pickup.</p></section>
    <GestionTratosGarage usuario={usuario} mode="owner" />
  </main><FooterDueñoGarage /></div>;
}
