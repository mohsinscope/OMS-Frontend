import React, { useState, useEffect, useMemo } from 'react';
import { Building2, Clock, DollarSign, Bell, FileCheck, BookX, MonitorX, Sun, Moon, Users } from 'lucide-react';
import { CartesianGrid, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import './landingPage.css';
import useAuthStore from './../store/store.js';
import { Link } from 'react-router-dom';
import axiosInstance from './../intercepters/axiosInstance.js';
import Url from './../store/url.js';
import Icons from './../reusable elements/icons.jsx';
import IraqMap from './../reusable elements/IraqMap.jsx';

// Enhanced Progress Bar Component
const EnhancedProgressBar = ({ percentage, color = "green", showWave = true }) => {
  const getColorStyles = (color) => {
    switch (color) {
      case 'blue':
        return {
          background: 'linear-gradient(90deg, #3b82f6, #2563eb, #1d4ed8)',
          waveColor: 'rgba(59, 130, 246, 0.5)',
          bgColor: '#dbeafe'
        };
      case 'orange':
        return {
          background: 'linear-gradient(90deg, #f59e0b, #d97706, #b45309)',
          waveColor: 'rgba(245, 158, 11, 0.5)',
          bgColor: '#fed7aa'
        };
      default:
        return {
          background: 'linear-gradient(90deg, #10b981, #059669, #047857)',
          waveColor: 'rgba(16, 185, 129, 0.5)',
          bgColor: '#d1fae5'
        };
    }
  };

  const styles = getColorStyles(color);

  return (
    <div 
      className="enhanced-progress-bar"
      style={{ backgroundColor: styles.bgColor }}
    >
      <div
        className="enhanced-progress-fill"
        style={{
          width: `${percentage}%`,
          background: styles.background,
          '--width': `${percentage}%`
        }}
      >
        {showWave && (
          <div
            className="enhanced-progress-wave"
            style={{ background: `linear-gradient(to right, transparent, ${styles.waveColor}, transparent)` }}
          />
        )}
        <div className="enhanced-progress-shine" />
      </div>
      <div className="enhanced-progress-text">
        <span>{percentage}%</span>
      </div>
    </div>
  );
};

// Individual Attendance Item Component
const AttendanceItem = ({ icon: Icon, title, percentage, color, description }) => (
  <div className="enhanced-attendance-item">
    <div className="enhanced-attendance-header">
      <div className="enhanced-attendance-icon-wrapper">
        <div className={`enhanced-attendance-icon enhanced-attendance-icon-${color}`}>
          <Icon size={24} />
        </div>
        <div className="enhanced-attendance-title-wrapper">
          <h3 className="enhanced-attendance-title">{title}</h3>
          {description && (
            <p className="enhanced-attendance-description">{description}</p>
          )}
        </div>
      </div>
      <div className={`enhanced-attendance-percentage enhanced-attendance-percentage-${color}`}>
        {percentage}%
      </div>
    </div>
    <EnhancedProgressBar percentage={percentage} color={color} />
  </div>
);

export default function LandingPage() {
  const { isSidebarCollapsed, permissions } = useAuthStore();

  // Memoize FeatureItem to avoid unnecessary re-renders
  const FeatureItem = React.memo(({ icon, title }) => (
    <div className="feature-item">
      {icon}
      <span>{title}</span>
    </div>
  ));

  // Check permissions
  const hasDBPermission = permissions.includes("DB");
  const hasDPrPermission = permissions.includes("DPr");
  const hasArPermission = permissions.includes("Ar");
  const hasEXrPermission = permissions.includes("EXr");
  const hasDDrPermission = permissions.includes("DDr");
  const [count, setCount] = useState(0);
  
  // Memoize linkStyle so the object is created only once
  const linkStyle = useMemo(() => ({
    textDecoration: 'none',
    color: 'inherit'
  }), []);

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
        totalDeliveryStaff: 0,
        morningAttendancePercentage:0,
        eveningAttendancePercentage:0,
        totalEmbassies:0
      };
      setCounters(initialCounters);

      // For each property, animate from 0 to the actual value.
      Object.keys(initialCounters).forEach(key => {
        let startValue = 0;
        const endValue = dashboardStats[key];
        const duration = 450; // Duration in ms
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

  // Memoize staff distribution data for the pie chart
  const staffData = useMemo(() => {
    return dashboardStats ? [
      { name: 'موظفي الاستلام', value: dashboardStats.totalReceivingStaff },
      { name: 'موظفي المحاسبة', value: dashboardStats.totalAccountStaff },
      { name: 'موظفي الطباعة', value: dashboardStats.totalPrintingStaff },
      { name: 'موظفي الجودة', value: dashboardStats.totalQualityStaff },
      { name: 'موظفي التسليم', value: dashboardStats.totalDeliveryStaff }
    ] : [];
  }, [dashboardStats]);

  // Memoize COLORS array so it isn't re-created on every render
  const COLORS = useMemo(() => ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'], []);

  // Memoize attendance data for the enhanced cards
  const attendanceItemsData = useMemo(() => {
    if (!dashboardStats) return [];
    
    return [
      {
        icon: Users,
        title: "إجمالي نسبة الحضور",
        description: "الصباحي والمسائي معاً",
        percentage: counters.attendancePercentage || 0,
        color: "green"
      },
      {
        icon: Sun,
        title: "نسبة الحضور الصباحي",
        description: "الدوام الصباحي فقط",
        percentage: counters.morningAttendancePercentage || 0,
        color: "blue"
      },
      {
        icon: Moon,
        title: "نسبة الحضور المسائي", 
        description: "الدوام المسائي فقط",
        percentage: counters.eveningAttendancePercentage || 0,
        color: "orange"
      }
    ];
  }, [counters, dashboardStats]);

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
                {/* Governorates Card */}
                <div className="db_main_card">
                  <div className="db_main_stat">
                    <div >
                      <IraqMap/>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",width:"100%",justifyContent:"space-between"}}>
                    <h2 className="db_stat_label1" style={{ textAlign: "center" }}>عدد المحافظات الكلي</h2>
                    <div className="db_stat_content">
                      <span className="db_stat_value">
                        {/* {counters.totalGovernorates} */}
                        18
                        </span>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",width:"100%",justifyContent:"space-between"}}>
                    <h2 className="db_stat_label1" style={{ textAlign: "center" }}>  عدد المكاتب داخل العراق</h2>
                    <div className="db_stat_content">
                      <span className="db_stat_value">{counters.totalOffices}</span>
                    </div>
                  </div>
                     <div style={{display:"flex",flexDirection:"column",width:"100%",justifyContent:"space-between"}}>
                    <h2 className="db_stat_label1" style={{ textAlign: "center" }}>  عدد السفارات</h2>
                    <div className="db_stat_content">
                      <span className="db_stat_value">{counters.totalEmbassies}</span>
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

                {/* Enhanced Attendance Card */}
                <div className="enhanced-attendance-card">
            

                  {/* Attendance Items Grid */}
                  <div className="enhanced-attendance-grid">
                    {attendanceItemsData.map((item, index) => (
                      <AttendanceItem
                        key={index}
                        icon={item.icon}
                        title={item.title}
                        description={item.description}
                        percentage={item.percentage}
                        color={item.color}
                      />
                    ))}
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
                      <Icons type='evaluation_quality' size={20} />
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
                      tickFormatter={(dayOfMonth) => {
                        // 1) Get current date info
                        const now = new Date();
                        const year = now.getFullYear();
                        const month = now.getMonth(); // 0-based (January = 0)
                    
                        // 2) Construct a date for the current year/month with this day
                        const date = new Date(year, month, dayOfMonth);
                    
                        // 3) If invalid (e.g., dayOfMonth out of range), fall back
                        if (isNaN(date.getTime())) {
                          return `يوم ${dayOfMonth}`; 
                        }
                    
                        // 4) Format the weekday in Arabic (e.g. "الجمعة")
                        return new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(date);
                      }}
                    />
                    <YAxis
                      stroke="#64748b"
                      domain={[0, 100]}
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
              <span>اخر تحديث:  {"  "+new Date().toLocaleString('ar-EG')} </span>
              <Clock size={16} />
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