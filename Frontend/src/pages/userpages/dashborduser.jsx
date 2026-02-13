import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, ChevronRight, User, Loader2, Utensils, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useUser from "../../store/useUser";
import api from "../../utils/api"


const API_URL = import.meta.env.VITE_API_URL;
const FALLBACK_IMAGE = "https://res.cloudinary.com/dqqkzucir/image/upload/v1770964754/depositphotos_289179526-stock-photo-white-torn-rolled-paper-light_drbebs.webp";

const elementInfo = {
  wood: { nameTh: "ไม้", color: "from-emerald-600 to-teal-800", bg: "bg-emerald-50", text: "text-emerald-700" },
  fire: { nameTh: "ไฟ", color: "from-red-500 to-orange-600", bg: "bg-red-50", text: "text-red-700" },
  earth: { nameTh: "ดิน", color: "from-amber-600 to-yellow-800", bg: "bg-amber-50", text: "text-amber-700" },
  metal: { nameTh: "ทอง", color: "from-slate-400 to-gray-600", bg: "bg-slate-100", text: "text-slate-700" },
  water: { nameTh: "น้ำ", color: "from-blue-700 to-indigo-900", bg: "bg-blue-50", text: "text-blue-700" },
};

const baziMap = { ไม้: "wood", ไฟ: "fire", ดิน: "earth", ทอง: "metal", น้ำ: "water" };

export default function Dashboarduser() {
  const navigate = useNavigate();
  const token = useUser((state) => state.token);
  const user = useUser((state) => state.user);

  const [prediction, setPrediction] = useState("");
  const [likedMenus, setLikedMenus] = useState([]);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [selectedMenu, setSelectedMenu] = useState(null);

  useEffect(() => {
    if (!token) navigate("/loginuser");
  }, [token, navigate]);

  const elementKey = useMemo(() => {
    if (!user?.baziElement) return null;
    return baziMap[user.baziElement];
  }, [user]);

  useEffect(() => {
    if (token) {
      fetchPrediction();
      fetchLikedMenus(page);
    }
  }, [token, page]);

  const fetchPrediction = async () => {
    try {
      setLoadingPrediction(true);
      const res = await api.post("/api/auth/prediction");
      setPrediction(res.data.message || "");
    } catch (err) {
      console.error(err);
      setPrediction("วันนี้โชคลาภกำลังเดินทางมาหาคุณ");
    } finally {
      setLoadingPrediction(false);
    }
  };


  const fetchLikedMenus = async (pageNum) => {
    try {
      setLoadingMenus(true);
      const res = await api.post("/api/auth/menu/like", { page: pageNum });
      setLikedMenus(res.data.menu || []);
      setLastPage(res.data.lastPage || 1);
    } catch (err) {
      console.error(err);
      setLikedMenus([]);
    } finally {
      setLoadingMenus(false);
    }
  };


  if (!token) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 antialiased text-slate-900 overflow-x-hidden">
      <main className="container mx-auto px-4 md:px-10 pt-6 md:pt-16 max-w-7xl space-y-8 md:space-y-12">
        <HeaderSection user={user} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-4 xl:col-span-3 h-full">
            <ElementSection elementKey={elementKey} />
          </div>
          <div className="lg:col-span-8 xl:col-span-9 h-full">
            <PredictionSection prediction={prediction} loading={loadingPrediction} />
          </div>
        </div>

        <RecommendedMenusSection
          menus={likedMenus}
          loading={loadingMenus}
          page={page}
          lastPage={lastPage}
          setPage={setPage}
          setSelectedMenu={setSelectedMenu}
        />
      </main>

      <AnimatePresence>
        {selectedMenu && (
          <MenuModal menu={selectedMenu} onClose={() => setSelectedMenu(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================= UI COMPONENTS ================= */

function HeaderSection({ user }) {
  return (
    <header className="space-y-1">
      <span className="text-amber-600 font-bold tracking-[0.2em] text-[10px] md:text-xs uppercase block">
        Heavenly Luck Dashboard
      </span>
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
        <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
          ยินดีต้อนรับ,
        </h1>
        <h1 className="text-xl md:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-700 to-amber-600 truncate">
          {user?.displayName || user?.name}
        </h1>
      </div>
    </header>
  );
}

function ElementSection({ elementKey }) {
  if (!elementKey) return null;
  const el = elementInfo[elementKey];

  return (
    <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl shadow-red-900/5 border border-amber-100 h-full flex flex-col items-center lg:items-start text-center lg:text-left relative overflow-hidden">
      <div className={`w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br ${el.color} rounded-[1.5rem] flex items-center justify-center text-white text-xl md:text-2xl font-black shadow-lg mb-4 ring-4 ring-amber-50`}>
        {el.nameTh}
      </div>
      <h2 className="text-xl md:text-2xl font-black text-red-900 tracking-tight">ธาตุเจ้าเรือน: {el.nameTh}</h2>
      <p className="text-slate-500 mt-2 text-xs md:text-sm leading-relaxed font-medium">พลังงานส่งผลต่อสุขภาพและโชคลาภ</p>
    </div>
  );
}

function PredictionSection({ prediction, loading }) {
  return (
    <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-xl shadow-red-900/5 border border-amber-100 h-full flex flex-col justify-center border-l-8 border-l-red-700 relative overflow-hidden">
      <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-full w-fit mb-4">
        <Sparkles size={14} className="fill-current text-amber-500" />
        <span className="text-[10px] font-black uppercase tracking-widest">คำทำนายวันนี้</span>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-slate-400 py-2 animate-pulse">
          <Loader2 className="animate-spin text-amber-500" size={24} />
          <p className="text-sm font-bold">กำลังคำนวณตำแหน่งดวงดาว...</p>
        </div>
      ) : (
        <p className="text-lg md:text-xl font-black text-slate-800 leading-snug md:leading-relaxed">
          "{prediction || "วันนี้เป็นวันมมงคล เหมาะแก่การเปิดรับโชคลาภ"}"
        </p>
      )}
    </div>
  );
}

function RecommendedMenusSection({ menus, loading, page, lastPage, setPage, setSelectedMenu }) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3 border-l-4 border-red-700 pl-4">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
          เมนูมงคล<span className="text-amber-600">แนะนำ</span>
        </h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
          {[1, 2, 3, 4].map(i => <div key={i} className="aspect-[3/4] bg-slate-200 animate-pulse rounded-[1.5rem]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {menus.map((menu) => (
            <MenuCard key={menu.id} menu={menu} onClick={() => setSelectedMenu(menu)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center pt-6">
        <div className="flex items-center gap-1 bg-red-950 p-1.5 rounded-full shadow-lg">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-amber-500 disabled:opacity-20 transition-all"
          >
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <span className="px-3 text-white font-bold text-xs md:text-sm">
            {page} / {lastPage}
          </span>
          <button
            disabled={page === lastPage}
            onClick={() => setPage(p => p + 1)}
            className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-amber-500 disabled:opacity-20 transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}

function MenuCard({ menu, onClick }) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="group cursor-pointer bg-white rounded-[1.2rem] md:rounded-[2rem] shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-100 flex flex-col h-full"
    >
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <img
          src={menu.image_url || FALLBACK_IMAGE}
          alt={menu.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[80%]">
          {menu.element?.slice(0, 1).map(el => (
            <span key={el} className="px-1.5 py-0.5 bg-red-900/90 text-amber-400 backdrop-blur-sm rounded-md text-[8px] md:text-[10px] font-black uppercase tracking-tighter">
              ธาตุ{el}
            </span>
          ))}
        </div>
      </div>

      <div className="p-3 md:p-6 flex flex-col flex-grow justify-between gap-1">
        <h3 className="text-[13px] md:text-lg font-black text-slate-900 leading-tight line-clamp-2 min-h-[2.5em] md:min-h-0">
          {menu.name}
        </h3>
        <div className="flex justify-between items-center mt-auto">
          <span className="text-[14px] md:text-xl font-black text-red-700">฿{menu.price}</span>
          <ArrowRight size={14} className="text-slate-300 md:block hidden" />
        </div>
      </div>
    </motion.div>
  );
}

function MenuModal({ menu, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-yellow-100/10 backdrop-blur-sm" />
      <motion.div
        initial={{ y: "100%" }} md={{ y: 0, scale: 0.9 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: "100%" }}
        className="bg-white rounded-t-[2rem] md:rounded-[3rem] w-full max-w-4xl overflow-hidden relative shadow-2xl z-10 max-h-[92vh] overflow-y-auto"
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-20 bg-red-50 text-red-900 p-2 rounded-full shadow-md">
          <X size={20} />
        </button>

        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 h-100 md:h-[600px]">
            <img src={menu.image_url || FALLBACK_IMAGE} className="w-full h-full object-cover" />
          </div>
          <div className="p-6 md:p-12 md:w-1/2 space-y-6">
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                {menu.element?.map(el => (
                  <span
                    key={el}
                    className="text-[10px] font-black text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-100 uppercase tracking-widest"
                  >
                    ธาตุ{el}
                  </span>
                ))}
              </div>

              <h2 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight">
                {menu.name}
              </h2>

              <p className="text-2xl font-black text-amber-600">
                ฿{menu.price}
              </p>

              {/* ✅ description */}
              <p className="text-sm md:text-base text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {menu.description || "ไม่มีรายละเอียดเพิ่มเติม"}
              </p>
            </div>




            <button onClick={onClose} className="w-full py-4 bg-red-900 text-amber-400 rounded-xl md:rounded-2xl font-black text-sm md:text-lg uppercase tracking-widest border border-amber-500/20">
              รับทราบเมนูมงคล
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}