// /seller/Sidebar.jsx
import React, { useState } from 'react';
import { 
  FiLayout, 
  FiGrid, 
  FiLayers, 
  FiBox,
  FiShoppingBag,
  FiChevronLeft,
  FiChevronRight,
  FiLogOut,
  FiUser
} from 'react-icons/fi';

const Sidebar = ({ activeSection, onSectionChange, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <FiLayout className="text-xl" />,
    },
    {
      id: 'category',
      label: 'Category',
      icon: <FiGrid className="text-xl" />,
    },
    {
      id: 'subcategory',
      label: 'Subcategory',
      icon: <FiLayers className="text-xl" />,
    },
    {
      id: 'products',
      label: 'Products',
      icon: <FiBox className="text-xl" />,
    },
    {
      id: 'ordermanagement',
      label: 'Order Management',
      icon: <FiShoppingBag className="text-xl" />,
    },
  ];

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setShowLogoutConfirm(false);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      <div className={`bg-white shadow-lg transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} h-screen flex flex-col relative`}>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-gray-800">Seller Panel</h1>
          )}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 ${
                    activeSection === item.id
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <span className={`${isCollapsed ? '' : 'mr-3'}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Profile and Logout Section */}
        <div className={`p-4 border-t border-gray-200 ${isCollapsed ? 'space-y-3' : 'space-y-4'}`}>
          
          {/* Profile Info */}
          {!isCollapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  <FiUser className="text-lg" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-800">seller</p>
                  <p className="text-xs text-gray-500">id 6</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                <FiUser className="text-lg" />
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogoutClick}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-200 text-gray-600 hover:bg-red-50 hover:text-red-600 ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? 'Logout' : ''}
          >
            <span className={`${isCollapsed ? '' : 'mr-3'}`}>
              <FiLogOut className="text-xl" />
            </span>
            {!isCollapsed && (
              <span className="font-medium">Logout</span>
            )}
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <div className="text-center">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <FiLogOut className="h-6 w-6 text-red-600" />
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Confirm Logout
              </h3>
              
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to logout from your account?
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={cancelLogout}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;