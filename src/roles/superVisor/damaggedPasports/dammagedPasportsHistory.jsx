import "./dammagedPasportsHistory.css";
import useAuthStore from "./../../../store/store"; // Import sidebar state for dynamic class handling
import React, { useState, useEffect } from "react";
import { Table, message, Button, Input, Select, DatePicker } from "antd"; // Import Ant Design components
import { Link } from "react-router-dom"; // Import Link
import axios from "axios";
import Url from "./../../../store/url";

const { Option } = Select;

export default function SuperVisorPassport() {
  const { isSidebarCollapsed, accessToken, profile } = useAuthStore(); // Access sidebar collapse state
  const [passportList, setPassportList] = useState([]);
  const [damagedTypes, setDamagedTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [passportNumber, setPassportNumber] = useState("");
  const [damagedTypeId, setDamagedTypeId] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const { searchVisible, toggleSearch } = useAuthStore(); // search visibility state from store

  // Helper function to format date to ISO string in UTC
  const formatDateToISO = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return new Date(
      Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
    ).toISOString();
  };

  // Fetch dropdown options for damaged types
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

    fetchDamagedTypes();
  }, [accessToken]);

  // Fetch initial passport list based on user's office and governorate ID
  useEffect(() => {
    if (profile) {
      fetchPassports({
        passportNumber: "",
        damagedTypeId: null,
        startDate: null,
        endDate: null,
        officeId: profile.officeId,
        governorateId: profile.governorateId,
        profileId: profile.profileId,
        PaginationParams: {
          PageNumber: 1,
          PageSize: 10,
        },
      });
    }
  }, [profile]);

  const fetchPassports = async (body) => {
    setLoading(true);
    console.log("Request Payload:", body); // Log payload for debugging
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
      setPassportList(response.data);
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

  const handleSearch = () => {
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
        PageSize: 10,
      },
    };

    console.log("Request Payload:", body); // Log payload for debugging
    fetchPassports(body);
  };

  const handleReset = () => {
    setPassportNumber("");
    setDamagedTypeId(null);
    setStartDate(null);
    setEndDate(null);

    fetchPassports({
      passportNumber: "",
      damagedTypeId: null,
      startDate: null,
      endDate: null,
      officeId: profile?.officeId,
      governorateId: profile?.governorateId,
      profileId: profile?.profileId,
      PaginationParams: {
        PageNumber: 1,
        PageSize: 10,
      },
    });
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
      render: (text) => new Date(text).toLocaleDateString("en-CA"), // Format date to "YYYY-MM-DD"
    },
    {
      title: "التفاصيل",
      key: "details",
      className: "table-column-details",
      render: (_, record) => (
        <Link
          to="DammagedPasportsShow"
          state={{ passport: record }}
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
          {searchVisible ? " إخفاء البحث" : " إظهار البحث"}
        </Button>
      </div>

      <div className="supervisor-passport-dameged-table-container">
        <Table
          dataSource={passportList}
          columns={columns}
          rowKey={(record) => record.id}
          bordered
          loading={loading}
          pagination={{ pageSize: 15, position: ["bottomCenter"] }}
          locale={{ emptyText: "لا توجد بيانات" }}
          className="supervisor-passport-dameged-table"
        />
      </div>
    </div>
  );
}
