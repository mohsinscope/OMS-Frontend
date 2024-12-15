import React from "react";
import { useLocation, Link } from "react-router-dom";
import { Table, Checkbox } from "antd";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import "./ManagerAttendenceView.css";
import TextFieldForm from "./../../../reusable elements/ReuseAbleTextField.jsx";
import useAuthStore from "./../../../store/store"; // Import sidebar state for dynamic class handling
export default function ManagerAttendenceView() {
  const location = useLocation();
  const data = location.state?.data || {};
  const { isSidebarCollapsed } = useAuthStore(); // Access sidebar collapse state
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
      placeholder: data.governorate || "لا توجد بيانات",
      type: "text",
      disabled: true,
    },
    {
      name: "officeName",
      label: "اسم المكتب",
      placeholder: data.officeName || "لا توجد بيانات",
      type: "text",
      disabled: true,
    },
    {
      name: "totalPassportAttendance",
      label: "عدد موظفي الجوازات",
      placeholder: data.totalPassportAttendance?.toString() || "لا توجد بيانات",
      type: "text",
      disabled: true,
    },
    {
      name: "totalCompanyAttendance",
      label: "عدد موظفي الشركة",
      placeholder: data.totalCompanyAttendance?.toString() || "لا توجد بيانات",
      type: "text",
      disabled: true,
    },
  ];

  const renderCircularChart = (role, count, total) => {
    const chartData = [
      { name: "حاضر", value: count, color: "#81c784" }, // Darker green
      { name: "غائب", value: total - count, color: "#e57373" }, // Darker red
    ];

    return (
      <PieChart width={120} height={120}>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={30}
          outerRadius={50}
          paddingAngle={5}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value, name) => [`${value}`, `${name}`]} />
      </PieChart>
    );
  };

  const calculateTotalForSection = (roles) => {
    return Object.values(roles || {}).reduce((total, count) => total + count, 0);
  };

  const renderRoleCards = (roles) => {
    const totalEmployees = calculateTotalForSection(roles);

    return Object.entries(roles || {}).map(([role, count]) => (
      <div key={role} className="role-card">
        <div className="role-card-header">
          <h3>{role}</h3>
        </div>
        <div className="role-card-body">
          {renderCircularChart(role, count, totalEmployees)}
          <p>
            {count} من {totalEmployees} موظفين
          </p>
        </div>
      </div>
    ));
  };

  return (
    <div
      className={`manager-attendance-view-container ${
        isSidebarCollapsed
          ? "sidebar-collapsed"
          : "manager-attendance-view-container"
      }`}
      dir="rtl">
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
      <h2>حضور موظفي جوازات مكتب الدوجة</h2>
      <div className="role-summary-section">
        <div className="role-cards">
          {renderRoleCards(
            Object.fromEntries(
              Object.entries(data.roleCounts || {}).filter(([role]) =>
                ["موظف الاستلام", "موظف الحسابات", "موظف الطباعة", "موظف التسليم"].includes(
                  role
                )
              )
            )
          )}
        </div>
      </div>

      {/* Company Employees Section */}
      <h2>حضور موظفين الشركة</h2>
      <div className="role-summary-section">
        <div className="role-cards">
          {renderRoleCards(
            Object.fromEntries(
              Object.entries(data.roleCounts || {}).filter(
                ([role]) =>
                  !["موظف الاستلام", "موظف الحسابات", "موظف الطباعة", "موظف التسليم"].includes(role)
              )
            )
          )}
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
