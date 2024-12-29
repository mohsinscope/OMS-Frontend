import React, { useState, useEffect } from "react";
import {
  Table,
  message,
  Button,
  Select,
  DatePicker,
  Input,
  ConfigProvider,
} from "antd";
import { Link } from "react-router-dom";
import axios from "axios";
import Url from "./../../../store/url";
import useAuthStore from "./../../../store/store";
import usePermissionsStore from "./../../../store/permissionsStore";
import "./SuperVisorDevice.css";

const { Option } = Select;

export default function SuperVisorDevices() {
  const {
    roles,
    isSidebarCollapsed,
    accessToken,
    profile,
    searchVisible,
    toggleSearch,
  } = useAuthStore();

  const { hasAnyPermission } = usePermissionsStore();
  const hasCreatePermission = hasAnyPermission("create");

  const [devicesList, setDevicesList] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [damagedTypes, setDamagedTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deviceTypeId, setDeviceTypeId] = useState(null);
  const [damagedTypeId, setDamagedTypeId] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [serialDeviceNumber, setSerialDeviceNumber] = useState(""); // Updated variable
  const [governorateName, setGovernorateName] = useState("");
  const [officeName, setOfficeName] = useState("");

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
        const [
          governorateResponse,
          officeResponse,
          deviceTypeResponse,
          damagedTypeResponse,
        ] = await Promise.all([
          axios.get(`${Url}/api/Governorate/dropdown`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get(`${Url}/api/Office/dropdown`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get(`${Url}/api/devicetype`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get(`${Url}/api/damageddevicetype/all`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        const governorateData = governorateResponse.data.find(
          (item) => item.id === profile?.governorateId
        );
        const officeData = officeResponse.data.find(
          (item) => item.id === profile?.officeId
        );

        setGovernorateName(governorateData?.name || "غير معروف");
        setOfficeName(officeData?.name || "غير معروف");

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
  }, [accessToken, profile]);

  useEffect(() => {
    if (profile) {
      if (roles.includes("Supervisor")) {
        fetchDevices({
          SerialNumber: "",
          DeviceTypeId: null,
          damagedTypeId: null,
          startDate: null,
          endDate: null,
          officeId: profile.officeId,
          PaginationParams: {
            PageNumber: 1,
            PageSize: 10,
          },
        });
      } else {
        fetchAllDevices();
      }
    }
  }, [profile, roles]);

  const fetchDevices = async (body) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${Url}/api/DamagedDevice/search`,
        body,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

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

  const fetchAllDevices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${Url}/api/DamagedDevice?PageNumber=1&PageSize=10`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setDevicesList(response.data);

      if (response.data.length === 0) {
        message.warning("لا توجد بيانات");
      }
    } catch (error) {
      console.error(
        "Error fetching all devices:",
        error.response?.data || error.message
      );
      message.error("حدث خطأ أثناء جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    const body = {
      SerialNumber: serialDeviceNumber || "", // Corrected variable name
      DeviceTypeId: deviceTypeId || undefined,
      damagedTypeId: damagedTypeId || undefined,
      startDate: startDate ? formatDateToISO(startDate) : null,
      endDate: endDate ? formatDateToISO(endDate) : null,
      officeId: roles.includes("Supervisor") ? profile?.officeId : undefined,
      PaginationParams: {
        PageNumber: 1,
        PageSize: 10,
      },
    };

    if (roles.includes("Supervisor")) {
      fetchDevices(body);
    } else {
      fetchAllDevices();
    }
  };

  const handleReset = async () => {
    setSerialDeviceNumber(""); // Reset correctly
    setDeviceTypeId(null);
    setDamagedTypeId(null);
    setStartDate(null);
    setEndDate(null);

    if (roles.includes("Supervisor")) {
      fetchDevices({
        SerialNumber: "",
        DeviceTypeId: null,
        damagedTypeId: null,
        startDate: null,
        endDate: null,
        officeId: profile?.officeId,
        PaginationParams: {
          PageNumber: 1,
          PageSize: 10,
        },
      });
    } else {
      fetchAllDevices();
    }

    message.success("تم إعادة تعيين الفلاتر بنجاح");
  };

  const columns = [
    {
      title: "الرقم التسلسلي للجهاز",
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
      dataIndex: "damagedTypeName",
      key: "damagedTypeName",
      className: "table-column-damage",
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
          to="/damegedDevices/show"
          state={{ id: record.id }}
          className="supervisor-devices-dameged-details-link">
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
      <h1 className="supervisor-passport-dameged-title">الأجهزة التالفة</h1>
      <div className="toggle-search-button">
        <Button type="primary" onClick={toggleSearch}>
          {searchVisible ? "بحث" : "بحث"}
        </Button>
      </div>
      <div
        className={`supervisor-passport-dameged-filters ${
          searchVisible ? "animate-show" : "animate-hide"
        }`}>
        <div className="filter-field">
          <label>اسم المحافظة</label>
          <Input
            value={governorateName}
            disabled={roles.includes("Supervisor")}
            placeholder="اسم المحافظة"
          />
        </div>
        <div className="filter-field">
          <label>اسم المكتب</label>
          <Input
            value={officeName}
            disabled={roles.includes("Supervisor")}
            placeholder="اسم المكتب"
          />
        </div>
        <div className="filter-field">
          <label>الرقم التسلسلي للجهاز</label>
          <Input
            value={serialDeviceNumber} // Corrected variable name
            onChange={(e) => setSerialDeviceNumber(e.target.value)} // Corrected variable name
            placeholder="أدخل الرقم التسلسلي للجهاز"
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
        <div className="supervisor-device-filter-buttons">
          <Button type="primary" onClick={handleSearch}>
            البحث
          </Button>
          <Button
            type="primary"
            onClick={handleReset}
            style={{ marginLeft: "10px" }}>
            إعادة التعيين
          </Button>
          {hasCreatePermission && (
            <Link to="/damegedDevices/add">
              <Button type="primary" className="supervisor-filter-buttons">
                اضافة جهاز تالف +
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="supervisor-passport-dameged-table-container">
        <ConfigProvider direction="rtl">
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
            className="supervisor-passport-dameged-table"
          />
        </ConfigProvider>
      </div>
    </div>
  );
}
