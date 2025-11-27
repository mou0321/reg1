import React from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { UserView } from './pages/UserView';
import { AdminDashboard } from './pages/AdminDashboard';
import { ShieldCheck, LayoutGrid } from 'lucide-react';

const Navigation = () => {
  const location = useLocation();
  const isAdmin = location.pathname.includes('admin');
  // const { toggleAdmin } = useApp(); // Removed incorrect property

  return (
    <nav className="fixed top-0 left-0 w-full z-50 pointer-events-none">
       {/* Use pointer-events-none for the container to not block clicks, but auto for the button */}
      <div className="flex justify-end p-4 pointer-events-auto">
        <Link 
          to={isAdmin ? "/" : "/admin"}
          className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg backdrop-blur-md border transition-all ${
            isAdmin 
            ? 'bg-teal-600/90 text-white border-teal-500 hover:bg-teal-700' 
            : 'bg-slate-800/90 text-white border-slate-700 hover:bg-slate-900'
          }`}
        >
          {isAdmin ? <LayoutGrid className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          <span className="text-sm font-medium">{isAdmin ? "回到前台" : "管理後台"}</span>
        </Link>
      </div>
    </nav>
  );
};

const AppContent = () => {
  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<UserView />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </>
  );
};

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AppProvider>
  );
}