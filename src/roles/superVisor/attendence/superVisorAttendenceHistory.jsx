import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Table, Button, Modal, message, DatePicker } from "antd"; // Importing Ant Design components
import "./superVisorAttendeceHistory.css";
import useAuthStore from "./../../../store/store"; // Import sidebar state for dynamic class handling
import attendenceData from "./../../../data/attendenceData.json"; // Import the JSON file directly
import TextFields from "./../../../reusable elements/ReuseAbleTextField.jsx";

export default function SupervisorAttendanceHistory() {
  const [attendanceData, setAttendanceData] = useState([]); // State for attendance table data
  const [filteredData, setFilteredData] = useState([]); // State for filtered data
  const [selectedDate, setSelectedDate] = useState(null); // State for selected date
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal visibility for no match
  const { isSidebarCollapsed } = useAuthStore();
  const navigate = useNavigate(); // Initialize navigate function
  const { searchVisible, toggleSearch } = useAuthStore(); // search visibility state from store
  // Fetch attendance data from imported JSON
  useEffect(() => {
    try {
      // Combine main attendance and additional attendance into a single array
      const mainData = {
        id: 1,
        date: attendenceData.date,
        totalPassportAttendance: attendenceData.totalPassportAttendance,
        totalCompanyAttendance: attendenceData.totalCompanyAttendance,
      };

      const additionalData = attendenceData.additionalAttendance.map(
        (item, index) => ({
          id: index + 2, // Ensure unique IDs start from 2
          date: item.date,
          totalPassportAttendance: item.totalPassportAttendance,
          totalCompanyAttendance: item.totalCompanyAttendance,
        })
      );

      const combinedData = [mainData, ...additionalData];

      setAttendanceData(combinedData);
      setFilteredData(combinedData); // Initialize filtered data
    } catch (error) {
      console.error("Error processing attendance data:", error);
    }
  }, []);

  const fields = [
    {
      name: "governorate",
      label: "المحافظة",
      placeholder: "بغداد",
      type: "text",
      disabled: true,
    },
    {
      name: "office",
      label: "اسم المكتب",
      placeholder: "مكتب الكرخ",
      type: "text",
      disabled: true,
    },
  ];

  // Handle search button action
  const handleSearch = () => {
    if (!selectedDate) {
      message.warning("لم يتم إدخال تاريخ، عرض جميع البيانات.");
      setFilteredData(attendanceData); // Show all data if no date is entered
      return;
    }

    const filtered = attendanceData.filter(
      (item) => item.date === selectedDate
    );
    if (filtered.length > 0) {
      setFilteredData(filtered); // Update filtered data
    } else {
      setIsModalVisible(true); // Show modal if no match
    }
  };

  const tableColumns = [
    {
      title: "الرقم التسلسلي",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "عدد حضور موظفي الجوازات",
      dataIndex: "totalPassportAttendance",
      key: "totalPassportAttendance",
    },
    {
      title: "عدد حضور موظفي الشركة",
      dataIndex: "totalCompanyAttendance",
      key: "totalCompanyAttendance",
    },
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (_, record) => (
        <div>
          <Button
            type="primary"
            size="small"
            onClick={() => handleView(record)}
            style={{ marginLeft: "5px" }}>
            عرض
          </Button>
        </div>
      ),
    },
  ];

  const handleView = (record) => {
    navigate("/attendance/view", { state: { data: record } });
  };

  return (
    <div
      className={`supervisor-attendance-history-main-container ${
        isSidebarCollapsed
          ? "sidebar-collapsed"
          : "supervisor-expenses-history-page"
      }`}
      dir="rtl">
      <div className="supervisor-attendance-history-title">
        <h1>الحضور</h1>
      </div>

      <div
        className={`supervisor-attendance-history-fields ${
          searchVisible ? "animate-show" : "animate-hide"
        }`}>
        <TextFields
          fields={fields}
          formClassName="attendance-form"
          inputClassName="attendance-input"
          dropdownClassName="attendance-dropdown"
          fieldWrapperClassName="attendance-field-wrapper"
          buttonClassName="attendance-button"
          hideButtons={true}
          showImagePreviewer={false}
        />
        {/* Ant Design DatePicker for date selection */}
        <div className="date-attendence-histore">
          <label htmlFor="searchDate" style={{ display: "block" }}>
            اختر التاريخ
          </label>
          <DatePicker
            id="searchDate"
            onChange={(date, dateString) => setSelectedDate(dateString)} // Update selectedDate state
            style={{ width: "100%" }}
            placeholder="اختر التاريخ"
          />
        </div>
        {/* Search Button */}
        <button
          className="attendance-add-button"
          onClick={handleSearch} // Attach search logic
        >
          البحث
        </button>
        <Link to="AttendenceAdd">
          <button>اضافة حضور</button>
        </Link>
      </div>
      <div className="toggle-search-button">
        <Button type="primary" onClick={toggleSearch}>
          {searchVisible ? " بحث" : " بحث"}
        </Button>
      </div>
      <div className="supervisor-attendance-history-table">
        <Table
          dataSource={filteredData}
          columns={tableColumns}
          rowKey="id"
          bordered
          pagination={{ pageSize: 5 }}
          style={{ textAlign: "center" }}
        />
      </div>

      <Modal
        title="تنبيه"
        visible={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        okText="حسناً"
        cancelText="إغلاق">
        <p>لا يوجد تطابق للفلاتر</p>
      </Modal>
    </div>
  );
}
