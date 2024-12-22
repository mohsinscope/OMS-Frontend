// src/components/Stats.jsx

import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import axios from "axios";
import "./stats.css"; // Import your styles
import Url from "./../store/url.js"; // Importing base URL
import useAuthStore from "./../store/store.js"; // Importing auth store
import AttendanceStats from './attendenceStats.jsx';
export default function Stats() {
  const { profile } = useAuthStore(); // Assuming the profile contains user's office ID and role
  const [chartData, setChartData] = useState([]);
  const [totalItems, setTotalItems] = useState(0); // Total count for selected data
  const [selectedTab, setSelectedTab] = useState("damagedDevices"); // Track selected tab
  const [attendanceData, setAttendanceData] = useState([]); // Attendance data

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28BD4", "#FF7F50"];

  // Function to fetch Damaged Devices data
  const fetchDamagedDevices = async () => {
    try {
      let url = `${Url}/api/DamagedDevice?PageNumber=1&PageSize=10`; // Default URL for all offices

      if (profile?.role === "Supervisor" && profile?.officeId) {
        url = `${Url}/api/DamagedDevice/office/${profile.officeId}`; // Filter by supervisor's office
      }

      const response = await axios.get(url);
      const deviceCount = {};

      // Count devices by deviceTypeName (group by device type)
      response.data.forEach((item) => {
        const name = item.deviceTypeName || "Unknown";
        if (!deviceCount[name]) {
          deviceCount[name] = 0;
        }
        deviceCount[name] += 1; // Increment count for each device type
      });

      // Convert deviceCount object into an array for the chart
      const formattedData = Object.keys(deviceCount).map((key) => ({
        name: key,
        value: deviceCount[key],
      }));

      const total = formattedData.reduce((acc, curr) => acc + curr.value, 0);
      setChartData(formattedData);
      setTotalItems(total);
    } catch (error) {
      console.error("Failed to fetch damaged devices:", error);
    }
  };

  // Function to fetch Damaged Passport data
  const fetchDamagedPassports = async () => {
    try {
      const body = {
        officeId: profile?.role === "Supervisor" ? profile?.officeId : undefined, // Only filter for Supervisor
        PaginationParams: {
          PageNumber: 1,
          PageSize: 10,
        },
      };

      const response = await axios.post(`${Url}/api/DamagedPassport/search`, body);
      const passportCount = {};

      // Count passports by damagedTypeName (group by damage type)
      response.data.forEach((item) => {
        const name = item.damagedTypeName || "Unknown"; // Use damagedTypeName for name
        if (!passportCount[name]) {
          passportCount[name] = 0;
        }
        passportCount[name] += 1; // Increment count for each damaged passport type
      });

      // Convert passportCount object into an array for the chart
      const formattedData = Object.keys(passportCount).map((key) => ({
        name: key, // Set the name as the damagedTypeName
        value: passportCount[key],
      }));

      const total = formattedData.reduce((acc, curr) => acc + curr.value, 0);
      setChartData(formattedData);
      setTotalItems(total);
    } catch (error) {
      console.error("Failed to fetch damaged passports:", error);
    }
  };

  // Function to fetch Attendance data
  const fetchAttendance = async () => {
    try {
      const body = {
        workingHours: 1,
        date: "2024-12-03T10:00:00Z",
        officeId: profile?.role === "Supervisor" ? profile?.officeId : undefined, // Only filter for Supervisor
        governorateId: 1, // Hardcoded for now
        PaginationParams: {
          PageNumber: 1,
          PageSize: 10,
        },
      };

      const response = await axios.post(`${Url}/api/Attendance/search`, body);
      const attendanceProcessedData = response.data.map((item) => ({
        month: item.month, // Adjust according to your API response
        morning: item.morning, // Adjust according to your API response
        evening: item.evening, // Adjust according to your API response
      }));

      setAttendanceData(attendanceProcessedData);
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
    }
  };

  // Fetch data based on the selected tab
  useEffect(() => {
    if (selectedTab === "damagedDevices") {
      fetchDamagedDevices();
    } else if (selectedTab === "damagedPassports") {
      fetchDamagedPassports();
    } else if (selectedTab === "attendance") {
      fetchAttendance();
    }
  }, [selectedTab, profile]); // Rerun when the selected tab or profile changes

  return (
    <div className="stats-container">
      {/* Navigation Bar */}
      <div className="stats-navbar" dir="rtl">
        <div className="small-stats-navbar-warber">
          <ul>
            <li
              className={`stats-navbar-item ${
                selectedTab === "damagedDevices" ? "active" : ""
              }`}
              onClick={() => setSelectedTab("damagedDevices")}
            >
              الأجهزة التالفة
            </li>
            <li
              className={`stats-navbar-item ${
                selectedTab === "damagedPassports" ? "active" : ""
              }`}
              onClick={() => setSelectedTab("damagedPassports")}
            >
              الجوازات التالفة
            </li>
            <li
              className={`stats-navbar-item ${
                selectedTab === "attendance" ? "active" : ""
              }`}
              onClick={() => setSelectedTab("attendance")}
            >
              الحضور
            </li>
          </ul>
        </div>
      </div>

      {/* Main Chart and Summary Cards */}
      <div className="stats-main-section" dir="rtl">
        {/* Full Chart Section */}
        <div className="stats-chart-section">
          <h2 className="stats-chart-title">
            عدد{" "}
            {selectedTab === "damagedDevices"
              ? "الأجهزة التالفة"
              : selectedTab === "damagedPassports"
              ? "الجوازات التالفة"
              : "الحضور"}
          </h2>
          <div className="chart-container">
            {selectedTab === "attendance" ? (
              // Render AttendanceStats BarChart
              <AttendanceStats data={attendanceData} />
            ) : (
              // Render PieChart for other tabs
              <>
                <PieChart width={400} height={400}>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
                <h3>
                  إجمالي{" "}
                  {selectedTab === "damagedDevices"
                    ? "الأجهزة التالفة"
                    : selectedTab === "damagedPassports"
                    ? "الجوازات التالفة"
                    : "الحضور"}
                  : {totalItems}
                </h3>
              </>
            )}
          </div>
        </div>

        {/* Summary Cards (Only for PieCharts) */}
        {selectedTab !== "attendance" && (
          <div className="stats-summary">
            {chartData.map((item, index) => (
              <div key={index} className="summary-card">
                <h3>{item.name}</h3>
                <p>{item.value}</p>
                <PieChart width={100} height={100}>
                  <Pie
                    data={[item]}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={40}
                    fill={COLORS[index % COLORS.length]}
                    isAnimationActive={false}
                  />
                </PieChart>
                <span>مقارنة بالشهر الماضي</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
