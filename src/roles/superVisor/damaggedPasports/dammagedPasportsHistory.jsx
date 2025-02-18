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

const { Option } = Select;

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

  const [formData, setFormData] = useState({
    passportNumber: "",
    damagedTypeId: null,
    startDate: null,
    endDate: null,
  });

  // New states for the email modal and its loading indicator
  const [isEmailModalVisible, setIsEmailModalVisible] = useState(false);
  const [emailReportDate, setEmailReportDate] = useState(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  // Formatting dates to ISO
  const formatToISO = (date, isEndDate = false) => {
    if (!date) return null;
    const d = new Date(date);
    if (isEndDate) {
      d.setHours(23, 59, 59, 999);
    } else {
      d.setHours(0, 0, 0, 0);
    }
    return d.toISOString();
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
      const response = await axiosInstance.get(`${Url}/api/damagedtype/all?PageNumber=1&PageSize=1000`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      console.log(response);
      setDamageTypes(response.data);
    } catch (error) {
      message.error("حدث خطأ أثناء جلب بيانات نوع التلف");
    }
  };

  useEffect(() => {
    fetchDamageTypes();
  }, []);

  // New handler functions for email modal (download ZIP file)
  const handleEmailReportOk = async () => {
    if (!emailReportDate) {
      message.error("الرجاء اختيار تاريخ التقرير");
      return;
    }
    setIsEmailLoading(true);

    const dateWithFixedHour = new Date(emailReportDate);
    dateWithFixedHour.setHours(3, 0, 0, 0);
    
    const payload = {
      ReportDate: dateWithFixedHour.toISOString(),
    };
    console.log(payload);
    try {
      // Configure axios to return a blob with a 3-minute timeout.
      const response = await axiosInstance.post(
        `${Url}/api/DamagedPassportsReport/zip`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          timeout: 180000, // 3 minutes timeout
          responseType: "blob", // ensure the response is a blob
        }
      );

      // Create a blob from the response data and trigger a download.
      const blob = new Blob([response.data], { type: "application/zip" });

      // Optionally, extract the filename from the response headers.
      const contentDisposition = response.headers["content-disposition"];
      let filename = "DamagedPassportsReport.zip";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }

      saveAs(blob, filename);
      message.success("تم تحميل التقرير بنجاح");
    } catch (error) {
      console.error("Error downloading email report:", error);
      message.error("حدث خطأ أثناء تحميل التقرير");
    } finally {
      setIsEmailLoading(false);
      setIsEmailModalVisible(false);
      setEmailReportDate(null);
    }
  };

  const handleEmailModalCancel = () => {
    setIsEmailModalVisible(false);
    setEmailReportDate(null);
  };

  const handlePrintPDF = async () => {
    try {
      const payload = {
        passportNumber: formData.passportNumber || "",
        officeId: isSupervisor ? profile.officeId : selectedOffice || null,
        governorateId: isSupervisor ? profile.governorateId : selectedGovernorate || null,
        damagedTypeId: formData.damagedTypeId || null,
        startDate: formData.startDate ? formatToISO(formData.startDate) : null,
        endDate: formData.endDate ? formatToISO(formData.endDate) : null,
        PaginationParams: {
          PageNumber: 1,
          PageSize: totalPassports,
        },
      };

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
      const payload = {
        passportNumber: formData.passportNumber || "",
        profileFullName: formData.profileFullName || "",
        officeId: isSupervisor ? profile.officeId : selectedOffice || null,
        governorateId: isSupervisor ? profile.governorateId : selectedGovernorate || null,
        damagedTypeId: formData.damagedTypeId || null,
        startDate: formData.startDate ? formatToISO(formData.startDate) : null,
        endDate: formData.endDate ? formatToISO(formData.endDate) : null,
        PaginationParams: {
          PageNumber: 1,
          PageSize: totalPassports,
        },
      };

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

      if (fullPassportList.length === 0) {
        message.error("لا توجد بيانات لتصديرها");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("تقرير الجوازات التالفة", {
        properties: { rtl: true },
      });

      const headers = [
        "نوع التلف",
        "رقم الجواز",
        "اسم المستخدم",
        "المكتب",
        "المحافظة",
        "تاريخ التلف",
        "تاريخ الانشاء",
        "ت",
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

      fullPassportList.forEach((passport, index) => {
        const row = worksheet.addRow([
          passport.damagedTypeName,
          passport.passportNumber,
          passport.profileFullName,
          passport.officeName,
          passport.governorateName,
          new Date(passport.date).toLocaleDateString("en-CA"),
          new Date(passport.datecreated).toLocaleDateString("en-CA"),
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
      const formattedDate = now.toISOString().split("T")[0]; // YYYY-MM-DD format
      saveAs(
        new Blob([buffer]), 
        `${formattedDate}_تقرير_الجوازات_التالفة.xlsx`
      );
      message.success("تم تصدير التقرير بنجاح");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      message.error("حدث خطأ أثناء تصدير التقرير");
    }
  };

  const handleSearch = async (page = 1) => {
    const payload = {
      passportNumber: formData.passportNumber || "",
      officeId: isSupervisor ? profile.officeId : selectedOffice || null,
      governorateId: isSupervisor ? profile.governorateId : selectedGovernorate || null,
      damagedTypeId: formData.damagedTypeId || null,
      startDate: formData.startDate ? formatToISO(formData.startDate, false) : null,
      endDate: formData.endDate ? formatToISO(formData.endDate, true) : null,
      PaginationParams: {
        PageNumber: page,
        PageSize: pageSize,
      },
    };

    await fetchPassports(payload);
  };

  const handleReset = async () => {
    setFormData({
      passportNumber: "",
      damagedTypeId: null,
      startDate: null,
      endDate: null,
    });
    setCurrentPage(1);
    if (!isSupervisor) {
      setSelectedGovernorate(null);
      setSelectedOffice(null);
      setOffices([]);
    }

    const payload = {
      passportNumber: "",
      officeId: isSupervisor ? profile.officeId : null,
      governorateId: isSupervisor ? profile.governorateId : null,
      damagedTypeId: null,
      startDate: null,
      endDate: null,
      PaginationParams: {
        PageNumber: 1,
        PageSize: pageSize,
      },
    };

    await fetchPassports(payload);
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
      passportNumber: "",
      officeId: isSupervisor ? profile.officeId : null,
      governorateId: isSupervisor ? profile.governorateId : null,
      damagedTypeId: null,
      startDate: null,
      endDate: null,
      PaginationParams: {
        PageNumber: 1,
        PageSize: pageSize,
      },
    };

    fetchPassports(initialPayload);
  }, [isSupervisor, profile.officeId, profile.governorateId]);

  // Table columns
  const columns = [
    {
      title: "تاريخ الانشاء",
      dataIndex: "datecreated",
      key: "datecreated",
      className: "table-column-date",
      render: (text) => {
        const date = new Date(text);
        return isNaN(date.getTime())
          ? "تاريخ غير صالح"
          : date.toLocaleDateString("en-CA");
      },
    },
    {
      title: "تاريخ التلف",
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
          <div
            className={`supervisor-passport-dameged-filters ${
              searchVisible ? "animate-show" : "animate-hide"
            }`}
          >
            <form className="supervisor-passport-dameged-form">
              <div className="filter-field">
                <label>المحافظة</label>
                <Select
                  className="filter-dropdown"
                  value={selectedGovernorate || undefined}
                  onChange={handleGovernorateChange}
                  disabled={isSupervisor}
                >
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
                    setFormData((prev) => ({
                      ...prev,
                      passportNumber: e.target.value,
                    }))
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
                    setFormData((prev) => ({
                      ...prev,
                      damagedTypeId: value,
                    }))
                  }
                >
                  {damageTypes.map((damageType) => (
                    <Option key={damageType.id} value={damageType.id}>
                      {damageType.name}
                    </Option>
                  ))}
                </Select>
              </div>

              <div className="filter-field">
                <label>التاريخ من</label>
                <DatePicker
                  placeholder="اختر التاريخ"
                  onChange={(date) =>
                    setFormData((prev) => ({ ...prev, startDate: date }))
                  }
                  value={formData.startDate}
                  className="supervisor-passport-dameged-input"
                  style={{ width: "100%" }}
                />
              </div>

              <div className="filter-field">
                <label>التاريخ إلى</label>
                <DatePicker
                  placeholder="اختر التاريخ"
                  onChange={(date) =>
                    setFormData((prev) => ({ ...prev, endDate: date }))
                  }
                  value={formData.endDate}
                  className="supervisor-passport-dameged-input"
                  style={{ width: "100%" }}
                />
              </div>

              <div className="supervisor-device-filter-buttons">
                <Button
                  onClick={() => handleSearch(1)}
                  className="supervisor-passport-dameged-button"
                >
                  البحث
                </Button>
                <Button
                  onClick={handleReset}
                  className="supervisor-passport-dameged-button"
                >
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

                {roles.includes("SuperAdmin") && (
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
                    ارسال ايميل 
                    <Icons type="email" />
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
                  onChange: (page) => {
                    setCurrentPage(page);
                    handleSearch(page);
                  },
                  showTotal: (total, range) => (
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
        title="اختر تاريخ التقرير"
        visible={isEmailModalVisible}
        onOk={handleEmailReportOk}
        onCancel={handleEmailModalCancel}
        okText="ارسال"
        cancelText="إلغاء"
        confirmLoading={isEmailLoading} // Displays loading spinner on the OK button
      >
        <DatePicker
          placeholder="اختر تاريخ التقرير"
          onChange={(date) => setEmailReportDate(date)}
          value={emailReportDate}
          style={{ width: "100%" }}
        />
      </Modal>
    </div>
  );
}
