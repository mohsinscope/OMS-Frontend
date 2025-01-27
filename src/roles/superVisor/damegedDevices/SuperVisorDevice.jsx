import { useState, useEffect, useCallback } from "react";
import {
  Table,
  message,
  Button,
  ConfigProvider,
  DatePicker,
  Select,
  Input,
} from "antd";
import { Link } from "react-router-dom";
import html2pdf from "html2pdf.js";
import "./SuperVisorDevice.css";
import useAuthStore from "./../../../store/store";
import axiosInstance from "./../../../intercepters/axiosInstance.js";
import Url from "./../../../store/url.js";
import Icons from './../../../reusable elements/icons.jsx';
const SuperVisorDevices = () => {
  const {
    isSidebarCollapsed,
    accessToken,
    profile,
    searchVisible,
    permissions,
    roles,
  } = useAuthStore();
  
  const hasCreatePermission = permissions.includes("DDc");
  const isSupervisor = roles.includes("Supervisor");

  const [devices, setDevices] = useState([]);
  const [totalDevices, setTotalDevices] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [governorates, setGovernorates] = useState([]);
  const [offices, setOffices] = useState([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [formData, setFormData] = useState({
    serialNumber: "",
    startDate: null,
    endDate: null,
  });

  const formatToISO = (date) => {
    if (!date) return null;
    return date.toISOString();
  };

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
    }
  };

  const handleSearch = async (page = 1) => {
    const payload = {
      serialNumber: formData.serialNumber || "",
      officeId: isSupervisor ? profile.officeId : selectedOffice || null,
      governorateId: isSupervisor
        ? profile.governorateId
        : selectedGovernorate || null,
      startDate: formData.startDate ? formatToISO(formData.startDate) : null,
      endDate: formData.endDate ? formatToISO(formData.endDate) : null,
      PaginationParams: {
        PageNumber: page,
        PageSize: pageSize,
      },
    };

    await fetchDevices(payload);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

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

  const handleReset = async () => {
    setFormData({ serialNumber: "", startDate: null, endDate: null });
    setCurrentPage(1);

    if (!isSupervisor) {
      setSelectedGovernorate(null);
      setSelectedOffice(null);
      setOffices([]);
    }

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

  const handleGovernorateChange = async (value) => {
    setSelectedGovernorate(value);
    setSelectedOffice(null);
    await fetchOffices(value);
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

  useEffect(() => {
    fetchGovernorates();
  }, [fetchGovernorates]);

  useEffect(() => {
    const initialPayload = {
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

    fetchDevices(initialPayload);
  }, [isSupervisor, profile.officeId, profile.governorateId]);

  // const handlePrintPDF = async () => {
  //   try {
  //     // Fetch all devices for the current filters
  //     const payload = {
  //       serialNumber: formData.serialNumber || "",
  //       officeId: isSupervisor ? profile.officeId : selectedOffice || null,
  //       governorateId: isSupervisor ? profile.governorateId : selectedGovernorate || null,
  //       startDate: formData.startDate ? formatToISO(formData.startDate) : null,
  //       endDate: formData.endDate ? formatToISO(formData.endDate) : null,
  //       PaginationParams: {
  //         PageNumber: 1,
  //         PageSize: totalDevices, // Fetch all devices
  //       },
  //     };
  
  //     const response = await axiosInstance.post(
  //       `${Url}/api/DamagedDevice/search`,
  //       payload,
  //       {
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${accessToken}`,
  //         },
  //       }
  //     );
  
  //     const fullDeviceList = response.data || [];
  
  //     // Generate the PDF content
  //     const element = document.createElement("div");
  //     element.dir = "rtl";
  //     element.style.fontFamily = "Arial, sans-serif";
  //     element.innerHTML = `
  //       <div style="padding: 20px; font-family: Arial, sans-serif;">
  //         <h1 style="text-align: center;">تقرير الأجهزة التالفة</h1>
  //         <table style="width: 100%; border-collapse: collapse;">
  //           <thead>
  //             <tr style="background-color: #f2f2f2;">
  //               <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">ت</th>
  //               <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">التاريخ</th>
  //               <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">المحافظة</th>
  //               <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">المكتب</th>
  //               <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">الرقم التسلسلي</th>
  //             </tr>
  //           </thead>
  //           <tbody>
  //             ${fullDeviceList
  //               .map(
  //                 (device, index) => `
  //                   <tr>
  //                     <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${fullDeviceList.length - index}</td>
  //                     <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${new Date(device.date).toLocaleDateString("en-CA")}</td>
  //                     <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${device.governorateName}</td>
  //                     <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${device.officeName}</td>
  //                     <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${device.serialNumber}</td>
  //                   </tr>
  //                 `
  //               )
  //               .join("")}
  //           </tbody>
  //         </table>
  //       </div>
  //     `;
  
  //     const options = {
  //       margin: 1,
  //       filename: "تقرير_الأجهزة_التالفة.pdf",
  //       image: { type: "jpeg", quality: 0.98 },
  //       html2canvas: { scale: 2 },
  //       jsPDF: { unit: "cm", format: "a4", orientation: "landscape" },
  //     };
  
  //     html2pdf().from(element).set(options).save();
  //   } catch (error) {
  //     console.error("Error generating PDF:", error);
  //     message.error("حدث خطأ أثناء إنشاء ملف PDF");
  //   }
  // };
  

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
          className="supervisor-devices-dameged-details-link">
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
      dir="rtl">
      <h1 className="supervisor-devices-dameged-title">الأجهزة التالفة</h1>

      <div
        className={`supervisor-passport-dameged-filters ${
          searchVisible ? "animate-show" : "animate-hide"
        }`}>
        <form
          onSubmit={handleFormSubmit}
          className="supervisor-passport-dameged-form">
          <div className="supervisor-devices-dameged-field-wrapper">
            <label className="supervisor-devices-dameged-label">المحافظة</label>
            <Select
              value={selectedGovernorate || undefined}
              onChange={handleGovernorateChange}
              disabled={isSupervisor}
              className="supervisor-devices-dameged-dropdown"
              placeholder="اختر المحافظة">
              {governorates.map((gov) => (
                <Select.Option key={gov.id} value={gov.id}>
                  {gov.name}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div className="supervisor-devices-dameged-field-wrapper">
            <label className="supervisor-devices-dameged-label">
              اسم المكتب
            </label>
            <Select
              value={selectedOffice || undefined}
              onChange={(value) => setSelectedOffice(value)}
              disabled={isSupervisor || !selectedGovernorate}
              className="supervisor-devices-dameged-dropdown"
              placeholder="اختر المكتب">
              {offices.map((office) => (
                <Select.Option key={office.id} value={office.id}>
                  {office.name}
                </Select.Option>
              ))}
            </Select>
          </div>

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

          <div className="supervisor-device-filter-buttons">
            <Button
              htmlType="submit"
              className="supervisor-passport-dameged-button">
              ابحث
            </Button>
            <Button
              onClick={handleReset}
              className="supervisor-passport-dameged-button">
              إعادة تعيين
            </Button>
            {/* <button
    className="modern-button pdf-button"
    onClick={handlePrintPDF}
    style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 24px", borderRadius: "8px" }}
  >
    تصدير الى PDF
    <Icons type="pdf" />
  </button> */}
  
          </div>
          {hasCreatePermission && (
            <Link to="/damegedDevices/add">
              <Button type="primary" className="supervisor-passport-dameged-add-button">
                اضافة جهاز جديد +
              </Button>
            </Link>
          )}
        </form>
      </div>

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
                setCurrentPage(page);
                handleSearch(page);
              },
            }}
            locale={{ emptyText: "لا توجد بيانات" }}
            className="supervisor-devices-dameged-table"
          />
        </ConfigProvider>
      </div>
    </div>
  );
};

export default SuperVisorDevices;