import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import SignInPage from "./pages/signIn.jsx";
import Dashboard from "./pages/dashBoard.jsx";
import ListOfValueAdmin from "./roles/admin/ListOfValueAdmin/ListOfValueAdmin.jsx";
import AdminAttendance from "./roles/admin/admin-attendence/adminAttendence.jsx";
import AdminExpenses from "./roles/admin/admin-expensess/adminExpensess.jsx";
import AdminUserManagement from "./roles/admin/user-managment/AdminUserManagment.jsx";
import SuperVisorExpensesRequuest from "./roles/superVisor/expenses/SyperVisorExpensesRequest.jsx";
import SuperVisorExpensesHistory from "./roles/superVisor/expenses/SuperVisorExpensessHistory.jsx";
import Layout from "./pages/LayOut.jsx";
import Settings from "./reusable/settings.jsx";
import useAuthStore from "./store/store.js";
import ExpensessView from "./reusable/ExpensessView.jsx";
import SuperVisorAttendenceHistory from "./roles/superVisor/attendence/superVisorAttendenceHistory.jsx";
import SuperVisorAttendenceAdd from "./roles/superVisor/attendence/superVisorAttendenceAdd.jsx";
import ViewAttendance from "./roles/superVisor/attendence/attendenceView.jsx";
import SuperVisorAttendenceEdit from "./roles/superVisor/attendence/editAttendence.jsx";
import SuperVisorDamagedpasportsHistory from "./roles/superVisor/damaggedPasports/dammagedPasportsHistory.jsx";
import DammagedPasportsShow from "./roles/superVisor/damaggedPasports/DammagedPasportsShow.jsx";
import SuperVisorDammagePassportAdd from "./roles/superVisor/damaggedPasports/superVisorDammagePassportAdd.jsx";
import SuperVisorDevices from "./roles/superVisor/damegedDevices/SuperVisorDevice.jsx";
import SuperVisorDeviceShow from "./roles/superVisor/damegedDevices/SuperVisorDeviceShow.jsx";
import SuperVisorDivecesAdd from './roles/superVisor/damegedDevices/superVisorDevicesAdd.jsx';
const App = () => {
  const App = () => {
    const { initialize, isLoggedIn } = useAuthStore();
  
    useEffect(() => {
      initialize(); // This causes the error if `initialize` doesn't exist
    }, [initialize]);
  
    return <div>{isLoggedIn ? "Welcome back!" : "Please log in."}</div>;
  };
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
              <Layout /> {/* Use Layout for fixed Dashboard */}
            </ProtectedRoute>
          }>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="admin/expenses" element={<AdminExpenses />} />
          <Route path="admin/attendence" element={<AdminAttendance />} />
          <Route path="admin/users" element={<AdminUserManagement />} />
          <Route path="admin/listofvalues" element={<ListOfValueAdmin />} />
          <Route path="settings" element={<Settings />} />
          <Route
            path="supervisor/ExpensesRequests"
            element={<SuperVisorExpensesRequuest />}
          />
          <Route
            path="supervisor/Expensess"
            element={<SuperVisorExpensesHistory />}
          />
          <Route path="expenses-view" element={<ExpensessView />} />
          <Route
            path="supervisor/Attendence"
            element={<SuperVisorAttendenceHistory />}
          />
          <Route
            path="/supervisor/Attendence/AttendenceAdd"
            element={<SuperVisorAttendenceAdd />}
          />

          <Route path="/attendance/view" element={<ViewAttendance />} />
          <Route
            path="/attendance/view/supervisor/editattendence"
            element={<SuperVisorAttendenceEdit />}
          />

          <Route
            path="/supervisor/damagedpasportshistory"
            element={<SuperVisorDamagedpasportsHistory />}
          />
          <Route
            path="supervisor/damagedpasportshistory/DammagedPasportsShow"
            element={<DammagedPasportsShow />}
          />
          <Route
            path="/supervisor/damagedpasportshistory/supervisordammagepasportadd"
            element={<SuperVisorDammagePassportAdd />}
          />
          <Route
            path="/supervisor/damegedDevices"
            element={<SuperVisorDevices />}
          />
          <Route
            path="/supervisor/damegedDevices/show"
            element={<SuperVisorDeviceShow />}
          />
               <Route
            path="/supervisor/damegedDevices/add"
            element={<SuperVisorDivecesAdd />}
          />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
