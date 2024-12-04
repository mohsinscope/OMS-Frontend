import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import ProtectedRoute from "./components/ProtectedRoute";
import SignInPage from "./pages/signIn.jsx";
import Dashboard from "./pages/dashBoard.jsx";
import ListOfValueAdmin from './roles/admin/ListOfValueAdmin/ListOfValueAdmin.jsx';
import AdminAttendance from "./roles/admin/admin-attendence/adminAttendence.jsx";
import AdminExpenses from "./roles/admin/admin-expensess/adminExpensess.jsx";
import AdminUserManagement from "./roles/admin/user-managment/AdminUserManagment.jsx";
import SuperVisorExpensesRequuest from './roles/superVisor/expenses/SyperVisorExpensesRequest.jsx';
import SuperVisorExpensesHistory from "./roles/superVisor/expenses/SuperVisorExpensessHistory.jsx";
import Layout from './pages/LayOut.jsx';
import Settings from './reusable/settings.jsx';
import useAuthStore from './store/store.js';
import ExpensessView from "./reusable/ExpensessView.jsx";



const App = () => {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize(); // Validate persisted state
  }, []);

  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
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
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="admin/expenses" element={<AdminExpenses />} />
            <Route path="admin/attendence" element={<AdminAttendance />} />
            <Route path="admin/users" element={<AdminUserManagement />} />
            <Route path="admin/listofvalues" element={<ListOfValueAdmin />} />
            <Route path="settings" element={<Settings />} />
            <Route path="supervisor/ExpensesRequests" element={<SuperVisorExpensesRequuest />} />
            <Route path="supervisor/Expensess" element={<SuperVisorExpensesHistory />} />
            <Route path="expenses-view" element={<ExpensessView />} />
          </Route>
        </Routes>
      </Router>
    </MantineProvider>
  );
};

export default App;
