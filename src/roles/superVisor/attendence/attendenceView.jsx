import React from "react";
import { useLocation } from "react-router-dom";
import { Table, Checkbox } from "antd"; // Ant Design Table and Checkbox components
import "./attendenceView.css";

export default function ViewAttendance() {
  const location = useLocation();
  const data = location.state?.data; // Retrieve data passed via the "عرض" button

  if (!data) {
    return <div className="error-message">لم يتم العثور على بيانات الحضور</div>;
  }

  // Define columns for the attendance table
  const tableColumns = [
    {
      title: "الرقم التسلسلي",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "الاسم",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "الدور الوظيفي",
      dataIndex: "role",
      key: "role",
    },
    {
      title: "الحضور",
      dataIndex: "attended",
      key: "attended",
      render: (attended) => (
        <Checkbox checked={attended} disabled style={{ color: "#4880ff" }} />
      ),
    },
  ];

  return (
    <div className="attendence-view-container" dir="rtl">
      {/* Date Section */}
      <div style={{display:"flex", justifyContent:"space-between",alignItems:"start",width:"100%"}}>
             <h1>التاريخ : {data.date}</h1>
        <button className="edit-button">التعديل</button>
      </div>
 
      {/* Passport Attendance Section */}
      <h1>حضور الجوازات</h1>
      <div className="attendence-passport-container">
        {data.passportEmployees && data.passportEmployees.length > 0 ? (
          data.passportEmployees.map((employee, index) => (
            <div key={index} className="employee-details">
              <h3>{employee.title}</h3>
              <p>{employee.details}</p>
            </div>
          ))
        ) : (
          <p>لا توجد بيانات لموظفي الجوازات</p>
        )}
      </div>

      <hr />

      {/* Company Attendance Section */}
      <h1>حضور الشركة</h1>
      <div className="attendence-company-container">
        {data.companyEmployees && data.companyEmployees.length > 0 ? (
          data.companyEmployees.map((employee, index) => (
            <div key={index} className="employee-details">
              <h3>{employee.title}</h3>
              <p>{employee.details}</p>
            </div>
          ))
        ) : (
          <p>لا توجد بيانات لموظفي الشركة</p>
        )}
      </div>

      <hr />

      {/* Attendance Table */}
      <div className="attendence-view-table-data">
        <h2>جدول الحضور</h2>
        <Table
          dataSource={data.attendanceTable || []} // Ensure data is passed as an array
          columns={tableColumns}
          rowKey="id"
          bordered
          pagination={false} // Disable pagination if showing only one record
        />
      </div>
    </div>
  );
}
