import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./pages/LayOut.jsx";
import useAuthStore from "./store/store.js";
import SignInPage from "./pages/signIn.jsx";
import Stats from './pages/stats/stats.jsx';
import ExpensessViewMonthly from './roles/superVisor/expenses/ExpensessViewMonthly.jsx';
import LandingPage from "./pages/landingPage.jsx";
import NotFound from "./pages/pageNotFound.jsx";
import Forbidden from "./pages/forbidden.jsx";
import axiosInstance from "./intercepters/axiosInstance.js";
//admin
import AdminUserManagement from "./roles/admin/user-managment/AdminUserManagment.jsx";
import ListOfValueAdmin from "./roles/admin/ListOfValueAdmin/ListOfValueAdmin.jsx";
import BannedUsers from "./roles/admin/banned-users/BannedUsers.jsx";
// Import all components
import Dashboard from "./pages/dashBoard.jsx";
import AdminExpenses from "./roles/admin/admin-expensess/adminExpensess.jsx";
import AdminAttendance from "./roles/admin/admin-attendence/adminAttendence.jsx";
import Settings from "./reusable/settings.jsx";
import ExpensessView from "./reusable/ExpensessView.jsx";
import SuperVisorExpensesShow from './roles/superVisor/expenses/ManagerExpensessView.jsx';
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
import ExpensessViewDaily from './roles/superVisor/expenses/expensessViewDaily.jsx';
import ExpensessAddDaily from './roles/superVisor/expenses/ExpensessAddDaily.jsx';
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
    { path: "/admin/ban", element: <BannedUsers /> },
    // Supervisor Routes
    {
      path: "/supervisor/ExpensesRequests",
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
    {
      path: "/supervisor/lecturer/history/LecturerShow",
      element: <LecturerShow />,
    },
    ,
    {
      path: "/Expensess-view-daily",
      element: <ExpensessViewDaily />,
    },
    {
      path: "/add-daily-expense",
      element: <ExpensessAddDaily />
    },
    {
      path: "/ExpensessViewMonthly",
      element: <ExpensessViewMonthly />
    },
    // Common Routes
    { path: "settings", element: <Settings /> },
    { path: "expenses-view", element: <ExpensessView /> },
    { path: "landing-page", element: <LandingPage /> },
    { path: "/forbidden", element: <Forbidden /> },
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
        console.error("Initialization error:", error);
        setError(error.message || "Failed to initialize application");
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

          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
