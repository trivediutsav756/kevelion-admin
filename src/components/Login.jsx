// // components/Login.jsx
// import React, { useState } from 'react';

// const Login = ({ onLogin }) => {
//   const [credentials, setCredentials] = useState({
//     email: '',
//     password: ''
//   });
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');

//   // Demo credentials for testing
//   const demoCredentials = {
//     email: 'admin@gmail.com',
//     password: 'admin123'
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setError('');

//     // Simulate API call delay
//     setTimeout(() => {
//       if (credentials.email === demoCredentials.email && credentials.password === demoCredentials.password) {
//         // Successful login
//         const user = {
//           id: 1,
//           name: 'Admin User',
//           email: credentials.email,
//           role: 'Administrator'
//         };
//         onLogin(user);
//       } else {
//         setError('Wrong Id , Pass');
//       }
//       setIsLoading(false);
//     }, 1000);
//   };

//   const handleDemoLogin = () => {
//     setCredentials(demoCredentials);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
//       <div className="max-w-md w-full">
//         {/* Logo and Title */}
//         <div className="text-center mb-8">
//           <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-xl mb-4">
//             <span className="text-white text-2xl font-bold">R</span>
//           </div>
//           <h1 className="text-3xl font-bold text-gray-800 mb-2">Retaillian</h1>
//           <p className="text-gray-600">Hardware Management System</p>
//         </div>

//         {/* Login Form */}
//         <div className="bg-white rounded-xl shadow-lg p-8">
//           <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Welcome Back</h2>
          
//           {error && (
//             <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
//               <p className="text-red-600 text-sm">{error}</p>
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Email Address
//               </label>
//               <input
//                 type="email"
//                 value={credentials.email}
//                 onChange={(e) => setCredentials({...credentials, email: e.target.value})}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="Enter your email"
//                 required
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Password
//               </label>
//               <input
//                 type="password"
//                 value={credentials.password}
//                 onChange={(e) => setCredentials({...credentials, password: e.target.value})}
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 placeholder="Enter your password"
//                 required
//               />
//             </div>

//             <div className="flex items-center justify-between">
//               <label className="flex items-center">
//                 <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
//                 <span className="ml-2 text-sm text-gray-600">Remember me</span>
//               </label>
//               <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
//                 Forgot password?
//               </a>
//             </div>

//             <button
//               type="submit"
//               disabled={isLoading}
//               className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {isLoading ? (
//                 <div className="flex items-center justify-center">
//                   <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
//                   Signing in...
//                 </div>
//               ) : (
//                 'Sign In'
//               )}
//             </button>
//           </form>

//           {/* Demo Login Button */}
//           <div className="mt-6 pt-6 border-t border-gray-200">
//             <button
//               onClick={handleDemoLogin}
//               className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
//             >
             
//             </button>
//             <p className="text-xs text-gray-500 text-center mt-2">
            
//             </p>
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="text-center mt-8">
//           <p className="text-gray-500 text-sm">
//             © 2024 Retaillian. All rights reserved.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;

// components/Login.jsx
import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [isSeller, setIsSeller] = useState(false);
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Demo credentials for testing
  const demoCredentials = {
    admin: {
      email: 'admin@example.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin'
    },
    seller: {
      email: 'seller@example.com',
      password: 'seller123',
      name: 'Seller User',
      role: 'seller'
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate API call delay
    setTimeout(() => {
      const userType = isSeller ? 'seller' : 'admin';
      const validUser = demoCredentials[userType];
      
      console.log('🔍 Login Attempt:', {
        userType,
        email: credentials.email,
        expectedEmail: validUser.email
      });
      
      if (credentials.email === validUser.email && credentials.password === validUser.password) {
        // Successful login
        const user = {
          id: isSeller ? 2 : 1,
          name: validUser.name,
          email: credentials.email,
          role: validUser.role  // ✅ This sets 'admin' or 'seller'
        };
        
        console.log('✅ Login Successful! User Data:', user);
        console.log('✅ User Role:', user.role);
        
        onLogin(user);
      } else {
        setError('Invalid email or password');
        console.log('❌ Login Failed: Invalid credentials');
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleDemoLogin = () => {
    const userType = isSeller ? 'seller' : 'admin';
    setCredentials({
      email: demoCredentials[userType].email,
      password: demoCredentials[userType].password
    });
    console.log(`🎯 Demo ${userType} credentials filled`);
  };

  const toggleUserType = () => {
    setIsSeller(!isSeller);
    setCredentials({ email: '', password: '' });
    setError('');
    console.log(`🔄 Switched to: ${!isSeller ? 'Seller' : 'Admin'} mode`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-xl mb-4">
            <span className="text-white text-2xl font-bold">R</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Retaillian</h1>
          <p className="text-gray-600">Hardware Management System</p>
          
          {/* User Type Toggle - ✅ FIXED */}
          <div className="mt-4 flex justify-center">
            <div className="bg-gray-100 p-1 rounded-lg inline-flex">
              <button
                type="button"
                onClick={() => {
                  if (isSeller) {
                    toggleUserType(); // Switch to Admin
                  }
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  !isSeller 
                    ? 'bg-white shadow-sm text-gray-900' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isSeller) {
                    toggleUserType(); // Switch to Seller
                  }
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  isSeller 
                    ? 'bg-white shadow-sm text-gray-900' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Seller
              </button>
            </div>
          </div>
          
          {/* ✅ Added: Current Mode Indicator */}
          <div className="mt-2">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {isSeller ? '🛍️ Seller Mode' : '👤 Admin Mode'}
            </span>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            {isSeller ? 'Seller' : 'Admin'} Login
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

          {/* Demo Login Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Use Demo {isSeller ? 'Seller' : 'Admin'} Credentials
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              {isSeller 
                ? 'Demo: seller@example.com / seller123' 
                : 'Demo: admin@example.com / admin123'}
            </p>
          </div>
        </div>

        {/* Footer */}
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