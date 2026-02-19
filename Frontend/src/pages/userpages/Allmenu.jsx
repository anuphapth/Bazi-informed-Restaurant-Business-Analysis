import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, ChevronRight, Filter, ArrowUpDown, Utensils, Loader2, X, Ticket, CheckCircle2, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import useUser from "../../store/useUser";
import api from "../../utils/api";
import socket from "../../utils/socket";

const FALLBACK_IMAGE = "https://res.cloudinary.com/dqqkzucir/image/upload/v1770964754/depositphotos_289179526-stock-photo-white-torn-rolled-paper-light_drbebs.webp";
const ELEMENTS = ["ไม้", "ไฟ", "ดิน", "ทอง", "น้ำ"];

export default function Allmenu() {
  const navigate = useNavigate();
  const token = useUser((state) => state.token);
  const [menus, setMenus] = useState([]);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [selectedElements, setSelectedElements] = useState([]);
  const [priceSort, setPriceSort] = useState("asc");

  useEffect(() => {
    if (!token) navigate("/loginuser");
  }, [token, navigate]);

  const fetchFilteredMenus = async () => {
    try {
      setLoadingMenus(true);
      const res = await api.post("/api/auth/menu/filter", {
        element: selectedElements,
        price: priceSort,
        page: page,
      });
      const fetchedMenus = res.data.menu || [];
      setMenus(fetchedMenus);
      setLastPage(res.data.lastPage || 1);
      return fetchedMenus;
    } catch (err) {
      setMenus([]);
      return [];
    } finally {
      setLoadingMenus(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchFilteredMenus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [token, page, selectedElements, priceSort]);

  const toggleElement = (el) => {
    setPage(1);
    setSelectedElements((prev) =>
      prev.includes(el) ? prev.filter((e) => e !== el) : [...prev, el]
    );
  };

  if (!token) return null;

  return (
    <div className="min-h-screen bg-[#fcfdfe] pb-24 antialiased text-slate-900 overflow-x-hidden">
      <main className="container mx-auto px-4 md:px-8 pt-8 max-w-6xl space-y-8">

        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-[2px] w-6 bg-red-500 rounded-full" />
            <span className="text-red-600 font-black tracking-[0.15em] text-[9px] uppercase">Catalogue</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">เลือกอาหารมงคลตามธาตุ</h1>
        </header>

        <div className="space-y-3 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
            <Filter size={12} />
            <span>ค้นหาตามพลังงานธาตุ</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ELEMENTS.map((el) => (
              <button
                key={el}
                onClick={() => toggleElement(el)}
                className={`px-4 py-1.5 rounded-xl font-bold text-[11px] transition-all border 
                  ${selectedElements.includes(el) ? "bg-slate-900 border-slate-900 text-white shadow-md" : "bg-white border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-600"}`}
              >
                {el}
              </button>
            ))}
          </div>
          <div className="pt-2 flex items-center justify-between border-t border-slate-50">
            <span className="text-[10px] font-bold text-slate-400 uppercase">เรียงลำดับราคา</span>
            <div className="flex gap-2">
              <button onClick={() => setPriceSort("asc")} className={`text-[10px] font-black px-3 py-1 rounded-lg transition-colors ${priceSort === 'asc' ? 'bg-red-50 text-red-600' : 'text-slate-400'}`}>น้อยไปมาก</button>
              <button onClick={() => setPriceSort("desc")} className={`text-[10px] font-black px-3 py-1 rounded-lg transition-colors ${priceSort === 'desc' ? 'bg-red-50 text-red-600' : 'text-slate-400'}`}>มากไปน้อย</button>
            </div>
          </div>
        </div>

        <section className="space-y-6">
          {loadingMenus ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="aspect-[3/4] bg-slate-100 animate-pulse rounded-3xl" />)}
            </div>
          ) : menus.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {menus.map((menu) => (
                <MenuCard key={menu.id} menu={menu} onClick={() => setSelectedMenu(menu)} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-white rounded-[2rem] border border-dashed border-slate-200">
              <Utensils className="mx-auto text-slate-200 mb-2" size={40} />
              <p className="text-slate-400 text-sm font-bold">ไม่พบเมนูที่คุณต้องการ</p>
            </div>
          )}

          {lastPage > 1 && (
            <div className="flex justify-center pt-4">
              <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 text-[12px] font-bold">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 hover:bg-slate-50 disabled:opacity-20"><ChevronRight size={16} className="rotate-180" /></button>
                <span className="px-3 text-slate-600">หน้า {page} / {lastPage}</span>
                <button disabled={page === lastPage} onClick={() => setPage(p => p + 1)} className="p-2 hover:bg-slate-50 disabled:opacity-20"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </section>
      </main>

      <AnimatePresence>
        {selectedMenu && (
          <MenuModal
            menu={selectedMenu}
            onClose={() => setSelectedMenu(null)}
            fetchFilteredMenus={fetchFilteredMenus} // ✅ แก้เป็นชื่อนี้
            page={page}
            setSelectedMenu={setSelectedMenu}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuCard({ menu, onClick }) {
  const hasPromo = (menu.canUsePromotion === true || menu.canUsePromotion === 1) &&
    Array.isArray(menu.promotions) && menu.promotions.length > 0;
  const bestPrice = hasPromo ? Math.min(...menu.promotions.map(p => parseFloat(p.total))) : menu.price;

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="group cursor-pointer bg-white rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col h-full relative overflow-hidden"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-slate-50">
        <img src={menu.image_url || FALLBACK_IMAGE} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt="" />
        
        {hasPromo && <div className="absolute top-2 right-2 bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-sm">ลดราคา</div>}
      </div>
      <div className="p-3.5 space-y-1">
        <h3 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-red-600 transition-colors">
          {menu.name}
        </h3>
        <div className="flex flex-wrap gap-1">
          {menu.element?.map(el => (
            <span key={el} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[8px] font-black uppercase">
              {el}
            </span>
          ))}
        </div>
        <div className="flex items-baseline gap-1.5 pt-1">
          <span className="text-base font-black text-slate-900">฿{bestPrice}</span>
          {hasPromo && <span className="text-[10px] text-slate-400 line-through">฿{menu.price}</span>}
        </div>
      </div>
    </motion.div>
  );
}

function MenuModal({ menu: initialMenu, onClose, fetchFilteredMenus, page, setSelectedMenu }) {
  const joinedRoomsRef = useRef(new Set());
  const [menuData, setMenuData] = useState(initialMenu);
  const [claimingId, setClaimingId] = useState(null);
  const [showQRMap, setShowQRMap] = useState({});
  const [isUsedSuccess, setIsUsedSuccess] = useState(false);

  const handleClose = () => {
    joinedRoomsRef.current.forEach(code => socket.emit("leaveCoupon", code));
    joinedRoomsRef.current.clear();
    onClose();
  };

  useEffect(() => {
    setMenuData(initialMenu);
    setShowQRMap({});
    setIsUsedSuccess(false);
  }, [initialMenu]);

  useEffect(() => {
    if (!menuData?.promotions) return;
    const claimedCoupons = menuData.promotions.filter(p => p.coupon_code).map(p => p.coupon_code);
    if (claimedCoupons.length === 0) return;

    claimedCoupons.forEach(code => {
      if (!joinedRoomsRef.current.has(code)) {
        socket.emit("joinCoupon", code);
        joinedRoomsRef.current.add(code);
      }
    });

    const handleUpdate = async (data) => {
      if (!data?.code || data.status !== "USED") return;
      if (claimedCoupons.includes(data.code)) {
        setIsUsedSuccess(true);
        const freshMenus = await fetchFilteredMenus();
        const freshMenu = freshMenus.find(m => m.id === menuData.id);
        if (freshMenu) {
          setMenuData(freshMenu);
          setSelectedMenu(freshMenu);
        }
      }
    };
    socket.off("couponUpdated");
    socket.on("couponUpdated", handleUpdate);
    return () => socket.off("couponUpdated", handleUpdate);
  }, [menuData?.promotions, menuData?.id, fetchFilteredMenus, setSelectedMenu]);

  const hasPromo = (menuData.canUsePromotion === true || menuData.canUsePromotion === 1) &&
    Array.isArray(menuData.promotions) && menuData.promotions.length > 0;

  const handleClaimCoupon = async (promoId) => {
    try {
      setClaimingId(promoId);
      await api.post("/api/auth/coupon/add", { promotion_id: promoId });
      const freshMenus = await fetchFilteredMenus();
      const freshMenu = freshMenus.find(m => m.id === menuData.id);
      if (freshMenu) {
        setMenuData(freshMenu);
        setSelectedMenu(freshMenu);
      }
      setShowQRMap(prev => ({ ...prev, [promoId]: true }));
    } catch (err) {
      alert(err.response?.data?.message || "เกิดข้อผิดพลาด");
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

      <motion.div
        layoutId={`modal-${menuData.id}`}
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] w-full max-w-4xl overflow-hidden relative shadow-2xl z-10 max-h-[85vh] flex flex-col md:flex-row"
      >
        <AnimatePresence>
          {isUsedSuccess && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-10">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm"><CheckCircle2 size={40} /></div>
              <h3 className="text-2xl font-black text-slate-900">ใช้คูปองสำเร็จ!</h3>
              <p className="text-slate-500 mt-2">รายการนี้ได้รับการยืนยันเรียบร้อยแล้ว</p>
              <button onClick={handleClose} className="mt-8 bg-slate-900 text-white px-10 py-3.5 rounded-2xl font-bold">ตกลง</button>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={handleClose} className="absolute top-5 right-5 z-20 bg-white/80 p-2.5 rounded-full hover:bg-white text-slate-400 hover:text-red-600 shadow-sm"><X size={20} /></button>

        <div className="md:w-1/2 h-64 md:h-auto overflow-hidden">
          <img src={menuData.image_url || FALLBACK_IMAGE} className="w-full h-full object-cover" alt="" />
        </div>

        <div className="p-8 md:p-10 md:w-1/2 flex flex-col overflow-y-auto custom-scrollbar bg-white">
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">{menuData.name}</h2>
              {/* ✅ เพิ่มคำอธิบายเมนู */}
              {menuData.description && <p className="text-slate-500 text-xs md:text-sm leading-relaxed">{menuData.description}</p>}
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-slate-900">฿{menuData.price}</span>
                <span className="text-[10px] text-slate-400 font-bold border px-2 py-0.5 rounded-md uppercase">Regular Price</span>
              </div>
            </div>

            {hasPromo ? (
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2"><Ticket size={18} className="text-red-600" /> สิทธิพิเศษสำหรับคุณ</h4>
                <div className="space-y-4">
                  {menuData.promotions.map((promo) => {
                    const isClaimed = !!promo.coupon_code;
                    const isShowingQR = showQRMap[promo.promotion_id];
                    return (
                      <div key={promo.promotion_id} className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 flex flex-col gap-4 relative group">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl font-black text-red-600">฿{promo.total}</span>
                              <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Discount</span>
                            </div>
                            <p className="font-bold text-slate-900 text-sm leading-tight">{promo.name}</p>
                            <p className="text-[11px] text-slate-500 mt-1">{promo.description}</p>
                          </div>
                          <AnimatePresence>
                            {isClaimed && isShowingQR && (
                              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="bg-white p-2 rounded-2xl border border-red-50 shadow-sm"><QRCodeSVG value={promo.coupon_code} size={70} /></motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="flex flex-col gap-2 pt-3 border-t border-dashed border-slate-200">
                          {!isClaimed ? (
                            <button disabled={claimingId === promo.promotion_id} onClick={() => handleClaimCoupon(promo.promotion_id)} className="w-full bg-slate-900 hover:bg-red-600 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                              {claimingId === promo.promotion_id ? <Loader2 size={16} className="animate-spin" /> : <><Ticket size={16} /> รับส่วนลดเหลือ ฿{promo.total}</>}
                            </button>
                          ) : (
                            <button onClick={() => setShowQRMap(prev => ({ ...prev, [promo.promotion_id]: !prev[promo.promotion_id] }))} className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${isShowingQR ? 'bg-slate-200 text-slate-600' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-100'}`}>
                              {isShowingQR ? <X size={16} /> : <Zap size={16} />} {isShowingQR ? 'ปิดหน้าจอ QR' : 'แสดง QR Code เพื่อใช้งาน'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center border-t border-slate-50"><p className="text-slate-400 text-sm italic">ไม่มีโปรโมชั่นสำหรับเมนูนี้ในขณะนี้</p></div>
            )}
            <button onClick={handleClose} className="w-full py-4 text-slate-300 font-black text-[10px] hover:text-red-500 uppercase tracking-[0.25em]">ปิดหน้าต่างเมนู</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}