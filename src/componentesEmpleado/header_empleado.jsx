import logo from "../Imagenes/Logo_SmartLot-removebg-preview.png";
import "../componentesAdmin/header_admin.css";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import UserDropdown from "../components/UserDropdown";

const aplicarTemaEmpleado = () => {
  try {
    const config = JSON.parse(localStorage.getItem("smartlot_empleado_config")) || {};
    document.documentElement.dataset.empleadoTheme = config.tema === "oscuro" ? "oscuro" : "claro";
  } catch {
    document.documentElement.dataset.empleadoTheme = "claro";
  }
};

function HeaderEmpleado() {
  const navigate = useNavigate();

  useEffect(() => {
    aplicarTemaEmpleado();
  }, []);

  return (
    <>
      <div className="header">
        <div className="header-left">

          <div className="logo-smartlot" >
            <button
              type="button"
              onClick={() => navigate("/empleados_dashboard")}
              aria-label="Ir al panel principal"
              className="inline-flex rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
            >
              <img src={logo} alt="logo SmartLot" />
            </button>
          </div>
          
        </div>
        <div className="header-right">
          <Bell size={30} aria-hidden="true" />
          <UserDropdown />
        </div>
      </div>
      <div className="header-spacer" aria-hidden="true" />
    </>
  );
}

export default HeaderEmpleado;
