import React from "react";
import { useLocation, Link } from "react-router-dom";
import { Table, Checkbox } from "antd";
import "./ManagerAttendenceView.css";
import TextFieldForm from "./../../../reusable elements/ReuseAbleTextField.jsx";

export default function ManagerAttendenceView() {
  const location = useLocation();
  const data = location.state?.data || {};

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="error-message">
        <h1>لم يتم العثور على بيانات الحضور</h1>
        <Link to="/manager/attendence/history">
          <button className="back-button">العودة إلى السجل</button>
        </Link>
      </div>
    );
  }

  const companyEmployeesColumns = [
    {
      title: "الرقم التسلسلي",
      dataIndex: "id",
      key: "id",
      align: "center",
    },
    {
      title: "الاسم",
      dataIndex: "name",
      key: "name",
      align: "center",
    },
    {
      title: "الدور الوظيفي",
      dataIndex: "role",
      key: "role",
      align: "center",
    },
    {
      title: "الحضور",
      dataIndex: "attended",
      key: "attended",
      align: "center",
      render: (attended) => (
        <Checkbox checked={attended} disabled style={{ color: "#4880ff" }} />
      ),
    },
  ];

  const generalDetailsFields = [
    {
      name: "governorate",
      label: "المحافظة",
      placeholder: data.governorate || "لا توجد بيانات", // Use placeholder for value
      type: "text",
      disabled: true,
    },
    {
      name: "officeName",
      label: "اسم المكتب",
      placeholder: data.officeName || "لا توجد بيانات", // Use placeholder for value
      type: "text",
      disabled: true,
    },
    {
      name: "totalPassportAttendance",
      label: "عدد موظفي الجوازات",
      placeholder: data.totalPassportAttendance?.toString() || "لا توجد بيانات", // Convert to string
      type: "text",
      disabled: true,
    },
    {
      name: "totalCompanyAttendance",
      label: "عدد موظفي الشركة",
      placeholder: data.totalCompanyAttendance?.toString() || "لا توجد بيانات", // Convert to string
      type: "text",
      disabled: true,
    },
  ];

  return (
    <div className="manager-attendance-view-container" dir="rtl">
      {/* Header Section */}
      <div className="header-section">
        <h1>التاريخ: {data.date}</h1>
        <Link to="/manager/attendence">
          <button className="back-button">عودة للسجل</button>
        </Link>
      </div>

      {/* General Details Section */}
      <div className="data-chart-section">
        <TextFieldForm
          fields={generalDetailsFields}
          formClassName="general-details-form"
          inputClassName="general-input"
          fieldWrapperClassName="general-field-wrapper"
          hideButtons
        />
      </div>

      {/* Passport Employees Section */}
      <h2>موظفين الجوازات</h2>
      <div className="role-summary-section">
        <div className="role-cards">
          {data.roleCounts &&
            Object.entries(data.roleCounts)
              .filter(([role]) =>
                ["موظف الاستلام", "موظف الحسابات", "موظف الطباعة", "موظف التسليم"].includes(role)
              )
              .map(([role, count]) => (
                <div key={role} className="role-card">
                  <h3>{role}</h3>
                  <p>عدد الموظفين: {count}</p>
                </div>
              ))}
        </div>
      </div>

      {/* Company Employees Section */}
      <h2>موظفين الشركة</h2>
      <div className="role-summary-section">
        <div className="role-cards">
          {data.roleCounts &&
            Object.entries(data.roleCounts)
              .filter(
                ([role]) =>
                  !["موظف الاستلام", "موظف الحسابات", "موظف الطباعة", "موظف التسليم"].includes(role)
              )
              .map(([role, count]) => (
                <div key={role} className="role-card">
                  <h3>{role}</h3>
                  <p>عدد الموظفين: {count}</p>
                </div>
              ))}
        </div>
      </div>

      {/* All Employees Table */}
      <div className="employees-table-section">
        <h2>جدول جميع الموظفين</h2>
        <Table
          dataSource={data.companyEmployees || []}
          columns={companyEmployeesColumns}
          rowKey="id"
          bordered
          pagination={false}
        />
      </div>
    </div>
  );
}
