import "./dammagedPasportsHistory.css";
import useAuthStore from "./../../../store/store";

import usePermissionsStore from "./../../../store/permissionsStore";

import React, { useState, useEffect } from "react";
import { Table, message, Button, Input, Select, DatePicker } from "antd";
import { Link } from "react-router-dom";
import axios from "axios";
import Url from "./../../../store/url";
import Lele from "./../../../reusable elements/icons.jsx";
const { Option } = Select;

export default function SuperVisorPassport() {

  const { isSidebarCollapsed, accessToken, profile, roles } = useAuthStore();
  const { hasAnyPermission } = usePermissionsStore();
  const hasCreatePermission = hasAnyPermission("create");

  const [passportList, setPassportList] = useState([]);
  const [damagedTypes, setDamagedTypes] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [passportNumber, setPassportNumber] = useState("");
  const [damagedTypeId, setDamagedTypeId] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const { searchVisible, toggleSearch } = useAuthStore();

  const isSupervisor = roles.includes("Supervisor");


  const formatDateToISO = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return new Date(
      Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
    ).toISOString();
  };

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [govResponse, officeResponse, damagedTypeResponse] = await Promise.all([
          axios.get(`${Url}/api/Governorate/dropdown`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get(`${Url}/api/Office/dropdown`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get(`${Url}/api/damagedtype/all`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        setGovernorates(govResponse.data);
        setOffices(officeResponse.data);
        setDamagedTypes(damagedTypeResponse.data);

        if (isSupervisor) {
          setSelectedGovernorate(profile.governorateId);
          setSelectedOffice(profile.officeId);
        }
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        message.error("حدث خطأ أثناء جلب بيانات القائمة المنسدلة");
      }
    };


    fetchDropdownData();
  }, [accessToken, isSupervisor, profile]);

  const handleSearch = async () => {
    const body = {
      passportNumber: passportNumber || "",
      damagedTypeId: damagedTypeId || null,
      startDate: startDate ? formatDateToISO(startDate) : null,
      endDate: endDate ? formatDateToISO(endDate) : null,
      officeId: isSupervisor ? profile.officeId : selectedOffice,
      governorateId: isSupervisor ? profile.governorateId : selectedGovernorate,
      profileId: isSupervisor ? profile.profileId : null,
      PaginationParams: {
        PageNumber: pagination.current,
        PageSize: pagination.pageSize,
      },
    };


    try {
      setLoading(true);
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
      const headers = response.headers;
      setPagination((prev) => ({
        ...prev,
        total: parseInt(headers["totalItems"], 10) || 0,
        pageSize: parseInt(headers["itemsPerPage"], 10) || 10,
      }));


      if (response.data.length === 0) {
        message.warning("لا توجد نتائج تطابق الفلاتر المحددة");
      }
    } catch (error) {
      console.error("Error fetching search results:", error.response?.data || error.message);
      message.error("حدث خطأ أثناء البحث");
    } finally {
      setLoading(false);
    }
  };


  const handleReset = () => {
    setPassportNumber("");
    setDamagedTypeId(null);
    setStartDate(null);
    setEndDate(null);
    if (!isSupervisor) {
      setSelectedGovernorate(null);
      setSelectedOffice(null);
    }
    handleSearch();
  };


  const handleTableChange = (paginationInfo) => {
    setPagination((prev) => ({
      ...prev,
      current: paginationInfo.current,
    }));

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
          <label>المحافظة</label>
          <Select
            className="filter-dropdown"
            value={selectedGovernorate}
            onChange={setSelectedGovernorate}
            disabled={isSupervisor}
            placeholder="اختر المحافظة">
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
            value={selectedOffice}
            onChange={setSelectedOffice}
            disabled={isSupervisor}
            placeholder="اختر المكتب">
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

          {hasCreatePermission && (
            <Link to="/supervisor/damagedpasportshistory/supervisordammagepasportadd">
              <Button className="supervisor-passport-dameged-add-button">
                اضافة جواز تالف +
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="toggle-search-button">
        <Button type="primary" onClick={toggleSearch}>
          {searchVisible ? "بحث" : "بحث"}
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

            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
          }}
          onChange={handleTableChange}
          locale={{ emptyText: "لا توجد بيانات" }}
          className="supervisor-passport-dameged-table"
        />
      </div>
    </div>
  );
}
