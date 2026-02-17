import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Utensils, User, LogOut } from 'lucide-react';
import useAdmin from '../store/useAdmin';

const Adminnav = () => {
  const actionLogout = useAdmin((state) => state.actionLogout)
  const navigate = useNavigate()

  const handleLogout = () => {
    actionLogout()
    navigate('/admin')
  }

  return (
    <>
      <header className='fixed top-0 left-0 w-full z-50 flex shadow-lg bg-background/55 backdrop-blur supports-[backdrop-filter]:bg-background/60' >
        {/* header left */}
        <div className='container mx-auto px-16 py-4 flex justify-start items-center'>
          <div className='px-2'>
            <Utensils />
          </div>
          <div className='px-2'>
            <h1>Bazi Resturant</h1>
          </div>
        </div>

        {/* header right*/}
        <div className='container mx-auto px-16 py-4 flex justify-end items-center'>
          <Link to="/admin" className='px-2' >
            แดชบอร์ด
          </Link>
          <Link to="/admin/allrestaurent" className='px-2' >
            รายชื่อร้านทั้งหมด
          </Link>
          <Link to="/admin/alluser" className='px-2' >
            รายชื่อผู้ใช้ทั้งหมด
          </Link>

          <Link to='/admin/profileadmin' className='px-2'>
            <User />
          </Link>

          {/* ✅ logout */}
          <button onClick={handleLogout}>
            <LogOut className="cursor-pointer" />
          </button>
        </div>
      </header>
    </>
  );
};

export default Adminnav;

