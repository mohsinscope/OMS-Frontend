import React, { useState, useEffect, useCallback } from "react";
import { Table, message, Button, ConfigProvider, DatePicker, Select, Input } from "antd";
import { Link } from "react-router-dom";
import "./SuperVisorLecturerhistory.css";
import useAuthStore from "./../../../store/store";
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
    permissions,
  } = useAuthStore();

  // Check permissions
  const hasCreatePermission = permissions.includes("Lc");
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
    return date.toISOString();
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
      console.error("API Error:", error);
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
      const response = await axios.get(
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
    const initialPayload = {
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

    fetchLectures(initialPayload);
  }, [isSupervisor, profile.officeId, profile.governorateId]);

  useEffect(() => {
    fetchGovernorates();
  }, [fetchGovernorates]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    handleSearch(page);
  };

  const handleGovernorateChange = async (value) => {
    setSelectedGovernorate(value);
    await fetchOffices(value);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  const handleInputChange = (value) => {
    setFormData(prev => ({
      ...prev,
      title: value
    }));
  };

  const handleReset = async () => {
    setFormData({ title: "", startDate: null, endDate: null });
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
        return isNaN(date.getTime())
          ? "تاريخ غير صالح"
          : date.toLocaleDateString("en-CA");
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

      <div
        className={`supervisor-Lectur-filters ${
          searchVisible ? "animate-show" : "animate-hide"
        }`}>
        <form onSubmit={handleFormSubmit} className="supervisor-Lectur-form">
          <div className="supervisor-Lectur-field-wrapper">
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

          <div className="supervisor-Lectur-field-wrapper">
            <label htmlFor="office" className="supervisor-Lectur-label">
              اسم المكتب
            </label>
            <Select
              id="office"
              value={selectedOffice || undefined}
              onChange={(value) => setSelectedOffice(value)}
              disabled={isSupervisor || !selectedGovernorate}
              className="supervisor-Lectur-select"
              placeholder="اختر المكتب"
              >
              {offices.map((office) => (
                <Select.Option key={office.id} value={office.id}>
                  {office.name}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div className="supervisor-Lectur-field-wrapper">
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

          <div className="supervisor-Lectur-field-wrapper">
            <label htmlFor="startDate" className="supervisor-Lectur-label">
              التاريخ من
            </label>
            <DatePicker
              id="startDate"
              placeholder="اختر التاريخ"
              onChange={(date) => handleDateChange(date, 'startDate')}
              value={formData.startDate}
              className="supervisor-Lectur-input"
              style={{ width: '100%' }}
            />
          </div>

          <div className="supervisor-Lectur-field-wrapper">
            <label htmlFor="endDate" className="supervisor-Lectur-label">
              التاريخ إلى
            </label>
            <DatePicker
              id="endDate"
              placeholder="اختر التاريخ"
              onChange={(date) => handleDateChange(date, 'endDate')}
              value={formData.endDate}
              className="supervisor-Lectur-input"
              style={{ width: '100%' }}
            />
          </div>

          <div className="supervisor-Lectur-buttons">
            <Button type="primary" htmlType="submit" className="supervisor-Lectur-button">
              ابحث
            </Button>
            <Button
              onClick={handleReset}
              className="supervisor-Lectur-button">
              إعادة تعيين
            </Button>
          </div>
          {hasCreatePermission && (
            <Link to="/supervisor/lecturerAdd/supervisorlecturerAdd">
              <Button type="primary" className="supervisor-add-Lectur-button">
                اضافة محضر جديد +
              </Button>
            </Link>
          )}
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