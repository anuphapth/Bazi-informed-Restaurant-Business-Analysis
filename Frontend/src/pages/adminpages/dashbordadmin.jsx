import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAdmin from "../../store/useAdmin";
import apiAdmin from "../../utils/apiAdmin";
import { X, Loader2, PlusCircle } from "lucide-react";

function Dashboardadmin() {
  const token = useAdmin((state) => state.token);
  const user = useAdmin((state) => state.user);
  const navigate = useNavigate();

  const [openForm, setOpenForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (!token) {
      navigate("/loginadmin");
    }
  }, [token, navigate]);

  if (!token) return null;

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) {
      return alert("กรุณากรอกข้อมูลให้ครบ");
    }

    try {
      setLoading(true);

      await apiAdmin.get("/api/admin/restaurant/create", form);

      alert("สร้างร้านอาหารสำเร็จแล้ว 🎉");
      setForm({ name: "", email: "", password: "" });
      setOpenForm(false);

    } catch (err) {
      console.error(err);
      alert("ไม่สามารถสร้างร้านอาหารได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-6">
        Dashboard ร้าน {user?.name}
      </h1>

      {/* ปุ่ม Register */}
      <button
        onClick={() => setOpenForm(true)}
        className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2"
      >
        <PlusCircle size={20} />
        Register Restaurant
      </button>

      {/* Modal Form */}
      {openForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[350px] space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg">Register Restaurant</h2>
              <button onClick={() => setOpenForm(false)}>
                <X />
              </button>
            </div>

            <input
              type="text"
              placeholder="Restaurant name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border p-2 rounded"
            />

            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border p-2 rounded"
            />

            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border p-2 rounded"
            />

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex justify-center"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Create"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboardadmin;
