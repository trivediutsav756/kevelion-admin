// components/Sidebar.jsx
import React from 'react';

const Sidebar = ({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen, user, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'categories', label: 'Categories', icon: '🛠️' },
    { id: 'subcategories', label: 'Sub Categories', icon: '🔩' },
    { id: 'products', label: 'Products', icon: '📦' },
    { id: 'sellers', label: 'Sellers', icon: '👥' }, // ✅ id 'sellers' honi chahiye
    { id: 'buyers', label: 'Buyers', icon: '🛒' },
    { id: 'orders', label: 'Orders', icon: '📋' },
    { id: 'subscriptions', label: 'Subscriptions', icon: '💳' }, // ✅ Added Subscriptions menu item
    { id: 'sliders', label: 'Sliders', icon: '🎞️' }, // ✅ Added Sliders menu item
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-white border-r border-gray-200 transform
        transition-transform duration-300 ease-in-out
        flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">R</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">Retaillian</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setSidebarOpen(false);
              }}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors
                ${activeTab === item.id
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-200">
          {/* User Info */}
          {user && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {user.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.role || 'Administrator'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Logout Button */}
          <button 
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors"
          >
            <span className="text-xl">🚪</span>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;