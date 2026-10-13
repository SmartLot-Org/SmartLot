import logo from "../Imagenes/Logo_SmartLot-removebg-preview.png";
import "./header_superadmin.css";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import UserDropdown from "../components/UserDropdown";

function HeaderSuperadmin() {
  const navigate = useNavigate();
  return (
    <div className="header-superadmin">
      <div className="header-superadmin-left">
        <div className="logo-superadmin">
          <button
            type="button"
            onClick={() => navigate("/superadmin_dashboard")}
            aria-label="Ir al panel principal"
            className="inline-flex rounded-lg cursor-pointer"
          >
            <img src={logo} alt="logo SmartLot" />
          </button>
        </div>
        <span className="header-superadmin-badge">Superadmin</span>
      </div>
      <div className="header-superadmin-right">
        <Bell size={30} aria-hidden="true" />
        <UserDropdown />
      </div>
    </div>
  );
}

export default HeaderSuperadmin;
