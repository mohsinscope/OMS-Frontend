import { useState, useEffect, useCallback } from "react";
import {
  Table,
  message,
  Button,
  ConfigProvider,
  DatePicker,
  Select,
  Input,
  Skeleton,
} from "antd";
import { Link } from "react-router-dom";
import "./SuperVisorLecturerhistory.css";
import useAuthStore from "./../../../store/store";
import axiosInstance from "./../../../intercepters/axiosInstance.js";
import Url from "./../../../store/url.js";
import dayjs from "dayjs";
import html2pdf from "html2pdf.js";
import Icons from "./../../../reusable elements/icons.jsx";
const STORAGE_KEY = "supervisorLecturerSearchFilters";

const SuperVisorLecturerhistory = () => {
  const {
    isSidebarCollapsed,
    accessToken,
    profile,
    searchVisible,
    roles,
    permissions,
  } = useAuthStore();
  const hasCreatePermission = permissions.includes("Lc");
  const isSupervisor =
    roles.includes("Supervisor") || roles === "I.T" || roles === "MainSupervisor";
const [isPdfLoading, setIsPdfLoading] = useState(false);

  const [lectures, setLectures] = useState([]);
  const [totalLectures, setTotalLectures] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [governorates, setGovernorates] = useState([]);
  const [offices, setOffices] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [lectureTypeNames, setlectureTypeNames] = useState([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    startDate: null,
    endDate: null,
    companyId: null,
    lectureTypeIds: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const formatToISO = (date) => {
    if (!date) return null;
    return date.toISOString();
  };

  const fetchLectures = async (payload) => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.post(
        `${Url}/api/Lecture/search`,
        {
          title: payload.title || "",
          officeId: payload.officeId || null,
          governorateId: payload.governorateId || null,
          startDate: payload.startDate || null,
          endDate: payload.endDate || null,
          companyId: payload.companyId || null,
          lectureTypeIds: payload.lectureTypeIds || [],
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
        setLectures(response.data);
        const paginationHeader = response.headers["pagination"];
        if (paginationHeader) {
          const paginationInfo = JSON.parse(paginationHeader);
          setTotalLectures(paginationInfo.totalItems);
        } else {
          setTotalLectures(response.data.length);
        }
      }
    } catch (error) {
      message.error(
        `حدث خطأ أثناء جلب المحاضر: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

const handlePrintPDF = async () => {
  setIsPdfLoading(true);
  try {
    message.loading('جاري تحضير التقرير...', 0);

    // 1) Fetch records
    const payload = {
      title: formData.title || "",
      officeId: isSupervisor ? profile.officeId : selectedOffice || null,
      governorateId: isSupervisor ? profile.governorateId : selectedGovernorate || null,
      startDate: formData.startDate ? formatToISO(formData.startDate) : null,
      endDate: formData.endDate ? formatToISO(formData.endDate) : null,
      companyId: formData.companyId || null,
      lectureTypeIds: formData.lectureTypeIds || [],
      PaginationParams: { PageNumber: 1, PageSize: totalLectures || 1 },
    };

    const { data: list = [] } = await axiosInstance.post(
      `${Url}/api/Lecture/search`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // 2) Fetch attachments
    message.loading('جاري تحميل المرفقات...', 0);
    const attachmentMap = {};

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const fetchAttachmentWithRetry = async (lecId, retries = 3) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const { data: atts } = await axiosInstance.get(
            `${Url}/api/Attachment/Lecture/${lecId}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
              timeout: 10000,
            }
          );
          if (Array.isArray(atts) && atts.length > 0) {
            const path = String(atts[0].filePath || "").replace(/^\/+/, "/");
            return `https://oms-cdn.scopesky.iq/${path}`;
          }
          return null;
        } catch (error) {
          console.log(`Attempt ${attempt} failed for lecture ${lecId}:`, error.response?.status);
          if (attempt === retries) return null;
          await delay(1000 * attempt);
        }
      }
      return null;
    };

    const BATCH_SIZE = 5;
    const DELAY_BETWEEN_BATCHES = 500;

    for (let i = 0; i < list.length; i += BATCH_SIZE) {
      const batch = list.slice(i, i + BATCH_SIZE);
      const progress = Math.min(i + BATCH_SIZE, list.length);
      message.loading(`جاري تحميل المرفقات... (${progress}/${list.length})`, 0);

      await Promise.all(
        batch.map(async (lec) => {
          const url = await fetchAttachmentWithRetry(lec.id);
          if (url) attachmentMap[lec.id] = url;
        })
      );

      if (i + BATCH_SIZE < list.length) {
        await delay(DELAY_BETWEEN_BATCHES);
      }
    }

    // 3) Split into pages of 5 rows
    const PAGE_SIZE = 5;
    const chunkArray = (arr, size) => {
      const out = [];
      for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
      return out;
    };
    const pages = chunkArray(list, PAGE_SIZE);

    // Stats
    const totalRecords = list.length;
    const recordsWithAttachments = Object.keys(attachmentMap).length;
    const failedAttachments = totalRecords - recordsWithAttachments;
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('en-CA');
    const timeStr = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    // Filter info
    const filterInfo = [];
    if (formData.title) filterInfo.push(`العنوان: ${formData.title}`);
    if (selectedGovernorate || profile.governorateId) {
      const gov = governorates.find(g => g.id === (selectedGovernorate || profile.governorateId));
      if (gov) filterInfo.push(`المحافظة: ${gov.name}`);
    }
    if (selectedOffice || profile.officeId) {
      const office = offices.find(o => o.id === (selectedOffice || profile.officeId));
      if (office) filterInfo.push(`المكتب: ${office.name}`);
    }
    if (formData.companyId) {
      const company = companies.find(c => c.id === formData.companyId);
      if (company) filterInfo.push(`الشركة: ${company.name}`);
    }
    if (formData.startDate) filterInfo.push(`من تاريخ: ${formData.startDate.format('YYYY-MM-DD')}`);
    if (formData.endDate) filterInfo.push(`إلى تاريخ: ${formData.endDate.format('YYYY-MM-DD')}`);

    // Build HTML
    const container = document.createElement("div");
    container.dir = "rtl";
    container.style.fontFamily = "'Segoe UI', Tahoma, Arial, sans-serif";

    let htmlContent = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Tajawal', 'Segoe UI', Tahoma, Arial, sans-serif;
          color: #2c3e50;
          line-height: 1.6;
        }
        
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 120px;
          color: rgba(0, 0, 0, 0.05);
          z-index: -1;
          font-weight: bold;
          white-space: nowrap;
        }
        
        .report-header {
          background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
          color: white;
          padding: 30px;
          border-radius: 10px;
          margin-bottom: 30px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .report-title {
          font-size: 36px;
          font-weight: bold;
          margin-bottom: 10px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        
        .report-subtitle {
          font-size: 18px;
          opacity: 0.95;
        }
        
        .stats-container {
          display: flex;
          justify-content: space-around;
          margin: 30px 0;
          flex-wrap: wrap;
        }
        
        .stat-box {
          background: white;
          border-radius: 10px;
          padding: 20px;
          margin: 10px;
          flex: 1;
          min-width: 200px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          border-right: 4px solid #1890ff;
        }
        
        .stat-number {
          font-size: 32px;
          font-weight: bold;
          color: #1890ff;
          margin-bottom: 5px;
        }
        
        .stat-label {
          font-size: 14px;
          color: #7f8c8d;
        }
        
        .filter-info {
          background: #f8f9fa;
          border-right: 4px solid #1890ff;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
        }
        
        .filter-info h3 {
          color: #1890ff;
          margin-bottom: 10px;
        }
        
        .filter-item {
          padding: 5px 0;
          color: #2c3e50;
        }
        
        .data-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin-top: 20px;
          font-size: 14px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.1);
          border-radius: 10px;
          overflow: hidden;
        }
        
        .data-table thead {
          background: #1a1a1a !important;
          color: white !important;
        }
        
        .data-table th {
          padding: 15px 10px;
          text-align: center;
          font-weight: 700 !important;
          background: #1a1a1a !important;
          color: #ffffff !important;
          text-shadow: 1px 1px 2px rgba(0,0,0,0.5) !important;
        }
        
        /* Prevent row breaks */
        .data-table tbody tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        .data-table tbody tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        
        .data-table tbody tr:hover {
          background-color: #e9ecef !important;
        }
        
        .data-table td {
          padding: 20px 10px;
          text-align: center;
          border-bottom: 1px solid #dee2e6;
          font-size: 13px;
        }
        
        .attachment-available {
          color: #28a745;
          font-weight: bold;
          text-decoration: none;
        }
        
        .attachment-missing {
          color: #dc3545;
          font-style: italic;
        }
        
        .page-footer {
          text-align: center;
          margin-top: 2px;
          padding-top: 2px;
          border-top: 2px solid #dee2e6;
          color: #6c757d;
          font-size: 12px;
        }
        
        .page-number {
          background: #1890ff;
          color: white;
          padding: 5px 15px;
          border-radius: 20px;
          display: inline-block;
          margin: 10px 0;
        }
        
        .warning-box {
          background: #fff3cd;
          border-right: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
          color: #856404;
        }
        
        .lecture-type {
          font-size: 12px;
          text-align: right;
          padding-right: 8px;
        }

        @media print {
          @page {
            size: A4 landscape;
            margin: 0.5in;
          }
          
          .data-table tbody tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      </style>
      
      <!-- COVER PAGE -->
      <div style="padding: 40px;">
        <div class="watermark">محاضر</div>
        
        <div class="report-header">
          <h1 class="report-title">📋 تقرير المحاضر الشامل</h1>
          <p class="report-subtitle">${dateStr} - ${timeStr}</p>
        </div>
        
        <div class="stats-container">
          <div class="stat-box">
            <div class="stat-number">${totalRecords}</div>
            <div class="stat-label">إجمالي السجلات</div>
          </div>
          
          <div class="stat-box">
            <div class="stat-number">${recordsWithAttachments}</div>
            <div class="stat-label">سجلات بمرفقات</div>
          </div>
          
          <div class="stat-box">
            <div class="stat-number">${Math.round((recordsWithAttachments / totalRecords) * 100)}%</div>
            <div class="stat-label">نسبة اكتمال المرفقات</div>
          </div>
          
          <!-- We'll fix total page count later if needed -->
          <div class="stat-box">
            <div class="stat-number">؟</div>
            <div class="stat-label">عدد صفحات PDF</div>
          </div>
        </div>
        
        ${filterInfo.length > 0 ? `
          <div class="filter-info">
            <h3>🔍 معايير البحث المطبقة:</h3>
            ${filterInfo.map(item => `<div class="filter-item">• ${item}</div>`).join('')}
          </div>
        ` : ''}
        
        ${failedAttachments > 0 ? `
          <div class="warning-box">
            <strong>⚠️ تنبيه:</strong> تعذر تحميل ${failedAttachments} مرفق(ات) من إجمالي ${totalRecords} سجل.
            <br>قد يكون السبب ضغط على الخادم أو عدم توفر بعض المرفقات.
          </div>
        ` : ''}
        
        <div class="page-footer">
          <p>تم إنشاء هذا التقرير بواسطة نظام إدارة المكاتب</p>
          <p>جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
        </div>
      </div>
    `;

    // Add data pages — now without forced page breaks
    let counter = totalRecords;

    pages.forEach((page, pIdx) => {
      const isLastPage = pIdx === pages.length - 1;

      htmlContent += `
        <div style="padding: 30px;">
          <div class="watermark">محاضر</div>
          
          <div style="text-align: center; margin-bottom: 20px;">
            <div class="page-number">صفحة ${pIdx + 1} من ${pages.length}</div>
          </div>
          
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 4%;">ت</th>
                <th style="width: 9%;">التاريخ</th>
                <th style="width: 12%;">المحافظة</th>
                <th style="width: 12%;">المكتب</th>
                <th style="width: 28%;">عنوان المحضر</th>
                <th style="width: 12%;">الشركة</th>
                <th style="width: 15%;">نوع المحضر</th>
                <th style="width: 8%;">المرفق</th>
              </tr>
            </thead>
            <tbody>
              ${page.map((row) => {
                const dateStr = row.date ? new Date(row.date).toLocaleDateString("en-CA") : "-";
                const att = attachmentMap[row.id];
                const lectureTypes = Array.isArray(row.lectureTypeNames) && row.lectureTypeNames.length > 0 
                  ? row.lectureTypeNames.join(', ') 
                  : '-';
                const rowStyle = !att ? 'background-color: #fff9e6;' : '';
                const number = counter--;

                return `
                  <tr style="${rowStyle}">
                    <td style="font-weight: bold; color: #1890ff;">${number}</td>
                    <td>${dateStr}</td>
                    <td>${row.governorateName || "-"}</td>
                    <td>${row.officeName || "-"}</td>
                    <td style="text-align: right; padding-right: 10px;">
                      <strong>${row.title || "-"}</strong>
                    </td>
                    <td>${row.companyName || "-"}</td>
                    <td class="lecture-type">${lectureTypes}</td>
                    <td>
                      ${att ? 
                        `<a href="${att}" target="_blank" style="color: #1890ff; text-decoration: underline; cursor: pointer;">تحميل</a>` : 
                        `<span class="attachment-missing">غير متوفر</span>`
                      }
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
          
          <div class="page-footer">
            <p style="text-align: center; color: #6c757d; margin-top: 2px;">
              ${isLastPage ? '— نهاية التقرير —' : '— يتبع —'}
            </p>
          </div>
        </div>
      `;
    });

    // Summary page — force break before this
    if (totalRecords > 20) {
      htmlContent += `
        <div style="page-break-before: always; padding: 40px;">
          <div class="watermark">محاضر</div>
          
          <h2 style="text-align: center; color: #1890ff; margin-bottom: 30px;">
            📊 ملخص التقرير النهائي
          </h2>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px;">
            <h3 style="color: #2c3e50; margin-bottom: 20px;">الإحصائيات النهائية:</h3>
            
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">
                  <strong>إجمالي السجلات المعالجة:</strong>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: left;">
                  ${totalRecords} سجل
                </td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">
                  <strong>السجلات مع مرفقات:</strong>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: left;">
                  ${recordsWithAttachments} سجل (${Math.round((recordsWithAttachments / totalRecords) * 100)}%)
                </td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">
                  <strong>السجلات بدون مرفقات:</strong>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; text-align: left;">
                  ${failedAttachments} سجل (${Math.round((failedAttachments / totalRecords) * 100)}%)
                </td>
              </tr>
              <tr>
                <td style="padding: 10px;">
                  <strong>تاريخ إنشاء التقرير:</strong>
                </td>
                <td style="padding: 10px; text-align: left;">
                  ${dateStr} - ${timeStr}
                </td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin-top: 40px;">
            <p style="color: #6c757d;">شكراً لاستخدامكم نظام إدارة المكاتب</p>
            <p style="color: #6c757d; font-size: 12px;">
              هذا التقرير تم إنشاؤه آلياً وقد يحتوي على بيانات حساسة
            </p>
          </div>
        </div>
      `;
    }

    container.innerHTML = htmlContent;

    // Generate PDF with natural flow
    await html2pdf()
      .set({
        margin: 0.5,
        filename: `تقرير_المحاضر_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
        },
        jsPDF: {
          unit: "in",
          format: "a4",
          orientation: "landscape",
          compress: true,
        },
        pagebreak: {
          mode: ['avoid-all', 'css'],  // Let browser decide
          avoid: 'tr' // Only avoid breaking inside rows
        },
      })
      .from(container)
      .set({ enableLinks: true })
      .save();

    message.destroy();
    message.success(`تم تصدير التقرير بنجاح (${recordsWithAttachments}/${totalRecords} مرفق)`);

  } catch (err) {
    console.error("Error generating PDF:", err);
    message.destroy();
    message.error("حدث خطأ أثناء إنشاء التقرير");
  } finally {
    setIsPdfLoading(false);
  }
};
  // --- Storage: Save filters when search or page change
  const saveFiltersToStorage = (page) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        formData: {
          title: formData.title,
          startDate: formData.startDate ? formData.startDate.toISOString() : null,
          endDate: formData.endDate ? formData.endDate.toISOString() : null,
          companyId: formData.companyId,
          lectureTypeIds: formData.lectureTypeIds,
        },
        selectedGovernorate,
        selectedOffice,
        currentPage: page,
      })
    );
  };

  const handleSearch = async (page = 1) => {
    setCurrentPage(page);
    saveFiltersToStorage(page);
    
    const payload = {
      title: formData.title || "",
      officeId: isSupervisor ? profile.officeId : selectedOffice || null,
      governorateId: isSupervisor ? profile.governorateId : selectedGovernorate || null,
      startDate: formData.startDate ? formatToISO(formData.startDate) : null,
      endDate: formData.endDate ? formatToISO(formData.endDate) : null,
      companyId: formData.companyId || null,
      lectureTypeIds: formData.lectureTypeIds || [],
      PaginationParams: {
        PageNumber: page,
        PageSize: pageSize,
      },
    };

    await fetchLectures(payload);
  };

  const handleDateChange = (date, dateType) => {
    setFormData((prev) => ({
      ...prev,
      [dateType]: date,
    }));
  };

  const fetchGovernorates = useCallback(async () => {
    try {
      const response = await axiosInstance.get(
        `${Url}/api/Governorate/dropdown`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setGovernorates(response.data);

      if (isSupervisor) {
        setSelectedGovernorate(profile.governorateId);
        await fetchOffices(profile.governorateId);
      }
    } catch (error) {
      message.error("حدث خطأ أثناء جلب بيانات المحافظات");
    }
  }, [accessToken, isSupervisor, profile]);

  const fetchCompanies = async () => {
    try {
      const response = await axiosInstance.get(`${Url}/api/Company`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setCompanies(response.data);
    } catch (error) {
      message.error("حدث خطأ أثناء جلب بيانات الشركات");
    }
  };

  const handleCompanyChange = (companyId) => {
    setFormData((prev) => ({
      ...prev,
      companyId,
      lectureTypeIds: [],
    }));

    const selectedCompany = companies.find(
      (company) => company.id === companyId
    );
    if (selectedCompany) {
      setlectureTypeNames(selectedCompany.lectureTypes || []);
    } else {
      setlectureTypeNames([]);
    }
  };

  const fetchOffices = async (governorateId) => {
    if (!governorateId) {
      setOffices([]);
      setSelectedOffice(null);
      return;
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
      }
    } catch (error) {
      message.error("حدث خطأ أثناء جلب بيانات المكاتب");
    }
  };

  // Add a flag to track if initial load is complete
  const [hasInitialized, setHasInitialized] = useState(false);

  // --- On mount: Restore filters from storage then fetch data
  useEffect(() => {
    const initFilters = async () => {
      try {
        await fetchGovernorates();
        await fetchCompanies();
        
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
              title: savedFormData.title || "",
              startDate: savedFormData.startDate ? dayjs(savedFormData.startDate) : null,
              endDate: savedFormData.endDate ? dayjs(savedFormData.endDate) : null,
              companyId: savedFormData.companyId || null,
              lectureTypeIds: savedFormData.lectureTypeIds || [],
            });

            // If company was selected, load its lecture types
            if (savedFormData.companyId) {
              const savedCompany = companies.find(
                (company) => company.id === savedFormData.companyId
              );
              if (savedCompany) {
                setlectureTypeNames(savedCompany.lectureTypes || []);
              }
            }
          }
          
          if (!isSupervisor) {
            setSelectedGovernorate(savedGov || null);
            setSelectedOffice(savedOff || null);
            if (savedGov) await fetchOffices(savedGov);
          }
          
          const pageToUse = savedPage || 1;
          setCurrentPage(pageToUse);
          
          // Finally, fetch lectures using saved filters
          const payload = {
            title: savedFormData?.title || "",
            officeId: isSupervisor ? profile.officeId : savedOff || null,
            governorateId: isSupervisor ? profile.governorateId : savedGov || null,
            startDate: savedFormData?.startDate ? formatToISO(dayjs(savedFormData.startDate)) : null,
            endDate: savedFormData?.endDate ? formatToISO(dayjs(savedFormData.endDate)) : null,
            companyId: savedFormData?.companyId || null,
            lectureTypeIds: savedFormData?.lectureTypeIds || [],
            PaginationParams: { PageNumber: pageToUse, PageSize: pageSize },
          };
          await fetchLectures(payload);
        } else {
          // No saved filters: fetch initial data with default values
          const payload = {
            title: "",
            officeId: isSupervisor ? profile.officeId : null,
            governorateId: isSupervisor ? profile.governorateId : null,
            startDate: null,
            endDate: null,
            companyId: null,
            lectureTypeIds: [],
            PaginationParams: { PageNumber: 1, PageSize: pageSize },
          };
          await fetchLectures(payload);
        }
        
        setHasInitialized(true);
      } catch (error) {
        console.error(error);
        setHasInitialized(true);
      }
    };
    
    if (!hasInitialized) {
      initFilters();
    }
  }, [hasInitialized, accessToken, profile, isSupervisor]);

  const handleGovernorateChange = async (value) => {
    setSelectedGovernorate(value);
    setSelectedOffice(null);
    await fetchOffices(value);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSearch(1);
  };

  const handleInputChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      title: value,
    }));
  };

  const handleReset = async () => {
    setFormData({
      title: "",
      startDate: null,
      endDate: null,
      companyId: null,
      lectureTypeIds: [],
    });
    setCurrentPage(1);
    setlectureTypeNames([]);

    if (!isSupervisor) {
      setSelectedGovernorate(null);
      setSelectedOffice(null);
      setOffices([]);
    }

    // Remove from localStorage
    localStorage.removeItem(STORAGE_KEY);

    const payload = {
      title: "",
      officeId: isSupervisor ? profile.officeId : null,
      governorateId: isSupervisor ? profile.governorateId : null,
      startDate: null,
      endDate: null,
      companyId: null,
      lectureTypeIds: [],
      PaginationParams: {
        PageNumber: 1,
        PageSize: pageSize,
      },
    };

    await fetchLectures(payload);
    message.success("تم إعادة تعيين الفلاتر بنجاح");
  };

  const columns = [
    {
      title: "عنوان المحضر",
      dataIndex: "title",
      key: "title",
      className: "table-column-Lecturer-address",
    },
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
      className: "table-column-date",
      render: (text) => {
        const date = new Date(text);
        return isNaN(date.getTime())
          ? "تاريخ غير صالح"
          : date.toLocaleDateString("en-CA");
      },
    },
    {
      title: "المكتب",
      dataIndex: "officeName",
      key: "officeName",
      className: "table-column-Lecturer-address",
    },
    {
      title: "المحافظة",
      dataIndex: "governorateName",
      key: "governorateName",
      className: "table-column-Lecturer-address",
    },
    {
      title: "اسم الشركة",
      dataIndex: "companyName",
      key: "companyName",
      className: "table-column-Lecturer-address",
    },
    {
      title: "التفاصيل",
      key: "details",
      className: "table-column-details",
      render: (_, record) => (
        <Link
          to="/supervisor/lecturer/history/LecturerShow"
          state={{ id: record.id }}
          className="supervisor-Lectur-details-link"
        >
          عرض
        </Link>
      ),
    },
  ];

  const handleMyLectures = async () => {
    if (!profile || !profile.profileId) {
      message.error("بيانات المستخدم غير متوفرة");
      return;
    }
    const payload = {
      title: "",
      officeId: null,
      startDate: null,
      endDate: null,
      governorateId: null,
      companyId: null,
      ProfileId: profile.profileId,
      lectureTypeId: null,
      PaginationParams: {
        PageNumber: 1,
        PageSize: 10,
      },
    };
    setIsLoading(true);
    try {
      const response = await axiosInstance.post(
        `${Url}/api/Lecture/search`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (response.data) {
        setLectures(response.data);
        const paginationHeader = response.headers["pagination"];
        if (paginationHeader) {
          const paginationInfo = JSON.parse(paginationHeader);
          setTotalLectures(paginationInfo.totalItems);
        } else {
          setTotalLectures(response.data.length);
        }
      }
      message.success("تم جلب المحاضر الخاصة بك");
      
      // Clear saved filters when showing "my lectures"
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error fetching my lectures:", error);
      message.error("حدث خطأ أثناء جلب المحاضر الخاصة بك");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`supervisor-passport-dameged-page ${
        isSidebarCollapsed ? " sidebar-collapsed" : ""
      }`}
      dir="rtl"
    >
      <h1 className="supervisor-passport-dameged-title">المحاضر</h1>

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : (
        <>
          <div
            className={`supervisor-passport-dameged-filters ${
              searchVisible ? "animate-show" : "animate-hide"
            }`}
          >
            <form onSubmit={handleFormSubmit} className="supervisor-passport-dameged-form">
              <div className="filter-field">
                <label htmlFor="governorate" className="supervisor-Lectur-label">
                  المحافظة
                </label>
                <Select
                  id="governorate"
                  value={selectedGovernorate || undefined}
                  onChange={handleGovernorateChange}
                  disabled={isSupervisor}
                  className="supervisor-Lectur-select"
                  placeholder="اختر المحافظة"
                >
                  {governorates.map((gov) => (
                    <Select.Option key={gov.id} value={gov.id}>
                      {gov.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div className="filter-field">
                <label htmlFor="office" className="supervisor-Lectur-label">
                  اسم المكتب
                </label>
                <Select
                  id="office"
                  value={selectedOffice || undefined}
                  onChange={(value) => setSelectedOffice(value)}
                  disabled={isSupervisor || !selectedGovernorate}
                  className="supervisor-Lectur-select"
                >
                  {offices.map((office) => (
                    <Select.Option key={office.id} value={office.id}>
                      {office.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div className="filter-field">
                <label htmlFor="title" className="supervisor-Lectur-label">
                  عنوان المحضر
                </label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="supervisor-Lectur-input"
                />
              </div>
              
              <div className="filter-field">
                <label htmlFor="company" className="supervisor-Lectur-label">
                  الشركة
                </label>
                <Select
                  id="company"
                  value={formData.companyId || undefined}
                  onChange={handleCompanyChange}
                  className="supervisor-Lectur-select"
                >
                  {companies.map((company) => (
                    <Select.Option key={company.id} value={company.id}>
                      {company.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div className="filter-field">
                <label>نوع المحضر</label>
                <Select
                  id="lectureTypeIds"
                  mode="multiple"
                  value={formData.lectureTypeIds}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, lectureTypeIds: value }))
                  }
                  className="filter-dropdown"
                  style={{ maxHeight: "200px", overflowY: "auto" }}
                >
                  {lectureTypeNames.map((type) => (
                    <Select.Option key={type.id} value={type.id}>
                      {type.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div className="supervisor-Lectur-field-wrapper">
                <label htmlFor="startDate" className="supervisor-Lectur-label">
                  التاريخ من
                </label>
                <DatePicker
                  id="startDate"
                  placeholder="اختر التاريخ"
                  onChange={(date) => handleDateChange(date, "startDate")}
                  value={formData.startDate}
                  className="supervisor-passport-dameged-input"
                />
              </div>

              <div className="supervisor-Lectur-field-wrapper">
                <label htmlFor="endDate" className="supervisor-Lectur-label">
                  التاريخ إلى
                </label>
                <DatePicker
                  id="endDate"
                  placeholder="اختر التاريخ"
                  onChange={(date) => handleDateChange(date, "endDate")}
                  value={formData.endDate}
                  className="supervisor-passport-dameged-input"
                />
              </div>

              <div className="supervisor-Lectur-buttons">
                <Button htmlType="submit" className="supervisor-passport-dameged-button">
                  ابحث
                </Button>
                <Button onClick={handleReset} className="supervisor-passport-dameged-button">
                  إعادة تعيين
                </Button>
              </div>

              {hasCreatePermission && (
                <Link to="/supervisor/lecturerAdd/supervisorlecturerAdd">
                  <Button type="primary" className="supervisor-passport-dameged-add-button">
                    اضافة محضر جديد +
                  </Button>
                </Link>
              )}

              {permissions.includes("PS") && (
                <div className="supervisor-Lectur-buttons">
                  <Button  className="supervisor-passport-dameged-button" onClick={handleMyLectures} style={{width:"fit-content"}}>
                    المحاضر الخاصة بي
                  </Button>
                </div>
              )}
      <Button
  type="primary"
  danger
  onClick={handlePrintPDF}
  className="pdf-export-btn"
  loading={isPdfLoading}
  disabled={isPdfLoading}
  style={{ width: "fit-content" }}
>
  <span className="pdf-export-btn__content">
    {isPdfLoading ? "جاري التصدير..." : "تصدير إلى PDF"}
    {!isPdfLoading && <Icons type="pdf" />}
  </span>
</Button>
            </form>
          </div>

          <div className="supervisor-Lectur-table-container">
            <ConfigProvider direction="rtl">
              <Table
                dataSource={lectures}
                columns={columns}
                rowKey="id"
                bordered
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  total: totalLectures,
                  position: ["bottomCenter"],
                  onChange: (page) => handleSearch(page),
                  showTotal: (total, range) => (
                    <span style={{ marginLeft: "8px", fontWeight: "bold" }}>
                      اجمالي السجلات: {total}
                    </span>
                  ),
                }}
                locale={{ emptyText: "لا توجد بيانات" }}
                className="supervisor-Lectur-table"
              />
            </ConfigProvider>
          </div>
        </>
      )}
    </div>
  );
};

export default SuperVisorLecturerhistory;