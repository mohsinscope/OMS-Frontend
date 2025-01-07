import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  message,
  DatePicker,
  ConfigProvider,
  Select,
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "./../../../store/store";
import usePermissionsStore from "./../../../store/permissionsStore";
import axiosInstance from './../../../intercepters/axiosInstance.js';
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

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [totalRecords, setTotalRecords] = useState(0);

  const {
    isSidebarCollapsed,
    profile,
    roles,
    searchVisible,
    toggleSearch,
    accessToken,
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
        const govResponse = await axiosInstance.get(`${Url}/api/Governorate/dropdown`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const officeResponse = await axiosInstance.get(`${Url}/api/Office/dropdown`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        setGovernorates(govResponse.data);
        setOffices(officeResponse.data);
      } catch (error) {
        console.error("Error fetching dropdowns:", error);
        message.error("حدث خطأ أثناء جلب البيانات");
      }
    };

    fetchDropdowns();
  }, [accessToken]);

  const fetchAttendanceData = async (pageNumber = 1) => {
    try {
      setIsLoading(true);

      const searchBody = {
        workingHours,
        officeId: isSupervisor ? userOfficeId : selectedOffice,
        governorateId: isSupervisor ? userGovernorateId : selectedGovernorate,
        startDate: startDate ? formatDateForAPI(startDate) : null,
        endDate: endDate ? formatDateForAPI(endDate) : null,
        PaginationParams: {
          PageNumber: pageNumber,
          PageSize: pageSize,
        },
      };

      const response = await axiosInstance.post(`${Url}/api/Attendance/search`, searchBody, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const paginationHeader = response.headers["pagination"];
      if (paginationHeader) {
        const paginationInfo = JSON.parse(paginationHeader);
        setTotalRecords(paginationInfo.totalItems);
      } else {
        setTotalRecords(response.data.length);
      }

      const formattedData = response.data.map((item) => ({
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
            : item.workingHours === 3
            ? "الكل"
            : "غير معروف",
        governorateName:
          governorates.find((gov) => gov.id === item.governorateId)?.name ||
          "غير معروف",
        officeName:
          offices.find((office) => office.id === item.officeId)?.name ||
          "غير معروف",
      }));

      setAttendanceData(formattedData);

      if (response.data.length === 0) {
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
    fetchAttendanceData(currentPage);
  }, [isSupervisor, userGovernorateId, userOfficeId, governorates, offices]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAttendanceData(1);
  };

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setWorkingHours(3);
    if (!isSupervisor) {
      setSelectedGovernorate(null);
      setSelectedOffice(null);
    }
    setCurrentPage(1);
    fetchAttendanceData(1);
    message.success("تمت إعادة التعيين بنجاح");
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchAttendanceData(page);
  };

  const formatDateForAPI = (date) => {
    if (!date) return null;
    const formattedDate = new Date(date);
    formattedDate.setUTCHours(14, 0, 0, 0);
    return formattedDate.toISOString();
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
          <Select
            className="html-dropdown"
            value={isSupervisor ? userGovernorateId : selectedGovernorate}
            onChange={(value) => setSelectedGovernorate(value)}
            disabled={isSupervisor}
    >
            <Select.Option value=""></Select.Option>
            {governorates.map((gov) => (
              <Select.Option key={gov.id} value={gov.id}>
                {gov.name}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div className="filter-row">
          <label>المكتب</label>
          <Select
            className="html-dropdown"
            value={isSupervisor ? userOfficeId : selectedOffice}
            onChange={(value) => setSelectedOffice(value)}
            disabled={isSupervisor}
      >
            <Select.Option value=""></Select.Option>
            {offices.map((office) => (
              <Select.Option key={office.id} value={office.id}>
                {office.name}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div className="filter-row">
          <label>التاريخ من</label>
          <DatePicker
            placeholder="التاريخ من"
            onChange={(date) => setStartDate(date)}
            value={startDate}
            style={{ width: "100%" }}
          />
        </div>

        <div className="filter-row">
          <label>التاريخ إلى</label>
          <DatePicker
            placeholder="التاريخ إلى"
            onChange={(date) => setEndDate(date)}
            value={endDate}
            style={{ width: "100%" }}
          />
        </div>

        <div className="attendance-dropdown-wrapper">
          <label>نوع الدوام</label>
          <Select
            className="html-dropdown"
            value={workingHours}
            onChange={(value) => setWorkingHours(value)}
            >
            <Select.Option value={3}>الكل</Select.Option>
            <Select.Option value={1}>صباحي</Select.Option>
            <Select.Option value={2}>مسائي</Select.Option>
          </Select>
        </div>

        <Button
          className="attendance-search-button"
          onClick={handleSearch}
          loading={isLoading}>
          البحث
        </Button>

        <Button
          className="attendance-reset-button"
          onClick={handleReset}
          disabled={isLoading}>
          إعادة التعيين
        </Button>

        {hasCreatePermission && (
          <Link to="AttendenceAdd">
            <Button
              className="attendance-add-button"
              disabled={isLoading}
              type="primary">
              اضافة حضور +
            </Button>
          </Link>
        )}
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
              current: currentPage,
              pageSize: pageSize,
              total: totalRecords,
              onChange: handlePageChange,
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