import React, { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Loader2, CheckCircle2, XCircle, RefreshCw, ShieldCheck, Camera, Zap } from "lucide-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

export default function ScannerPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("idle"); // idle, success, error
  const [scannedCode, setScannedCode] = useState("");
  
  // 🔒 ตัวล็อคป้องกันการสแกนซ้อน
  const [isProcessing, setIsProcessing] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  const handleScan = async (result) => {
    // เงื่อนไข: ต้องมีค่า, ไม่กำลังประมวลผล, และสถานะต้องเป็น idle เท่านั้น
    if (result && result.length > 0 && !isProcessing && status === "idle") {
      const code = result[0].rawValue;
      
      setIsProcessing(true); // ล็อคทันทีที่เจอโค้ดรอบแรก
      setScannedCode(code);
      await useCoupon(code);
    }
  };

  const useCoupon = async (code) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.post(`${API_URL}/api/auth/coupon/use`, { 
        code: code 
      });

      if (res.data.status === "success" || res.data.message?.includes("success")) {
        setStatus("success");
      } else {
        throw new Error(res.data.message || "คูปองนี้ไม่สามารถใช้งานได้");
      }
    } catch (err) {
      console.error("Scan Error:", err);
      setError(err.response?.data?.message || err.message || "การเชื่อมต่อขัดข้อง");
      setStatus("error");
      // ถ้าสแกนพลาด อาจจะปล่อยให้สแกนใหม่ได้เลย หรือรอให้กด Reset ก็ได้
      // ในที่นี้เลือกให้กด Reset เพื่อความชัวร์ของพนักงานครับ
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setStatus("idle");
    setError(null);
    setScannedCode("");
    setIsProcessing(false); // ปลดล็อคให้สแกนใหม่ได้
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-[-5%] right-[-5%] w-[50%] h-[50%] bg-red-100/40 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[50%] h-[50%] bg-blue-50/50 blur-[100px] rounded-full" />

      <div className="w-full max-w-md z-10 space-y-8">
        
        {/* Header */}
        <header className="text-center space-y-2">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <div className="bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
              <Camera size={14} className="text-red-500" />
              <span className="text-slate-600 text-[10px] font-black uppercase tracking-[0.15em]">Redemption Terminal</span>
            </div>
          </motion.div>
          
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            BAZI <span className="text-red-600">SCANNER</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium px-6">สแกนรหัสเพื่อยืนยันการใช้สิทธิส่วนลดมงคล</p>
        </header>

        {/* Scanner Viewport */}
        <div className="relative">
          <div className="relative aspect-square w-full overflow-hidden rounded-[3.5rem] bg-white border-[8px] border-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] flex items-center justify-center">
            
            {status === "idle" ? (
              <>
                <div className="absolute inset-0 z-0">
                  <Scanner
                    onScan={handleScan}
                    allowMultiple={false}
                    scanDelay={2000}
                    constraints={{ facingMode: "environment" }}
                    components={{ audio: false, finder: false }}
                    styles={{ container: { width: '100%', height: '100%' } }}
                  />
                </div>
                
                {/* Overlay UI */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                  <div className="w-64 h-64 border border-white/20 rounded-[2.5rem] relative">
                    {/* Corners */}
                    <div className="absolute -top-1 -left-1 w-12 h-12 border-t-[6px] border-l-[6px] border-red-600 rounded-tl-3xl" />
                    <div className="absolute -top-1 -right-1 w-12 h-12 border-t-[6px] border-r-[6px] border-red-600 rounded-tr-3xl" />
                    <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-[6px] border-l-[6px] border-red-600 rounded-bl-3xl" />
                    <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-[6px] border-r-[6px] border-red-600 rounded-br-3xl" />
                    
                    {/* Laser Line Animation */}
                    <motion.div 
                      animate={{ top: ["5%", "95%"] }}
                      transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                      className="absolute left-4 right-4 h-[3px] bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_rgba(239,68,68,0.6)]"
                    />
                  </div>
                </div>
              </>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-20 ${
                    status === "success" ? "bg-emerald-50" : "bg-red-50"
                  }`}
                >
                  {loading ? (
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <Loader2 size={56} className="animate-spin text-red-600" />
                        <div className="absolute inset-0 blur-lg bg-red-500/20 animate-pulse" />
                      </div>
                      <p className="mt-6 font-black tracking-[0.2em] text-slate-400 text-xs">VERIFYING</p>
                    </div>
                  ) : status === "success" ? (
                    <>
                      <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }}
                        className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-200"
                      >
                        <CheckCircle2 size={48} className="text-white" />
                      </motion.div>
                      <h2 className="text-3xl font-black text-slate-900 mb-2">สำเร็จ!</h2>
                      <p className="text-emerald-600 font-bold">คูปองนี้ได้รับการยืนยันแล้ว</p>
                      <div className="mt-6 px-4 py-2 bg-white/50 rounded-xl border border-emerald-100">
                         <p className="text-[10px] text-slate-400 font-mono font-bold tracking-tight uppercase">Ref: {scannedCode}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }}
                        className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-red-200"
                      >
                        <XCircle size={48} className="text-white" />
                      </motion.div>
                      <h2 className="text-3xl font-black text-slate-900 mb-2">ไม่สำเร็จ</h2>
                      <p className="text-red-600 font-bold px-4 leading-relaxed">{error}</p>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-6">
          {status !== "idle" && !loading && (
            <motion.button
              whileHover={{ y: -4, shadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
              whileTap={{ scale: 0.98 }}
              onClick={resetScanner}
              className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-5 rounded-[2.5rem] font-black text-lg shadow-2xl shadow-slate-300 transition-all"
            >
              <RefreshCw size={22} />
              สแกนใบต่อไป
            </motion.button>
          )}
          
          <div className="flex items-center justify-between px-6">
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Security Verified</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px]">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              CLOUD ACTIVE
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}