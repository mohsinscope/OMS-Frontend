import React, { useState, useEffect } from "react";
import { Table, message, Button, Select, DatePicker, ConfigProvider } from "antd";
import { Link } from "react-router-dom";
import useAuthStore from "./../../../store/store";
import axiosInstance from "./../../../intercepters/axiosInstance";
import Url from "./../../../store/url";
import './styles/SuperVisorExpensesHistory.css';

// Status enum matching backend
const Status = {
  New: 0,
  SentToProjectCoordinator: 1,
  ReturnedToProjectCoordinator: 2,
  SentToManager: 3,
  ReturnedToManager: 4,
  SentToDirector: 5,
  SentToAccountant: 6,
  ReturnedToSupervisor: 7,
  RecievedBySupervisor: 8,
  Completed: 9
};

// Status display names in Arabic
const statusDisplayNames = {
  [Status.New]: "جديد",
  [Status.SentToProjectCoordinator]: "مرسل إلى منسق المشروع",
  [Status.ReturnedToProjectCoordinator]: "معاد إلى منسق المشروع",
  [Status.SentToManager]: "مرسل إلى المدير",
  [Status.ReturnedToManager]: "معاد إلى المدير",
  [Status.SentToDirector]: "مرسل إلى المدير العام",
  [Status.SentToAccountant]: "مرسل إلى المحاسب",
  [Status.ReturnedToSupervisor]: "معاد إلى المشرف",
  [Status.RecievedBySupervisor]: "مستلم من قبل المشرف",
  [Status.Completed]: "مكتمل"
};

// Define allowed statuses for each role
const roleStatusMap = {
  Admin: Object.values(Status), // Admin can see all statuses
  ProjectCoordinator: [Status.SentToProjectCoordinator, Status.ReturnedToProjectCoordinator],
  Manager: [Status.SentToManager, Status.ReturnedToManager],
  Director: [Status.SentToDirector],
  Accountant: [Status.SentToAccountant],
  Supervisor: [Status.New, Status.ReturnedToSupervisor, Status.RecievedBySupervisor]
};

export default function SuperVisorExpensesHistory() {
  const [expensesList, setExpensesList] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [offices, setOffices] = useState([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;

  const { 
    isSidebarCollapsed, 
    profile, 
    roles, 
    searchVisible, 
    accessToken 
  } = useAuthStore();

  const isSupervisor = roles.includes("Supervisor");
  const isAdmin = roles.includes("Admin");
  const userGovernorateId = profile?.governorateId;
  const userOfficeId = profile?.officeId;

  // Determine available statuses based on user roles
  const getAvailableStatuses = () => {
    if (isAdmin) {
      return Object.values(Status);
    }

    let availableStatuses = [];
    roles.forEach(role => {
      if (roleStatusMap[role]) {
        availableStatuses = [...availableStatuses, ...roleStatusMap[role]];
      }
    });
    return [...new Set(availableStatuses)]; // Remove duplicates
  };

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [govResponse, officeResponse] = await Promise.all([
          axiosInstance.get(`${Url}/api/Governorate/dropdown`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          }),
          axiosInstance.get(`${Url}/api/Office/dropdown`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          })
        ]);

        setGovernorates(govResponse.data);
        setOffices(officeResponse.data);
      } catch (error) {
        console.error("Error fetching dropdowns:", error);
        message.error("حدث خطأ أثناء جلب البيانات");
      }
    };

    fetchDropdowns();
  }, [accessToken]);

  const fetchExpensesData = async (pageNumber = 1) => {
    try {
      setIsLoading(true);
      
      const searchBody = {
        officeId: isSupervisor ? userOfficeId : selectedOffice,
        governorateId: isSupervisor ? userGovernorateId : selectedGovernorate,
        profileId: profile?.id,
        status: status,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        PaginationParams: {
          PageNumber: pageNumber,
          PageSize: pageSize
        }
      };

      const response = await axiosInstance.post(
        `${Url}/api/Expense/search`,
        searchBody,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      setExpensesList(response.data);
      const paginationHeader = response.headers["pagination"];
      if (paginationHeader) {
        const paginationInfo = JSON.parse(paginationHeader);
        setTotalRecords(paginationInfo.totalItems);
      } else {
        setTotalRecords(response.data.length);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
      message.error("حدث خطأ أثناء جلب البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpensesData(currentPage);
  }, [isSupervisor, userGovernorateId, userOfficeId]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchExpensesData(1);
  };

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setStatus(null);
    if (!isSupervisor) {
      setSelectedGovernorate(null);
      setSelectedOffice(null);
    }
    setCurrentPage(1);
    fetchExpensesData(1);
    message.success("تم إعادة تعيين الفلاتر بنجاح");
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchExpensesData(page);
  };

  const columns = [
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
      title: "مجموع الصرفيات",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (value) => value.toFixed(2)
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
      render: (value) => statusDisplayNames[Status[value]] || value
    },
    {
      title: "التاريخ",
      dataIndex: "dateCreated",
      key: "dateCreated",
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: "التفاصيل",
      key: "details",
      render: (_, record) => (
        <Link
          to="/expenses-view"
          state={{ expense: record }}
          className="supervisor-expenses-history-details-link">
          عرض
        </Link>
      ),
    },
  ];

  // Get available statuses for the current user
  const availableStatuses = getAvailableStatuses();

  return (
    <div
      className={`supervisor-expenses-history-page ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl">
      <h1 className="supervisor-expenses-history-title">سجل الصرفيات</h1>

      <div
        className={`supervisor-expenses-history-filters ${
          searchVisible ? "animate-show" : "animate-hide"
        }`}>
        {(isAdmin || !isSupervisor) && (
          <>
            <div className="filter-row">
              <label>المحافظة</label>
              <Select
                className="html-dropdown"
                value={isSupervisor ? userGovernorateId : selectedGovernorate}
                onChange={(value) => setSelectedGovernorate(value)}
                disabled={isSupervisor}>
                <Select.Option value={null}></Select.Option>
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
                disabled={isSupervisor}>
                <Select.Option value={null}></Select.Option>
                {offices.map((office) => (
                  <Select.Option key={office.id} value={office.id}>
                    {office.name}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </>
        )}

        <div className="filter-row">
          <label>الحالة</label>
          <Select
            className="html-dropdown"
            value={status}
            onChange={(value) => setStatus(value)}>
            <Select.Option value={null}>الكل</Select.Option>
            {availableStatuses.map((statusValue) => (
              <Select.Option key={statusValue} value={statusValue}>
                {statusDisplayNames[statusValue]}
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

        <Button
          className="expenses-search-button"
          onClick={handleSearch}
          loading={isLoading}>
          البحث
        </Button>

        <Button
          className="expenses-reset-button"
          onClick={handleReset}
          disabled={isLoading}>
          إعادة التعيين
        </Button>
      </div>

      <div className="supervisor-expenses-history-table">
        <ConfigProvider direction="rtl">
          <Table
            dataSource={expensesList}
            columns={columns}
            rowKey="id"
            bordered
            loading={isLoading}
            pagination={{
              position: ["bottomCenter"],
              current: currentPage,
              pageSize: pageSize,
              total: totalRecords,
              onChange: handlePageChange,
            }}
          />
        </ConfigProvider>
      </div>
    </div>
  );
}