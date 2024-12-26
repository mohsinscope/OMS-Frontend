import "./SuperVisorDevice.css";
import useAuthStore from "./../../../store/store"; // Custom store for user authentication and profile management
import usePermissionsStore from "./../../../store/permissionsStore"; // Store for managing permissions
import React, { useState, useEffect } from "react";
import { Table, message, Button, Select, DatePicker } from "antd"; // Ant Design components
import { Link } from "react-router-dom";
import axios from "axios";
import Url from "./../../../store/url"; // Base URL for API endpoints
import { use } from "react";

const { Option } = Select; // Ant Design Select options

export default function SuperVisorDevices() {
  // Global state values from the authentication store
  const {
    roles,
    isSidebarCollapsed, // Determines if the sidebar is collapsed
    accessToken, // JWT access token for authenticated API requests
    profile, // User profile data, including office and governorate details
    searchVisible, // Tracks visibility of the search/filter panel
    toggleSearch, // Function to toggle the search panel visibility
  } = useAuthStore();
  // Permission store: Check if the user has the "create" permission for devices
  const canCreate = usePermissionsStore((state) => state.canCreate);

  // Local state variables for managing device data, dropdowns, and filters
  const [devicesList, setDevicesList] = useState([]); // Stores the list of damaged devices
  const [deviceTypes, setDeviceTypes] = useState([]); // List of available device types
  const [damagedTypes, setDamagedTypes] = useState([]); // List of damaged device reasons
  const [loading, setLoading] = useState(false); // Tracks loading state for the table
  const [deviceTypeId, setDeviceTypeId] = useState(null); // Selected device type for filtering
  const [damagedTypeId, setDamagedTypeId] = useState(null); // Selected damage reason for filtering
  const [startDate, setStartDate] = useState(null); // Selected start date for filtering
  const [endDate, setEndDate] = useState(null); // Selected end date for filtering
  // **Helper Function**: Convert date to local ISO format without UTC offset
  const formatToLocalISOString = (date) => {
    if (!(date instanceof Date)) date = new Date(date); // Ensure input is a Date object
    if (!date) return null; // Return null if date is invalid
    const offset = date.getTimezoneOffset() * 60000; // Convert timezone offset to milliseconds
    const localDate = new Date(date.getTime() - offset); // Adjust date to local time
    return localDate.toISOString().slice(0, 19); // Return ISO format (without timezone offset)
  };

  // **Effect**: Fetch dropdown options for device type and damage reasons
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

  // **Effect**: Fetch initial list of devices based on user's office and governorate
  useEffect(() => {
    if (profile) {
      console.log(profile);
      fetchDevices({
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

  // **Function**: Fetch the devices based on the applied filters
  const fetchDevices = async (body) => {
    try {
      setLoading(true); // Show loading indicator
      let response;

      if (roles === "Supervisor") {
        response = await axios.get(
          `${Url}/api/DamagedDevice/office/${profile.officeId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`, // Pass token for authentication
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        response = await axios.get(`${Url}/api/DamagedDevice`, {
          headers: {
            Authorization: `Bearer ${accessToken}`, // Pass token for authentication
            "Content-Type": "application/json",
          },
        });
      }

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

  // **Function**: Handle search/filtering
  const handleSearch = async () => {
    const body = {
      DeviceTypeId: deviceTypeId || undefined, // Use selected device type
      damagedTypeId: damagedTypeId || undefined, // Use selected damage reason
      startDate: startDate ? formatToLocalISOString(startDate) : null, // Format start date
      endDate: endDate ? formatToLocalISOString(endDate) : null, // Format end date
      officeId: profile?.officeId, // User's office ID
      governorateId: profile?.governorateId, // User's governorate ID
      PaginationParams: {
        PageNumber: 1, // Start with the first page
        PageSize: 10, // Default page size
      },
    };

    fetchDevices(body); // Fetch devices with the applied filters
  };

  // **Function**: Reset filters and fetch all devices
  const handleReset = async () => {
    setDeviceTypeId(null); // Reset device type filter
    setDamagedTypeId(null); // Reset damage reason filter
    setStartDate(null); // Reset start date filter
    setEndDate(null); // Reset end date filter

    fetchDevices({
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

  // **Table Columns**: Define columns for the Ant Design table
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

        <div className="filter-buttons">
          <Button type="primary" onClick={handleSearch}>
            البحث
          </Button>
          <Button onClick={handleReset} style={{ marginLeft: "10px" }}>
            إعادة التعيين
          </Button>
        </div>

        {/* Conditionally render the create button if the user has the "create" permission */}

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
