import "./SuperVisorDevice.css";
import useAuthStore from "./../../../store/store";
import React, { useState, useEffect } from "react";
import { Table, message, Button, Select, DatePicker, Input } from "antd";
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
  const [serialNumber, setSerialNumber] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const { searchVisible, toggleSearch } = useAuthStore();

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
        // console.log("Device Types Response:", deviceTypeResponse.data);
        setDeviceTypes(deviceTypeResponse.data);
        setDamagedTypes(damagedTypeResponse.data);
      } catch (error) {
        console.error(
          "Error fetching dropdown data:",
          error.response?.data || error.message
        );
        message.error("حدث خطأ أثناء جلب بيانات القائمة المنسدلة");
      }
    };

    fetchDropdownData();
  }, [accessToken]);

  useEffect(() => {
    if (profile) {
      fetchDevices({
        DeviceTypeId: null,
        SerialNumber: "",
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

  const fetchDevices = async (filters) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${Url}/api/DamagedDevice/office/${profile.officeId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Devices Response:", response.data);
      setDevicesList(response.data);

      if (response.data.length === 0) {
        message.warning("لا توجد نتائج تطابق الفلاتر المحددة");
      }
    } catch (error) {
      console.error(
        "Error fetching devices:",
        error.response?.data || error.message
      );
      message.error("حدث خطأ أثناء البحث");
    } finally {
      setLoading(false);
    }
  };
  const formatToISO = (date) => {
    if (!date) return "";
    const parsedDate = new Date(date);
    return parsedDate.toISOString();
  };
  const handleSearch = async () => {
    const body = {
      DeviceTypeId: deviceTypeId || null,
      SerialNumber: serialNumber || "",
      damagedTypeId: damagedTypeId || null,
      startDate: startDate ? formatToISO(startDate) : null,
      endDate: endDate ? formatToISO(endDate) : null,
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
    setSerialNumber("");
    setStartDate(null);
    setEndDate(null);

    const body = {
      DeviceTypeId: null,
      SerialNumber: "",
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
    console.log("Reset Payload:", body);
    fetchDevices(body);
    message.success("تم إعادة تعيين الفلاتر بنجاح");
  };

  const columns = [
    {
      title: "serial number",
      dataIndex: "serialNumber",
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
      render: (text) => text.split("T")[0],
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
          {console.log("record", record)}
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
          <label>الرقم التسلسلي</label>
          <Input
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            placeholder="أدخل الرقم التسلسلي"
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
          <Button onClick={handleSearch}>البحث</Button>
          <Button onClick={handleReset} style={{ marginLeft: "10px" }}>
            إعادة التعيين
          </Button>
        </div>

        <Link to="/supervisor/damegedDevices/add">
          <Button
            type="primary"
            className="supervisor-devices-dameged-add-button">
            اضافة جهاز تالف
          </Button>
        </Link>
      </div>
      <div className="toggle-search-button">
        <Button onClick={toggleSearch}>{searchVisible ? "بحث" : "بحث"}</Button>
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
