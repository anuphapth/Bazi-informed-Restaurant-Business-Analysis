import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useAdmin from "../../store/useAdmin";
import apiAdmin from "../../utils/apiAdmin";
import {
  X, Loader2, PlusCircle, Store, User, Search,
  Building2, ChevronLeft, ChevronRight, Trash2, Edit3,
  UserCheck, ChevronDown, AlertCircle, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { create } from "zustand";

// --- 1. Toast Store (Zustand) ---
const useToast = create((set) => ({
  toasts: [],
  addToast: (message, type = "success") => {
    const id = Date.now();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

// --- 2. Toast UI Components ---
const ToastContainer = () => {
  const { toasts, removeToast } = useToast();
  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            className="pointer-events-auto relative overflow-hidden bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 min-w-[320px] flex items-center gap-3"
          >
            <div className={`p-2 rounded-xl ${toast.type === "success" ? "bg-emerald-50 text-emerald-500" : "bg-red-50 text-red-500"}`}>
              {toast.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            </div>
            <p className="flex-1 font-bold text-slate-700 text-sm">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="text-slate-300 hover:text-slate-500 transition-colors">
              <X size={18} />
            </button>
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 3, ease: "linear" }}
              className={`absolute bottom-0 left-0 h-1 ${toast.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// --- 3. Main Dashboard Component ---
function Dashboardadmin() {
  const token = useAdmin((state) => state.token);
  const user = useAdmin((state) => state.user);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [openForm, setOpenForm] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [openRestaurantId, setOpenRestaurantId] = useState(null);
  const [openEditMember, setOpenEditMember] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [searchRestaurant, setSearchRestaurant] = useState("");
  const [searchMember, setSearchMember] = useState("");
  const [memberPages, setMemberPages] = useState({});
  const itemsPerPage = 10;

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  
  // ปรับปรุง State ของ Member ให้รองรับข้อมูลครบชุด
  const [editMember, setEditMember] = useState({ 
    userId: "", 
    name: "", 
    gender: "male", 
    phone: "", 
    birth_date: "", 
    birth_time: "", 
    birth_place: "" 
  });

  const fetchRestaurants = useCallback(async () => {
    try {
      setInitialLoading(true);
      const res = await apiAdmin.post("/api/admin/restaurant");
      setRestaurants(res.data);
    } catch (err) {
      addToast("ไม่สามารถโหลดข้อมูลร้านอาหารได้", "error");
    } finally {
      setTimeout(() => setInitialLoading(false), 800);
    }
  }, [addToast]);

  useEffect(() => {
    if (!token) navigate("/loginadmin");
    else fetchRestaurants();
  }, [token, navigate, fetchRestaurants]);

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((res) =>
      res.restaurant_name.toLowerCase().includes(searchRestaurant.toLowerCase()) ||
      res.restaurant_id.toString().includes(searchRestaurant)
    );
  }, [restaurants, searchRestaurant]);

  const toggleRestaurant = (id) => {
    setOpenRestaurantId(openRestaurantId === id ? null : id);
    setSearchMember("");
  };

  const handleSubmitRestaurant = async () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "กรุณากรอกชื่อร้าน";
    if (!form.email.trim()) errors.email = "กรุณากรอกอีเมล";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (!form.password || form.password.length < 8) errors.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setActionLoading(true);
      await apiAdmin.post("/api/admin/restaurant/create", form);
      addToast(`เพิ่มร้าน ${form.name} สำเร็จแล้ว`, "success");
      setOpenForm(false);
      setForm({ name: "", email: "", password: "" });
      fetchRestaurants();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "";
      if (errorMsg.includes("email") || err.response?.status === 400) {
        setFormErrors({ email: "อีเมลนี้ถูกใช้งานไปแล้ว" });
      } else {
        addToast("เกิดข้อผิดพลาดจากระบบ", "error");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRestaurant = async (id) => {
    if (!window.confirm("ต้องการลบร้านอาหารนี้ใช่หรือไม่? ข้อมูลสมาชิกจะถูกลบทั้งหมด")) return;
    try {
      setActionLoading(true);
      await apiAdmin.delete("/api/admin/restaurant/delete", { data: { restaurantId: id } });
      setRestaurants(prev => prev.filter(r => r.restaurant_id !== id));
      addToast("ลบร้านอาหารสำเร็จ", "success");
    } catch (err) {
      addToast("ลบไม่สำเร็จ กรุณาลองใหม่", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // แก้ไข API PUT สำหรับสมาชิก
  const handleEditMemberSubmit = async () => {
    try {
      setActionLoading(true);
      // ส่ง Object ข้อมูลสมาชิกทั้งหมดตาม Format ที่กำหนด
      await apiAdmin.put("/api/admin/restaurant/edit/user", editMember);
      setOpenEditMember(false);
      addToast("แก้ไขข้อมูลสมาชิกสำเร็จ", "success");
      fetchRestaurants();
    } catch (err) {
      addToast("แก้ไขไม่สำเร็จ: " + (err.response?.data?.message || "ตรวจสอบข้อมูลอีกครั้ง"), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMember = async (userId) => {
    if (!window.confirm("ลบสมาชิกคนนี้ออกจากระบบ?")) return;
    try {
      setActionLoading(true);
      await apiAdmin.delete("/api/admin/restaurant/delete/user", { data: { userId } });
      addToast("ลบสมาชิกแล้ว", "success");
      fetchRestaurants();
    } catch (err) {
      addToast("ลบสมาชิกไม่สำเร็จ", "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased min-w-[320px] overflow-x-hidden">
      <ToastContainer />
      
      <AnimatePresence>
        {actionLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] bg-white/60 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
              <Loader2 className="animate-spin text-amber-400" size={24} />
              <span className="font-bold tracking-wide">กำลังประมวลผล...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="relative bg-[#0F172A] pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase border border-blue-500/30">Admin Console</span>
              <h1 className="text-2xl md:text-5xl lg:text-6xl font-black text-white mt-2 md:mt-4 leading-tight">
                จัดการระบบ <span className="text-amber-400 italic font-serif">Management</span>
              </h1>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => { setFormErrors({}); setOpenForm(true); }}
              className="flex items-center justify-center gap-3 bg-white text-slate-900 px-6 py-4 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-black shadow-2xl hover:bg-amber-400 transition-colors group w-full md:w-auto"
            >
              <PlusCircle size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              <span>เพิ่มร้านอาหารใหม่</span>
            </motion.button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 -mt-12 md:-mt-16 relative z-20 pb-20">
        <div className="bg-white rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 shadow-xl border border-white flex flex-col lg:flex-row items-center justify-between gap-6 mb-6 md:mb-10">
          <div className="flex items-center gap-4 md:gap-6 w-full lg:w-auto">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg text-white shrink-0">
              <User size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-[10px] md:text-sm font-medium">ยินดีต้อนรับ</p>
              <h2 className="text-base md:text-xl font-black text-slate-800 truncate">คุณ {user?.name}</h2>
            </div>
          </div>

          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="ค้นหาชื่อร้าน หรือ ID..."
              value={searchRestaurant}
              onChange={(e) => setSearchRestaurant(e.target.value)}
              className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl md:rounded-2xl py-3 md:py-4 pl-12 md:pl-14 pr-4 font-bold transition-all outline-none text-sm"
            />
          </div>

          <div className="hidden lg:block text-center shrink-0">
            <p className="text-[10px] font-black text-slate-400 uppercase">ร้านทั้งหมด</p>
            <p className="text-2xl font-black text-blue-600">{restaurants.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl md:rounded-[3rem] p-4 md:p-10 shadow-xl border border-slate-100">
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <Building2 className="text-amber-500" size={20} />
            <h3 className="text-lg md:text-xl font-black text-slate-800">รายชื่อร้านอาหารในเครือ</h3>
          </div>

          {initialLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid gap-3 md:gap-4">
              <AnimatePresence>
                {filteredRestaurants.map((restaurant, idx) => {
                  const filteredMembers = restaurant.members?.filter(m => m.name.toLowerCase().includes(searchMember.toLowerCase())) || [];
                  const currentPage = memberPages[restaurant.restaurant_id] || 1;
                  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
                  const paginatedMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

                  return (
                    <motion.div key={restaurant.restaurant_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="border border-slate-100 rounded-xl md:rounded-[2rem] overflow-hidden bg-white hover:border-blue-200 transition-all shadow-sm">
                      <div className="flex items-center">
                        <button onClick={() => toggleRestaurant(restaurant.restaurant_id)} className={`flex-1 flex justify-between items-center px-4 py-4 md:px-8 md:py-6 transition-all ${openRestaurantId === restaurant.restaurant_id ? "bg-blue-50/50" : "hover:bg-slate-50"}`}>
                          <div className="flex items-center gap-3 md:gap-4 truncate">
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-2xl flex items-center justify-center font-black text-xs md:text-base shrink-0 ${openRestaurantId === restaurant.restaurant_id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                              {restaurant.restaurant_id}
                            </div>
                            <div className="text-left truncate">
                              <p className="font-black text-slate-700 text-sm md:text-lg truncate">{restaurant.restaurant_name}</p>
                              <p className="text-[10px] md:text-xs text-slate-400 font-bold">{restaurant.members?.length || 0} สมาชิก</p>
                            </div>
                          </div>
                          <motion.div animate={{ rotate: openRestaurantId === restaurant.restaurant_id ? 180 : 0 }}>
                            <ChevronDown size={18} />
                          </motion.div>
                        </button>
                        <button onClick={() => handleDeleteRestaurant(restaurant.restaurant_id)} className="mr-2 md:mr-6 p-2 md:p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                      </div>

                      <AnimatePresence>
                        {openRestaurantId === restaurant.restaurant_id && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-slate-50/50 border-t border-slate-100 overflow-hidden">
                            <div className="p-4 md:p-8 space-y-4">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={14} />
                                <input placeholder="ค้นหาสมาชิก..." className="w-full pl-10 pr-4 py-2 rounded-lg border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold" value={searchMember} onChange={(e) => setSearchMember(e.target.value)} />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                                {paginatedMembers.map(member => (
                                  <div key={member.userId} className="p-3 bg-white rounded-xl border border-slate-100 flex justify-between items-center shadow-sm hover:border-blue-100 transition-all">
                                    <div className="flex items-center gap-3 truncate">
                                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0">{member.name.charAt(0)}</div>
                                      <div className="truncate">
                                        <p className="font-bold text-xs text-slate-700 truncate">{member.name}</p>
                                        <p className="text-[9px] text-slate-400">{member.phone}</p>
                                      </div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                      {/* ส่งข้อมูล member ไปที่ state ทันที */}
                                      <button onClick={() => { 
                                        setEditMember({
                                          userId: member.userId,
                                          name: member.name || "",
                                          gender: member.gender || "male",
                                          phone: member.phone || "",
                                          birth_date: member.birth_date || "",
                                          birth_time: member.birth_time || "",
                                          birth_place: member.birth_place || ""
                                        }); 
                                        setOpenEditMember(true); 
                                      }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md"><Edit3 size={12} /></button>
                                      <button onClick={() => handleDeleteMember(member.userId)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-md"><Trash2 size={12} /></button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-4">
                                  <button disabled={currentPage === 1} onClick={() => setMemberPages(prev => ({ ...prev, [restaurant.restaurant_id]: currentPage - 1 }))} className="p-1 disabled:opacity-30"><ChevronLeft size={16}/></button>
                                  <span className="text-[10px] font-black px-3 py-1 bg-white rounded-full shadow-sm">หน้า {currentPage} / {totalPages}</span>
                                  <button disabled={currentPage === totalPages} onClick={() => setMemberPages(prev => ({ ...prev, [restaurant.restaurant_id]: currentPage + 1 }))} className="p-1 disabled:opacity-30"><ChevronRight size={16}/></button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      {/* --- MODAL: ADD RESTAURANT --- */}
      <AnimatePresence>
        {openForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setOpenForm(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-6 md:p-10">
              <div className="text-center mb-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4"><Store size={28} /></div>
                <h2 className="text-xl md:text-3xl font-black text-slate-900">เพิ่มร้านอาหาร</h2>
                <p className="text-slate-400 text-xs mt-1">กรุณากรอกข้อมูลเพื่อสร้างบัญชีร้านใหม่</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">ชื่อร้านอาหาร</label>
                  <input className={`w-full bg-slate-50 rounded-xl px-4 py-3 md:py-4 font-bold outline-none border-2 transition-all text-sm ${formErrors.name ? "border-red-400" : "border-transparent focus:border-blue-500"}`} placeholder="เช่น บะหมี่ฮ่องเต้" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  {formErrors.name && <p className="text-[10px] text-red-500 font-bold ml-1">{formErrors.name}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">อีเมล (Username)</label>
                  <input type="email" className={`w-full bg-slate-50 rounded-xl px-4 py-3 md:py-4 font-bold outline-none border-2 transition-all text-sm ${formErrors.email ? "border-red-400" : "border-transparent focus:border-blue-500"}`} placeholder="example@mail.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  {formErrors.email && <p className="text-[10px] text-red-500 font-bold ml-1">{formErrors.email}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">รหัสผ่าน</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} className={`w-full bg-slate-50 rounded-xl px-4 py-3 md:py-4 pr-12 font-bold outline-none border-2 transition-all text-sm ${formErrors.password ? "border-red-400" : "border-transparent focus:border-blue-500"}`} placeholder="อย่างน้อย 8 ตัวอักษร" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPassword ? <X size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                  {formErrors.password && <p className="text-[10px] text-red-500 font-bold ml-1">{formErrors.password}</p>}
                </div>
                <button onClick={handleSubmitRestaurant} disabled={actionLoading} className="w-full bg-blue-600 text-white py-4 md:py-5 rounded-2xl font-black shadow-lg mt-2 hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {actionLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "ยืนยันการสร้างร้าน"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: EDIT MEMBER (แก้ไขใหม่ให้ครบทุกฟิลด์) --- */}
      <AnimatePresence>
        {openEditMember && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setOpenEditMember(false)} />
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50 shrink-0">
                <h2 className="text-lg md:text-xl font-black flex items-center gap-2"><UserCheck className="text-amber-500" /> แก้ไขสมาชิก</h2>
                <button onClick={() => setOpenEditMember(false)} className="p-2 hover:bg-red-50 hover:text-red-500 transition-colors"><X size={20} /></button>
              </div>
              
              <div className="p-6 md:p-10 space-y-4 overflow-y-auto custom-scrollbar">
                {/* ชื่อ */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">ชื่อ-นามสกุล</label>
                  <input className="w-full bg-slate-50 rounded-xl px-4 py-3 font-bold border-2 border-transparent focus:border-blue-500 text-sm outline-none" 
                    value={editMember.name} onChange={e => setEditMember({...editMember, name: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* เพศ */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">เพศ</label>
                    <select className="w-full bg-slate-50 rounded-xl px-4 py-3 font-bold border-2 border-transparent focus:border-blue-500 text-sm outline-none"
                      value={editMember.gender} onChange={e => setEditMember({...editMember, gender: e.target.value})}>
                      <option value="male">ชาย (male)</option>
                      <option value="female">หญิง (female)</option>
                    </select>
                  </div>
                  {/* เบอร์โทร */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">เบอร์โทรศัพท์</label>
                    <input className="w-full bg-slate-50 rounded-xl px-4 py-3 font-bold border-2 border-transparent focus:border-blue-500 text-sm outline-none" 
                      maxLength={10} value={editMember.phone} onChange={e => setEditMember({...editMember, phone: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* วันเกิด พ.ศ. */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">วันเกิด (ปปปป-ดด-วว)</label>
                    <input className="w-full bg-slate-50 rounded-xl px-4 py-3 font-bold border-2 border-transparent focus:border-blue-500 text-sm outline-none" 
                      placeholder="2546-11-08" value={editMember.birth_date} onChange={e => setEditMember({...editMember, birth_date: e.target.value})} />
                  </div>
                  {/* เวลาเกิด */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">เวลาเกิด</label>
                    <input type="time" className="w-full bg-slate-50 rounded-xl px-4 py-3 font-bold border-2 border-transparent focus:border-blue-500 text-sm outline-none" 
                      value={editMember.birth_time} onChange={e => setEditMember({...editMember, birth_time: e.target.value})} />
                  </div>
                </div>

                {/* สถานที่เกิด */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">สถานที่เกิด</label>
                  <input className="w-full bg-slate-50 rounded-xl px-4 py-3 font-bold border-2 border-transparent focus:border-blue-500 text-sm outline-none" 
                    placeholder="ระบุโรงพยาบาลหรือจังหวัด" value={editMember.birth_place} onChange={e => setEditMember({...editMember, birth_place: e.target.value})} />
                </div>

                <button onClick={handleEditMemberSubmit} className="w-full bg-slate-900 text-amber-400 py-4 rounded-xl font-black mt-4 shadow-xl hover:bg-slate-800 transition-colors shrink-0">
                  บันทึกการแก้ไข
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        @media (max-width: 320px) { h1 { font-size: 1.2rem !important; } }
      `}</style>
    </div>
  );
}

export default Dashboardadmin;