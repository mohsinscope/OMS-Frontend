import React, { useState, useEffect } from "react";
import TextFields from "./../../../reusable elements/ReuseAbleTextField.jsx";
import { Table, Checkbox } from "antd"; // Importing Ant Design components
import "./superVisorAttendeceHistory.css";
import useAuthStore from "./../../../store/store"; // Import sidebar state for dynamic class handling
export default function SupervisorAttendanceHistory() {
  const [passportData, setPassportData] = useState([]); // State for passport employees data
  const [companyData, setCompanyData] = useState([]); // State for company employees data
  const [attendanceData, setAttendanceData] = useState([]); // State for table attendance data
  const { isSidebarCollapsed } = useAuthStore();
  // Fetch data from a JSON file
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await import("./../../../data/attendenceData.json"); // Adjust the path to your JSON file
        setPassportData(response.default.passportEmployees); // Assuming JSON is exported as default
        setCompanyData(response.default.companyEmployees);
        setAttendanceData(response.default.attendanceTable || []); // For table data
      } catch (error) {
        console.error("Error loading chart data:", error);
      }
    };

    fetchChartData();
  }, []);

  const fields = [
    {
      name: "governorate",
      label: "المحافظة",
      placeholder: "بغداد",
      type: "text",
      disabled: true, // Disable the input
    },
    {
      name: "office",
      label: "اسم المكتب",
      placeholder: "مكتب الكرخ",
      type: "text",
      disabled: true, // Disable the input
    },
    {
      name: "date",

      label: "التاريخ",
      placeholder: "اختر التاريخ",
      type: "date",
    },
  ];

  const tableColumns = [
    {
      title: "الرقم التسلسلي",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "الاسم",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "الدور الوظيفي",
      dataIndex: "role",
      key: "role",
    },
    {
      title: "الحضور",
      dataIndex: "attended",
      key: "attended",
      render: (_, record) => (
        <Checkbox checked={record.attended} disabled /> // Checkbox is disabled
      ),
    },
  ];

  return (
    <div
      className={`supervisor-attendance-history-main-container ${
        isSidebarCollapsed
          ? "sidebar-collapsed"
          : "supervisor-expenses-history-page"
      }`}
      dir="rtl">
      {/* Title Section */}
      <div className="supervisor-attendance-history-title">
        <h1>الحضور</h1>
      </div>

      {/* Input Fields Section */}
      <div className="supervisor-attendance-history-fields">
        <TextFields
          fields={fields}
          formClassName="attendance-form"
          inputClassName="attendance-input"
          dropdownClassName="attendance-dropdown"
          fieldWrapperClassName="attendance-field-wrapper"
          buttonClassName="attendance-button"
          hideButtons={false}
          showImagePreviewer={false}
        />
      </div>

      {/* Passport Employees Section */}
      <h2 style={{ marginTop: "20px" }}>حضور موظفين الجوازات</h2>
      <div className="supervisor-attendance-history-charts">
        {passportData.length > 0 ? (
          passportData.map((item, index) => (
            <div key={index} className="supervisor-attendance-chart-box">
              <h3>{item.title}</h3>
              <p>{item.value}</p>
              <p>{item.details}</p>
              <img
                src={item.img}
                alt="chart"
                style={{ width: "50px", height: "50px" }}
              />
            </div>
          ))
        ) : (
          <p>جاري تحميل بيانات موظفين الجوازات...</p>
        )}
      </div>
      <hr style={{ width: "100%", marginTop: "20px" }} />

      {/* Company Employees Section */}
      <h2 style={{ marginTop: "20px" }}>حضور موظفين الشركة</h2>
      <div className="supervisor-attendance-history-charts">
        {companyData.length > 0 ? (
          companyData.map((item, index) => (
            <div key={index} className="supervisor-attendance-chart-box">
              <h3>{item.title}</h3>
              <p>{item.value}</p>
              <p>{item.details}</p>
              <img
                src={item.img}
                alt="chart"
                style={{ width: "50px", height: "50px" }}
              />
            </div>
          ))
        ) : (
          <p>جاري تحميل بيانات موظفين الشركة...</p>
        )}
      </div>

      {/* Table Section */}
      <h3 style={{ marginTop: "30px" }}>جدول الحضور</h3>
      <Table
        dataSource={attendanceData}
        columns={tableColumns}
        rowKey="id"
        pagination={{ pageSize: 5 }}
      />
    </div>
  );
}
