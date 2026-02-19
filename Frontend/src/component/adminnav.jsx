import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, LayoutDashboard, Store, Users } from 'lucide-react';
import useAdmin from '../store/useAdmin';
import toast from "react-hot-toast";
// นำเข้า Logo จาก assets
import LogoImg from '../assets/logo.svg';

const Adminnav = () => {
  const actionLogout = useAdmin((state) => state.actionLogout);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    actionLogout();
    navigate('/admin');
    toast.success("ออกจากระบบแอดมินแล้ว");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 w-full z-50 shadow-sm border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 h-16 flex justify-between items-center">
        
        {/* LOGO SECTION */}
        <Link to="/admin" className="flex items-center gap-3 group">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-xl group-hover:scale-105 transition-transform duration-300">
            <img 
              src={LogoImg} 
              alt="Bazi Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="font-black text-slate-800 text-base md:text-lg leading-none tracking-tight">
              BAZI <span className="text-blue-600">ADMIN</span>
            </h1>
            <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase hidden sm:block">
              Central Management
            </span>
          </div>
        </Link>

        {/* NAVIGATION & ACTIONS SECTION */}
        <div className="flex items-center gap-1 sm:gap-2">
          
          

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all active:scale-90"
            title="ออกจากระบบ"
          >
            <LogOut size={22} />
          </button>
        </div>

      </div>
    </header>
  );
};

export default Adminnav;