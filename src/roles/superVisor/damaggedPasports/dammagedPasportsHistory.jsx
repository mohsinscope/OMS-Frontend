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
} from "antd";
import { Link } from "react-router-dom";
import axiosInstance from "./../../../intercepters/axiosInstance.js";
import Url from "./../../../store/url.js";

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
  const isSupervisor = roles.includes("Supervisor");

  // State management
  const [passportList, setPassportList] = useState([]);
  const [totalPassports, setTotalPassports] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [governorates, setGovernorates] = useState([]);
  const [offices, setOffices] = useState([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [formData, setFormData] = useState({
    passportNumber: "",
    damagedTypeId: null,
    startDate: null,
    endDate: null,
  });

  // Formatting dates to ISO
  const formatToISO = (date) => {
    if (!date) return null;
    return date.toISOString();
  };

  // Fetch damaged passports
  const fetchPassports = async (payload) => {
    try {
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
      }
    } catch (error) {
      console.error("API Error:", error);
      message.error(
        `حدث خطأ أثناء جلب البيانات: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  // Event handlers
  const handleSearch = async (page = 1) => {
    const payload = {
      passportNumber: formData.passportNumber || "",
      officeId: isSupervisor ? profile.officeId : selectedOffice || null,
      governorateId: isSupervisor
        ? profile.governorateId
        : selectedGovernorate || null,
      damagedTypeId: formData.damagedTypeId || null,
      startDate: formData.startDate ? formatToISO(formData.startDate) : null,
      endDate: formData.endDate ? formatToISO(formData.endDate) : null,
      PaginationParams: {
        PageNumber: page,
        PageSize: pageSize,
      },
    };

    await fetchPassports(payload);
  };

  const handleReset = async () => {
    setFormData({ passportNumber: "", damagedTypeId: null, startDate: null, endDate: null });
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
    setSelectedOffice(null); // Clear the selected office when governorate changes
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
      title: "رقم الجواز",
      dataIndex: "passportNumber",
      key: "passportNumber",
      className: "table-column-serial-number",
    },
    {
      title: "التفاصيل",
      key: "details",
      className: "table-column-details",
      render: (_, record) => (
        <Link
          to="DammagedPasportsShow"
          state={{ id: record.id }}
          className="supervisor-passport-dameged-details-link">
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
      <h1 className="supervisor-passport-dameged-title">الجوازات التالفة</h1>

      <div
        className={`supervisor-passport-dameged-filters ${
          searchVisible ? "animate-show" : "animate-hide"
        }`}>
        <form className="supervisor-passport-dameged-form">
          <div className="filter-field">
            <label>المحافظة</label>
            <Select
              className="filter-dropdown"
              value={selectedGovernorate || undefined}
              onChange={handleGovernorateChange}
              disabled={isSupervisor}>
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
              disabled={isSupervisor || !selectedGovernorate}>
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

          <div className="supervisor-damaged-passport-filter-buttons">
            <Button
              type="primary"
              onClick={() => handleSearch(1)}
              className="supervisor-passport-dameged-button">
              البحث
            </Button>
            <Button
              onClick={handleReset}
              className="supervisor-passport-dameged-button">
              إعادة تعيين
            </Button>

            {hasCreatePermission && (
              <Link to="/supervisor/damagedpasportshistory/supervisordammagepasportadd">
                <Button
                  type="primary"
                  className="supervisor-passport-dameged-add-button">
                  اضافة جواز تالف +
                </Button>
              </Link>
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
              position: ["bottomCenter"],
              onChange: (page) => {
                setCurrentPage(page);
                handleSearch(page);
              },
            }}
            locale={{ emptyText: "لا توجد بيانات" }}
            className="supervisor-passport-dameged-table"
          />
        </ConfigProvider>
      </div>
    </div>
  );
}
