import React, { useState } from "react";
import { Table, message, Button } from "antd"; // Import Ant Design components
import useAuthStore from "./../../../store/store"; // Import store for `isSidebarCollapsed`
import TextFieldForm from "./../../../reusable elements/ReuseAbleTextField.jsx"; // Import reusable TextFieldForm component
import './FollowUpEmployeeAttensence.css';
export default function FollowUpEmployeeAttendance() {
  const { isSidebarCollapsed } = useAuthStore(); // Access sidebar collapse state
  const [filterData, setFilterData] = useState({}); // State for filter data
  const [filteredData, setFilteredData] = useState([]); // State for filtered data

  // Static data for attendance records
  const staticAttendanceData = [
    {
      id: 1,
      governorate: "بغداد",
      office: "مكتب الكرخ",
      totalPassportAttendance: 35,
      totalCompanyAttendance: 24,
      date: "2024-12-16",
    },
    {
      id: 2,
      governorate: "بغداد",
      office: "مكتب المنصور",
      totalPassportAttendance: 24,
      totalCompanyAttendance: 35,
      date: "2024-12-15",
    },
    {
      id: 3,
      governorate: "كربلاء",
      office: "المكتب المركزي",
      totalPassportAttendance: 32,
      totalCompanyAttendance: 29,
      date: "2024-12-14",
    },
    {
      id: 4,
      governorate: "البصرة",
      office: "مكتب البصرة",
      totalPassportAttendance: 33,
      totalCompanyAttendance: 30,
      date: "2024-12-13",
    },
  ];

  const fields = [
    {
      name: "governorate",
      label: "المحافظة",
      placeholder: "",
      type: "dropdown",
      options: [
        { value: "بغداد", label: "بغداد" },
        { value: "كربلاء", label: "كربلاء" },
        { value: "البصرة", label: "البصرة" },
      ],
    },
    {
      name: "office",
      label: "اسم المكتب",
      placeholder: "",
      type: "dropdown",
      options: [
        { value: "مكتب الكرخ", label: "مكتب الكرخ" },
        { value: "مكتب المنصور", label: "مكتب المنصور" },
        { value: "المكتب المركزي", label: "المكتب المركزي" },
        { value: "مكتب البصرة", label: "مكتب البصرة" },
      ],
    },
    {
      name: "date",
      label: "التاريخ",
      placeholder: "",
      type: "date",
    },
  ];

  const handleSearch = (formData) => {
    setFilterData(formData);

    const filtered = staticAttendanceData.filter((record) => {
      const matchesGovernorate =
        !formData.governorate || record.governorate === formData.governorate;
      const matchesOffice = !formData.office || record.office === formData.office;
      const matchesDate = !formData.date || record.date === formData.date;

      return matchesGovernorate && matchesOffice && matchesDate;
    });

    if (filtered.length === 0) {
      message.warning("لا توجد نتائج تطابق الفلاتر المحددة");
    }

    setFilteredData(filtered);
  };

  const handleReset = () => {
    setFilterData({});
    setFilteredData(staticAttendanceData);
    message.success("تمت إعادة تعيين الفلاتر بنجاح");
  };

  const columns = [
    {
      title: "العدد",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "المحافظة",
      dataIndex: "governorate",
      key: "governorate",
    },
    {
      title: "المكتب",
      dataIndex: "office",
      key: "office",
    },
    {
      title: "عدد موظفي الحكومي",
      dataIndex: "totalPassportAttendance",
      key: "totalPassportAttendance",
    },
    {
      title: "عدد موظفي الشركة",
      dataIndex: "totalCompanyAttendance",
      key: "totalCompanyAttendance",
    },
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "عرض",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          size="large"
          className="followup-attendance-view-button"
          onClick={() => console.log("View Details:", record)}
        >
          عرض
        </Button>
      ),
    },
  ];

  return (
    <div
      className={`followup-attendance-container ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl"
    >
      <h1 className="followup-attendance-title">الحضور</h1>

      {/* Filter Section */}
      <div className="followup-attendance-filters">
        <TextFieldForm
          fields={fields}
          onFormSubmit={handleSearch}
          onReset={handleReset}
          formClassName="followup-attendance-form"
          inputClassName="followup-attendance-input"
          dropdownClassName="followup-attendance-dropdown"
          fieldWrapperClassName="followup-attendance-field-wrapper"
          buttonClassName="followup-attendance-button"
        />
      </div>

      {/* Attendance Table */}
      <div className="followup-attendance-table">
        <Table
          dataSource={filteredData.length > 0 ? filteredData : staticAttendanceData}
          columns={columns}
          rowKey="id"
          bordered
          pagination={{ pageSize: 5 }}
        />
      </div>
    </div>
  );
}
