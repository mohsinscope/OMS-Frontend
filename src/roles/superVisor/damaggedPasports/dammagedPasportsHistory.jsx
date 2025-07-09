import "./dammagedPasportsHistory.css";
import useAuthStore from "./../../../store/store";
import { useState, useEffect, useCallback } from "react";
import {
  Table,
  message,
  Button,
  Input,
  Select,
  DatePicker,
  ConfigProvider,
  Skeleton,
  Modal,
} from "antd";
import { Link } from "react-router-dom";
import html2pdf from "html2pdf.js";
import axiosInstance from "./../../../intercepters/axiosInstance.js";
import Url from "./../../../store/url.js";
import Icons from "./../../../reusable elements/icons.jsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import dayjs from "dayjs";

const { Option } = Select;
const STORAGE_KEY = "supervisorDamagedPassportSearchFilters";

export default function SuperVisorPassport() {
  const {
    isSidebarCollapsed,
    accessToken,
    profile,
    roles,
    permissions,
    searchVisible,
  } = useAuthStore();

  // Check permissions
  const hasCreatePermission = permissions.includes("DPc");
  const hasArchivePermtion = permissions.includes("archive");

  const isSupervisor =
    roles.includes("Supervisor") ||
    roles.includes("I.T") ||
    roles.includes("MainSupervisor");

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [passportList, setPassportList] = useState([]);
  const [totalPassports, setTotalPassports] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [governorates, setGovernorates] = useState([]);
  const [offices, setOffices] = useState([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [damageTypes, setDamageTypes] = useState([]);

  // Filter state
  const [formData, setFormData] = useState({
    passportNumber: "",
    damagedTypeId: null,
    startDate: null,
    endDate: null,
    dateCreatedStartDate: null,
    dateCreatedEndDate: null,
  });

  // Updated states for the email modal with two date pickers
  const [isEmailModalVisible, setIsEmailModalVisible] = useState(false);
  const [emailReportDate, setEmailReportDate] = useState(null); // تاريخ الإنشاء
  const [damagedDate, setDamagedDate] = useState(null); // تاريخ التلف
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  // Separate formatting functions for damage dates and creation dates
  const formatDamageDateToISO = (date, isEndDate = false) => {
  if (!date) return null;
  const d = new Date(date);
  
  if (isEndDate) {
    // For damage date end: Set to start of NEXT day in UTC
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + 1); // Add one day
  } else {
    // For damage date start: Set to start of day in UTC
    d.setUTCHours(0, 0, 0, 0);
  }
  
  // This will return format: "2025-07-08T00:00:00Z" (without milliseconds)
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
};

  const formatCreationDateToISO = (date, isEndDate = false) => {
    if (!date) return null;
    const d = new Date(date);
    
    if (isEndDate) {
      // For creation date end: Set to end of the SAME day (23:59:59.999)
      d.setUTCHours(47, 59, 59, 999);
    } else {
      // For creation date start: Set to start of day (00:00:00.000)
      d.setUTCHours(24, 0, 0, 0);
    }
    
    return d.toISOString();
  };

  // Helper function to create search payload - ensures consistency between search and export
  const createSearchPayload = (pageNumber = 1, pageSize = 10) => {
    return {
      passportNumber: formData.passportNumber || "",
      officeId: isSupervisor ? profile.officeId : selectedOffice || null,
      governorateId: isSupervisor ? profile.governorateId : selectedGovernorate || null,
      damagedTypeId: formData.damagedTypeId || null,
      startDate: formData.startDate ? formatDamageDateToISO(formData.startDate, true) : null,
      endDate: formData.endDate ? formatDamageDateToISO(formData.endDate, true) : null,
      DateCreatedStartDate: formData.dateCreatedStartDate ? formatCreationDateToISO(formData.dateCreatedStartDate, false) : null,
      DateCreatedEndDate: formData.dateCreatedEndDate ? formatCreationDateToISO(formData.dateCreatedEndDate, true) : null,
      PaginationParams: { PageNumber: pageNumber, PageSize: pageSize },
    };
  };

  // Fetch damaged passports
  const fetchPassports = async (payload) => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.post(
        `${Url}/api/DamagedPassport/search`,
        {
          passportNumber: payload.passportNumber || "",
          officeId: payload.officeId || null,
          governorateId: payload.governorateId || null,
          damagedTypeId: payload.damagedTypeId || null,
          startDate: payload.startDate || null,
          endDate: payload.endDate || null,
          DateCreatedStartDate: payload.DateCreatedStartDate || null,
          DateCreatedEndDate: payload.DateCreatedEndDate || null,
          PaginationParams: {
            PageNumber: payload.PaginationParams.PageNumber,
            PageSize: payload.PaginationParams.PageSize,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data) {
        setPassportList(response.data);
        const paginationHeader = response.headers["pagination"];
        if (paginationHeader) {
          const paginationInfo = JSON.parse(paginationHeader);
          setTotalPassports(paginationInfo.totalItems);
        } else {
          setTotalPassports(response.data.length);
        }

        if (response.data.length === 0) {
          message.info("لا يوجد تطابق للفلاتر");
        }
      }
    } catch (error) {
      console.error("API Error:", error);
      message.error(
        `حدث خطأ أثناء جلب البيانات: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDamageTypes = async () => {
    try {
      const response = await axiosInstance.get(
        `${Url}/api/damagedtype/all?PageNumber=1&PageSize=1000`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setDamageTypes(response.data);
    } catch (error) {
      message.error("حدث خطأ أثناء جلب بيانات نوع التلف");
    }
  };

  useEffect(() => {
    fetchDamageTypes();
  }, []);

  // Helper function to safely convert date to ISO string
  const dateToISOString = (date) => {
    if (!date) return null;
    // Handle dayjs objects
    if (date && typeof date.toISOString === 'function') {
      return date.toISOString();
    }
    // Handle dayjs objects with toDate method
    if (date && typeof date.toDate === 'function') {
      return date.toDate().toISOString();
    }
    // Handle regular Date objects
    if (date instanceof Date) {
      return date.toISOString();
    }
    // Handle string dates
    if (typeof date === 'string') {
      return new Date(date).toISOString();
    }
    return null;
  };

  // --- Storage: Save filters when search or page change
  const saveFiltersToStorage = (page) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        formData: {
          passportNumber: formData.passportNumber,
          damagedTypeId: formData.damagedTypeId,
          startDate: dateToISOString(formData.startDate),
          endDate: dateToISOString(formData.endDate),
          dateCreatedStartDate: dateToISOString(formData.dateCreatedStartDate),
          dateCreatedEndDate: dateToISOString(formData.dateCreatedEndDate),
        },
        selectedGovernorate,
        selectedOffice,
        currentPage: page,
      })
    );
  };

  // --- Handler for "بحث" button
  const handleSearch = async (page = 1) => {
    setCurrentPage(page);
    saveFiltersToStorage(page);
    const payload = createSearchPayload(page, pageSize);
    console.log("Search payload:", payload);
    await fetchPassports(payload);
  };

  // --- Reset filters
  const handleReset = async () => {
    setFormData({
      passportNumber: "",
      damagedTypeId: null,
      startDate: null,
      endDate: null,
      dateCreatedStartDate: null,
      dateCreatedEndDate: null,
    });
    setCurrentPage(1);
    if (!isSupervisor) {
      setSelectedGovernorate(null);
      setSelectedOffice(null);
      setOffices([]);
    }
    localStorage.removeItem(STORAGE_KEY);
    
    // Use the helper function with empty form data
    const payload = {
      passportNumber: "",
      officeId: isSupervisor ? profile.officeId : null,
      governorateId: isSupervisor ? profile.governorateId : null,
      damagedTypeId: null,
      startDate: null,
      endDate: null,
      DateCreatedStartDate: null,
      DateCreatedEndDate: null,
      PaginationParams: { PageNumber: 1, PageSize: pageSize },
    };
    await fetchPassports(payload);
    message.success("تم إعادة تعيين الفلاتر بنجاح");
  };

  // --- Handle governorate change
  const handleGovernorateChange = async (value) => {
    setSelectedGovernorate(value);
    setSelectedOffice(null);
    await fetchOffices(value);
  };

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
      return;
    }
    try {
      const response = await axiosInstance.get(
        `${Url}/api/Governorate/dropdown/${governorateId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (response.data && response.data[0] && response.data[0].offices) {
        setOffices(response.data[0].offices);
        if (isSupervisor) {
          setSelectedOffice(profile.officeId);
        }
      }
    } catch (error) {
      message.error("حدث خطأ أثناء جلب بيانات المكاتب");
    }
  };

  // --- On mount: Restore filters from storage then fetch data
  useEffect(() => {
    const initFilters = async () => {
      try {
        await fetchGovernorates();
        const savedFilters = localStorage.getItem(STORAGE_KEY);
        if (savedFilters) {
          const {
            formData: savedFormData,
            selectedGovernorate: savedGov,
            selectedOffice: savedOff,
            currentPage: savedPage,
          } = JSON.parse(savedFilters);
          if (savedFormData) {
            setFormData({
              passportNumber: savedFormData.passportNumber || "",
              damagedTypeId: savedFormData.damagedTypeId || null,
              startDate: savedFormData.startDate ? dayjs(savedFormData.startDate) : null,
              endDate: savedFormData.endDate ? dayjs(savedFormData.endDate) : null,
              dateCreatedStartDate: savedFormData.dateCreatedStartDate ? dayjs(savedFormData.dateCreatedStartDate) : null,
              dateCreatedEndDate: savedFormData.dateCreatedEndDate ? dayjs(savedFormData.dateCreatedEndDate) : null,
            });
          }
          if (!isSupervisor) {
            setSelectedGovernorate(savedGov || null);
            setSelectedOffice(savedOff || null);
            if (savedGov) await fetchOffices(savedGov);
          }
          const pageToUse = savedPage || 1;
          setCurrentPage(pageToUse);
          // Finally, fetch passports using saved filters
          const payload = {
            passportNumber: savedFormData?.passportNumber || "",
            officeId: isSupervisor ? profile.officeId : savedOff || null,
            governorateId: isSupervisor ? profile.governorateId : savedGov || null,
            damagedTypeId: savedFormData?.damagedTypeId || null,
            startDate: savedFormData?.startDate ? formatDamageDateToISO(new Date(savedFormData.startDate), false) : null,
            endDate: savedFormData?.endDate ? formatDamageDateToISO(new Date(savedFormData.endDate), true) : null,
            DateCreatedStartDate: savedFormData?.dateCreatedStartDate ? formatCreationDateToISO(new Date(savedFormData.dateCreatedStartDate), false) : null,
            DateCreatedEndDate: savedFormData?.dateCreatedEndDate ? formatCreationDateToISO(new Date(savedFormData.dateCreatedEndDate), true) : null,
            PaginationParams: { PageNumber: pageToUse, PageSize: pageSize },
          };
          await fetchPassports(payload);
        } else {
          // No saved filters: fetch initial data with default values
          const payload = {
            passportNumber: "",
            officeId: isSupervisor ? profile.officeId : null,
            governorateId: isSupervisor ? profile.governorateId : null,
            damagedTypeId: null,
            startDate: null,
            endDate: null,
            DateCreatedStartDate: null,
            DateCreatedEndDate: null,
            PaginationParams: { PageNumber: 1, PageSize: pageSize },
          };
          await fetchPassports(payload);
        }
      } catch (error) {
        console.error(error);
      }
    };
    initFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Updated Email Modal handlers with selective date picker logic
  // Complete handleEmailReportOk function with correct date formatting

const handleEmailReportOk = async () => {
  console.log(damagedDate);
  if (!emailReportDate && !damagedDate) {
    message.error("الرجاء اختيار أحد التواريخ");
    return;
  }

  setIsEmailLoading(true);

  try {
    // Helper function to format date to "2025-06-30T00:00:00Z" format
    const formatDateToZFormat = (date) => {
      const d = new Date(date);
      d.setUTCHours(24, 0, 0, 0);
      return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
    };

    // Uncomment this section if you need the creation date report functionality
    // if (emailReportDate) {
    //   // API call for creation date report
    //   const creationDateWithFixedHour = new Date(emailReportDate);
    //   creationDateWithFixedHour.setHours(3, 0, 0, 0);
    //   const creationPayload = { ReportDate: creationDateWithFixedHour.toISOString() };

    //   const creationResponse = await axiosInstance.post(
    //     `${Url}/api/DamagedPassportsReport/zip`,
    //     creationPayload,
    //     {
    //       headers: {
    //         "Content-Type": "application/json",
    //         Authorization: `Bearer ${accessToken}`,
    //       },
    //       timeout: 300000,
    //       responseType: "blob",
    //     }
    //   );

    //   // Handle creation date report download
    //   const creationBlob = new Blob([creationResponse.data], { type: "application/zip" });
    //   const creationContentDisposition = creationResponse.headers["content-disposition"];
    //   let creationFilename = "DamagedPassportsReport_Creation.zip";
    //   if (creationContentDisposition) {
    //     const filenameMatch = creationContentDisposition.match(/filename="?([^"]+)"?/);
    //     if (filenameMatch && filenameMatch.length > 1) {
    //       creationFilename = filenameMatch[1];
    //     }
    //   }
    //   saveAs(creationBlob, creationFilename);
    //   message.success("تم تحميل تقرير تاريخ الإنشاء بنجاح");
    // }
    
    if (damagedDate) {
      // API call for damage date report - Format: "2025-06-30T00:00:00Z"
      const damagePayload = { DamagedDate: formatDateToZFormat(damagedDate) };

      console.log("Damage payload:", damagePayload); // For debugging

      const damageResponse = await axiosInstance.post(
        `${Url}/api/DamagedPassportsReport/DamagedDate`,
        damagePayload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          timeout: 180000,
          responseType: "blob",
        }
      );

      // Handle damage date report download
      const damageBlob = new Blob([damageResponse.data], { type: "application/zip" });
      const damageContentDisposition = damageResponse.headers["content-disposition"];
      let damageFilename = "DamagedPassportsReport_Damage.zip";
      if (damageContentDisposition) {
        const filenameMatch = damageContentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch.length > 1) {
          damageFilename = filenameMatch[1];
        }
      }
      saveAs(damageBlob, damageFilename);
      message.success("تم تحميل تقرير تاريخ التلف بنجاح");
    }

  } catch (error) {
    console.error("Error downloading email reports:", error);
    message.error("حدث خطأ أثناء تحميل التقرير");
  } finally {
    setIsEmailLoading(false);
    setIsEmailModalVisible(false);
    setEmailReportDate(null);
    setDamagedDate(null);
  }
};

  // Handle creation date change - clear damage date when this is selected
  const handleCreationDateChange = (date) => {
    setEmailReportDate(date);
    if (date) {
      setDamagedDate(null); // Clear damage date
    }
  };

  // Handle damage date change - clear creation date range when this is selected
  const handleDamageDateChange = (date) => {
    setDamagedDate(date);
    if (date) {
      setEmailReportDate(null); // Clear creation date
    }
  };

  // Handle damage date range changes - clear creation date range when damage date is selected
  const handleDamageDateRangeChange = (dateField, date) => {
    setFormData((prev) => {
      const newFormData = { ...prev, [dateField]: date };
      // If setting a damage date range, clear creation date range
      if (date && (dateField === 'startDate' || dateField === 'endDate')) {
        newFormData.dateCreatedStartDate = null;
        newFormData.dateCreatedEndDate = null;
      }
      return newFormData;
    });
  };

  // Handle creation date range changes - clear damage date range when creation date is selected
  const handleCreationDateRangeChange = (dateField, date) => {
    setFormData((prev) => {
      const newFormData = { ...prev, [dateField]: date };
      // If setting a creation date range, clear damage date range
      if (date && (dateField === 'dateCreatedStartDate' || dateField === 'dateCreatedEndDate')) {
        newFormData.startDate = null;
        newFormData.endDate = null;
      }
      return newFormData;
    });
  };

  const handleEmailModalCancel = () => {
    setIsEmailModalVisible(false);
    setEmailReportDate(null);
    setDamagedDate(null);
  };

  // --- Print PDF using same search payload
  const handlePrintPDF = async () => {
    try {
      // Use the same search payload as Excel export to ensure consistency
      const payload = createSearchPayload(1, 50000);

      const response = await axiosInstance.post(
        `${Url}/api/DamagedPassport/search`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const fullPassportList = response.data || [];
      const element = document.createElement("div");
      element.dir = "rtl";
      element.style.fontFamily = "Arial, sans-serif";
      element.innerHTML = `
        <div style="padding: 20px; font-family: Arial, sans-serif;">
          <h1 style="text-align: center;">تقرير الجوازات التالفة</h1>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">ت</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">تاريخ التلف</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">المحافظة</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">المكتب</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">اسم المستخدم</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">رقم الجواز</th>
              </tr>
            </thead>
            <tbody>
              ${fullPassportList
                .map(
                  (passport, index) => `
                    <tr>
                      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${index + 1}</td>
                      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${new Date(passport.date).toLocaleDateString("en-CA")}</td>
                      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${passport.governorateName}</td>
                      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${passport.officeName}</td>
                      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${passport.profileFullName}</td>
                      <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${passport.passportNumber}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;
      const options = {
        margin: 3,
        filename: "تقرير_الجوازات_التالفة.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "cm", format: "a4", orientation: "landscape" },
      };

      html2pdf().from(element).set(options).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error("حدث خطأ أثناء إنشاء ملف PDF");
    }
  };

  const handleExportToExcel = async () => {
    try {
      // Use the exact same search logic as handleSearch but with large page size to get all records
      const payload = createSearchPayload(1, 50000);
      
      console.log("Excel export using identical search payload:", payload);
      
      const response = await axiosInstance.post(
        `${Url}/api/DamagedPassport/search`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      const fullPassportList = response.data || [];
      console.log(`Excel export found ${fullPassportList.length} records (Table shows ${passportList.length} on current page)`);
      
      if (fullPassportList.length === 0) {
        message.error("لا توجد بيانات لتصديرها");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      
      // Determine if we're searching by date created range
      const isDateCreatedSearch = formData.dateCreatedStartDate || formData.dateCreatedEndDate;
      const worksheetName = isDateCreatedSearch ? "تقرير الجوازات التالفة - تاريخ الإنشاء" : "تقرير الجوازات التالفة - تاريخ التلف";
      
      const worksheet = workbook.addWorksheet(worksheetName, { properties: { rtl: true } });
      const headers = [
        "الملاحضات",
        "نوع التلف",
        "رقم الجواز",
        "اسم المستخدم",
        "المكتب",
        "المحافظة",
        isDateCreatedSearch ? "تاريخ الإنشاء" : "تاريخ التلف",
        isDateCreatedSearch ? "وقت الإنشاء" : "تاريخ الانشاء",
        "ت",
      ];
      const headerRow = worksheet.addRow(headers);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4CAF50" } };
        cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
      });
      fullPassportList.forEach((passport, index) => {
        const row = worksheet.addRow([
          passport.note || "",
          passport.damagedTypeName || "",
          passport.passportNumber || "",
          passport.profileFullName || "",
          passport.officeName || "",
          passport.governorateName || "",
          isDateCreatedSearch ? new Date(passport.datecreated).toLocaleDateString("en-CA") : new Date(passport.date).toLocaleDateString("en-CA"),
          isDateCreatedSearch ? new Date(passport.datecreated).toLocaleTimeString("en-CA", {
            hour12: true,
            hour: "2-digit",
            minute: "2-digit",
          }).replace("a.m.", "صباحا").replace("p.m.", "مساء") : new Date(passport.datecreated).toLocaleDateString("en-CA"),
          index + 1,
        ]);
        row.eachCell((cell) => {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: index % 2 === 0 ? "FFF5F5F5" : "FFFFFFFF" } };
        });
      });
      worksheet.columns = [
        { width: 25 },
        { width: 25 },
        { width: 25 },
        { width: 25 },
        { width: 20 },
        { width: 20 },
        { width: 15 },
        { width: 15 },
        { width: 10 },
      ];
      const buffer = await workbook.xlsx.writeBuffer();
      const now = new Date();
      const formattedDate = now.toISOString().split("T")[0];
      const fileName = isDateCreatedSearch ? `${formattedDate}_تقرير_الجوازات_التالفة_تاريخ_الإنشاء.xlsx` : `${formattedDate}_تقرير_الجوازات_التالفة_تاريخ_التلف.xlsx`;
      saveAs(new Blob([buffer]), fileName);
      message.success(`تم تصدير ${fullPassportList.length} سجل بنجاح`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      console.error("Error details:", error.response?.data);
      message.error("حدث خطأ أثناء تصدير التقرير");
    }
  };

  // --- Table columns
  const columns = [
    {
      title: "تاريخ الانشاء",
      dataIndex: "datecreated",
      key: "datecreated",
      className: "table-column-date",
      render: (text) => {
        const date = new Date(text);
        return isNaN(date.getTime()) ? "تاريخ غير صالح" : date.toLocaleDateString("en-CA");
      },
    },
    {
      title: "وقت الانشاء",
      dataIndex: "datecreated",
      key: "datecreated",
      className: "table-column-date",
      render: (text) => {
        const date = new Date(text);
        if (isNaN(date.getTime())) {
          return "تاريخ غير صالح";
        }
        let timeString = date.toLocaleTimeString("en-CA", {
          hour12: true,      // 12-hour clock
          hour: "2-digit",   // 2-digit hour
          minute: "2-digit", // 2-digit minute
        });
        timeString = timeString
          .replace("a.m", "صباحا")
          .replace("p.m", "مساء");
    
        return timeString;
      },
    },       
    {
      title: "تاريخ التلف",
      dataIndex: "date",
      key: "date",
      className: "table-column-date",
      render: (text) => {
        const date = new Date(text);
        return isNaN(date.getTime()) ? "تاريخ غير صالح" : date.toLocaleDateString("en-CA");
      },
    },
    {
      title: "المحافظة",
      dataIndex: "governorateName",
      key: "governorateName",
      className: "table-column-governorate-name",
    },
    {
      title: "المكتب",
      dataIndex: "officeName",
      key: "officeName",
      className: "table-column-office-name",
    },
    {
      title: "اسم المستخدم",
      dataIndex: "profileFullName",
      key: "profileFullName",
      className: "table-column-office-name",
    },
    {
      title: "رقم الجواز",
      dataIndex: "passportNumber",
      key: "passportNumber",
      className: "table-column-serial-number",
    },
    {
      title: "نوع التلف",
      dataIndex: "damagedTypeName",
      key: "damagedTypeName",
    },
    {
      title: "التفاصيل",
      key: "details",
      className: "table-column-details",
      render: (_, record) => (
        <Link
          to="DammagedPasportsShow"
          state={{ id: record.id }}
          className="supervisor-passport-dameged-details-link"
        >
          عرض
        </Link>
      ),
    },
  ];

  return (
    <div
      className={`supervisor-passport-dameged-page ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}
      dir="rtl"
    >
      <h1 className="supervisor-passport-dameged-title">الجوازات التالفة</h1>
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : (
        <>
          <div className={`supervisor-passport-dameged-filters ${searchVisible ? "animate-show" : "animate-hide"}`}>
            <form className="supervisor-passport-dameged-form">
              <div className="filter-field">
                <label>المحافظة</label>
                <Select
                  className="filter-dropdown"
                  value={selectedGovernorate || undefined}
                  onChange={handleGovernorateChange}
                  disabled={isSupervisor}
                >
                  <Option value="">اختيار محافظة</Option>
                  {governorates.map((gov) => (
                    <Option key={gov.id} value={gov.id}>
                      {gov.name}
                    </Option>
                  ))}
                </Select>
              </div>
              <div className="filter-field">
                <label>اسم المكتب</label>
                <Select
                  className="filter-dropdown"
                  value={selectedOffice || undefined}
                  onChange={(value) => setSelectedOffice(value)}
                  disabled={isSupervisor || !selectedGovernorate}
                >
                  <Option value="">اختيار مكتب</Option>
                  {offices.map((office) => (
                    <Option key={office.id} value={office.id}>
                      {office.name}
                    </Option>
                  ))}
                </Select>
              </div>
              <div className="filter-field">
                <label>رقم الجواز</label>
                <Input
                  value={formData.passportNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, passportNumber: e.target.value }))
                  }
                />
              </div>
              <div className="filter-field">
                <label>نوع التلف</label>
                <Select
                  className="filter-dropdown"
                  placeholder="اختر نوع التلف"
                  value={formData.damagedTypeId || undefined}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, damagedTypeId: value }))
                  }
                >
                  <Option value="">اختر نوع التلف</Option>
                  {damageTypes.map((damageType) => (
                    <Option key={damageType.id} value={damageType.id}>
                      {damageType.name}
                    </Option>
                  ))}
                </Select>
              </div>
              <div className="filter-field">
                <label style={{ color: formData.dateCreatedStartDate || formData.dateCreatedEndDate ? '#999' : '#000' }}>
                  التاريخ من (تاريخ التلف)
                </label>
                <DatePicker
                  placeholder="اختر التاريخ"
                  onChange={(date) => handleDamageDateRangeChange('startDate', date)}
                  value={formData.startDate ? dayjs(formData.startDate) : null}
                  className="supervisor-passport-dameged-input"
                  style={{ width: "100%" }}
                  disabled={!!(formData.dateCreatedStartDate || formData.dateCreatedEndDate)}
                />
              </div>
              <div className="filter-field">
                <label style={{ color: formData.dateCreatedStartDate || formData.dateCreatedEndDate ? '#999' : '#000' }}>
                  التاريخ إلى (تاريخ التلف)
                </label>
                <DatePicker
                  placeholder="اختر التاريخ"
                  onChange={(date) => handleDamageDateRangeChange('endDate', date)}
                  value={formData.endDate ? dayjs(formData.endDate) : null}
                  className="supervisor-passport-dameged-input"
                  style={{ width: "100%" }}
                  disabled={!!(formData.dateCreatedStartDate || formData.dateCreatedEndDate)}
                />
              </div>
              <div className="filter-field">
                <label style={{ color: formData.startDate || formData.endDate ? '#999' : '#000' }}>
                  تاريخ الإنشاء من
                </label>
                <DatePicker
                  placeholder="اختر تاريخ الإنشاء"
                  onChange={(date) => handleCreationDateRangeChange('dateCreatedStartDate', date)}
                  value={formData.dateCreatedStartDate ? dayjs(formData.dateCreatedStartDate) : null}
                  className="supervisor-passport-dameged-input"
                  style={{ width: "100%" }}
                  disabled={!!(formData.startDate || formData.endDate)}
                />
              </div>
              <div className="filter-field">
                <label style={{ color: formData.startDate || formData.endDate ? '#999' : '#000' }}>
                  تاريخ الإنشاء إلى
                </label>
                <DatePicker
                  placeholder="اختر تاريخ الإنشاء"
                  onChange={(date) => handleCreationDateRangeChange('dateCreatedEndDate', date)}
                  value={formData.dateCreatedEndDate ? dayjs(formData.dateCreatedEndDate) : null}
                  className="supervisor-passport-dameged-input"
                  style={{ width: "100%" }}
                  disabled={!!(formData.startDate || formData.endDate)}
                />
              </div>
              <div className="supervisor-device-filter-buttons">
                <Button onClick={() => handleSearch(1)} className="supervisor-passport-dameged-button">
                  البحث
                </Button>
                <Button onClick={handleReset} className="supervisor-passport-dameged-button">
                  إعادة تعيين
                </Button>
              </div>
              {hasCreatePermission && (
                <Link to="/supervisor/damagedpasportshistory/supervisordammagepasportadd">
                  <Button type="primary" className="supervisor-passport-dameged-add-button">
                    اضافة جواز تالف +
                  </Button>
                </Link>
              )}
              <div className="supervisor-device-filter-buttons">
                <button
                  type="button"
                  onClick={handlePrintPDF}
                  className="modern-button pdf-button"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "6px 12px",
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
                    padding: "6px 12px",
                    borderRadius: "8px",
                    width: "fit-content",
                  }}
                >
                  انشاء ملف Excel
                  <Icons type="excel" />
                </button>
                {hasArchivePermtion && (
                  <button
                    type="button"
                    className="modern-button excel-button"
                    onClick={() => setIsEmailModalVisible(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      width: "fit-content",
                    }}
                  >
                    تنزيل الارشيف
                    <Icons type="downloadd" />
                  </button>
                )}
              </div>
            </form>
          </div>
          <div className="supervisor-passport-dameged-table-container">
            <ConfigProvider direction="rtl">
              <Table
                dataSource={passportList}
                columns={columns}
                rowKey="id"
                bordered
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  total: totalPassports,
                  showSizeChanger: false,
                  position: ["bottomCenter"],
                  onChange: (page) => handleSearch(page),
                  showTotal: (total) => (
                    <span style={{ marginLeft: "8px", fontWeight: "bold" }}>
                      اجمالي السجلات: {total}
                    </span>
                  ),
                }}
                locale={{ emptyText: "لا توجد بيانات" }}
                className="supervisor-passport-dameged-table"
              />
            </ConfigProvider>
          </div>
        </>
      )}
      <Modal
        title="اختر نوع التقرير"
        visible={isEmailModalVisible}
        onOk={handleEmailReportOk}
        onCancel={handleEmailModalCancel}
        okText="ارسال"
        cancelText="إلغاء"
        confirmLoading={isEmailLoading}
        width={500}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ 
            padding: "15px", 
            border: "1px solid #d9d9d9", 
            borderRadius: "6px",
            backgroundColor: emailReportDate ? "#f6ffed" : "#fafafa",
            opacity: damagedDate ? 0.5 : 1,
            transition: "all 0.3s ease"
          }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              fontWeight: "bold",
              color: damagedDate ? "#999" : "#000"
            }}>
              تقرير حسب تاريخ الإنشاء:
            </label>
            <DatePicker
              placeholder="اختر تاريخ الإنشاء"
              onChange={handleCreationDateChange}
              value={emailReportDate}
              style={{ width: "100%" }}
              disabled={!!damagedDate}
            />
            {emailReportDate && (
              <div style={{ 
                marginTop: "8px", 
                fontSize: "12px", 
                color: "#52c41a",
                fontWeight: "bold"
              }}>
                ✓ سيتم إنشاء تقرير الجوازات التالفة حسب تاريخ الإنشاء
              </div>
            )}
          </div>
          
          <div style={{ 
            textAlign: "center", 
            fontSize: "16px", 
            fontWeight: "bold",
            color: "#666",
            margin: "10px 0"
          }}>
            أو
          </div>
          
          <div style={{ 
            padding: "15px", 
            border: "1px solid #d9d9d9", 
            borderRadius: "6px",
            backgroundColor: damagedDate ? "#f6ffed" : "#fafafa",
            opacity: emailReportDate ? 0.5 : 1,
            transition: "all 0.3s ease"
          }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              fontWeight: "bold",
              color: emailReportDate ? "#999" : "#000"
            }}>
              تقرير حسب تاريخ التلف:
            </label>
            <DatePicker
              placeholder="اختر تاريخ التلف"
              onChange={handleDamageDateChange}
              value={damagedDate}
              style={{ width: "100%" }}
              disabled={!!emailReportDate}
            />
            {damagedDate && (
              <div style={{ 
                marginTop: "8px", 
                fontSize: "12px", 
                color: "#52c41a",
                fontWeight: "bold"
              }}>
                ✓ سيتم إنشاء تقرير الجوازات التالفة حسب تاريخ التلف
              </div>
            )}
          </div>
          
          {!emailReportDate && !damagedDate && (
            <div style={{ 
              textAlign: "center", 
              padding: "10px", 
              backgroundColor: "#fff7e6",
              border: "1px solid #ffd591",
              borderRadius: "6px",
              color: "#d48806",
              fontSize: "14px"
            }}>
              الرجاء اختيار أحد أنواع التقارير أعلاه
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}