import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Search } from 'lucide-react';
import './attendenceState.css';
import useAuthStore from './../store/store.js';
import Url from './../store/url.js';
import axiosInstance from './../intercepters/axiosInstance.js';

const AttendanceCard = ({ children, className = '' }) => (
  <div className={`attendance-card bg-white rounded-lg shadow-sm p-4 ${className}`}>
    {children}
  </div>
);

const AttendanceStats = () => {
  const { profile, accessToken } = useAuthStore();
  
  // Configure axios headers with the token
  const getAuthHeaders = () => ({
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  });

  const getYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getYesterdayDate());
  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [selectedOffice, setSelectedOffice] = useState('');
  const [governorates, setGovernorates] = useState([]);
  const [offices, setOffices] = useState([]);
  const [noDataMessage, setNoDataMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [governorateData, setGovernorateData] = useState({
    morning: [],
    evening: []
  });
  const [attendanceStats, setAttendanceStats] = useState({
    totalStaffCount: 0,
    totalStaffInOffice: 0,
    availableStaff: 0,
    availableStaffPercentage: 0,
    availableMorningShiftStaff: 0,
    morningShiftPercentage: 0,
    availableEveningShiftStaff: 0,
    eveningShiftPercentage: 0
  });

  // Fetch governorates list with auth
  const fetchGovernorates = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `${Url}/api/Governorate/dropdown`,
        getAuthHeaders()
      );
      setGovernorates(response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch governorates:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch offices for selected governorate with auth
  const fetchOffices = async (governorateId) => {
    if (!governorateId) {
      setOffices([]);
      setSelectedOffice('');
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `${Url}/api/Governorate/dropdown/${governorateId}`,
        getAuthHeaders()
      );
      if (response.data && response.data.length > 0 && response.data[0].offices) {
        setOffices(response.data[0].offices);
      } else {
        setOffices([]);
      }
      setSelectedOffice('');
    } catch (error) {
      console.error("Failed to fetch offices:", error);
      setOffices([]);
      setSelectedOffice('');
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance statistics with auth
  const fetchAttendanceStats = async () => {
    setNoDataMessage(false);
    try {
      const baseBody = {
        GovernorateId: selectedGovernorate || null,
        OfficeId: selectedOffice || null,
        StaffType: "",
        Date: `${selectedDate}T00:00:00Z`,
        PaginationParams: {
          PageNumber: 1,
          PageSize: 10
        }
      };

      if (!selectedDate) {
        setNoDataMessage(true);
        return;
      }

      const [response, morningResponse, eveningResponse] = await Promise.all([
        axiosInstance.post(`${Url}/api/Attendance/search/statistics`, {
          ...baseBody,
          WorkingHours: 3
        }, getAuthHeaders()),
        axiosInstance.post(`${Url}/api/Attendance/search/statistics`, {
          ...baseBody,
          WorkingHours: 1
        }, getAuthHeaders()),
        axiosInstance.post(`${Url}/api/Attendance/search/statistics`, {
          ...baseBody,
          WorkingHours: 2
        }, getAuthHeaders())
      ]);

      setAttendanceStats({
        totalStaffCount: response.data.totalStaffCount,
        totalStaffInOffice: response.data.totalStaffInOffice,
        availableStaff: response.data.availableStaff,
        availableStaffPercentage: response.data.availableStaffPercentage,
        availableMorningShiftStaff: morningResponse.data.availableStaff,
        morningShiftPercentage: morningResponse.data.availableStaffPercentage,
        availableEveningShiftStaff: eveningResponse.data.availableStaff,
        eveningShiftPercentage: eveningResponse.data.availableStaffPercentage
      });
    } catch (error) {
      console.error("Failed to fetch attendance statistics:", error);
    }
  };

  // Fetch governorate statistics with auth
  const fetchGovernorateStats = async (govList = []) => {
    try {
      const baseBody = {
        Date: `${selectedDate}T00:00:00Z`,
        PaginationParams: { PageNumber: 1, PageSize: 10 }
      };

      const morningStatsData = [];
      const eveningStatsData = [];

      const governoratesToUse = govList.length > 0 ? govList : governorates;

      for (const gov of governoratesToUse) {
        const [morningResponse, eveningResponse] = await Promise.all([
          axiosInstance.post(`${Url}/api/Attendance/search/statistics`, {
            ...baseBody,
            GovernorateId: gov.id,
            WorkingHours: 1
          }, getAuthHeaders()),
          axiosInstance.post(`${Url}/api/Attendance/search/statistics`, {
            ...baseBody,
            GovernorateId: gov.id,
            WorkingHours: 2
          }, getAuthHeaders())
        ]);

        morningStatsData.push({
          name: gov.name,
          value: morningResponse.data.availableStaff || 0
        });

        eveningStatsData.push({
          name: gov.name,
          value: eveningResponse.data.availableStaff || 0
        });
      }

      const sortedMorningData = morningStatsData.sort((a, b) => b.value - a.value);
      const sortedEveningData = eveningStatsData.sort((a, b) => b.value - a.value);
      
      setGovernorateData({
        morning: sortedMorningData,
        evening: sortedEveningData
      });
    } catch (error) {
      console.error("Failed to fetch governorate stats:", error);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const govs = await fetchGovernorates();
        await Promise.all([
          fetchGovernorateStats(govs),
          fetchAttendanceStats()
        ]);
      } catch (error) {
        console.error("Failed to initialize data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    initData();
  }, []);

  // Handle governorate change
  const handleGovernorateChange = async (e) => {
    const value = e.target.value;
    setSelectedGovernorate(value);
    if (value) {
      await fetchOffices(value);
    } else {
      setOffices([]);
      setSelectedOffice('');
    }
  };

  // Handle search button click
  const handleSearch = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAttendanceStats(),
        fetchGovernorateStats()
      ]);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Custom tooltip for charts
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

  // Render chart function
  const renderChart = (data, title) => (
    <AttendanceCard>
      <h3 className="attendance-chart-title text-xl mb-6 text-center font-bold">{title}</h3>
      <div className="bar-chart-container">
        <BarChart
          width={600}
          height={500}
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          barSize={20}
        >
          <XAxis 
            type="number"
            axisLine={false}
            tickLine={false}
            tick={false}
            domain={[0, 'dataMax + 5']}
          />
          <YAxis
            dataKey="name"
            type="category"
            axisLine={false}
            tickLine={false}
            tick={{
              fill: '#000000',
              fontSize: 14,
              dx: -10
            }}
            width={120}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar
            dataKey="value"
            fill="#6366f1"
            radius={[0, 4, 4, 0]}
            label={{
              position: 'right',
              fill: '#000000',
              fontSize: 14,
              dx: 10
            }}
          />
        </BarChart>
      </div>
    </AttendanceCard>
  );

  return (
    <div className="attendence-container-stats" dir="rtl">
      <div className="attendance-filters-stats flex gap-4 mb-6">
        <div className="attendance-filter flex-1">
          <label className="filter-label mb-2 block">المحافظة</label>
          <select
            value={selectedGovernorate}
            onChange={handleGovernorateChange}
            className="w-full p-2 border rounded"
            disabled={loading}
          >
            <option value="">اختر المحافظة</option>
            {governorates.map((gov) => (
              <option key={gov.id} value={gov.id}>
                {gov.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="attendance-filter flex-1">
          <label className="filter-label mb-2 block">المكتب</label>
          <select
            value={selectedOffice}
            onChange={(e) => setSelectedOffice(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={!selectedGovernorate || loading}
          >
            <option value="">اختر المكتب</option>
            {offices.map((office) => (
              <option key={office.id} value={office.id}>
                {office.name}
              </option>
            ))}
          </select>
        </div>

        <div className="attendance-filter flex-1">
          <label className="filter-label mb-2 block">التاريخ</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={loading}
          />
        </div>

        <div className="attendance-filter flex-1 flex items-end">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="attendance-search-button w-full"
          >
            <Search size={20} />
            {loading ? 'جاري البحث...' : 'ابحث'}
          </button>
        </div>
      </div>

      <div className="attendance-summary-cards attendance-card-container-stats flex flex-wrap gap-4 mb-6">
        <AttendanceCard className='card-attendence-stats-container'>
          <h3 className="attendance-summary-title text-lg mb-2">عدد المحطات الكلي</h3>
          <p className="attendance-summary-value text-3xl font-bold">
            {selectedOffice ? attendanceStats.totalStaffInOffice : attendanceStats.totalStaffCount}
          </p>
        </AttendanceCard>
        
        <AttendanceCard className='card-attendence-stats-container'>
          <h3 className="attendance-summary-title text-lg mb-2">عدد الحضور الكلي</h3>
          <p className="attendance-summary-value text-3xl font-bold">{attendanceStats.availableStaff}</p>
          <p className="attendance-percentage text-lg mt-2 text-gray-500">{attendanceStats.availableStaffPercentage}%</p>
        </AttendanceCard>
        
        <AttendanceCard className='card-attendence-stats-container'>
          <h3 className="attendance-summary-title text-lg mb-2">الموظفين في الشفت الصباحي</h3>
          <p className="attendance-summary-value text-3xl font-bold">{attendanceStats.availableMorningShiftStaff}</p>
          <p className="attendance-percentage text-lg mt-2 text-gray-500">{attendanceStats.morningShiftPercentage}%</p>
        </AttendanceCard>
        
        <AttendanceCard className='card-attendence-stats-container'>
          <h3 className="attendance-summary-title text-lg mb-2">الموظفين في الشفت المسائي</h3>
          <p className="attendance-summary-value text-3xl font-bold">{attendanceStats.availableEveningShiftStaff}</p>
          <p className="attendance-percentage text-lg mt-2 text-gray-500">{attendanceStats.eveningShiftPercentage}%</p>
        </AttendanceCard>
      </div>

      <div className="attendance-charts-stats grid grid-cols-1 md:grid-cols-2 gap-6">
        {noDataMessage ? (
          <div className="no-data-message">لا توجد بيانات للعرض</div>
        ) : (
          <>
            {renderChart(governorateData.morning, 'حضور الموظفين الصباحي')}
            {renderChart(governorateData.evening, 'حضور الموظفين المسائي')}
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceStats;