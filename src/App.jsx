import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/auth/Login';
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="Admins">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="complaints" element={<div className="p-6">Complaints Page</div>} />
            <Route path="users" element={<div className="p-6">Users Page</div>} />
            <Route path="settings" element={<div className="p-6">Settings Page</div>} />
          </Route>

          {/* Journalist Routes */}
          <Route path="/journalist" element={
            <ProtectedRoute requiredRole="Journalists">
              <div>Journalist Layout</div>
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<div>Journalist Dashboard</div>} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;