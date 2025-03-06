import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DatePicker, Select, Button, Card, Alert } from 'antd';
import axiosInstance from '../../intercepters/axiosInstance.js';
import Url from './../../store/url.js';
import dayjs from 'dayjs'; // Import dayjs

const { Option } = Select;

const containerStyle = {
  padding: '24px'
};

const formContainerStyle = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'flex-end',
  gap: '20px',
  marginBottom: '16px',
  flexWrap: 'wrap'
};

const formGroupStyle = {
  display: 'flex',
  flexDirection: 'column'
};

const labelStyle = {
  marginBottom: '8px',
  color: '#262626',
  fontWeight: 500
};

const selectStyle = {
  width: '200px'
};

const buttonStyle = {
  height:"45px",
  width:"100px"
};

const cardsContainerStyle = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: '16px',
  marginTop: '16px'
};

const cardStyle = {
  flex: '0 0 auto',
  minWidth: '200px',
  maxWidth: '300px',
  backgroundColor: '#fff1f0',
  borderRadius: '8px',
  padding: '16px',
  border: '1px solid #ffccc7'
};

const cardTextStyle = {
  color: '#cf1322',
  fontSize: '16px',
  fontWeight: 500
};

const emptyStateStyle = {
  textAlign: 'center',
  color: '#8c8c8c',
  marginTop: 24,
  width: '100%'
};

export default function AttendanceUnavailable() {
  // Initialize selectedDate with today's date using dayjs
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [workingHours, setWorkingHours] = useState("1");
  const [governorates, setGovernorates] = useState([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [unavailableOffices, setUnavailableOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGovernorates = async () => {
      try {
        const response = await axiosInstance.get(`${Url}/api/Governorate/dropdown`);
        setGovernorates([{ id: null, name: 'الكل' }, ...response.data]);
      } catch (err) {
        console.error('Error fetching governorates:', err);
      }
    };

    fetchGovernorates();
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!selectedDate) {
      setError('الرجاء اختيار التاريخ');
      return;
    }
  
    setLoading(true);
    setError(null);
    setUnavailableOffices([]);
  
    try {
      const response = await axiosInstance.post(`${Url}/api/Attendance/statistics/unavailable`, {
        date: `${selectedDate.format('YYYY-MM-DD')}T00:00:00Z`,
        workingHours: parseInt(workingHours),
        governorateId: selectedGovernorate
      });
  
      // Extract the unavailableOffices array from the response data
      setUnavailableOffices(response.data.unavailableOffices);
    } catch (err) {
      setError('حدث خطأ اثناء جلب البيانات');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, workingHours, selectedGovernorate]);

  const workingHoursOptions = useMemo(() => (
    <>
      <Option value="1">صباحي</Option>
      <Option value="2">مسائي</Option>
    </>
  ), []);

  const governorateOptions = useMemo(() => (
    governorates.map((gov) => (
      <Option key={gov.id} value={gov.id}>
        {gov.name}
      </Option>
    ))
  ), [governorates]);

const unavailableOfficesContent = useMemo(() => {
  if (!Array.isArray(unavailableOffices) || unavailableOffices.length === 0) return null;
  
  return (
    <div style={cardsContainerStyle}>
      {unavailableOffices.map((office, index) => (
        <div key={index} style={cardStyle}>
          <div style={cardTextStyle}>
            {office}
          </div>
        </div>
      ))}
    </div>
  );
}, [unavailableOffices]);

  // When not loading, no error and no offices are returned (i.e. an empty array),
  // display "جميع المكاتب حاضرة".
  const emptyStateContent = useMemo(() => {
    if (loading || error || unavailableOffices.length > 0) return null;
    
    return (
      <div style={emptyStateStyle}>
        جميع المكاتب حاضرة
      </div>
    );
  }, [loading, error, unavailableOffices.length]);

  return (
    <div dir="rtl" style={containerStyle}>
      <Card title="المكاتب الغير ملتزمة بتسجيل الحضور" bordered={false}>
        <form onSubmit={handleSubmit}>
          <div style={formContainerStyle}>
            <div style={formGroupStyle}>
              <div style={labelStyle}>التاريخ</div>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                style={selectStyle}
                placeholder="اختر التاريخ"
              />
            </div>

            <div style={formGroupStyle}>
              <div style={labelStyle}>وقت الدوام</div>
              <Select
                value={workingHours}
                onChange={setWorkingHours}
                style={selectStyle}
              >
                {workingHoursOptions}
              </Select>
            </div>

            <div style={formGroupStyle}>
              <div style={labelStyle}>المحافظة</div>
              <Select
                value={selectedGovernorate}
                onChange={setSelectedGovernorate}
                style={selectStyle}
                placeholder="اختر المحافظة"
              >
                {governorateOptions}
              </Select>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={buttonStyle}
            >
              بحث
            </Button>
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {unavailableOfficesContent}
          {emptyStateContent}
        </form>
      </Card>
    </div>
  );
}
