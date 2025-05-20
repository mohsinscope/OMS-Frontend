import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Table,
  Card,
  ConfigProvider,
  message,
  Button,
  Modal,
  Input,
  Space,
  Form
} from 'antd';
import { Link } from 'react-router-dom';
import {
  SendOutlined,
  CheckCircleOutlined,
  PlusOutlined
} from '@ant-design/icons';
import axiosInstance from '../../../intercepters/axiosInstance';
import useAuthStore from '../../../store/store';
import './styles/ExpensessViewMonthly.css';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

const { TextArea } = Input;

// Actions Table Component
const ActionsTable = ({ monthlyExpensesId }) => {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchActions = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(`/api/Actions/${monthlyExpensesId}`);
      const formatted = data.map(action => {
        const d = new Date(action.dateCreated);
        return {
          key: action.id,
          actionType: action.actionType,
          notes: action.notes,
          date: d.toISOString().split('T')[0],
          time: d.toLocaleTimeString('ar-EG', {
            hour12: true,
            hour: '2-digit',
            minute: '2-digit'
          })
        };
      });
      setActions(formatted);
    } catch (error) {
      console.error('Error fetching actions:', error);
      message.error('حدث خطأ في جلب سجل الإجراءات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (monthlyExpensesId) fetchActions();
  }, [monthlyExpensesId]);

  const columns = [
    { title: 'نوع الإجراء', dataIndex: 'actionType', key: 'actionType', align: 'right' },
    { title: 'الملاحظات', dataIndex: 'notes', key: 'notes', align: 'right' },
    { title: 'التاريخ', dataIndex: 'date', key: 'date', align: 'center' },
    { title: 'الوقت', dataIndex: 'time', key: 'time', align: 'center' },
  ];

  return (
    <ConfigProvider direction="rtl">
      <Table
        className="actions-table"
        columns={columns}
        dataSource={actions}
        loading={loading}
        pagination={{ pageSize: 5, position: ['bottomCenter'], showSizeChanger: false }}
      />
    </ConfigProvider>
  );
};

export default function ExpensessViewMonthly() {
  const location = useLocation();
  const navigate = useNavigate();
  const { monthlyExpenseId } = location.state || {};
  const { isSidebarCollapsed, profile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [sendingLoading, setSendingLoading] = useState(false);
  const [completingLoading, setCompletingLoading] = useState(false);
  const [monthlyExpense, setMonthlyExpense] = useState(null);
  const [dailyExpenses, setDailyExpenses] = useState([]);
  const [expenseTypeData, setExpenseTypeData] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCompletionModalVisible, setIsCompletionModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [completionForm] = Form.useForm();
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF6384', '#36A2EB'];

  // Fetch data
  const fetchMonthlyExpenseDetails = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(`/api/Expense/${monthlyExpenseId}`);
      setMonthlyExpense(data);
    } catch (error) {
      console.error('Error fetching monthly expense:', error);
      message.error('حدث خطأ في جلب تفاصيل المصروف الشهري');
    }
  };

  console.log("month", monthlyExpense)
const fetchDailyExpenses = async () => {
  try {
    const { data } = await axiosInstance.get(
      `/api/Expense/${monthlyExpenseId}/daily-expenses`
    );

    /* 🟡 المابّـينغ الجديد */
const formatted = data.map(e => {
  const hasChildren =
    Array.isArray(e.subExpenses) && e.subExpenses.length > 0;

  return {
    key: e.id,
    id: e.id,
    date: new Date(e.expenseDate).toISOString().split("T")[0],

    expenseTypeName: hasChildren ? "مصروف متعدد" : e.expenseTypeName,
    price: hasChildren ? null : e.price,
    quantity: hasChildren ? e.subExpenses.length : e.quantity,
    totalAmount: e.totalAmount ?? e.amount,

    notes: hasChildren ? "ـــ" : e.notes,   // ⬅️ هنا
    hasChildren
  };
});
    setDailyExpenses(formatted);

    /* توزيع الأنواع حسب المبلغ الكلّي */
    const dist = formatted.reduce((acc, cur) => {
      acc[cur.expenseTypeName] =
        (acc[cur.expenseTypeName] || 0) + cur.totalAmount;
      return acc;
    }, {});
    setExpenseTypeData(
      Object.entries(dist).map(([name, value]) => ({ name, value }))
    );
  } catch (error) {
    console.error("Error fetching daily expenses:", error);
    message.error("حدث خطأ في جلب المصروفات اليومية");
  } finally {
    setLoading(false);
  }
};
  console.log("day", dailyExpenses)

  useEffect(() => {
    if (monthlyExpenseId) {
      fetchMonthlyExpenseDetails();
      fetchDailyExpenses();
    }
  }, [monthlyExpenseId]);

  // Handlers
  const handleSendToCoordinator = async values => {
    try {
      setSendingLoading(true);
      let actionType = 'Approval';
      if (monthlyExpense.status === 'ReturnedToSupervisor') {
        actionType = `تم التعديل من قبل المشرف ${profile?.name || ''}`;
      }
      await axiosInstance.post(`/api/Expense/${monthlyExpenseId}/status`, {
        monthlyExpensesId: monthlyExpenseId,
        newStatus: 1
      });
      await axiosInstance.post('/api/Actions', {
        actionType,
        notes: values.notes,
        profileId: profile?.profileId,
        monthlyExpensesId: monthlyExpenseId
      });
      message.success('تم إرسال المصروف بنجاح إلى منسق المشروع');
      setIsModalVisible(false);
      form.resetFields();
      navigate(-1);
    } catch (error) {
      if (error.errorFields) {
        message.error('الرجاء إدخال جميع المعلومات المطلوبة');
      } else {
        console.error('Error sending to coordinator:', error);
        message.error('حدث خطأ في إرسال المصروف');
      }
    } finally {
      setSendingLoading(false);
    }
  };

  const handleCompleteMonthlyExpense = async values => {
    try {
      setCompletingLoading(true);
      await axiosInstance.post(`/api/Expense/${monthlyExpenseId}/status`, {
        monthlyExpensesId: monthlyExpenseId,
        newStatus: 9
      });
      await axiosInstance.post('/api/Actions', {
        actionType: `تم اتمام مصروف الشهر من قبل المشرف ${profile?.name || ''}`,
        notes: values.notes,
        profileId: profile?.profileId,
        monthlyExpensesId: monthlyExpenseId
      });
      message.success('تم اتمام عملية مصاريف الشهر بنجاح');
      setIsCompletionModalVisible(false);
      completionForm.resetFields();
      navigate(-1);
    } catch (error) {
      if (error.errorFields) {
        message.error('الرجاء إدخال جميع المعلومات المطلوبة');
      } else {
        console.error('Error completing monthly expense:', error);
        message.error('حدث خطأ في اتمام عملية مصاريف الشهر');
      }
    } finally {
      setCompletingLoading(false);
    }
  };

  // Render buttons
  const renderActionButton = () => {
    if (monthlyExpense?.status === 'RecievedBySupervisor') {
      return (
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={() => setIsCompletionModalVisible(true)}
          loading={completingLoading}
          className="send-button"
        >
          اتمام عملية مصاريف الشهر
        </Button>
      );
    }
    if (monthlyExpense?.status === 'ReturnedToSupervisor') {
      return (
        <Space>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={() => setIsModalVisible(true)}
            loading={sendingLoading}
            className="send-button"
          >
            ارسال الى منسق المشروع بعد التعديل
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() =>
              navigate('/add-daily-expense', {
                state: {
                  monthlyExpenseId,
                  totalMonthlyAmount: monthlyExpense.totalAmount
                }
              })
            }
            className="send-button"
          >
            إضافة مصروف يومي
          </Button>
        </Space>
      );
    }
    return null;
  };

  // Columns
  const columns = [
    { title: 'التاريخ', dataIndex: 'date', key: 'date' },
    { title: 'نوع المصروف', dataIndex: 'expenseTypeName', key: 'expenseTypeName' },
  {
  title: "السعر",
  dataIndex: "price",
  key: "price",
  render: (amt, record) =>
    record.hasChildren
      ? "----"
      : (
        <span className="monthly-info-value amount">
          {amt.toLocaleString()} د.ع
        </span>
      )
},
    { title: 'الكمية', dataIndex: 'quantity', key: 'quantity' },
 {
  title: "المبلغ الإجمالي",
  dataIndex: "totalAmount",
  key: "totalAmount",
  render: amt => (
    <span className="monthly-info-value amount">
      {amt.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      })}{" "}
      د.ع
    </span>
  )
},
    { title: 'ملاحظات', dataIndex: 'notes', key: 'notes', ellipsis: true },
    {
      title: 'الإجراءات',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Link
            to="/Expensess-view-daily"
            state={{ dailyExpenseId: record.id, status: monthlyExpense?.status }}
          >
            <Button type="primary" className="action-button">عرض</Button>
          </Link>
        </Space>
      )
    },
  ];


  // Monthly info card
  const MonthlyExpenseInfo = () => {
    if (!monthlyExpense) return null;
    const statusMap = {
      New: 'جديد',
      SentToProjectCoordinator: 'تم الإرسال إلى منسق المشروع',
      ReturnedToProjectCoordinator: 'تم الإرجاع إلى منسق المشروع',
      SentToManager: 'تم الإرسال إلى المدير',
      ReturnedToManager: 'تم الإرجاع إلى المدير',
      SentToDirector: 'تم الإرسال إلى المدير التنفيذي',
      ReturnedToSupervisor: 'تم الإرجاع إلى المشرف',
      RecievedBySupervisor: 'تم الاستلام من قبل المشرف',
      SentFromDirector: 'تم الموافقة من المدير التنفيذي',
      Completed: 'مكتمل'
    };
    const getStatusClass = status => {
      const map = {
        ReturnedToSupervisor: 'status-returned',
        Low: 'status-low',
        RecievedBySupervisor: 'status-received',
        Completed: 'status-completed'
      };
      return map[monthlyExpense.thresholdName] || '';
    };
    return (
      <Card className="monthly-info-card">
        <div className="monthly-info-grid">
          <div style={{ width: 300 }}>
            <div className="monthly-info-item">
              <span className="monthly-info-label">المبلغ الإجمالي:</span>
              <span className="monthly-info-value amount">
                {monthlyExpense.totalAmount?.toLocaleString()} د.ع
              </span>
            </div>
            <div className="monthly-info-item">
              <span className="monthly-info-label">اسم المشرف:</span>
              <span className="monthly-info-value">{monthlyExpense.profileFullName}</span>
            </div>
            <div className="monthly-info-item">
              <span className="monthly-info-label">اسم المكتب:</span>
              <span className="monthly-info-value">{monthlyExpense.officeName}</span>
            </div>
            <div className="monthly-info-item">
              <span className="monthly-info-label">المحافظة:</span>
              <span className="monthly-info-value">{monthlyExpense.governorateName}</span>
            </div>
          </div>
          <div className="left-content-monthly-expenseview">
            <div>
              <div className="monthly-info-item">
                <span className="monthly-info-label">حالة الطلب:</span>
                <span className={`monthly-info-value ${getStatusClass(monthlyExpense.status)}`}>
                  {statusMap[monthlyExpense.status] || 'غير معروف'}
                </span>
              </div>
              <div className="monthly-info-item">
                <span className="monthly-info-label">مستوى الإنفاق:</span>
                <span
                  className="monthly-info-value"
                  style={{
                    color:
                      monthlyExpense.thresholdName === 'Low'
                        ? 'green'
                        : monthlyExpense.thresholdName === 'Medium'
                        ? '#ffd700'
                        : 'red'
                  }}
                >
                  {monthlyExpense.thresholdName}
                </span>
              </div>
              <div className="monthly-info-item">
                <span className="monthly-info-label">تاريخ الإنشاء:</span>
                <span className="monthly-info-value">
                  {new Date(monthlyExpense.dateCreated).toLocaleDateString('en')}
                </span>
              </div>
              <div className="monthly-info-item">
                <span className="monthly-info-label">ملاحظات:</span>
                <span className="monthly-info-value">
                  {monthlyExpense.notes || 'لا توجد ملاحظات'}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <h2>أنواع المصروفات</h2>
              <PieChart width={300} height={300}>
                <Pie
                  data={expenseTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  dataKey="value"
                >
                  {expenseTypeData.map((entry, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className={`monthly-expense-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`} dir="rtl">
      <div style={{ margin: 10 }}>
        {renderActionButton()}
      </div>

      <Card className="monthly-expense-card">
        <div className="monthly-expense-header">
          <div className="header-content">
            <h1>تفاصيل المصروف الشهري</h1>
          </div>
        </div>

        <MonthlyExpenseInfo />

        <ConfigProvider direction="rtl">
          <Table
            className="expenses-table-monthley-in-details"
            dataSource={dailyExpenses}
            columns={columns}
            loading={loading}
            bordered
            pagination={{ pageSize: 5, position: ['bottomCenter'], showSizeChanger: false }}
          />
        </ConfigProvider>

        {monthlyExpenseId && (
          <div style={{ marginTop: 20 }}>
            <h1 className="header-content">سجل الإجراءات</h1>
            <ActionsTable monthlyExpensesId={monthlyExpenseId} />
          </div>
        )}
      </Card>

      {/* Send to Coordinator Modal */}
      <Modal
        title="إرسال المصروف الى منسق المشروع"
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => { setIsModalVisible(false); form.resetFields(); }}
        confirmLoading={sendingLoading}
        okText="إرسال"
        cancelText="إلغاء"
        dir="rtl"
      >
        <Form form={form} layout="vertical" onFinish={handleSendToCoordinator}>
          <Form.Item
            name="notes"
            label="الملاحظات"
            rules={[{ required: true, message: 'الرجاء إدخال الملاحظات' }]}
          >
            <TextArea rows={4} placeholder="أدخل الملاحظات..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Completion Modal */}
      <Modal
        title="اتمام عملية مصاريف الشهر"
        open={isCompletionModalVisible}
        onOk={() => completionForm.submit()}
        onCancel={() => { setIsCompletionModalVisible(false); completionForm.resetFields(); }}
        confirmLoading={completingLoading}
        okText="تأكيد"
        cancelText="إلغاء"
        dir="rtl"
      >
        <Form form={completionForm} layout="vertical" onFinish={handleCompleteMonthlyExpense}>
          <Form.Item
            name="notes"
            label="الملاحظات"
            rules={[{ required: true, message: 'الرجاء إدخال الملاحظات' }]}
          >
            <TextArea rows={4} placeholder="أدخل الملاحظات..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
