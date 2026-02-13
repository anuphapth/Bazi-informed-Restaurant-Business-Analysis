import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAdmin from "../../store/useAdmin";
import apiAdmin from "../../utils/apiAdmin";
import { 
  X, Loader2, PlusCircle, LayoutDashboard, 
  Store, Mail, Lock, ShieldCheck, Sparkles 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function Dashboardadmin() {
  const token = useAdmin((state) => state.token);
  const user = useAdmin((state) => state.user);
  const navigate = useNavigate();

  const [openForm, setOpenForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (!token) navigate("/loginadmin");
  }, [token, navigate]);

  if (!token) return null;

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) {
      return alert("กรุณากรอกข้อมูลให้ครบ");
    }
    try {
      setLoading(true);
      await apiAdmin.post("/api/admin/restaurant/create", form);
      alert("สร้างร้านอาหารสำเร็จแล้ว 🎉");
      setForm({ name: "", email: "", password: "" });
      setOpenForm(false);
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถสร้างร้านอาหารได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFBFA] text-slate-900 antialiased">
      
      {/* HEADER SECTION - สไตล์เดียวกับ Restaurant Dashboard */}
      <div className="relative bg-blue-950 pt-16 pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 to-blue-950"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2 text-amber-400">
                <ShieldCheck size={20} />
                <span className="text-xs font-black uppercase tracking-[0.3em]">System Administrator</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                แผงควบคุมผู้ดูแลระบบ
              </h1>
              <p className="text-blue-200/70 mt-2 font-medium">จัดการและเพิ่มร้านอาหารในเครือของคุณ</p>
            </div>

            <button
              onClick={() => setOpenForm(true)}
              className="group flex items-center gap-3 bg-amber-500 hover:bg-amber-400 text-blue-950 px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-amber-500/20 active:scale-95"
            >
              <PlusCircle size={22} className="group-hover:rotate-90 transition-transform" />
              <span>Register Restaurant</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <main className="max-w-7xl mx-auto px-6 -mt-12 relative z-20 pb-20">
        <div className="bg-white rounded-[3rem] p-10 shadow-2xl shadow-blue-950/5 border border-amber-100 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-50 text-blue-700 rounded-3xl flex items-center justify-center shadow-inner">
                <LayoutDashboard size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800">ยินดีต้อนรับคุณ {user?.name}</h2>
                <p className="text-slate-400 font-medium text-sm italic">พร้อมสำหรับการจัดการระบบในวันนี้</p>
              </div>
           </div>
        </div>
      </main>

      {/* REGISTER MODAL - สไตล์สไลด์ขึ้นจากด้านล่าง */}
      <AnimatePresence>
        {openForm && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-blue-950/60 backdrop-blur-md" 
              onClick={() => setOpenForm(false)} 
            />
            
            {/* Modal Card */}
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative bg-white w-full h-[85vh] sm:h-auto max-w-lg rounded-t-[3.5rem] sm:rounded-[3.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10 md:p-12">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Register</h2>
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">เพิ่มร้านอาหารใหม่</p>
                    <div className="w-12 h-1.5 bg-amber-500 rounded-full mt-3"></div>
                  </div>
                  <button 
                    onClick={() => setOpenForm(false)} 
                    className="w-12 h-12 bg-slate-50 rounded-2xl text-slate-400 hover:text-blue-700 flex items-center justify-center transition-all hover:rotate-90"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Store size={14} /> ชื่อร้านอาหาร
                    </label>
                    <input
                      type="text"
                      placeholder="Restaurant name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-400 focus:bg-white rounded-2xl px-6 py-4 text-slate-800 font-bold outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Mail size={14} /> อีเมลเข้าระบบ
                    </label>
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-400 focus:bg-white rounded-2xl px-6 py-4 text-slate-800 font-bold outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Lock size={14} /> รหัสผ่านเริ่มต้น
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-400 focus:bg-white rounded-2xl px-6 py-4 text-slate-800 font-bold outline-none transition-all"
                    />
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-blue-950 hover:bg-blue-900 text-amber-400 rounded-2xl font-black text-xl py-5 transition-all shadow-xl shadow-blue-900/10 flex items-center justify-center gap-3 mt-6 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        <span>ยืนยันการสร้างร้าน</span>
                        <Sparkles size={20} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Dashboardadmin;