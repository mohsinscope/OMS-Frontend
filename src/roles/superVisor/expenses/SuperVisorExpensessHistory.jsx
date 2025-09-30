import React, { useState, useEffect, useCallback, useMemo } from "react";
 import {
  Table,
  message,
  Button,
  Select,
  DatePicker,
  ConfigProvider,
  Skeleton,
  Tooltip,            // NEW
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
import dayjs from "dayjs";

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
  [Status.SentFromDirector]: "تم الارسال الى مدقق الحسابات",
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
  
  Director: [Status.SentToDirector ],
  ExpenseAuditer: [Status.ReturnedToExpendeAuditer ,Status.SentFromDirector],
  ExpenseManager: [Status.ReturnedToExpenseManager , Status.SentToExpenseManager],
  ExpenseGeneralManager: [Status.SentToExpenseGeneralManager],
};

// Arabic months mapping
const arabicMonths = [
  { value: 1, label: "يناير - الشهر الأول", nameEn: "January" },
  { value: 2, label: "فبراير - الشهر الثاني", nameEn: "February" },
  { value: 3, label: "مارس - الشهر الثالث", nameEn: "March" },
  { value: 4, label: "أبريل - الشهر الرابع", nameEn: "April" },
  { value: 5, label: "مايو - الشهر الخامس", nameEn: "May" },
  { value: 6, label: "يونيو - الشهر السادس", nameEn: "June" },
  { value: 7, label: "يوليو - الشهر السابع", nameEn: "July" },
  { value: 8, label: "أغسطس - الشهر الثامن", nameEn: "August" },
  { value: 9, label: "سبتمبر - الشهر التاسع", nameEn: "September" },
  { value: 10, label: "أكتوبر - الشهر العاشر", nameEn: "October" },
  { value: 11, label: "نوفمبر - الشهر الحادي عشر", nameEn: "November" },
  { value: 12, label: "ديسمبر - الشهر الثاني عشر", nameEn: "December" },
];
const NEW_API_THRESHOLD_ISO = "2025-10-01"; // local midnight (no Z to avoid TZ shift)
const expenseStageOptions = [
  { value: 1, label: "المشرف" },
  { value: 2, label: "منسق المشروع" },
  { value: 3, label: "مدقق الحسابات" },
  { value: 4, label: "المدير" },
  { value: 5, label: "المدير التنفيذي" },
  { value: 6, label: "مدير الحسابات" },
  { value: 7, label: "مكتمل" },
];

const expenseStatusOptions = [
  { value: 1, label: "تم الارسال الى" },
  { value: 2, label: "تم الارجاع الى" },
  { value: 3, label: "مكتمل" },
];
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
  
  // NEW: Month filter state
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;

  // NEW (only used when date >= Oct 2025):
  const [stage, setStage] = useState(null);
  const [expenseStatus, setExpenseStatus] = useState(null);

  // Store / profile
  const { isSidebarCollapsed, profile, roles, searchVisible, accessToken } =
    useAuthStore();
  const userPosition = profile?.position;
  const isSupervisor = userPosition === "Supervisor" || userPosition === "MainSupervisor";
  const isAdmin = roles.includes("SuperAdmin");
  const userGovernorateId = profile?.governorateId;
  const userOfficeId = profile?.officeId;

const isRowNewSchema = (rec) =>
  dayjs(rec?.dateCreated).valueOf() >= dayjs(NEW_API_THRESHOLD_ISO).startOf("day").valueOf();

  // === NEW: require full date range chosen
  const hasFullDateRange = useMemo(() => Boolean(startDate && endDate), [startDate, endDate]);

  // ------------------------------------------------------------------------------------------------
  // Status Filtering Logic
  // ------------------------------------------------------------------------------------------------
  const getAvailableStatuses = () => {
    // Include SrController if relevant
    if (
      isAdmin ||
      isSupervisor ||
      userPosition === "ProjectCoordinator" ||
      userPosition === "SrController" ||
      userPosition==="ExpenseAuditer"
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
  // NEW: Month handling functions
  // ------------------------------------------------------------------------------------------------
  const handleMonthChange = (monthValue) => {
    setSelectedMonth(monthValue);
    
    if (monthValue) {
      // When month is selected, automatically set date range from 1st to 15th
      const startOfMonth = dayjs().year(selectedYear).month(monthValue - 1).date(1);
      const fifteenthOfMonth = dayjs().year(selectedYear).month(monthValue - 1).date(15);
      
      setStartDate(startOfMonth);
      setEndDate(fifteenthOfMonth);
    } else {
      // When month is cleared, clear the dates too
      setStartDate(null);
      setEndDate(null);
    }
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    
    // If a month is already selected, update the date range with new year
    if (selectedMonth) {
      const startOfMonth = dayjs().year(year).month(selectedMonth - 1).date(1);
      const fifteenthOfMonth = dayjs().year(year).month(selectedMonth - 1).date(15);
      
      setStartDate(startOfMonth);
      setEndDate(fifteenthOfMonth);
    }
  };

  const handleDateChange = (dates, dateType) => {
    if (dateType === 'start') {
      setStartDate(dates);
    } else {
      setEndDate(dates);
    }
    
    // Clear month selection when manually changing dates
    if (selectedMonth && dates) {
      setSelectedMonth(null);
    }
  };

  const getEffectiveStartDayjs = () => {
    if (selectedMonth) return dayjs().year(selectedYear).month(selectedMonth - 1).date(1);
    if (startDate) return startDate;
    return null;
  };

  /** NEW: Are we on/after 1 Oct 2025? If yes → use new payload (with stage/expenseStatus). */
const isNewSchemaActive = () => {
  const eff = getEffectiveStartDayjs();
  if (!eff) return false;
  const threshold = dayjs(NEW_API_THRESHOLD_ISO).startOf("day").valueOf();
  return eff.startOf("day").valueOf() >= threshold;
};

  // Generate years for dropdown (current year ± 5 years)
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
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
    // NEW: block fetch until full date range picked
    if (!hasFullDateRange) {
      setExpensesList([]);
      setTotalRecords(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Build filter object
      const searchBody = {
        officeId: isSupervisor ? userOfficeId : selectedOffice,
        governorateId: isSupervisor ? userGovernorateId : selectedGovernorate,
        profileId: profile?.id,
        statuses: selectedStatuses.length > 0 ? selectedStatuses : null,
        // NEW: full-day coverage
        startDate: startDate ? startDate.startOf('day').toISOString() : null,
        endDate: endDate ? endDate.endOf('day').toISOString() : null,
        PaginationParams: {
          PageNumber: pageNumber,
          PageSize: pageSize,
        },
      };
      // NEW: Switch to the new payload fields when date >= 1 Oct 2025
      if (isNewSchemaActive()) {
        searchBody.stage = stage ?? null;              // e.g. 7
        searchBody.expenseStatus = expenseStatus ?? null;
      }

      // Console log all search parameters
      console.log("=== SEARCH PARAMETERS ===");
      console.log("Search Body:", JSON.stringify(searchBody, null, 2));
      console.log("Office ID:", searchBody.officeId);
      console.log("Governorate ID:", searchBody.governorateId);
      console.log("Profile ID:", searchBody.profileId);
      console.log("Selected Statuses:", searchBody.statuses);
      console.log("Start Date:", searchBody.startDate);
      console.log("End Date:", searchBody.endDate);
      console.log("Page Number:", searchBody.PaginationParams.PageNumber);
      console.log("Page Size:", searchBody.PaginationParams.PageSize);
      console.log("Selected Month:", selectedMonth);
      console.log("Selected Year:", selectedYear);
      console.log("========================");
      console.log("New API mode:", isNewSchemaActive(), "stage:", stage, "expenseStatus:", expenseStatus);

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
        console.log("Auto-set allowed statuses:", allowedStatuses);
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

      // Console log API response
      console.log("=== API RESPONSE ===");
      console.log("Response Status:", response.status);
      console.log("Response Headers:", response.headers);
      console.log("Raw Response Data:", response.data);
      console.log("Number of records returned:", response.data?.length || 0);
      
      // Log first few records for inspection
      if (response.data && response.data.length > 0) {
        console.log("First record:", response.data[0]);
        console.log("Sample record structure:", Object.keys(response.data[0]));
      }

      // Filter by allowed statuses if not admin or supervisor
      const filteredExpenses = filterExpensesByAllowedStatuses(response.data);
      console.log("Filtered Expenses Count:", filteredExpenses.length);
      console.log("Filtered Expenses:", filteredExpenses);

      setExpensesList(filteredExpenses);

      const paginationHeader = response.headers["pagination"];
      if (paginationHeader) {
        const paginationInfo = JSON.parse(paginationHeader);
        console.log("Pagination Info:", paginationInfo);
        setTotalRecords(paginationInfo.totalItems);
      } else {
        console.log("No pagination header found, using array length:", response.data.length);
        setTotalRecords(response.data.length);
      }
      console.log("===================");

    } catch (error) {
      console.error("=== DETAILED SEARCH ERROR ===");
      console.error("Error object:", error);
      console.error("Error message:", error.message);
      console.error("Error name:", error.name);
      console.error("Error stack:", error.stack);
      
      if (error.response) {
        console.error("=== ERROR RESPONSE DETAILS ===");
        console.error("Response status:", error.response.status);
        console.error("Response status text:", error.response.statusText);
        console.error("Response data:", error.response.data);
        console.error("Response headers:", error.response.headers);
        console.error("Response config:", error.response.config);
        
        // Log specific error details if available
        if (error.response.data) {
          console.error("Error response data type:", typeof error.response.data);
          console.error("Error response data keys:", Object.keys(error.response.data));
          if (error.response.data.message) {
            console.error("Error message from server:", error.response.data.message);
          }
          if (error.response.data.errors) {
            console.error("Validation errors:", error.response.data.errors);
          }
        }
      } else if (error.request) {
        console.error("=== REQUEST ERROR ===");
        console.error("Request was made but no response received");
        console.error("Request details:", error.request);
      } else {
        console.error("=== SETUP ERROR ===");
        console.error("Error in setting up the request:", error.message);
      }
      
      console.error("Request config that failed:");
      console.error("- URL:", `${Url}/api/Expense/search`);
      console.error("- Method: POST");
      console.error("- Headers:", {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      });
      // we reference searchBody above in logs, so keep as-is
      console.error("=============================");
      
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
   * Then do a fetch ONLY if a full date range exists. Otherwise, stop loading with empty results.
   */
  useEffect(() => {
    const savedFilters = localStorage.getItem(STORAGE_KEY_EXPENSES);
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        const {
          selectedGovernorate: savedGov,
          selectedOffice: savedOff,
          startDate: savedStart,  // ISO strings
          endDate: savedEnd,
          selectedStatuses: savedStatuses,
          currentPage: savedPage,
          selectedMonth: savedMonth,
          selectedYear: savedYear,
          stage: savedStage,
          expenseStatus: savedExpenseStatus,
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
  
        setStartDate(savedStart ? dayjs(savedStart) : null);
        setEndDate(savedEnd ? dayjs(savedEnd) : null);
        setSelectedStatuses(savedStatuses || []);
        setSelectedMonth(savedMonth || null);
        setSelectedYear(savedYear || new Date().getFullYear());
        setStage(savedStage ?? null);
        setExpenseStatus(savedExpenseStatus ?? null);
        const finalPage = savedPage || 1;
        setCurrentPage(finalPage);
  
        // Fetch ONLY if we have a complete date range
        const doFetch = async () => {
          if (!(savedStart && savedEnd)) {
            setIsLoading(false);
            setExpensesList([]);
            setTotalRecords(0);
            return;
          }

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
            // NEW: full-day coverage
            startDate: dayjs(savedStart).startOf('day').toISOString(),
            endDate: dayjs(savedEnd).endOf('day').toISOString(),
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
        setIsLoading(false);
        setExpensesList([]);
        setTotalRecords(0);
      }
    } else {
      // No saved filters → do NOT fetch; require user to pick a full date range
      setIsLoading(false);
      setExpensesList([]);
      setTotalRecords(0);
    }
  }, []); // run once on mount

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
      selectedMonth,
      selectedYear,
      currentPage: page,
      // NEW: persist new-api fields
      stage,
      expenseStatus,
    };
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(filtersData));
  };

  const handleSearch = () => {
    // NEW: enforce required full date range
    if (!hasFullDateRange) {
      message.error("الرجاء اختيار تاريخ البداية والنهاية أولاً.");
      return;
    }
    const newPage = 1;
    setCurrentPage(newPage);
    saveFiltersToStorage(newPage);
    fetchExpensesData(newPage);
  };

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedMonth(null);
    setSelectedYear(new Date().getFullYear());
    setStage(null);
    setExpenseStatus(null);
    
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

    // NEW: after reset, don't fetch until user picks full date range
    setExpensesList([]);
    setTotalRecords(0);
    message.success("تم إعادة تعيين الفلاتر بنجاح");
  };

  const handleGovernorateChange = (value) => {
    setSelectedGovernorate(value);
    fetchOffices(value);
  };

  const handlePageChange = (page) => {
    // NEW: block pagination without date range
    if (!hasFullDateRange) {
      message.error("الرجاء اختيار تاريخ البداية والنهاية أولاً.");
      return;
    }
    setCurrentPage(page);
    saveFiltersToStorage(page);
    fetchExpensesData(page);
  };

  // Move these outside the component or define them at the top
  const stageLabelMap = Object.fromEntries(
    expenseStageOptions.map(o => [o.value, o.label])
  );

  const expenseStatusLabelMap = Object.fromEntries(
    expenseStatusOptions.map(o => [o.value, o.label])
  );

  // ------------------------------------------------------------------------------------------------
  // Report / Export
  // ------------------------------------------------------------------------------------------------
  const handlePrintPDF = async () => {
    // NEW: require date range
    if (!hasFullDateRange) {
      message.error("لا يمكن إنشاء تقرير بدون تحديد تاريخ (من/إلى).");
      return;
    }

    try {
      const searchBody = {
        officeId: isSupervisor ? userOfficeId : selectedOffice,
        governorateId: isSupervisor ? userGovernorateId : selectedGovernorate,
        profileId: profile?.id,
        statuses: selectedStatuses,
        // NEW: full-day coverage
        startDate: startDate ? startDate.startOf('day').toISOString() : null,
        endDate: endDate ? endOfDay(endDate).toISOString() : null,
        PaginationParams: {
          PageNumber: 1,
          PageSize: totalRecords || 99999,
        },
      };
      if (isNewSchemaActive()) {
        searchBody.stage = stage ?? null;
        searchBody.expenseStatus = expenseStatus ?? null;
      }
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

  // helper for end-of-day if needed
  function endOfDay(dj) {
    return dj ? dj.endOf('day') : null;
  }

  const handleExportToExcel = async () => {
    // NEW: require date range
    if (!hasFullDateRange) {
      message.error("لا يمكن إنشاء ملف Excel بدون تحديد تاريخ (من/إلى).");
      return;
    }

    try {
      const searchBody = {
        officeId: isSupervisor ? userOfficeId : selectedOffice,
        governorateId: isSupervisor ? userGovernorateId : selectedGovernorate,
        profileId: profile?.id,
        statuses: selectedStatuses,
        // NEW: full-day coverage
        startDate: startDate ? startDate.startOf('day').toISOString() : null,
        endDate: endDate ? endDate.endOf('day').toISOString() : null,
        PaginationParams: {
          PageNumber: 1,
          PageSize: totalRecords || 99999,
        },
      };
      if (isNewSchemaActive()) {
        searchBody.stage = stage ?? null;
        searchBody.expenseStatus = expenseStatus ?? null;
      }
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
  const newSchemaActive = isNewSchemaActive();
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
    // ⬇️ Conditional columns
    ...(newSchemaActive
      ? [
          {
            title: "المرحلة",
            dataIndex: "stage",
            key: "stage",
            render: (v) => stageLabelMap[v] || v || "-",
          },
          {
            title: "حالة الصرفية", 
            dataIndex: "expenseStatus",
            key: "expenseStatus",
            render: (v) => expenseStatusLabelMap[v] || v || "-",
          },
        ]
      : [
          {
            title: "الحالة",
            key: "statusUnified",
            render: (_, record) => {
              if (isRowNewSchema(record)) {
                const stageName = stageLabelMap[record.stage] ?? "-";
                const statusName = expenseStatusLabelMap[record.expenseStatus] ?? "-";
                return `${statusName} ${stageName} `;
              }
              const v = typeof record.status === "string" ? Status[record.status] : record.status;
              return statusDisplayNames[v] || "-";
            },
          }
        ]),
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
        const expStatusValue =
          typeof record.status === "string"
            ? Status[record.status]
            : record.status;

        if (
          isSupervisor &&
          (expStatusValue === Status.New ||
            expStatusValue === Status.ReturnedToSupervisor ||
            expStatusValue === Status.RecievedBySupervisor)
        ) {
          return (
            <Link
              to="/ExpensessViewMonthly"
              state={{ monthlyExpenseId: record.id }}
            >
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
      },
    },
  ];

  // This ensures the correct list of statuses for the dropdown
  const availableStatuses = getAvailableStatuses();
 // NEW: disable Search until full date range is set
 const isSearchDisabled = !hasFullDateRange || isLoading;
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

            {/* NEW: Month and Year Filter Section */}
            <div className="filter-field">
              <label>الشهر</label>
              <Select
                value={selectedMonth}
                onChange={handleMonthChange}
                placeholder="اختر الشهر"
                allowClear
                disabled={!!(startDate && !selectedMonth) || !!(endDate && !selectedMonth)}
                className="filter-dropdown"
                style={{ 
                  width: "200px",
                  backgroundColor: (!!(startDate && !selectedMonth) || !!(endDate && !selectedMonth)) ? "#f5f5f5" : "white"
                }}
              >
                {arabicMonths.map((month) => (
                  <Select.Option key={month.value} value={month.value}>
                    {month.label}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div className="filter-field">
              <label>السنة</label>
              <Select
                value={selectedYear}
                onChange={handleYearChange}
                placeholder="اختر السنة"
                disabled={!!(startDate && !selectedMonth) || !!(endDate && !selectedMonth)}
                className="filter-dropdown"
                style={{ 
                  width: "150px",
                  backgroundColor: (!!(startDate && !selectedMonth) || !!(endDate && !selectedMonth)) ? "#f5f5f5" : "white"
                }}
              >
                {generateYears().map((year) => (
                  <Select.Option key={year} value={year}>
                    {year}
                  </Select.Option>
                ))}
              </Select>
            </div>

            {!isNewSchemaActive() && (
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
                  style={{ maxHeight: "200px", overflowY: "auto", width: "250px" }}
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
            )}

            {isNewSchemaActive() && (  <>
              <div className="filter-field">
                <label>المرحلة </label>
                <Select
                  allowClear
                  value={stage}
                  onChange={(v) => setStage(v ?? null)}
                  placeholder="اختر المرحلة"
                  options={expenseStageOptions}
                  className="filter-dropdown"
                  style={{ width: "220px" }}
                />
              </div>

              <div className="filter-field">
                <label>حالة الصرفية </label>
                <Select
                  allowClear
                  value={expenseStatus}
                  onChange={(v) => setExpenseStatus(v ?? null)}
                  placeholder="اختر الحالة"
                  options={expenseStatusOptions}
                  className="filter-dropdown"
                  style={{ width: "220px" }}
                />
              </div>
            </>)}

            {/* Date Range Filters - Disabled when month is selected */}
            <div className="filter-field">
              <label>التاريخ من</label>
              <DatePicker
                placeholder="التاريخ من"
                onChange={(date) => handleDateChange(date, 'start')}
                value={startDate}
                disabled={!!selectedMonth}
                className="supervisor-passport-dameged-input"
                style={{ 
                  width: "100%",
                  backgroundColor: selectedMonth ? "#f5f5f5" : "white"
                }}
              />
            </div>

            <div className="filter-field">
              <label>التاريخ إلى</label>
              <DatePicker
                placeholder="التاريخ إلى"
                onChange={(date) => handleDateChange(date, 'end')}
                value={endDate}
                disabled={!!selectedMonth}
                className="supervisor-passport-dameged-input"
                style={{ 
                  width: "100%",
                  backgroundColor: selectedMonth ? "#f5f5f5" : "white"
                }}
              />
            </div>
           {/* NEW: note that date is required */}
            {!hasFullDateRange && (
              <div style={{ color: "#cf1322", fontSize: 12, marginTop: 4 }}>
                * إدخال التاريخ (من/إلى) مطلوب للبحث
              </div>
            )}

               <div className="supervisor-device-filter-buttons">
              {/* NEW: tooltip on disabled search button */}
              <Tooltip
                title={!hasFullDateRange ? "يجب ادخال التاريخ قبل البحث" : ""}
                placement="top"
              >
                <span>
                  <Button
                    onClick={handleSearch}
                    className="supervisor-passport-dameged-button"
                    loading={isLoading}
                    disabled={isSearchDisabled}
                  >
                    البحث
                  </Button>
                </span>
              </Tooltip>

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
