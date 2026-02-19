import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import useEcom from "../../store/bazi"
import React from "react"
import {
  Utensils, PlusCircle, X, Plus, Trash2, Loader2, ChevronLeft,
  ChevronRight, Image as ImageIcon, AlertCircle, ShoppingBag, Layers, Sparkles, LayoutGrid, List,
  Ticket, Calendar, ArrowDownCircle, Percent
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import apiRestaurant from "../../utils/apiRestaurant";


const API_URL = import.meta.env.VITE_API_URL

const elementColors = {
  "ไม้": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "ไฟ": "bg-rose-50 text-rose-700 border-rose-200",
  "ดิน": "bg-amber-50 text-amber-700 border-amber-200",
  "ทอง": "bg-slate-50 text-slate-700 border-slate-300",
  "น้ำ": "bg-sky-50 text-sky-700 border-sky-200",
}

function DashboardRestaurant() {
  const token = useEcom((state) => state.token)
  const navigate = useNavigate()

  const [menus, setMenus] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [openModal, setOpenModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editingMenuId, setEditingMenuId] = useState(null)
  const [openDeleteModal, setOpenDeleteModal] = useState(false)
  const [deleteMenu, setDeleteMenu] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [priceError, setPriceError] = useState("")
  const [viewMode, setViewMode] = useState("grid")

  const [form, setForm] = useState({
    name: "",
    price: "",
    element: [],
    status: "AVAILABLE",
    description: "",
  })

  const [promotions, setPromotions] = useState([])
  const [promoModal, setPromoModal] = useState(false)
  const [editPromo, setEditPromo] = useState(false)
  const [editingPromoId, setEditingPromoId] = useState(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [showAllPromosModal, setShowAllPromosModal] = useState(false);
  const [promoError, setPromoError] = useState("");

  const [promoForm, setPromoForm] = useState({
    name: "",
    element: "",
    description: "",
    discount_value: "",
    start_date: "",
    end_date: "",
    status: "AVAILABLE"
  })


  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  useEffect(() => {
    if (!token) navigate("/loginrestaurent")
  }, [token, navigate])

  useEffect(() => {
    if (token) fetchMenus()
  }, [token, page])

  // --- Scroll Functions ---
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const fetchPromotions = async () => {
    try {
      const res = await apiRestaurant.post("/api/restaurant/promotion/get/all")
      setPromotions(res.data.promotion_groups || [])
    } catch (err) {
      console.log(err)
    }
  }

  useEffect(() => {
    if (token) fetchPromotions()
  }, [token])

  const handleCreatePromotion = async (e) => {
    e.preventDefault()
    if (promoLoading) return

    try {
      setPromoLoading(true)

      await apiRestaurant.post("/api/restaurant/promotion/create", {
        name: promoForm.name,
        element: [promoForm.element],
        description: promoForm.description,
        discount_value: Number(promoForm.discount_value),
        start_date: promoForm.start_date,
        end_date: promoForm.end_date
      })

      setPromoModal(false)
      fetchPromotions()
    } catch (err) {
      alert("สร้างคูปองไม่สำเร็จ")
    } finally {
      setPromoLoading(false)
    }
  }

  const handleUpdatePromotion = async (e) => {
    e.preventDefault()
    if (promoLoading) return

    try {
      setPromoLoading(true)

      await apiRestaurant.put("/api/restaurant/promotionGroup/update", {
        group_id: editingPromoId,
        name: promoForm.name,
        element: [promoForm.element],
        description: promoForm.description,
        discount_value: Number(promoForm.discount_value),
        start_date: promoForm.start_date,
        end_date: promoForm.end_date,
        status: promoForm.status
      })


      setPromoModal(false)
      fetchPromotions()
    } catch (err) {
      alert("แก้ไขคูปองไม่สำเร็จ")
    } finally {
      setPromoLoading(false)
    }
  }

  const deletePromotion = async (id) => {
    if (!confirm("ยืนยันลบคูปอง?")) return

    try {
      await apiRestaurant.delete(`/api/restaurant/promotionGroup/delete/${id}`)
      fetchPromotions()
    } catch (err) {
      alert("ลบไม่สำเร็จ")
    }
  }

  const openEditPromo = (p) => {
    setEditPromo(true)
    setEditingPromoId(p.promotion_group_id)
    setPromoForm({
      name: p.name,
      element: p.element?.[0] || "",
      description: p.description,
      discount_value: p.discount_value,
      start_date: p.start_date.slice(0, 16),
      end_date: p.end_date.slice(0, 16),
      status: p.status
    })
    setPromoModal(true)
  }

  const validatePromoForm = () => {
    const { name, element, description, discount_value, start_date, end_date } = promoForm;
    if (!name || !element || !description || !discount_value || !start_date || !end_date) {
      return "กรุณากรอกข้อมูลให้ครบทุกช่อง";
    }
    const discount = Number(discount_value);
    if (isNaN(discount) || discount < 1 || discount > 100) {
      return "ส่วนลดต้องอยู่ระหว่าง 1 - 100%";
    }
    if (new Date(start_date) >= new Date(end_date)) {
      return "วันที่สิ้นสุดต้องอยู่หลังวันที่เริ่ม";
    }
    return "";
  };

  // UI Component สำหรับคูปองแต่ละใบ
  const CouponItem = ({ p, onEdit, onDelete }) => (
    <div className="group relative bg-white rounded-2xl p-0 shadow-lg shadow-red-900/5 hover:shadow-xl border border-amber-100/50 transition-all flex flex-col sm:flex-row overflow-hidden w-full">
      {/* Status Bar */}
      <div className={`w-full sm:w-2 h-2 sm:h-auto ${p.status === "AVAILABLE" ? "bg-emerald-500" : "bg-slate-300"}`}></div>
      
      <div className="flex-1 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
        <div className="flex-1 flex gap-4">
            {/* Icon Box */}
          <div className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl flex items-center justify-center text-lg sm:text-xl font-bold border-2 ${p.element && elementColors[p.element[0]]
            ? elementColors[p.element[0]].replace('bg-', 'bg-white ').replace('text-', 'text-')
            : "bg-slate-50 border-slate-200 text-slate-400"
            }`}>
            {p.element && p.element[0] ? p.element[0] : <Percent size={20} />}
          </div>
          
          {/* Content */}
          <div className="min-w-0"> {/* min-w-0 prevents text overflow in flex */}
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-black text-base sm:text-lg text-slate-800 truncate">{p.name}</h3>
              {p.status !== "AVAILABLE" && <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 font-bold uppercase whitespace-nowrap">Expired</span>}
            </div>
            <p className="text-sm text-slate-500 line-clamp-1 mt-0.5 break-words">{p.description}</p>
            <div className="flex flex-wrap items-center gap-1 mt-2 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wide">
              <Calendar size={12} />
              <span className="truncate">
                {new Date(p.start_date).toLocaleDateString()} - {new Date(p.end_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="hidden sm:block w-px h-12 border-l-2 border-dashed border-slate-200"></div>
        
        {/* Actions & Discount */}
        <div className="flex items-center justify-between sm:justify-end gap-4 sm:min-w-[140px] border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 mt-2 sm:mt-0">
          <div className="sm:text-right">
            <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">ส่วนลด</p>
            <p className="text-xl sm:text-2xl font-black text-red-600">{p.discount_value}%</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onEdit} className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white flex items-center justify-center transition-all"><Sparkles size={16} /></button>
            <button onClick={onDelete} className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all"><Trash2 size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );

  const fetchMenus = async () => {
    try {
      setLoading(true)
      const res = await apiRestaurant.post(
        "/api/restaurant/menu",
        { page }
      );

      const safeMenus = Array.isArray(res.data.getMenu)
        ? res.data.getMenu.map((m) => ({
          ...m,
          element: Array.isArray(m.element) ? m.element : (typeof m.element === "string" ? m.element.split(",") : []),
        }))
        : []
      setMenus(safeMenus)
      setLastPage(res.data.lastPage || 1)
    } catch (err) {
      setMenus([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!form.name.trim() || !form.price || saving || priceError) return

    try {
      setSaving(true)
      const formData = new FormData()
      formData.append("name", form.name.trim())
      formData.append("price", Number(form.price))
      formData.append("status", form.status)
      formData.append("description", form.description)
      form.element.forEach((el) => formData.append("element[]", el))
      if (image) formData.append("image", image)

      if (editMode) {
        formData.append("menuid", editingMenuId);
        await apiRestaurant.put("/api/restaurant/edit/menu", formData);
      } else {
        await apiRestaurant.post("/api/restaurant/add/menu", formData);
      }

      closeModal()
      fetchMenus()
    } catch (err) {
      alert("บันทึกข้อมูลไม่สำเร็จ")
    } finally {
      setSaving(false)
    }
  }

  const confirmDeleteMenu = async () => {
    if (deleting) return
    try {
      setDeleting(true)
      await apiRestaurant.delete("/api/restaurant/delete/menu", {
        data: { menuid: deleteMenu.id },
      });

      setOpenDeleteModal(false)
      setOpenModal(false)
      fetchMenus()
    } catch (err) {
      alert("ลบเมนูไม่สำเร็จ")
    } finally {
      setDeleting(false)
    }
  }

  const validatePrice = (value) => {
    const num = Number(value)
    if (value === "") return setPriceError("")
    if (!Number.isInteger(num)) return setPriceError("กรุณากรอกจำนวนเต็ม")
    if (num < 0 || num > 99999) return setPriceError("ราคา 0 - 99,999 บาท")
    setPriceError("")
  }

  const toggleElement = (el) => {
    setForm(prev => ({
      ...prev,
      element: prev.element.includes(el) ? prev.element.filter(e => e !== el) : [...prev.element, el]
    }))
  }

  const openAddModal = () => {
    setEditMode(false)
    setForm({
      name: "",
      price: "",
      element: [],
      status: "AVAILABLE",
      description: "",
    })
    setImagePreview(null)
    setImage(null)
    setOpenModal(true)
  }


  const openEditModal = (menu) => {
    setEditMode(true)
    setEditingMenuId(menu.id)
    setDeleteMenu(menu)
    setForm({
      name: menu.name || "",
      price: menu.price || "",
      element: menu.element || [],
      status: menu.status || "AVAILABLE",
      description: menu.description || "",
    })
    setImagePreview(menu.image_url ? (menu.image_url.startsWith("http") ? menu.image_url : `${API_URL}${menu.image_url}`) : null)
    setOpenModal(true)
  }

  const closeModal = () => {
    if (saving) return
    setOpenModal(false)
  }

  return (
    // Added overflow-x-hidden to body prevent horizontal scroll on small screens
    <div className="min-h-screen bg-[#FCFBFA] text-slate-900 font-line antialiased pb-20 w-full overflow-x-hidden">

      {/* HEADER SECTION */}
      <div className="relative bg-red-950 pt-6 pb-20 md:pt-10 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/40 to-red-950"></div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2 text-amber-400">
                <Utensils size={18} className="md:w-5 md:h-5" />
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em]">Restaurant Manager</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight break-words">คลังรายการอาหาร</h1>
              <p className="text-red-200/70 mt-2 font-medium text-sm md:text-base">จัดการเมนูและโปรโมชั่นสำหรับลูกค้าของคุณ</p>

              {/* SECTION NAVIGATION BUTTONS */}
              <div className="flex flex-wrap gap-3 md:gap-4 mt-6 md:mt-8">
                <button
                  onClick={() => scrollToSection('coupon-section')}
                  className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-red-900/50 hover:bg-red-800 text-red-100 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold border border-red-800/50 transition-all whitespace-nowrap"
                >
                  <Ticket size={14} className="text-amber-400" /> คูปองส่วนลด
                </button>
                <button
                  onClick={() => scrollToSection('menu-section')}
                  className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-red-900/50 hover:bg-red-800 text-red-100 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold border border-red-800/50 transition-all whitespace-nowrap"
                >
                  <Utensils size={14} className="text-amber-400" /> เมนูอาหาร
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full md:w-auto">
              <button
                onClick={openAddModal}
                className="group w-full md:w-auto flex items-center justify-center gap-3 bg-amber-500 hover:bg-amber-400 text-red-950 px-6 py-3 md:px-8 md:py-4 rounded-2xl font-black transition-all shadow-xl shadow-amber-500/20 active:scale-95"
              >
                <PlusCircle size={20} className="group-hover:rotate-90 transition-transform" />
                <span>เพิ่มเมนูใหม่</span>
              </button>

              <button
                onClick={() => {
                  setEditPromo(false)
                  setPromoForm({
                    name: "",
                    element: "",
                    description: "",
                    discount_value: "",
                    start_date: "",
                    end_date: "",
                    status: "AVAILABLE"
                  })
                  setPromoModal(true)
                }}
                className="group w-full md:w-auto flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-red-900 px-6 py-3 md:px-8 md:py-3 rounded-2xl font-black transition-all shadow-lg active:scale-95"
              >
                <Ticket size={18} className="text-amber-500" />
                <span>เพิ่มคูปอง</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 space-y-16 md:space-y-20 -mt-8 md:-mt-10 relative z-20">

        {/* -------------------- PROMOTIONS SECTION -------------------- */}
        <section id="coupon-section" className="scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><Ticket size={20} /></div>
              <h2 className="text-xl md:text-2xl font-black text-white">คูปองและส่วนลด</h2>
            </div>
            {promotions.length > 5 && (
              <button
                onClick={() => setShowAllPromosModal(true)}
                className="text-sm font-black text-white hover:text-red-500 flex items-center gap-1 transition-colors self-end sm:self-auto"
              >
                ดูทั้งหมด ({promotions.length})
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {promotions.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-300">
                <p className="text-slate-400 text-sm">ยังไม่มีคูปองส่วนลดในขณะนี้</p>
              </div>
            ) : (
              <>
                {promotions.slice(0, 5).map(p => (
                  <CouponItem
                    key={p.promotion_group_id}
                    p={p}
                    onEdit={() => openEditPromo(p)}
                    onDelete={() => deletePromotion(p.promotion_group_id)}
                  />
                ))}

                {promotions.length > 5 && (
                  <button
                    onClick={() => setShowAllPromosModal(true)}
                    className="w-full py-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:bg-slate-50 hover:border-amber-300 hover:text-amber-600 transition-all flex items-center justify-center gap-2 group text-sm"
                  >
                    แสดงคูปองอีก {promotions.length - 5} รายการ
                    <ArrowDownCircle size={16} className="group-hover:translate-y-0.5 transition-transform" />
                  </button>
                )}
              </>
            )}
          </div>
        </section>

        {/* -------------------- MENU SECTION -------------------- */}
        <section id="menu-section" className="scroll-mt-24">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg text-red-800"><Utensils size={20} /></div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800">รายการอาหาร</h2>
            </div>

            {/* View Switcher */}
            {!loading && menus.length > 0 && (
              <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex gap-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-red-900 text-amber-400' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-red-900 text-amber-400' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  <List size={18} />
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <Loader2 className="animate-spin text-amber-500" size={48} />
              <p className="mt-6 text-red-900 font-black tracking-widest text-xs uppercase animate-pulse">กำลังจัดเตรียมสำรับ...</p>
            </div>
          ) : menus.length === 0 ? (
            <div className="text-center py-16 md:py-24 bg-white rounded-[2rem] md:rounded-[3rem] shadow-2xl shadow-red-900/5 border border-amber-100 overflow-hidden relative group px-6">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-5"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-red-50 text-red-700 rounded-[2rem] flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner border border-red-100 group-hover:scale-110 transition-transform duration-500">
                  <ShoppingBag size={40} className="md:w-12 md:h-12" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-3">ยังไม่มีเมนู</h3>
                <p className="text-slate-400 mb-8 md:mb-10 max-w-sm mx-auto text-sm md:text-base font-medium leading-relaxed">ดูเหมือนห้องเครื่องยังว่างอยู่ เริ่มต้นสร้างสรรค์เมนูแรกของคุณได้เลย!</p>
                <button onClick={openAddModal} className="bg-red-900 text-amber-400 px-8 py-4 md:px-12 md:py-5 rounded-2xl font-black text-base md:text-lg transition-all shadow-xl shadow-red-900/20 hover:scale-105">เริ่มเพิ่มเมนู</button>
              </div>
            </div>
          ) : (
            <>
              {/* MENU RENDERER */}
              <div className={viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
                : "flex flex-col gap-4"
              }>
                {menus.map((menu) => (
                  viewMode === 'grid' ? (
                    /* GRID CARD */
                    <div key={menu.id} className="group bg-white rounded-[2rem] p-4 shadow-xl shadow-red-950/5 hover:shadow-2xl hover:shadow-red-900/10 transition-all duration-500 flex flex-col border border-amber-50/50">
                      <div className="relative aspect-square rounded-[1.5rem] overflow-hidden bg-slate-100 shadow-inner">
                        <img
                          src={menu.image_url ? (menu.image_url.startsWith("http") ? menu.image_url : `${API_URL}${menu.image_url}`) : "https://res.cloudinary.com/dqqkzucir/image/upload/v1770964754/depositphotos_289179526-stock-photo-white-torn-rolled-paper-light_drbebs.webp"}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                          alt={menu.name}
                        />
                        <div className="absolute top-3 right-3 bg-red-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 shadow-lg">
                          <span className="text-xs font-black text-amber-400">฿{Number(menu.price).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="px-1 pt-4 pb-2 flex-1 flex flex-col">
                        <h3 className="text-lg font-black text-slate-800 line-clamp-1 mb-2 group-hover:text-red-700 transition-colors">{menu.name}</h3>
                        <div className="flex gap-1.5 flex-wrap mb-4">
                          {menu.element.length > 0 ? menu.element.map((el, i) => (
                            <span key={i} className={`text-[10px] px-2 py-1 rounded-md font-black border uppercase tracking-wide ${elementColors[el] || "bg-slate-50 text-slate-500"}`}>{el}</span>
                          )) : <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">General</span>}
                        </div>
                        <button onClick={() => openEditModal(menu)} className="w-full mt-auto bg-slate-50 text-slate-600 rounded-xl py-3 font-black text-xs hover:bg-red-900 hover:text-amber-400 transition-all flex items-center justify-center gap-2 group/btn">
                          จัดการ <Sparkles size={12} className="opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* LIST CARD - Responsive Stack on Mobile */
                    <div key={menu.id} className="group bg-white rounded-3xl p-3 md:pr-6 shadow-md hover:shadow-xl transition-all border border-amber-100/50 flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-8">
                       {/* Image Wrapper */}
                      <div className="w-full sm:w-20 h-40 sm:h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden shrink-0 shadow-inner bg-slate-100">
                        <img
                          src={menu.image_url ? (menu.image_url.startsWith("http") ? menu.image_url : `${API_URL}${menu.image_url}`) : "https://res.cloudinary.com/dqqkzucir/image/upload/v1770964754/depositphotos_289179526-stock-photo-white-torn-rolled-paper-light_drbebs.webp"}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          alt={menu.name}
                        />
                      </div>
                      <div className="flex-1 w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-2">
                        <div>
                          <h3 className="text-lg md:text-xl font-black text-slate-800 group-hover:text-red-700">{menu.name}</h3>
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            {menu.element.map((el, i) => (
                              <span key={i} className={`text-[9px] px-2 py-1 rounded-md font-black border uppercase tracking-tighter ${elementColors[el] || "bg-slate-50"}`}>{el}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-6 md:gap-12 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                          <div className="sm:text-right shrink-0">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest hidden sm:block">Price</p>
                            <p className="text-lg font-black text-red-900">฿{Number(menu.price).toLocaleString()}</p>
                          </div>
                          <button onClick={() => openEditModal(menu)} className="bg-amber-50 hover:bg-red-900 hover:text-amber-400 text-amber-600 px-4 py-2 md:py-3 rounded-xl transition-all font-black text-[10px] uppercase flex items-center gap-2">
                            <Sparkles size={14} /> <span className="inline">Manage</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>

              {/* PAGINATION */}
              {lastPage > 1 && (
                <div className="mt-20 flex flex-col items-center gap-6">
                  <div className="flex items-center gap-2 bg-white p-2 rounded-[2rem] shadow-2xl border border-amber-100/50 backdrop-blur-md">
                    <button
                      onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={page === 1}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-2xl hover:bg-red-50 text-red-900 disabled:opacity-20 transition-all flex items-center justify-center active:scale-90"
                    >
                      <ChevronLeft size={20} strokeWidth={3} />
                    </button>

                    <div className="relative group px-1 md:px-2">
                      <select
                        value={page}
                        onChange={(e) => { setPage(Number(e.target.value)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="appearance-none bg-slate-50 border-2 border-slate-100 text-slate-800 font-black py-2 pl-4 md:pl-6 pr-10 md:pr-12 rounded-xl md:rounded-2xl focus:outline-none focus:border-amber-400 focus:bg-white cursor-pointer transition-all hover:bg-white text-xs md:text-sm tracking-widest"
                      >
                        {[...Array(lastPage)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>สำรับที่ {i + 1}</option>
                        ))}
                      </select>
                      <div className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 pointer-events-none text-amber-500">
                        <ChevronRight size={14} className="rotate-90" strokeWidth={3} />
                      </div>
                    </div>

                    <button
                      onClick={() => { setPage(p => Math.min(lastPage, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={page === lastPage}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-2xl hover:bg-red-50 text-red-900 disabled:opacity-20 transition-all flex items-center justify-center active:scale-90"
                    >
                      <ChevronRight size={20} strokeWidth={3} />
                    </button>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    หน้า <span className="text-red-700">{page}</span> จากทั้งหมด {lastPage} หน้า
                  </p>
                </div>
              )}
            </>
          )}
        </section>

      </div>

      {/* MODAL SECTION (ADD/EDIT MENU) - Optimized for overflow/small screens */}
      <AnimatePresence>
        {openModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
             {/* Backdrop */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-red-950/60 backdrop-blur-md" onClick={closeModal} />
            
            {/* Modal Container */}
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }} 
              className="relative bg-white w-full max-h-[90vh] sm:h-auto sm:max-h-[85vh] max-w-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Header (Fixed) */}
              <div className="px-6 py-6 md:p-8 flex justify-between items-start shrink-0 border-b border-slate-50">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{editMode ? "แก้ไขรายการ" : "เพิ่มเมนูใหม่"}</h2>
                    <div className="w-12 h-1.5 bg-amber-500 rounded-full mt-2 md:mt-3"></div>
                  </div>
                  <button onClick={closeModal} className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-2xl text-slate-400 hover:text-red-700 flex items-center justify-center transition-all hover:rotate-90"><X size={20} /></button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
                <form id="menu-form" onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ImageIcon size={14} /> รูปภาพประกอบเมนู</label>
                    <label className="group relative flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-slate-200 rounded-[2rem] cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-all overflow-hidden bg-slate-50/50">
                      {imagePreview ? (
                        <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg text-amber-500"><PlusCircle size={28} /></div>
                          <span className="font-black text-xs text-slate-400 uppercase tracking-[0.2em]">เลือกไฟล์รูปภาพ</span>
                        </div>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        const file = e.target.files[0]
                        if (file) { setImage(file); setImagePreview(URL.createObjectURL(file)); }
                      }} />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">ชื่อรายการอาหาร</label>
                      <input type="text" className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-400 focus:bg-white rounded-2xl px-5 py-3 md:px-6 md:py-4 text-slate-800 font-bold outline-none text-sm md:text-base" placeholder="เช่น เป็ดปักกิ่ง" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">ราคา (บาท)</label>
                      <input type="number" className={`w-full bg-slate-50 border-2 rounded-2xl px-5 py-3 md:px-6 md:py-4 font-black text-lg outline-none ${priceError ? 'border-rose-500' : 'border-transparent focus:border-amber-400 focus:bg-white'}`} placeholder="0.00" value={form.price} onChange={(e) => { setForm({ ...form, price: e.target.value }); validatePrice(e.target.value) }} required />
                      {priceError && <p className="text-rose-500 text-[10px] font-black mt-2 flex items-center gap-1"><AlertCircle size={10} /> {priceError}</p>}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex text-xs font-black text-slate-400 uppercase tracking-widest items-center gap-2"><Layers size={14} /> ธาตุอาหารที่เกี่ยวข้อง</label>
                    <div className="flex gap-2 flex-wrap">
                      {Object.keys(elementColors).map((el) => (
                        <button key={el} type="button" onClick={() => toggleElement(el)} className={`px-4 py-2 md:px-6 md:py-3 rounded-xl border-2 font-black text-xs md:text-sm transition-all ${form.element.includes(el) ? "bg-red-900 text-amber-400 border-red-900" : "bg-white text-slate-400 border-slate-100"}`}>{el}</button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-400 focus:bg-white rounded-2xl px-5 py-3 md:px-6 md:py-4 text-slate-800 font-bold outline-none resize-none text-sm md:text-base"
                      placeholder="รายละเอียดธาตุเมนูของคุณ"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      required
                    />
                  </div>
                </form>
              </div>

               {/* Modal Footer (Fixed) */}
               <div className="p-6 md:p-8 pt-4 border-t border-slate-50 shrink-0 bg-white pb-safe">
                  <div className="flex gap-3 md:gap-4">
                    {editMode && (
                      <button type="button" onClick={() => setOpenDeleteModal(true)} className="w-14 h-14 md:w-16 md:h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shrink-0"><Trash2 size={22} /></button>
                    )}
                    <button form="menu-form" type="submit" disabled={saving || priceError} className="flex-1 bg-red-950 hover:bg-red-900 text-amber-400 rounded-2xl font-black text-base md:text-xl py-4 md:py-5 transition-all disabled:bg-slate-200 flex items-center justify-center gap-3">
                      {saving ? <Loader2 className="animate-spin" size={24} /> : (editMode ? "บันทึกการแก้ไข" : "สร้างรายการเมนู")}
                    </button>
                  </div>
               </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PROMO MODAL - Optimized */}
      <AnimatePresence>
        {promoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-red-950/60 backdrop-blur-md" onClick={() => setPromoModal(false)} />

            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.9, opacity: 0 }} 
                className="relative bg-white w-full max-w-lg max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col border border-amber-100/50"
            >
              {/* Header */}
              <div className="p-6 md:p-8 pb-2 flex justify-between items-center shrink-0">
                  <h2 className="text-xl md:text-2xl font-black text-slate-900">{editPromo ? "แก้ไขคูปอง" : "เพิ่มคูปองส่วนลด"}</h2>
                  <button onClick={() => setPromoModal(false)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-100 hover:text-red-700 transition-all"><X size={20} /></button>
              </div>

              {/* Body */}
              <div className="p-6 md:p-8 pt-4 overflow-y-auto custom-scrollbar flex-1">
                <form
                  id="promo-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const error = validatePromoForm();
                    if (error) {
                      setPromoError(error);
                      return;
                    }
                    editPromo ? handleUpdatePromotion(e) : handleCreatePromotion(e);
                  }}
                  className="space-y-4"
                >
                  {/* Error Box */}
                  {promoError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-600 text-xs font-bold"
                    >
                      <AlertCircle size={14} /> {promoError}
                    </motion.div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">ชื่อคูปอง *</label>
                    <input
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-400 focus:bg-white rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-all text-sm"
                      placeholder="เช่น ส่วนลดวันตรุษจีน"
                      value={promoForm.name}
                      onChange={e => { setPromoForm({ ...promoForm, name: e.target.value }); setPromoError(""); }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">รายละเอียดคูปอง *</label>
                    <textarea
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-400 focus:bg-white rounded-xl px-4 py-3 font-medium text-slate-800 outline-none transition-all resize-none text-sm"
                      rows={2}
                      placeholder="บอกเงื่อนไขการใช้งาน..."
                      value={promoForm.description}
                      onChange={e => { setPromoForm({ ...promoForm, description: e.target.value }); setPromoError(""); }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">เลือกธาตุที่ร่วมรายการ *</label>
                    <div className="flex gap-2 flex-wrap">
                      {["ไม้", "ไฟ", "ดิน", "ทอง", "น้ำ"].map(el => (
                        <button
                          type="button"
                          key={el}
                          onClick={() => { setPromoForm({ ...promoForm, element: el }); setPromoError(""); }}
                          className={`px-3 py-2 rounded-xl text-xs font-black border transition-all 
                                ${promoForm.element === el
                                ? "bg-red-900 text-amber-400 border-red-900 shadow-lg shadow-red-900/20"
                                : "bg-white text-slate-400 border-slate-200 hover:border-amber-300"}`}
                        >
                          {el}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">ส่วนลด (1-100%) *</label>
                      <div className="relative">
                        <input
                          type="number"
                          className={`w-full bg-slate-50 border-2 rounded-xl px-4 py-3 font-black outline-none transition-all text-lg
                            ${(Number(promoForm.discount_value) < 1 || Number(promoForm.discount_value) > 100) && promoForm.discount_value !== ""
                              ? "border-rose-400 text-rose-600"
                              : "border-transparent focus:border-amber-400 focus:bg-white text-red-700"}`}
                          placeholder="0"
                          value={promoForm.discount_value}
                          onChange={e => { const val = e.target.value; setPromoForm({ ...promoForm, discount_value: val }); setPromoError(""); }}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300">%</span>
                      </div>
                    </div>

                    {editPromo && (
                      <div className="space-y-2 col-span-2 sm:col-span-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">สถานะ</label>
                        <select
                          className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-400 focus:bg-white rounded-xl px-4 py-3 font-bold text-slate-800 outline-none transition-all appearance-none text-sm"
                          value={promoForm.status}
                          onChange={e => setPromoForm({ ...promoForm, status: e.target.value })}
                        >
                          <option value="AVAILABLE">เปิดใช้งาน</option>
                          <option value="UNAVAILABLE">ปิดใช้งาน</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1"><Calendar size={10} /> เริ่มใช้งาน</label>
                      <input
                        type="datetime-local"
                        className="w-full bg-slate-50 border-slate-100 border text-xs p-3 rounded-xl font-bold text-slate-600 focus:border-amber-400 outline-none"
                        value={promoForm.start_date}
                        onChange={e => { setPromoForm({ ...promoForm, start_date: e.target.value }); setPromoError(""); }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1"><Calendar size={10} /> สิ้นสุด</label>
                      <input
                        type="datetime-local"
                        className="w-full bg-slate-50 border-slate-100 border text-xs p-3 rounded-xl font-bold text-slate-600 focus:border-amber-400 outline-none"
                        value={promoForm.end_date}
                        onChange={e => { setPromoForm({ ...promoForm, end_date: e.target.value }); setPromoError(""); }}
                      />
                    </div>
                  </div>
                </form>
              </div>

               {/* Footer */}
               <div className="p-6 md:p-8 pt-0 shrink-0">
                    <button
                      form="promo-form"
                      type="submit"
                      disabled={promoLoading || !!validatePromoForm()}
                      className={`w-full py-4 rounded-2xl font-black shadow-lg transition-all flex items-center justify-center gap-2 text-sm md:text-base
                        ${validatePromoForm()
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                          : "bg-red-950 text-amber-400 hover:scale-[1.02] active:scale-95 shadow-red-900/20"}`}
                    >
                      {promoLoading ? <Loader2 className="animate-spin" size={20} /> : (editPromo ? "บันทึกการแก้ไข" : "สร้างคูปองใบนี้")}
                    </button>
               </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

      {/* DELETE MODAL */}
      <AnimatePresence>
        {openDeleteModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-red-950/60 backdrop-blur-md" onClick={() => setOpenDeleteModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-[3rem] p-8 md:p-10 w-full max-w-sm text-center shadow-2xl border border-amber-100">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner border border-rose-100"><Trash2 size={32} /></div>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-2">ยืนยันการลบ?</h3>
              <p className="text-slate-400 text-xs md:text-sm mb-8 md:mb-10 italic">ลบรายการ <span className="text-red-700 font-black not-italic block mt-1">"{deleteMenu?.name}"</span></p>
              <div className="flex flex-col gap-3">
                <button onClick={confirmDeleteMenu} disabled={deleting} className="w-full bg-rose-600 text-white py-3 md:py-4 rounded-2xl font-black hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 text-sm md:text-base">{deleting ? <Loader2 className="animate-spin mx-auto" /> : "ยืนยันลบรายการ"}</button>
                <button onClick={() => setOpenDeleteModal(false)} className="w-full bg-slate-50 text-slate-400 py-3 md:py-4 rounded-2xl font-black hover:bg-slate-100 transition-all text-sm md:text-base">ยกเลิก</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* -------------------- ALL COUPONS MODAL -------------------- */}
      <AnimatePresence>
        {showAllPromosModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-red-950/80 backdrop-blur-md"
              onClick={() => setShowAllPromosModal(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-[#FCFBFA] w-full max-w-3xl max-h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/20"
            >
              {/* Modal Header */}
              <div className="p-6 md:p-8 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-red-950 shadow-lg shadow-amber-500/20">
                    <Ticket size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-2xl font-black text-slate-900">คูปองทั้งหมด</h2>
                    <p className="text-xs md:text-sm text-slate-400 font-bold uppercase tracking-wider">Total {promotions.length} Vouchers</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAllPromosModal(false)}
                  className="w-8 h-8 md:w-10 md:h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-700 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body (Scrollable List) */}
              <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar bg-slate-50/50 flex-1">
                <div className="flex flex-col gap-4">
                  {promotions.map(p => (
                    <CouponItem
                      key={p.promotion_group_id}
                      p={p}
                      onEdit={() => {
                        setShowAllPromosModal(false);
                        openEditPromo(p);
                      }}
                      onDelete={() => deletePromotion(p.promotion_group_id)}
                    />
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 md:p-6 bg-white border-t border-slate-100 flex justify-end shrink-0 pb-safe">
                <button
                  onClick={() => {
                    setShowAllPromosModal(false);
                    setEditPromo(false);
                    setPromoForm({
                      name: "", element: "", description: "", discount_value: "",
                      start_date: "", end_date: "", status: "AVAILABLE"
                    });
                    setPromoModal(true);
                  }}
                  className="bg-red-900 text-amber-400 px-6 py-3 rounded-xl font-black text-xs md:text-sm flex items-center gap-2 hover:bg-red-800 transition-all w-full md:w-auto justify-center"
                >
                  <Plus size={16} /> เพิ่มคูปองใหม่
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING ACTION BUTTON */}
      <button onClick={openAddModal} className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-amber-500 text-red-950 rounded-2xl shadow-2xl flex items-center justify-center z-40 active:scale-90 border-4 border-white"><Plus size={28} strokeWidth={3} /></button>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #fee2e2; border-radius: 10px; }
        /* Fix for mobile keyboard pushing content */
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>
    </div>
  )
}

export default DashboardRestaurant