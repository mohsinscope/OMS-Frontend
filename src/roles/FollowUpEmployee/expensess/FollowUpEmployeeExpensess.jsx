import React, { useState, useEffect } from "react";
import { Table, message } from "antd"; // Import Ant Design components
import { Link } from "react-router-dom"; // Import Link for navigation
import "./FollowUpEmployeeExpensess.css"; // Import custom CSS
import TextFieldForm from "./../../../reusable elements/ReuseAbleTextField.jsx"; // Reusable form component
import useAuthStore from "./../../../store/store"; // Sidebar state for layout
import axios from "axios"; // API requests
import Url from "./../../../store/url.js"; // API base URL

export default function FollowUpEmployeeExpensess() {
  const { isSidebarCollapsed } = useAuthStore(); // Access sidebar collapse state
  const [expensesList, setExpensesList] = useState([]); // State for expenses data
  const [filteredExpenses, setFilteredExpenses] = useState([]); // State for filtered expenses
  const [loading, setLoading] = useState(false); // State for loading spinner

  // Filter fields for the form
  const fields = [
    {
      name: "اسم المشرف",
      label: "اسم المشرف",
      placeholder: "",
      type: "dropdown",
      options: [
        { value: "احمد علي كاظم", label: "احمد علي كاظم" },
        { value: "حامد جاسم منصور", label: "حامد جاسم منصور" },
        { value: "كاظم صلاح كاظم", label: "كاظم صلاح كاظم" },
      ],
    },
    {
      name: "المحافظة",
      label: "المحافظة",
      placeholder: "",
      type: "dropdown",
      options: [
        { value: "بغداد", label: "بغداد" },
        { value: "البصرة", label: "البصرة" },
        { value: "المثنى", label: "المثنى" },
      ],
    },
    {
      name: "اسم المكتب",
      label: "اسم المكتب",
      placeholder: "",
      type: "dropdown",
      options: [
        { value: "المنصور", label: "المنصور" },
        { value: "الكاظمية", label: "الكاظمية" },
        { value: "كربلاء", label: "كربلاء" },
      ],
    },
    {
      name: "رقم الطلب",
      label: "رقم الطلب",
      placeholder: "",
      type: "text",
    },
    {
      name: "الحالة",
      label: "الحالة",
      placeholder: "",
      type: "dropdown",
      options: [
        { value: "انجزت", label: "انجزت" },
        { value: "قدمت للمشرف", label: "قدمت للمشرف" },
        { value: "ارجعت للمشرف", label: "ارجعت للمشرف" },
      ],
    },
    {
      name: "date",
      label: "التاريخ",
      placeholder: "",
      type: "date",
    },
  ];

  // Fetch data on page load
  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true); // Start loading spinner
      try {
        const response = await axios.get(`${Url}/api/expenses`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Authorization header
          },
        });
        setExpensesList(response.data);
        setFilteredExpenses(response.data); // Initially, filtered expenses match all expenses
      } catch (error) {
        console.error("Error fetching expenses:", error);
        message.error("حدث خطأ أثناء تحميل البيانات");
      } finally {
        setLoading(false); // Stop loading spinner
      }
    };

    fetchExpenses();
  }, []);

  // Filter handler
  const handleFilterSubmit = (formData) => {
    const filtered = expensesList.filter((expense) => {
      const matchesSupervisor =
        !formData["اسم المشرف"] || expense.supervisorName === formData["اسم المشرف"];
      const matchesGovernorate =
        !formData["المحافظة"] || expense.governorateName === formData["المحافظة"];
      const matchesOffice =
        !formData["اسم المكتب"] || expense.officeName === formData["اسم المكتب"];
      const matchesStatus =
        !formData["الحالة"] || expense.status === formData["الحالة"];
      const matchesRequestId =
        !formData["رقم الطلب"] ||
        expense.requestId.toString().includes(formData["رقم الطلب"]);
      const matchesDate =
        !formData["التاريخ"] || expense.date.includes(formData["التاريخ"]);

      return (
        matchesSupervisor &&
        matchesGovernorate &&
        matchesOffice &&
        matchesStatus &&
        matchesRequestId &&
        matchesDate
      );
    });

    if (filtered.length === 0) {
      message.warning("لا توجد نتائج تطابق الفلاتر المحددة");
    }

    setFilteredExpenses(filtered);
  };

  // Reset filter
  const handleReset = () => {
    setFilteredExpenses(expensesList);
    message.success("تم إعادة تعيين الفلاتر بنجاح");
  };

  // Table columns
  const columns = [
    {
      title: "رقم الطلب",
      dataIndex: "requestId",
      key: "requestId",
      className: "table-column-request-id",
    },
    {
      title: "اسم المشرف",
      dataIndex: "supervisorName",
      key: "supervisorName",
      className: "table-column-supervisor-name",
    },
    {
      title: "المحافظة",
      dataIndex: "governorateName",
      key: "governorateName",
      className: "table-column-governorate-name",
    },
    {
      title: "اسم المكتب",
      dataIndex: "officeName",
      key: "officeName",
      className: "table-column-office-name",
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
      className: "table-column-status",
    },
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
      className: "table-column-date",
    },
    {
      title: "الإجراءات",
      key: "actions",
      className: "table-column-actions",
      render: (_, record) => (
        <Link
          to={`/expenses/details/${record.requestId}`}
          className="expenses-details-link"
        >
          عرض
        </Link>
      ),
    },
  ];

  return (
    <div
      className={`follow-up-expenses-page ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl"
    >
      {/* Page Title */}
      <h1 className="follow-up-expenses-title">سجل الصرفيات</h1>

      {/* Filter Form */}
      <div className="follow-up-expenses-filters">
        <TextFieldForm
          fields={fields}
          onFormSubmit={handleFilterSubmit}
          onReset={handleReset}
          formClassName="follow-up-expenses-form"
          inputClassName="follow-up-expenses-input"
          dropdownClassName="follow-up-expenses-dropdown"
          fieldWrapperClassName="follow-up-expenses-field-wrapper"
          buttonClassName="follow-up-expenses-button"
        />
      </div>

      {/* Expenses Table */}
      <div className="follow-up-expenses-table-container">
        <Table
          dataSource={filteredExpenses}
          columns={columns}
          rowKey="requestId"
          bordered
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: "لا توجد بيانات" }}
          loading={loading}
          className="follow-up-expenses-table"
        />
      </div>
    </div>
  );
}
