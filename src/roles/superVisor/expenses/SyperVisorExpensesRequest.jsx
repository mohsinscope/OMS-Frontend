import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Card, 
  Typography, 
  Space, 
  message, 
  Modal, 
  Form, 
  Input, 
  DatePicker, 
  Collapse, 
  Select,
  Empty 
} from 'antd';
import { PlusCircleOutlined, CalendarOutlined } from '@ant-design/icons';
import useAuthStore from "../../../store/store";
import axiosInstance from './../../../intercepters/axiosInstance.js';
import { Link } from 'react-router-dom';
import './styles/SuperVisorExpinsesRequest.css';

const { Title } = Typography;

export default function SuperVisorExpensesRequest() {
  const { profile } = useAuthStore();

  const [dataSource, setDataSource] = useState([]);
  const [lastMonthData, setLastMonthData] = useState([]);
  const [currentMonthlyExpenseId, setCurrentMonthlyExpenseId] = useState(null);
  const [canCreateMonthly, setCanCreateMonthly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [currentMonthDailyExpenses, setCurrentMonthDailyExpenses] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [isMonthlyModalVisible, setIsMonthlyModalVisible] = useState(false);
  const [monthlyForm] = Form.useForm();

  const [officeInfo, setOfficeInfo] = useState({
    totalCount: 0,
    totalExpenses: 0,
    date: new Date().toISOString().split('T')[0],
    governorate: profile?.governorateName || "",
    officeName: profile?.officeName || "",
    supervisorName: profile?.name || ""
  });

  // Fetch Expense Types
  const fetchExpenseTypes = async () => {
    try {
      const response = await axiosInstance.get('/api/ExpenseType?PageNumber=1&PageSize=10');
      setExpenseTypes(response.data || []);
    } catch (error) {
      console.error('Error fetching expense types:', error);
      message.error('حدث خطأ في جلب أنواع المصروفات');
    }
  };

  // Fetch Monthly Expense
  const fetchMonthlyExpense = async () => {
    try {
      const payload = {
        officeId: profile?.officeId,
        governorateId: profile?.governorateId,
        profileId: profile?.id,
        status: 0,
        startDate: null,
        endDate: null,
        PaginationParams: {
          PageNumber: 1,
          PageSize: 10
        }
      };

      const response = await axiosInstance.post('/api/Expense/search', payload);

      if (response.data && response.data.length > 0) {
        const currentExpense = response.data[0];
        setCurrentMonthlyExpenseId(currentExpense.id);
        setCanCreateMonthly(false);
        fetchDailyExpenses(currentExpense.id);
      } else {
        setCanCreateMonthly(true);
        setCurrentMonthDailyExpenses([]);
      }
    } catch (error) {
      console.error('Error fetching monthly expenses:', error);
      message.error('حدث خطأ في جلب المصروفات الشهرية');
    }
  };

  // Fetch Daily Expenses
  const fetchDailyExpenses = async (monthlyExpenseId) => {
    if (!monthlyExpenseId) return;

    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/Expense/${monthlyExpenseId}/daily-expenses`);

      if (response.data && response.data.dailyExpenses) {
        const formattedDailyExpenses = response.data.dailyExpenses.map((expense) => ({
          key: expense.id,
          id: expense.id,
          date: new Date(expense.expenseDate).toISOString().split("T")[0],
          price: expense.price,
          quantity: expense.quantity,
          totalAmount: expense.amount,
          notes: expense.notes,
          expenseTypeId: expense.expenseTypeId,
        }));
        setCurrentMonthDailyExpenses(formattedDailyExpenses);
        updateOfficeInfo(formattedDailyExpenses);
      }
    } catch (error) {
      console.error("Error fetching daily expenses:", error);
      message.error("حدث خطأ في جلب المصروفات اليومية");
    } finally {
      setLoading(false);
    }
  };

  // Create Monthly Expense
  const handleCreateMonthlyExpense = async (values) => {
    try {
      setLoading(true);
      const payload = {
        totalAmount: 0,
        notes: values.notes,
        status: 0,
        officeId: profile?.officeId,
        governorateId: profile?.governorateId,
        profileId: profile?.id
      };

      const response = await axiosInstance.post('/api/Expense/MonthlyExpenses', payload);

      if (response.data) {
        setCurrentMonthlyExpenseId(response.data.id);
        message.success('تم إنشاء المصروف الشهري بنجاح');
        setIsMonthlyModalVisible(false);
        monthlyForm.resetFields();
        setCanCreateMonthly(false);
        fetchDailyExpenses(response.data.id);
      }
    } catch (error) {
      console.error('Error creating monthly expense:', error);
      message.error('حدث خطأ في إنشاء المصروف الشهري');
    } finally {
      setLoading(false);
    }
  };

  // Update Office Information
  const updateOfficeInfo = (expenses) => {
    const totalExpenses = expenses.reduce((sum, item) => sum + item.totalAmount, 0);
    setOfficeInfo(prev => ({
      ...prev,
      totalCount: expenses.length,
      totalExpenses
    }));
  };

  // Initial Data Loading
  useEffect(() => {
    fetchExpenseTypes();
    fetchMonthlyExpense();
  }, []);

  const columns = [
    {
      title: 'التاريخ',
      dataIndex: 'date',
      key: 'date'
    },
    {
      title: 'السعر',
      dataIndex: 'price',
      key: 'price',
      render: price => `${price.toLocaleString()} د.ع`
    },
    {
      title: 'الكمية',
      dataIndex: 'quantity',
      key: 'quantity'
    },
    {
      title: 'المبلغ الإجمالي',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: amount => `${amount.toLocaleString()} د.ع`
    },
    {
      title: 'ملاحظات',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true
    },
    {
      title: 'الإجراءات',
      key: 'actions',
      render: (_, record) => (
        <Link 
          to="/Expensess-view-daily"
          state={{ dailyExpenseId: record.id }}
        >
          <Button type="primary">
            عرض
          </Button>
        </Link>
      )
    }
  ];

  const EmptyStateCard = () => (
    <div className="empty-state-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      minHeight: '400px',
      width: '100%'
    }}>
      <CalendarOutlined style={{
        fontSize: '64px',
        color: '#1890ff',
        marginBottom: '24px'
      }} />
      <Title level={3} style={{ marginBottom: '16px', textAlign: 'center' }}>
        لا يوجد مصروف شهري للشهر الحالي
      </Title>
      <p style={{ 
        color: '#666', 
        marginBottom: '32px',
        textAlign: 'center',
        fontSize: '16px'
      }}>
        يمكنك إنشاء مصروف شهري جديد للبدء في تسجيل المصروفات اليومية
      </p>
      <Button 
        type="primary" 
        size="large"
        icon={<PlusCircleOutlined />}
        onClick={() => setIsMonthlyModalVisible(true)}
        style={{
          height: '48px',
          padding: '0 32px',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        إنشاء مصروف شهري جديد
      </Button>
    </div>
  );

  return (
    <div className="supervisor-expenses-history-page" dir="rtl" style={{ padding: '24px' }}>
      <div style={{ display: "flex", flexDirection: "row", gap: "24px", marginBottom: "24px" }}>
        {/* Office Info Card */}
        <Card className="office-info-card" style={{ width: "25%", flexShrink: 0 }}>
          <Title level={3} style={{ marginBottom: '24px', textAlign: 'center' }}>معلومات المكتب</Title>
          <div className="office-info" style={{ fontSize: '14px' }}>
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
              <span>العدد الكلي:</span>
              <strong>{officeInfo.totalCount}</strong>
            </div>
            <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
              <span>إجمالي الصرفيات:</span>
              <strong>{officeInfo.totalExpenses.toLocaleString()} د.ع</strong>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <span>التاريخ:</span>
              <strong> {officeInfo.date}</strong>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <span>المحافظة:</span>
              <strong> {officeInfo.governorate}</strong>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <span>اسم المكتب:</span>
              <strong> {officeInfo.officeName}</strong>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <span>اسم المشرف:</span>
              <strong> {officeInfo.supervisorName}</strong>
            </div>
          </div>
          
          {!canCreateMonthly && (
            <Space direction="vertical" style={{ width: '100%', marginTop: '24px' }}>
              <Link 
                to="/add-daily-expense" 
                state={{ monthlyExpenseId: currentMonthlyExpenseId }}
              >
                <Button type="primary" block size="large">
                  إضافة مصروف يومي
                </Button>
              </Link>
            </Space>
          )}
        </Card>

        {/* Main Content Area */}
        <div style={{ flex: 1 }}>
          {canCreateMonthly ? (
            <EmptyStateCard />
          ) : (
            <Card className="expenses-table-card">
              <Title level={3} style={{ marginBottom: '24px' }}>المصروفات اليومية للشهر الحالي</Title>
              <Table
                dataSource={currentMonthDailyExpenses}
                columns={columns}
                loading={loading}
                rowKey="id"
                pagination={{ 
                  pageSize: 10,
                  position: ['bottomCenter'],
                  showSizeChanger: false
                }}
                style={{ marginTop: '16px' }}
              />
            </Card>
          )}
        </div>
      </div>

      {/* Monthly Expense Modal */}
      <Modal
        title="إنشاء مصروف شهري"
        open={isMonthlyModalVisible}
        onCancel={() => {
          setIsMonthlyModalVisible(false);
          monthlyForm.resetFields();
        }}
        footer={null}
        style={{ direction: 'rtl' }}
      >
        <Form
          form={monthlyForm}
          onFinish={handleCreateMonthlyExpense}
          layout="vertical"
          style={{ marginTop: '24px' }}
        >
          <Form.Item
            name="notes"
            label="ملاحظات"
            rules={[{ required: true, message: 'الرجاء إدخال الملاحظات' }]}
          >
            <Input.TextArea 
              rows={4} 
              placeholder="أدخل الملاحظات"
              style={{ resize: 'none' }}
            />
          </Form.Item>
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              block
              size="large"
            >
              إنشاء
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}