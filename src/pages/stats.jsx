import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import axios from "axios";
import "./stats.css";
import Url from "./../store/url.js";
import useAuthStore from "./../store/store.js";
import AttendanceStats from './attendenceStats.jsx';

export default function Stats() {
  const { profile } = useAuthStore();
  const [chartData, setChartData] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedTab, setSelectedTab] = useState("damagedDevices");
  const [attendanceData, setAttendanceData] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [offices, setOffices] = useState([]);
  const [damagedDeviceTypes, setDamagedDeviceTypes] = useState([]);
  const [damagedPassportTypes, setDamagedPassportTypes] = useState([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  const COLORS = [
    "#4CAF50", // Green
    "#F44336", // Red
    "#2196F3", // Blue
    "#FFC107", // Amber
    "#9C27B0", // Purple
    "#FF5722", // Deep Orange
    "#00BCD4", // Cyan
    "#E91E63", // Pink
    "#3F51B5", // Indigo
    "#CDDC39"  // Lime
  ];

  const fetchGovernorates = async () => {
    try {
      const response = await axios.get(`${Url}/api/Governorate/dropdown`);
      setGovernorates(response.data);
    } catch (error) {
      console.error("Failed to fetch governorates:", error.message);
    }
  };

  const fetchOffices = async () => {
    try {
      const response = await axios.get(`${Url}/api/Office/dropdown`);
      setOffices(response.data);
    } catch (error) {
      console.error("Failed to fetch offices:", error.message);
    }
  };

  const fetchDamagedDeviceTypes = async () => {
    try {
      const response = await axios.get(`${Url}/api/damageddevicetype/all`);
      setDamagedDeviceTypes(response.data);
    } catch (error) {
      console.error("Failed to fetch damaged device types:", error.message);
    }
  };

  const fetchDamagedPassportTypes = async () => {
    try {
      const response = await axios.get(`${Url}/api/damagedtype/all`);
      setDamagedPassportTypes(response.data);
    } catch (error) {
      console.error("Failed to fetch damaged passport types:", error.message);
    }
  };

  const fetchDamagedDevices = async () => {
    setLoading(true);
    try {
      const deviceData = await Promise.all(
        damagedDeviceTypes.map(async (type) => {
          const body = {
            OfficeId: selectedOffice,
            GovernorateId: selectedGovernorate,
            Date: `${selectedDate}T12:00:00Z`,
            DamagedDeviceTypeId: type.id,
          };

          const response = await axios.post(`${Url}/api/DamagedDevice/search/statistics`, body);
          return {
            name: type.name,
            value: response.data.availableSpecificDamagedDevices,
          };
        })
      );

      const combinedData = deviceData.reduce((acc, curr) => {
        if (curr.value > 0) {
          const existing = acc.find(item => item.name === curr.name);
          if (existing) {
            existing.value += curr.value;
          } else {
            acc.push(curr);
          }
        }
        return acc;
      }, []);

      const total = combinedData.reduce((acc, curr) => acc + curr.value, 0);
      setChartData(combinedData);
      setTotalItems(total);
    } catch (error) {
      console.error("Failed to fetch damaged devices:", error.message);
      setChartData([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchDamagedPassports = async () => {
    setLoading(true);
    try {
      const passportData = await Promise.all(
        damagedPassportTypes.map(async (type) => {
          const body = {
            OfficeId: selectedOffice,
            GovernorateId: selectedGovernorate,
            Date: `${selectedDate}T12:00:00Z`,
            DamagedTypeId: type.id,
          };

          const response = await axios.post(`${Url}/api/DamagedPassport/search/statistics`, body);
          return {
            name: type.name,
            value: response.data.availableSpecificDamagedPassports,
          };
        })
      );

      const total = passportData.reduce((acc, curr) => acc + curr.value, 0);
      setChartData(passportData);
      setTotalItems(total);
    } catch (error) {
      console.error("Failed to fetch damaged passports:", error.message);
      setChartData([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGovernorates();
    fetchOffices();
    fetchDamagedDeviceTypes();
    fetchDamagedPassportTypes();
  }, []);

  return (
    <div className="stats-container">
      <div className="stats-navbar" dir="rtl">
        <div className="small-stats-navbar-warber">
          <ul>
            <li
              className={`stats-navbar-item ${selectedTab === "damagedDevices" ? "active" : ""}`}
              onClick={() => setSelectedTab("damagedDevices")}
            >
              الأجهزة التالفة
            </li>
            <li
              className={`stats-navbar-item ${selectedTab === "damagedPassports" ? "active" : ""}`}
              onClick={() => setSelectedTab("damagedPassports")}
            >
              الجوازات التالفة
            </li>
            <li
              className={`stats-navbar-item ${selectedTab === "attendance" ? "active" : ""}`}
              onClick={() => setSelectedTab("attendance")}
            >
              الحضور
            </li>
          </ul>
        </div>
      </div>

      {selectedTab !== "attendance" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedTab === "damagedDevices") {
              fetchDamagedDevices();
            } else if (selectedTab === "damagedPassports") {
              fetchDamagedPassports();
            }
          }}
          className="stats-form"
          dir="rtl"
        >
          <div className="form-group">
            <label>التاريخ</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>اسم المكتب</label>
            <select
              value={selectedOffice || ""}
              onChange={(e) => setSelectedOffice(e.target.value || null)}
              className="form-control"
            >
              <option value="">كل المكاتب</option>
              {offices.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>المحافظة</label>
            <select
              value={selectedGovernorate || ""}
              onChange={(e) => setSelectedGovernorate(e.target.value || null)}
              className="form-control"
            >
              <option value="">كل المحافظات</option>
              {governorates.map((gov) => (
                <option key={gov.id} value={gov.id}>
                  {gov.name}
                </option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            className="search-button"
            disabled={loading}
          >
            {loading ? 'جاري البحث...' : 'ابحث'}
          </button>
        </form>
      )}

      <div className="stats-main-section" dir="rtl">
        <div className="stats-chart-section">
          <h2 className="stats-chart-title">
            احصائيات {selectedTab === "damagedDevices" ? "الأجهزة التالفة" : selectedTab === "damagedPassports" ? "الجوازات التالفة" : "الحضور"}
          </h2>
          <div className="chart-container">
            {selectedTab === "attendance" ? (
              <AttendanceStats data={attendanceData} />
            ) : (
              <>
                <PieChart width={400} height={400}>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={100}
                    outerRadius={150}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
                <h3>
                  إجمالي {selectedTab === "damagedDevices" ? "الأجهزة التالفة" : "الجوازات التالفة"}: {totalItems}
                </h3>
              </>
            )}
          </div>
        </div>

        {selectedTab !== "attendance" && chartData.length > 0 && (
          <div className="stats-summary">
            {chartData.map((item, index) => (
              <div key={index} className="summary-card">
                <h3>{item.name}</h3>
                <p>{item.value}</p>
                <PieChart width={120} height={120}>
                  <Pie
                    data={[{ name: item.name, value: item.value }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill={COLORS[index % COLORS.length]} />
                  </Pie>
                  <Tooltip />
                </PieChart>
                <span>{selectedTab === "damagedDevices" ? "عدد الأجهزة" : "عدد الجوازات"}: {item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
