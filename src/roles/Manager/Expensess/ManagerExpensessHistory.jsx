import React, { useState } from "react";
import { Table, Button, message, ConfigProvider } from "antd";
import { Link } from "react-router-dom"; // Correct import
import TextFieldForm from "./../../../reusable elements/ReuseAbleTextField.jsx";
import "./styles/ManagerExpensessHistory.css";
import useAuthStore from "./../../../store/store"; // Import sidebar state for dynamic class handling
const expensesData = [
  {
    "الرقم التسلسلي": "001",
    التاريخ: "2023-03-05",
    الحالة: "قُدمت للمدير",
    "الكلفة الكلية": "1,000,000",
    "اسم المكتب": "كرادة",
    المحافظة: "بغداد",
  },
  {
    "الرقم التسلسلي": "002",
    التاريخ: "2023-10-01",
    الحالة: "قُدمت للمدير",
    "الكلفة الكلية": "150,000",
    "اسم المكتب": "الناصرية",
    المحافظة: "ذي قار",
  },
  {
    "الرقم التسلسلي": "003",
    التاريخ: "2023-10-02",
    الحالة: "قُدمت للمدير",
    "الكلفة الكلية": "300,000",
    "اسم المكتب": "سماوة",
    المحافظة: "المثنى",
  },
  {
    "الرقم التسلسلي": "004",
    التاريخ: "2023-10-25",
    الحالة: "قُدمت للمشرف",
    "الكلفة الكلية": "500,000",
    "اسم المكتب": "الزبير",
    المحافظة: "البصرة",
  },
  {
    "الرقم التسلسلي": "005",
    التاريخ: "2023-04-01",
    الحالة: "قُدمت للحسابات",
    "الكلفة الكلية": "10,000",
    "اسم المكتب": "سوران",
    المحافظة: "أربيل",
  },
  {
    "الرقم التسلسلي": "006",
    التاريخ: "2024-09-10",
    الحالة: "قُدمت للمدير",
    "الكلفة الكلية": "300,000",
    "اسم المكتب": "كربلاء المقدسة",
    المحافظة: "كربلاء المقدسة",
  },
  {
    "الرقم التسلسلي": "007",
    التاريخ: "2024-08-08",
    الحالة: "قُدمت للمدير",
    "الكلفة الكلية": "30,000",
    "اسم المكتب": "النجف المركز",
    المحافظة: "النجف الاشرف",
  },
];

export default function ManagerExpensesHistory() {
  const [filterData, setFilterData] = useState({});
  const [expensesList, setExpensesList] = useState(expensesData);
  const { isSidebarCollapsed } = useAuthStore(); // Access sidebar collapse state
  const { searchVisible, toggleSearch } = useAuthStore(); // search visibility state from store
  const fields = [
    {
      name: "الرقم التسلسلي",
      label: "رقم الطلب",
      placeholder: "",
      type: "text",
    },

    {
      name: "اسم المكتب",
      label: "اسم المكتب",
      placeholder: "",
      type: "dropdown",
      options: [
        { value: "كرادة", label: "كرادة" },
        { value: "الناصرية", label: "الناصرية" },
        { value: "سماوة", label: "سماوة" },
        { value: "الزبير", label: "الزبير" },
        { value: "سوران", label: "سوران" },
      ],
    },
    {
      name: "المحافظة",
      label: "المحافظة",
      placeholder: "",
      type: "dropdown",
      options: [
        { value: "بغداد", label: "بغداد" },
        { value: "ذي قار", label: "ذي قار" },
        { value: "المثنى", label: "المثنى" },
        { value: "اربيل", label: "اربيل" },
        { value: "البصرة", label: "البصرة" },
      ],
    },
    {
      name: "الحالة",
      label: "الحالة",
      placeholder: "",
      type: "dropdown",
      options: [
        { value: "قُدمت للمدير", label: "قُدمت للمدير" },
        { value: "قُدمت للمشرف", label: "قُدمت للمشرف" },
        { value: "قُدمت للحسابات", label: "قُدمت للحسابات" },
      ],
    },
    {
      name: "dateFrom",
      label: "التاريخ من",
      placeholder: "ادخل تاريخ البداية",
      type: "date",
    },
    {
      name: "dateTo",
      label: "التاريخ الى",
      placeholder: "ادخل تاريخ النهاية",
      type: "date",
    },
  ];

  const handleFilterSubmit = (formData) => {
    const filteredExpenses = expensesData.filter((expense) => {
      const matchesGovernorate =
        !formData["المحافظة"] ||
        expense["المحافظة"]
          .toLowerCase()
          .includes(formData["المحافظة"].toLowerCase());
      const matchesOffice =
        !formData["اسم المكتب"] ||
        expense["اسم المكتب"]
          .toLowerCase()
          .includes(formData["اسم المكتب"].toLowerCase());
      const matchesId =
        !formData["الرقم التسلسلي"] ||
        expense["الرقم التسلسلي"]
          .toString()
          .toLowerCase()
          .includes(formData["الرقم التسلسلي"].toLowerCase());
      const matchesStatus =
        !formData["الحالة"] || expense["الحالة"] === formData["الحالة"];
      const matchesDateRange =
        (!formData["dateFrom"] ||
          new Date(expense["التاريخ"]) >= new Date(formData["dateFrom"])) &&
        (!formData["dateTo"] ||
          new Date(expense["التاريخ"]) <= new Date(formData["dateTo"]));

      return (
        matchesGovernorate &&
        matchesOffice &&
        matchesId &&
        matchesStatus &&
        matchesDateRange
      );
    });

    if (filteredExpenses.length === 0) {
      message.warning("لا توجد نتائج تطابق الفلاتر المحددة");
    }

    setExpensesList(filteredExpenses);
  };

  const handleReset = () => {
    setFilterData({});
    setExpensesList(expensesData);
    message.success("تم إعادة تعيين الفلاتر بنجاح");
  };

  const columns = [
    {
      title: "رقم الطلب",
      dataIndex: "الرقم التسلسلي",
      key: "id",
      className: "manager-expenses-history-column-id",
    },

    {
      title: "الموال المنفقة",
      dataIndex: "الكلفة الكلية",
      key: "totalAmount",
      className: "manager-expenses-history-column-total-amount",
    },
    {
      title: "اسم المكتب",
      dataIndex: "اسم المكتب",
      key: "officeName",
      className: "manager-expenses-history-column-office-name",
    },
    {
      title: "المحافظة",
      dataIndex: "المحافظة",
      key: "governorateName",
      className: "manager-expenses-history-column-governorate-name",
    },
    {
      title: "الحالة",
      dataIndex: "الحالة",
      key: "status",
      className: "manager-expenses-history-column-status",
    },
    {
      title: "التاريخ",
      dataIndex: "التاريخ",
      key: "date",
      className: "manager-expenses-history-column-date",
    },
    {
      title: "الإجراءات",
      key: "actions",
      className: "manager-expenses-history-column-actions",
      render: (_, record) => (
        <div className="manager-actions">
          <Button
            type="primary"
            style={{
              margin: "5px",
              backgroundColor: "#1890ff",
              color: "#fff",
              border: "none",
            }}>
            <Link
              to="/manager/expensess/view"
              state={{ data: record }}
              style={{ color: "#fff" }}>
              عرض
            </Link>
          </Button>
          <Button
            type="default"
            style={{
              margin: "5px",
              border: "1px solid #1890ff",
              color: "#1890ff",
            }}
            onClick={() => console.log("تعديل clicked:", record)}>
            تعديل
          </Button>
        </div>
      ),
    },
  ];

  return (
    <ConfigProvider direction="rtl">
      <div
        className={`manager-expenses-history-page ${
          isSidebarCollapsed
            ? "sidebar-collapsed"
            : "manager-expenses-history-page"
        }`}
        dir="rtl">
        <h1 className="manager-expenses-history-title">سجل الصرفيات</h1>

        <div
          className={`manager-expenses-history-filters ${
            searchVisible ? "animate-show" : "animate-hide"
          }`}>
          <TextFieldForm
            fields={fields}
            onFormSubmit={handleFilterSubmit}
            onReset={handleReset}
            formClassName="manager-expenses-history-form"
            inputClassName="manager-expenses-history-input"
            dropdownClassName="manager-expenses-history-dropdown"
            fieldWrapperClassName="manager-expenses-history-field-wrapper"
            buttonClassName="manager-expenses-history-button"
          />
        </div>
        <div className="toggle-search-button">
          <Button type="primary" onClick={toggleSearch}>
            {searchVisible ? " البحث" : " البحث"}
          </Button>
        </div>
        <div className="manager-expenses-history-table-container">
          <Table
            dataSource={expensesList}
            columns={columns}
            rowKey="الرقم التسلسلي"
            bordered
            pagination={{ pageSize: 5, position: ["bottomCenter"] }}
            locale={{ emptyText: "لا توجد بيانات" }}
            className="manager-expenses-history-table"
          />
        </div>
      </div>
    </ConfigProvider>
  );
}
