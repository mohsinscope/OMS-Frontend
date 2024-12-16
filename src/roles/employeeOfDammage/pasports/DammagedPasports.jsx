import React, { useState, useEffect } from "react";
import { Table, message } from "antd"; // Import Ant Design components
import { Link } from "react-router-dom"; // Import Link for navigation
import TextFieldForm from "./../../../reusable elements/ReuseAbleTextField.jsx"; // Reusable form component
import useAuthStore from "./../../../store/store"; // Import sidebar state for dynamic class handling
import axios from "axios"; // For API calls
import Url from "./../../../store/url.js"; // API base URL
import './DammagedPasports.css';
export default function DammagedDevices() {
  const { isSidebarCollapsed } = useAuthStore(); // Access sidebar collapse state
  const [devicesList, setDevicesList] = useState([]); // State for devices
  const [filteredDevices, setFilteredDevices] = useState([]); // State for filtered devices
  const [loading, setLoading] = useState(false); // State for loading spinner

  // Filter fields
  const fields = [
    {
      name: "سبب التلف",
      label: "سبب التلف",
      placeholder: "",
      type: "dropdown",
      options: [
        { value: "خلل مصنعي", label: "خلل مصنعي" },
        { value: "حرق", label: "حرق" },
        { value: "تلف داخلي", label: "تلف داخلي" },
      ],
    },
    {
      name: "نوع الجهاز",
      label: "نوع الجهاز",
      placeholder: "",
      type: "dropdown",
      options: [
        { value: "Lenovo", label: "Lenovo" },
        { value: "Scanner", label: "Scanner" },
      ],
    },
    {
      name: "date",
      label: "التاريخ",
      placeholder: "اختر التاريخ",
      type: "date",
      id: "date",
    },
  ];

  // Fetch data on page load
  useEffect(() => {
    const fetchDamagedDevices = async () => {
      setLoading(true); // Start loading spinner
      try {
        const response = await axios.get(`${Url}/api/DamagedPassport`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Authorization header
          },
        });
        setDevicesList(response.data);
        setFilteredDevices(response.data); // Initially, filtered devices match all devices
      } catch (error) {
        console.error("Error fetching devices:", error);
        message.error("حدث خطأ أثناء تحميل البيانات");
      } finally {
        setLoading(false); // Stop loading spinner
      }
    };

    fetchDamagedDevices();
  }, []);

  const handleFilterSubmit = (formData) => {
    // Filter devices based on the form data
    const filtered = devicesList.filter((device) => {
      const matchesReason =
        !formData["سبب التلف"] || device.damageReason === formData["سبب التلف"];
      const matchesType =
        !formData["نوع الجهاز"] || device.deviceTypeName === formData["نوع الجهاز"];
      const matchesDate =
        !formData["date"] || device.date.startsWith(formData["date"]);

      return matchesReason && matchesType && matchesDate;
    });

    if (filtered.length === 0) {
      message.warning("لا توجد نتائج تطابق الفلاتر المحددة");
    }

    setFilteredDevices(filtered);
  };

  const handleReset = () => {
    // Reset filters and display all devices
    setFilteredDevices(devicesList);
    message.success("تم إعادة تعيين الفلاتر بنجاح");
  };

  // Table columns
  const columns = [
    {
      title: "رقم الجهاز",
      dataIndex: "serialNumber",
      key: "serialNumber",
      className: "table-column-serial-number",
    },
    {
      title: "نوع الجهاز",
      dataIndex: "deviceTypeName",
      key: "deviceTypeName",
      className: "table-column-device-type",
    },
    {
      title: "سبب التلف",
      dataIndex: "damageReason",
      key: "damageReason",
      className: "table-column-damage-reason",
    },
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
      className: "table-column-date",
    },
    {
      title: "التفاصيل",
      key: "details",
      className: "table-column-details",
      render: (_, record) => (
        <Link
          to="/damaged-devices/details"
          state={{ device: record }}
          className="damaged-devices-details-link"
        >
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
      dir="rtl"
    >
      {/* Page Title */}
      <h1 className="damaged-devices-title">الأجهزة التالفة</h1>

      {/* Filter Form */}
      <div className="damaged-devices-filters">
        <TextFieldForm
          fields={fields}
          onFormSubmit={handleFilterSubmit}
          onReset={handleReset}
          formClassName="damaged-devices-form"
          inputClassName="damaged-devices-input"
          dropdownClassName="damaged-devices-dropdown"
          fieldWrapperClassName="damaged-devices-field-wrapper"
          buttonClassName="damaged-devices-button"
        />
    
      </div>

      {/* Devices Table */}
      <div className="damaged-devices-table-container">
        <Table
          dataSource={filteredDevices}
          columns={columns}
          rowKey={(record) => record.serialNumber} // Ensure unique row key
          bordered
          pagination={{ pageSize: 15 }}
          locale={{ emptyText: "لا توجد بيانات" }}
          loading={loading}
          className="damaged-devices-table"
        />
      </div>
    </div>
  );
}
