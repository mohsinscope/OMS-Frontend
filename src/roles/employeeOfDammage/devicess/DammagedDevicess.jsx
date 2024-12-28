import React, { useState, useEffect } from "react";
import "./DammagedDevicess.css";
import { Table, message, Button } from "antd";
import { Link } from "react-router-dom";
import useAuthStore from "./../../../store/store.js";
import axios from "axios";
import Url from "./../../../store/url.js";

export default function DammagedDevicess() {
  const { isSidebarCollapsed } = useAuthStore();
  const [damagedDevices, setDamagedDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [offices, setOffices] = useState([]);
  const [damageDeviceTypes, setDamageDeviceTypes] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [govResponse, officeResponse, damageTypeResponse, deviceTypeResponse] = await Promise.all([
          axios.get(`${Url}/api/Governorate/dropdown`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }),
          axios.get(`${Url}/api/Office/dropdown`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }),
          axios.get(`${Url}/api/damageddevicetype/all`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }),
          axios.get(`${Url}/api/devicetype`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }),
        ]);
        setGovernorates(govResponse.data);
        setOffices(officeResponse.data);
        setDamageDeviceTypes(damageTypeResponse.data);
        setDeviceTypes(deviceTypeResponse.data);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        message.error("حدث خطأ أثناء تحميل بيانات الفلاتر");
      }
    };

    fetchDropdownData();
  }, []);

  useEffect(() => {
    const fetchDamagedDevices = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${Url}/api/DamagedDevice?PageNumber=1&PageSize=10`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setDamagedDevices(response.data);
        setFilteredDevices(response.data);
      } catch (error) {
        console.error("Error fetching damaged devices:", error);
        message.error("حدث خطأ أثناء تحميل البيانات");
      } finally {
        setLoading(false);
      }
    };

    fetchDamagedDevices();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  const handleFilterSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    const startDate = formData.get("startDate")
      ? `${formData.get("startDate")}T12:00:00Z`
      : null;
    const endDate = formData.get("endDate")
      ? `${formData.get("endDate")}T12:00:00Z`
      : null;

    const payload = {
      DeviceTypeId: formData.get("deviceType") || null,
      officeId: formData.get("office") || null,
      governorateId: formData.get("governorate") || null,
      damageTypeId: formData.get("damageDeviceType") || null,
      startDate,
      endDate,
      PaginationParams: {
        PageNumber: 1,
        PageSize: 10,
      },
    };

    try {
      setLoading(true);
      const response = await axios.post(`${Url}/api/DamagedDevice/search`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      setFilteredDevices(response.data);
      if (response.data.length === 0) {
        message.warning("لا توجد نتائج تطابق الفلاتر المحددة");
      }
    } catch (error) {
      console.error("Error applying filters:", error);
      message.error("حدث خطأ أثناء تطبيق الفلاتر");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    document.getElementById("filter-form").reset();
    setFilteredDevices(damagedDevices);
    message.success("تم إعادة تعيين الفلاتر بنجاح");
  };

  const columns = [
    {
      title: "رقم الجهاز",
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
      render: (text) => formatDate(text),
    },
    {
      title: "المحافظة",
      dataIndex: "governorateName",
      key: "governorateName",
    },
    {
      title: "اسم المكتب",
      dataIndex: "officeName",
      key: "officeName",
    },
    {
      title: "التفاصيل",
      key: "details",
      render: (_, record) => (
        <Link
          to="/supervisor/damegedDevices/show"
          state={{ id: record.id }}
          className="damaged-devices-details-link">
          عرض
        </Link>
      ),
    },
  ];

  return (
    <div
      className={`damaged-devices-page ${
        isSidebarCollapsed ? "sidebar-collapsed" : "damaged-devices-page"
      }`}
      dir="rtl">
      <h1 className="damaged-devices-title">الأجهزة التالفة</h1>

      <form id="filter-form" className="damaged-devices-form" onSubmit={handleFilterSubmit}>
        <div className="field-wrapper">
          <label htmlFor="damageDeviceType">سبب التلف</label>
          <select name="damageDeviceType" id="damageDeviceType" className="damaged-devices-dropdown">
            <option value=""></option>
            {damageDeviceTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field-wrapper">
          <label htmlFor="deviceType">نوع الجهاز</label>
          <select name="deviceType" id="deviceType" className="damaged-devices-dropdown">
            <option value=""></option>
            {deviceTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field-wrapper">
          <label htmlFor="governorate">اسم المحافظة</label>
          <select name="governorate" id="governorate" className="damaged-devices-dropdown">
            <option value=""></option>
            {governorates.map((gov) => (
              <option key={gov.id} value={gov.id}>
                {gov.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field-wrapper">
          <label htmlFor="office">اسم المكتب</label>
          <select name="office" id="office" className="damaged-devices-dropdown">
            <option value=""></option>
            {offices.map((office) => (
              <option key={office.id} value={office.id}>
                {office.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field-wrapper">
          <label htmlFor="startDate">من التاريخ</label>
          <input
            type="date"
            name="startDate"
            id="startDate"
            className="damaged-devices-date-picker"
            required
          />
        </div>
        <div className="field-wrapper">
          <label htmlFor="endDate">إلى التاريخ</label>
          <input
            type="date"
            name="endDate"
            id="endDate"
            className="damaged-devices-date-picker"
            required
          />
        </div>
        <div className="field-wrapper">
          <Button type="primary" htmlType="submit">
            تطبيق
          </Button>
          <Button style={{ marginLeft: "10px" }} onClick={handleReset}>
            إعادة تعيين
          </Button>
        </div>
      </form>

      <div className="damaged-devices-table-container">
        <Table
          dataSource={filteredDevices}
          columns={columns}
          rowKey={(record) => record.id}
          bordered
          loading={loading}
          pagination={{ pageSize: 15 }}
          locale={{ emptyText: "لا توجد بيانات" }}
          className="damaged-devices-table"
        />
      </div>
    </div>
  );
}
