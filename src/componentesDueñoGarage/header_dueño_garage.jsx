import { Building2, Handshake } from "lucide-react";
import { useNavigate } from "react-router-dom";
import UserDropdown from "../components/UserDropdown";
import logo from "../Imagenes/Logo_SmartLot-removebg-preview.png";
import "./header_dueño_garage.css";

function HeaderDueñoGarage() {
  const navigate = useNavigate();

  return (
    <>
      <header className="duenio-header">
        <button
          className="duenio-header-brand"
          onClick={() => navigate("/duenio-garage/dashboard")}
          aria-label="Ir al dashboard del dueño de garage"
        >
          <img src={logo} alt="SmartLot" />
          <span>Owner Console</span>
        </button>

        <div className="duenio-header-actions">
          <span className="duenio-header-role">
            <Building2 size={16} />
            Dueño de garage
          </span>
          <button className="duenio-header-bell" aria-label="Ver tratos" onClick={() => navigate('/duenio-garage/tratos')}><Handshake size={19} /></button>
          <UserDropdown />
        </div>
      </header>
      <div className="duenio-header-spacer" aria-hidden="true" />
    </>
  );
}

export default HeaderDueñoGarage;
