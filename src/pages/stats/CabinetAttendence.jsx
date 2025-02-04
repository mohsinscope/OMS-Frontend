import React, { useState, useEffect, useCallback, useMemo } from "react";
import { DatePicker } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
import axiosInstance from "../../intercepters/axiosInstance.js";
import Url from "../../store/url.js";
import useAuthStore from "../../store/store.js";
import "./stats.css";

export default function CabinetAttendance() {
  const { accessToken } = useAuthStore();

  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiState, setApiState] = useState({
    governorates: [],
    availableOffices: [],
  });

  const [formState, setFormState] = useState({
    selectedDate: null,
    selectedStaffType: "DeliveryStaff",
    selectedGovernorate: "",
    selectedOffice: "",
    selectedWorkingHours: 0,
  });

  // Memoized headers
  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${accessToken}`,
    }),
    [accessToken]
  );

  // Memoized chart height calculation
  const chartHeight = useMemo(() => {
    const baseHeightPerBar = 40;
    const minHeight = 200;
    const maxHeight = 2500;
    const padding = 100;

    const calculatedHeight = chartData.length * baseHeightPerBar + padding;
    return Math.min(Math.max(calculatedHeight, minHeight), maxHeight);
  }, [chartData.length]);

  // Memoized request body
  const requestBody = useMemo(
    () => ({
      StaffType: formState.selectedStaffType,
      Date: formState.selectedDate?.format("YYYY-MM-DDT00:00:00[Z]"),
      GovernorateId: formState.selectedGovernorate || null,
      OfficeId: formState.selectedOffice || null,
      WorkingHours:
        formState.selectedWorkingHours === 0
          ? null
          : formState.selectedWorkingHours,
    }),
    [
      formState.selectedStaffType,
      formState.selectedDate,
      formState.selectedGovernorate,
      formState.selectedOffice,
      formState.selectedWorkingHours,
    ]
  );

  // Combined fetch function for initial data
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [governoratesResponse] = await Promise.all([
        axiosInstance.get(`${Url}/api/Governorate/dropdown`, { headers }),
      ]);

      setApiState((prev) => ({
        ...prev,
        governorates: governoratesResponse.data,
      }));
    } catch (err) {
      setError("Failed to fetch initial data. Please try again later.");
      console.error("Initial data fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  // Optimized office fetch with debouncing
  const fetchOffices = useCallback(
    debounce(async (govId) => {
      if (!govId) {
        setApiState((prev) => ({ ...prev, availableOffices: [] }));
        setFormState((prev) => ({ ...prev, selectedOffice: "" }));
        return;
      }

      try {
        const response = await axiosInstance.get(
          `${Url}/api/Governorate/dropdown/${govId}`,
          { headers }
        );

        const offices = response.data?.[0]?.offices || [];
        setApiState((prev) => ({ ...prev, availableOffices: offices }));
        setFormState((prev) => ({ ...prev, selectedOffice: "" }));
      } catch (err) {
        setError("Failed to fetch offices. Please try again later.");
        console.error("Offices fetch error:", err);
      }
    }, 300),
    [headers]
  );

  const handleFormChange = useCallback((field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));

    if (field === "selectedGovernorate") {
      fetchOffices(value);
    }
  }, [fetchOffices]);

  const fetchAttendanceData = useCallback(async () => {
    if (!formState.selectedDate) {
      setError("Please select a date.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post(
        `${Url}/api/Attendance/search/type-statistics`,
        requestBody,
        { headers }
      );

      const transformedData =
        response.data?.map((office) => ({
          name: office.officeName,
          totalStaff: office.totalStaff,
          availableStaff: office.availableStaff,
        })) || [];

      setChartData(transformedData);
    } catch (err) {
      setError("Failed to fetch attendance data. Please try again later.");
      console.error("Attendance data fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [headers, requestBody, formState.selectedDate]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Memoized chart component
  const chartComponent = useMemo(() => {
    if (chartData.length === 0) {
      return !loading && <div className="no-data-message">لا توجد بيانات</div>;
    }
    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
        >
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={150} />
          <Tooltip />
          <Legend />
          <Bar
            dataKey="totalStaff"
            stackId="b"
            fill="#F44336"
            name="عدد الكابينات"
          />
          <Bar
            dataKey="availableStaff"
            stackId="a"
            fill="#4CAF50"
            name="عدد الحضور"
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }, [chartData, chartHeight, loading]);

  return (
    <div className="cabinet-attendence-container">
      <form onSubmit={handleSubmit} className="stats-form" dir="rtl">
        <div className="form-group">
          <label>المحافظة</label>
          <select
            value={formState.selectedGovernorate}
            onChange={(e) => handleFormChange("selectedGovernorate", e.target.value)}
            className="form-control"
          >
            <option value="">كل المحافظات</option>
            {apiState.governorates.map((gov) => (
              <option key={gov.id} value={String(gov.id)}>
                {gov.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>اسم المكتب</label>
          <select
            value={formState.selectedOffice}
            onChange={(e) => handleFormChange("selectedOffice", e.target.value)}
            className="form-control"
            disabled={!formState.selectedGovernorate}
          >
            <option value="">كل المكاتب</option>
            {apiState.availableOffices.map((office) => (
              <option key={office.id} value={String(office.id)}>
                {office.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>وقت الدوام</label>
          <select
            value={formState.selectedWorkingHours}
            onChange={(e) => handleFormChange("selectedWorkingHours", Number(e.target.value))}
            className="form-control"
          >
            <option value={1}>صباحي</option>
            <option value={2}>مسائي</option>
            <option value={0}>الكل</option>
          </select>
        </div>

        <div className="form-group">
          <label>التاريخ</label>
          <DatePicker
            value={formState.selectedDate}
            onChange={(date) => handleFormChange("selectedDate", date)}
            className="form-control"
            placeholder="Select Date"
          />
        </div>

        <div className="form-group">
          <label>نوع الكابينة</label>
          <select
            value={formState.selectedStaffType}
            onChange={(e) => handleFormChange("selectedStaffType", e.target.value)}
            className="form-control"
          >
            <option value="DeliveryStaff">موظفو التسليم</option>
            <option value="AccountStaff">موظفو الحسابات</option>
            <option value="PrintingStaff">موظفو الطباعة</option>
            <option value="QualityStaff">موظفو الجودة</option>
            <option value="ReceivingStaff">موظفو الاستلام</option>
          </select>
        </div>

        <button
          type="submit"
          className="search-button"
          disabled={loading}
          
        >
          
          {loading ? "Loading..." : "ابحث"}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      <div className="chart-container">{chartComponent}</div>
    </div>
  );
}

// Debounce function to prevent rapid API calls
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};