import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { 
  User, LogOut, ChefHat, Users, ScanLine, 
  Menu, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useEcom from '../store/bazi'
import toast from "react-hot-toast"
import LogoImg from '../assets/logo.svg' 

const Restaurentnav = () => {
  const [isOpen, setIsOpen] = useState(false)
  const actionLogout = useEcom((state) => state.actionLogout)
  const navigate = useNavigate()
  const location = useLocation()

  const toggleMenu = () => setIsOpen(!isOpen)
  
  // ฟังก์ชันเช็ค Path ที่แอคทีฟ
  const isActive = (path) => location.pathname === path

  const handleLogout = () => {
    if(window.confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
      actionLogout()
      navigate('/restaurent')
      toast.success("ออกจากระบบแล้ว")
    }
  }

  const menuVariants = {
    closed: { opacity: 0, height: 0, transition: { duration: 0.2 } },
    opened: { opacity: 1, height: "auto", transition: { duration: 0.3 } }
  }

  // รายการเมนู: แยก /scanner ออกมาตามโครงสร้างที่คุณต้องการ
  const navItems = [
    { path: '/restaurent', icon: ChefHat, label: 'จัดการเมนู' },
    { path: '/scanner', icon: ScanLine, label: 'สแกนลูกค้า' }, // แก้ไข Path ตรงนี้
    { path: '/restaurent/customer', icon: Users, label: 'รายชื่อลูกค้า' },
  ]

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 shadow-sm border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 h-16 flex justify-between items-center">
          
          {/* LOGO */}
          <Link to="/restaurent" className="flex items-center gap-3 group">
            <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-xl group-hover:scale-105 transition-transform duration-300 bg-slate-50">
              <img src={LogoImg} alt="Bazi Logo" className="w-7 h-7 object-contain" />
            </div>
            <div className="flex flex-col">
              <h1 className="font-black text-slate-800 text-base md:text-lg leading-none tracking-tight">
                BAZI <span className="text-rose-500">RESTAURANT</span>
              </h1>
            </div>
          </Link>

          {/* DESKTOP MENU */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                  isActive(item.path) 
                  ? 'bg-rose-50 text-rose-500 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}

            <div className="w-[1px] h-5 bg-slate-200 mx-2"></div>

            <Link to='/restaurent/profilerestaurent' className={`p-2.5 rounded-xl transition-all ${isActive('/restaurent/profilerestaurent') ? 'bg-rose-50 text-rose-500' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`}>
              <User size={20} />
            </Link>
            <button onClick={handleLogout} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
              <LogOut size={20} />
            </button>
          </nav>

          {/* MOBILE MENU BUTTON */}
          <div className="md:hidden">
            <button 
              onClick={toggleMenu} 
              className={`p-2 rounded-xl transition-all ${isOpen ? 'bg-rose-50 text-rose-500' : 'text-slate-500 bg-slate-50'}`}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU DROPDOWN */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial="closed" animate="opened" exit="closed" variants={menuVariants}
              className="absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-xl overflow-hidden md:hidden"
            >
              <div className="p-4 space-y-2">
                {navItems.map((item) => (
                  <Link 
                    key={item.path}
                    to={item.path} 
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-sm font-bold transition-all ${
                      isActive(item.path) ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-600 active:bg-slate-50'
                    }`}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                ))}
                
                <div className="pt-2 grid grid-cols-2 gap-3">
                  <Link 
                    to='/restaurent/profilerestaurent' 
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-center gap-2 p-4 rounded-2xl font-bold active:scale-95 transition-all ${isActive('/restaurent/profilerestaurent') ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-50 text-slate-700'}`}
                  >
                    <User size={18} className={isActive('/restaurent/profilerestaurent') ? "text-rose-600" : "text-rose-500"} />
                    <span className="text-xs">โปรไฟล์ร้าน</span>
                  </Link>
                  <button 
                    onClick={() => { setIsOpen(false); handleLogout(); }}
                    className="flex items-center justify-center gap-2 p-4 bg-rose-50 rounded-2xl text-rose-600 font-bold active:scale-95 transition-all"
                  >
                    <LogOut size={18} />
                    <span className="text-xs">ออกระบบ</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      
      <div className="h-16"></div>
    </>
  )
}

export default Restaurentnav