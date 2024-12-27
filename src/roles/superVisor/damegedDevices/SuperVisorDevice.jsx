import "./SuperVisorDevice.css";
import useAuthStore from "./../../../store/store"; // Custom store for user authentication and profile management
import usePermissionsStore from "./../../../store/permissionsStore"; // Store for managing permissions
import React, { useState, useEffect } from "react";
import { Table, message, Button, Select, DatePicker, Input } from "antd"; // Ant Design components
import { Link } from "react-router-dom";
import axios from "axios";
import Url from "./../../../store/url"; // Base URL for API endpoints

const { Option } = Select; // Ant Design Select options

export default function SuperVisorDevices() {
  const {
    roles,
    isSidebarCollapsed, // Determines if the sidebar is collapsed
    accessToken, // JWT access token for authenticated API requests
    profile, // User profile data, including office and governorate details
    searchVisible, // Tracks visibility of the search/filter panel
    toggleSearch, // Function to toggle the search panel visibility
  } = useAuthStore();

  const canCreate = usePermissionsStore((state) => state.canCreate);

  const [devicesList, setDevicesList] = useState([]); // Stores the list of damaged devices
  const [deviceTypes, setDeviceTypes] = useState([]); // List of available device types
  const [damagedTypes, setDamagedTypes] = useState([]); // List of damaged device reasons
  const [loading, setLoading] = useState(false); // Tracks loading state for the table
  const [deviceTypeId, setDeviceTypeId] = useState(null); // Selected device type for filtering
  const [damagedTypeId, setDamagedTypeId] = useState(null); // Selected damage reason for filtering
  const [startDate, setStartDate] = useState(null); // Selected start date for filtering
  const [endDate, setEndDate] = useState(null); // Selected end date for filtering
  const [serialDeviceNumber, setSerialDeviceNumber] = useState("");

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
        const [deviceTypeResponse, damagedTypeResponse] = await Promise.all([
          axios.get(`${Url}/api/devicetype`, {
            headers: { Authorization: `Bearer ${accessToken}` }, // Pass token for authentication
          }),
          axios.get(`${Url}/api/damageddevicetype/all`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        setDeviceTypes(deviceTypeResponse.data); // Set device types for dropdown
        setDamagedTypes(damagedTypeResponse.data); // Set damage types for dropdown
      } catch (error) {
        console.error(
          "Error fetching dropdown data:",
          error.response?.data || error.message
        );
        message.error("حدث خطأ أثناء جلب بيانات القائمة المنسدلة"); // Show error message in Arabic
      }
    };

    fetchDropdownData();
  }, [accessToken]);

  useEffect(() => {
    if (profile) {
      fetchDevices({
        SerialNumber: "", // No filtering by serial number initially
        DeviceTypeId: null, // No filtering by device type initially
        damagedTypeId: null, // No filtering by damage reason initially
        startDate: null, // No start date filter initially
        endDate: null, // No end date filter initially
        officeId: profile.officeId, // Filter by user's office
        governorateId: profile.governorateId, // Filter by user's governorate
        PaginationParams: {
          PageNumber: 1, // Start with the first page
          PageSize: 10, // Set default page size
        },
      });
    }
  }, [profile]);

  const fetchDevices = async (body) => {
    try {
      setLoading(true); // Show loading indicator
      const response = await axios.post(
        `${Url}/api/DamagedDevice/search`,
        body,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`, // Pass token for authentication
            "Content-Type": "application/json",
          },
        }
      );

      setDevicesList(response.data); // Update the devices list

      if (response.data.length === 0) {
        message.warning("لا توجد نتائج تطابق الفلاتر المحددة"); // Show warning if no results
      }
    } catch (error) {
      console.error(
        "Error fetching devices:",
        error.response?.data || error.message
      );
      message.error("حدث خطأ أثناء البحث"); // Show error in Arabic
    } finally {
      setLoading(false); // Hide loading indicator
    }
  };

  const handleSearch = async () => {
    const body = {
      SerialNumber: serialDeviceNumber || "",
      DeviceTypeId: deviceTypeId || undefined, // Use selected device type
      damagedTypeId: damagedTypeId || undefined, // Use selected damage reason
      startDate: startDate ? formatDateToISO(startDate) : null, // Format start date
      endDate: endDate ? formatDateToISO(endDate) : null, // Format end date
      officeId: profile?.officeId, // User's office ID
      governorateId: profile?.governorateId, // User's governorate ID
      PaginationParams: {
        PageNumber: 1, // Start with the first page
        PageSize: 10, // Default page size
      },
    };
    console.log(body);

    fetchDevices(body); // Fetch devices with the applied filters
  };

  const handleReset = async () => {
    setSerialDeviceNumber(null);
    setDeviceTypeId(null); // Reset device type filter
    setDamagedTypeId(null); // Reset damage reason filter
    setStartDate(null); // Reset start date filter
    setEndDate(null); // Reset end date filter

    fetchDevices({
      SerialNumber: "",
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
    });

    message.success("تم إعادة تعيين الفلاتر بنجاح"); // Show success message
  };

  const columns = [
    {
      title: "الرقم التسلسلي للجهاز",
      dataIndex: "serialNumber", // Corrected field name
      key: "serialNumber",
      className: "table-column-device-type",
    },
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
          state={{ id: record.id }}
          className="supervisor-devices-dameged-details-link">
          عرض
        </Link>
      ),
    },
  ];

  return (
    <div
      className={`supervisor-devices-dameged-page ${
        isSidebarCollapsed
          ? "sidebar-collapsed"
          : "supervisor-devices-dameged-page"
      }`}
      dir="rtl">
      <h1 className="supervisor-devices-dameged-title">الأجهزة التالفة</h1>

      <div
        className={`supervisor-devices-dameged-filters ${
          searchVisible ? "animate-show" : "animate-hide"
        }`}>
        <div className="filter-field">
          <label>الرقم التسلسلي للجهاز</label>
          <Input
            value={serialDeviceNumber}
            onChange={(e) => setSerialDeviceNumber(e.target.value)}
            placeholder="أدخل رقم التسلسلي للجهاز"
          />
        </div>
        <div className="filter-field">
          <label>نوع الجهاز</label>
          <Select
            className="filter-dropdown"
            value={deviceTypeId}
            onChange={(value) => setDeviceTypeId(value)}
            allowClear
            placeholder="اختر نوع الجهاز">
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

        <Link to="/supervisor/damegedDevices/add">
          <Button className="supervisor-devices-dameged-add-button">
            اضافة جهاز تالف
          </Button>
        </Link>
      </div>
      <div className="toggle-search-button">
        <Button type="primary" onClick={toggleSearch}>
          {searchVisible ? "بحث" : "بحث"}
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
