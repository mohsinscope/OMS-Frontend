import React, { useEffect, useState, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import axios from "axios";
import "./stats.css";
import Url from "./../store/url.js";
import useAuthStore from "./../store/store.js";
import AttendanceStats from './attendenceStats.jsx';

const COLORS = [
  "#4CAF50", "#F44336", "#2196F3", "#FFC107", "#9C27B0",
  "#FF5722", "#00BCD4", "#E91E63", "#3F51B5", "#CDDC39"
];

export default function Stats() {
  const { profile } = useAuthStore();
  const [chartData, setChartData] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedTab, setSelectedTab] = useState("damagedDevices");
  const [attendanceData, setAttendanceData] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [availableOffices, setAvailableOffices] = useState([]);
  const [damagedDeviceTypes, setDamagedDeviceTypes] = useState([]);
  const [damagedPassportTypes, setDamagedPassportTypes] = useState([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch governorates data
  const fetchGovernorates = useCallback(async () => {
    try {
      const response = await axios.get(`${Url}/api/Governorate/dropdown`);
      setGovernorates(response.data);
    } catch (error) {
      setError("Failed to fetch governorates. Please try again later.");
      console.error("Governorates fetch error:", error);
    }
  }, []);

  // Fetch offices for selected governorate
  const fetchOffices = useCallback(async (governorateId) => {
    if (!governorateId) {
      setAvailableOffices([]);
      setSelectedOffice(null);
      return;
    }

    try {
      const response = await axios.get(`${Url}/api/Governorate/dropdown/${governorateId}`);
      if (response.data && response.data[0] && response.data[0].offices) {
        setAvailableOffices(response.data[0].offices);
      }
      setSelectedOffice(null); // Reset selected office when governorate changes
    } catch (error) {
      setError("Failed to fetch offices. Please try again later.");
      console.error("Offices fetch error:", error);
    }
  }, []);

  // Handle governorate change
  const handleGovernorateChange = useCallback((governorateId) => {
    setSelectedGovernorate(governorateId || null);
    if (governorateId) {
      fetchOffices(governorateId);
    } else {
      setAvailableOffices([]);
      setSelectedOffice(null);
    }
  }, [fetchOffices]);

  // Fetch types data
  const fetchTypesData = useCallback(async () => {
    try {
      const [deviceTypesRes, passportTypesRes] = await Promise.all([
        axios.get(`${Url}/api/damageddevicetype/all`),
        axios.get(`${Url}/api/damagedtype/all`)
      ]);
      
      setDamagedDeviceTypes(deviceTypesRes.data);
      setDamagedPassportTypes(passportTypesRes.data);
    } catch (error) {
      setError("Failed to fetch types data. Please try again later.");
      console.error("Types data fetch error:", error);
    }
  }, []);

  // Fetch statistics data
  const fetchStatisticsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const types = selectedTab === "damagedDevices" ? damagedDeviceTypes : damagedPassportTypes;
      const endpoint = selectedTab === "damagedDevices" 
        ? `${Url}/api/DamagedDevice/search/statistics`
        : `${Url}/api/DamagedPassport/search/statistics`;
      
      const requests = types.map(type => {
        const body = {
          OfficeId: selectedOffice || null,
          GovernorateId: selectedGovernorate || null,
          Date: `${selectedDate}T00:00:00Z`,
          [selectedTab === "damagedDevices" ? "DamagedDeviceTypeId" : "DamagedTypeId"]: type.id
        };
        return axios.post(endpoint, body);
      });

      const responses = await Promise.all(requests);
      
      const data = responses.map((response, index) => ({
        name: types[index].name,
        value: selectedTab === "damagedDevices" 
          ? response.data.availableSpecificDamagedDevices
          : response.data.availableSpecificDamagedPassports
      }));

      const filteredData = data.filter(item => item.value > 0);
      const total = filteredData.reduce((acc, curr) => acc + curr.value, 0);
      
      setChartData(filteredData);
      setTotalItems(total);
    } catch (error) {
      setError("Failed to fetch statistics. Please try again later.");
      console.error("Statistics fetch error:", error);
      setChartData([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [selectedTab, selectedOffice, selectedGovernorate, selectedDate, damagedDeviceTypes, damagedPassportTypes]);

  // Handle tab change
  const handleTabChange = useCallback(async (tab) => {
    setChartData([]);
    setTotalItems(0);
    setError(null);
    setSelectedTab(tab);
    
    if (tab === "attendance") return;
    
    if ((tab === "damagedDevices" && damagedDeviceTypes.length === 0) ||
        (tab === "damagedPassports" && damagedPassportTypes.length === 0)) {
      await fetchTypesData();
    }
  }, [fetchTypesData]);

  // Initial data fetch
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        fetchGovernorates(),
        fetchTypesData()
      ]);
    };
    
    initializeData();
  }, [fetchGovernorates, fetchTypesData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchStatisticsData();
  };

  return (
    <div className="stats-container">
      <div className="stats-navbar" dir="rtl">
        <div className="small-stats-navbar-warber">
          <ul>
            <li
              className={`stats-navbar-item ${selectedTab === "damagedDevices" ? "active" : ""}`}
              onClick={() => handleTabChange("damagedDevices")}
            >
              الأجهزة التالفة
            </li>
            <li
              className={`stats-navbar-item ${selectedTab === "damagedPassports" ? "active" : ""}`}
              onClick={() => handleTabChange("damagedPassports")}
            >
              الجوازات التالفة
            </li>
            <li
              className={`stats-navbar-item ${selectedTab === "attendance" ? "active" : ""}`}
              onClick={() => handleTabChange("attendance")}
            >
              الحضور
            </li>
          </ul>
        </div>
      </div>

      {selectedTab !== "attendance" && (
        <form onSubmit={handleSubmit} className="stats-form" dir="rtl">
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
            <label>المحافظة</label>
            <select
              value={selectedGovernorate || ""}
              onChange={(e) => handleGovernorateChange(e.target.value)}
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

          <div className="form-group">
            <label>اسم المكتب</label>
            <select
              value={selectedOffice || ""}
              onChange={(e) => setSelectedOffice(e.target.value || null)}
              className="form-control"
              disabled={!selectedGovernorate}
            >
              <option value="">كل المكاتب</option>
              {availableOffices.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.name}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'جاري البحث...' : 'ابحث'}
          </button>
        </form>
      )}

      {error && (
        <div className="error-message" dir="rtl">
          {error}
        </div>
      )}

      <div className="stats-main-section" dir="rtl">
        <div className="stats-chart-section">
          <h2 className="stats-chart-title">
            احصائيات {
              selectedTab === "damagedDevices" ? "الأجهزة التالفة" :
              selectedTab === "damagedPassports" ? "الجوازات التالفة" : "الحضور"
            }
          </h2>
          <div className="chart-container">
            {selectedTab === "attendance" ? (
              <AttendanceStats data={attendanceData} />
            ) : !loading && chartData.length > 0 ? (
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
            ) : !loading && (
              <div className="no-data-message">لا توجد بيانات للعرض</div>
            )}
          </div>
        </div>

        {selectedTab !== "attendance" && chartData.length > 0 && (
          <div className="stats-summary">
            {chartData.map((item, index) => (
              <div key={index} className="summary-card">
                <div>
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
                </div>
                <div>
                  <h3>{item.name}</h3>
                  <span>
                    {selectedTab === "damagedDevices" ? "عدد الأجهزة" : "عدد الجوازات"}: {item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}