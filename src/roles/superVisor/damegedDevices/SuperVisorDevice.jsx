import "./SuperVisorDevice.css";
import useAuthStore from "./../../../store/store";
import React, { useState } from "react";
import { Table, message } from "antd";
import { Link } from "react-router-dom";
import TextFieldForm from "./../../../reusable elements/ReuseAbleTextField.jsx";
import devicesData from "./../../../data/devices.json";

export default function SuperVisorDevices() {
  const { isSidebarCollapsed } = useAuthStore();
  const [filterData, setFilterData] = useState({});

  // Map the devicesData and ensure each record has a unique ID
  const generalInfoList = devicesData.map((damagedDevice, index) => ({
    id: index + 1, // Add a unique ID based on the index
    ...damagedDevice.generalInfo,
  }));
  const [devicesList, setdevicesList] = useState(generalInfoList);

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
      name: "التاريخ",
      label: "التاريخ",
      placeholder: "",
      type: "date",
    },
  ];

  const handleFilterSubmit = (formData) => {
    setFilterData(formData);

    // Filter the devices based on the form data
    const filteredDevices = generalInfoList.filter((generalInfo) => {
      const matchesReason =
        !formData["سبب التلف"] ||
        generalInfo["سبب التلف"] === formData["سبب التلف"];
      const matchesType =
        !formData["نوع الجهاز"] ||
        generalInfo["نوع الجهاز"] === formData["نوع الجهاز"];
      const matchesDate =
        !formData["التاريخ"] ||
        generalInfo["التاريخ"].startsWith(formData["التاريخ"]);

      return matchesReason && matchesType && matchesDate;
    });

    if (filteredDevices.length === 0) {
      message.warning("لا توجد نتائج تطابق الفلاتر المحددة");
    }

    setdevicesList(filteredDevices);
  };

  const handleReset = () => {
    setFilterData({});
    setdevicesList(generalInfoList);
    message.success("تم إعادة تعيين الفلاتر بنجاح");
  };

  const columns = [
    {
      title: "نوع الجهاز",
      dataIndex: "نوع الجهاز",
      key: "deviceType",
      className: "table-column-device-type",
    },
    {
      title: "سبب التلف",
      dataIndex: "سبب التلف",
      key: "damageReason",
      className: "table-column-damage-reason",
    },
    {
      title: "التاريخ",
      dataIndex: "التاريخ",
      key: "date",
      className: "table-column-date",
    },
    {
      title: "التفاصيل",
      key: "details",
      className: "table-column-details",
      render: (_, record) => {
        const device = devicesData.find(
          (exp) => exp.generalInfo["نوع الجهاز"] === record["نوع الجهاز"]
        );
        return (
          <Link
            to="/supervisor/damegedDevices"
            state={{ device }}
            className="supervisor-devices-dameged-details-link">
            عرض
          </Link>
        );
      },
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
      <div className="supervisor-devices-dameged-filters">
        <TextFieldForm
          fields={fields}
          onFormSubmit={handleFilterSubmit}
          onReset={handleReset}
          formClassName="supervisor-devices-dameged-form"
          inputClassName="supervisor-devices-dameged-input"
          dropdownClassName="supervisor-devices-dameged-dropdown"
          fieldWrapperClassName="supervisor-devices-dameged-field-wrapper"
          buttonClassName="supervisor-devices-dameged-button"
        />
      </div>
      <div className="supervisor-devices-dameged-table-container">
        <Table
          dataSource={devicesList}
          columns={columns}
          rowKey={(record) => record.id} // Unique rowKey based on ID
          bordered
          pagination={{ pageSize: 15 }}
          locale={{ emptyText: "لا توجد بيانات" }}
          className="supervisor-devices-dameged-table"
        />
      </div>
    </div>
  );
}
