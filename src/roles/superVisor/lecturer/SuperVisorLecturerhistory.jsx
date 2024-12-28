import React, { useState, useEffect, useCallback } from "react";
import { Table, message, Button } from "antd";
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

  const isSupervisor = roles.includes("Supervisor"); // Check if the user is a Supervisor

  const [lectures, setLectures] = useState([]);
  const [totalLectures, setTotalLectures] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [governorates, setGovernorates] = useState([]);
  const [offices, setOffices] = useState([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);

  const [filterData, setFilterData] = useState({
    title: "",
    startDate: "",
    endDate: "",
  });

  const formatToISO = (date) => {
    if (!date) return "";
    const parsedDate = new Date(date);
    return parsedDate.toISOString();
  };

  const fetchDropdownData = useCallback(async () => {
    try {
      const [govResponse, officeResponse] = await Promise.all([
        axios.get(`${Url}/api/Governorate/dropdown`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        axios.get(`${Url}/api/Office/dropdown`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      setGovernorates(govResponse.data);
      setOffices(officeResponse.data);

      if (isSupervisor) {
        setSelectedGovernorate(profile.governorateId);
        setSelectedOffice(profile.officeId);
      }
    } catch (error) {
      message.error("حدث خطأ أثناء جلب بيانات القائمة المنسدلة");
    }
  }, [accessToken, isSupervisor, profile]);

  const fetchLectures = useCallback(
    async (payload) => {
      try {
        const response = await axios.post(
          `${Url}/api/Lecture/search`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (response.data) {
          setLectures(response.data);
          setTotalLectures(response.data.length);
        }
      } catch (error) {
        message.error(
          `حدث خطأ أثناء جلب المحاضرات: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    },
    [accessToken]
  );

  const fetchInitialLectures = useCallback(async () => {
    try {
      const payload = {
        title: "",
        officeId: isSupervisor ? profile.officeId : selectedOffice,
        governorateId: isSupervisor ? profile.governorateId : selectedGovernorate,
        startDate: null,
        endDate: null,
        PaginationParams: {
          PageNumber: 1,
          PageSize: pageSize,
        },
      };

      const response = await axios.post(`${Url}/api/Lecture/search`, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.data) {
        setLectures(response.data);
        setTotalLectures(response.data.length);
      }
    } catch (error) {
      message.error(
        `حدث خطأ أثناء جلب المحاضرات: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }, [accessToken, pageSize, isSupervisor, profile, selectedGovernorate, selectedOffice]);

  useEffect(() => {
    fetchDropdownData();
    fetchInitialLectures();
  }, [fetchDropdownData, fetchInitialLectures]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    const payload = {
      title: filterData.title,
      officeId: isSupervisor ? profile.officeId : selectedOffice,
      governorateId: isSupervisor ? profile.governorateId : selectedGovernorate,
      startDate: formatToISO(filterData.startDate),
      endDate: formatToISO(filterData.endDate),
      PaginationParams: {
        PageNumber: page,
        PageSize: pageSize,
      },
    };
    fetchLectures(payload);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      title: formData.get("title") || "",
      officeId: isSupervisor ? profile.officeId : selectedOffice,
      governorateId: isSupervisor ? profile.governorateId : selectedGovernorate,
      startDate: formatToISO(formData.get("startDate")) || null,
      endDate: formatToISO(formData.get("endDate")) || null,
      PaginationParams: {
        PageNumber: 1,
        PageSize: pageSize,
      },
    };
    setCurrentPage(1);
    fetchLectures(payload);
  };

  const handleReset = async () => {
    setFilterData({ title: "", startDate: "", endDate: "" });
    setCurrentPage(1);
    setSelectedGovernorate(null);
    setSelectedOffice(null);
    fetchInitialLectures();
    message.success("تم إعادة تعيين الفلاتر بنجاح");
  };

  const columns = [
    {
      title: "عنوان المحضر",
      dataIndex: "title",
      key: "Lectur",
      className: "table-column-Lecturer-address",
    },
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
      className: "table-column-date",
      render: (text) => {
        const date = new Date(text);
        if (isNaN(date.getTime())) {
          return "تاريخ غير صالح";
        }
        return date.toLocaleDateString("ar-EG");
      },
    },
    {
      title: "التفاصيل",
      key: "details",
      className: "table-column-details",
      pagination: { pageSize: 10 },
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
              onChange={(e) => setSelectedGovernorate(e.target.value)}
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
              disabled={isSupervisor}
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

      <div className="toggle-search-button">
        <Button type="primary" onClick={toggleSearch}>
          {searchVisible ? "بحث" : "بحث"}
        </Button>
      </div>
      <div className="supervisor-Lectur-table-container">
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
      </div>
    </div>
  );
};

export default SuperVisorLecturerhistory;
