import './dammagedPasportsHistory.css';
import passportData from './../../../data/pasport.json'; // Local JSON file
import useAuthStore from "./../../../store/store"; // Import sidebar state for dynamic class handling
import React, { useState } from "react";
import { Table, message } from "antd"; // Import Ant Design components
import { Link } from "react-router-dom"; // Import Link
import TextFieldForm from "./../../../reusable elements/ReuseAbleTextField.jsx"; // Reusable form component

export default function SuperVisorPassport() {
  const { isSidebarCollapsed } = useAuthStore(); // Access sidebar collapse state
  const [filterData, setFilterData] = useState({});
  const [originalPassportList] = useState(
    passportData.map((damagedPp) => damagedPp.generalInfo)
  ); // Keep the original data
  const [passportList, setPassportList] = useState(originalPassportList); // State for filtered data

  const fields = [
    {
      name: "سبب التلف",
      label: "سبب التلف",
      placeholder: "",
      type: "dropdown",
      options: [
        { value: "خلل مصنعي", label: "خلل مصنعي" },
        { value: "حرق", label: "حرق" },
        { value: "تلف شريحة", label: "تلف شريحة" },
      ],
    },
    {
      name: "رقم الجواز",
      label: "رقم الجواز",
      placeholder: "",
      type: "text",
    },
    {
      name: "date",
      label: "التاريخ",
      placeholder: "اختر التاريخ",
      type: "date",
      id: "date",
    },
  ];

  const handleFilterSubmit = (formData) => {
    setFilterData(formData);

    const filteredDamagedPps = originalPassportList.filter((generalInfo) => {
      const matchesStatus =
        !formData["سبب التلف"] || generalInfo["سبب التلف"] === formData["سبب التلف"];
      const matchesId =
        !formData["رقم الجواز"] ||
        generalInfo["رقم الجواز"]
          .toString()
          .toLowerCase()
          .includes(formData["رقم الجواز"].toLowerCase());
      const matchesDate =
        !formData["date"] || generalInfo["التاريخ"].includes(formData["date"]);

      return matchesStatus && matchesId && matchesDate;
    });

    if (filteredDamagedPps.length === 0) {
      message.warning("لا توجد نتائج تطابق الفلاتر المحددة");
    }

    setPassportList(filteredDamagedPps);
  };

  const handleReset = () => {
    setFilterData({});
    setPassportList(originalPassportList); // Reset to original data
    message.success("تم إعادة تعيين الفلاتر بنجاح");
  };

  const columns = [
    {
      title: "رقم الجواز",
      dataIndex: "رقم الجواز",
      key: "passportNumber",
      className: "table-column-passport-number",
    },
    {
      title: "سبب التلف",
      dataIndex: "سبب التلف",
      key: "damage",
      className: "table-column-damage",
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
      render: (_, record) => (
        <Link
          to="DammagedPasportsShow"
          state={{ passport: record }}
          className="supervisor-passport-dameged-details-link"
        >
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
      dir="rtl"
    >
      {/* Page Title */}
      <h1 className="supervisor-passport-dameged-title">الجوازات التالفة</h1>

      {/* Filter Form */}
      <div className="supervisor-passport-dameged-filters">
        <TextFieldForm
          fields={fields}
          onFormSubmit={handleFilterSubmit}
          onReset={handleReset}
          formClassName="supervisor-passport-dameged-form"
          inputClassName="supervisor-passport-dameged-input"
          dropdownClassName="supervisor-passport-dameged-dropdown"
          fieldWrapperClassName="supervisor-passport-dameged-field-wrapper"
          buttonClassName="supervisor-passport-dameged-button"
        />
        <Link to="/supervisor/damagedpasportshistory/supervisordammagepasportadd">
        <button className="supervisor-passport-dameged-button"> اضافة جواز تالف</button>
        </Link>
      </div>

      {/* Passport Damaged Table */}
      <div className="supervisor-passport-dameged-table-container">
        <Table
          dataSource={passportList}
          columns={columns}
          rowKey="رقم الجواز"
          bordered
          pagination={{ pageSize: 15 }}
          locale={{ emptyText: "لا توجد بيانات" }}
          className="supervisor-passport-dameged-table"
        />
      </div>
    </div>
  );
}
