import React, { useState, useEffect } from 'react';
import { Building2, Clock, DollarSign, Bell, FileCheck, BookX, MonitorX } from 'lucide-react';
import { CartesianGrid, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import './landingPage.css';
import useAuthStore from './../store/store.js';
import { Link } from 'react-router-dom';
import axiosInstance from './../intercepters/axiosInstance.js';
import Url from './../store/url.js';
import Icons from './../reusable elements/icons.jsx';
import IraqMap from './../reusable elements/IraqMap.jsx';
export default function LandingPage() {
  const { isSidebarCollapsed, permissions } = useAuthStore();

  // A simple inline FeatureItem component to avoid undefined errors.
  const FeatureItem = ({ icon, title }) => (
    <div className="feature-item">
      {icon}
      <span>{title}</span>
    </div>
  );

  // Check permissions
  const hasDBPermission = permissions.includes("DB");
  const hasDPrPermission = permissions.includes("DPr");
  const hasArPermission = permissions.includes("Ar");
  const hasEXrPermission = permissions.includes("EXr");
  const hasDDrPermission = permissions.includes("DDr");
  const [count, setCount] = useState(0);
  const linkStyle = {
    textDecoration: 'none',
    color: 'inherit'
  };

  // State for dashboard statistics
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // State for the last seven days attendance data
  const [attendanceData, setAttendanceData] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // State for animated counters
  const [counters, setCounters] = useState({});

  // Fetch general dashboard statistics
  useEffect(() => {
    if (hasDBPermission) {
      setLoadingStats(true);
      axiosInstance
        .get(`${Url}/api/Dashboard/Statistics`)
        .then(response => {
          setDashboardStats(response.data);
          setLoadingStats(false);
        })
        .catch(error => {
          console.error("Error fetching dashboard stats:", error);
          setLoadingStats(false);
        });
    }
  }, [hasDBPermission]);
  
  // Fetch the last seven days attendance data
  useEffect(() => {
    if (hasDBPermission) {
      setLoadingAttendance(true);
      axiosInstance
        .get(`${Url}/api/Dashboard/last-seven-days-attendance`)
        .then(response => {
          // Transform the data to include a "day" property (day of month as string) and "value" for attendance percentage
          const transformedData = response.data.dailyAttendance.map(item => ({
            day: new Date(item.date).getDate().toString(),
            value: item.attendancePercentage
          }));
          setAttendanceData(transformedData);
          setLoadingAttendance(false);
        })
        .catch(error => {
          console.error("Error fetching attendance data:", error);
          setLoadingAttendance(false);
        });
    }
  }, [hasDBPermission]);

  // Animate counters when dashboardStats is loaded
  useEffect(() => {
    if (dashboardStats) {
      // Initialize counters to zero for each property we want to animate.
      const initialCounters = {
        totalOffices: 0,
        totalGovernorates: 0,
        totalDamagedPassportsToday: 0,
        attendancePercentage: 0,
        totalStaffInAllOffices: 0,
        totalReceivingStaff: 0,
        totalAccountStaff: 0,
        totalPrintingStaff: 0,
        totalQualityStaff: 0,
        totalDeliveryStaff: 0
      };
      setCounters(initialCounters);

      // For each property, animate from 0 to the actual value.
      Object.keys(initialCounters).forEach(key => {
        let startValue = 0;
        const endValue = dashboardStats[key];
        const duration = 650; // Duration of 2 seconds
        const stepTime = 50; // Update every 50ms
        const increment = endValue / (duration / stepTime);

        const interval = setInterval(() => {
          startValue += increment;
          if (startValue >= endValue) {
            startValue = endValue;
            clearInterval(interval);
          }
          setCounters(prev => ({ ...prev, [key]: Math.floor(startValue) }));
        }, stepTime);
      });
    }
  }, [dashboardStats]);

  // Staff distribution data for the pie chart
  const staffData = dashboardStats ? [
    { name: 'موظفي الاستلام', value: dashboardStats.totalReceivingStaff },
    { name: 'موظفي المحاسبة', value: dashboardStats.totalAccountStaff },
    { name: 'موظفي الطباعة', value: dashboardStats.totalPrintingStaff },
    { name: 'موظفي الجودة', value: dashboardStats.totalQualityStaff },
    { name: 'موظفي التسليم', value: dashboardStats.totalDeliveryStaff }
  ] : [];

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    hasDBPermission ? (
      <div className={`db_stats_container ${isSidebarCollapsed ? "sidebar-collapseddb" : ""}`} dir='rtl'>
        {loadingStats ? (
          <div className="db_loading">
            <div className="db_loading_spinner"></div>
            <p>جاري تحميل البيانات...</p>
          </div>
        ) : !dashboardStats ? (
          <div className="db_error_message">
            <Building2 size={24} />
            <p>عذراً، حدث خطأ في تحميل البيانات. يرجى المحاولة مرة أخرى.</p>
          </div>
        ) : (
          <>
            {/* Main statistics cards */}
            <div className="db_main_stats" dir="rtl">
              {/* Offices and Governorates Container */}
              <div className="attendance_damaged_container">
                {/* Offices Card */}
                <div className="db_main_card">
                  <h2 className="db_stat_label1" style={{ textAlign: "center" }}>عدد المكاتب الكلي</h2>
                  <div className="db_main_stat">
                    <div className="db_stat_icon">
                      <Building2 size={60} />
                    </div>
                    <div className="db_stat_content">
                      <span className="db_stat_value">{counters.totalOffices}</span>
                    </div>
                  </div>
                </div>

                {/* Governorates Card */}
                <div className="db_main_card">
                  <h2 className="db_stat_label1" style={{ textAlign: "center" }}>عدد المحافظات الكلي</h2>
                  <div className="db_main_stat">
                    <div >
                      <IraqMap/>
                    </div>
                    <div className="db_stat_content">
                      <span className="db_stat_value">18</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance and Damaged Passports Container */}
              <div className="attendance_damaged_container">
                {/* Damaged Passports Card */}
                <div className="db_main_card damaged_passport_card">
                  <h2 className="db_stat_label1" style={{ textAlign: "center" }}>عدد الجوازات التالفة خلال الشهر الحالي</h2>
                  <div className="db_main_stat">
                    <div className="db_stat_icon">
                      <Icons type='passport' width={60} height={60} />
                    </div>
                    <div className="db_stat_content">
                      <span className="db_stat_value">{counters.totalDamagedPassportsToday}</span>
                    </div>
                  </div>
                </div>

                {/* Attendance Card */}
                <div className="db_main_card4 persentage_staff_card">
                  <h2 className="db_stat_label1" style={{ textAlign: "center" }}>نسبة الحضور موظفي الجوازات</h2>
                  <div className="db_main_stat">
                    <div className="db_stat_icon">
                      <Icons type='person' width={60} height={60}/>
                    </div>
                    <div className="db_stat_content">
                      <span className="db_stat_value">{counters.attendancePercentage}%</span>
                    </div>
                    <div className="db_percentage_bar_persentage">
                      <div
                        className="db_percentage_fill_persentage"
                        style={{
                          width: `${dashboardStats.attendancePercentage}%`,
                          '--width': `${dashboardStats.attendancePercentage}%`
                        }}
                      >
                        <div className="db_percentage_wave"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Staff Statistics Card */}
              <div className="db_main_card">
                <div className="db_main_stat">
                  <div className="db_stat_content">
                    <span className="db_stat_value">{counters.totalStaffInAllOffices}</span>
                    <span className="db_stat_label">عدد الكابينات الكلي</span>
                  </div>
                </div>

                <div className="db_stats_grid">
                  <div className="db_sub_stat">
                    <div className="db_stat_icon">
                      <Clock size={20} />
                    </div>
                    <div className="db_stat_content">
                      <span className="db_stat_value">{counters.totalReceivingStaff}</span>
                      <span className="db_stat_label"> كابينات الاستلام</span>
                    </div>
                  </div>

                  <div className="db_sub_stat">
                    <div className="db_stat_icon">
                      <DollarSign size={20} />
                    </div>
                    <div className="db_stat_content">
                      <span className="db_stat_value">{counters.totalAccountStaff}</span>
                      <span className="db_stat_label"> كابينات الحسابات</span>
                    </div>
                  </div>

                  <div className="db_sub_stat">
                    <div className="db_stat_icon">
                      <Icons type='printer' size={20} />
                    </div>
                    <div className="db_stat_content">
                      <span className="db_stat_value">{counters.totalPrintingStaff}</span>
                      <span className="db_stat_label"> كابينات الطباعة</span>
                    </div>
                  </div>

                  <div className="db_sub_stat">
                    <div className="db_stat_icon">
                      <MonitorX size={20} />
                    </div>
                    <div className="db_stat_content">
                      <span className="db_stat_value">{counters.totalQualityStaff}</span>
                      <span className="db_stat_label"> كابينات الجودة</span>
                    </div>
                  </div>

                  <div className="db_sub_stat">
                    <div className="db_stat_icon">
                      <Icons type='delivery' size={20} />
                    </div>
                    <div className="db_stat_content">
                      <span className="db_stat_value">{counters.totalDeliveryStaff}</span>
                      <span className="db_stat_label"> كابينات التسليم</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="db_charts_container">
              {/* Staff Distribution Pie Chart */}
              <div className="db_chart_card">
                <h3 className="db_chart_title">توزيع الموظفين حسب الأقسام</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={staffData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {staffData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontFamily: 'Tajawal' }} />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      formatter={(value) => <span style={{ fontFamily: 'Tajawal' }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Weekly Attendance Line Chart */}
              <div className="db_chart_card">
                <h3 className="db_chart_title">نسبة الحضور الاسبوعي</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={attendanceData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="day"
                      stroke="#64748b"
                      tickFormatter={(value) => `يوم ${value}`}
                    />
                    <YAxis
                      stroke="#64748b"
                      // Adjust the domain if needed; here we assume percentages might exceed 100.
                      domain={[0, 150]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        fontFamily: 'Tajawal',
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [`${value}%`, 'نسبة الحضور']}
                      labelFormatter={(label) => `يوم ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="db_stats_footer">
              <Clock size={16} />
              <span>{new Date().toLocaleString('en')} : اخر تحديث</span>
            </div>
          </>
        )}
      </div>
    ) : (
      <div className={`landing-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`} dir="rtl">
        <div className="content-wrapper">
          {/* Header */}
          <div className="header-title">
            <h1 className="title" style={{ textAlign: "center" }}>
              اهلا بكم في نظام إدارة المكاتب
            </h1>
          </div>

          {/* Features List */}
          <div className="features-list">
            {hasEXrPermission && (
              <Link to="/supervisor/Expensess" style={linkStyle}>
                <FeatureItem
                  icon={<DollarSign className="feature-icon" style={{ marginLeft: "20px" }} />}
                  title="ادارة المصاريف"
                />
              </Link>
            )}
            {hasArPermission && (
              <Link to="/supervisor/Attendence" style={linkStyle}>
                <FeatureItem
                  icon={<Clock className="feature-icon" style={{ marginLeft: "20px" }} />}
                  title="ادارة الحضور"
                />
              </Link>
            )}
            {hasDPrPermission && (
              <Link to="/supervisor/damagedpasportshistory" style={linkStyle}>
                <FeatureItem
                  icon={<BookX className="feature-icon" style={{ marginLeft: "20px" }} />}
                  title="الجوازات التالفة"
                />
              </Link>
            )}
            {hasDDrPermission && (
              <Link to="/supervisor/damegedDevices" style={linkStyle}>
                <FeatureItem
                  icon={<MonitorX className="feature-icon" style={{ marginLeft: "20px" }} />}
                  title="الاجهزة التالفة"
                />
              </Link>
            )}
          </div>

          <p className="subtitle" style={{ textAlign: "center", marginTop: "10px" }}>
            تم تطوير الموقع من قبل مطوري شركة سكوب سكاي
          </p>
        </div>
      </div>
    )
  );
}