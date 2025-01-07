import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./pages/LayOut.jsx";
import useAuthStore from "./store/store.js";
import SignInPage from "./pages/signIn.jsx";
import Stats from "./pages/stats.jsx";
import LandingPage from "./pages/landingPage.jsx";


import axiosInstance from './intercepters/axiosInstance.js';

// Import all components
import Dashboard from "./pages/dashBoard.jsx";
import AdminExpenses from "./roles/admin/admin-expensess/adminExpensess.jsx";
import AdminAttendance from "./roles/admin/admin-attendence/adminAttendence.jsx";
import AdminUserManagement from "./roles/admin/user-managment/AdminUserManagment.jsx";
import ListOfValueAdmin from "./roles/admin/ListOfValueAdmin/ListOfValueAdmin.jsx";
import Settings from "./reusable/settings.jsx";
import ExpensessView from "./reusable/ExpensessView.jsx";

import SuperVisorExpensesRequest from "./roles/superVisor/expenses/SyperVisorExpensesRequest.jsx";
import SuperVisorExpensesHistory from "./roles/superVisor/expenses/SuperVisorExpensessHistory.jsx";
import SuperVisorAttendenceHistory from "./roles/superVisor/attendence/superVisorAttendenceHistory.jsx";
import SuperVisorAttendenceAdd from "./roles/superVisor/attendence/superVisorAttendenceAdd.jsx";
import ViewAttendance from "./roles/superVisor/attendence/attendenceView.jsx";

import SuperVisorDamagedpasportsHistory from "./roles/superVisor/damaggedPasports/dammagedPasportsHistory.jsx";
import DammagedPasportsShow from "./roles/superVisor/damaggedPasports/DammagedPasportsShow.jsx";
import SuperVisorDammagePassportAdd from "./roles/superVisor/damaggedPasports/superVisorDammagePassportAdd.jsx";

import SuperVisorDevices from "./roles/superVisor/damegedDevices/SuperVisorDevice.jsx";
import SuperVisorDeviceShow from "./roles/superVisor/damegedDevices/SuperVisorDeviceShow.jsx";
import SuperVisorDevicesAdd from "./roles/superVisor/damegedDevices/superVisorDevicesAdd.jsx";

import ManagerExpensesHistory from "./roles/Manager/Expensess/ManagerExpensessHistory.jsx";
import ManagerExpensesView from "./roles/Manager/Expensess/ManagerExpensessView.jsx";
import ManagerExpensesRequests from "./roles/Manager/Expensess/ManagerExpensessRequists.jsx";
import ManagerExpensesRequestView from "./roles/Manager/Expensess/ManagerExpensessRequistView.jsx";
import ManagerAttendenceHistory from "./roles/Manager/attendence/ManagerAttendenceHistory.jsx";
import ManagerAttendenceView from "./roles/Manager/attendence/ManagerAttendenceView.jsx";

import DammagedDevicess from "./roles/employeeOfDammage/devicess/DammagedDevicess.jsx";
import DammagedPasports from "./roles/employeeOfDammage/pasports/DammagedPasports.jsx";

import FollowUpEmployeeExpensess from "./roles/FollowUpEmployee/expensess/FollowUpEmployeeExpensess.jsx";
import FollowUpEmployeeAttensence from "./roles/FollowUpEmployee/attendence/FollowUpEmployeeAttensence.jsx";
import SuperVisorLecturerhistory from "./roles/superVisor/lecturer/SuperVisorLecturerhistory.jsx";
import SuperVisorLecturerAdd from "./roles/superVisor/lecturer/SuperVisorLecturerAdd.jsx";
import LecturerShow from "./roles/superVisor/lecturer/SuperVisorLecturerShow.jsx";

const App = () => {
  // Centralized routes configuration
  const routes = [
    { path: "dashboard", element: <Dashboard /> },
    { path: "Stats", element: <Stats /> },
    // Admin Routes
    { path: "admin/expenses", element: <AdminExpenses /> },
    { path: "admin/attendence", element: <AdminAttendance /> },
    { path: "admin/users", element: <AdminUserManagement /> },
    { path: "admin/listofvalues", element: <ListOfValueAdmin /> },

    // Supervisor Routes
    {
      path: "supervisor/ExpensesRequests",
      element: <SuperVisorExpensesRequest />,
    },
    { path: "supervisor/Expensess", element: <SuperVisorExpensesHistory /> },
    { path: "supervisor/Attendence", element: <SuperVisorAttendenceHistory /> },
    {
      path: "supervisor/Attendence/AttendenceAdd",
      element: <SuperVisorAttendenceAdd />,
    },
    { path: "attendance/view", element: <ViewAttendance /> },
   

    {
      path: "/supervisor/damagedpasportshistory",
      element: <SuperVisorDamagedpasportsHistory />,
    },
    {
      path: "/supervisor/damagedpasportshistory/DammagedPasportsShow",
      element: <DammagedPasportsShow />,
    },
    {
      path: "/supervisor/damagedpasportshistory/supervisordammagepasportadd",
      element: <SuperVisorDammagePassportAdd />,
    },
    { path: "/supervisor/damegedDevices", element: <SuperVisorDevices /> },
    {
      path: "/damegedDevices/show",
      element: <SuperVisorDeviceShow />,
    },
    {
      path: "/damegedDevices/add",
      element: <SuperVisorDevicesAdd />,
    },
    {
      path: "/supervisor/lecturer/history",
      element: <SuperVisorLecturerhistory />,
    },
    {
      path: "/supervisor/lecturerAdd/supervisorlecturerAdd",
      element: <SuperVisorLecturerAdd />,
    },
    {
      path: "/supervisor/lecturer/history/LecturerShow",
      element: <LecturerShow />,
    },

    // Manager Routes
    { path: "manager/expensess", element: <ManagerExpensesHistory /> },
    { path: "manager/expensess/view", element: <ManagerExpensesView /> },
    {
      path: "manager/expensess/requists",
      element: <ManagerExpensesRequests />,
    },
    {
      path: "manager/expensess/requists/view",
      element: <ManagerExpensesRequestView />,
    },
    { path: "manager/attendence", element: <ManagerAttendenceHistory /> },
    { path: "manager/attendence/view", element: <ManagerAttendenceView /> },

    // dammage employee
    { path: "/employee_damage/damage/devices", element: <DammagedDevicess /> },
    { path: "/employee_damage/damage/pasports", element: <DammagedPasports /> },

    //FollowUpEmployee
    {
      path: "/employee_expenses/expenses",
      element: <FollowUpEmployeeExpensess />,
    },
    {
      path: "/employee_expenses/attendence",
      element: <FollowUpEmployeeAttensence />,
    },

    // Common Routes
    { path: "settings", element: <Settings /> },
    { path: "expenses-view", element: <ExpensessView /> },
    { path: "landing-page", element: <LandingPage /> },
  ];


  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Make axios instance available globally
        window.axios = axiosInstance;
        
        // Initialize auth state
        await initializeAuth();
        
        setIsLoading(false);
      } catch (error) {
        console.error('Initialization error:', error);
        setError(error.message || 'Failed to initialize application');
        setIsLoading(false);
      }
    };

    init();
  }, [initializeAuth]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }




  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<SignInPage />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
          {/* Define nested protected routes */}
          {routes.map(({ path, element }, index) => (
            <Route key={index} path={path} element={element} />
          ))}
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
