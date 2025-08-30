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
import html2pdf from "html2pdf.js";
import "./SuperVisorDevice.css";
import useAuthStore from "./../../../store/store";
import axiosInstance from "./../../../intercepters/axiosInstance.js";
import Url from "./../../../store/url.js";
import Icons from "./../../../reusable elements/icons.jsx";

const SuperVisorDevices = () => {
  const {
    isSidebarCollapsed,
    accessToken,
    profile,
    searchVisible,
    permissions,
    roles,
  } = useAuthStore();

  // Permissions/roles
  const hasCreatePermission = permissions.includes("DDc");
  const isSupervisor =
    roles.includes("Supervisor") || roles === "I.T" || roles === "MainSupervisor";
  // Add this with your other state variables
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  // Device list & pagination
  const [devices, setDevices] = useState([]);
  const [totalDevices, setTotalDevices] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Governorates/offices
  const [governorates, setGovernorates] = useState([]);
  const [offices, setOffices] = useState([]);

  // Selected filters
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);

  // Other filter data
  const [formData, setFormData] = useState({
    serialNumber: "",
    startDate: null,
    endDate: null,
  });

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Utility to format a JS date to ISO string
  const formatToISO = (date) => {
    if (!date) return null;
    return date.toISOString();
  };

  // 1) Fetch only governorates (no side-effects like setting selectedGovernorate).
  const fetchGovernorates = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`${Url}/api/Governorate/dropdown`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setGovernorates(response.data || []);
    } catch (error) {
      message.error("حدث خطأ أثناء جلب بيانات المحافظات");
    }
  }, [accessToken]);

  // 2) Fetch offices for a particular governorate
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
      } else {
        setOffices([]);
      }
    } catch (error) {
      message.error("حدث خطأ أثناء جلب بيانات المكاتب");
    }
  };

  // 3) Main API call for searching devices
  const fetchDevices = async (payload) => {
    try {
      const response = await axiosInstance.post(
        `${Url}/api/DamagedDevice/search`,
        {
          serialNumber: payload.serialNumber || "",
          officeId: payload.officeId || null,
          governorateId: payload.governorateId || null,
          startDate: payload.startDate || null,
          endDate: payload.endDate || null,
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
        setDevices(response.data);

        // If there's a pagination header, parse it; otherwise fallback to data length
        const paginationHeader = response.headers["pagination"];
        if (paginationHeader) {
          const paginationInfo = JSON.parse(paginationHeader);
          setTotalDevices(paginationInfo.totalItems);
        } else {
          setTotalDevices(response.data.length);
        }
      }
    } catch (error) {
      console.error("API Error:", error);
      message.error(
        `حدث خطأ أثناء جلب الأجهزة: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };
  const handlePrintPDF = async () => {
    // Start loading
    setIsPdfLoading(true);
    
    try {
      // Show loading message
      message.loading('جاري تحضير التقرير...', 0);
      
      // 1) Fetch all filtered devices
      const payload = {
        serialNumber: formData.serialNumber || "",
        officeId: isSupervisor ? profile.officeId : selectedOffice || null,
        governorateId: isSupervisor ? profile.governorateId : selectedGovernorate || null,
        startDate: formData.startDate ? formatToISO(formData.startDate) : null,
        endDate: formData.endDate ? formatToISO(formData.endDate) : null,
        PaginationParams: { PageNumber: 1, PageSize: totalDevices },
      };
  
      const { data: devicesList } = await axiosInstance.post(
        `${Url}/api/DamagedDevice/search`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
  
      // Update loading message
      message.loading('جاري تحميل المرفقات...', 0);
  
      // 2) Build a map of attachment URLs per device
      const attachmentMap = {};
      await Promise.all(
        (devicesList || []).map(async (dev) => {
          try {
            const { data: atts } = await axiosInstance.get(
              `${Url}/api/Attachment/DamagedDevice/${dev.id}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (Array.isArray(atts) && atts.length) {
              const path = atts[0].filePath.replace(/^\/+/, "/");
              attachmentMap[dev.id] = `https://oms-cdn.scopesky.iq${path}`;
            }
          } catch {
            /* ignore attachment errors per device */
          }
        })
      );
  
      // Update loading message
      message.loading('جاري إنشاء ملف PDF...', 0);
  
      // 3) Chunk rows into pages of 10
      const chunkArray = (arr, size) => {
        const result = [];
        for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
        return result;
      };
      const PAGE_SIZE = 10;
      const pages = chunkArray(devicesList || [], PAGE_SIZE);
  
      // 4) Build printable container: one table per page
      const container = document.createElement("div");
      container.dir = "rtl";
      container.style.fontFamily = "Arial, sans-serif";
  
      container.innerHTML = pages
        .map((page, pIdx) => {
          const pageStyle = `padding:20px; ${pIdx < pages.length - 1 ? "page-break-after: always;" : ""}`;
          return `
            <div style="${pageStyle}">
              <h1 style="text-align:center; margin-top:0;">تقرير الأجهزة التالفة - صفحة ${pIdx + 1}</h1>
              <table style="width:100%; border-collapse:collapse; font-size:12px;">
                <thead>
                  <tr style="background:#f2f2f2;">
                    <th style="border:1px solid #ddd; padding:8px; text-align:center;">ت</th>
                    <th style="border:1px solid #ddd; padding:8px; text-align:center;">التاريخ</th>
                    <th style="border:1px solid #ddd; padding:8px; text-align:center;">المحافظة</th>
                    <th style="border:1px solid #ddd; padding:8px; text-align:center;">المكتب</th>
                    <th style="border:1px solid #ddd; padding:8px; text-align:center;">الرقم التسلسلي</th>
                    <th style="border:1px solid #ddd; padding:8px; text-align:center;">المرفق</th>
                  </tr>
                </thead>
                <tbody>
                  ${page
                    .map((dev, idx) => {
                      const globalIndex = pIdx * PAGE_SIZE + idx;
                      const descendingNo = (devicesList?.length || 0) - globalIndex;
                      const dateStr = dev?.date ? new Date(dev.date).toLocaleDateString("en-CA") : "-";
                      const att = attachmentMap[dev.id];
                      return `
                        <tr>
                          <td style="border:1px solid #ddd; padding:8px; text-align:center;">${descendingNo}</td>
                          <td style="border:1px solid #ddd; padding:8px; text-align:center;">${dateStr}</td>
                          <td style="border:1px solid #ddd; padding:8px; text-align:center;">${dev.governorateName || "-"}</td>
                          <td style="border:1px solid #ddd; padding:8px; text-align:center;">${dev.officeName || "-"}</td>
                          <td style="border:1px solid #ddd; padding:8px; text-align:center;">${dev.serialNumber || "-"}</td>
                          <td style="border:1px solid #ddd; padding:8px; text-align:center;">
                            ${att ? `<a href="${att}" target="_blank" rel="noreferrer">تحميل المرفق</a>` : "-"}
                          </td>
                        </tr>
                      `;
                    })
                    .join("")}
                </tbody>
              </table>
            </div>
          `;
        })
        .join("");
  
      // 5) Export to PDF (A4 landscape)
      await html2pdf()
        .set({
          margin: 1,
          filename: "تقرير_الأجهزة_التالفة.pdf",
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "cm", format: "a4", orientation: "landscape" },
        })
        .from(container)
        .save();
  
      // Success message
      message.destroy(); // Clear loading message
      message.success("تم تصدير التقرير بنجاح");
      
    } catch (err) {
      console.error("Error generating PDF:", err);
      message.destroy(); // Clear loading message
      message.error("حدث خطأ أثناء إنشاء التقرير");
    } finally {
      // Stop loading
      setIsPdfLoading(false);
    }
  };
// Add these functions after the fetchDevices function and before handleFormSubmit

// 4) Searching with the current filter state
const handleSearch = async (page = 1) => {
  setIsLoading(true);

  const finalGovernorate = isSupervisor ? profile.governorateId : selectedGovernorate;
  const finalOffice = isSupervisor ? profile.officeId : selectedOffice;

  const payload = {
    serialNumber: formData.serialNumber || "",
    officeId: finalOffice || null,
    governorateId: finalGovernorate || null,
    startDate: formData.startDate ? formatToISO(formData.startDate) : null,
    endDate: formData.endDate ? formatToISO(formData.endDate) : null,
    PaginationParams: {
      PageNumber: page,
      PageSize: pageSize,
    },
  };

  await fetchDevices(payload);
  setCurrentPage(page);
};

// 7) "إعادة تعيين" (Reset function)
const handleReset = async () => {
  setFormData({ serialNumber: "", startDate: null, endDate: null });
  setCurrentPage(1);

  if (!isSupervisor) {
    setSelectedGovernorate(null);
    setSelectedOffice(null);
    setOffices([]);
  }

  setIsLoading(true);
  const payload = {
    serialNumber: "",
    officeId: isSupervisor ? profile.officeId : null,
    governorateId: isSupervisor ? profile.governorateId : null,
    startDate: null,
    endDate: null,
    PaginationParams: {
      PageNumber: 1,
      PageSize: pageSize,
    },
  };
  await fetchDevices(payload);
  message.success("تم إعادة تعيين الفلاتر بنجاح");
};

  // 5) "البحث" button triggers form submit
  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  // 6) Helpers to track filter changes
  const handleInputChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      serialNumber: value,
    }));
  };

  const handleDateChange = (date, dateType) => {
    setFormData((prev) => ({
      ...prev,
      [dateType]: date,
    }));
  };


  // 8) When user changes governorate from the Select
  const handleGovernorateChange = async (value) => {
    setSelectedGovernorate(value);
    setSelectedOffice(null);
    await fetchOffices(value);
  };

  // 9) On component mount, do everything in the right order
useEffect(() => {
  const initData = async () => {
    setIsLoading(true);
    await fetchGovernorates();

    // REMOVED: All localStorage retrieval logic
    // Set default values based on user role
    let loadedGov = null;
    let loadedOffice = null;

    if (isSupervisor) {
      loadedGov = profile.governorateId;
      loadedOffice = profile.officeId;
    }

    // If we have a governorate, fetch its offices
    if (loadedGov) {
      await fetchOffices(loadedGov);
    }

    // Set initial state
    setSelectedGovernorate(loadedGov);
    setSelectedOffice(loadedOffice);

    // Build payload and fetch devices with default filters
    const finalPayload = {
      serialNumber: "",
      officeId: loadedOffice || null,
      governorateId: loadedGov || null,
      startDate: null,
      endDate: null,
      PaginationParams: {
        PageNumber: 1,
        PageSize: pageSize,
      },
    };
    await fetchDevices(finalPayload);
  };

  initData();
}, []);

  // 10) Table columns
  const columns = [
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
      title: "الرقم التسلسلي",
      dataIndex: "serialNumber",
      key: "serialNumber",
      className: "table-column-serial-number",
    },
    {
      title: "التفاصيل",
      key: "details",
      className: "table-column-details",
      render: (_, record) => (
        <Link
          to="/damegedDevices/show"
          state={{ id: record.id }}
          className="supervisor-devices-dameged-details-link"
        >
          عرض
        </Link>
      ),
    },
  ];

  return (
    <div
      className={`supervisor-passport-dameged-page ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl"
    >
      <h1 className="supervisor-devices-dameged-title">الأجهزة التالفة</h1>

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : (
        <>
          <div
            className={`supervisor-passport-dameged-filters ${
              searchVisible ? "animate-show" : "animate-hide"
            }`}
          >
            <form
              onSubmit={handleFormSubmit}
              className="supervisor-passport-dameged-form"
            >
              {/* Governorate */}
              <div className="supervisor-devices-dameged-field-wrapper">
                <label className="supervisor-devices-dameged-label">
                  المحافظة
                </label>
                <Select
                  value={selectedGovernorate || undefined}
                  onChange={handleGovernorateChange}
                  disabled={isSupervisor}
                  className="supervisor-devices-dameged-dropdown"
                  placeholder="اختر المحافظة"
                >
                  <Select.Option value="">اختر المحافظة</Select.Option>
                  {governorates.map((gov) => (
                    <Select.Option key={gov.id} value={gov.id}>
                      {gov.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              {/* Office */}
              <div className="supervisor-devices-dameged-field-wrapper">
                <label className="supervisor-devices-dameged-label">
                  اسم المكتب
                </label>
                <Select
                  value={selectedOffice || undefined}
                  onChange={(value) => setSelectedOffice(value)}
                  disabled={isSupervisor || !selectedGovernorate}
                  className="supervisor-devices-dameged-dropdown"
                  placeholder="اختر المكتب"
                >
                  <Select.Option value="">اختر المكتب</Select.Option>
                  {offices.map((office) => (
                    <Select.Option key={office.id} value={office.id}>
                      {office.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              {/* Serial Number */}
              <div className="supervisor-devices-dameged-field-wrapper">
                <label className="supervisor-devices-dameged-label">
                  الرقم التسلسلي
                </label>
                <Input
                  value={formData.serialNumber}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="supervisor-devices-dameged-input"
                />
              </div>

              {/* Date Range */}
              <div className="supervisor-devices-dameged-field-wrapper">
                <label className="supervisor-devices-dameged-label">
                  التاريخ من
                </label>
                <DatePicker
                  placeholder="اختر التاريخ"
                  onChange={(date) => handleDateChange(date, "startDate")}
                  value={formData.startDate}
                  className="supervisor-devices-dameged-input"
                  style={{ width: "100%" }}
                />
              </div>

              <div className="supervisor-devices-dameged-field-wrapper">
                <label className="supervisor-devices-dameged-label">
                  التاريخ إلى
                </label>
                <DatePicker
                  placeholder="اختر التاريخ"
                  onChange={(date) => handleDateChange(date, "endDate")}
                  value={formData.endDate}
                  className="supervisor-devices-dameged-input"
                  style={{ width: "100%" }}
                />
              </div>

              {/* Buttons */}
              <div className="supervisor-device-filter-buttons">
                <Button
                  htmlType="submit"
                  className="supervisor-passport-dameged-button"
                >
                  ابحث
                </Button>
                <Button
                  onClick={handleReset}
                  className="supervisor-passport-dameged-button"
                >
                  إعادة تعيين
                </Button>
                <Button 
  onClick={handlePrintPDF} 
  className="pdf-export-btn"
  loading={isPdfLoading}
  disabled={isPdfLoading}
>
  {isPdfLoading ? 'جاري التصدير...' : 'تصدير الى PDF'}
  {!isPdfLoading && <Icons type="pdf" />}
</Button>


              </div>

              {/* Add new device (permission‐based) */}
              {hasCreatePermission && (
                <Link to="/damegedDevices/add">
                  <Button
                    type="primary"
                    className="supervisor-passport-dameged-add-button"
                  >
                    اضافة جهاز جديد +
                  </Button>
                </Link>
              )}
            </form>
          </div>

          {/* Table */}
          <div className="supervisor-devices-dameged-table-container">
            <ConfigProvider direction="rtl">
              <Table
                dataSource={devices}
                columns={columns}
                rowKey="id"
                bordered
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  total: totalDevices,
                  position: ["bottomCenter"],
                  onChange: (page) => {
                    handleSearch(page);
                  },
                  showTotal: (total, range) => (
                    <span style={{ marginLeft: "8px", fontWeight: "bold" }}>
                      اجمالي السجلات: {total}
                    </span>
                  ),
                }}
                locale={{ emptyText: "لا توجد بيانات" }}
                className="supervisor-devices-dameged-table"
              />
            </ConfigProvider>
          </div>
        </>
      )}
    </div>
  );
};

export default SuperVisorDevices;
