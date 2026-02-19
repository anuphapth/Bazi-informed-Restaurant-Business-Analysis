import React from 'react'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layoutdashbord from '../layout/layoutdashbord';
import Dashbord from '../pages/dashbord';
//user
import Layoutuser from '../layout/layoutuser';
import Loginuser from '../pages/loginuser';
import Dashborduser from '../pages/userpages/dashborduser';
import Allmenu from '../pages/userpages/Allmenu';
import Profileuser from '../pages/userpages/Profileuser';
//restaurent
import Loginrestaurent from '../pages/loginrestaurent';
import Layoutrestaurent from '../layout/layoutrestaurent';
import Dashbordrestaurent from '../pages/restaurentpages/dashbordrestaurent';
import Profilerestaurent from '../pages/restaurentpages/profileresturent';
import Dashbrodadmin from '../pages/adminpages/dashbordadmin';
//admin
import Layoutadmin from '../layout/layoutadmin';
import Loginadmin from '../pages/loginadmin';
import Logoutuser from '../pages/logoutuser';
import Registeruser from '../pages/registeruser';
import Goodbye from '../pages/Goodbye';
import ScannerPage from '../pages/ScannerPage';
import CustomerManagement from '../pages/restaurentpages/CustomerManagement';

const router = createBrowserRouter([
    {
        path: "/",
        element: <Layoutdashbord />,
        children: [
            { index: true, element: <Dashbord /> },
            { path: "loginuser", element: <Loginuser /> },
            { path: "register", element: <Registeruser /> },
            { path: "loginrestaurent", element: <Loginrestaurent /> },
            { path: "loginadmin", element: <Loginadmin /> }
        ],
    },
    {
        path: "logout",
        element: <Logoutuser />,
    },
    {
        path: "goodbye",
        element: <Goodbye />,
    },
    {
        path: "scanner",
        element: <ScannerPage />,
    },
    {
        path: "user",
        element: <Layoutuser />,
        children: [
            { index: true, element: <Dashborduser /> },
            { path: "allmenu", element: <Allmenu /> },
            { path: "profileuser", element: <Profileuser /> }
        ],
    },
    {
        path: "restaurent",
        element: <Layoutrestaurent />,
        children: [
            { index: true, element: <Dashbordrestaurent /> },
            { path: "customer", element: <CustomerManagement /> },
            { path: "profilerestaurent", element: <Profilerestaurent /> }
        ],
    },
    {
        path: "admin",
        element: <Layoutadmin />,
        children: [
            { index: true, element: <Dashbrodadmin /> }

        ],
    }
])

function Approutes() {
    return (
        <>
            <RouterProvider router={router} />
        </>
    )
}

export default Approutes;