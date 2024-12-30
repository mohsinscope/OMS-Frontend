import "./dammagedPasportsHistory.css";
import useAuthStore from "./../../../store/store";
import usePermissionsStore from "./../../../store/permissionsStore";
import React, { useState, useEffect } from "react";
import {
  Table,
  message,
  Button,
  Input,
  Select,
  DatePicker,
  ConfigProvider,
} from "antd";
import { Link } from "react-router-dom";
import axios from "axios";
import Url from "./../../../store/url";
const { Option } = Select;

export default function SuperVisorPassport() {
  const { isSidebarCollapsed, accessToken, profile, roles } = useAuthStore();
  const { hasAnyPermission } = usePermissionsStore();
  const hasCreatePermission = hasAnyPermission("create");

  // State management
  const [passportList, setPassportList] = useState([]);
  const [damagedTypes, setDamagedTypes] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPassports, setTotalPassports] = useState(0);
  const pageSize = 10;

  // Filter states
  const [passportNumber, setPassportNumber] = useState("");
  const [damagedTypeId, setDamagedTypeId] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);

  const { searchVisible, toggleSearch } = useAuthStore();
  const isSupervisor = roles.includes("Supervisor");

  const formatDateToISO = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return new Date(
      Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
    ).toISOString();
  };

  const handleSearch = async (page = 1) => {
    const body = {
      passportNumber: passportNumber || "",
      damagedTypeId: damagedTypeId || null,
      startDate: startDate ? formatDateToISO(startDate) : null,
      endDate: endDate ? formatDateToISO(endDate) : null,
      officeId: isSupervisor ? profile.officeId : (selectedOffice || null),
      governorateId: isSupervisor ? profile.governorateId : (selectedGovernorate || null),
      profileId: isSupervisor ? profile.profileId : null,
      PaginationParams: {
        PageNumber: page,
        PageSize: pageSize,
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
      
      const paginationHeader = response.headers['pagination'];
      if (paginationHeader) {
        const paginationInfo = JSON.parse(paginationHeader);
        setTotalPassports(paginationInfo.totalItems);
      } else {
        setTotalPassports(response.data.length);
      }

    } catch (error) {
      console.error(
        "Error fetching search results:",
        error.response?.data || error.message
      );
      message.error("حدث خطأ أثناء البحث");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setPassportNumber("");
    setDamagedTypeId(null);
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
    
    if (!isSupervisor) {
      setSelectedGovernorate(null);
      setSelectedOffice(null);
    }

    const body = {
      passportNumber: "",
      damagedTypeId: null,
      startDate: null,
      endDate: null,
      officeId: isSupervisor ? profile.officeId : null,
      governorateId: isSupervisor ? profile.governorateId : null,
      profileId: isSupervisor ? profile.profileId : null,
      PaginationParams: {
        PageNumber: 1,
        PageSize: pageSize,
      },
    };

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
      
      const paginationHeader = response.headers['pagination'];
      if (paginationHeader) {
        const paginationInfo = JSON.parse(paginationHeader);
        setTotalPassports(paginationInfo.totalItems);
      } else {
        setTotalPassports(response.data.length);
      }

      message.success("تم إعادة تعيين الفلاتر بنجاح");
    } catch (error) {
      message.error("حدث خطأ أثناء إعادة التعيين");
    }
  };

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [govResponse, officeResponse, damagedTypeResponse] =
          await Promise.all([
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

  useEffect(() => {
    const initialPayload = {
      passportNumber: "",
      damagedTypeId: null,
      startDate: null,
      endDate: null,
      officeId: isSupervisor ? profile.officeId : null,
      governorateId: isSupervisor ? profile.governorateId : null,
      profileId: isSupervisor ? profile.profileId : null,
      PaginationParams: {
        PageNumber: 1,
        PageSize: pageSize,
      },
    };

    handleSearch();
  }, [isSupervisor, profile.officeId, profile.governorateId]);

  const columns = [
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
      className: "table-column-date",
      render: (text) => new Date(text).toLocaleDateString("en-CA"),
    },
    {
      title: "المحافظة",
      dataIndex: "governorateName",
      key: "governorateName",
    },
    {
      title: "المكتب",
      dataIndex: "officeName",
      key: "officeName",
    },
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
      <div className="toggle-search-button">
        <Button type="primary" onClick={toggleSearch}>
          {searchVisible ? "اِخفاء الحقول" : "اِظهار الحقول"}
        </Button>
      </div>
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
            disabled={isSupervisor}>
            <Option value="">اختر المحافظة</Option>
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
            disabled={isSupervisor}>
            <Option value="">اختر المكتب</Option>
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
          />
        </div>

        <div className="filter-field">
          <label>سبب التلف</label>
          <Select
            className="filter-dropdown"
            value={damagedTypeId}
            onChange={(value) => setDamagedTypeId(value)}
            allowClear>
            <Option value="">اختر السبب</Option>
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
          />
        </div>

        <div className="filter-field">
          <label>تاريخ النهاية</label>
          <DatePicker
            onChange={(date) => setEndDate(date)}
            style={{ width: "100%" }}
          />
        </div>

        <div className="supervisor-damaged-passport-filter-buttons">
          <Button type="primary" onClick={() => handleSearch(1)}>
            البحث
          </Button>
          <Button type="primary" onClick={handleReset}>
            إعادة التعيين
          </Button>

          {hasCreatePermission && (
            <Link to="/supervisor/damagedpasportshistory/supervisordammagepasportadd">
              <Button
                type="primary"
                className="supervisor-passport-dameged-add-button">
                اضافة جواز تالف +
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="supervisor-passport-dameged-table-container">
        <ConfigProvider direction="rtl">
          <Table
            dataSource={passportList}
            columns={columns}
            rowKey={(record) => record.id}
            bordered
            loading={loading}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: totalPassports,
              position: ["bottomCenter"],
              onChange: (page) => {
                setCurrentPage(page);
                handleSearch(page);
              },
            }}
            locale={{ emptyText: "لا توجد بيانات" }}
            className="supervisor-passport-dameged-table"
          />
        </ConfigProvider>
      </div>
    </div>
  );
}