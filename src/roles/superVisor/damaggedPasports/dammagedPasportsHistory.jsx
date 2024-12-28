import "./dammagedPasportsHistory.css";
import useAuthStore from "./../../../store/store";
import React, { useState, useEffect } from "react";
import { Table, message, Button, Input, Select, DatePicker } from "antd";
import { Link } from "react-router-dom";
import axios from "axios";
import Url from "./../../../store/url";
import Lele from "./../../../reusable elements/icons.jsx";
const { Option } = Select;

export default function SuperVisorPassport() {
  const {
    isSidebarCollapsed,
    accessToken,
    profile,
    roles,
    searchVisible,
    toggleSearch,
  } = useAuthStore();
  const [passportList, setPassportList] = useState([]);
  const [damagedTypes, setDamagedTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [passportNumber, setPassportNumber] = useState("");
  const [damagedTypeId, setDamagedTypeId] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
  });

  const formatDateToISO = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return new Date(
      Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
    ).toISOString();
  };

  useEffect(() => {
    const fetchDamagedTypes = async () => {
      try {
        const response = await axios.get(`${Url}/api/damagedtype/all`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setDamagedTypes(response.data);
      } catch (error) {
        console.error(
          "Error fetching damaged types:",
          error.response?.data || error.message
        );
        message.error("حدث خطأ أثناء جلب بيانات القائمة المنسدلة");
      }
    };

    const fetchInitialPassports = async () => {
      if (roles.includes("Supervisor")) {
        const body = {
          passportNumber: "",
          damagedTypeId: null,
          startDate: null,
          endDate: null,
          officeId: profile?.officeId,
          governorateId: profile?.governorateId,
          profileId: profile?.profileId,
          PaginationParams: {
            PageNumber: 1,
            PageSize: pagination.pageSize,
          },
        };
        fetchPassports(body);
      } else {
        fetchAllPassports();
      }
    };

    fetchDamagedTypes();
    fetchInitialPassports();
  }, [accessToken, profile, roles, pagination.pageSize]);

  const fetchPassports = async (body) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${Url}/api/DamagedPassport/search`,
        body,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const paginationHeader = response.headers.pagination
        ? JSON.parse(response.headers.pagination)
        : {};

      setPassportList(response.data);
      setPagination({
        currentPage: paginationHeader.currentPage || 1,
        pageSize: paginationHeader.pageSize || 10,
        totalItems: paginationHeader.totalItems || 0,
      });

      if (response.data.length === 0) {
        message.warning("لا توجد نتائج تطابق الفلاتر المحددة");
      }
    } catch (error) {
      console.error(
        "Error fetching passports:",
        error.response?.data || error.message
      );
      message.error("حدث خطأ أثناء البحث");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPassports = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${Url}/api/DamagedPassport/?PageNumber=${pagination.currentPage}&PageSize=${pagination.pageSize}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const paginationHeader = response.headers.pagination
        ? JSON.parse(response.headers.pagination)
        : {};

      setPassportList(response.data);
      setPagination({
        currentPage: paginationHeader.currentPage || 1,
        pageSize: paginationHeader.pageSize || 10,
        totalItems: paginationHeader.totalItems || 0,
      });
    } catch (error) {
      console.error(
        "Error fetching all passports:",
        error.response?.data || error.message
      );
      message.error("حدث خطأ أثناء جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (roles.includes("Supervisor")) {
      const body = {
        passportNumber: passportNumber || "",
        damagedTypeId: damagedTypeId || null,
        startDate: startDate ? formatDateToISO(startDate) : null,
        endDate: endDate ? formatDateToISO(endDate) : null,
        officeId: profile?.officeId,
        governorateId: profile?.governorateId,
        profileId: profile?.profileId,
        PaginationParams: {
          PageNumber: 1,
          PageSize: pagination.pageSize,
        },
      };
      fetchPassports(body);
    } else {
      fetchAllPassports();
    }
  };

  const handleReset = () => {
    setPassportNumber("");
    setDamagedTypeId(null);
    setStartDate(null);
    setEndDate(null);

    if (roles.includes("Supervisor")) {
      const body = {
        passportNumber: "",
        damagedTypeId: null,
        startDate: null,
        endDate: null,
        officeId: profile?.officeId,
        governorateId: profile?.governorateId,
        profileId: profile?.profileId,
        PaginationParams: {
          PageNumber: 1,
          PageSize: pagination.pageSize,
        },
      };
      fetchPassports(body);
    } else {
      fetchAllPassports();
    }
  };

  const columns = [
    {
      title: "رقم الجواز",
      dataIndex: "passportNumber",
      key: "passportNumber",
      className: "table-column-passport-number",
    },
    {
      title: "سبب التلف",
      dataIndex: "damagedTypeName",
      key: "damagedTypeName",
      className: "table-column-damage",
    },
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
      className: "table-column-date",
      render: (text) => new Date(text).toLocaleDateString("en-CA"),
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
        isSidebarCollapsed
          ? "sidebar-collapsed"
          : "supervisor-passport-dameged-page"
      }`}
      dir="rtl">
      <h1 className="supervisor-passport-dameged-title">الجوازات التالفة</h1>

      <div
        className={`supervisor-passport-dameged-filters ${
          searchVisible ? "animate-show" : "animate-hide"
        }`}>
        <div className="filter-field">
          <label>رقم الجواز</label>
          <Input
            value={passportNumber}
            onChange={(e) => setPassportNumber(e.target.value)}
            placeholder="أدخل رقم الجواز"
          />
        </div>

        <div className="filter-field">
          <label>سبب التلف</label>
          <Select
            className="filter-dropdown"
            value={damagedTypeId}
            onChange={(value) => setDamagedTypeId(value)}
            allowClear
            placeholder="اختر سبب التلف">
            {damagedTypes.map((type) => (
              <Option key={type.id} value={type.id}>
                {type.name}
              </Option>
            ))}
          </Select>
        </div>

        <div className="filter-field">
          <label>تاريخ البداية</label>
          <DatePicker
            onChange={(date) => setStartDate(date)}
            style={{ width: "100%" }}
            placeholder="اختر تاريخ البداية"
          />
        </div>

        <div className="filter-field">
          <label>تاريخ النهاية</label>
          <DatePicker
            onChange={(date) => setEndDate(date)}
            style={{ width: "100%" }}
            placeholder="اختر تاريخ النهاية"
          />
        </div>

        <div className="filter-buttons">
          <Button type="primary" onClick={handleSearch}>
            البحث
            <Lele type="search-icon" />
          </Button>
          <Button onClick={handleReset} style={{ marginLeft: "10px" }}>
            إعادة التعيين
          </Button>
        </div>

        <Link to="/supervisor/damagedpasportshistory/supervisordammagepasportadd">
          <Button className="supervisor-passport-dameged-add-button">
            اضافة جواز تالف +
          </Button>
        </Link>
      </div>

      <div className="toggle-search-button">
        <Button type="primary" onClick={toggleSearch}>
          {searchVisible ? "إخفاء الفلاتر" : "إظهار الفلاتر"}
        </Button>
      </div>

      <div className="supervisor-passport-dameged-table-container">
        <Table
          dataSource={passportList}
          columns={columns}
          rowKey={(record) => record.id}
          bordered
          loading={loading}
          pagination={{
            current: pagination.currentPage,
            pageSize: pagination.pageSize,
            total: pagination.totalItems,
            onChange: (page) => {
              if (roles.includes("Supervisor")) {
                const body = {
                  passportNumber: passportNumber || "",
                  damagedTypeId: damagedTypeId || null,
                  startDate: startDate ? formatDateToISO(startDate) : null,
                  endDate: endDate ? formatDateToISO(endDate) : null,
                  officeId: profile?.officeId,
                  governorateId: profile?.governorateId,
                  profileId: profile?.profileId,
                  PaginationParams: {
                    PageNumber: page,
                    PageSize: pagination.pageSize,
                  },
                };
                fetchPassports(body);
              } else {
                fetchAllPassports();
              }
            },
            position: ["bottomCenter"],
          }}
          locale={{ emptyText: "لا توجد بيانات" }}
          className="supervisor-passport-dameged-table"
        />
      </div>
    </div>
  );
}
