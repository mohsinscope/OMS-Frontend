import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // Fixed Link import
import axios from "axios"; // Axios for API requests
import TextFields from "./../../../reusable elements/ReuseAbleTextField.jsx";
import { Table, Button } from "antd"; // Importing Ant Design components
import "./superVisorAttendeceHistory.css";
import useAuthStore from "./../../../store/store"; // Import sidebar state for dynamic class handling

export default function SupervisorAttendanceHistory() {
  const [attendanceData, setAttendanceData] = useState([]); // State for attendance table data
  const { isSidebarCollapsed } = useAuthStore();

  // Fetch attendance data from API
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        const response = await axios.get("https://example.com/api/attendance"); // Replace with your API endpoint
        setAttendanceData(response.data || []); // Update state with API data
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      }
    };

    fetchAttendanceData();
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

  // Define table columns
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
      render: (attended) => (attended ? "نعم" : "لا"), // Display Yes/No based on attendance status
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (_, record) => (
        <div>
          {/* Edit Button */}
          <Button
            type="primary"
            size="small"
            onClick={() => handleEdit(record)}
            style={{ marginLeft: "5px" }}
          >
            تعديل
          </Button>
          {/* View Button */}
          <Button
            type="default"
            size="small"
            onClick={() => handleView(record)}
            style={{ marginLeft: "5px" }}
          >
            عرض
          </Button>
        </div>
      ),
    },
  ];

  // Handlers for buttons
  const handleEdit = (record) => {
    console.log("Editing record:", record);
    // Navigate to edit page or open modal
  };

  const handleView = (record) => {
    console.log("Viewing record:", record);
    // Navigate to view page or open modal
  };

  return (
    <div
      className={`supervisor-attendance-history-main-container ${
        isSidebarCollapsed
          ? "sidebar-collapsed"
          : "supervisor-expenses-history-page"
      }`}
      dir="rtl"
    >
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
        <Link to="AttendenceAdd">
          <button className="attendance-add-button">اضافة حضور</button>
        </Link>
      </div>

      {/* Attendance Table */}
      <div className="supervisor-attendance-history-table">
        <Table
          dataSource={attendanceData}
          columns={tableColumns}
          rowKey="id"
          bordered
          pagination={{ pageSize: 5 }}
        />
      </div>
    </div>
  );
}
