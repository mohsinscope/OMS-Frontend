import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import axios from "axios";
import "./stats.css"; // Assuming your styles are in stats.css
import Url from "./../store/url.js"; // Importing base URL

export default function Stats() {
  const [chartData, setChartData] = useState([]);
  const [totalDamagedDevices, setTotalDamagedDevices] = useState(0);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  // Function to fetch data from API
  const fetchDamagedDevices = async () => {
    try {
      const response = await axios.get(
        `${Url}/api/DamagedDevice?PageNumber=1&PageSize=10` // Using Url as base
      );
      const formattedData = response.data.map((item) => ({
        name: item.deviceTypeName || "Unknown",
        value: item.damagedDeviceTypeId || 0,
      }));

      // Calculate total devices
      const total = formattedData.reduce((acc, curr) => acc + curr.value, 0);

      setChartData(formattedData);
      setTotalDamagedDevices(total);
    } catch (error) {
      console.error("Failed to fetch damaged devices:", error);
    }
  };

  // Fetch data when the component mounts
  useEffect(() => {
    fetchDamagedDevices();
  }, []);

  return (
    <div className="stats-container">
      {/* Navigation Bar */}
      <div className="stats-navbar" dir="rtl">
        <div className="small-stats-navbar-warber">
          <ul>
            <li className="stats-navbar-item active">الأجهزة التالفة</li>
            <li className="stats-navbar-item">الجوازات التالفة</li>
          </ul>
        </div>
      </div>

      {/* Main Chart and Summary Cards */}
      <div className="stats-main-section" dir="rtl">
        {/* Full Pie Chart */}
        <div className="stats-chart-section">
          <h2 className="stats-chart-title">عدد الأجهزة التالفة</h2>
          <div className="chart-container">
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
            <h3>إجمالي الأجهزة التالفة: {totalDamagedDevices}</h3>
          </div>
        </div>

        {/* Summary Cards */}
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
      </div>
    </div>
  );
}
