import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "../../store/useUser";
import toast from "react-hot-toast";
import {
  X, Loader2, User, LogOut, Phone,
  Calendar, MapPin, Sparkles, Clock, Settings, ShieldCheck,
  ThumbsUp, ThumbsDown, Info, Heart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../utils/api";

function Profileuser() {
  const token = useUser((state) => state.token);
  const actionLogout = useUser((state) => state.actionLogout);
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openEdit, setOpenEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "", gender: "", phone: "", birth_time: "", birth_place: "",
  });

  const [thaiBirthDate, setThaiBirthDate] = useState({ day: "", month: "", year: "" });

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear() + 543;
    return Array.from({ length: 120 }, (_, i) => currentYear - i);
  }, []);

  const months = [
    { value: "01", label: "มกราคม" }, { value: "02", label: "กุมภาพันธ์" },
    { value: "03", label: "มีนาคม" }, { value: "04", label: "เมษายน" },
    { value: "05", label: "พฤษภาคม" }, { value: "06", label: "มิถุนายน" },
    { value: "07", label: "กรกฎาคม" }, { value: "08", label: "สิงหาคม" },
    { value: "09", label: "กันยายน" }, { value: "10", label: "ตุลาคม" },
    { value: "11", label: "พฤศจิกายน" }, { value: "12", label: "ธันวาคม" }
  ];

  const daysInMonth = useMemo(() => {
    if (!thaiBirthDate.month || !thaiBirthDate.year) return 31;
    const yearAD = parseInt(thaiBirthDate.year) - 543;
    const month = parseInt(thaiBirthDate.month);
    return new Date(yearAD, month, 0).getDate();
  }, [thaiBirthDate.month, thaiBirthDate.year]);

  useEffect(() => {
    if (!token) navigate("/loginuser");
  }, [token, navigate]);

  useEffect(() => {
    if (token) fetchProfile();
  }, [token]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.post("/api/auth/detial");
      const info = res.data?.info?.[0] || null;
      setProfile(info);
      if (info) {
        setForm({
          name: info.name || "", gender: info.gender || "", phone: info.phone || "",
          birth_time: info.birth_time?.slice(0, 5) || "", birth_place: info.birth_place || "",
        });
        if (info.birth_date) {
          const dateOnly = info.birth_date.split('T')[0];
          const [y, m, d] = dateOnly.split("-");
          setThaiBirthDate({ year: y, month: m, day: parseInt(d).toString() });
        }
      }
    } catch {
      toast.error("ดาวน์โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!form.name.trim()) return toast.error("กรุณาระบุชื่อ-นามสกุล");
    if (form.phone.length !== 10) return toast.error("เบอร์โทรศัพท์ต้องครบ 10 หลัก");

    try {
      setSaving(true);
      const formattedDate = `${thaiBirthDate.year}-${thaiBirthDate.month}-${thaiBirthDate.day.padStart(2, '0')}`;
      const payload = { ...form, birth_date: formattedDate };
      await api.put("/api/auth/editProfile", payload);
      toast.success("อัปเดตข้อมูลสำเร็จ ✨");
      setOpenEdit(false);
      fetchProfile();
    } catch (err) {
      toast.error("ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setSaving(false);
    }
  };

  if (!token || loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin"></div>
        <Heart className="absolute inset-0 m-auto text-rose-500 animate-pulse" size={24} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-rose-50/30 text-slate-800 antialiased font-sans pb-10">
      {/* HEADER SECTION */}
      <div className="relative h-72 md:h-80 bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 overflow-hidden">
        <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 5, 0] }} transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-white/20 rounded-full blur-3xl" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg mb-2">{profile?.name}</h1>
            <div className="px-6 py-2 bg-white/20 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg inline-flex items-center gap-2">
              <Sparkles size={20} className="text-yellow-300 animate-pulse" />
              <span className="font-black text-white text-base md:text-lg">{profile?.main_element}</span>
            </div>
          </motion.div>
        </div>
      </div>

      <main className="container mx-auto max-w-2xl px-4 -mt-10 relative z-20">
        <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] shadow-[0_20px_50px_rgba(244,63,94,0.1)] border border-white overflow-hidden">
          
          {/* ✨ ELEMENT SUMMARY */}
          <div className="grid grid-cols-2 p-2 gap-2 border-b border-rose-50 bg-rose-50/20">
            <ElementBox title="ธาตุที่ส่งเสริม" elements={profile?.favorable_elements} type="up" />
            <ElementBox title="ธาตุควรหลีกเลี่ยง" elements={profile?.unfavorable_elements} type="down" />
          </div>

          <div className="px-8 py-8 flex items-center justify-between">
            <h2 className="font-black text-2xl bg-gradient-to-r from-rose-600 to-orange-500 bg-clip-text text-transparent">ข้อมูลดวงชะตา</h2>
            <motion.button whileHover={{ rotate: 90 }} onClick={() => setOpenEdit(true)} className="p-3 bg-rose-50 text-rose-500 rounded-2xl shadow-sm"><Settings size={22} /></motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 px-4 pb-4 gap-2">
            <InfoCard label="ชื่อเล่น/นาม" value={profile?.name} icon={<User className="text-blue-400" />} />
            <InfoCard label="เพศ" value={profile?.gender === 'male' ? 'ชาย' : 'หญิง'} icon={<ShieldCheck className="text-purple-400" />} />
            <InfoCard label="เบอร์โทรศัพท์" value={profile?.phone} icon={<Phone className="text-emerald-400" />} />
            <InfoCard label="วันเกิด (พ.ศ.)" value={profile?.birth_date?.split('T')[0]} icon={<Calendar className="text-orange-400" />} />
            <InfoCard label="เวลาตกฟาก" value={profile?.birth_time?.slice(0, 5)} icon={<Clock className="text-pink-400" />} />
            <InfoCard label="สถานที่เกิด" value={profile?.birth_place} icon={<MapPin className="text-rose-400" />} />
          </div>

          <div className="p-8 space-y-4">
            <button onClick={() => setOpenEdit(true)} className="w-full py-5 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-rose-200 active:scale-[0.98] transition-all">แก้ไขข้อมูลส่วนตัว</button>
            <button onClick={() => { actionLogout(); navigate("/loginuser"); }} className="w-full py-4 text-rose-300 font-bold hover:text-rose-600 transition-colors flex items-center justify-center gap-2"><LogOut size={18} /> ออกจากระบบ</button>
          </div>
        </div>
      </main>

      {/* 🌈 FULL MODAL EDIT - ALL FIELDS BACK! */}
      <AnimatePresence>
        {openEdit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-rose-900/40 backdrop-blur-md" onClick={() => setOpenEdit(false)} />

            <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-8 md:p-10 shadow-3xl overflow-y-auto max-h-[95vh]"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 to-orange-400"></div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-3xl text-slate-800 tracking-tighter">อัปเดตพื้นดวง</h3>
                <button onClick={() => setOpenEdit(false)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-500"><X size={24} /></button>
              </div>

              <div className="space-y-5">
                <ModernInput label="ชื่อ-นามสกุล" value={form.name} onChange={(v)=>setForm({...form,name:v})} />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase ml-2 tracking-widest">เพศ</label>
                    <select value={form.gender} onChange={(e)=>setForm({...form, gender:e.target.value})}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-rose-200 rounded-2xl p-4 font-bold outline-none transition-all appearance-none">
                      <option value="male">ชาย</option>
                      <option value="female">หญิง</option>
                    </select>
                  </div>
                  <ModernInput label="เบอร์โทรศัพท์" value={form.phone} onChange={(v)=>setForm({...form, phone: v.replace(/[^0-9]/g, "").slice(0,10)})} maxLength={10} />
                </div>

                {/* 📅 วันเดือนปีเกิด (พ.ศ.) */}
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase ml-2 tracking-widest">วัน/เดือน/ปีเกิด (พ.ศ.)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <select value={thaiBirthDate.year} onChange={(e)=>setThaiBirthDate({...thaiBirthDate, year: e.target.value})} className="bg-slate-50 p-3.5 rounded-2xl font-bold text-sm outline-none focus:border-rose-200 border-2 border-transparent transition-all">
                      <option value="">ปี พ.ศ.</option>
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select value={thaiBirthDate.month} onChange={(e)=>setThaiBirthDate({...thaiBirthDate, month: e.target.value})} className="bg-slate-50 p-3.5 rounded-2xl font-bold text-sm outline-none focus:border-rose-200 border-2 border-transparent transition-all">
                      <option value="">เดือน</option>
                      {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <select value={thaiBirthDate.day} onChange={(e)=>setThaiBirthDate({...thaiBirthDate, day: e.target.value})} className="bg-slate-50 p-3.5 rounded-2xl font-bold text-sm outline-none focus:border-rose-200 border-2 border-transparent transition-all">
                      <option value="">วันที่</option>
                      {Array.from({ length: daysInMonth }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase ml-2 tracking-widest">เวลาตกฟาก</label>
                    <input type="time" value={form.birth_time} onChange={(e)=>setForm({...form, birth_time: e.target.value})}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-rose-200 rounded-2xl p-4 font-bold outline-none" />
                  </div>
                  <ModernInput label="สถานที่เกิด" value={form.birth_place} onChange={(v)=>setForm({...form,birth_place:v})} />
                </div>

                <button onClick={handleUpdateProfile} disabled={saving}
                  className="w-full bg-slate-900 hover:bg-rose-600 text-white py-5 rounded-[1.5rem] font-black text-xl transition-all shadow-xl shadow-rose-200 flex items-center justify-center gap-3 mt-4">
                  {saving ? <Loader2 className="animate-spin"/> : "บันทึกข้อมูลดวงใหม่ ✨"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- 🌟 SUB-COMPONENTS ---------- */

function ElementBox({ title, elements, type }) {
  const isUp = type === "up";
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm flex flex-col items-center text-center">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 shadow-inner ${isUp ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
        {isUp ? <ThumbsUp size={24}/> : <ThumbsDown size={24}/>}
      </div>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>{title}</p>
      <div className="flex flex-wrap justify-center gap-1.5">
        {elements?.map(el => (
          <span key={el} className={`px-3 py-1 text-[11px] font-black rounded-lg ${isUp ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>{el}</span>
        ))}
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="p-5 bg-white border border-rose-50 rounded-[2rem] hover:shadow-lg transition-all group">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50/50 flex items-center justify-center group-hover:scale-110 transition-transform">
          {React.cloneElement(icon, { size: 22 })}
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-0.5">{label}</p>
          <p className="font-black text-slate-700 text-sm md:text-base">{value || "-"}</p>
        </div>
      </div>
    </div>
  );
}

function ModernInput({ label, value, onChange, maxLength }) {
  return (
    <div className="space-y-2 w-full text-left">
      <label className="text-[11px] font-black text-slate-400 uppercase ml-2 tracking-widest">{label}</label>
      <input type="text" value={value} onChange={(e)=>onChange(e.target.value)} maxLength={maxLength}
        className="w-full bg-slate-50 border-2 border-transparent focus:border-rose-200 rounded-2xl p-4 font-bold text-slate-700 transition-all outline-none" />
    </div>
  );
}

export default Profileuser;