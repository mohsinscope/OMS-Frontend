import React, { useState, useEffect } from "react";
import { Table, Button, Modal, message, DatePicker } from "antd";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "./../../../store/store";
import "./superVisorAttendeceHistory.css";
import Url from "./../../../store/url.js";

export default function SupervisorAttendanceHistory() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [workingHours, setWorkingHours] = useState(0); // Default to "الكل"
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { isSidebarCollapsed, profile } = useAuthStore();
  const navigate = useNavigate();
  const { searchVisible, toggleSearch } = useAuthStore();

  const governorateId = profile?.governorateId || 1;
  const officeId = profile?.officeId || 1;

  const fetchAttendanceData = async () => {
    try {
      const response = await fetch(`${Url}/api/Attendance`);
      const data = await response.json();

      const formattedData = data.map((item) => ({
        id: item.id,
        date: new Date(item.date).toLocaleDateString("en-GB"),
        totalStaff:
          item.receivingStaff +
          item.accountStaff +
          item.printingStaff +
          item.qualityStaff +
          item.deliveryStaff,
        shift: item.workingHours === 1 ? "صباحي" : item.workingHours === 2 ? "مسائي" : "الكل",
      }));

      setAttendanceData(formattedData);
      setFilteredData(formattedData);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const handleSearch = async () => {
    const body = {
      workingHours, // Set to 0 if "الكل" is selected
      officeId,
      governorateId,
      date: selectedDate ? new Date(selectedDate).toISOString() : undefined, // Optional
      PaginationParams: {
        PageNumber: 1,
        PageSize: 10,
      },
    };

    console.log("Search Payload:", body); // Debugging payload

    try {
      const response = await fetch(`${Url}/api/Attendance/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch search results");
      }

      const data = await response.json();

      if (data.length > 0) {
        const formattedData = data.map((item) => ({
          id: item.id,
          date: new Date(item.date).toLocaleDateString("en-GB"),
          totalStaff:
            item.receivingStaff +
            item.accountStaff +
            item.printingStaff +
            item.qualityStaff +
            item.deliveryStaff,
          shift: item.workingHours === 1 ? "صباحي" : item.workingHours === 2 ? "مسائي" : "الكل",
        }));

        setFilteredData(formattedData);
      } else {
        setIsModalVisible(true);
      }
    } catch (error) {
      console.error("Error searching attendance data:", error);
      message.error("حدث خطأ أثناء البحث.");
    }
  };

  const handleReset = () => {
    setSelectedDate(null);
    setWorkingHours(0); // Reset to "الكل"
    setFilteredData(attendanceData);
    message.success("تمت إعادة التعيين بنجاح.");
  };

  const handleView = (record) => {
    navigate("/attendance/view", { state: { id: record.id } });
  };

  const tableColumns = [
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "عدد الموظفين الكلي",
      dataIndex: "totalStaff",
      key: "totalStaff",
    },
    {
      title: "الحضور",
      dataIndex: "shift",
      key: "shift",
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (_, record) => (
        <Button type="primary" size="small" onClick={() => handleView(record)}>
          عرض
        </Button>
      ),
    },
  ];

  return (
    <div
      className={`supervisor-attendance-history-main-container ${
        isSidebarCollapsed ? "sidebar-collapsed" : "supervisor-expenses-history-page"
      }`}
      dir="rtl"
    >
      <div className="supervisor-attendance-history-title">
        <h1>الحضور</h1>
      </div>

      <div
        className={`supervisor-attendance-history-fields ${
          searchVisible ? "animate-show" : "animate-hide"
        }`}
      >
        <div className="date-attendence-histore">
          <label htmlFor="searchDate" style={{ display: "block" }}>
            اختر التاريخ
          </label>
          <DatePicker
            id="searchDate"
            onChange={(date, dateString) => setSelectedDate(date)}
            style={{ width: "100%" }}
            placeholder="اختر التاريخ"
          />
        </div>
        <div className="attendance-dropdown-wrapper">
          <label>نوع الدوام</label>
          <select
            className="attendance-dropdown"
            value={workingHours}
            onChange={(e) => setWorkingHours(Number(e.target.value))}
          >
            <option value={0}>الكل</option>
            <option value={1}>صباحي</option>
            <option value={2}>مسائي</option>
          </select>
        </div>
        <button className="attendance-add-button" onClick={handleSearch}>
          البحث
        </button>
        <button className="attendance-reset-button" onClick={handleReset}>
          إعادة التعيين
        </button>
        <Link to="AttendenceAdd">
          <button>اضافة حضور</button>
        </Link>
      </div>
      <div className="toggle-search-button">
        <Button type="primary" onClick={toggleSearch}>
          {searchVisible ? " إخفاء البحث" : " إظهار البحث"}
        </Button>
      </div>
      <div className="supervisor-attendance-history-table">
        <Table
          dataSource={filteredData}
          columns={tableColumns}
          rowKey="id"
          bordered
          pagination={{ pageSize: 5 }}
        />
      </div>

      <Modal
        title="تنبيه"
        visible={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        okText="حسناً"
        cancelText="إغلاق"
      >
        <p>لا يوجد تطابق للفلاتر</p>
      </Modal>
    </div>
  );
}
