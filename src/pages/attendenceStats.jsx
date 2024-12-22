import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Search } from 'lucide-react';
import './attendenceState.css';

const AttendanceCard = ({ children, className = '' }) => (
  <div className={`attendance-card bg-white rounded-lg shadow-sm p-4 ${className}`}>
    {children}
  </div>
);

const AttendanceStats = () => {
  const morningData = [
    { name: 'مدير', value: 8 },
    { name: 'موظف', value: 25 },
    { name: 'مشرف فني', value: 12 },
    { name: 'مساعد', value: 11 },
    { name: 'سكرتير', value: 34 },
    { name: 'مدرس', value: 17 },
    { name: 'مراقب', value: 13 },
    { name: 'طالب', value: 18 },
  ];

  const eveningData = [...morningData];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ 
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0'
        }}>
          <span style={{ color: '#000' }}>{payload[0].value}</span>
        </div>
      );
    }
    return null;
  };

  const renderChart = (data, title) => (
    <AttendanceCard>
      <h3 className="attendance-chart-title text-xl mb-4">{title}</h3>
      <div style={{ position: 'relative', right: '-40px' }}>
        <BarChart
          width={500}
          height={300}
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 120, bottom: 5 }}
        >
          <XAxis 
            type="number" 
            axisLine={{ stroke: '#000000' }}
            tickLine={false}
            tick={false}  // This removes the numbers
          />
          <YAxis 
            dataKey="name" 
            type="category"
            width={120}
            tick={{ 
              fill: '#000000', 
              fontSize: 12,
              dx: -30
            }}
            orientation="left"
            axisLine={{ stroke: '#000000' }}  // This adds the left border
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar 
            dataKey="value" 
            fill="#6366f1" 
            barSize={20}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </div>
    </AttendanceCard>
  );

  // Rest of the component stays exactly the same
  return (
    <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
      {/* Header Section */}
      <div className="attendance-header flex justify-between items-center mb-6">
        <h1 className="attendance-title text-2xl font-bold">نظام إدارة المكاتب</h1>
      </div>

      {/* Search and Filters Section */}
      <div className="attendance-filters-stats flex gap-4 mb-6">
        <div className="attendance-filter flex-1">
          <select className="attendance-select w-full p-2 border rounded">
            <option>المحافظة</option>
          </select>
        </div>
        <div className="attendance-filter flex-1">
          <select className="attendance-select w-full p-2 border rounded">
            <option>المكتب</option>
          </select>
        </div>
        <div className="attendance-filter flex-1">
          <input type="date" className="attendance-input-date w-full p-2 border rounded" />
        </div>
        <div className="attendance-filter flex-1">
          <input type="date" className="attendance-input-date w-full p-2 border rounded" />
        </div>
        <button className="attendance-search-button px-6 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2">
          <Search size={20} />
          ابحث
        </button>
      </div>

      {/* Summary Cards Section */}
      <div className="attendance-summary-cards attendance-card-container-stats flex flex-wrap gap-4 mb-6">
        <AttendanceCard className='card-attendence-stats-container'>
          <h3 className="attendance-summary-title text-lg mb-2">عدد المحطات الكلي</h3>
          <p className="attendance-summary-value text-3xl font-bold">918</p>
        </AttendanceCard>
        <AttendanceCard className='card-attendence-stats-container'>
          <h3 className="attendance-summary-title text-lg mb-2">عدد الحضور الكلي</h3>
          <p className="attendance-summary-value text-3xl font-bold">800</p>
        </AttendanceCard>
        <AttendanceCard className='card-attendence-stats-container'>
          <h3 className="attendance-summary-title text-lg mb-2">عدد الموظفين الصباحي</h3>
          <p className="attendance-summary-value text-3xl font-bold">400/800</p>
        </AttendanceCard>
        <AttendanceCard className='card-attendence-stats-container'>
          <h3 className="attendance-summary-title text-lg mb-2">عدد الموظفين المسائي</h3>
          <p className="attendance-summary-value text-3xl font-bold">400/800</p>
        </AttendanceCard>
      </div>

      {/* Charts Section */}
      <div className="attendance-charts-stats grid grid-cols-1 md:grid-cols-2 gap-6">
      <AttendanceCard className="attendance-additional-info mt-6">
        <h3 className="attendance-additional-title text-xl mb-2">عدد المكاتب</h3>
        <p className="attendance-additional-value text-3xl font-bold">51</p>
      </AttendanceCard>
        {renderChart(morningData, 'حضور الموظفين الصباحي')}
        {renderChart(eveningData, 'حضور الموظفين المسائي')}
      </div>

      {/* Additional Information Card */}
    </div>
  );
};

export default AttendanceStats;