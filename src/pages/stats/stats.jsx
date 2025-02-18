import React, { useEffect, useState, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { DatePicker } from "antd";
import './stats.css';
import axiosInstance from '../../intercepters/axiosInstance.js';
import Url from "../../store/url.js";
import useAuthStore from "../../store/store.js";
import AttendanceStats from './attendenceStats.jsx';
import ExpensesStats  from './expensessStats.jsx';
import AttendanceUnavailable from './attendenceUnavailable.jsx';
import CabinetAttendence from './CabinetAttendence.jsx';
import dayjs from "dayjs";


import './stats.css';
const COLORS = [
  "#4CAF50", "#F44336", "#2196F3", "#FFC107", "#9C27B0",
  "#FF5722", "#00BCD4", "#E91E63", "#3F51B5", "#CDDC39"
];

export default function Stats() {
  const { profile, accessToken, isSidebarCollapsed,permissions } = useAuthStore();
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
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [workingHours, setWorkingHours] = useState(3);
  const [officeAttendanceData, setOfficeAttendanceData] = useState(null);
  const hasAttendencePermission = permissions.includes("Sa"); 
  const hasPassportPermission = permissions.includes("Sp");  
  const hasDecivePermission = permissions.includes("Sd");  
  const hasExpensePermission = permissions.includes("Se");  

  const fetchGovernorates = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`${Url}/api/Governorate/dropdown`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      setGovernorates(response.data);
    } catch (error) {
      setError("Failed to fetch governorates. Please try again later.");
      console.error("Governorates fetch error:", error);
    }
  }, [accessToken]);

  const fetchOffices = useCallback(async (governorateId) => {
    if (!governorateId) {
      setAvailableOffices([]);
      setSelectedOffice(null);
      return;
    }

    try {
      const response = await axiosInstance.get(`${Url}/api/Governorate/dropdown/${governorateId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      if (response.data && response.data[0] && response.data[0].offices) {
        setAvailableOffices(response.data[0].offices);
      }
      setSelectedOffice(null);
    } catch (error) {
      setError("Failed to fetch offices. Please try again later.");
      console.error("Offices fetch error:", error);
    }
  }, [accessToken]);

  const handleGovernorateChange = useCallback((governorateId) => {
    setSelectedGovernorate(governorateId || null);
    if (governorateId) {
      fetchOffices(governorateId);
    } else {
      setAvailableOffices([]);
      setSelectedOffice(null);
    }
  }, [fetchOffices]);

  const fetchTypesData = useCallback(async () => {
    try {
      const [deviceTypesRes, passportTypesRes] = await Promise.all([
        axiosInstance.get(`${Url}/api/damageddevicetype/all`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }),
        axiosInstance.get(`${Url}/api/damagedtype/all`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        })
      ]);
      
      setDamagedDeviceTypes(deviceTypesRes.data);
      setDamagedPassportTypes(passportTypesRes.data);
      return true;
    } catch (error) {
      setError("Failed to fetch types data. Please try again later.");
      console.error("Types data fetch error:", error);
      return false;
    }
  }, [accessToken]);

  const fetchStatisticsData = useCallback(async () => {
    if (selectedTab === "attendance") return;
    
    if (selectedTab === "officeAttendene") {
      setLoading(true);
      setError(null);
      try {
        if (!selectedOffice) {
          setError("الرجاء اختيار المكتب");
          return;
        }
        if (!selectedDate) {
          setError("الرجاء اختيار التاريخ");
          return;
        }
              // Use selectedDate (or default to today) and format it natively
      const dateObj = selectedDate ? new Date(selectedDate) : new Date();
      const year = dateObj.getFullYear();
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const day = dateObj.getDate().toString().padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}T00:00:00Z`;

        const response = await axiosInstance.post(`${Url}/api/Attendance/statistics/office`, {
          officeId: selectedOffice,
          workingHours: workingHours,
          date: formattedDate,
        }, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        setOfficeAttendanceData(response.data);
        
        // Set chart data for the main pie chart
        setChartData([
          { name: 'عدد الحضور الكلي ', value: response.data.availableStaffInOffice },
          { name: 'عدد الغياب', value: response.data.totalStaffInOffice - response.data.availableStaffInOffice}
        ]);
        
        setTotalItems(response.data.totalStaffInOffice);
      } catch (error) {
        setError("Failed to fetch office attendance statistics. Please try again later.");
        console.error("Office attendance statistics fetch error:", error);
      } finally {
        setLoading(false);
      }
      return;
    }
    
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
          StartDate: startDate ? `${startDate.format('YYYY-MM-DD')}T00:00:00Z` : null,
          EndDate: endDate ? `${endDate.format('YYYY-MM-DD')}T00:00:00Z` : null,
          [selectedTab === "damagedDevices" ? "DamagedDeviceTypeId" : "DamagedTypeId"]: type.id
        };
        return axiosInstance.post(endpoint, body, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
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
  }, [selectedTab, damagedDeviceTypes, damagedPassportTypes, selectedOffice, selectedGovernorate, startDate, endDate, accessToken, workingHours, selectedDate]);

  const handleTabChange = useCallback((tab) => {
    if (tab === selectedTab) return;

    // Clear any previous data and errors
    setChartData([]);
    setTotalItems(0);
    setError(null);
    setSelectedTab(tab);

    // Reset filter states to null for a fresh search
    setStartDate(null);
    setEndDate(null);
    setSelectedDate(null);
    setSelectedGovernorate(null);
    setSelectedOffice(null);
    setOfficeAttendanceData(null);
    if (tab === "officeAttendene") {
      setSelectedDate(dayjs());
    } else {
      setSelectedDate(null);
    }
  }, [selectedTab]);
 // Automatically call the API with null payload when the damaged devices/passports tab is active
 useEffect(() => {
  // Check if the current tab is one of the two
  if (selectedTab === "damagedDevices" || selectedTab === "damagedPassports") {
    // If you want to make sure the states are null, you can reset them here as well:
    setSelectedGovernorate(null);
    setSelectedOffice(null);
    setStartDate(null);
    setEndDate(null);
    // Now call fetchStatisticsData to post the default payload
    fetchStatisticsData();
  }
}, [selectedTab]);
  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchGovernorates();
        await fetchTypesData();
      } catch (error) {
        console.error("Initialization error:", error);
        setError("Failed to initialize data. Please refresh the page.");
      }
    };
    
    initializeData();
  }, [fetchGovernorates, fetchTypesData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchStatisticsData();
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip bg-white shadow-lg p-2 rounded">
          <p className="text-sm">{payload[0].payload.name}</p>
          <p className="text-sm font-bold">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };
  const AttendanceDonutChart = ({ title, total, present }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm" style={{ display: 'flex', justifyContent: 'space-between', alignItems: "center" }}>
      <div>
        <h3 className="text-xl font-bold">{title} {total}</h3>
        <div className="text-lg font-bold mt-4">
          الحاضرون {present}
        </div>
      </div>
      <div>
        <PieChart width={200} height={200}>
          <Pie
            data={[
              { name: 'عددالمحطات الفارغة', value: total - present },
              { name: 'الحاضرون', value: present }
            ]}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
          >
            <Cell fill="#FF5252" />
            <Cell fill="#4CAF50" />
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </div>
    </div>
  );

  return (
    <div className={`stats-container ${isSidebarCollapsed ? "stats-container-collapsed" : ""}`}>
      <div className="stats-navbar" dir="rtl">
        <div className="small-stats-navbar-warber">
          <ul>
            {hasDecivePermission &&

            <li
              className={`stats-navbar-item ${selectedTab === "damagedDevices" ? "active" : ""}`}
              onClick={() => handleTabChange("damagedDevices")}
            >
              الأجهزة التالفة
            </li>

            
            }
            {hasPassportPermission&& 
            
            <li
              className={`stats-navbar-item ${selectedTab === "damagedPassports" ? "active" : ""}`}
              onClick={() => handleTabChange("damagedPassports")}
            >
              الجوازات التالفة
            </li>
            
            }
            {hasAttendencePermission &&
            <>
            
                  <li
                  className={`stats-navbar-item ${selectedTab === "officeAttendene" ? "active" : ""}`}
                  onClick={() => handleTabChange("officeAttendene")}
                >
                   تقرير حضور الموظفين حسب المكتب
                </li>
                <li
                  className={`stats-navbar-item ${selectedTab === "attendance" ? "active" : ""}`}
                  onClick={() => handleTabChange("attendance")}
                >
                  التقرير العام للحضور
                
                </li>
                <li
              className={`stats-navbar-item ${selectedTab === "attendanceUnavailable" ? "active" : ""}`}
              onClick={() => handleTabChange("attendanceUnavailable")}
            >
              تقرير التزام المكاتب
            </li>
            <li
              className={`stats-navbar-item ${selectedTab === "cabinet-attendence" ? "active" : ""}`}
              onClick={() => handleTabChange("cabinet-attendence")}
            >
              تقرير حضور الاقسام
            </li>
            </>
            
            }


          {hasExpensePermission&&
              <li
              className={`stats-navbar-item ${selectedTab === "expenses" ? "active" : ""}`}
              onClick={() => handleTabChange("expenses")}
            >
              احصائيات المصاريف
            </li>
          }
        
          
          </ul>
        </div>
      </div>
  
      {selectedTab === "expenses" ? (
        <ExpensesStats />
      ) : 
      selectedTab === "cabinet-attendence" ? (
        <CabinetAttendence />
      ) :
      
      selectedTab === "attendance" ? (
        <AttendanceStats data={attendanceData} />
      ) : selectedTab === "attendanceUnavailable" ? (
        <AttendanceUnavailable />
      ) : (
        <>
          <form onSubmit={handleSubmit} className="stats-form" dir="rtl">
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
  
            {(selectedTab === "damagedDevices" || selectedTab === "damagedPassports") ? (
              <>
                <div className="form-group">
                  <label>التاريخ من</label>
                  <DatePicker
                    value={startDate}
                    onChange={(date) => setStartDate(date)}
                    className="form-control"
                    placeholder="اختر التاريخ"
                  />
                </div>
                <div className="form-group">
                  <label>التاريخ الى</label>
                  <DatePicker
                    value={endDate}
                    onChange={(date) => setEndDate(date)}
                    className="form-control"
                    placeholder="اختر التاريخ"
                  />
                </div>
              </>
            ) : selectedTab === "officeAttendene" && (
              <>
                <div className="form-group">
                  <label>وقت الدوام</label>
                  <select
                    value={workingHours}
                    onChange={(e) => setWorkingHours(Number(e.target.value))}
                    className="form-control"
                  >
                    <option value={1}>صباحي</option>
                    <option value={2}>مسائي</option>
                    <option value={3}>الكل</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>التاريخ</label>
                  <DatePicker
                    value={selectedDate}
                    onChange={(date) => setSelectedDate(date)}
                    className="form-control"
                    placeholder="اختر التاريخ"
                  />
                </div>
              </>
            )}
  
            <button type="submit" className="search-button" disabled={loading}>
              {loading ? 'جاري البحث...' : 'ابحث'}
            </button>
          </form>
  
          {error && (
            <div className="error-message" dir="rtl">
              {error}
            </div>
          )}
  
          <h2 className="stats-chart-title" dir="rtl" style={{marginRight:"20px"}}>
            احصائيات {
              selectedTab === "damagedDevices" ? "الأجهزة التالفة" :
              selectedTab === "damagedPassports" ? "الجوازات التالفة" :
              selectedTab === "officeAttendene" ? "حضور المكتب" :
              selectedTab === "attendanceUnavailable" ? "مكاتب الغياب" :
              selectedTab === "expenses" ? "المصاريف" : "الحضور"
            }
          </h2>
  
          <div className="stats-main-section" dir="rtl">
            <div className="stats-chart-section">
              <div className="chart-container">
                {!loading && chartData.length > 0 ? (
                  <>
                    <PieChart width={400} height={400}>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={100}
                        outerRadius={150}
                        paddingAngle={0}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                    <h3 className="text-center mt-4">
                      {selectedTab === "officeAttendene" ? (
                        `إجمالي عدد المحطات: ${totalItems} عدد الحضور الكلي : ${officeAttendanceData?.availableStaffInOffice}`
                      ) : (
                        `إجمالي ${selectedTab === "damagedDevices" ? "الأجهزة التالفة" : "الجوازات التالفة"}: ${totalItems}`
                      )}
                    </h3>
                  </>
                ) : !loading && (
                  <div className="no-data-message">لا توجد بيانات للعرض</div>
                )}
              </div>
            </div>
  
            {selectedTab === "officeAttendene" && officeAttendanceData ? (
              <div className="stats-summary">
                <div className="summary-card-attendence">
                  <AttendanceDonutChart 
                    title="محطات الاستلام"
                    total={officeAttendanceData.receivingStaffTotal}
                    present={officeAttendanceData.receivingStaffAvailable}
                  />
                </div>
                <div className="summary-card-attendence">
                  <AttendanceDonutChart 
                    title="محطات الحسابات"
                    total={officeAttendanceData.accountStaffTotal}
                    present={officeAttendanceData.accountStaffAvailable}
                  />
                </div>
                <div className="summary-card-attendence">
                  <AttendanceDonutChart 
                    title="محطات الطباعة"
                    total={officeAttendanceData.printingStaffTotal}
                    present={officeAttendanceData.printingStaffAvailable}
                  />
                </div>
                <div className="summary-card-attendence">
                  <AttendanceDonutChart 
                    title="محطات الجودة"
                    total={officeAttendanceData.qualityStaffTotal}
                    present={officeAttendanceData.qualityStaffAvailable}
                  />
                </div>
                <div className="summary-card-attendence">
                  <AttendanceDonutChart 
                    title="محطات التسليم"
                    total={officeAttendanceData.deliveryStaffTotal}
                    present={officeAttendanceData.deliveryStaffAvailable}
                  />
                </div>
              </div>
            ) : selectedTab !== "attendance" && selectedTab !== "officeAttendene" && chartData.length > 0 && (
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
                          paddingAngle={0}
                          dataKey="value"
                        >
                          <Cell fill={COLORS[index % COLORS.length]} />
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
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
        </>
      )}
    </div>
  );}