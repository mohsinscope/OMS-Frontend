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
import dayjs from 'dayjs';
const { TextArea } = Input;
const shouldUseNewWorkflow = (dateString) => {
  const expenseDate = dayjs(dateString);
  const cutoffDate = dayjs('2025-10-02');
  return expenseDate.isAfter(cutoffDate);
};
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
// New Action Logs Table Component for workflow after 2025/10/02
const NewActionLogsTable = ({ monthlyExpensesId }) => {
  const [actionLogs, setActionLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  const actorMap = {
    1: "المشرف",
    2: "منسق المشروع",
    3: "مدقق الحسابات",
    4: "المدير",
    5: "المدير التنفيذي",
    6: "مدير الحسابات",
  };

  const stageMap = {
    1: "المشرف",
    2: "منسق المشروع",
    3: "مدقق الحسابات",
    4: "المدير",
    5: "المدير التنفيذي",
    6: "مدير الحسابات",
    7: "مكتمل",
  };

  const fetchActionLogs = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(
        `/api/MonthlyExpensesWorkflow/${monthlyExpensesId}/action-logs`,
        { params: { PageNumber: currentPage, PageSize: 10 } }
      );
      setActionLogs(data.items || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching action logs:', error);
      message.error('حدث خطأ في جلب سجل الإجراءات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (monthlyExpensesId) fetchActionLogs();
  }, [monthlyExpensesId, currentPage]);

  const columns = [
    {
      title: 'التاريخ والوقت',
      dataIndex: 'performedAtUtc',
      key: 'performedAtUtc',
      render: date => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: 'المنفذ',
      dataIndex: 'actor',
      key: 'actor',
      render: actor => actorMap[actor] || actor,
    },
    {
      title: 'من مرحلة',
      dataIndex: 'fromStage',
      key: 'fromStage',
      render: stage => stageMap[stage] || stage,
    },
    {
      title: 'إلى مرحلة',
      dataIndex: 'toStage',
      key: 'toStage',
      render: stage => stageMap[stage] || stage,
    },
    {
      title: 'التعليق',
      dataIndex: 'comment',
      key: 'comment',
    },
  ];

  return (
    <ConfigProvider direction="rtl">
      <Table
        className="actions-table"
        columns={columns}
        dataSource={actionLogs}
        loading={loading}
        rowKey="id"
        pagination={{
          current: currentPage,
          pageSize: 10,
          total: total,
          onChange: page => setCurrentPage(page),
          position: ['bottomCenter'],
          showSizeChanger: false
        }}
      />
    </ConfigProvider>
  );
};
export default function ExpensessViewMonthly() {
  const location = useLocation();
  const navigate = useNavigate();
  const { monthlyExpenseId } = location.state || {};
  const { isSidebarCollapsed, profile ,roles} = useAuthStore();
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
const [isNewWorkflow, setIsNewWorkflow] = useState(false);
const [workflowActions, setWorkflowActions] = useState(null);
  // Fetch data
const fetchMonthlyExpenseDetails = async () => {
  try {
    setLoading(true);
    const { data } = await axiosInstance.get(`/api/Expense/${monthlyExpenseId}`);
    setMonthlyExpense(data);
    
    // Check if should use new workflow based on expense date
    const useNewWorkflow = shouldUseNewWorkflow(data.dateCreated);
    setIsNewWorkflow(useNewWorkflow);
    
    // If new workflow (expense created after 2025-10-02), fetch available actions
    if (useNewWorkflow) {
      try {
        const actionsResponse = await axiosInstance.get(
          `/api/MonthlyExpensesWorkflow/${monthlyExpenseId}/actions?actor=Supervisor`
        );
        setWorkflowActions(actionsResponse.data);
      } catch (error) {
        console.error('Error fetching workflow actions:', error);
        setWorkflowActions(null);
      }
    }
  } catch (error) {
    console.error('Error fetching monthly expense:', error);
    message.error('حدث خطأ في جلب تفاصيل المصروف الشهري');
  }
};

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
    
    if (isNewWorkflow) {
      // New workflow for expenses after 2025/10/02
      // Check if we have workflow actions and can send
      if (!workflowActions || !workflowActions.actions || workflowActions.actions.length === 0) {
        message.error('لا يمكن إرسال المصروف في الوقت الحالي - لا توجد إجراءات متاحة');
        setSendingLoading(false);
        return;
      }
      
      const sendAction = workflowActions.actions.find(
        action => action.code === "send.projectcoordinator"
      ) || workflowActions.actions[0]; // Fallback to first action if specific not found

      if (sendAction) {
        const workflowPayload = {
          actor: workflowActions.actor, // Use the actor from the response
          actionType: sendAction.actionType,
          to: sendAction.to,
          comment: values.notes || "تم الإرسال من قبل المشرف",
          PerformedByUserId: profile?.userId || profile?.profileId
        };

        await axiosInstance.put(
          `/api/MonthlyExpensesWorkflow/${monthlyExpenseId}/actions`,
          workflowPayload
        );

        message.success('تم إرسال المصروف بنجاح إلى منسق المشروع (النظام الجديد)');
      } else {
        message.error('لا يمكن إرسال المصروف في الوقت الحالي');
        setSendingLoading(false);
        return;
      }
    } else {
      // Old workflow for expenses before or on 2025/10/02
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
    }
    
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
    
    if (isNewWorkflow) {
      // For new workflow, check if there's a complete action available
      const completeAction = workflowActions?.actions?.find(
        action => action.code === "complete" || action.code === "approve"
      );
      
      if (completeAction) {
        await axiosInstance.put(
          `/api/MonthlyExpensesWorkflow/${monthlyExpenseId}/actions`,
          {
            actor: workflowActions.actor,
            actionType: completeAction.actionType,
            to: completeAction.to,
            comment: values.notes || "تم اتمام المصروف من قبل المشرف",
            PerformedByUserId: profile?.userId || profile?.profileId
          }
        );
        message.success('تم اتمام عملية مصاريف الشهر بنجاح (النظام الجديد)');
      } else {
        message.error('لا يمكن اتمام المصروف في الوقت الحالي');
        setCompletingLoading(false);
        return;
      }
    } else {
      // Old workflow
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
    }
    
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
  // For new workflow (expenses created after 2025-10-02)
  if (isNewWorkflow) {
    // Check if supervisor has any actions available
    const hasActions = workflowActions?.actions?.length > 0;
    
    if (hasActions && roles?.includes("MainSupervisor")) {
      // Check what type of action is available
      const sendAction = workflowActions.actions.find(
        a => a.code === "send.projectcoordinator"
      );
      
      if (sendAction) {
        // Show send button (either initial send or after return)
        const buttonText = workflowActions.status === 2 
          ? "ارسال الى منسق المشروع بعد التعديل"
          : "ارسال الى منسق المشروع";
          
        return (
          <Space>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => setIsModalVisible(true)}
              loading={sendingLoading}
              className="send-button"
            >
              {buttonText}
            </Button>
            {workflowActions.status === 2 && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() =>
                  navigate('/add-daily-expense', {
                    state: {
                      monthlyExpenseId,
                      totalMonthlyAmount: monthlyExpense.totalAmount,
                      status: 'Returned'
                    }
                  })
                }
                className="send-button"
              >
                إضافة مصروف يومي
              </Button>
            )}
          </Space>
        );
      }
    }
    
    // No actions available in new workflow
    return null;
  }
  
  // OLD WORKFLOW LOGIC (for expenses created before or on 2025-10-02)
  if (monthlyExpense?.status === 'RecievedBySupervisor' && roles?.includes("MainSupervisor")) {
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
  
  if (monthlyExpense?.status === 'ReturnedToSupervisor' && roles?.includes("MainSupervisor")) {
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
                totalMonthlyAmount: monthlyExpense.totalAmount,
                status: monthlyExpense.status   
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
{isNewWorkflow && (
  <div className="monthly-info-item">
    <span className="monthly-info-label">نظام العمل:</span>
    <span className="monthly-info-value" style={{ color: '#1890ff' }}>
      النظام الجديد
    </span>
  </div>
)}
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
    <h1 className="header-content">
      سجل الإجراءات {isNewWorkflow && "(النظام الجديد)"}
    </h1>
    {isNewWorkflow ? (
      <NewActionLogsTable monthlyExpensesId={monthlyExpenseId} />
    ) : (
      <ActionsTable monthlyExpensesId={monthlyExpenseId} />
    )}
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
