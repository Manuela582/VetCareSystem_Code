import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ApiBridge } from './components/ApiBridge';
import { ToastContainer } from './components/ui/ToastContainer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleRoute } from './components/RoleRoute';
import { LoadingScreen } from './components/LoadingScreen';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { VeterinarioPage } from './pages/VeterinarioPage';
import { DuenoPage } from './pages/DuenoPage';
import { AdminPage } from './pages/AdminPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { PetsListPage } from './pages/PetsListPage';
import { PetDetailPage } from './pages/PetDetailPage';
import { PetFormPage } from './pages/PetFormPage';
import { ClinicalHistoryPage } from './pages/ClinicalHistoryPage';
import { ClinicalRecordFormPage } from './pages/ClinicalRecordFormPage';
import { RemindersPage } from './pages/RemindersPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { CartPage } from './pages/CartPage';
import { AppointmentRequestPage } from './pages/AppointmentRequestPage';
import { CartProvider } from './context/CartContext';
import { ProfilePage } from './pages/ProfilePage';
import { ApiDocsPage } from './pages/ApiDocsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ServerErrorPage } from './pages/ServerErrorPage';

function PublicOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/inicio" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/registro" element={<PublicOnly><RegisterPage /></PublicOnly>} />
      <Route path="/recuperar-contrasena" element={<PublicOnly><ForgotPasswordPage /></PublicOnly>} />
      <Route path="/inicio" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/recordatorios" element={<ProtectedRoute><RoleRoute allowedRoles={['DUENO', 'VETERINARIO', 'ADMIN']}><RemindersPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/panel/veterinario" element={<ProtectedRoute><RoleRoute allowedRoles={['VETERINARIO', 'ADMIN']}><VeterinarioPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/panel/dueno" element={<ProtectedRoute><RoleRoute allowedRoles={['DUENO', 'ADMIN']}><DuenoPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><RoleRoute allowedRoles={['ADMIN']}><AdminPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/mascotas" element={<ProtectedRoute><RoleRoute allowedRoles={['DUENO', 'VETERINARIO', 'ADMIN']}><PetsListPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/mascotas/nueva" element={<ProtectedRoute><RoleRoute allowedRoles={['DUENO', 'VETERINARIO', 'ADMIN']}><PetFormPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/mascotas/:id/editar" element={<ProtectedRoute><RoleRoute allowedRoles={['VETERINARIO', 'ADMIN']}><PetFormPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/mascotas/:id/historial/nueva" element={<ProtectedRoute><RoleRoute allowedRoles={['VETERINARIO', 'ADMIN']}><ClinicalRecordFormPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/mascotas/:id/historial/:recordId/editar" element={<ProtectedRoute><RoleRoute allowedRoles={['VETERINARIO', 'ADMIN']}><ClinicalRecordFormPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/mascotas/:id/historial" element={<ProtectedRoute><RoleRoute allowedRoles={['DUENO', 'VETERINARIO', 'ADMIN']}><ClinicalHistoryPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/mascotas/:id" element={<ProtectedRoute><RoleRoute allowedRoles={['DUENO', 'VETERINARIO', 'ADMIN']}><PetDetailPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/marketplace" element={<ProtectedRoute><RoleRoute allowedRoles={['DUENO', 'VETERINARIO', 'ADMIN']}><MarketplacePage /></RoleRoute></ProtectedRoute>} />
      <Route path="/carrito" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
      <Route path="/solicitar-cita" element={<ProtectedRoute><RoleRoute allowedRoles={['DUENO', 'ADMIN']}><AppointmentRequestPage /></RoleRoute></ProtectedRoute>} />
      <Route path="/perfil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/api-docs" element={<ProtectedRoute><ApiDocsPage /></ProtectedRoute>} />
      <Route path="/error-servidor" element={<ProtectedRoute><ServerErrorPage /></ProtectedRoute>} />
      <Route path="/sin-permiso" element={<ProtectedRoute><ForbiddenPage /></ProtectedRoute>} />
      <Route path="*" element={<ProtectedRoute><NotFoundPage /></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CartProvider>
          <BrowserRouter>
            <ApiBridge />
            <ToastContainer />
            <AppRoutes />
          </BrowserRouter>
        </CartProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
