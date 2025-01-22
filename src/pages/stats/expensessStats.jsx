import React, { useState, useEffect, useCallback } from 'react';
import { DatePicker } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import axiosInstance from '../../intercepters/axiosInstance';
import Url from '../../store/url.js';
import useAuthStore from '../../store/store.js';
import './expensessStats.css';

const COLORS = ['#8884d8', '#FF6B8A', '#82ca9d', '#ffc658', '#a4de6c'];

export default function ExpensessStats() {
  const { accessToken } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [governorates, setGovernorates] = useState([]);
  const [availableOffices, setAvailableOffices] = useState([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [selectedThreshold, setSelectedThreshold] = useState(null);
  const [expensesData, setExpensesData] = useState([]);
  const [lastMonthData, setLastMonthData] = useState(null);
  const [thresholds, setThresholds] = useState([]);

  const fetchGovernorates = useCallback(async () => {
    console.log('Fetching governorates');
    try {
      const response = await axiosInstance.get(`${Url}/api/Governorate/dropdown`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      console.log('Governorates fetched:', response.data);
      setGovernorates(response.data);
    } catch (error) {
      console.error('Error fetching governorates:', error);
      setError("فشل في جلب المحافظات. الرجاء المحاولة مرة أخرى.");
    }
  }, [accessToken]);

  const fetchThresholds = useCallback(async () => {
    console.log('Fetching thresholds');
    try {
      const response = await axiosInstance.get(`${Url}/api/Threshold`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      console.log('Thresholds fetched:', response.data);
      setThresholds(response.data);
    } catch (error) {
      console.error('Error fetching thresholds:', error);
      setError("فشل في جلب مستويات المصاريف. الرجاء المحاولة مرة أخرى.");
    }
  }, [accessToken]);

  const fetchLastMonthData = useCallback(async () => {
    console.log('Fetching last month data with officeId:', selectedOffice);
    if (!selectedOffice) {
      console.log('No office selected, skipping last month data fetch');
      setLastMonthData(null);
      return;
    }

    try {
      console.log('Making last month data request');
      const response = await axiosInstance.post(
        `${Url}/api/Expense/search-last-month`,
        { officeId: selectedOffice },
        { headers: { Authorization: `Bearer ${accessToken}` }}
      );
      
      console.log('Last month data response:', response.data);
      
      if (response.data && response.data.length > 0) {
        const data = response.data[0];
        console.log('Setting last month data with:', data);
        setLastMonthData({
          totalAmount: data.totalAmount,
          officeName: data.officeName,
          governorateName: data.governorateName,
          thresholdName: data.thresholdName,
          status: data.status,
          profileFullName: data.profileFullName,
          dateCreated: data.dateCreated
        });
      } else {
        console.log('No last month data found');
        setLastMonthData(null);
      }
    } catch (error) {
      console.error('Error fetching last month data:', error);
      setLastMonthData(null);
    }
  }, [accessToken, selectedOffice]);

  const fetchOffices = useCallback(async (governorateId) => {
    if (!governorateId) {
      setAvailableOffices([]);
      setSelectedOffice(null);
      return;
    }

    try {
      const response = await axiosInstance.get(`${Url}/api/Governorate/dropdown/${governorateId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.data && response.data[0] && response.data[0].offices) {
        setAvailableOffices(response.data[0].offices);
      }
    } catch (error) {
      setError("فشل في جلب المكاتب. الرجاء المحاولة مرة أخرى.");
    }
  }, [accessToken]);

  const handleGovernorateChange = useCallback((governorateId) => {
    setSelectedGovernorate(governorateId || null);
    fetchOffices(governorateId);
  }, [fetchOffices]);

  const fetchExpensesData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.post(`${Url}/api/Expense/search-statistics`, {
        officeId: selectedOffice,
        governorateId: selectedGovernorate,
        thresholdId: selectedThreshold,
        startDate: startDate ? startDate.toDate().toISOString() : null,
        endDate: endDate ? endDate.toDate().toISOString() : null
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      // Transform the expenses data for the bar chart
      const transformedData = response.data.expenses.map(expense => ({
        name: expense.officeName,
        value: expense.totalAmount,
        percentage: expense.percentageOfBudget
      }));

      setExpensesData(transformedData);
    } catch (error) {
      setError("فشل في جلب البيانات. الرجاء المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  // Component initialization log
  useEffect(() => {
    console.log('Component initialized');
    const initializeData = async () => {
      console.log('Starting initial data fetch');
      await Promise.all([
        fetchGovernorates(),
        fetchThresholds()
      ]);
      console.log('Initial data fetch completed');
    };
    
    initializeData();
  }, [fetchGovernorates, fetchThresholds]);

  // Remove automatic last month data fetching

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Search button clicked - Starting data fetch');
    setLoading(true);
    try {
      console.log('Fetching both expenses and last month data');
      await Promise.all([
        fetchExpensesData(),
        fetchLastMonthData()
      ]);
      console.log('Data fetch completed successfully');
    } catch (error) {
      console.error("Error during search:", error);
    } finally {
      setLoading(false);
      console.log('Search completed - Loading state reset');
    }
  };

  const formatCurrency = (value) => {
    const safeValue = typeof value === 'number' ? value : 0;
    return `د.ع ${safeValue.toLocaleString()}`;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="exp-tooltip">
          <p>{payload[0].payload.name}</p>
          <p>{formatCurrency(payload[0].value)}</p>
          {payload[0].payload.percentage && (
            <p>النسبة: {payload[0].payload.percentage}%</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="exp-container" dir="rtl">
      <form onSubmit={handleSubmit} className="exp-filter-form">
        <div className="exp-form-group">
          <label>المحافظة</label>
          <select
            value={selectedGovernorate || ""}
            onChange={(e) => handleGovernorateChange(e.target.value)}
            className="exp-form-control"
          >
            <option value="">كل المحافظات</option>
            {governorates.map((gov) => (
              <option key={gov.id} value={gov.id}>{gov.name}</option>
            ))}
          </select>
        </div>

        <div className="exp-form-group">
          <label>المكتب</label>
          <select
            value={selectedOffice || ""}
            onChange={(e) => setSelectedOffice(e.target.value || null)}
            className="exp-form-control"
            disabled={!selectedGovernorate}
          >
            <option value="">كل المكاتب</option>
            {availableOffices.map((office) => (
              <option key={office.id} value={office.id}>{office.name}</option>
            ))}
          </select>
        </div>

        <div className="exp-form-group">
          <label>مستوى المصاريف</label>
          <select
            value={selectedThreshold || ""}
            onChange={(e) => setSelectedThreshold(e.target.value || null)}
            className="exp-form-control"
          >
            <option value="">كل المستويات</option>
            {thresholds.map((threshold) => (
              <option key={threshold.id} value={threshold.id}>
                {threshold.name} ({threshold.minValue.toLocaleString()} - {threshold.maxValue.toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        <div className="exp-form-group">
          <label>من تاريخ</label>
          <DatePicker
            value={startDate}
            onChange={setStartDate}
            className="exp-form-control"
            placeholder="اختر التاريخ"
          />
        </div>

        <div className="exp-form-group">
          <label>الى تاريخ</label>
          <DatePicker
            value={endDate}
            onChange={setEndDate}
            className="exp-form-control"
            placeholder="اختر التاريخ"
          />
        </div>

        <button type="submit" className="exp-search-btn" disabled={loading}>
          {loading ? 'جاري البحث...' : 'بحث'}
        </button>
      </form>

      {error && <div className="exp-error-message">{error}</div>}

      <h2 className="exp-chart-title">احصائيات المصاريف</h2>

      <div className="exp-charts-wrapper">
        <div className="exp-bar-chart-section" style={{ width: '100%', minHeight: '500px' }}>
          <div className="exp-chart-container" style={{ width: '100%', height: '100%' }}>
            {!loading && expensesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={500}>
                <BarChart
                  data={expensesData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 120, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis 
                    type="number" 
                    tickFormatter={(value) => value.toLocaleString()}
                    axisLine={{ stroke: '#E0E0E0' }}
                    tickLine={{ stroke: '#E0E0E0' }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={110}
                    axisLine={{ stroke: '#E0E0E0' }}
                    tickLine={{ stroke: '#E0E0E0' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="value" 
                    fill="#36B37E"
                    barSize={30}
                    radius={[0, 4, 4, 0]}
                  >
                    {expensesData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={`rgba(54, 179, 126, ${0.7 + (index * 0.3 / expensesData.length)})`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : !loading ? (
              <div className="exp-no-data">لا توجد بيانات للعرض</div>
            ) : null}
          </div>
        </div>

        {lastMonthData && (
          <div className="exp-pie-chart-section">
            <div className="exp-chart-container">
              <div className="exp-last-month-data">
                <h3>بيانات الشهر الماضي</h3>
                {lastMonthData.officeName && <p>المكتب: {lastMonthData.officeName}</p>}
                {lastMonthData.governorateName && <p>المحافظة: {lastMonthData.governorateName}</p>}
                {lastMonthData.thresholdName && <p>مستوى المصاريف: {lastMonthData.thresholdName}</p>}
                <p>إجمالي المبلغ: {formatCurrency(lastMonthData.totalAmount)}</p>
                {lastMonthData.status && <p>الحالة: {lastMonthData.status}</p>}
                {lastMonthData.profileFullName && <p>اسم المستخدم: {lastMonthData.profileFullName}</p>}
                {lastMonthData.dateCreated && (
                  <p>تاريخ الإنشاء: {new Date(lastMonthData.dateCreated).toLocaleDateString('ar-IQ')}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}