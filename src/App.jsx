import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";

// Núcleo: sin esto no hay app (se queda en el entry)
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import { GoogleMapsProvider } from "./contexts/GoogleMapsProvider";
import { useAuth } from "./contexts/useAuth";
import { setNavigate } from "./api/navigation";

// Landing: ruta inicial, eager para no meter un round-trip extra antes del primer paint
import LandingPage from "./vistasLanding/Landing";

// Públicas secundarias
const ParaGarages = lazy(() => import("./vistasLanding/ParaGarages"));
const Auth = lazy(() => import("./vistasLanding/Auth"));
const AuthCallback = lazy(() => import("./vistasLanding/AuthCallback"));
const Register = lazy(() => import("./pages/Register"));
const Logout = lazy(() => import("./pages/Logout"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const PaymentStatus = lazy(() => import("./pages/PaymentStatus"));

// Vistas de Administración
const AdminDashboard = lazy(() => import("./vistasAdmin/admin_dashboard"));
const GestionEmpleados = lazy(() => import("./vistasAdmin/gestion_de_empleados"));
const GestionGarages = lazy(() => import("./vistasAdmin/gestion_garages"));
const EditarZona = lazy(() => import("./vistasAdmin/editar_zona"));
const AgregarEmpleado = lazy(() => import("./vistasAdmin/agregar_empleado"));
const AgregarZona = lazy(() => import("./vistasAdmin/agregar_zona"));
const PerfilAdmin = lazy(() => import("./vistasAdmin/perfil_admin"));
const AdminPanelControl = lazy(() => import("./vistasAdmin/admin_panel_de_control"));
const AdminReportesAnalisis = lazy(() => import("./vistasAdmin/admin_reportes_analisis"));
const AdminPagos = lazy(() => import("./vistasAdmin/admin_pagos"));

// Vistas Dueño de Garage
const DuenioGarageDashboard = lazy(() => import("./vistasDueñoGarage/duenio_garage_dashboard"));
const CrearGarageDueño = lazy(() => import("./vistasDueñoGarage/crear_garage_dueño"));
const TratosEmpresaGarage = lazy(() => import("./vistasDueñoGarage/tratos_empresa_garage"));
const EditarGarageDueño = lazy(() => import("./vistasDueñoGarage/editar_garage_dueño"));
const CuentasPorCobrarGarage = lazy(() => import("./vistasDueñoGarage/cuentas_por_cobrar"));
const PerfilDueñoGarage = lazy(() => import("./vistasDueñoGarage/perfil_dueño_garage"));

// Vistas de Superadmin
const SuperadminDashboard = lazy(() => import("./vistasSuperadmin/superadmin_dashboard"));
const GestionUsuarios = lazy(() => import("./vistasSuperadmin/gestion_usuarios"));
const AgregarUsuario = lazy(() => import("./vistasSuperadmin/agregar_usuario"));
const GestionEmpresas = lazy(() => import("./vistasSuperadmin/gestion_empresas"));
const AgregarEmpresa = lazy(() => import("./vistasSuperadmin/agregar_empresa"));
const AgregarSede = lazy(() => import("./vistasSuperadmin/agregar_sede"));
const SuperadminGestionGarages = lazy(() => import("./vistasSuperadmin/superadmin_gestion_garages"));
const SuperadminConflictos = lazy(() => import("./vistasSuperadmin/superadmin_conflictos"));
const SuperadminReservas = lazy(() => import("./vistasSuperadmin/superadmin_reservas"));
const SuperadminCache = lazy(() => import("./vistasSuperadmin/superadmin_cache"));
const SuperadminPagosTest = lazy(() => import("./vistasSuperadmin/superadmin_pagos_test"));
const SuperadminEmailTemplates = lazy(() => import("./vistasSuperadmin/superadmin_email_templates"));
const ConfirmarSolicitud = lazy(() => import("./vistasSuperadmin/ConfirmarSolicitud"));

// Vistas de Empleados (Conexión corregida del perfil de empleado)
const EmpleadoDashboard = lazy(() => import("./vistasEmpleados/empleados_dashboard"));
const NuevaReserva = lazy(() => import("./vistasEmpleados/nueva_reserva"));
const PerfilEmpleado = lazy(() => import("./vistasEmpleados/perfil_empleado"));
const AgregarVehiculo = lazy(() => import("./vistasEmpleados/agregar_vehiculo"));
const HistorialReserva = lazy(() => import("./vistasEmpleados/historial_reserva"));

// Vistas Adicionales y Utilidades
const GaragistaDashboard = lazy(() => import("./vistasGaragista/garagista_dashboard"));

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
    </div>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const { usuario, loading } = useAuth();

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/para-garages" element={<ParaGarages />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Register />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/recuperar-clave" element={<ForgotPassword />} />

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
            <GestionEmpresas />
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
        <Route path="/superadmin/email-templates" element={
          <ProtectedRoute allowedRoles={[4]} usuario={usuario}>
            <SuperadminEmailTemplates />
          </ProtectedRoute>
        } />
        <Route path="/solicitud-registro/revision" element={
          <ProtectedRoute allowedRoles={[4]} usuario={usuario}>
            <ConfirmarSolicitud />
          </ProtectedRoute>
        } />

        {/* Mercado Pago – retorno de Checkout Pro (Opción A). Rutas públicas con verificación interna por payment_id / external_reference */}
        <Route path="/payment/success" element={<PaymentStatus />} />
        <Route path="/payment/failure" element={<PaymentStatus />} />
        <Route path="/payment/pending" element={<PaymentStatus />} />

        {/* Catch-all: Fallback seguro */}
        <Route path="*" element={
          loading
            ? <RouteFallback />
            : !usuario ? <Navigate to="/login" /> : <Navigate to="/" />
        } />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ErrorBoundary>
        <GoogleMapsProvider>
          <AppRoutes />
        </GoogleMapsProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
