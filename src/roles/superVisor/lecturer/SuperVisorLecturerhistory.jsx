import React, { useState, useEffect, useCallback } from "react";
import { Table, message, Button } from "antd";
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
  } = useAuthStore();
  const [lectures, setLectures] = useState([]);
  const [totalLectures, setTotalLectures] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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
      const response = await axios.get(`${Url}/api/Lecture`, {
        params: {
          PageNumber: 1,
          PageSize: pageSize,
        },
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
  }, [accessToken, pageSize]);

  useEffect(() => {
    fetchInitialLectures();
  }, [fetchInitialLectures]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    const payload = {
      title: filterData.title,
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
    document.getElementById("title").value = "";
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";
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
        return date.toLocaleDateString("ar-EG"); //this means Arabic-Egypt
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
            <label htmlFor="title" className="supervisor-Lectur-label">
              عنوان المحضر
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className="supervisor-Lectur-input"
              placeholder=""
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
        <Link to="/supervisor/lecturerAdd/supervisorlecturerAdd">
          <button className="supervisor-add-Lectur-button">
            اضافة محضر جديد +
          </button>
        </Link>
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
