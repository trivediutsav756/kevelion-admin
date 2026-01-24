// App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
 
// Admin Components
import AdminSidebar from './components/Sidebar';
import AdminDashboard from './components/Dashboard';
import Categories from './components/Categories';
import SubCategories from './components/SubCategories';
import AdminProducts from './components/Products';
import Sellers from './components/Sellers';
import Buyer from './components/Buyer';
import AdminOrderDashboard from './components/Order';
import Reports from './components/Reports';
import Subscription from './components/Subscription'; // ✅ Added Subscription import
import Slider from './components/Slider';
import Faqs from './components/Faqs'; // ✅ Added Faqs import


// Uncomment these when you create the components
// import BuyerDashboard from './seller/BuyerDashboard';
 
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
 
  // Check for existing authentication on app load
  useEffect(() => {
    const savedAuth = localStorage.getItem('retaillian_auth');
    const savedUser = localStorage.getItem('retaillian_user');
   
    if (savedAuth === 'true' && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setIsAuthenticated(true);
      setUser(parsedUser);
      
      // DEBUG: Check user role on load
      console.log('🔍 Loaded User:', parsedUser);
      console.log('🔍 User Role:', parsedUser?.role || parsedUser?.user_type);
    }
  }, []);
 
  const handleLogin = (userData) => {
    // DEBUG: Check login data
    console.log('✅ Login Data:', userData);
    console.log('✅ User Role:', userData?.role || userData?.user_type);
    
    setIsAuthenticated(true);
    setUser(userData);
    // Save authentication state to localStorage
    localStorage.setItem('retaillian_auth', 'true');
    localStorage.setItem('retaillian_user', JSON.stringify(userData));
  };
 
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setActiveTab('dashboard');
    setSidebarOpen(false);
    // Clear authentication state from localStorage
    localStorage.removeItem('retaillian_auth');
    localStorage.removeItem('retaillian_user');
  };
 
  // Render content based on user role
  const renderAdminContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case 'categories':
        return <Categories />;
      case 'subcategories':
        return <SubCategories />;
      case 'products':
        return <AdminProducts />;
      case 'sellers':
        return <Sellers />;
      case 'buyers':
        return <Buyer />;
      case 'orders':
        return <AdminOrderDashboard />;
      case 'reports':
        return <Reports />;
      case 'subscriptions': // ✅ Added subscriptions case
        return <Subscription />;
      case 'sliders':
        return <Slider />;
      case 'faqs':
        return <Faqs />;
      default:
        return <AdminDashboard />;
    }
  };
 
  const renderSellerContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <SellerDashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case 'category':
        return <SellerCategory />;
      case 'subcategory':
        return <SellerSubcategory />;
      case 'products':
        return <SellerProducts />;
      case 'ordermanagement':
        return <OrderManagement />; // ✅ Fixed - Now showing OrderManagement component
      case 'seller':
        return <Seller />;
      case 'buyers':
        // return <BuyerDashboard />;
        return <div className="p-4 bg-yellow-100 rounded">Buyers - Component Not Created Yet</div>;
      default:
        return <SellerDashboard />;
    }
  };
 
  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }
 
  // Determine user role
  const userRole = user?.role || user?.user_type;
  
  // DEBUG: Always log current role
  console.log('🎯 Current User Role:', userRole);
  console.log('🎯 Full User Object:', user);
 
  // Better role checking
  if (!userRole) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error: User role not found!</p>
          <p>Please contact administrator.</p>
          <button 
            onClick={handleLogout}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }
 
  // Render Admin Dashboard
  if (userRole.toLowerCase() === 'admin') {
    console.log('✅ Rendering ADMIN Dashboard');
    return (
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          user={user}
          onLogout={handleLogout}
        />
       
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <div className="lg:hidden bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-gray-800">Admin Dashboard</h1>
            </div>
          </div>
 
          {/* Main Content Area */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6">
            {renderAdminContent()}
          </main>
        </div>
      </div>
    );
  }
 
  // Render Seller Dashboard
  console.log('✅ Rendering SELLER Dashboard');
  return (
    <div className="flex h-screen bg-gray-50">
      <SellerSidebar
        activeSection={activeTab}
        onSectionChange={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        onLogout={handleLogout}
      />
     
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-800">Seller Dashboard</h1>
          </div>
        </div>
 
        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6">
          {renderSellerContent()}
        </main>
      </div>
    </div>
  );
}
 
export default App;