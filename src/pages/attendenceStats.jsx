import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Search } from 'lucide-react';
import './attendenceState.css';
import useAuthStore from './../store/store.js';
import axios from 'axios';
import Url from './../store/url.js';

const AttendanceCard = ({ children, className = '' }) => (
  <div className={`attendance-card bg-white rounded-lg shadow-sm p-4 ${className}`}>
    {children}
  </div>
);

const AttendanceStats = () => {
  const { profile } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [selectedOffice, setSelectedOffice] = useState('');
  const [governorates, setGovernorates] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [governorateData, setGovernorateData] = useState({
    morning: [],
    evening: []
  });
  const [attendanceStats, setAttendanceStats] = useState({
    totalStaffCount: 0,
    availableStaff: 0,
    availableStaffPercentage: 0,
    availableMorningShiftStaff: 0,
    morningShiftPercentage: 0,
    availableEveningShiftStaff: 0,
    eveningShiftPercentage: 0
  });

  const fetchGovernorates = async () => {
    try {
      const response = await axios.get(`${Url}/api/Governorate/dropdown`);
      setGovernorates(response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch governorates:", error);
      return [];
    }
  };

  const fetchOffices = async (governorateId) => {
    if (!governorateId) {
      setOffices([]);
      return;
    }
    try {
      const response = await axios.get(`${Url}/api/Office/dropdown?GovernorateId=${governorateId}`);
      setOffices(response.data);
    } catch (error) {
      console.error("Failed to fetch offices:", error);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const baseBody = {
        GovernorateId: selectedGovernorate || null,
        OfficeId: selectedOffice || null,
        StaffType: "",
        Date: selectedDate ? `${selectedDate}T10:00:00Z` : undefined,
        PaginationParams: {
          PageNumber: 1,
          PageSize: 10
        }
      };

      const [response, morningResponse, eveningResponse] = await Promise.all([
        axios.post(`${Url}/api/Attendance/search/statistics`, {
          ...baseBody,
          WorkingHours: 3
        }),
        axios.post(`${Url}/api/Attendance/search/statistics`, {
          ...baseBody,
          WorkingHours: 1
        }),
        axios.post(`${Url}/api/Attendance/search/statistics`, {
          ...baseBody,
          WorkingHours: 2
        })
      ]);

      setAttendanceStats({
        totalStaffCount: response.data.totalStaffCount,
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

  const fetchGovernorateStats = async (govList = []) => {
    try {
      const baseBody = {
        Date: selectedDate ? `${selectedDate}T10:00:00Z` : undefined,
        PaginationParams: { PageNumber: 1, PageSize: 10 }
      };

      const morningStatsData = [];
      const eveningStatsData = [];

      const governoratesToUse = govList.length > 0 ? govList : governorates;

      for (const gov of governoratesToUse) {
        const [morningResponse, eveningResponse] = await Promise.all([
          axios.post(`${Url}/api/Attendance/search/statistics`, {
            ...baseBody,
            GovernorateId: gov.id,
            WorkingHours: 1
          }),
          axios.post(`${Url}/api/Attendance/search/statistics`, {
            ...baseBody,
            GovernorateId: gov.id,
            WorkingHours: 2
          })
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

      setGovernorateData({
        morning: morningStatsData,
        evening: eveningStatsData
      });
    } catch (error) {
      console.error("Failed to fetch governorate stats:", error);
    }
  };

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

  const handleGovernorateChange = (e) => {
    const value = e.target.value;
    setSelectedGovernorate(value);
    setSelectedOffice('');
    if (value) {
      fetchOffices(value);
    } else {
      setOffices([]);
    }
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

  const renderChart = (data, title) => (
    <AttendanceCard>
      <h3 className="attendance-chart-title text-xl mb-6 text-center font-bold">{title}</h3>
      <div className="" style={{ height: '600px' }}>
        <BarChart
          width={800}
          height={550}
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 150, bottom: 10 }}
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
            width={140}
            tick={{
              fill: '#000000',
              fontSize: 14,
              dx: -35
            }}
            orientation="left"
            axisLine={false}
            tickLine={false}
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
              dx: 20
            }}
          />
        </BarChart>
      </div>
    </AttendanceCard>
  );

  return (
    <div className="" dir="rtl">
      <div className="attendance-filters-stats flex gap-4 mb-6">
        <div className="attendance-filter flex-1">
          <label className="filter-label mb-2 block">المحافظة</label>
          <select
            value={selectedGovernorate}
            onChange={handleGovernorateChange}
            className="w-full p-2 border rounded"
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
            disabled={!selectedGovernorate}
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
          />
        </div>

        <div className="attendance-filter flex-1 flex items-end">
          <button
            onClick={handleSearch}
            disabled={loading}
            className={`attendance-search-button w-full px-6 py-2 bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Search size={20} />
            {loading ? 'جاري البحث...' : 'ابحث'}
          </button>
        </div>
      </div>

      <div className="attendance-summary-cards attendance-card-container-stats flex flex-wrap gap-4 mb-6">
        <AttendanceCard className='card-attendence-stats-container'>
          <h3 className="attendance-summary-title text-lg mb-2">عدد المحطات الكلي</h3>
          <p className="attendance-summary-value text-3xl font-bold">{attendanceStats.totalStaffCount}</p>
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
        {renderChart(governorateData.morning, 'حضور الموظفين الصباحي')}
        {renderChart(governorateData.evening, 'حضور الموظفين المسائي')}
      </div>
    </div>
  );
};

export default AttendanceStats;