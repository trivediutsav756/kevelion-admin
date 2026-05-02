import React, { useState } from 'react';

const Sidebar = ({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen, user, onLogout }) => {
  // Initialize sub-menu state. If an active tab is inside the specification menu, we can open it.
  const [openSubMenu, setOpenSubMenu] = useState(null);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { 
      id: 'specifications', 
      label: 'Specifications', 
      icon: '⚙️',
      subMenu: [
        { id: 'categories', label: 'Categories', icon: '🛠️' },
        { id: 'subcategories', label: 'Sub Categories', icon: '🔩' },
        { id: 'finishes', label: 'Finishes', icon: '✨' },
        { id: 'colors', label: 'Colors', icon: '🎨' },
        { id: 'materials', label: 'Materials', icon: '🧱' },
        { id: 'countries', label: 'Countries', icon: '🌍' },
      ]
    },
    { id: 'products', label: 'Products', icon: '📦' },
    { id: 'sellers', label: 'Sellers', icon: '👥' },
    { id: 'buyers', label: 'Buyers', icon: '🛒' },
    { id: 'orders', label: 'Orders', icon: '📋' },
    { id: 'reports', label: 'Reports', icon: '📈' },
    { id: 'seller-reports', label: 'Seller Reports', icon: '📊' },
    { id: 'subscriptions', label: 'Subscriptions', icon: '💳' },
    { id: 'sliders', label: 'Sliders', icon: '🎞️' },
    { id: 'faqs', label: 'FAQs', icon: '❓' },
    { id: 'inventory-log', label: 'Inventory Log', icon: '📝' },
    { id: 'complaints', label: 'Complaints', icon: '📩' },
    { id: 'contact-us', label: 'Contact Us', icon: '✉️' },
  ];

  const handleMenuClick = (item) => {
    if (item.subMenu) {
      setOpenSubMenu(openSubMenu === item.id ? null : item.id);
    } else {
      const next = String(item.id || '').trim();
      setActiveTab(next);
      try {
        localStorage.setItem('retaillian_active_tab', next);
      } catch {}
      setSidebarOpen(false);
    }
  };

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
        h-full lg:h-screen overflow-y-auto overscroll-contain
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">K</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">kevelion</h1>
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

        {/* User Info (Moved to Top) */}
        {user && (
          <div className="p-4 border-b border-gray-200">
            <div className="p-3 bg-gray-50 rounded-lg">
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
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto overscroll-contain">
          {menuItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => handleMenuClick(item)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-colors
                  ${(!item.subMenu && activeTab === item.id)
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.subMenu && (
                  <svg 
                    className={`w-4 h-4 transition-transform ${openSubMenu === item.id ? 'rotate-180' : ''}`} 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              
              {item.subMenu && openSubMenu === item.id && (
                <div className="ml-8 mt-2 space-y-2">
                  {item.subMenu.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => {
                        const next = String(subItem.id || '').trim();
                        setActiveTab(next);
                        try {
                          localStorage.setItem('retaillian_active_tab', next);
                        } catch {}
                        setSidebarOpen(false);
                      }}
                      className={`
                        w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-left transition-colors text-sm
                        ${activeTab === subItem.id
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                        }
                      `}
                    >
                      <span className="text-lg">{subItem.icon}</span>
                      <span>{subItem.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200 mt-auto">
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
