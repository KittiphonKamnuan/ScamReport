import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-60 bg-gray-800 text-white flex flex-col">
        {/* Logo Header */}
        <div className="h-16 bg-orange-600 flex items-center px-6">
          <h1 className="text-xl font-bold">ScamReport</h1>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-6">
          <Link
            to="/admin/dashboard"
            className={`flex items-center px-6 py-3 text-sm transition-colors ${
              isActive('/admin/dashboard')
                ? 'bg-gray-700 text-white border-l-4 border-orange-500'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            หน้าหลัก
          </Link>

          <Link
            to="/admin/complaints"
            className={`flex items-center px-6 py-3 text-sm transition-colors ${
              isActive('/admin/complaints')
                ? 'bg-gray-700 text-white border-l-4 border-orange-500'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            ข้อมูลผู้ร้องเรียน
          </Link>

          <Link
            to="/admin/history"
            className={`flex items-center px-6 py-3 text-sm transition-colors ${
              isActive('/admin/history')
                ? 'bg-gray-700 text-white border-l-4 border-orange-500'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            ข้อความ
          </Link>
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-gray-700">
          <Link
            to="/admin/settings"
            className="flex items-center px-6 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            ตั้งค่า
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center w-full px-6 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-orange-600 shadow-md flex items-center justify-between px-8">
          <div className="text-white">
            <h2 className="text-lg font-semibold">
              {location.pathname === '/admin/dashboard' && 'Dashboard'}
              {location.pathname === '/admin/complaints' && 'ข้อมูลผู้ร้องเรียน'}
              {location.pathname === '/admin/history' && 'ประวัติข้อความ'}
              {location.pathname === '/admin/settings' && 'ตั้งค่า'}
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-white text-sm">{user?.email}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;