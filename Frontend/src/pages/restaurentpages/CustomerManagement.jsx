import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import useEcom from "../../store/bazi"
import React from "react"
import {
  Users, Search, Loader2, Phone, User as UserIcon, 
  TrendingUp, Filter, X, ChevronRight, Calendar
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import apiRestaurant from "../../utils/apiRestaurant";

const elementColors = {
  "ไม้": "bg-emerald-500/10 text-emerald-600 border-emerald-200 shadow-emerald-100",
  "ไฟ": "bg-rose-500/10 text-rose-600 border-rose-200 shadow-rose-100",
  "ดิน": "bg-amber-500/10 text-amber-600 border-amber-200 shadow-amber-100",
  "ทอง": "bg-slate-500/10 text-slate-600 border-slate-300 shadow-slate-100",
  "น้ำ": "bg-sky-500/10 text-sky-600 border-sky-200 shadow-sky-100",
}

function CustomerManagement() {
  const token = useEcom((state) => state.token)
  const navigate = useNavigate()

  const [users, setUsers] = useState([])
  const [elementsSummary, setElementsSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedElement, setSelectedElement] = useState("ทั้งหมด")

  useEffect(() => {
    if (!token) navigate("/loginrestaurent")
  }, [token, navigate])

  useEffect(() => {
    if (token) fetchCustomers()
  }, [token])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const res = await apiRestaurant.post("/api/restaurant/restaurantUser");
      setUsers(res.data.user || [])
      setElementsSummary(res.data.element || [])
    } catch (err) {
      console.error("Fetch error:", err)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.main_element?.includes(searchTerm);
    const matchesElement = selectedElement === "ทั้งหมด" || user.main_element === selectedElement;
    return matchesSearch && matchesElement;
  })

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-slate-900 font-line antialiased pb-24 w-full overflow-x-hidden">
      
      {/* --- HERO SECTION --- */}
      <div className="relative bg-[#0F0808] pt-12 pb-24 md:pt-24 md:pb-48 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
           <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-red-600/20 rounded-full blur-[140px]" />
           <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-xl backdrop-blur-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-black text-amber-200 uppercase tracking-widest">Customer Intelligence</span>
              </div>
              <h1 className="text-5xl md:text-8xl font-black text-white tracking-tight leading-[0.9]">
                The <span className="text-amber-400 serif italic font-normal">Registry</span>
              </h1>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-2xl">
              <div className="relative flex items-center bg-white/10 border border-white/20 backdrop-blur-3xl rounded-[1.8rem] p-2 shadow-2xl">
                <div className="pl-4 pr-3 text-amber-400"><Search size={22} /></div>
                <input 
                  type="text"
                  placeholder="ค้นหาชื่อ หรือธาตุ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-white placeholder:text-slate-500 py-3 focus:outline-none font-bold text-lg"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 -mt-12 relative z-20">
        
        {/* --- SMART FILTER CARDS (Horizontal Scroll on Mobile) --- */}
        <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar -mx-6 px-6 md:grid md:grid-cols-6 md:mx-0 md:px-0">
          {/* "ALL" Card */}
          <motion.div
            onClick={() => setSelectedElement("ทั้งหมด")}
            className={`flex-shrink-0 cursor-pointer p-5 rounded-[1.5rem] border transition-all flex flex-col justify-between w-20 h-20 md:w-auto md:h-22 ${selectedElement === "ทั้งหมด" ? 'bg-red-950 border-red-900 shadow-xl' : 'bg-white border-slate-100 shadow-sm'}`}
          >
            <div>
              <p className={`text-[9px] font-black uppercase tracking-widest ${selectedElement === "ทั้งหมด" ? 'text-amber-200/60' : 'text-slate-400'}`}>ทั้งหมด</p>
              <h3 className={`text-3xl font-black ${selectedElement === "ทั้งหมด" ? 'text-white' : 'text-slate-900'}`}>{users.length}</h3>
            </div>
          </motion.div>

          {/* Element Cards */}
          {elementsSummary.map((item, idx) => (
            <motion.div
              key={idx}
              onClick={() => setSelectedElement(item.main_element)}
              className={`flex-shrink-0 cursor-pointer p-5 rounded-[1.5rem] border transition-all flex flex-col justify-between w-20 h-20 md:w-auto md:h-22 ${selectedElement === item.main_element ? 'bg-white border-amber-400 ring-4 ring-amber-400/10 shadow-lg' : 'bg-white border-slate-100 shadow-sm'}`}
            >
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ธาตุ{item.main_element}</p>
                <h3 className="text-3xl font-black text-slate-900">{item.count}</h3>
              </div>
            </motion.div>
          ))}
        </div>

        {/* --- MAIN CONTENT --- */}
        <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden mt-6">
          
          <div className="px-6 py-8 md:px-10 border-b border-slate-50 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-950 rounded-2xl flex items-center justify-center text-amber-400 shadow-lg shadow-red-900/10">
                  <Filter size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 leading-tight">
                    {selectedElement === "ทั้งหมด" ? "รายชื่อสมาชิก" : `กลุ่มธาตุ${selectedElement}`}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">รวม {filteredUsers.length} ท่าน</p>
                </div>
             </div>
          </div>

          {loading ? (
            <div className="py-32 flex flex-col items-center">
              <Loader2 className="animate-spin text-amber-500 mb-4" size={40} />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Loading...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-32 text-center">
              <UserIcon size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-bold">ไม่พบข้อมูล</p>
            </div>
          ) : (
            <div>
              {/* DESKTOP TABLE (Hidden on Mobile) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="pl-12 py-6 text-[11px] font-black uppercase text-slate-400 tracking-wider">ข้อมูลลูกค้า</th>
                      <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-wider text-center">ดิถีธาตุ</th>
                      <th className="px-8 py-6 text-[11px] font-black uppercase text-slate-400 tracking-wider">ธาตุส่งเสริม</th>
                      <th className="pr-12 py-6 text-[11px] font-black uppercase text-slate-400 tracking-wider text-right">วันที่เข้าร่วม</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-all group">
                        <td className="pl-12 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#0F0808] text-amber-400 flex items-center justify-center text-xl font-black">
                              {user.name?.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-black text-slate-800 text-lg mb-0.5">{user.name}</h4>
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><Phone size={12} /> {user.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                          <span className={`px-4 py-2 rounded-xl text-[11px] font-black border tracking-wide inline-block ${elementColors[user.main_element]}`}>
                            ธาตุ{user.main_element}
                          </span>
                        </td>
                        <td className="px-8">
                          <div className="flex gap-1.5 flex-wrap">
                            {user.favorable_elements?.map((el, i) => (
                              <span key={i} className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase ${elementColors[el] || 'bg-white'}`}>{el}</span>
                            ))}
                          </div>
                        </td>
                        <td className="pr-12 text-right">
                           <div className="text-sm font-black text-slate-800">{new Date(user.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* MOBILE LIST VIEW (Clean & Premium) */}
              <div className="md:hidden divide-y divide-slate-50">
                {filteredUsers.map((user) => (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={user.id} className="p-6 active:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-[#0F0808] text-amber-400 flex items-center justify-center text-xl font-black shadow-lg">
                          {user.name?.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800 text-lg leading-tight">{user.name}</h4>
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 mt-1">
                            <Phone size={12} className="text-amber-500" /> {user.phone}
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black border ${elementColors[user.main_element]}`}>
                        ธาตุ{user.main_element}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-50">
                      <div className="flex gap-1.5 items-center overflow-x-auto no-scrollbar">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter mr-1">ธาตุส่งเสริม:</span>
                        {user.favorable_elements?.slice(0, 3).map((el, i) => (
                          <span key={i} className={`px-2 py-1 rounded-lg text-[9px] font-black border ${elementColors[el] || 'bg-white'}`}>
                            {el}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Calendar size={12} />
                        <span className="text-[10px] font-bold">{new Date(user.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,700&display=swap');
        .serif { font-family: 'Playfair Display', serif; }
        .font-line { font-family: 'Line Seed', sans-serif; }
      `}</style>
    </div>
  )
}

export default CustomerManagement