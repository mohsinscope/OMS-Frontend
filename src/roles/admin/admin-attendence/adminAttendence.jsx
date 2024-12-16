import React, { useState } from "react";
import { Table, Button } from "antd"; // Import Ant Design Table and Button
import TextFieldForm from "./../../../reusable elements/ReuseAbleTextField.jsx";
import "./adminAttendence.css";
import useAuthStore from "./../../../store/store.js";
const AdminAttendance = () => {
  const [attendanceRecords] = useState([
    {
      key: "1",
      employeeName: "محمد علي",
      position: "مدير",
      date: "2024-11-30",
      status: "حاضر",
    },
    {
      key: "2",
      employeeName: "أحمد كريم",
      position: "محاسب",
      date: "2024-11-29",
      status: "غائب",
    },
  ]);
  const { isSidebarCollapsed } = useAuthStore(); // Access sidebar collapse state
  const [filteredRecords, setFilteredRecords] = useState(attendanceRecords);

  // Function to get fields for the filter form
  const getFilterFields = () => [
    {
      name: "governorate",
      label: "المحافظة",
      type: "dropdown",
      placeholder: "",
      options: [
        { value: "بغداد", label: "بغداد" },
        { value: "نينوى", label: "نينوى" },
      ],
    },
    {
      name: "office",
      label: "المكتب",
      type: "dropdown",
      placeholder: "",
      options: [
        { value: "مدير", label: "مدير" },
        { value: "محاسب", label: "محاسب" },
      ],
    },
    {
      name: "fromDate",
      label: "التاريخ من",
      type: "date",
    },
    {
      name: "toDate",
      label: "التاريخ إلى",
      type: "date",
    },
  ];

  // Table columns
  const columns = [
    {
      title: "اسم الموظف",
      dataIndex: "employeeName",
      key: "employeeName",
      align: "center",
    },
    {
      title: "الوظيفة",
      dataIndex: "position",
      key: "position",
      align: "center",
    },
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
      align: "center",
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
      align: "center",
    },
    {
      title: "الإجراءات",
      key: "actions",
      align: "center",
      render: (text, record) => (
        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          <Button type="primary" onClick={() => console.log("Edit:", record)}>
            تعديل
          </Button>
          <Button
            type="default"
            danger
            onClick={() => handleDelete(record.key)}>
            حذف
          </Button>
        </div>
      ),
    },
  ];

  // Filter logic
  const applyFilters = (filters) => {
    const { governorate, office, fromDate, toDate } = filters;

    const filtered = attendanceRecords.filter((record) => {
      const matchesGovernorate =
        !governorate || record.employeeName.includes(governorate);
      const matchesOffice = !office || record.position.includes(office);
      const matchesDate =
        (!fromDate || new Date(record.date) >= new Date(fromDate)) &&
        (!toDate || new Date(record.date) <= new Date(toDate));

      return matchesGovernorate && matchesOffice && matchesDate;
    });

    setFilteredRecords(filtered);
  };

  const handleDelete = (key) => {
    const confirmed = window.confirm("هل أنت متأكد أنك تريد حذف هذا السجل؟");
    if (confirmed) {
      setFilteredRecords((prev) => prev.filter((record) => record.key !== key));
    }
  };

  const resetFilters = () => {
    setFilteredRecords(attendanceRecords); // Reset to original data
  };
  const { searchVisible, toggleSearch } = useAuthStore(); // search visibility state from store
  return (
    <>
      <div
        className={`attendance-container ${
          isSidebarCollapsed ? "sidebar-collapsed" : "attendance-container"
        }`}
        dir="rtl">
        <h1 className="attendance-header">إدارة الحضور</h1>

        {/* Filters Section */}
        <div
          className={`attendance-filters ${
            searchVisible ? "animate-show" : "animate-hide"
          }`}>
          <TextFieldForm
            fields={getFilterFields()} // Use the extracted function to get fields
            onFormSubmit={applyFilters}
            onReset={resetFilters}
            formClassName="attendance-filter-form"
            inputClassName="attendance-filter-input"
            dropdownClassName="attendance-filter-dropdown"
            fieldWrapperClassName="attendance-filter-field-wrapper"
            buttonClassName="attendance-filter-button"
          />
        </div>
        <div className="toggle-search-button">
          <Button type="primary" onClick={toggleSearch}>
            {searchVisible ? " البحث" : " البحث"}
          </Button>
        </div>
        {/* Data Table Section */}
        <div className="attendance-data-table-container">
          <Table
            columns={columns}
            dataSource={filteredRecords}
            pagination={{ pageSize: 5 }}
            bordered
            size="middle"
          />
        </div>
      </div>
    </>
  );
};

export default AdminAttendance;
