import "./SuperVisorDevice.css";
import useAuthStore from "./../../../store/store";
import React, { useState, useEffect } from "react";
import { Table, message, Button, Select, DatePicker } from "antd";
import { Link } from "react-router-dom";
import axios from "axios";
import Url from "./../../../store/url";

const { Option } = Select;

export default function SuperVisorDevices() {
  const { isSidebarCollapsed, accessToken, profile } = useAuthStore();
  const [devicesList, setDevicesList] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [damagedTypes, setDamagedTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deviceTypeId, setDeviceTypeId] = useState(null);
  const [damagedTypeId, setDamagedTypeId] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const { searchVisible, toggleSearch } = useAuthStore();

  // Helper function to format dates to ISO without UTC offset
  function formatToLocalISOString(date) {
    if (!(date instanceof Date)) date = new Date(date); // Ensure it's a Date object
    if (!date) return null;
    const offset = date.getTimezoneOffset() * 60000; // Convert minutes to milliseconds
    const localDate = new Date(date.getTime() - offset); // Adjust to local time
    return localDate.toISOString().slice(0, 19); // Remove the timezone offset ('Z')
  }

  // Fetch dropdown options for device type and damaged type
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [deviceTypeResponse, damagedTypeResponse] = await Promise.all([
          axios.get(`${Url}/api/devicetype`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get(`${Url}/api/damageddevicetype/all`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        setDeviceTypes(deviceTypeResponse.data);
        setDamagedTypes(damagedTypeResponse.data);
      } catch (error) {
        console.error("Error fetching dropdown data:", error.response?.data || error.message);
        message.error("حدث خطأ أثناء جلب بيانات القائمة المنسدلة");
      }
    };

    fetchDropdownData();
  }, [accessToken]);

  // Fetch initial device list based on user's office and governorate ID
  useEffect(() => {
    if (profile) {
      fetchDevices({
        DeviceTypeId: null,
        damagedTypeId: null,
        startDate: null,
        endDate: null,
        officeId: profile.officeId,
        governorateId: profile.governorateId,
        PaginationParams: {
          PageNumber: 1,
          PageSize: 10,
        },
      });
    }
  }, [profile]);

  // Function to fetch devices based on filter parameters
  const fetchDevices = async (filters) => {
    try {
      setLoading(true);
      const response = await axios.post(`${Url}/api/DamagedDevice/search`, filters, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      setDevicesList(response.data);

      if (response.data.length === 0) {
        message.warning("لا توجد نتائج تطابق الفلاتر المحددة");
      }
    } catch (error) {
      console.error("Error fetching devices:", error.response?.data || error.message);
      message.error("حدث خطأ أثناء البحث");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const body = {
      DeviceTypeId: deviceTypeId || undefined,
      damagedTypeId: damagedTypeId || undefined,
      startDate: startDate ? formatToLocalISOString(startDate) : null,
      endDate: endDate ? formatToLocalISOString(endDate) : null,
      officeId: profile?.officeId,
      governorateId: profile?.governorateId,
      PaginationParams: {
        PageNumber: 1,
        PageSize: 10,
      },
    };

    console.log("Search Payload:", body);

    fetchDevices(body);
  };

  const handleReset = async () => {
    setDeviceTypeId(null);
    setDamagedTypeId(null);
    setStartDate(null);
    setEndDate(null);

    const body = {
      DeviceTypeId: null,
      damagedTypeId: null,
      startDate: null,
      endDate: null,
      officeId: profile?.officeId,
      governorateId: profile?.governorateId,
      PaginationParams: {
        PageNumber: 1,
        PageSize: 10,
      },
    };

    fetchDevices(body);
    message.success("تم إعادة تعيين الفلاتر بنجاح");
  };

  const columns = [
    {
      title: "نوع الجهاز",
      dataIndex: "deviceTypeName",
      key: "deviceTypeName",
      className: "table-column-device-type",
    },
    {
      title: "سبب التلف",
      dataIndex: "damagedDeviceTypesName",
      key: "damagedDeviceTypesName",
      className: "table-column-damage-reason",
    },
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
      className: "table-column-date",
      render: (text) => text.split("T")[0], // Format date to YYYY-MM-DD
    },
    {
      title: "التفاصيل",
      key: "details",
      className: "table-column-details",
      render: (_, record) => (
        <Link
          to="/supervisor/damegedDevices/show"
          state={{ device: record }}
          className="supervisor-devices-dameged-details-link"
        >
          عرض
        </Link>
      ),
    },
  ];

  return (
    <div
      className={`supervisor-devices-dameged-page ${
        isSidebarCollapsed ? "sidebar-collapsed" : "supervisor-devices-dameged-page"
      }`}
      dir="rtl"
    >
      <h1 className="supervisor-devices-dameged-title">الأجهزة التالفة</h1>
      <div
        className={`supervisor-devices-dameged-filters ${searchVisible ? "animate-show" : "animate-hide"}`}
      >
        <div className="filter-field">
          <label>نوع الجهاز</label>
          <Select
            className="filter-dropdown"
            value={deviceTypeId}
            onChange={(value) => setDeviceTypeId(value)}
            allowClear
            placeholder="اختر نوع الجهاز"
          >
            {deviceTypes.map((type) => (
              <Option key={type.id} value={type.id}>
                {type.name}
              </Option>
            ))}
          </Select>
        </div>

        <div className="filter-field">
          <label>سبب التلف</label>
          <Select
            className="filter-dropdown"
            value={damagedTypeId}
            onChange={(value) => setDamagedTypeId(value)}
            allowClear
            placeholder="اختر سبب التلف"
          >
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
            onChange={(date) => setStartDate(date ? date.toDate() : null)}
            style={{ width: "100%" }}
            placeholder="اختر تاريخ البداية"
          />
        </div>

        <div className="filter-field">
          <label>تاريخ النهاية</label>
          <DatePicker
            onChange={(date) => setEndDate(date ? date.toDate() : null)}
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

        <Link to="/supervisor/damegedDevices/add">
          <Button className="supervisor-devices-dameged-add-button">
            اضافة جهاز تالف
          </Button>
        </Link>
      </div>
      <div className="toggle-search-button">
        <Button type="primary" onClick={toggleSearch}>
          {searchVisible ? " إخفاء البحث" : " إظهار البحث"}
        </Button>
      </div>
      <div className="supervisor-devices-dameged-table-container">
        <Table
          dataSource={devicesList}
          columns={columns}
          rowKey={(record) => record.id}
          bordered
          loading={loading}
          pagination={{
            pageSize: 15,
            position: ["bottomCenter"],
          }}
          locale={{ emptyText: "لا توجد بيانات" }}
          className="supervisor-devices-dameged-table"
        />
      </div>
    </div>
  );
}
