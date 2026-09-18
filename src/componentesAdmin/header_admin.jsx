import logo from "../Imagenes/Logo_SmartLot-removebg-preview.png";
import "./header_admin.css";
import { useNavigate } from "react-router-dom";
import UserDropdown from "../components/UserDropdown";
import CampanaNotificaciones from "../componentesCompartidos/CampanaNotificaciones";
import { useAuth } from "../contexts/useAuth";
import { ROLE_NAMES, userHasRole } from "../helpers/roles";
function Header({ homePath = "/admin_dashboard" }) {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const esAdmin = userHasRole(usuario, ROLE_NAMES.ADMIN);
  return (
    <>
      <div className="header">
        <div className="header-left">
          <div className="logo-smartlot">
            <img
              onClick={() => navigate(homePath)}
              src={logo}
              alt="logo SmartLot"
              style={{ cursor: "pointer" }}
            />
          </div>
        </div>

        <div className="header-right">
          {esAdmin ? <CampanaNotificaciones rutaTratos="/gestion_garages" ctaTratos="Ver gestión de garages" /> : null}
          <UserDropdown />
        </div>
      </div>

      <div className="header-spacer" aria-hidden="true" />
    </>
  );
}

export default Header;
