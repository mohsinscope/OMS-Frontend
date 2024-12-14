import React, { useState } from "react";
import { Table, Button, message, ConfigProvider } from "antd";
import TextFieldForm from "../../../reusable elements/ReuseAbleTextField.jsx"; // Import reusable text field
import { Link, useNavigate } from "react-router-dom";
import "./styles/ManagerExpensessRequists.css";
import useAuthStore from "./../../../store/store"; // Import sidebar state for dynamic class handling
const dataSource = [
  {
    key: "1",
    requestNumber: "001",
    supervisor: "أحمد علي كاظم",
    governorate: "بغداد",
    officeName: "الكرادة",
    expense: "2,450,000",
    date: "2024-01-01",
    status: "قُدمت للحسابات",
  },
  {
    key: "2",
    requestNumber: "002",
    supervisor: "حامد باسم منصور",
    governorate: "النجف",
    officeName: "النجف المركز",
    expense: "2,150,000",
    date: "2024-11-03",
    status: "قُدمت للمدير",
  },
  {
    key: "3",
    requestNumber: "003",
    supervisor: "كاظم فتح كاظم",
    governorate: "ديالى",
    officeName: "بعقوبة",
    expense: "1,550,000",
    date: "2024-11-02",
    status: "أُنجزت",
  },
  {
    key: "4",
    requestNumber: "004",
    supervisor: "حامد باسم منصور",
    governorate: "أربيل",
    officeName: "سوران",
    expense: "3,500,000",
    date: "2024-11-06",
    status: "قُدمت للحسابات",
  },
];

export default function ManagerExpensessRequists() {
  const [filteredData, setFilteredData] = useState(dataSource);
  const [filters, setFilters] = useState({});
  const navigate = useNavigate();
  const { isSidebarCollapsed } = useAuthStore(); // Access sidebar collapse state
  const fields = [
    {
      name: "governorate",
      label: "المحافظة",
      placeholder: "",
      type: "dropdown",
      options: [
        { value: "بغداد", label: "بغداد" },
        { value: "النجف", label: "النجف" },
        { value: "ديالى", label: "ديالى" },
        { value: "أربيل", label: "أربيل" },
      ],
    },
    {
      name: "officeName",
      label: "اسم المكتب",
      placeholder: "",
      type: "dropdown",
      options: [
        { value: "الكرادة", label: "الكرادة" },
        { value: "النجف المركز", label: "المكتب المركزي" },
        { value: "بعقوبة", label: "بعقوبة" },
        { value: "سوران", label: "سوران" },
      ],
    },
    {
      name: "supervisor",
      label: "اسم المشرف",
      placeholder: "",
      type: "text",
    },
    {
      name: "status",
      label: "الحالة",
      placeholder: "",
      type: "dropdown",
      options: [
        { value: "قُدمت للحسابات", label: "قُدمت للحسابات" },
        { value: "قُدمت للمدير", label: "قُدمت للمدير" },
        { value: "أُنجزت", label: "أُنجزت" },
      ],
    },
    {
      name: "dateFrom",
      label: "التاريخ من",
      placeholder: "",
      type: "date",
    },
    {
      name: "dateTo",
      label: "التاريخ الى",
      placeholder: "",
      type: "date",
    },
    {
      name: "requestNumber",
      label: "رقم الطلب",
      placeholder: "",
      type: "text",
    },
  ];

  const handleFilterSubmit = (formData) => {
    const filtered = dataSource.filter((item) => {
      const matchesGovernorate =
        !formData.governorate ||
        item.governorate.includes(formData.governorate);
      const matchesOfficeName =
        !formData.officeName || item.officeName.includes(formData.officeName);
      const matchesSupervisor =
        !formData.supervisor || item.supervisor.includes(formData.supervisor);
      const matchesStatus = !formData.status || item.status === formData.status;

      const matchesDate =
        (!formData.dateFrom ||
          new Date(item.date) >= new Date(formData.dateFrom)) &&
        (!formData.dateTo || new Date(item.date) <= new Date(formData.dateTo));

      const matchesRequestNumber =
        !formData.requestNumber ||
        item.requestNumber.includes(formData.requestNumber);

      return (
        matchesGovernorate &&
        matchesOfficeName &&
        matchesSupervisor &&
        matchesStatus &&
        matchesDate &&
        matchesRequestNumber
      );
    });

    setFilteredData(filtered);
    message.success("تم تنفيذ البحث بنجاح");
  };

  const handleReset = () => {
    setFilters({});
    setFilteredData(dataSource);
    message.info("تمت إعادة تعيين الفلاتر");
  };

  const columns = [
    {
      title: "رقم الطلب",
      dataIndex: "requestNumber",
      key: "requestNumber",
    },
    {
      title: "اسم المشرف",
      dataIndex: "supervisor",
      key: "supervisor",
    },
    {
      title: "المحافظة",
      dataIndex: "governorate",
      key: "governorate",
    },
    {
      title: "اسم المكتب",
      dataIndex: "officeName",
      key: "officeName",
    },
    {
      title: "المصروفات",
      dataIndex: "expense",
      key: "expense",
    },
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          style={{ backgroundColor: "#1890ff", border: "none" }}
          onClick={() =>
            navigate("/manager/expensess/requists/view", {
              state: { data: record },
            })
          }>
          عرض
        </Button>
      ),
    },
  ];

  return (
    <ConfigProvider direction="rtl">
      <div
        className={`manager-expenses-requests-page ${
          isSidebarCollapsed
            ? "sidebar-collapsed"
            : "manager-expenses-requests-page"
        }`}
        dir="rtl">
        <h1 className="page-title">طلبات الصرفيات</h1>
        <div className="filter-section">
          <TextFieldForm
            fields={fields}
            onFormSubmit={handleFilterSubmit}
            onReset={handleReset}
            formClassName="filter-form"
            inputClassName="filter-input"
            dropdownClassName="filter-dropdown"
            fieldWrapperClassName="filter-field-wrapper"
            buttonClassName="filter-button"
          />
        </div>
        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey="key"
          bordered
          pagination={{ pageSize: 5, position: ["bottomCenter"] }}
          locale={{ emptyText: "لا توجد بيانات" }}
        />
      </div>
    </ConfigProvider>
  );
}
