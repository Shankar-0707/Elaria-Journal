// // /frontend/src/App.js

// import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { AuthProvider } from './context/AuthContext';


// // Example Pages (You need to create these files)
// import LoginPage from './pages/LoginPage';
// import SignupPage from './pages/SignupPage';
// import DashboardPage from './pages/DashboardPage';
// import ProtectedRoute from './components/ProtectRoute';
// import JournalSessionPage from './pages/JournalSessionPage';

// function App() {
//   return (
//     <Router>
//       <AuthProvider>
//         <div className="App">
//           <Routes>
//             {/* Public Routes */}
//             <Route path="/login" element={<LoginPage />} />
//             <Route path="/signup" element={<SignupPage />} />

//             {/* Protected Routes */}
//             <Route path="/" element={<ProtectedRoute />}>
//               <Route index element={<DashboardPage />} />
//               <Route path="/journal-session" element={<JournalSessionPage />} />
//               {/* <Route path="/insights" element=Create InsightsPage /> */}
//               {/* <Route path="/journals" element=Create JournalsListPage /> */}
//               {/* Add Journal Session, Insights routes here */}
//             </Route>
            
//           </Routes>
//         </div>
//       </AuthProvider>
//     </Router>
//   );
// }

// export default App;



// /frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';


// Example Pages (Now fully imported)
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectRoute';
import JournalSessionPage from './pages/JournalSessionPage';
import InsightsPage from './pages/InsightPage'; 
import JournalsListPage from './pages/JournalListPage'; 

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute />}>
              {/* Dashboard is the index of the protected area */}
              <Route index element={<DashboardPage />} /> 
              
              {/* Main Features */}
              <Route path="/journal-session" element={<JournalSessionPage />} />
              <Route path="/insights" element={<InsightsPage />} />         {/* <-- NEW ROUTE */}
              <Route path="/journals" element={<JournalsListPage />} />     {/* <-- NEW ROUTE */}
            </Route>
            
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;