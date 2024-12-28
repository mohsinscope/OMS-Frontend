import React, { useState, useEffect } from "react";
import { Table, message, ConfigProvider } from "antd";
import { Link } from "react-router-dom";
import useAuthStore from "./../../../store/store";
import axios from "axios";
import Url from "./../../../store/url.js";
import './DammagedPasports.css';

export default function DammagedPassports() {
  const { isSidebarCollapsed } = useAuthStore();
  const [passportsList, setPassportsList] = useState([]);
  const [filteredPassports, setFilteredPassports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, pageSize: 10, totalPages: 1, totalItems: 0 });
  const [filters, setFilters] = useState({
    officeId: "",
    governorateId: "",
    startDate: "",
    endDate: "",
    passportNumber: "",
    damagedTypeId: "",
  });
  const [damagedTypes, setDamagedTypes] = useState([]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [officesResponse, governoratesResponse, damagedTypesResponse] = await Promise.all([
          axios.get(`${Url}/api/Office/dropdown`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }),
          axios.get(`${Url}/api/Governorate/dropdown`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }),
          axios.get(`${Url}/api/damagedtype/all`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }),
        ]);
        setFilters((prev) => ({
          ...prev,
          offices: officesResponse.data.map(office => ({ value: office.id, label: office.name })),
          governorates: governoratesResponse.data.map(gov => ({ value: gov.id, label: gov.name })),
        }));
        setDamagedTypes(damagedTypesResponse.data.map(type => ({ value: type.id, label: type.name })));
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        message.error("حدث خطأ أثناء تحميل بيانات الفلاتر");
      }
    };

    fetchDropdownData();
    
    // Initial data fetch with reset payload
    const initialPayload = {
      passportNumber: "",
      damagedTypeId: null,
      startDate: null,
      endDate: null,
      officeId: null,
      governorateId: null,
      profileId: null,
      PaginationParams: {
        PageNumber: 1,
        PageSize: 10
      }
    };
    fetchFilteredPassports(initialPayload);
  }, []);

  const handleFilterSubmit = (event) => {
    event.preventDefault();
  
    const formData = new FormData(event.target);
    const payload = {
      passportNumber: formData.get("passportNumber") || "",
      damagedTypeId: formData.get("damagedTypeId") || null,
      startDate: formData.get("startDate") ? `${formData.get("startDate")}T00:00:00Z` : null,
      endDate: formData.get("endDate") ? `${formData.get("endDate")}T00:00:00Z` : null,
      officeId: formData.get("officeId") || null,
      governorateId: formData.get("governorateId") || null,
      profileId: null,
      PaginationParams: {
        PageNumber: 1,
        PageSize: 10
      },
    };
  
    fetchFilteredPassports(payload);
  };

  const fetchFilteredPassports = async (payload) => {
    try {
      setLoading(true);
      const response = await axios.post(`${Url}/api/DamagedPassport/search`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
  
      // Add unique index to each row
      const dataWithKeys = response.data.map((item, index) => ({
        ...item,
        uniqueKey: `${item.passportNumber}_${item.date}_${index}`
      }));
  
      setFilteredPassports(dataWithKeys);
  
      if (response.data.length === 0) {
        message.warning("لا توجد نتائج تطابق الفلاتر المحددة");
      }
  
      const paginationHeader = response.headers.pagination
        ? JSON.parse(response.headers.pagination)
        : {};
  
      setPagination({
        currentPage: paginationHeader.currentPage || 1,
        pageSize: 10,
        totalPages: paginationHeader.totalPages || 1,
        totalItems: paginationHeader.totalItems || 0,
      });
    } catch (error) {
      console.error("Error applying filters:", error);
      message.error("حدث خطأ أثناء تطبيق الفلاتر");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    // Reset form
    document.querySelector('.damaged-passports-form').reset();
    
    // Create reset payload with null values and fixed pagination
    const resetPayload = {
      passportNumber: "",
      damagedTypeId: null,
      startDate: null,
      endDate: null,
      officeId: null,
      governorateId: null,
      profileId: null,
      PaginationParams: {
        PageNumber: 1,
        PageSize: 10
      }
    };
    
    // Fetch data with reset payload
    fetchFilteredPassports(resetPayload);
    message.success("تم إعادة تعيين الفلاتر بنجاح");
  };

  const columns = [
    {
      title: "اسم المحافظة",
      dataIndex: "governorateName",
      key: "governorateName",
    },
    {
      title: "اسم المكتب",
      dataIndex: "officeName",
      key: "officeName",
    },
    {
      title: "رقم الجواز",
      dataIndex: "passportNumber",
      key: "passportNumber",
    },
    {
      title: "نوع التلف",
      dataIndex: "damagedTypeName",
      key: "damagedTypeName",
    },
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
      render: (text) => formatDate(text),
    },
    {
      title: "التفاصيل",
      key: "details",
      render: (_, record) => (
        <Link
          to="/supervisor/damagedpasportshistory/DammagedPasportsShow"
          state={{ id: record.id }}
          className="damaged-passports-details-link"
        >
          عرض
        </Link>
      ),
    },
  ];

  return (
    <div
      className={`damaged-passports-page ${
        isSidebarCollapsed ? "sidebar-collapsed" : "damaged-passports-page"
      }`}
      dir="rtl"
    >
      <h1 className="damaged-passports-title">الجوازات التالفة</h1>

      <form
        onSubmit={handleFilterSubmit}
        className="damaged-passports-form"
      >
        <div className="damaged-passports-field-wrapper">
          <label htmlFor="officeId" className="damaged-passports-label">
            اسم المكتب
          </label>
          <select
            id="officeId"
            name="officeId"
            className="damaged-passports-dropdown"
          >
            <option value="">اختر المكتب</option>
            {filters.offices &&
              filters.offices.map((office) => (
                <option key={office.value} value={office.value}>
                  {office.label}
                </option>
              ))}
          </select>
        </div>

        <div className="damaged-passports-field-wrapper">
          <label htmlFor="governorateId" className="damaged-passports-label">
            اسم المحافظة
          </label>
          <select
            id="governorateId"
            name="governorateId"
            className="damaged-passports-dropdown"
          >
            <option value="">اختر المحافظة</option>
            {filters.governorates &&
              filters.governorates.map((gov) => (
                <option key={gov.value} value={gov.value}>
                  {gov.label}
                </option>
              ))}
          </select>
        </div>

        <div className="damaged-passports-field-wrapper">
          <label htmlFor="passportNumber" className="damaged-passports-label">
            رقم الجواز
          </label>
          <input
            type="text"
            id="passportNumber"
            name="passportNumber"
            className="damaged-passports-input"
          />
        </div>

        <div className="damaged-passports-field-wrapper">
          <label htmlFor="damagedTypeId" className="damaged-passports-label">
            نوع التلف
          </label>
          <select
            id="damagedTypeId"
            name="damagedTypeId"
            className="damaged-passports-dropdown"
          >
            <option value="">اختر نوع التلف</option>
            {damagedTypes &&
              damagedTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
          </select>
        </div>

        <div className="damaged-passports-field-wrapper">
          <label htmlFor="startDate" className="damaged-passports-label">
            من التاريخ
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            className="damaged-passports-input"
          />
        </div>

        <div className="damaged-passports-field-wrapper">
          <label htmlFor="endDate" className="damaged-passports-label">
            إلى التاريخ
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            className="damaged-passports-input"
          />
        </div>

        <div className="damaged-passports-field-wrapper">
          <button type="submit" className="damaged-passports-button">
            تطبيق
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="damaged-passports-button"
          >
            إعادة تعيين
          </button>
        </div>
      </form>

      <div className="damaged-passports-table-container">
        <ConfigProvider direction="rtl">
          <Table
            dataSource={filteredPassports}
            columns={columns}
            rowKey={(record) => record.uniqueKey}
            bordered
            pagination={{
              current: pagination.currentPage,
              total: pagination.totalItems,
              pageSize: 10,
              onChange: (page) => {
                const formData = new FormData(document.querySelector('.damaged-passports-form'));
                const payload = {
                  passportNumber: formData.get("passportNumber") || "",
                  damagedTypeId: formData.get("damagedTypeId") || null,
                  startDate: formData.get("startDate") ? `${formData.get("startDate")}T00:00:00Z` : null,
                  endDate: formData.get("endDate") ? `${formData.get("endDate")}T00:00:00Z` : null,
                  officeId: formData.get("officeId") || null,
                  governorateId: formData.get("governorateId") || null,
                  profileId: null,
                  PaginationParams: {
                    PageNumber: page,
                    PageSize: 10
                  }
                };
                fetchFilteredPassports(payload);
              },
              position: ["bottomCenter"]
            }}
            locale={{ emptyText: "لا توجد بيانات" }}
            loading={loading}
            className="damaged-passports-table"
          />
        </ConfigProvider>
      </div>
    </div>
  );
}