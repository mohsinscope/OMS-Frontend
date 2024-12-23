import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Search } from 'lucide-react';
import { DatePicker, Select } from 'antd';
import './attendenceState.css';
import useAuthStore from './../store/store.js';
import axios from 'axios';
import Url from './../store/url.js';

const { Option } = Select;

const AttendanceCard = ({ children, className = '' }) => (
  <div className={`attendance-card bg-white rounded-lg shadow-sm p-4 ${className}`}>
    {children}
  </div>
);

const AttendanceStats = () => {
  const { profile } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedGovernorate, setSelectedGovernorate] = useState(profile?.governorateId || null);
  const [selectedOffice, setSelectedOffice] = useState(profile?.officeId || null);
  const [governorates, setGovernorates] = useState([]);
  const [offices, setOffices] = useState([]);
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
    } catch (error) {
      console.error("Failed to fetch governorates:", error);
    }
  };

  const fetchOffices = async (governorateId) => {
    try {
      const response = await axios.get(`${Url}/api/Office/dropdown?GovernorateId=${governorateId}`);
      setOffices(response.data);
    } catch (error) {
      console.error("Failed to fetch offices:", error);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const body = {
        GovernorateId: profile?.role === 'Supervisor' ? profile?.governorateId : selectedGovernorate || undefined,
        OfficeId: profile?.role === 'Supervisor' ? profile?.officeId : selectedOffice || undefined,
        WorkingHours: 3,
        StaffType: "",
        Date: selectedDate ? `${selectedDate}T10:00:00Z` : undefined,
        PaginationParams: {
          PageNumber: 1,
          PageSize: 10
        }
      };

      const response = await axios.post(`${Url}/api/Attendance/search/statistics`, body);
      setAttendanceStats((prevStats) => ({
        ...prevStats,
        totalStaffCount: response.data.totalStaffCount,
        availableStaff: response.data.availableStaff,
        availableStaffPercentage: response.data.availableStaffPercentage
      }));

      const morningResponse = await axios.post(`${Url}/api/Attendance/search/statistics`, {
        ...body,
        WorkingHours: 1
      });
      setAttendanceStats((prevStats) => ({
        ...prevStats,
        availableMorningShiftStaff: morningResponse.data.availableStaff,
        morningShiftPercentage: morningResponse.data.availableStaffPercentage
      }));

      const eveningResponse = await axios.post(`${Url}/api/Attendance/search/statistics`, {
        ...body,
        WorkingHours: 2
      });
      setAttendanceStats((prevStats) => ({
        ...prevStats,
        availableEveningShiftStaff: eveningResponse.data.availableStaff,
        eveningShiftPercentage: eveningResponse.data.availableStaffPercentage
      }));
    } catch (error) {
      console.error("Failed to fetch attendance statistics:", error);
    }
  };

  const fetchGovernorateStats = async () => {
    try {
      const governorates = await axios.get(`${Url}/api/Governorate/dropdown`);
      const morningStatsData = [];
      const eveningStatsData = [];

      for (const gov of governorates.data) {
        const morningResponse = await axios.post(`${Url}/api/Attendance/search/statistics`, {
          GovernorateId: gov.id,
          WorkingHours: 1,
          Date: selectedDate ? `${selectedDate}T10:00:00Z` : undefined,
          PaginationParams: { PageNumber: 1, PageSize: 10 }
        });

        morningStatsData.push({
          name: decodeURIComponent(gov.name),
          value: morningResponse.data.availableStaff || 0
        });

        const eveningResponse = await axios.post(`${Url}/api/Attendance/search/statistics`, {
          GovernorateId: gov.id,
          WorkingHours: 2,
          Date: selectedDate ? `${selectedDate}T10:00:00Z` : undefined,
          PaginationParams: { PageNumber: 1, PageSize: 10 }
        });

        eveningStatsData.push({
          name: decodeURIComponent(gov.name),
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
    fetchGovernorates();
    if (profile?.role === 'Supervisor') {
      fetchOffices(profile.governorateId);
    }
    fetchAttendanceStats();
    fetchGovernorateStats();
  }, [selectedDate, selectedGovernorate, selectedOffice]);

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
      <div className="chart-container" style={{ height: '600px' }}>
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
    <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
      <div className="attendance-header flex justify-between items-center mb-6">
        <h1 className="attendance-title text-2xl font-bold">نظام إدارة المكاتب</h1>
      </div>

      <div className="attendance-filters-stats flex gap-4 mb-6">
        {profile?.role !== 'Supervisor' && (
          <>
            <div className="attendance-filter flex-1">
              <div className="filter-label mb-2">المحافظة</div>
              <Select
                value={selectedGovernorate}
                onChange={(value) => {
                  setSelectedGovernorate(value);
                  fetchOffices(value);
                }}
                className="w-full"
                placeholder="اختر المحافظة"
                allowClear
              >
                <Option value={null}>فارغ</Option>
                {governorates.map((gov) => (
                  <Option key={gov.id} value={gov.id}>
                    {gov.name}
                  </Option>
                ))}
              </Select>
            </div>
            <div className="attendance-filter flex-1">
              <div className="filter-label mb-2">المكتب</div>
              <Select
                value={selectedOffice}
                onChange={setSelectedOffice}
                className="w-full"
                placeholder="اختر المكتب"
                allowClear
              >
                <Option value={null}>فارغ</Option>
                {offices.map((office) => (
                  <Option key={office.id} value={office.id}>
                    {office.name}
                  </Option>
                ))}
              </Select>
            </div>
          </>
        )}
        <div className="attendance-filter flex-1">
          <div className="filter-label mb-2">التاريخ</div>
          <DatePicker
            onChange={(date, dateString) => setSelectedDate(dateString)}
            className="w-full"
            placeholder="اختر التاريخ"
          />
        </div>
        <div className="attendance-filter flex-1 flex items-end">
          <button
            onClick={fetchAttendanceStats}
            className="attendance-search-button w-full px-6 py-2 bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
          >
            <Search size={20} />
            ابحث
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
