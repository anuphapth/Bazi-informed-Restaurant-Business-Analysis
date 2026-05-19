import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import liff from "@line/liff";
import axios from "axios";
import { MapPin, Phone, User, Loader2, AlertCircle, Clock } from "lucide-react";
import logo from "../assets/logo.svg";

function Registeruser() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [lineUid, setLineUid] = useState(null);
  const [lineProfile, setLineProfile] = useState(null);
  const [acceptPdpa, setAcceptPdpa] = useState(false);

  const [form, setForm] = useState({
    name: "",
    gender: "",
    phone: "",
    birth_time: "",
    birth_place: "",
  });

  const [thaiBirthDate, setThaiBirthDate] = useState({
    day: "",
    month: "",
    year: "",
  });

  const t = params.get("t");

  // --- Logic สำหรับ Dropdown วันที่ ---
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear() + 543;
    return Array.from({ length: 120 }, (_, i) => currentYear - i);
  }, []);

  const months = [
    { value: "1", label: "มกราคม" },
    { value: "2", label: "กุมภาพันธ์" },
    { value: "3", label: "มีนาคม" },
    { value: "4", label: "เมษายน" },
    { value: "5", label: "พฤษภาคม" },
    { value: "6", label: "มิถุนายน" },
    { value: "7", label: "กรกฎาคม" },
    { value: "8", label: "สิงหาคม" },
    { value: "9", label: "กันยายน" },
    { value: "10", label: "ตุลาคม" },
    { value: "11", label: "พฤศจิกายน" },
    { value: "12", label: "ธันวาคม" },
  ];

  const daysInMonth = useMemo(() => {
    if (!thaiBirthDate.month || !thaiBirthDate.year) return 31;
    // ใช้ปี ค.ศ. สำหรับคำนวณจำนวนวันในเดือนนั้นๆ (Leap Year) ให้แม่นยำ
    const yearAD = parseInt(thaiBirthDate.year) - 543;
    const month = parseInt(thaiBirthDate.month);
    return new Date(yearAD, month, 0).getDate();
  }, [thaiBirthDate.month, thaiBirthDate.year]);

  const handleDateDropdownChange = (e) => {
    const { name, value } = e.target;
    if (name === "year") {
      setThaiBirthDate({ year: value, month: "", day: "" });
    } else if (name === "month") {
      setThaiBirthDate((prev) => ({ ...prev, month: value, day: "" }));
    } else {
      setThaiBirthDate((prev) => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        if (!t) {
          setError("ลิงก์ไม่ถูกต้อง กรุณาเข้าผ่าน LINE อีกครั้ง");
          return;
        }
        await liff.init({
          liffId: import.meta.env.VITE_LIFF_ID,
          withLoginOnExternalBrowser: true,
        });
        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }
        const profile = await liff.getProfile();
        setLineUid(profile.userId);
        setLineProfile(profile);
        setForm((prev) => ({ ...prev, name: profile.displayName }));
      } catch (e) {
        setError("ไม่สามารถเชื่อมต่อ LINE ได้");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [t]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const onlyNums = value.replace(/[^0-9]/g, "").slice(0, 10);
      setForm({ ...form, phone: onlyNums });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!acceptPdpa) {
      setError("กรุณายอมรับนโยบาย PDPA");
      return;
    }
    if (!thaiBirthDate.year || !thaiBirthDate.month || !thaiBirthDate.day) {
      setError("กรุณาระบุวัน/เดือน/ปีเกิดให้ครบถ้วน");
      return;
    }

    // แก้ไข: ส่งปีเป็น พ.ศ. ตรงๆ ตามที่คุณต้องการ (เช่น 2535-05-20)
    const formattedDate = `${thaiBirthDate.year}-${thaiBirthDate.month.padStart(2, "0")}-${thaiBirthDate.day.padStart(2, "0")}`;

    setSubmitting(true);
    setError("");

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/register?t=${t}`,
        {
          lineUid,
          ...form,
          birth_date: formattedDate, // ปีในนี้จะเป็น พ.ศ. แล้วครับ
          accept_pdpa: true,
        },
      );
      navigate(`/loginuser?t=${t}`, { replace: true });
    } catch (err) {
      setError("สมัครสมาชิกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="animate-spin text-red-600 mb-4" size={40} />
        <p className="text-gray-500 font-medium">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 md:p-8">
      <div className="bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100">
        {/* ฝั่งซ้าย: Branding & Profile */}
        <div className="bg-gray-600 md:w-5/12 p-8 md:p-12 text-white flex flex-col justify-center items-center text-center">
          <div className="bg-white p-2 rounded-[2rem] shadow-xl mb-6">
            <img
              src={logo}
              alt="Bazi Logo"
              className="w-28 h-28 md:w-32 md:h-32 object-contain"
            />
          </div>

          <h1 className="text-3xl font-black uppercase tracking-widest mb-2">
            Bazi Member
          </h1>
          <p className="text-red-100 mb-8 opacity-90 text-x md:text-base">
            สมัครสมาชิกเพื่อแนะนำเมนู <br /> ที่เหมาะสมกับธาตุของคุณ
          </p>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 w-full max-w-xs border border-white/20">
            <img
              src={lineProfile?.pictureUrl}
              alt="profile"
              className="w-14 h-14 rounded-full border-2 border-white/50"
            />
            <div className="text-left">
              <p className="text-[14px] font-bold text-red-200 uppercase tracking-tighter">
                Connected With
              </p>
              <p className="text-lg font-bold truncate w-32">
                {lineProfile?.displayName}
              </p>
            </div>
          </div>
        </div>

        {/* ฝั่งขวา: ฟอร์มกรอกข้อมูล */}
        <div className="md:w-7/12 p-8 md:p-12 bg-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <span className="w-8 h-1 bg-red-600 rounded-full"></span>
              ข้อมูลส่วนตัว
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-sm font-semibold flex items-center gap-2">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="text-x font-bold text-gray-400 uppercase mb-1.5 block ml-1">
                  ชื่อ-นามสกุล
                </label>
                <div className="relative">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="กรอกชื่อตามบัตรประชาชน"
                    className="w-full bg-gray-50 border border-transparent focus:border-red-600 focus:bg-white p-4 pl-12 rounded-2xl outline-none ring-1 ring-gray-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-x font-bold text-gray-400 uppercase mb-1.5 block ml-1">
                  เพศ
                </label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-50 border border-transparent focus:border-red-600 focus:bg-white p-4 rounded-2xl outline-none ring-1 ring-gray-100"
                >
                  <option value="">เลือกเพศ</option>
                  <option value="male">ชาย</option>
                  <option value="female">หญิง</option>
                </select>
              </div>

              <div>
                <label className="text-x font-bold text-gray-400 uppercase mb-1.5 block ml-1">
                  เบอร์โทรศัพท์
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    maxLength="10"
                    required
                    placeholder="0xxxxxxxxx"
                    className="w-full bg-gray-50 border border-transparent focus:border-red-600 focus:bg-white p-4 pl-12 rounded-2xl outline-none ring-1 ring-gray-100 transition-all"
                  />
                </div>
              </div>

              {/* วันเกิด Dropdown (เลือกปี > เดือน > วัน) */}
              <div className="md:col-span-2">
                <label className="text-x font-bold text-gray-400 uppercase mb-1.5 block ml-1">
                  วัน/เดือน/ปีเกิด (พ.ศ.)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <select
                    name="year"
                    value={thaiBirthDate.year}
                    onChange={handleDateDropdownChange}
                    required
                    className="bg-gray-50 p-4 rounded-2xl ring-1 ring-gray-100 outline-none focus:ring-red-600 transition-all text-sm"
                  >
                    <option value="">ปี พ.ศ.</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>

                  <select
                    name="month"
                    value={thaiBirthDate.month}
                    onChange={handleDateDropdownChange}
                    disabled={!thaiBirthDate.year}
                    required
                    className={`bg-gray-50 p-4 rounded-2xl ring-1 ring-gray-100 outline-none focus:ring-red-600 transition-all text-sm ${!thaiBirthDate.year ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="">เดือน</option>
                    {months.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>

                  <select
                    name="day"
                    value={thaiBirthDate.day}
                    onChange={handleDateDropdownChange}
                    disabled={!thaiBirthDate.month}
                    required
                    className={`bg-gray-50 p-4 rounded-2xl ring-1 ring-gray-100 outline-none focus:ring-red-600 transition-all text-sm ${!thaiBirthDate.month ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <option value="">วันที่</option>
                    {Array.from({ length: daysInMonth }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-x font-bold text-gray-400 uppercase mb-1.5 block ml-1">
                  เวลาเกิด
                </label>
                <div className="relative">
                  <Clock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="time"
                    name="birth_time"
                    value={form.birth_time}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-50 p-4 pl-12 rounded-2xl ring-1 ring-gray-100 outline-none focus:ring-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-x font-bold text-gray-400 uppercase mb-1.5 block ml-1">
                  สถานที่เกิด
                </label>
                <div className="relative">
                  <MapPin
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    name="birth_place"
                    value={form.birth_place}
                    onChange={handleChange}
                    required
                    placeholder="ระบุสถานที่เกิด"
                    className="w-full bg-gray-50 p-4 pl-12 rounded-2xl ring-1 ring-gray-100 outline-none focus:ring-red-600"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <label className="flex gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptPdpa}
                  onChange={(e) => setAcceptPdpa(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-red-600 cursor-pointer"
                />
                <span className="text-x text-gray-500 leading-relaxed">
                  ฉันยอมรับให้นำข้อมูลไปใช้คำนวณดวงชะตาตามนโยบายคุ้มครองข้อมูลส่วนบุคคล
                  (PDPA)
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || !acceptPdpa}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-2xl shadow-lg shadow-red-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-lg uppercase tracking-wider"
            >
              {submitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                "ลงทะเบียนสมาชิก"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Registeruser;
