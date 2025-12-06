// components/Login.jsx
import React, { useState } from 'react';
import logo from '../assets/logo.png';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Demo credential backend logic (You can replace with API later)
  const validUser = {
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      if (
        credentials.email === validUser.email &&
        credentials.password === validUser.password
      ) {
        const user = {
          id: 1,
          name: validUser.name,
          email: credentials.email,
          role: validUser.role
        };
        onLogin(user);
      } else {
        setError('Invalid email or password');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">

        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="text-center">
              <img 
                src={logo}
                alt="Retaillian Logo" 
                className="mx-auto w-24 h-24 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const fallback = document.getElementById('logo-fallback');
                  if (fallback) fallback.style.display = 'block';
                }}
              />
              <div id="logo-fallback" className="text-center hidden">
                <div className="font-bold text-2xl text-gray-800 tracking-tight mb-2">
                  RETAILION
                </div>
                <div className="text-xs text-gray-600 font-medium tracking-wide">
                  WORKSMART.GROWFAST
                </div>
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-2">Retaillian</h1>
          <p className="text-gray-600">Hardware Management System</p>

          <div className="mt-2">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              👤 Admin Mode
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Admin Login
          </h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            © 2024 Retaillian. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
