import React, { useState, useEffect, useCallback } from "react";
import { Table, message, Button, ConfigProvider } from "antd";
import { Link } from "react-router-dom";
import "./SuperVisorLecturerhistory.css";
import useAuthStore from "./../../../store/store";
import usePermissionsStore from "./../../../store/permissionsStore";
import axios from "axios";
import Url from "./../../../store/url.js";

const SuperVisorLecturerhistory = () => {
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

  const [lectures, setLectures] = useState([]);
  const [totalLectures, setTotalLectures] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [governorates, setGovernorates] = useState([]);
  const [offices, setOffices] = useState([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    startDate: null,
    endDate: null,
  });

  const formatToISO = (date) => {
    if (!date) return null;
    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime()) ? null : parsedDate.toISOString();
  };

  const fetchLectures = async (payload) => {
    try {
      const response = await axios.post(
        `${Url}/api/Lecture/search`,
        {
          title: payload.title || "",
          officeId: payload.officeId || null,
          governorateId: payload.governorateId || null,
          startDate: payload.startDate || null,
          endDate: payload.endDate || null,
          PaginationParams: {
            PageNumber: payload.PaginationParams.PageNumber,
            PageSize: payload.PaginationParams.PageSize
          }
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data) {
        setLectures(response.data);
        
        const paginationHeader = response.headers['pagination'];
        if (paginationHeader) {
          const paginationInfo = JSON.parse(paginationHeader);
          setTotalLectures(paginationInfo.totalItems);
        } else {
          setTotalLectures(response.data.length);
        }
      }
    } catch (error) {
      console.error('API Error:', error);
      message.error(
        `حدث خطأ أثناء جلب المحاضرات: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleSearch = async (page = 1) => {
    const payload = {
      title: formData.title || "",
      officeId: isSupervisor ? profile.officeId : (selectedOffice || null),
      governorateId: isSupervisor ? profile.governorateId : (selectedGovernorate || null),
      startDate: formData.startDate ? formatToISO(formData.startDate) : null,
      endDate: formData.endDate ? formatToISO(formData.endDate) : null,
      PaginationParams: {
        PageNumber: page,
        PageSize: pageSize,
      },
    };
    
    await fetchLectures(payload);
  };

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

  // Initial data load
  useEffect(() => {
    const initialPayload = {
      title: "",
      officeId: isSupervisor ? profile.officeId : null,
      governorateId: isSupervisor ? profile.governorateId : null,
      startDate: null,
      endDate: null,
      PaginationParams: {
        PageNumber: 1,
        PageSize: pageSize
      }
    };

    fetchLectures(initialPayload);
  }, [isSupervisor, profile.officeId, profile.governorateId]);

  useEffect(() => {
    fetchGovernorates();
  }, [fetchGovernorates]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    handleSearch(page);
  };

  const handleGovernorateChange = async (e) => {
    const governorateId = e.target.value;
    setSelectedGovernorate(governorateId);
    await fetchOffices(governorateId);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReset = async () => {
    setFormData({ title: "", startDate: "", endDate: "" });
    setCurrentPage(1);
    
    if (!isSupervisor) {
      setSelectedGovernorate(null);
      setSelectedOffice(null);
      setOffices([]);
    }
    
    const payload = {
      title: "",
      officeId: isSupervisor ? profile.officeId : null,
      governorateId: isSupervisor ? profile.governorateId : null,
      startDate: null,
      endDate: null,
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
      className: "table-column-Lecturer-address",
    },
    {
      title: "المكتب",
      dataIndex: "officeName",
      key: "officeName",
      className: "table-column-Lecturer-address",
    },
    {
      title: "عنوان المحضر",
      dataIndex: "title",
      key: "Lectur",
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
          className="supervisor-Lectur-details-link">
          عرض
        </Link>
      ),
    },
  ];

  return (
    <div
      className={`supervisor-Lectur-page ${
        isSidebarCollapsed ? "sidebar-collapsed" : "supervisor-Lectur-page"
      }`}
      dir="rtl">
      <h1 className="supervisor-Lectur-title">المحاضر</h1>

      <div className="toggle-search-button">
        <Button type="primary" onClick={toggleSearch}>
          {searchVisible ? "اخفاء الحقول" : "اظهار الحقول"}
        </Button>
      </div>

      <div
        className={`supervisor-Lectur-filters ${
          searchVisible ? "animate-show" : "animate-hide"
        }`}>
        <form onSubmit={handleFormSubmit} className="supervisor-Lectur-form">
          <div className="supervisor-Lectur-field-wrapper">
            <label htmlFor="governorate" className="supervisor-Lectur-label">
              المحافظة
            </label>
            <select
              id="governorate"
              value={selectedGovernorate || ""}
              onChange={handleGovernorateChange}
              disabled={isSupervisor}
              className="supervisor-Lectur-select">
              <option value="">اختر المحافظة</option>
              {governorates.map((gov) => (
                <option key={gov.id} value={gov.id}>
                  {gov.name}
                </option>
              ))}
            </select>
          </div>

          <div className="supervisor-Lectur-field-wrapper">
            <label htmlFor="office" className="supervisor-Lectur-label">
              اسم المكتب
            </label>
            <select
              id="office"
              value={selectedOffice || ""}
              onChange={(e) => setSelectedOffice(e.target.value)}
              disabled={isSupervisor || !selectedGovernorate}
              className="supervisor-Lectur-select">
              <option value="">اختر المكتب</option>
              {offices.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.name}
                </option>
              ))}
            </select>
          </div>

          <div className="supervisor-Lectur-field-wrapper">
            <label htmlFor="title" className="supervisor-Lectur-label">
              عنوان المحضر
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="supervisor-Lectur-input"
            />
          </div>

          <div className="supervisor-Lectur-field-wrapper">
            <label htmlFor="startDate" className="supervisor-Lectur-label">
              التاريخ من
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate || ""}
              onChange={handleInputChange}
              className="supervisor-Lectur-input"
            />
          </div>

          <div className="supervisor-Lectur-field-wrapper">
            <label htmlFor="endDate" className="supervisor-Lectur-label">
              التاريخ إلى
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate || ""}
              onChange={handleInputChange}
              className="supervisor-Lectur-input"
            />
          </div>

          <div className="supervisor-Lectur-buttons">
            <button type="submit" className="supervisor-Lectur-button">
              ابحث
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="supervisor-Lectur-button">
              إعادة تعيين
            </button>
          </div>
        </form>

        {hasCreatePermission && (
          <Link to="/supervisor/lecturerAdd/supervisorlecturerAdd">
            <button className="supervisor-add-Lectur-button">
              اضافة محضر جديد +
            </button>
          </Link>
        )}
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
              onChange: handlePageChange,
            }}
            locale={{ emptyText: "لا توجد بيانات" }}
            className="supervisor-Lectur-table"
          />
        </ConfigProvider>
      </div>
    </div>
  );
};

export default SuperVisorLecturerhistory;