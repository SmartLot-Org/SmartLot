import { useNavigate } from "react-router-dom";
import UserDropdown from "../components/UserDropdown";
import CampanaNotificaciones from "../componentesCompartidos/CampanaNotificaciones";
import logo from "../Imagenes/Logo_SmartLot-removebg-preview.png";
import "./header_dueño_garage.css";

function HeaderDueñoGarage() {
  const navigate = useNavigate();

  return (
    <>
      <header className="duenio-header">
        <div className="duenio-header-left">
          <div className="duenio-logo-smartlot">
            <button
              type="button"
              onClick={() => navigate("/duenio-garage/dashboard")}
              aria-label="Ir al panel principal"
              className="inline-flex rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              <img src={logo} alt="logo SmartLot" />
            </button>
          </div>
        </div>

        <div className="duenio-header-right">
          <CampanaNotificaciones rutaTratos="/duenio-garage/tratos" ctaTratos="Ir a tratos" />
          <UserDropdown />
        </div>
      </header>

      <div className="duenio-header-spacer" aria-hidden="true" />
    </>
  );
}

export default HeaderDueñoGarage;
