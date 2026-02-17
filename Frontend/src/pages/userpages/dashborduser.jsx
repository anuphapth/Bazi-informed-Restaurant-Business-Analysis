import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, ChevronRight, Loader2, X, Tag, Calendar, CheckCircle2, Ticket, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import useUser from "../../store/useUser";
import api from "../../utils/api";
import { io } from "socket.io-client";

const FALLBACK_IMAGE = "https://res.cloudinary.com/dqqkzucir/image/upload/v1770964754/depositphotos_289179526-stock-photo-white-torn-rolled-paper-light_drbebs.webp";

const elementInfo = {
  wood: { nameTh: "ไม้", color: "from-emerald-500 to-teal-700", lightColor: "bg-emerald-50", textColor: "text-emerald-700" },
  fire: { nameTh: "ไฟ", color: "from-rose-500 to-orange-600", lightColor: "bg-rose-50", textColor: "text-rose-700" },
  earth: { nameTh: "ดิน", color: "from-amber-500 to-yellow-700", lightColor: "bg-amber-50", textColor: "text-amber-700" },
  metal: { nameTh: "ทอง", color: "from-slate-300 to-slate-500", lightColor: "bg-slate-50", textColor: "text-slate-700" },
  water: { nameTh: "น้ำ", color: "from-blue-500 to-indigo-700", lightColor: "bg-blue-50", textColor: "text-blue-700" },
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
      setPrediction("วันนี้โชคลาภกำลังเดินทางมาหาคุณ ประตูแห่งโอกาสกำลังเปิดออก");
    } finally {
      setLoadingPrediction(false);
    }
  };

  // ✅ return ข้อมูลกลับมาด้วย เพื่อให้ MenuModal นำไปใช้ต่อได้
  const fetchLikedMenus = async (pageNum) => {
    try {
      setLoadingMenus(true);
      const res = await api.post("/api/auth/menu/like", { page: pageNum });
      const menus = res.data.menu || [];
      setLikedMenus(menus);
      setLastPage(res.data.lastPage || 1);
      return menus;
    } catch (err) {
      console.error(err);
      setLikedMenus([]);
      return [];
    } finally {
      setLoadingMenus(false);
    }
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 antialiased text-slate-900 overflow-x-hidden">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .glass-card { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.3); }
      `}</style>

      <main className="container mx-auto px-4 md:px-8 pt-8 max-w-6xl space-y-10">
        <HeaderSection user={user} />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 h-full">
            <ElementSection elementKey={elementKey} />
          </div>
          <div className="md:col-span-8 h-full">
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
          <MenuModal
            menu={selectedMenu}
            onClose={() => setSelectedMenu(null)}
            // ✅ ส่ง fetchLikedMenus, page, setSelectedMenu ให้ Modal ใช้รีเฟรชและอัปเดตตัวเอง
            fetchLikedMenus={fetchLikedMenus}
            page={page}
            setSelectedMenu={setSelectedMenu}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- UI COMPONENTS ---

function HeaderSection({ user }) {
  return (
    <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-[2px] w-8 bg-amber-500" />
          <span className="text-amber-600 font-bold tracking-[0.2em] text-[10px] uppercase">My Destiny Guide</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
          ยินดีต้อนรับ, <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-amber-600 to-orange-500 italic">
            {user?.displayName || user?.name}
          </span>
        </h1>
      </div>
      <div className="hidden md:block text-right">
        <p className="text-slate-400 text-sm font-medium">สถิติโชคลาภประจำวัน</p>
        <p className="text-slate-900 font-bold">ความโชคดีสูงมาก (98%)</p>
      </div>
    </header>
  );
}

function ElementSection({ elementKey }) {
  if (!elementKey) return null;
  const el = elementInfo[elementKey];
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-full flex flex-col items-center relative overflow-hidden group"
    >
      <div className={`absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br ${el.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
      <div className={`w-20 h-20 bg-gradient-to-br ${el.color} rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-xl mb-6 transform rotate-3 group-hover:rotate-0 transition-transform`}>
        {el.nameTh}
      </div>
      <div className="text-center">
        <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">ธาตุประจำตัวคุณ</span>
        <h2 className="text-2xl font-black text-slate-800 mt-1">ธาตุ{el.nameTh}</h2>
        <div className="flex gap-1 justify-center mt-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= 4 ? el.color : 'bg-slate-200'}`} />)}
        </div>
      </div>
    </motion.div>
  );
}

function PredictionSection({ prediction, loading }) {
  return (
    <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 h-full flex flex-col justify-center relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Sparkles size={120} />
      </div>
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
          <Zap size={18} fill="currentColor" />
        </div>
        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Daily Blessing</span>
      </div>
      {loading ? (
        <div className="space-y-3">
          <div className="h-6 bg-slate-100 rounded-full w-3/4 animate-pulse" />
          <div className="h-6 bg-slate-100 rounded-full w-1/2 animate-pulse" />
        </div>
      ) : (
        <p className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed italic pr-10">
          "{prediction || "วันนี้เป็นวันมงคล เหมาะแก่การเปิดรับสิ่งใหม่ๆ และรับประทานอาหารที่ช่วยเสริมพลังธาตุของคุณ"}"
        </p>
      )}
    </div>
  );
}

function RecommendedMenusSection({ menus, loading, page, lastPage, setPage, setSelectedMenu }) {
  return (
    <section className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900">
            เมนูมงคล<span className="text-red-600">เสริมดวง</span>
          </h2>
          <p className="text-slate-400 text-sm font-medium">คัดสรรตามธาตุและดวงชะตาของคุณในวันนี้</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="aspect-[4/5] bg-slate-100 animate-pulse rounded-[2rem]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {menus.map((menu) => <MenuCard key={menu.id} menu={menu} onClick={() => setSelectedMenu(menu)} />)}
        </div>
      )}

      {lastPage > 1 && (
        <div className="flex justify-center pt-4">
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={20} className="rotate-180" />
            </button>
            <span className="px-4 text-sm font-bold text-slate-700">หน้า {page} จาก {lastPage}</span>
            <button
              disabled={page === lastPage}
              onClick={() => setPage(p => p + 1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function MenuCard({ menu, onClick }) {
  const hasPromo = (menu.canUsePromotion === true || menu.canUsePromotion === 1) && Array.isArray(menu.promotions) && menu.promotions.length > 0;
  const bestPrice = hasPromo ? Math.min(...menu.promotions.map(p => parseFloat(p.total))) : menu.price;

  return (
    <motion.div
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group cursor-pointer bg-white rounded-[2rem] shadow-sm hover:shadow-xl hover:shadow-red-500/5 transition-all duration-500 overflow-hidden border border-slate-100 flex flex-col h-full relative"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img src={menu.image_url || FALLBACK_IMAGE} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="absolute top-4 left-4 flex flex-wrap gap-1.5">
          {menu.element?.map(el => (
            <span key={el} className="px-2.5 py-1 bg-white/90 backdrop-blur-md text-slate-900 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm">
              ธาตุ{el}
            </span>
          ))}
        </div>

        {hasPromo && (
          <div className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">
            OFFER
          </div>
        )}

        <div className="absolute bottom-4 right-4 translate-y-10 group-hover:translate-y-0 transition-transform duration-500">
          <div className="bg-white p-3 rounded-full shadow-xl text-red-600">
            <ArrowRight size={20} />
          </div>
        </div>
      </div>

      <div className="p-5 space-y-2">
        <h3 className="text-base font-bold text-slate-800 line-clamp-1 group-hover:text-red-600 transition-colors">{menu.name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xl font-black text-slate-900">฿{bestPrice}</span>
          {hasPromo && <span className="text-xs text-slate-400 line-through">฿{menu.price}</span>}
        </div>
      </div>
    </motion.div>
  );
}

// --- ส่วนของ MenuModal แบบคลีน (วางแทนที่อันเก่าได้เลย) ---

function MenuModal({ menu: initialMenu, onClose, fetchLikedMenus, page, setSelectedMenu }) {
  const [menuData, setMenuData] = useState(initialMenu);
  const [claimingId, setClaimingId] = useState(null);
  const [showQRMap, setShowQRMap] = useState({});
  const [isUsedSuccess, setIsUsedSuccess] = useState(false);

  useEffect(() => {
    setMenuData(initialMenu);
    setShowQRMap({});
    setIsUsedSuccess(false);
  }, [initialMenu]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL);

    // ✅ 1. บอก Server ว่าเราขอเข้าห้องของร้านนี้ (restaurant_id)
    // สมมติว่าใน menuData มีข้อมูล restaurant_id หรือคุณได้จาก user profile
    if (menuData.restaurant_id) {
      socket.emit("joinRestaurant", String(menuData.restaurant_id));
    }

    // ✅ 2. รอฟังการอัปเดต
    socket.on("couponUpdated", async (data) => {
      console.log("Real-time update received:", data);

      // เช็ค ID คูปองให้ตรงกัน
      const isThisCouponUsed = menuData.promotions?.some(
        (p) => String(p.promotion_id) === String(data.coupon_id)
      );

      if (isThisCouponUsed && data.status === "USED") {
        setIsUsedSuccess(true);
        const freshMenus = await fetchLikedMenus(page);
        const freshMenu = freshMenus.find(m => m.id === menuData.id);
        if (freshMenu) {
          setMenuData(freshMenu);
          setSelectedMenu(freshMenu);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [menuData.id, menuData.restaurant_id]);

  const hasPromo = (menuData.canUsePromotion === true || menuData.canUsePromotion === 1) &&
    Array.isArray(menuData.promotions) && menuData.promotions.length > 0;

  const handleClaimCoupon = async (promoId) => {
    try {
      setClaimingId(promoId);
      await api.post("/api/auth/coupon/add", { promotion_id: promoId });
      const freshMenus = await fetchLikedMenus(page);
      const freshMenu = freshMenus.find(m => m.id === menuData.id);
      if (freshMenu) {
        setMenuData(freshMenu);
        setSelectedMenu(freshMenu);
      }
      setShowQRMap(prev => ({ ...prev, [promoId]: true }));
    } catch (err) {
      console.error("Claim error:", err);
      alert(err.response?.data?.message || "เกิดข้อผิดพลาดในการรับคูปอง");
    } finally {
      setClaimingId(null);
    }
  };

  const toggleQR = (promoId) => {
    setShowQRMap(prev => ({ ...prev, [promoId]: !prev[promoId] }));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" />

      <motion.div
        layoutId={`modal-${menuData.id}`}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] w-full max-w-4xl overflow-hidden relative shadow-2xl z-10 max-h-[90vh] flex flex-col md:flex-row"
      >
        <AnimatePresence>
          {isUsedSuccess && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center text-center p-10">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={56} />
              </motion.div>
              <h3 className="text-3xl font-black text-slate-900">ใช้คูปองสำเร็จ!</h3>
              <p className="text-slate-500 mt-2 text-lg">รายการนี้ได้รับการยืนยันเรียบร้อยแล้ว</p>
              <button onClick={onClose} className="mt-8 bg-slate-900 text-white px-12 py-4 rounded-2xl font-bold hover:bg-emerald-600 transition-colors shadow-lg">ตกลง</button>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={onClose} className="absolute top-6 right-6 z-20 bg-slate-100 p-2.5 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all">
          <X size={20} />
        </button>

        <div className="md:w-1/2 h-64 md:h-auto">
          <img src={menuData.image_url || FALLBACK_IMAGE} className="w-full h-full object-cover" alt="" />
        </div>

        <div className="p-8 md:p-10 md:w-1/2 flex flex-col overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900 leading-tight">{menuData.name}</h2>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-slate-900">฿{menuData.price}</span>
                <span className="text-sm text-slate-400 font-bold uppercase tracking-wider">ราคาปกติ</span>
              </div>
            </div>

            {hasPromo ? (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <Ticket size={18} className="text-red-600" /> สิทธิพิเศษสำหรับคุณ
                </h4>

                <div className="space-y-3">
                  {menuData.promotions.map((promo) => {
                    const isClaimed = !!promo.coupon_code;
                    const isShowingQR = showQRMap[promo.promotion_id];

                    return (
                      <div key={promo.promotion_id} className="bg-slate-50 p-5 rounded-[2rem] border border-slate-200/60 flex flex-col gap-4 relative group">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl font-black text-red-600">฿{promo.total}</span>
                              <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold uppercase">Discounted</span>
                            </div>
                            <p className="font-bold text-slate-900 leading-tight group-hover:text-red-600 transition-colors">{promo.name}</p>
                            <p className="text-[11px] text-slate-500 mt-1">{promo.description}</p>
                          </div>

                          <AnimatePresence>
                            {isClaimed && isShowingQR && (
                              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="bg-white p-2 rounded-2xl shadow-md border border-red-100 shrink-0">
                                <QRCodeSVG value={promo.coupon_code} size={80} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="flex flex-col gap-2 pt-2 border-t border-dashed border-slate-200">
                          {!isClaimed ? (
                            <button
                              disabled={claimingId === promo.promotion_id}
                              onClick={() => handleClaimCoupon(promo.promotion_id)}
                              className="w-full bg-slate-900 hover:bg-red-600 text-white py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                            >
                              {claimingId === promo.promotion_id ? <><Loader2 size={16} className="animate-spin" /> กำลังรับคูปอง...</> : <><Ticket size={16} /> รับส่วนลดเหลือ ฿{promo.total}</>}
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleQR(promo.promotion_id)}
                              className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${isShowingQR ? 'bg-slate-200 text-slate-600' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100'}`}
                            >
                              {isShowingQR ? <X size={16} /> : <Zap size={16} />}
                              {isShowingQR ? 'ปิดหน้าจอ QR' : 'แสดง QR Code เพื่อใช้งาน'}
                            </button>
                          )}
                          {isClaimed && <div className="text-center text-[10px] font-black text-emerald-600 mt-1 uppercase">CODE: {promo.coupon_code}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-10 text-center border-t border-slate-100">
                <p className="text-slate-400 font-medium italic">ไม่มีโปรโมชั่นสำหรับเมนูนี้ในขณะนี้</p>
              </div>
            )}

            <button onClick={onClose} className="w-full py-4 text-slate-400 font-bold text-[10px] hover:text-red-600 transition-all uppercase tracking-[0.2em]">
              กลับสู่หน้าแดชบอร์ด
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}