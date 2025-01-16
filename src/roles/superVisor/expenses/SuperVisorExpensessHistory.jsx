import React, { useState, useEffect } from "react";
import { Table, message, Button, Select, DatePicker, ConfigProvider } from "antd";
import { Link } from "react-router-dom";
import useAuthStore from "./../../../store/store";
import axiosInstance from "./../../../intercepters/axiosInstance";
import Url from "./../../../store/url";
import html2pdf from "html2pdf.js";
import './styles/SuperVisorExpensesHistory.css';

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

const positionStatusMap = {
  ProjectCoordinator: [Status.SentToProjectCoordinator, Status.ReturnedToProjectCoordinator],
  Manager: [Status.SentToManager, Status.ReturnedToManager],
  Director: [Status.SentToDirector],
  Accontnt: [Status.SentToAccountant]
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

  const { isSidebarCollapsed, profile, roles, searchVisible, accessToken } = useAuthStore();
  const userPosition = profile?.position;
  const isSupervisor = userPosition === "Supervisor";
  const isAdmin = roles.includes("Admin");
  const userGovernorateId = profile?.governorateId;
  const userOfficeId = profile?.officeId;

  const getAvailableStatuses = () => {
    if (isAdmin || isSupervisor) {
      return Object.values(Status);
    }
    const positionStatuses = positionStatusMap[userPosition] || [];
    return [...new Set(positionStatuses)];
  };

  const filterExpensesByAllowedStatuses = (expenses) => {
    if (isAdmin || isSupervisor) return expenses;

    const allowedStatuses = getAvailableStatuses();
    return expenses.filter(expense => {
      const expenseStatus = typeof expense.status === 'string' 
        ? Status[expense.status] 
        : expense.status;
      return allowedStatuses.includes(expenseStatus);
    });
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

      if (!status && !isAdmin && !isSupervisor) {
        const allowedStatuses = getAvailableStatuses();
        searchBody.allowedStatuses = allowedStatuses;
      }
      
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

      const filteredExpenses = filterExpensesByAllowedStatuses(response.data);
      setExpensesList(filteredExpenses);

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
    if (!isAdmin && !isSupervisor && userPosition) {
      const allowedStatuses = getAvailableStatuses();
      if (allowedStatuses.length > 0) {
        setStatus(allowedStatuses[0]);
      }
    }
    fetchExpensesData(1);
  }, [isSupervisor, userGovernorateId, userOfficeId, userPosition]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchExpensesData(1);
  };

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    if (isAdmin || isSupervisor) {
      setStatus(null);
    } else {
      const allowedStatuses = getAvailableStatuses();
      setStatus(allowedStatuses[0] || null);
    }
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

  const handlePrintPDF = async () => {
    const element = document.createElement("div");
    element.dir = "rtl";
    element.style.fontFamily = "Arial, sans-serif";
    element.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="text-align: center;">تقرير سجل الصرفيات</h1>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f2f2f2;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">المحافظة</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">المكتب</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">مجموع الصرفيات</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            ${expensesList.map(expense => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${expense.governorateName || ""}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${expense.officeName || ""}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${expense.totalAmount?.toLocaleString() || ""}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${new Date(expense.dateCreated).toLocaleDateString()}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    const options = {
      margin: 1,
      filename: "تقرير_سجل_الصرفيات.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "cm", format: "a4", orientation: "landscape" },
    };

    html2pdf().from(element).set(options).save();
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
      render: (value) => 
        typeof value === "number"
          ? value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
          : value
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
      render: (value) => statusDisplayNames[value] || value
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
            {(isAdmin || isSupervisor) && <Select.Option value={null}>الكل</Select.Option>}
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

        <Button
          className="expenses-print-button"
          onClick={handlePrintPDF}
          disabled={isLoading}
          style={{ marginLeft: "10px" }}>
          طباعة PDF
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
