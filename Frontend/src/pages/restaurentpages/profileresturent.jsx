import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import useEcom from "../../store/bazi";
import toast from "react-hot-toast";
import {
  Mail, Hash, X, Settings, Eye, EyeOff, Copy, Store,
  ExternalLink, Loader2, Lock, LogOut, Sparkles, QrCode
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";

const API_URL = import.meta.env.VITE_API_URL;

function Profilerestaurent() {
  const token = useEcom((state) => state.token);
  const actionLogout = useEcom((state) => state.actionLogout);
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openEdit, setOpenEdit] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userLink, setUserLink] = useState("");
  const [copyLoading, setCopyLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!token) navigate("/loginrestaurent");
  }, [token, navigate]);

  useEffect(() => {
    if (token) fetchProfile();
  }, [token]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/api/restaurant/info`, {}, {
        headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" }
      });
      const info = res.data?.info?.[0] || null;
      setProfile(info);
      if (info) {
        setForm({ name: info.name || "", email: info.email || "", password: "", confirmPassword: "" });
      }
    } catch {
      toast.error("โหลดข้อมูลไม่สำเร็จโปรดล็อดอินใหม่");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUserLink = async (openQR = false) => {
    try {
      setCopyLoading(true);
      const res = await axios.post(`${API_URL}/api/restaurant/create/user`, {}, {
        headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true" }
      });
      const link = res.data?.url || res.data;
      if (!link) return toast.error("ไม่พบลิงก์ที่สร้าง");
      setUserLink(link);
      await navigator.clipboard.writeText(link);
      toast.success("คัดลอกลิงก์เรียบร้อยแล้ว 📋");
      if (openQR) setShowQR(true);
    } catch (err) {
      toast.error("สร้างลิงก์ไม่สำเร็จ");
    } finally {
      setCopyLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!form.name.trim()) return toast.error("กรุณากรอกชื่อร้าน");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return toast.error("รูปแบบอีเมลไม่ถูกต้อง");

    if (form.password) {
      if (form.password.length < 8) return toast.error("รหัสผ่านต้องมี 8 ตัวขึ้นไป");
      if (form.password !== form.confirmPassword) return toast.error("รหัสผ่านยืนยันไม่ตรงกัน");
    }

    try {
      setSaving(true);
      const payload = { name: form.name, email: form.email };
      if (form.password) payload.password = form.password;
      await axios.put(`${API_URL}/api/restaurant/edit`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("บันทึกข้อมูลสำเร็จ 🎉");
      setOpenEdit(false);
      setForm(prev => ({ ...prev, password: "", confirmPassword: "" }));
      fetchProfile();
    } catch {
      toast.error("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  if (!token || loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FCFBFA]">
      <Loader2 className="animate-spin text-red-700" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FCFBFA] text-slate-900 antialiased font-line pb-20">
      
      {/* --- HEADER --- */}
      <div className="relative h-56 md:h-72 bg-red-950 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/50 to-red-950"></div>
        
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
             <Store size={32} />
          </motion.div>
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight drop-shadow-md">
            {profile?.name}
          </h1>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <main className="container mx-auto max-w-2xl px-4 -mt-10 relative z-20">
        
        {/* Quick Actions - 3 Column Layout */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
          <button onClick={() => setOpenEdit(true)} 
            className="bg-white p-4 rounded-[2rem] shadow-xl shadow-red-900/5 border border-amber-100 flex flex-col items-center gap-2 active:scale-95 transition-all">
            <div className="p-3 bg-red-50 text-red-700 rounded-2xl"><Settings size={22} /></div>
            <span className="font-black text-slate-800 text-[11px] md:text-xs">ตั้งค่าร้าน</span>
          </button>
          
          <Link to="/restaurent" 
            className="bg-white p-4 rounded-[2rem] shadow-xl shadow-red-900/5 border border-amber-100 flex flex-col items-center gap-2 active:scale-95 transition-all">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><ExternalLink size={22} /></div>
            <span className="font-black text-slate-800 text-[11px] md:text-xs">หน้าเว็บร้าน</span>
          </Link>

          <button onClick={() => userLink ? setShowQR(true) : handleCreateUserLink(true)} 
            className="bg-white p-4 rounded-[2rem] shadow-xl shadow-red-900/5 border border-amber-100 flex flex-col items-center gap-2 active:scale-95 transition-all">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><QrCode size={22} /></div>
            <span className="font-black text-slate-800 text-[11px] md:text-xs">QR Code</span>
          </button>
        </div>

        {/* Copy Link Button */}
        <button 
          onClick={() => handleCreateUserLink(false)} 
          disabled={copyLoading} 
          className="w-full mb-6 bg-red-900 text-amber-400 p-5 rounded-[2rem] shadow-xl shadow-red-900/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
        >
          {copyLoading ? <Loader2 size={20} className="animate-spin" /> : <Copy size={20} />}
          <span className="font-black text-lg">คัดลอกลิงก์ร้านค้า</span>
        </button>

        {userLink && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-emerald-50 border border-emerald-100 p-5 rounded-[2rem]">
            <p className="text-[10px] font-black text-emerald-600 uppercase mb-2 tracking-widest text-center">พร้อมใช้งาน! ลิงก์สำหรับลูกค้าของคุณ:</p>
            <div className="bg-white border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
              <p className="text-xs font-mono text-slate-500 truncate flex-1 leading-relaxed">{userLink}</p>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            </div>
          </motion.div>
        )}

        {/* Profile Details Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-red-900/10 border border-amber-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-3">
             <div className="w-1.5 h-6 bg-red-700 rounded-full"></div>
             <h2 className="font-black text-lg text-slate-800 uppercase tracking-tight">ข้อมูลบัญชีร้านค้า</h2>
          </div>

          <div className="divide-y divide-slate-50">
            <InfoRow icon={<Store />} label="ชื่อสถานประกอบการ" value={profile?.name} />
            <InfoRow icon={<Mail />} label="อีเมลติดต่อ" value={profile?.email} />
            <InfoRow icon={<Hash />} label="รหัสประจำตัวร้าน" value={profile?.id ? `#${profile.id.toString().padStart(4, '0')}` : null} />
          </div>

          <div className="p-6 bg-slate-50/50">
            <button
              onClick={() => { actionLogout(); navigate("/loginrestaurent"); }}
              className="w-full flex items-center justify-center gap-2 py-4 text-slate-400 font-black hover:text-red-700 transition-colors"
            >
              <LogOut size={18} /> ออกจากระบบ
            </button>
          </div>
        </div>
      </main>

      {/* --- QR CODE MODAL --- */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-red-950/80 backdrop-blur-md" onClick={() => setShowQR(false)} />
            
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl text-center"
            >
              <button onClick={() => setShowQR(false)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-red-50 transition-colors">
                <X size={20} />
              </button>

              <div className="mb-6 mt-4">
                <div className="bg-red-50 w-16 h-16 rounded-3xl flex items-center justify-center text-red-700 mx-auto mb-4">
                  <Sparkles size={32} />
                </div>
                <h3 className="font-black text-xl text-slate-900 tracking-tight">QR Code ร้านของคุณ</h3>
                <p className="text-slate-500 text-sm mt-1">ให้ลูกค้าสแกนเพื่อเข้าสู่เมนูมงคล</p>
              </div>

              <div className="bg-white border-4 border-amber-50 p-6 rounded-[2.5rem] inline-block mb-6 shadow-inner">
                <QRCodeSVG 
                  value={userLink} 
                  size={200} 
                  level="H" 
                  includeMargin={false}
                  imageSettings={{
                    src: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png", // ไอคอนช้อนส้อมเล็กๆ ตรงกลาง
                    x: undefined,
                    y: undefined,
                    height: 24,
                    width: 24,
                    excavate: true,
                  }}
                />
              </div>

              <div className="space-y-3">
                <button 
                  onClick={() => { navigator.clipboard.writeText(userLink); toast.success("คัดลอกลิงก์แล้ว"); }}
                  className="w-full bg-red-50 text-red-700 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Copy size={18} /> คัดลอกลิงก์
                </button>
                <button onClick={() => setShowQR(false)} className="w-full text-slate-400 font-bold py-2 text-sm">
                  ปิดหน้าต่าง
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- EDIT MODAL --- */}
      <AnimatePresence>
        {openEdit && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-red-950/60 backdrop-blur-sm" onClick={() => setOpenEdit(false)} />
            
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="relative bg-white w-full max-w-xl rounded-t-[2.5rem] md:rounded-[3rem] p-8 md:p-10 shadow-2xl overflow-y-auto max-h-[92vh]"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-2xl text-slate-900">แก้ไขข้อมูลร้าน</h3>
                <button onClick={() => setOpenEdit(false)} className="p-2 bg-slate-100 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <ModernInput label="ชื่อร้าน" icon={<Store size={18} />} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                <ModernInput label="อีเมล" icon={<Mail size={18} />} value={form.email} onChange={(v) => setForm({ ...form, email: v })} />

                <div className="bg-slate-50 p-6 rounded-[2rem] space-y-5 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">เปลี่ยนรหัสผ่านใหม่</p>
                  <ModernInput
                    label="รหัสผ่านใหม่"
                    icon={<Lock size={18} />}
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(v) => setForm({ ...form, password: v })}
                    hasToggle
                    onToggle={() => setShowPassword(!showPassword)}
                    isShowing={showPassword}
                  />
                  <ModernInput
                    label="ยืนยันรหัสผ่านใหม่"
                    icon={<Lock size={18} />}
                    type={showPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(v) => setForm({ ...form, confirmPassword: v })}
                  />
                </div>

                <button
                  onClick={handleUpdateProfile}
                  disabled={saving}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-red-950 py-5 rounded-2xl font-black text-xl transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center active:scale-[0.98]"
                >
                  {saving ? <Loader2 className="animate-spin" size={24} /> : "บันทึกข้อมูลร้าน"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub-Components ---
function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-5 px-8 py-6 hover:bg-slate-50/50 transition-colors group">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-red-700 group-hover:bg-red-50 transition-all">
        {React.cloneElement(icon, { size: 22 })}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="font-bold text-slate-800 text-base">{value || "-"}</p>
      </div>
    </div>
  );
}

function ModernInput({ label, icon, value, onChange, type = "text", hasToggle, onToggle, isShowing }) {
  return (
    <div className="space-y-2 w-full">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors">
          {icon}
        </div>
        <input
          type={type}
          className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-12 font-bold text-slate-700 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`ระบุ${label}`}
        />
        {hasToggle && (
          <button type="button" onClick={onToggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-600">
            {isShowing ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}

export default Profilerestaurent;