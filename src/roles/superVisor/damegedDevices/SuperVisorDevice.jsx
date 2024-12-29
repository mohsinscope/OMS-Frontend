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
  const [governorates, setGovernorates] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingOffices, setLoadingOffices] = useState(false);

  const [deviceTypeId, setDeviceTypeId] = useState(null);
  const [damagedTypeId, setDamagedTypeId] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [serialDeviceNumber, setSerialDeviceNumber] = useState("");
  const [selectedGovernorateId, setSelectedGovernorateId] = useState(null);
  const [selectedOfficeId, setSelectedOfficeId] = useState(null);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

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
        setLoading(true);
        const [governorateResponse, deviceTypeResponse, damagedTypeResponse] =
          await Promise.all([
            axios.get(`${Url}/api/Governorate/dropdown`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            }),
            axios.get(`${Url}/api/devicetype`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            }),
            axios.get(`${Url}/api/damageddevicetype/all`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            }),
          ]);

        setGovernorates(governorateResponse.data);
        setDeviceTypes(deviceTypeResponse.data);
        setDamagedTypes(damagedTypeResponse.data);
      } catch (error) {
        message.error("حدث خطأ أثناء جلب البيانات الأولية");
      } finally {
        setLoading(false);
      }
    };

    fetchDropdownData();
  }, [accessToken]);

  const handleGovernorateChange = async (value) => {
    try {
      setSelectedGovernorateId(value);
      setSelectedOfficeId(null);
      setOffices([]);

      if (!value) return;

      setLoadingOffices(true);
      const response = await axios.get(
        `${Url}/api/Governorate/dropdown/${value}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.data && response.data[0] && response.data[0].offices) {
        setOffices(response.data[0].offices);
        if (response.data[0].offices.length === 0) {
          message.info("لا توجد مكاتب متاحة لهذه المحافظة");
        }
      } else {
        message.info("لا توجد مكاتب متاحة لهذه المحافظة");
        setOffices([]);
      }
    } catch (error) {
      message.error("حدث خطأ أثناء جلب بيانات المكاتب");
    } finally {
      setLoadingOffices(false);
    }
  };

  const fetchDevices = async (body, page = 1) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${Url}/api/DamagedDevice/search`,
        {
          ...body,
          PaginationParams: {
            PageNumber: page,
            PageSize: pagination.pageSize,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      setDevicesList(response.data);
      setPagination((prev) => ({
        ...prev,
        current: page,
        total: response.headers["x-pagination-total-count"] || 0,
      }));

      if (response.data.length === 0) {
        message.warning("لا توجد نتائج تطابق الفلاتر المحددة");
      }
    } catch (error) {
      message.error("حدث خطأ أثناء البحث");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDevices = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${Url}/api/DamagedDevice?PageNumber=${page}&PageSize=${pagination.pageSize}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      // Extract pagination info from the headers
      const paginationHeader = response.headers["pagination"];
      if (paginationHeader) {
        const paginationInfo = JSON.parse(paginationHeader);
        setPagination({
          current: paginationInfo.currentPage,
          pageSize: paginationInfo.itemsPerPage,
          total: paginationInfo.totalItems,
        });
      }

      setDevicesList(response.data);

      if (response.data.length === 0) {
        message.warning("لا توجد بيانات");
      }
    } catch (error) {
      message.error("حدث خطأ أثناء جلب البيانات");
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = (page = 1) => {
    const body = {
      SerialNumber: serialDeviceNumber || "",
      DeviceTypeId: deviceTypeId || null,
      DamagedDeviceTypeId: damagedTypeId || null,
      startDate: startDate ? formatDateToISO(startDate) : null,
      endDate: endDate ? formatDateToISO(endDate) : null,
      governorateId: selectedGovernorateId || null,
      officeId: selectedOfficeId || null,
    };

    fetchDevices(body, page);
  };

  useEffect(() => {
    fetchAllDevices();
  }, []);

  const handleReset = () => {
    setSerialDeviceNumber("");
    setDeviceTypeId(null);
    setDamagedTypeId(null);
    setStartDate(null);
    setEndDate(null);
    setSelectedGovernorateId(null);
    setSelectedOfficeId(null);
    setOffices([]);
    fetchAllDevices();
  };

  const handleTableChange = (pagination) => {
    const { current } = pagination;
    handleSearch(current);
  };

  const columns = [
    {
      title: "الرقم التسلسلي للجهاز",
      dataIndex: "serialNumber",
      key: "serialNumber",
    },
    {
      title: "نوع الجهاز",
      dataIndex: "deviceTypeName",
      key: "deviceTypeName",
    },
    {
      title: "سبب التلف",
      dataIndex: "damagedDeviceTypesName",
      key: "damagedDeviceTypesName",
    },
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
      render: (text) => text.split("T")[0],
    },
    {
      title: "التفاصيل",
      key: "details",
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
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl">
      <h1 className="supervisor-passport-dameged-title">الأجهزة التالفة</h1>

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
          <label>اسم المحافظة</label>
          <Select
            className="filter-dropdown"
            value={selectedGovernorateId}
            onChange={handleGovernorateChange}
            allowClear
            loading={loading}>
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
            value={selectedOfficeId}
            onChange={(value) => setSelectedOfficeId(value)}
            allowClear
            loading={loadingOffices}>
            {offices.map((office) => (
              <Option key={office.id} value={office.id}>
                {office.name}
              </Option>
            ))}
          </Select>
        </div>

        <div className="filter-field">
          <label>الرقم التسلسلي للجهاز</label>
          <Input
            value={serialDeviceNumber}
            onChange={(e) => setSerialDeviceNumber(e.target.value)}
          />
        </div>

        <div className="filter-field">
          <label>نوع الجهاز</label>
          <Select
            className="filter-dropdown"
            value={deviceTypeId}
            onChange={(value) => setDeviceTypeId(value)}
            allowClear>
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
            allowClear>
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

        <div className="supervisor-device-filter-buttons">
          <Button type="primary" onClick={() => handleSearch(1)}>
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
              position: ["bottomCenter"],
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: handleTableChange,
            }}
            locale={{ emptyText: "لا توجد بيانات" }}
            className="supervisor-passport-dameged-table"
          />
        </ConfigProvider>
      </div>
    </div>
  );
}
