import { useLocation } from "react-router-dom"; // Used to access the current route's location
import Dashboard from "../../../pages/dashBoard.jsx"; // Import the Dashboard component
import "./adminExpensess.css"; // Import CSS for styling

const AdminExpenses = () => {
  const location = useLocation(); // Access the current location object, useful for breadcrumb or context

  // Array holding expense records
  const expenseRecords = [
    {
      id: 1,
      governorate: "بغداد", // Governorate name
      office: "الرصافة", // Office name
      supervisorName: "محمد علي", // Supervisor's name
      cost: "500000 دينار", // Cost of the expense
      date: "2024-11-30", // Expense date
    },
    {
      id: 2,
      governorate: "نينوى",
      office: "الموصل",
      supervisorName: "احمد كريم",
      cost: "300000 دينار",
      date: "2024-11-29",
    },
  ];

  return (
    <>
      <Dashboard /> {/* Include the Dashboard navigation */}
      <div className="expenses-container" dir="rtl">
        {" "}
        {/* Main container for expenses */}
        <h1 className="expenses-header">قائمة المصاريف</h1>{" "}
        {/* Header for the expenses list */}
        {/* DataTable for displaying expense records */}
      </div>
    </>
  );
};

export default AdminExpenses;
