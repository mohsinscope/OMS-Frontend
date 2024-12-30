import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  message,
  DatePicker,
  ConfigProvider,
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "./../../../store/store";
import usePermissionsStore from "./../../../store/permissionsStore";
import "./superVisorAttendeceHistory.css";
import Url from "./../../../store/url.js";

export default function SupervisorAttendanceHistory() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [workingHours, setWorkingHours] = useState(3);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [governorates, setGovernorates] = useState([]);
  const [offices, setOffices] = useState([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const {
    isSidebarCollapsed,
    profile,
    roles,
    searchVisible,
    toggleSearch,
    token,
  } = useAuthStore();

  const { hasAnyPermission } = usePermissionsStore();
  const hasCreatePermission = hasAnyPermission("create");

  const navigate = useNavigate();

  const isSupervisor = roles.includes("Supervisor");

  const userGovernorateId = profile?.governorateId;
  const userOfficeId = profile?.officeId;

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const govResponse = await fetch(`${Url}/api/Governorate/dropdown`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const officeResponse = await fetch(`${Url}/api/Office/dropdown`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!govResponse.ok || !officeResponse.ok) {
          throw new Error("Failed to fetch dropdown data");
        }

        const govData = await govResponse.json();
        const officeData = await officeResponse.json();

        setGovernorates(govData);
        setOffices(officeData);
      } catch (error) {
        console.error("Error fetching dropdowns:", error);
        message.error("حدث خطأ أثناء جلب البيانات");
      }
    };

    fetchDropdowns();
  }, [token]);

  const fetchAttendanceData = async (pageNumber = 1, pageSize = 10) => {
    try {
      setIsLoading(true);

      const searchBody = {
        workingHours,
        officeId: isSupervisor ? userOfficeId : selectedOffice,
        governorateId: isSupervisor ? userGovernorateId : selectedGovernorate,
        startDate: formatDateForAPI(startDate),
        endDate: formatDateForAPI(endDate),
        PaginationParams: {
          PageNumber: pageNumber,
          PageSize: pageSize,
        },
      };

      const response = await fetch(`${Url}/api/Attendance/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(searchBody),
      });

      if (!response.ok) {
        if (response.status === 401) {
          message.error("الرجاء تسجيل الدخول مرة أخرى");
          navigate("/login");
          return;
        }
        throw new Error("Failed to fetch attendance data");
      }

      const data = await response.json();
      const totalItems = parseInt(response.headers.get("totalItems"), 10) || 0;

      const formattedData = data.map((item) => ({
        id: item.id,
        date: new Date(item.date).toLocaleDateString("en-CA"),
        totalStaff:
          item.receivingStaff +
          item.accountStaff +
          item.printingStaff +
          item.qualityStaff +
          item.deliveryStaff,
        shift:
          item.workingHours === 1
            ? "صباحي"
            : item.workingHours === 2
            ? "مسائي"
            : "الكل",
        governorateName:
          governorates.find((gov) => gov.id === item.governorateId)?.name ||
          "غير معروف",
        officeName:
          offices.find((office) => office.id === item.officeId)?.name ||
          "غير معروف",
      }));

      setAttendanceData(formattedData);
      setPagination((prev) => ({
        ...prev,
        current: pageNumber,
        pageSize: pageSize,
        total: totalItems,
      }));

      if (data.length === 0) {
        setIsModalVisible(true);
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      message.error("حدث خطأ أثناء جلب البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData(pagination.current, pagination.pageSize);
  }, [isSupervisor, userGovernorateId, userOfficeId, governorates, offices]);

  const handleSearch = () => {
    fetchAttendanceData(1, pagination.pageSize);
  };

  const formatDateForAPI = (date) => {
    if (!date) return null;
    const formattedDate = new Date(date);
    formattedDate.setUTCHours(14, 0, 0, 0);
    return formattedDate.toISOString();
  };

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setWorkingHours(3);
    if (!isSupervisor) {
      setSelectedGovernorate(null);
      setSelectedOffice(null);
    }
    fetchAttendanceData(1, pagination.pageSize);
    message.success("تمت إعادة التعيين بنجاح");
  };

  const handleTableChange = (paginationInfo) => {
    fetchAttendanceData(paginationInfo.current, paginationInfo.pageSize);
  };

  const handleView = (record) => {
    navigate("/attendance/view", { state: { id: record.id } });
  };

  const getTableColumns = () => [
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "المحافظة",
      dataIndex: "governorateName",
      key: "governorateName",
    },
    {
      title: "المكتب",
      dataIndex: "officeName",
      key: "officeName",
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
        <div className="filter-row">
          <label>المحافظة</label>
          <select
            className="html-dropdown"
            value={isSupervisor ? userGovernorateId : selectedGovernorate}
            onChange={(e) => setSelectedGovernorate(e.target.value)}
            disabled={isSupervisor}>
            <option value=""></option>
            {governorates.map((gov) => (
              <option key={gov.id} value={gov.id}>
                {gov.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-row">
          <label>المكتب</label>
          <select
            className="html-dropdown"
            value={isSupervisor ? userOfficeId : selectedOffice}
            onChange={(e) => setSelectedOffice(e.target.value)}
            disabled={isSupervisor}>
            <option value=""></option>
            {offices.map((office) => (
              <option key={office.id} value={office.id}>
                {office.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-row">
          <label>التاريخ من</label>
          <DatePicker
            placeholder=""
            onChange={(date) => setStartDate(date)}
            value={startDate}
            style={{ width: "100%" }}
          />
        </div>
        <div className="filter-row">
          <label>التاريخ إلى</label>
          <DatePicker
            placeholder=""
            onChange={(date) => setEndDate(date)}
            value={endDate}
            style={{ width: "100%" }}
          />
        </div>
        <div className="attendance-dropdown-wrapper">
          <label>نوع الدوام</label>
          <select
            className="attendance-dropdown"
            value={workingHours}
            onChange={(e) => setWorkingHours(Number(e.target.value))}
            style={{ padding: "0" }}>
            <option value={3}>الكل</option>
            <option value={1}>صباحي</option>
            <option value={2}>مسائي</option>
          </select>
        </div>
        <button 
          className="attendance-search-button"
          onClick={handleSearch}
          loading={isLoading}>
          البحث
        </button>
        <button
          className="attendance-reset-button"
          onClick={handleReset}
          disabled={isLoading}>
          إعادة التعيين
        </button>

        {hasCreatePermission && (
          <Link to="AttendenceAdd">
            <button
              className="attendance-add-button"
              disabled={isLoading}
              type="primary">
              اضافة حضور +
            </button>
          </Link>
        )}
      </div>

      <div className="toggle-search-button">
        <Button type="primary" onClick={toggleSearch}>
          {searchVisible ? "اِخفاء الحقول" : "اِظهار الحقول"}
        </Button>
      </div>

      <div className="supervisor-attendance-history-table">
        <ConfigProvider direction="rtl">
          <Table
            dataSource={attendanceData}
            columns={getTableColumns()}
            rowKey={(record) => record.id}
            bordered
            pagination={{
              position: ["bottomCenter"],
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: handleTableChange,
            }}
            loading={isLoading}
          />
        </ConfigProvider>
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
