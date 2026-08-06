import { Handshake } from "lucide-react";
import { useNavigate } from "react-router-dom";
import UserDropdown from "../components/UserDropdown";
import logo from "../Imagenes/Logo_SmartLot-removebg-preview.png";
import "./header_dueño_garage.css";

function HeaderDueñoGarage() {
  const navigate = useNavigate();

  return (
    <>
      <header className="duenio-header">
        <div className="duenio-header-left">
          <div className="duenio-logo-smartlot">
            <img
              onClick={() => navigate("/duenio-garage/dashboard")}
              src={logo}
              alt="logo SmartLot"
              style={{ cursor: "pointer" }}
            />
          </div>
        </div>

        <div className="duenio-header-right">
          <button
            type="button"
            className="duenio-header-bell"
            aria-label="Ver tratos"
            onClick={() => navigate("/duenio-garage/tratos")}
          >
            <Handshake size={26} />
          </button>
          <UserDropdown />
        </div>
      </header>

      <div className="duenio-header-spacer" aria-hidden="true" />
    </>
  );
}

export default HeaderDueñoGarage;
