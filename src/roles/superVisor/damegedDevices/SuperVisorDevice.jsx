import React, { useState, useEffect, useCallback } from "react";
import { Table, message, Button, ConfigProvider } from "antd";
import { Link } from "react-router-dom";
import "./SuperVisorDevice.css";
import useAuthStore from "./../../../store/store";
import usePermissionsStore from "./../../../store/permissionsStore";
import axios from "axios";
import Url from "./../../../store/url.js";

const SuperVisorDevices = () => {
  const {
    isSidebarCollapsed,
    accessToken,
    profile,
    searchVisible,
    toggleSearch,
    roles,
  } = useAuthStore();

  const { hasAnyPermission } = usePermissionsStore();
  const hasCreatePermission = hasAnyPermission("create");
  const isSupervisor = roles.includes("Supervisor");

  // State setup
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

  // Date formatting helper
  const formatToISO = (date) => {
    if (!date) return null;
    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
  };

  // API calls and data fetching
  const fetchDevices = async (payload) => {
    try {
      const response = await axios.post(
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
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data) {
        setDevices(response.data);
        
        const paginationHeader = response.headers['pagination'];
        if (paginationHeader) {
          const paginationInfo = JSON.parse(paginationHeader);
          setTotalDevices(paginationInfo.totalItems);
        } else {
          setTotalDevices(response.data.length);
        }
      }
    } catch (error) {
      console.error('API Error:', error);
      message.error(
        `حدث خطأ أثناء جلب الأجهزة: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  // Event handlers
  const handleSearch = async (page = 1) => {
    const payload = {
      serialNumber: formData.serialNumber || "",
      officeId: isSupervisor ? profile.officeId : (selectedOffice || null),
      governorateId: isSupervisor ? profile.governorateId : (selectedGovernorate || null),
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReset = async () => {
    setFormData({ serialNumber: "", startDate: "", endDate: "" });
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

  const handleGovernorateChange = async (e) => {
    const governorateId = e.target.value;
    setSelectedGovernorate(governorateId);
    await fetchOffices(governorateId);
  };

  // Data fetching effects and callbacks
  const fetchGovernorates = useCallback(async () => {
    try {
      const response = await axios.get(`${Url}/api/Governorate/dropdown`, {
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
      const response = await axios.get(`${Url}/api/Governorate/dropdown/${governorateId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

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

  // Table columns configuration
  const columns = [
    {
      title: "التاريخ",
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
          to="/supervisor/devices/history/DeviceShow"
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
      className={`supervisor-devices-dameged-page ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl"
    >
      <h1 className="supervisor-devices-dameged-title">الأجهزة التالفة</h1>

      <div className="toggle-search-button">
        <Button type="primary" onClick={toggleSearch}>
          {searchVisible ? "اخفاء الحقول" : "اظهار الحقول"}
        </Button>
      </div>

      <div
        className={`supervisor-devices-dameged-filters ${
          searchVisible ? "animate-show" : "animate-hide"
        }`}
      >
        <form onSubmit={handleFormSubmit} className="supervisor-devices-dameged-form">
          <div className="supervisor-devices-dameged-field-wrapper">
            <label className="supervisor-devices-dameged-label">
              المحافظة
            </label>
            <select
              value={selectedGovernorate || ""}
              onChange={handleGovernorateChange}
              disabled={isSupervisor}
              className="supervisor-devices-dameged-dropdown"
            >
              <option value="">اختر المحافظة</option>
              {governorates.map((gov) => (
                <option key={gov.id} value={gov.id}>
                  {gov.name}
                </option>
              ))}
            </select>
          </div>

          <div className="supervisor-devices-dameged-field-wrapper">
            <label className="supervisor-devices-dameged-label">
              اسم المكتب
            </label>
            <select
              value={selectedOffice || ""}
              onChange={(e) => setSelectedOffice(e.target.value)}
              disabled={isSupervisor || !selectedGovernorate}
              className="supervisor-devices-dameged-dropdown"
            >
              <option value="">اختر المكتب</option>
              {offices.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.name}
                </option>
              ))}
            </select>
          </div>

          <div className="supervisor-devices-dameged-field-wrapper">
            <label className="supervisor-devices-dameged-label">
              الرقم التسلسلي
            </label>
            <input
              type="text"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleInputChange}
              className="supervisor-devices-dameged-input"
            />
          </div>

          <div className="supervisor-devices-dameged-field-wrapper">
            <label className="supervisor-devices-dameged-label">
              التاريخ من
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate || ""}
              onChange={handleInputChange}
              className="supervisor-devices-dameged-input"
            />
          </div>

          <div className="supervisor-devices-dameged-field-wrapper">
            <label className="supervisor-devices-dameged-label">
              التاريخ إلى
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate || ""}
              onChange={handleInputChange}
              className="supervisor-devices-dameged-input"
            />
          </div>

          <div className="supervisor-device-filter-buttons">
            <button type="submit" className="supervisor-devices-dameged-button">
              ابحث
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="supervisor-devices-dameged-button"
            >
              إعادة تعيين
            </button>
          </div>
        </form>

        {hasCreatePermission && (
          <Link to="/supervisor/deviceAdd/supervisordeviceAdd">
            <button className="supervisor-filter-buttons">
              اضافة جهاز جديد +
            </button>
          </Link>
        )}
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