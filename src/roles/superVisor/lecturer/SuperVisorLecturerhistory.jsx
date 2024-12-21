import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Table, message, Button } from "antd";
import { Link } from "react-router-dom";
import TextFieldForm from "./../../../reusable elements/ReuseAbleTextField.jsx";
import "./SuperVisorLecturerhistory.css";
import useAuthStore from "./../../../store/store"; // Import sidebar state for dynamic class handling
import axios from "axios";
import Url from "./../../../store/url.js"; // Assuming URL is imported for the API

const SuperVisorLecturerhistory = () => {
  const { isSidebarCollapsed } = useAuthStore(); // Access sidebar collapse state
  const [lectures, setLectures] = useState([]); // State to hold fetched lectures
  const [totalLectures, setTotalLectures] = useState(0); // Total number of lectures from API
  const [currentPage, setCurrentPage] = useState(1); // Current page for pagination
  const { accessToken } = useAuthStore(); // Fetch the accessToken from your auth store
  const pageSize = 10; // Page size set to 10

  const { searchVisible, toggleSearch } = useAuthStore(); // Search visibility state from store

  // Fetching lectures when component mounts or when the page number changes
  useEffect(() => {
    const fetchLectures = async () => {
      try {
        const response = await axios.get(`${Url}/api/Lecture`, {
          params: {
            PageSize: pageSize,
            PageNumber: currentPage,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        // Check if response contains the correct data
        if (response.data && response.headers.pagination) {
          setLectures(response.data); // Set the fetched data to state
          // Extract pagination details from the response headers
          const pagination = JSON.parse(response.headers.pagination);
          setTotalLectures(pagination.totalItems || 0); // Set the total lectures count from the headers
        }
      } catch (error) {
        console.error("Error fetching lectures:", error);
        message.error("حدث خطأ أثناء جلب المحاضرات");
      }
    };

    fetchLectures(); // Fetch lectures when page changes
  }, [currentPage, accessToken]); // Fetch lectures when page changes

  const handlePageChange = (page) => {
    setCurrentPage(page); // Update current page when page changes
  };

  const fields = [
    {
      name: "عنوان المحضر",
      label: "عنوان المحضر",
      placeholder: "",
      type: "dropdown",
      options: [
        { value: "عنوان رقم 1", label: "عنوان رقم 1" },
        { value: "عنوان رقم 2", label: "عنوان رقم 2" },
        { value: "عنوان رقم 3", label: "عنوان رقم 3" },
      ],
    },
    {
      name: "date",
      label: "التاريخ",
      placeholder: "اختر التاريخ",
      type: "date",
      id: "date",
    },
  ];

  const handleFilterSubmit = (formData) => {
    setFilterData(formData);

    const filteredLectures = lectures.filter((generalInfo) => {
      const matchesTitle =
        !formData["عنوان المحضر"] ||
        generalInfo["عنوان المحضر"] === formData["عنوان المحضر"];
      const matchesDate =
        !formData["date"] || generalInfo["التاريخ"].includes(formData["date"]);

      return matchesTitle && matchesDate;
    });

    if (filteredLectures.length === 0) {
      message.warning("لا توجد نتائج تطابق الفلاتر المحددة");
    }

    setLectures(filteredLectures);
  };

  const handleReset = () => {
    setFilterData({});
    setLectures(lectures); // Reset to original data
    message.success("تم إعادة تعيين الفلاتر بنجاح");
  };

  const columns = [
    {
      title: "عنوان المحاضرة",
      dataIndex: "title", // Assuming the field returned by the API is "title"
      key: "Lectur",
      className: "table-column-Lecturer-address",
    },
    {
      title: "التاريخ",
      dataIndex: "date", // Assuming the field returned by the API is "date"
      key: "date",
      className: "table-column-date",
      render: (text) => new Date(text).toLocaleDateString("ar-EG"), // Format the date for display
    },
    {
      title: "التفاصيل",
      key: "details",
      className: "table-column-details",
      render: (_, record) => (
        <Link
          to=""
          state={{ Lectur: record }}
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
      {/* Page Title */}
      <h1 className="supervisor-Lectur-title">المحاضر</h1>

      {/* Filter Form */}
      <div
        className={`supervisor-Lectur-filters ${
          searchVisible ? "animate-show" : "animate-hide"
        }`}>
        <TextFieldForm
          fields={fields}
          onFormSubmit={handleFilterSubmit}
          onReset={handleReset}
          formClassName="supervisor-Lectur-form"
          inputClassName="supervisor-Lectur-input"
          dropdownClassName="supervisor-Lectur-dropdown"
          fieldWrapperClassName="supervisor-Lectur-field-wrapper"
          buttonClassName="supervisor-Lectur-button"
        />
        {/* Add Lecturer button */}
        <Link to="/supervisor/lecturerAdd/supervisorlecturerAdd">
          <button className="supervisor-Lectur-button">اضافة محضر جديد</button>
        </Link>
      </div>

      {/* Lecturer table */}
      <div className="toggle-search-button">
        <Button type="primary" onClick={toggleSearch}>
          {searchVisible ? "بحث" : "بحث"}
        </Button>
      </div>
      <div className="supervisor-Lectur-table-container">
        <Table
          dataSource={lectures}
          columns={columns}
          rowKey="id" // Assuming the ID of each lecture is "id"
          bordered
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalLectures,
            position: ["bottomCenter"],
            onChange: handlePageChange, // Handle page change
          }}
          locale={{ emptyText: "لا توجد بيانات" }}
          className="supervisor-Lectur-table"
        />
      </div>
    </div>
  );
};

export default SuperVisorLecturerhistory;
