import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import "./ManagerAttendenceView.css";
import useAuthStore from "./../../../store/store";
import Url from "./../../../store/url.js";

export default function ManagerAttendenceView() {
  const location = useLocation();
  const id = location.state?.id;
  const { isSidebarCollapsed } = useAuthStore();
  const [attendanceData, setAttendanceData] = useState(null);

  useEffect(() => {
    const fetchAttendanceDetails = async () => {
      try {
        const response = await fetch(`${Url}/api/Attendance/${id}`);
        const data = await response.json();
        setAttendanceData(data);
      } catch (error) {
        console.error("Error fetching attendance details:", error);
      }
    };

    if (id) fetchAttendanceDetails();
  }, [id]);

  const renderChart = (title, count) => {
    const data = [
      { name: "حاضر", value: count },
      { name: "غائب", value: 10 - count },
    ];

    const COLORS = ["#0088FE", "#FF8042"];

    return (
      <div className="chart-card">
        <h3>{title}</h3>
        <PieChart width={120} height={120}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={30}
            outerRadius={50}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
        <p>{`${count} موظفين`}</p>
      </div>
    );
  };

  const renderTotalChart = () => {
    if (!attendanceData) return null;

    const totalPresent =
      attendanceData.receivingStaff +
      attendanceData.accountStaff +
      attendanceData.printingStaff +
      attendanceData.qualityStaff +
      attendanceData.deliveryStaff;

    const data = [
      { name: "حاضر", value: totalPresent },
      { name: "غائب", value: 50 - totalPresent }, // Assuming max capacity of 50 employees
    ];

    const COLORS = ["#4CAF50", "#F44336"]; // Green for present, red for absent

    return (
      <div className="total-chart-container">
        <h2>إجمالي الحضور</h2>
        <PieChart width={400} height={400}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={100}
            outerRadius={150}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
        <p>{`الحاضرون: ${totalPresent} موظفين`}</p>
      </div>
    );
  };

  if (!attendanceData) {
    return <div>Loading...</div>;
  }

  return (
    <div
      className={`manager-attendance-view-container ${
        isSidebarCollapsed ? "sidebar-collapsed" : "manager-attendance-view-container"
      }`}
      dir="rtl"
    >
      <div className="header">
        <h1>التاريخ: {new Date(attendanceData.date).toLocaleDateString("en-GB")}</h1>
        <Link to="/manager/attendence/history">
          <button className="back-button">عودة للسجل</button>
        </Link>
      </div>

      {/* Total Attendance Chart */}
      {renderTotalChart()}

      <div className="charts-section">
        {renderChart("موظفي الاستلام", attendanceData.receivingStaff)}
        {renderChart("موظفي الحسابات", attendanceData.accountStaff)}
        {renderChart("موظفي الطباعة", attendanceData.printingStaff)}
        {renderChart("موظفي الجودة", attendanceData.qualityStaff)}
        {renderChart("موظفي التسليم", attendanceData.deliveryStaff)}
      </div>
    </div>
  );
}
