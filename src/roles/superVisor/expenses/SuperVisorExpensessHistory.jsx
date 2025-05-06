import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  message,
  Button,
  Select,
  DatePicker,
  ConfigProvider,
  Skeleton,
} from "antd";
import { Link } from "react-router-dom";
import useAuthStore from "./../../../store/store";
import axiosInstance from "./../../../intercepters/axiosInstance";
import Url from "./../../../store/url";
import html2pdf from "html2pdf.js";
import "./styles/SuperVisorExpensesHistory.css";
import Icons from "./../../../reusable elements/icons.jsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

import moment from "moment"; // Ensure moment is imported

const Status = {
  New: 0,
  SentToProjectCoordinator: 1,
  ReturnedToProjectCoordinator: 2,
  SentToManager: 3,
  ReturnedToManager: 4,
  SentToDirector: 5,
  ReturnedToSupervisor: 7,
  RecievedBySupervisor: 8,
  Completed: 9,
  SentFromDirector: 10,
  ReturnedToExpendeAuditer: 11,
  SentToExpenseManager: 12,
  ReturnedToExpenseManager: 13,
  SentToExpenseGeneralManager: 14,
};

const statusDisplayNames = {
  [Status.New]: "جديد",
  [Status.SentToProjectCoordinator]: "تم الإرسال إلى منسق المشروع",
  [Status.ReturnedToProjectCoordinator]: "تم الإرجاع إلى منسق المشروع",
  [Status.SentToManager]: "تم الإرسال إلى المدير",
  [Status.ReturnedToManager]: "تم الإرجاع إلى المدير",
  [Status.SentToDirector]: "تم الإرسال إلى المدير التنفيذي",
  [Status.ReturnedToSupervisor]: "تم الإرجاع إلى المشرف",
  [Status.RecievedBySupervisor]: "تم الاستلام من قبل المشرف",
  [Status.SentFromDirector]: "تم الموافقة من قبل المدير التنفيذي",
  [Status.Completed]: "مكتمل",
  [Status.ReturnedToExpendeAuditer]: "تم الارجاع لمدقق الحسابات",
  [Status.SentToExpenseManager]: "تم الارسال لمدير الحسابات",
  [Status.ReturnedToExpenseManager]: "تم الارجاع لمدير الحسابات",
  [Status.SentToExpenseGeneralManager]: "تم الارسال الى مدير ادارة الحسابات",
};

const positionStatusMap = {
  ProjectCoordinator: [
    Status.SentToProjectCoordinator,
    Status.ReturnedToProjectCoordinator,
    Status.SentFromDirector,
  ],
  Manager: [Status.SentToManager, Status.ReturnedToManager],
  ExpenseAuditer: [Status.ReturnedToExpendeAuditer ,Status.SentFromDirector],
  ExpenseManager: [Status.ReturnedToExpenseManager , Status.SentToExpenseManager],
  ExpenseGeneralManager: [Status.SentToExpenseGeneralManager],

};

/** NEW: LocalStorage key for caching filters & pagination. */
const STORAGE_KEY_EXPENSES = "supervisorExpensesSearchFilters";

export default function SuperVisorExpensesHistory() {
  // ------------------------------------------------------------------------------------------------
  // State
  // ------------------------------------------------------------------------------------------------
  const [expensesList, setExpensesList] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [offices, setOffices] = useState([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedStatuses, setSelectedStatuses] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;

  // Store / profile
  const { isSidebarCollapsed, profile, roles, searchVisible, accessToken } =
    useAuthStore();
  const userPosition = profile?.position;
  const isSupervisor = userPosition === "Supervisor" || userPosition === "MainSupervisor";
  const isAdmin = roles.includes("SuperAdmin");
  const userGovernorateId = profile?.governorateId;
  const userOfficeId = profile?.officeId;

  // ------------------------------------------------------------------------------------------------
  // Status Filtering Logic
  // ------------------------------------------------------------------------------------------------
  const getAvailableStatuses = () => {
    // Include SrController if relevant
    if (
      isAdmin ||
      isSupervisor ||
      userPosition === "ProjectCoordinator" ||
      userPosition === "SrController" 
    ) {
      return Object.values(Status);
    }
    const positionStatuses = positionStatusMap[userPosition] || [];
    return [...new Set(positionStatuses)];
  };

  const filterExpensesByAllowedStatuses = (expenses) => {
    // If admin, supervisor, ProjectCoordinator, or SrController: see all
    if (
      isAdmin ||
      isSupervisor ||
      userPosition === "ProjectCoordinator" ||
      userPosition === "SrController"
    )
      return expenses;

    const allowedStatuses = getAvailableStatuses();
    return expenses.filter((expense) => {
      const expenseStatus =
        typeof expense.status === "string"
          ? Status[expense.status]
          : expense.status;
      return allowedStatuses.includes(expenseStatus);
    });
  };

  // ------------------------------------------------------------------------------------------------
  // Fetches
  // ------------------------------------------------------------------------------------------------
  const fetchGovernorates = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`${Url}/api/Governorate/dropdown`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setGovernorates(response.data);

      if (isSupervisor) {
        setSelectedGovernorate(profile.governorateId);
        await fetchOffices(profile.governorateId);
      }
    } catch (error) {
      message.error("حدث خطأ أثناء جلب بيانات المحافظات");
    }
  }, [accessToken, isSupervisor, profile]);

  const fetchOffices = async (governorateId) => {
    if (!governorateId) {
      setOffices([]);
      setSelectedOffice(null);
      return Promise.resolve([]);
    }
  
    try {
      const response = await axiosInstance.get(
        `${Url}/api/Governorate/dropdown/${governorateId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
  
      if (response.data && response.data[0] && response.data[0].offices) {
        setOffices(response.data[0].offices);
  
        if (isSupervisor) {
          setSelectedOffice(profile.officeId);
        }
        
        return response.data[0].offices;
      }
      return [];
    } catch (error) {
      message.error("حدث خطأ أثناء جلب بيانات المكاتب");
      return [];
    }
  };
  

  const fetchExpensesData = async (pageNumber = 1) => {
    try {
      setIsLoading(true);

      // Build filter object
      const searchBody = {
        officeId: isSupervisor ? userOfficeId : selectedOffice,
        governorateId: isSupervisor ? userGovernorateId : selectedGovernorate,
        profileId: profile?.id,
        statuses: selectedStatuses.length > 0 ? selectedStatuses : null,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        PaginationParams: {
          PageNumber: pageNumber,
          PageSize: pageSize,
        },
      };

      // If user is not admin/supervisor/ProjectCoordinator/SrController and hasn't chosen statuses, use only what's allowed
      if (
        selectedStatuses.length === 0 &&
        !isAdmin &&
        !isSupervisor &&
        userPosition !== "ProjectCoordinator" &&
        userPosition !== "SrController"
      ) {
        const allowedStatuses = getAvailableStatuses();
        searchBody.statuses = allowedStatuses;
      }

      // Make the request
      const response = await axiosInstance.post(
        `${Url}/api/Expense/search`,
        searchBody,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Filter by allowed statuses if not admin or supervisor
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

  // ------------------------------------------------------------------------------------------------
  // useEffect initialization
  // ------------------------------------------------------------------------------------------------
  useEffect(() => {
    if (isSupervisor && userGovernorateId) {
      fetchOffices(userGovernorateId);
    }
  }, [isSupervisor, userGovernorateId, accessToken]);

  useEffect(() => {
    fetchGovernorates();
  }, [fetchGovernorates]);

  /**
   * NEW: On mount, load filters from local storage if present.
   * Then do a fetch with those filters (or with default if none).
   */
  useEffect(() => {
    const savedFilters = localStorage.getItem(STORAGE_KEY_EXPENSES);
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        const {
          selectedGovernorate: savedGov,
          selectedOffice: savedOff,
          startDate: savedStart,
          endDate: savedEnd,
          selectedStatuses: savedStatuses,
          currentPage: savedPage,
        } = parsed;
  
        // If supervisor, we typically override with user-based governorate/office
        if (!isSupervisor) {
          setSelectedGovernorate(savedGov);
          
          // Important: Need to load offices for the saved governorate
          if (savedGov) {
            fetchOffices(savedGov).then(() => {
              // Only set the office after offices are loaded for this governorate
              setSelectedOffice(savedOff);
            });
          }
        }
  
        setStartDate(savedStart ? moment(savedStart) : null);
        setEndDate(savedEnd ? moment(savedEnd) : null);
        setSelectedStatuses(savedStatuses || []);
  
        const finalPage = savedPage || 1;
        setCurrentPage(finalPage);
  
        // Now fetch with these filters
        const doFetch = async () => {
          setIsLoading(true);
          const searchBody = {
            officeId: isSupervisor
              ? userOfficeId
              : savedOff !== undefined
              ? savedOff
              : null,
            governorateId: isSupervisor
              ? userGovernorateId
              : savedGov !== undefined
              ? savedGov
              : null,
            profileId: profile?.id,
            statuses:
              savedStatuses && savedStatuses.length > 0 ? savedStatuses : null,
            startDate: savedStart ? new Date(savedStart).toISOString() : null,
            endDate: savedEnd ? new Date(savedEnd).toISOString() : null,
            PaginationParams: {
              PageNumber: finalPage,
              PageSize: pageSize,
            },
          };
  
          // If still no statuses and user is not admin/supervisor/ProjectCoordinator/SrController,
          // set them to allowed
          if (
            (!savedStatuses || savedStatuses.length === 0) &&
            !isAdmin &&
            !isSupervisor &&
            userPosition !== "ProjectCoordinator" &&
            userPosition !== "SrController"
          ) {
            searchBody.statuses = getAvailableStatuses();
          }
  
          try {
            const resp = await axiosInstance.post(
              `${Url}/api/Expense/search`,
              searchBody,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );
            const filteredData = filterExpensesByAllowedStatuses(resp.data);
            setExpensesList(filteredData);
  
            const paginationHeader = resp.headers["pagination"];
            if (paginationHeader) {
              const paginationInfo = JSON.parse(paginationHeader);
              setTotalRecords(paginationInfo.totalItems);
            } else {
              setTotalRecords(resp.data.length);
            }
          } catch (err) {
            console.error(err);
            message.error("حدث خطأ أثناء جلب البيانات");
          } finally {
            setIsLoading(false);
          }
        };
        doFetch();
      } catch (err) {
        console.error("Error loading saved filters:", err);
      }
    } else {
      // If no saved filters, fetch with defaults
      fetchExpensesData(1);
    }
  }, []); // run once on mount
   // run once on mount
  // NOTE: We do not add dependencies so it runs only once

  // ------------------------------------------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------------------------------------------

  /** NEW: A helper to save current filters & page in localStorage. */
  const saveFiltersToStorage = (page) => {
    const filtersData = {
      selectedGovernorate,
      selectedOffice,
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
      selectedStatuses,
      currentPage: page,
    };
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(filtersData));
  };

  const handleSearch = () => {
    const newPage = 1;
    setCurrentPage(newPage);
    saveFiltersToStorage(newPage);
    fetchExpensesData(newPage);
  };

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    if (
      isAdmin ||
      isSupervisor ||
      userPosition === "ProjectCoordinator" ||
      userPosition === "SrController"
    ) {
      setSelectedStatuses([]);
    } else {
      const allowedStatuses = getAvailableStatuses();
      setSelectedStatuses(allowedStatuses);
    }
    if (!isSupervisor) {
      setSelectedGovernorate(null);
      setSelectedOffice(null);
    }
    setCurrentPage(1);

    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY_EXPENSES);

    fetchExpensesData(1);
    message.success("تم إعادة تعيين الفلاتر بنجاح");
  };

  const handleGovernorateChange = (value) => {
    setSelectedGovernorate(value);
    fetchOffices(value);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    saveFiltersToStorage(page);
    fetchExpensesData(page);
  };

  // ------------------------------------------------------------------------------------------------
  // Report / Export
  // ------------------------------------------------------------------------------------------------
  const handlePrintPDF = async () => {
    try {
      // We'll need the total count for pageSize if we want all data
      const searchBody = {
        officeId: isSupervisor ? userOfficeId : selectedOffice,
        governorateId: isSupervisor ? userGovernorateId : selectedGovernorate,
        profileId: profile?.id,
        statuses: selectedStatuses,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        PaginationParams: {
          PageNumber: 1,
          PageSize: totalRecords || 99999,
        },
      };

      const response = await axiosInstance.post(`${Url}/api/Expense/search`, searchBody, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const allExpenses = response.data;

      const element = document.createElement("div");
      element.dir = "rtl";
      element.style.fontFamily = "Arial, sans-serif";
      element.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="text-align: center;">تقرير سجل الصرفيات</h1>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">#</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">المحافظة</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">المكتب</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">مجموع الصرفيات</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              ${allExpenses
                .map(
                  (expense, index) => `
                  <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
                      ${index + 1}
                    </td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
                      ${expense.governorateName || ""}
                    </td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
                      ${expense.officeName || ""}
                    </td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
                      ${
                        expense.totalAmount?.toLocaleString() ||
                        ""
                      }
                    </td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">
                      ${new Date(expense.dateCreated).toLocaleDateString()}
                    </td>
                  </tr>
                `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;

      const options = {
        margin: 1,
        filename: "تقرير_سجل_الصرفيات.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "cm", format: "a4", orientation: "portrait" },
      };

      html2pdf().from(element).set(options).save();
    } catch (error) {
      message.error("حدث خطأ أثناء إنشاء التقرير");
      console.error(error);
    }
  };

  const handleExportToExcel = async () => {
    try {
      const searchBody = {
        officeId: isSupervisor ? userOfficeId : selectedOffice,
        governorateId: isSupervisor ? userGovernorateId : selectedGovernorate,
        profileId: profile?.id,
        statuses: selectedStatuses,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        PaginationParams: {
          PageNumber: 1,
          PageSize: totalRecords || 99999,
        },
      };

      const response = await axiosInstance.post(`${Url}/api/Expense/search`, searchBody, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const allExpenses = response.data || [];
      if (allExpenses.length === 0) {
        message.error("لا توجد بيانات لتصديرها");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("تقرير سجل الصرفيات", {
        properties: { rtl: true },
      });

      const headers = [
        "التاريخ",
        "مجموع الصرفيات",
        "المكتب",
        "المحافظة",
        "#",
      ];
      const headerRow = worksheet.addRow(headers);

      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4CAF50" },
        };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });

      allExpenses.forEach((expense, index) => {
        const row = worksheet.addRow([
          new Date(expense.dateCreated).toLocaleDateString("en-CA"),
          typeof expense.totalAmount === "number"
            ? expense.totalAmount.toLocaleString()
            : "",
          expense.officeName || "",
          expense.governorateName || "",
          index + 1,
        ]);

        row.eachCell((cell) => {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: index % 2 === 0 ? "FFF5F5F5" : "FFFFFFFF" },
          };
        });
      });

      worksheet.columns = [
        { width: 15 }, // Date
        { width: 15 }, // Total Amount
        { width: 20 }, // Office
        { width: 20 }, // Governorate
        { width: 5 },  // Index
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(blob, "تقرير_سجل_الصرفيات.xlsx");
      message.success("تم تصدير التقرير بنجاح");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      message.error("حدث خطأ أثناء تصدير التقرير");
    }
  };

  // ------------------------------------------------------------------------------------------------
  // Table Columns
  // ------------------------------------------------------------------------------------------------
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
          ? value.toLocaleString("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })
          : value,
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
      render: (value) => {
        if (typeof value === "string") {
          const enumValue = Status[value];
          return statusDisplayNames[enumValue] || value;
        }
        return statusDisplayNames[value] || value;
      },
    },
    {
      title: "التاريخ",
      dataIndex: "dateCreated",
      key: "dateCreated",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "التفاصيل",
      key: "details",
      render: (_, record) => {
        // Supervisor logic
        const expenseStatus =
          typeof record.status === "string"
            ? Status[record.status]
            : record.status;

        // If supervisor and status is New or ReturnedToSupervisor, go to different route
        if (
          isSupervisor &&
          (expenseStatus === Status.New ||
            expenseStatus === Status.ReturnedToSupervisor||
            expenseStatus === Status.RecievedBySupervisor)
        ) {
          return (
            <Link to="/ExpensessViewMonthly" state={{ monthlyExpenseId: record.id }}>
              <Button
                type="primary"
                size="large"
                className="supervisor-expenses-history-details-link"
              >
                عرض
              </Button>
            </Link>
          );
        } else {
          // Default route
          return (
            <Link to="/expenses-view" state={{ expense: record }}>
              <Button
                type="primary"
                size="large"
                className="supervisor-expenses-history-details-link"
              >
                عرض
              </Button>
            </Link>
          );
        }
      },
    },
  ];

  // This ensures the correct list of statuses for the dropdown
  const availableStatuses = getAvailableStatuses();

  // ------------------------------------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------------------------------------
  return (
    <div
      className={`supervisor-passport-dameged-page ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl"
    >
      <h1 className="supervisor-passport-dameged-title">سجل الصرفيات</h1>

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : (
        <>
          <div
            className={`supervisor-passport-dameged-filters ${
              searchVisible ? "animate-show" : "animate-hide"
            }`}
          >
            {(isAdmin || !isSupervisor) && (
              <form className="supervisor-passport-dameged-form">
                <div className="filter-field">
                  <label>المحافظة</label>
                  <Select
                    className="html-dropdown"
                    value={
                      isSupervisor ? userGovernorateId : selectedGovernorate
                    }
                    onChange={handleGovernorateChange}
                    disabled={isSupervisor}
                    placeholder="اختر المحافظة"
                  >
                    <Select.Option value={null}>الكل</Select.Option>
                    {governorates.map((gov) => (
                      <Select.Option key={gov.id} value={gov.id}>
                        {gov.name}
                      </Select.Option>
                    ))}
                  </Select>
                </div>

                <div className="filter-field">
                  <label>المكتب</label>
                  <Select
                    className="html-dropdown"
                    value={isSupervisor ? userOfficeId : selectedOffice}
                    onChange={(value) => setSelectedOffice(value)}
                    disabled={isSupervisor || !selectedGovernorate}
                    placeholder="اختر المكتب"
                  >
                    <Select.Option value={null}>الكل</Select.Option>
                    {offices.map((office) => (
                      <Select.Option key={office.id} value={office.id}>
                        {office.name}
                      </Select.Option>
                    ))}
                  </Select>
                </div>
              </form>
            )}
            <div className="filter-field">
              <label>الحالة</label>
              <Select
                mode="multiple"
                value={selectedStatuses}
                onChange={(values) => setSelectedStatuses(values)}
                placeholder="اختر الحالات"
                maxTagCount={3}
                maxTagPlaceholder={(omitted) => `+ ${omitted} المزيد`}
                className="filter-dropdown"
                style={{ maxHeight: "200px", overflowY: "auto" }}
              >
                {availableStatuses.map((statusValue) => (
                  <Select.Option
                    key={statusValue}
                    value={statusValue}
                    className="supervisor-expenses-history-select-option"
                  >
                    {statusDisplayNames[statusValue]}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div className="filter-field">
              <label>التاريخ من</label>
              <DatePicker
                placeholder="التاريخ من"
                onChange={(date) => setStartDate(date)}
                value={startDate}
                className="supervisor-passport-dameged-input"
                style={{ width: "100%" }}
              />
            </div>

            <div className="filter-field">
              <label>التاريخ إلى</label>
              <DatePicker
                placeholder="التاريخ إلى"
                onChange={(date) => setEndDate(date)}
                value={endDate}
                className="supervisor-passport-dameged-input"
                style={{ width: "100%" }}
              />
            </div>

            <div className="supervisor-device-filter-buttons">
              <Button
                onClick={handleSearch}
                className="supervisor-passport-dameged-button"
                loading={isLoading}
              >
                البحث
              </Button>

              <Button
                className="supervisor-passport-dameged-button"
                onClick={handleReset}
                disabled={isLoading}
              >
                إعادة التعيين
              </Button>
            </div>

            <div className="supervisor-device-filter-buttons">
              <button
                type="button"
                onClick={handlePrintPDF}
                className="modern-button pdf-button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  width: "fit-content",
                }}
              >
                انشاء ملف PDF
                <Icons type="pdf" />
              </button>
              <button
                type="button"
                onClick={handleExportToExcel}
                className="modern-button excel-button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  width: "fit-content",
                }}
              >
                انشاء ملف Excel
                <Icons type="excel" />
              </button>
            </div>
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
                  showTotal: (total) => (
                    <span style={{ marginLeft: "8px", fontWeight: "bold" }}>
                      اجمالي السجلات: {total}
                    </span>
                  ),
                }}
              />
            </ConfigProvider>
          </div>
        </>
      )}
    </div>
  );
}
