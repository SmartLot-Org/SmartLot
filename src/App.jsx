import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";

// Vistas de Administración
import AdminDashboard from "./vistasAdmin/admin_dashboard";
import GestionEmpleados from "./vistasAdmin/gestion_de_empleados";
import GestionGarages from "./vistasAdmin/gestion_garages";
import EditarZona from "./vistasAdmin/editar_zona";
import AgregarEmpleado from "./vistasAdmin/agregar_empleado";
import AgregarZona from "./vistasAdmin/agregar_zona";
import PerfilAdmin from "./vistasAdmin/perfil_admin";
import AdminPanelControl from "./vistasAdmin/admin_panel_de_control";
import AdminReportesAnalisis from "./vistasAdmin/admin_reportes_analisis";
import AdminPagos from "./vistasAdmin/admin_pagos";

// Vistas Dueño de Garage
import DuenioGarageDashboard from "./vistasDueñoGarage/duenio_garage_dashboard";
import CrearGarageDueño from "./vistasDueñoGarage/crear_garage_dueño";
import TratosEmpresaGarage from "./vistasDueñoGarage/tratos_empresa_garage";
import EditarGarageDueño from "./vistasDueñoGarage/editar_garage_dueño";
import CuentasPorCobrarGarage from "./vistasDueñoGarage/cuentas_por_cobrar";
import PerfilDueñoGarage from "./vistasDueñoGarage/perfil_dueño_garage";

// Vistas de Superadmin
import SuperadminDashboard from "./vistasSuperadmin/superadmin_dashboard";
import GestionUsuarios from "./vistasSuperadmin/gestion_usuarios";
import AgregarUsuario from "./vistasSuperadmin/agregar_usuario";
import GestionEmpresas from "./vistasSuperadmin/gestion_empresas";
import AgregarEmpresa from "./vistasSuperadmin/agregar_empresa";
import GestionSedes from "./vistasSuperadmin/gestion_sedes";
import AgregarSede from "./vistasSuperadmin/agregar_sede";
import SuperadminGestionGarages from "./vistasSuperadmin/superadmin_gestion_garages";
import SuperadminConflictos from "./vistasSuperadmin/superadmin_conflictos";
import SuperadminReservas from "./vistasSuperadmin/superadmin_reservas";
import SuperadminCache from "./vistasSuperadmin/superadmin_cache";
import SuperadminPagosTest from "./vistasSuperadmin/superadmin_pagos_test";

// Vistas Landing & Base
import LandingPage from "./vistasLanding/Landing";
import Auth from "./vistasLanding/Auth";
import AuthCallback from "./vistasLanding/AuthCallback";
import SobreNosotros from "./vistasLanding/SobreNosotros";

// Vistas de Empleados (Conexión corregida del perfil de empleado)
import EmpleadoDashboard from "./vistasEmpleados/empleados_dashboard";
import NuevaReserva from "./vistasEmpleados/nueva_reserva";
import PerfilEmpleado from "./vistasEmpleados/perfil_empleado";
import AgregarVehiculo from "./vistasEmpleados/agregar_vehiculo";
import HistorialReserva from "./vistasEmpleados/historial_reserva";

// Vistas Adicionales y Utilidades
import GaragistaDashboard from "./vistasGaragista/garagista_dashboard";
import Register from "./pages/Register";
import Logout from "./pages/Logout";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { useAuth } from "./contexts/useAuth";
import { setNavigate } from "./api/navigation";

function AppRoutes() {
  const navigate = useNavigate();
  const { usuario, loading } = useAuth();

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  if (loading) return null;

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/sobre-nosotros" element={<SobreNosotros />} />
      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Auth />} />
      <Route path="/register-form" element={<Register />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Rutas protegidas - Empleados */}
      <Route path="/empleados_dashboard" element={
        <ProtectedRoute allowedRoles={[2]} usuario={usuario}>
          <EmpleadoDashboard />
        </ProtectedRoute>
      } />
      <Route path="/nueva_reserva" element={
        <ProtectedRoute allowedRoles={[2]} usuario={usuario}>
          <NuevaReserva />
        </ProtectedRoute>
      } />
      <Route path="/historial_reserva" element={
        <ProtectedRoute allowedRoles={[2]} usuario={usuario}>
          <HistorialReserva />
        </ProtectedRoute>
      } />
       


      {/* Ruta del Perfil del Empleado protegida */}
      <Route path="/perfil_empleado" element={
        <ProtectedRoute allowedRoles={[2]} usuario={usuario}>
          <PerfilEmpleado />
        </ProtectedRoute>
      } />
      <Route path="/agregar_vehiculo" element={
        <ProtectedRoute allowedRoles={[2]} usuario={usuario}>
          <AgregarVehiculo />
        </ProtectedRoute>
      } />
      {/* Rutas protegidas - Garagista */}
      <Route path="/garagista_dashboard" element={
        <ProtectedRoute allowedRoles={[3]} usuario={usuario}>
          <GaragistaDashboard />
        </ProtectedRoute>
      } />
      <Route path="/control-acceso" element={
        <ProtectedRoute allowedRoles={[1, 3]} usuario={usuario}>
          <GaragistaDashboard />
        </ProtectedRoute>
      } />

      {/* Rutas protegidas - Admin */}
      <Route path="/admin_dashboard" element={
        <ProtectedRoute allowedRoles={[1]} usuario={usuario}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Ruta del Perfil del Admin protegida */}
      <Route path="/perfil_admin" element={
        <ProtectedRoute allowedRoles={[1]} usuario={usuario}>
          <PerfilAdmin />
        </ProtectedRoute>
      } />
      <Route path="/gestion_de_empleados" element={
        <ProtectedRoute allowedRoles={[1]} usuario={usuario}>
          <GestionEmpleados />
        </ProtectedRoute>
      } />
      <Route path="/agregar_empleado" element={
        <ProtectedRoute allowedRoles={[1]} usuario={usuario}>
          <AgregarEmpleado />
        </ProtectedRoute>
      } />
      <Route path="/agregar_garajista" element={
        <ProtectedRoute allowedRoles={[1]} usuario={usuario}>
          <Navigate to="/gestion_de_empleados" replace />
        </ProtectedRoute>
      } />
      <Route path="/gestion_garages" element={
        <ProtectedRoute allowedRoles={[1]} usuario={usuario}>
          <GestionGarages />
        </ProtectedRoute>
      } />
      <Route path="/agregar_zona" element={
        <ProtectedRoute allowedRoles={[4]} usuario={usuario}>
          <AgregarZona />
        </ProtectedRoute>
      } />
      <Route path="/editar_zona" element={
        <ProtectedRoute allowedRoles={[4]} usuario={usuario}>
          <EditarZona />
        </ProtectedRoute>
      } />
      <Route path="/admin_panel_de_control" element={
        <ProtectedRoute allowedRoles={[1]} usuario={usuario}>
          <AdminPanelControl />
        </ProtectedRoute>
      } />
      <Route path="/admin_reportes_analisis" element={
        <ProtectedRoute allowedRoles={[1]} usuario={usuario}>
          <AdminReportesAnalisis />
        </ProtectedRoute>
      } />
      <Route path="/admin_pagos" element={
        <ProtectedRoute allowedRoles={[1]} usuario={usuario}>
          <AdminPagos />
        </ProtectedRoute>
      } />
      <Route path="/admin/tratos-garages" element={<ProtectedRoute allowedRoles={["admin"]} usuario={usuario}><Navigate to="/gestion_garages" replace /></ProtectedRoute>} />

      {/* Rutas protegidas - Dueño de Garage */}
      <Route path="/duenio-garage/dashboard" element={
        <ProtectedRoute allowedRoles={["dueño_garage"]} usuario={usuario}>
          <DuenioGarageDashboard />
        </ProtectedRoute>
      } />
      <Route path="/duenio-garage/crear-garage" element={
        <ProtectedRoute allowedRoles={["dueño_garage"]} usuario={usuario}>
          <CrearGarageDueño />
        </ProtectedRoute>
      } />
      <Route path="/duenio-garage/tratos" element={<ProtectedRoute allowedRoles={["dueño_garage"]} usuario={usuario}><TratosEmpresaGarage /></ProtectedRoute>} />
      <Route path="/duenio-garage/garage/:id/editar" element={<ProtectedRoute allowedRoles={["dueño_garage"]} usuario={usuario}><EditarGarageDueño /></ProtectedRoute>} />
      <Route path="/duenio-garage/solicitudes" element={<Navigate to="/duenio-garage/tratos" replace />} />
      <Route path="/duenio-garage/cuentas-por-cobrar" element={<ProtectedRoute allowedRoles={["dueño_garage"]} usuario={usuario}><CuentasPorCobrarGarage /></ProtectedRoute>} />
      <Route path="/duenio-garage/perfil" element={<ProtectedRoute allowedRoles={["dueño_garage"]} usuario={usuario}><PerfilDueñoGarage /></ProtectedRoute>} />

      {/* Rutas protegidas - Superadmin */}
      <Route path="/superadmin_dashboard" element={
        <ProtectedRoute allowedRoles={[4]} usuario={usuario}>
          <SuperadminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/gestion_usuarios" element={
        <ProtectedRoute allowedRoles={[4]} usuario={usuario}>
          <GestionUsuarios />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/agregar_usuario" element={
        <ProtectedRoute allowedRoles={[4]} usuario={usuario}>
          <AgregarUsuario />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/gestion_empresas" element={
        <ProtectedRoute allowedRoles={[4]} usuario={usuario}>
          <GestionEmpresas />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/agregar_empresa" element={
        <ProtectedRoute allowedRoles={[4]} usuario={usuario}>
          <AgregarEmpresa />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/gestion_sedes" element={
        <ProtectedRoute allowedRoles={[4]} usuario={usuario}>
          <GestionSedes />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/agregar_sede" element={
        <ProtectedRoute allowedRoles={[4]} usuario={usuario}>
          <AgregarSede />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/gestion_garages" element={
        <ProtectedRoute allowedRoles={[4]} usuario={usuario}>
          <SuperadminGestionGarages />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/conflictos" element={
        <ProtectedRoute allowedRoles={[4]} usuario={usuario}>
          <SuperadminConflictos />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/reservas" element={
        <ProtectedRoute allowedRoles={[4]} usuario={usuario}>
          <SuperadminReservas />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/cache" element={
        <ProtectedRoute allowedRoles={[4]} usuario={usuario}>
          <SuperadminCache />
        </ProtectedRoute>
      } />
      <Route path="/superadmin/pagos-test" element={
        <ProtectedRoute allowedRoles={[4]} usuario={usuario}>
          <SuperadminPagosTest />
        </ProtectedRoute>
      } />

      {/* Catch-all: Fallback seguro */}
      <Route path="*" element={
        !usuario ? <Navigate to="/login" /> : <Navigate to="/" />
      } />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
