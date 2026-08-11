import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import HeaderDueñoGarage from '../componentesDueñoGarage/header_dueño_garage';
import FooterDueñoGarage from '../componentesDueñoGarage/footer_dueño_garage';
import GestionTratosGarage from '../componentesCompartidos/GestionTratosGarage';
import { useAuth } from '../contexts/useAuth';
import { useSolicitudesPendientesCount } from '../hooks/useSolicitudesPendientesCount';
import './duenio_garage.css';

export default function TratosEmpresaGarage() {
  const navigate = useNavigate(); const { usuario } = useAuth();
  useSolicitudesPendientesCount();
  return <div className="duenio-garage-page"><HeaderDueñoGarage /><main className="duenio-garage-main">
    <button type="button" className="duenio-back-button" onClick={() => navigate('/duenio-garage/dashboard')} aria-label="Volver al panel del dueño"><ArrowLeft size={20} /></button>
    <section className="duenio-section-head left deal-page-heading"><span>Administrador de garage</span><div className="deal-role-chip"><Building2 size={15}/> Empresas → solicitan cocheras → tus garages</div><h1>Tratos con empresas </h1><p>Revisá las propuestas que las empresas envían a tus garages y administrá los acuerdos comerciales vigentes.</p></section>
    <GestionTratosGarage usuario={usuario} mode="owner" />
  </main><FooterDueñoGarage /></div>;
}
