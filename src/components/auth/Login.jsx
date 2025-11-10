import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login(email, password);
      
      if (userData.role === 'Admins') {
        navigate('/admin/dashboard');
      } else if (userData.role === 'Journalists') {
        navigate('/journalist/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน');
    } finally {
      setLoading(false);
    }
  };

  // Test Account (Only for development - removed in production)
  const fillTestAccount = (type) => {
    // FIX: Use environment variables instead of hardcoded credentials
    const isDevelopment = import.meta.env.MODE === 'development';

    if (!isDevelopment) {
      console.warn('Test accounts are only available in development mode');
      return;
    }

    if (type === 'admin') {
      setEmail(import.meta.env.VITE_TEST_ADMIN_EMAIL || 'admin@thaipbs.or.th');
      setPassword(import.meta.env.VITE_TEST_ADMIN_PASSWORD || '');
    } else {
      setEmail(import.meta.env.VITE_TEST_JOURNALIST_EMAIL || 'journalist@thaipbs.or.th');
      setPassword(import.meta.env.VITE_TEST_JOURNALIST_PASSWORD || '');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Orange Gradient with Logo */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-800 items-center justify-center p-12">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white tracking-wider">
            ScamReport
          </h1>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-4xl font-bold text-orange-600">ScamReport</h1>
          </div>

          {/* Sign in Header */}
          <div>
            <h2 className="text-4xl font-bold text-gray-900">Sign in</h2>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label htmlFor="email" className="block text-lg font-semibold text-gray-900 mb-3">
                Username
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-base"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-lg font-semibold text-gray-900 mb-3">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-orange-600 hover:text-orange-700"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {/* Forgot Password Link */}
              <div className="mt-2">
                <a href="#" className="text-orange-600 hover:text-orange-700 text-base font-medium">
                  Forgot password
                </a>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'Login'}
            </button>
          </form>

          {/* Test Accounts Buttons (Only in development) */}
          {import.meta.env.MODE === 'development' && (
            <div className="pt-6 border-t border-gray-200">
              <p className="text-xs text-center text-gray-500 mb-3">บัญชีทดสอบ (Development Only)</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => fillTestAccount('admin')}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded-lg flex items-center justify-center text-sm"
                >
                  Admin
                </button>
                <button
                  onClick={() => fillTestAccount('journalist')}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded-lg flex items-center justify-center text-sm"
                >
                  Journalist
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
