import React, { useState, useEffect } from "react";
import "./DammagedDevicess.css";
import { Table, message } from "antd";
import { Link } from "react-router-dom";
import TextFieldForm from "./../../../reusable elements/ReuseAbleTextField.jsx";
import useAuthStore from "./../../../store/store.js";
import axios from "axios";
import Url from "./../../../store/url.js";

export default function DammagedDevicess() {
  const { isSidebarCollapsed } = useAuthStore(); // Sidebar state from store
  const [damagedDevices, setDamagedDevices] = useState([]); // State for devices
  const [filteredDevices, setFilteredDevices] = useState([]); // State for filtered devices
  const [filterData, setFilterData] = useState({}); // State for applied filters
  const [loading, setLoading] = useState(false); // Loading spinner state

  const fields = [
    {
      name: "سبب التلف",
      label: "سبب التلف",
      placeholder: "",
      type: "dropdown",
      options: [
        { value: "البطارية", label: "البطارية" },
        { value: "حرق", label: "حرق" },
        { value: "الواير", label: "الواير" },
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
      placeholder: "",
      type: "date",
    },
  ];

  // Fetch damaged devices from the API
  useEffect(() => {
    const fetchDamagedDevices = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${Url}/api/DamagedDevice`, {
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

  const handleFilterSubmit = (formData) => {
    setFilterData(formData);

    // Filter the devices based on the form data
    const filtered = damagedDevices.filter((device) => {
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
    setFilterData({});
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
      dataIndex: "damageReason",
      key: "damageReason",
    },
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "المحافظة",
      dataIndex: "governorateName",
      key: "governorateName",
    },
    {
      title: "التفاصيل",
      key: "details",
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
      <h1 className="damaged-devices-title">الأجهزة التالفة</h1>

      {/* Filter Section */}
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

      {/* Table Section */}
      <div className="damaged-devices-table-container">
        <Table
          dataSource={filteredDevices}
          columns={columns}
          rowKey={(record) => record.id} // Ensure unique row key
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
