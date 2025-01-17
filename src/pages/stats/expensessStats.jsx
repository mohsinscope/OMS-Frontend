import React, { useState, useEffect, useCallback } from 'react';
import { DatePicker } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
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
  const [lastTwoMonthsData, setLastTwoMonthsData] = useState([]);
  const [thresholds, setThresholds] = useState([]);

  const fetchGovernorates = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`${Url}/api/Governorate/dropdown`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setGovernorates(response.data);
    } catch (error) {
      setError("فشل في جلب المحافظات. الرجاء المحاولة مرة أخرى.");
    }
  }, [accessToken]);

  const fetchThresholds = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`${Url}/api/Threshold`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setThresholds(response.data);
    } catch (error) {
      console.error("فشل في جلب مستويات المصاريف:", error);
      setError("فشل في جلب مستويات المصاريف. الرجاء المحاولة مرة أخرى.");
    }
  }, [accessToken]);

  const fetchLastTwoMonths = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`${Url}/api/Expense/statistics/last-two-months`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      setLastTwoMonthsData([
        {
          name: 'الشهر الحالي',
          value: response.data.expenses[0]?.totalAmount || 0,
          percentage: response.data.totalPercentage
        },
        {
          name: 'الشهر السابق',
          value: response.data.expenses[1]?.totalAmount || 0,
          percentage: response.data.totalPercentage
        }
      ]);
    } catch (error) {
      console.error("فشل في جلب بيانات الشهرين الأخيرين:", error);
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
        startDate: startDate ? startDate.format('YYYY-MM-DD') : null,
        endDate: endDate ? endDate.format('YYYY-MM-DD') : null
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      setExpensesData(response.data || []);
    } catch (error) {
      setError("فشل في جلب البيانات. الرجاء المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        fetchGovernorates(),
        fetchThresholds(),
        fetchLastTwoMonths()
      ]);
    };
    
    initializeData();
  }, [fetchGovernorates, fetchThresholds, fetchLastTwoMonths]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchExpensesData();
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
        <div className="exp-bar-chart-section">
          <div className="exp-chart-container">
            {!loading && expensesData.length > 0 ? (
              <BarChart
                width={800}
                height={400}
                data={expensesData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#36B37E" barSize={20} />
              </BarChart>
            ) : !loading ? (
              <div className="exp-no-data">لا توجد بيانات للعرض</div>
            ) : null}
          </div>
        </div>

        <div className="exp-pie-chart-section">
          <div className="exp-chart-container">
            <PieChart width={400} height={300}>
              <Pie
                data={lastTwoMonthsData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {lastTwoMonthsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
            <div className="exp-pie-legend">
              <div className="exp-legend-item">
                <span className="exp-legend-color" style={{ backgroundColor: COLORS[0] }}></span>
                <span>الشهر الحالي: {formatCurrency(lastTwoMonthsData[0]?.value || 0)}</span>
              </div>
              <div className="exp-legend-item">
                <span className="exp-legend-color" style={{ backgroundColor: COLORS[1] }}></span>
                <span>الشهر السابق: {formatCurrency(lastTwoMonthsData[1]?.value || 0)}</span>
              </div>
              <div className="exp-legend-total">
                <span>النسبة المئوية الإجمالية: {lastTwoMonthsData[0]?.percentage?.toFixed(2) || 0}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}