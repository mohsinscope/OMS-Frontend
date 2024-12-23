import React, { useState, useEffect } from "react";
import { Table, Button, Modal, message, DatePicker, Select } from "antd";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import useAuthStore from "./../../../store/store";
import "./ManagerAttendenceHistory.css";
import Url from "./../../../store/url.js";

export default function ManagerAttendenceHistory() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [governorateOptions, setGovernorateOptions] = useState([]);
  const [officeOptions, setOfficeOptions] = useState([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [workingHours, setWorkingHours] = useState(0); // Default to "الكل"
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { isSidebarCollapsed } = useAuthStore();
  const navigate = useNavigate();

  // Fetch attendance data
  const fetchAttendanceData = async () => {
    try {
      const response = await axios.get(`${Url}/api/Attendance`);
      const data = response.data.map((item) => ({
        id: item.id,
        date: new Date(item.date).toLocaleDateString("en-GB"),
        governorate: item.governorateName,
        office: item.officeName,
        totalStaff:
          item.receivingStaff +
          item.accountStaff +
          item.printingStaff +
          item.qualityStaff +
          item.deliveryStaff,
        shift: item.workingHours === 1 ? "صباحي" : item.workingHours === 2 ? "مسائي" : "الكل",
      }));

      setAttendanceData(data);
      setFilteredData(data);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    }
  };

  // Fetch governorate and office options
  const fetchOptions = async () => {
    try {
      const [governorates, offices] = await Promise.all([
        axios.get(`${Url}/api/Governorate?PageNumber=1&PageSize=100`),
        axios.get(`${Url}/api/Office?PageNumber=1&PageSize=100`),
      ]);

      setGovernorateOptions(
        governorates.data.map((gov) => ({ value: gov.id, label: gov.name }))
      );
      setOfficeOptions(
        offices.data.map((office) => ({ value: office.id, label: office.name }))
      );
    } catch (error) {
      console.error("Error fetching options:", error);
      message.error("حدث خطأ أثناء جلب بيانات المحافظات والمكاتب");
    }
  };

  useEffect(() => {
    fetchAttendanceData();
    fetchOptions();
  }, []);

  const handleSearch = async () => {
    const body = {
      workingHours: workingHours || undefined,
      governorateId: selectedGovernorate || undefined,
      officeId: selectedOffice || undefined,
      startDate: startDate ? `${startDate.toISOString().split("T")[0]}T00:00:00+03:00` : undefined,
      endDate: endDate ? `${endDate.toISOString().split("T")[0]}T23:59:59+03:00` : undefined,
      PaginationParams: {
        PageNumber: 1,
        PageSize: 10,
      },
    };

    console.log("Search Payload:", body); // Debugging payload

    try {
      const response = await axios.post(`${Url}/api/Attendance/search`, body);
      const data = response.data.map((item) => ({
        id: item.id,
        date: new Date(item.date).toLocaleDateString("en-GB"),
        governorate: item.governorateName,
        office: item.officeName,
        totalStaff:
          item.receivingStaff +
          item.accountStaff +
          item.printingStaff +
          item.qualityStaff +
          item.deliveryStaff,
        shift: item.workingHours === 1 ? "صباحي" : item.workingHours === 2 ? "مسائي" : "الكل",
      }));

      setFilteredData(data.length ? data : []);
      setIsModalVisible(!data.length);
    } catch (error) {
      console.error("Error searching attendance data:", error);
      message.error("حدث خطأ أثناء البحث.");
    }
  };

  const handleReset = () => {
    setSelectedGovernorate(null);
    setSelectedOffice(null);
    setStartDate(null);
    setEndDate(null);
    setWorkingHours(0);
    setFilteredData(attendanceData);
    message.success("تمت إعادة التعيين بنجاح.");
  };

  const handleView = (record) => {
    navigate("/manager/attendence/view", { state: { id: record.id } });
  };

  const tableColumns = [
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
      className={`manager-attendance-history-container ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl"
    >
      <div className="header-section">
        <h1 className="page-title">سجل الحضور</h1>
      </div>

      <div className="filter-section">
        <div className="filter-row">
          <label>المحافظة</label>
          <Select
            value={selectedGovernorate}
            options={governorateOptions}
            onChange={setSelectedGovernorate}
            placeholder="اختر المحافظة"
            allowClear
          />
        </div>
        <div className="filter-row">
          <label>المكتب</label>
          <Select
            value={selectedOffice}
            options={officeOptions}
            onChange={setSelectedOffice}
            placeholder="اختر المكتب"
            allowClear
          />
        </div>
        <div className="filter-row">
          <label>التاريخ من</label>
          <DatePicker
            onChange={(date) => setStartDate(date)}
            placeholder="اختر التاريخ"
            style={{ width: "100%" }}
          />
        </div>
        <div className="filter-row">
          <label>التاريخ إلى</label>
          <DatePicker
            onChange={(date) => setEndDate(date)}
            placeholder="اختر التاريخ"
            style={{ width: "100%" }}
          />
        </div>
        <div className="filter-row">
          <label>نوع الدوام</label>
          <select
            value={workingHours}
            onChange={(e) => setWorkingHours(Number(e.target.value))}
          >
            <option value={0}>الكل</option>
            <option value={1}>صباحي</option>
            <option value={2}>مسائي</option>
          </select>
        </div>
        <div className="filter-actions">
          <Button type="primary" onClick={handleSearch}>
            بحث
          </Button>
          <Button onClick={handleReset} style={{ marginLeft: "10px" }}>
            إعادة تعيين
          </Button>
        </div>
      </div>

      <div className="table-section">
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
