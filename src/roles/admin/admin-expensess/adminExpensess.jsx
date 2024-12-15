import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Table, Button } from "antd"; // Import Ant Design Table and Button
import TextFieldForm from "../../../reusable elements/ReuseAbleTextField.jsx";
import "./adminExpensess.css";

const AdminExpenses = () => {
  const location = useLocation();

  // Sample expense records
  const [originalData] = useState([
    {
      key: "1",
      governorate: "بغداد",
      office: "الرصافة",
      status: "قيد التنفيذ",
      cost: "500,000 دينار",
      date: "2024-11-30",
    },
    {
      key: "2",
      governorate: "نينوى",
      office: "الموصل",
      status: "تم الإرسال",
      cost: "300,000 دينار",
      date: "2024-11-29",
    },
    {
      key: "3",
      governorate: "البصرة",
      office: "الزبير",
      status: "ملغى",
      cost: "100,000 دينار",
      date: "2024-11-28",
    },
  ]);

  const [filteredData, setFilteredData] = useState(originalData); // State for filtered data

  // Define table columns
  const columns = [
    {
      title: "المحافظة",
      dataIndex: "governorate",
      key: "governorate",
      align: "center",
    },
    {
      title: "المكتب",
      dataIndex: "office",
      key: "office",
      align: "center",
    },
    {
      title: "الحالة",
      dataIndex: "status",
      key: "status",
      align: "center",
    },
    {
      title: "التكاليف",
      dataIndex: "cost",
      key: "cost",
      align: "center",
    },
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
      align: "center",
    },
    {
      title: "الإجراءات",
      key: "actions",
      align: "center",
      render: (text, record) => (
        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          {/* عرض button */}
          <Button type="primary" onClick={() => console.log("عرض", record)}>
            عرض
          </Button>
          {/* التعديل button */}
          <Button
            type="default"
            style={{ color: "blue", borderColor: "blue" }}
            onClick={() => console.log("التعديل", record)}
          >
            التعديل
          </Button>
        </div>
      ),
    },
  ];

  // Define the fields for the filter form
  const formFields = [
    {
      name: "governorate",
      label: "المحافظة",
      type: "dropdown",
      placeholder: "",
      options: [
        { value: "بغداد", label: "بغداد" },
        { value: "نينوى", label: "نينوى" },
        { value: "البصرة", label: "البصرة" },
      ],
    },
    {
      name: "office",
      label: "المكتب",
      type: "dropdown",
      placeholder: "",
      options: [
        { value: "الرصافة", label: "الرصافة" },
        { value: "الموصل", label: "الموصل" },
        { value: "الزبير", label: "الزبير" },
      ],
    },
    {
      name: "status",
      label: "الحالة",
      type: "dropdown",
      placeholder: "",
      options: [
        { value: "قيد التنفيذ", label: "قيد التنفيذ" },
        { value: "تم الإرسال", label: "تم الإرسال" },
        { value: "ملغى", label: "ملغى" },
      ],
    },
    {
      name: "dateFrom",
      label: "التاريخ من",
      type: "date",
    },
    {
      name: "dateTo",
      label: "التاريخ إلى",
      type: "date",
    },
  ];

  const handleFormSubmit = (formData) => {
    const { governorate, office, status, dateFrom, dateTo } = formData;

    // Filter data based on the form inputs
    const filtered = originalData.filter((record) => {
      const matchesGovernorate = governorate
        ? record.governorate === governorate
        : true;
      const matchesOffice = office ? record.office === office : true;
      const matchesStatus = status ? record.status === status : true;
      const matchesDateFrom = dateFrom
        ? new Date(record.date) >= new Date(dateFrom)
        : true;
      const matchesDateTo = dateTo
        ? new Date(record.date) <= new Date(dateTo)
        : true;

      return (
        matchesGovernorate &&
        matchesOffice &&
        matchesStatus &&
        matchesDateFrom &&
        matchesDateTo
      );
    });

    setFilteredData(filtered); // Update the filtered data state
  };

  const handleFormReset = () => {
    setFilteredData(originalData); // Reset the table data to the original data
  };

  return (
    <>
      <div className="expenses-container" dir="rtl">
        <h1 className="expenses-header">قائمة المصاريف</h1>

        {/* TextFieldForm for filtering */}
        <div className="admin-expenses-text-fields">
          <TextFieldForm
            fields={formFields}
            onFormSubmit={handleFormSubmit}
            onReset={handleFormReset}
            formClassName="admin-expenses-form"
            inputClassName="admin-expenses-input"
            dropdownClassName="admin-expenses-dropdown"
            fieldWrapperClassName="admin-expenses-field-wrapper"
            buttonClassName="admin-expenses-button"
          />
        </div>

        {/* Ant Design Table for displaying filtered data */}
        <div className="admin-expenses-table-field">
          <Table
            columns={columns}
            dataSource={filteredData}
            pagination={{ pageSize: 5 }}
            bordered
            size="middle"
            className="expenses-table"
          />
        </div>
      </div>
    </>
  );
};

export default AdminExpenses;
