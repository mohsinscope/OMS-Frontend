import React, { useState, useEffect } from 'react';
import { Building2, Clock, DollarSign, Bell, FileCheck, BookX, MonitorX } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import './landingPage.css';
import useAuthStore from './../store/store.js';
import { Link } from 'react-router-dom';
import axiosInstance from './../intercepters/axiosInstance.js';
import Url from './../store/url.js';

export default function LandingPage  ()  {
  const { isSidebarCollapsed, permissions } = useAuthStore();
  const FeatureItem = ({ icon, title }) => {
    return (
      <div className="feature-item">
        {icon}
        <span>{title}</span>
      </div>
    );
  };
  // Check permissions
  const hasDBPermission = permissions.includes("DB");
  const hasDPrPermission = permissions.includes("DPr");
  const hasArPermission = permissions.includes("Ar");
  const hasEXrPermission = permissions.includes("EXr");
  const hasDDrPermission = permissions.includes("DDr");

  const linkStyle = {
    textDecoration: 'none',
    color: 'inherit'
  };

  // State for dashboard statistics
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (hasDBPermission) {
      setLoadingStats(true);
      axiosInstance.get(`${Url}/api/Dashboard/Statistics`)
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

  // Staff distribution data for pie chart
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
      <div className="db_stats_container">
      <h1 className="db_stats_header">لوحة التحكم الإحصائية</h1>
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
         <div className="db_main_stats" dir='rtl'>
            {/* Offices and Governorates Container */}
            <div className="attendance_damaged_container">
              {/* Offices Card */}
              <div className="db_main_card">
                <h2 className="db_stat_label" style={{textAlign:"center"}}>عدد المكاتب الكلي</h2>
                <div className="db_main_stat">
                  <div className="db_stat_icon">
                    <Building2 size={24} />
                  </div>
                  <div className="db_stat_content">
                    <span className="db_stat_value">{dashboardStats.totalOffices}</span>
                  </div>
                </div>
              </div>

              {/* Governorates Card */}
              <div className="db_main_card">
                <h2 className="db_stat_label" style={{textAlign:"center"}}>عدد المحافظات الكلي</h2>
                <div className="db_main_stat">
                  <div className="db_stat_icon">
                    <FileCheck size={24} />
                  </div>
                  <div className="db_stat_content">
                    <span className="db_stat_value">{dashboardStats.totalGovernorates}</span>
                  </div>
                </div>
              </div>
            </div>

            

            {/* Container for Attendance and Damaged Passports */}
            <div className="attendance_damaged_container">
              {/* Damaged Passports Card */}
              <div className="db_main_card damaged_passport_card">
                <h2 className="db_stat_label" style={{textAlign:"center"}}>عدد الجوازات التالفة خلال الشهر الحالي</h2>
                <div className="db_main_stat">
                  <div className="db_stat_icon">
                    <BookX size={24} />
                  </div>
                  <div className="db_stat_content">
                    <span className="db_stat_value">{dashboardStats.totalDamagedPassportsToday}</span>
                  </div>
                </div>
              </div>

              {/* Attendance Card */}
              <div className="db_main_card">
                <h2 className="db_stat_label" style={{textAlign:"center"}}>نسبة الحضور موظفي الجوازات</h2>
                <div className="db_main_stat">
                  <div className="db_stat_icon">
                    <Clock size={24} />
                  </div>
                  <div className="db_stat_content">
                    <span className="db_stat_value">{dashboardStats.attendancePercentage}%</span>
                  </div>
                  <div className="db_percentage_bar">
                    <div 
                      className="db_percentage_fill" 
                      style={{ 
                        width: `${dashboardStats.attendancePercentage}%`,
                        '--width': `${dashboardStats.attendancePercentage}%`
                      }}
                    ></div>
                  </div>
                </div>
                
              </div>
            </div>
            {/* Staff Statistics Card */}
            <div className="db_main_card">
              <div className="db_main_stat">
                <div className="db_stat_content">
                  <span className="db_stat_value">{dashboardStats.totalStaffInAllOffices}</span>
                  <span className="db_stat_label">عدد الكابينات الكلي</span>
                </div>
              </div>
              
              <div className="db_stats_grid">
                <div className="db_sub_stat">
                  <div className="db_stat_icon">
                    <Clock size={20} />
                  </div>
                  <div className="db_stat_content">
                    <span className="db_stat_value">{dashboardStats.totalReceivingStaff}</span>
                    <span className="db_stat_label"> كابينات الاستلام</span>
                  </div>
                </div>
                
                <div className="db_sub_stat">
                  <div className="db_stat_icon">
                    <DollarSign size={20} />
                  </div>
                  <div className="db_stat_content">
                    <span className="db_stat_value">{dashboardStats.totalAccountStaff}</span>
                    <span className="db_stat_label"> كابينات الحسابات</span>
                  </div>
                </div>
                
                <div className="db_sub_stat">
                  <div className="db_stat_icon">
                    <BookX size={20} />
                  </div>
                  <div className="db_stat_content">
                    <span className="db_stat_value">{dashboardStats.totalPrintingStaff}</span>
                    <span className="db_stat_label"> كابينات الطباعة</span>
                  </div>
                </div>
                
                <div className="db_sub_stat">
                  <div className="db_stat_icon">
                    <MonitorX size={20} />
                  </div>
                  <div className="db_stat_content">
                    <span className="db_stat_value">{dashboardStats.totalQualityStaff}</span>
                    <span className="db_stat_label"> كابينات الجودة</span>
                  </div>
                </div>
                
                <div className="db_sub_stat">
                  <div className="db_stat_icon">
                    <Bell size={20} />
                  </div>
                  <div className="db_stat_content">
                    <span className="db_stat_value">{dashboardStats.totalDeliveryStaff}</span>
                    <span className="db_stat_label"> كابينات التسليم</span>
                  </div>
                </div>
              </div>
            </div>
      
    </div>

            {/* Charts Section */}
            <div className="db_charts_container">
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

              <div className="db_chart_card">
                <h3 className="db_chart_title">نسبة الحضور الاسبوعي</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={[
                      { day: '1', value: 75 },
                      { day: '2', value: 82 },
                      { day: '3', value: 78 },
                      { day: '4', value: 85 },
                      { day: '5', value: 90 },
                      { day: '6', value: 88 },
                      { day: '7', value: dashboardStats.attendancePercentage }
                    ]}
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
              <Clock size={16} />
              <span  >    {new Date().toLocaleString('en')}  : اخر تحديث  </span>
            </div>
          </>
        )}
      </div>
    ) :(
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
            {/* Expenses Management - Show if user has EXr permission */}
            {hasEXrPermission && (
              <Link to="/supervisor/Expensess" style={linkStyle}>
                <FeatureItem
                  icon={<DollarSign className="feature-icon" style={{marginLeft:"20px"}}/>}
                  title="ادارة المصاريف"
                />
              </Link>
            )}

            {/* Attendance Management - Show if user has Ar permission */}
            {hasArPermission && (
              <Link to="/supervisor/Attendence" style={linkStyle}>
                <FeatureItem
                  icon={<Clock className="feature-icon"  style={{marginLeft:"20px"}}/>}
                  title="ادارة الحضور"
                />
              </Link>
            )}

            {/* Damaged Passports - Show if user has DPr permission */}
            {hasDPrPermission && (
              <Link to="/supervisor/damagedpasportshistory" style={linkStyle}>
                <FeatureItem
                  icon={<BookX className="feature-icon" style={{marginLeft:"20px"}}/>}
                  title="الجوازات التالفة"
                />
              </Link>
            )}

            {/* Damaged Devices - Show if user has DDr permission */}
            {hasDDrPermission && (
              <Link to="/supervisor/damegedDevices" style={linkStyle}>
                <FeatureItem
                  icon={<MonitorX className="feature-icon" style={{marginLeft:"20px"}}/>}
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
