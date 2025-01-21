import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Table, Card, ConfigProvider, message, Button, Modal, Input, Space, Form } from 'antd';
import { Link } from 'react-router-dom';
import { SendOutlined, CheckCircleOutlined } from '@ant-design/icons';
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
            const response = await axiosInstance.get(`/api/Actions/${monthlyExpensesId}`);
            const formattedActions = response.data.map((action) => {
                const date = new Date(action.dateCreated);
                return {
                    key: action.id,
                    actionType: action.actionType,
                    notes: action.notes,
                    date: date.toISOString().split('T')[0],
                    time: date.toLocaleTimeString('ar-EG', { 
                        hour12: true,
                        hour: "2-digit",
                        minute: "2-digit"
                    })
                };
            });
            setActions(formattedActions);
        } catch (error) {
            console.error('Error fetching actions:', error);
            message.error('حدث خطأ في جلب سجل الإجراءات');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (monthlyExpensesId) {
            fetchActions();
        }
    }, [monthlyExpensesId]);

    const actionColumns = [
        {
            title: 'نوع الإجراء',
            dataIndex: 'actionType',
            key: 'actionType',
            align: 'right',
        },
        {
            title: 'الملاحظات',
            dataIndex: 'notes',
            key: 'notes',
            align: 'right',
        },
        {
            title: 'التاريخ',
            dataIndex: 'date',
            key: 'date',
            align: 'center',
        },
        {
            title: 'الوقت',
            dataIndex: 'time',
            key: 'time',
            align: 'center',
        }
    ];

    return (
        <ConfigProvider direction="rtl">
            <Table
                className="actions-table"
                columns={actionColumns}
                dataSource={actions}
                loading={loading}
                pagination={{
                    pageSize: 5,
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
    const { isSidebarCollapsed, profile } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [sendingLoading, setSendingLoading] = useState(false);
    const [monthlyExpense, setMonthlyExpense] = useState(null);
    const [dailyExpenses, setDailyExpenses] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isCompletionModalVisible, setIsCompletionModalVisible] = useState(false);
    const [notes, setNotes] = useState('');
    const [completingLoading, setCompletingLoading] = useState(false);
    const [form] = Form.useForm();
    const [completionForm] = Form.useForm();
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF6384', '#36A2EB'];
    const [expenseTypeData, setExpenseTypeData] = useState([]);

    const fetchMonthlyExpenseDetails = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/api/Expense/${monthlyExpenseId}`);
            setMonthlyExpense(response.data);
        } catch (error) {
            console.error('Error fetching monthly expense:', error);
            message.error('حدث خطأ في جلب تفاصيل المصروف الشهري');
        }
    };

    const fetchDailyExpenses = async () => {
        try {
            const response = await axiosInstance.get(`/api/Expense/${monthlyExpenseId}/daily-expenses`);
            const formattedExpenses = response.data.map(expense => ({
                key: expense.id,
                id: expense.id,
                date: new Date(expense.expenseDate).toISOString().split('T')[0],
                price: expense.price,
                quantity: expense.quantity,
                totalAmount: expense.amount,
                notes: expense.notes,
                expenseTypeName: expense.expenseTypeName
            }));
            setDailyExpenses(formattedExpenses);
            
            // Process data for pie chart
            const typeDistribution = formattedExpenses.reduce((acc, curr) => {
                const type = curr.expenseTypeName;
                if (!acc[type]) acc[type] = 0;
                acc[type] += curr.price * curr.quantity;
                return acc;
            }, {});
            
            const chartData = Object.entries(typeDistribution).map(([type, value]) => ({
                name: type,
                value,
            }));
            
            setExpenseTypeData(chartData);
        } catch (error) {
            console.error('Error fetching daily expenses:', error);
            message.error('حدث خطأ في جلب المصروفات اليومية');
        } finally {
            setLoading(false);
        }
    };

    const handleSendToCoordinator = async () => {
        try {
            // Validate form before proceeding
            await form.validateFields();
            
            setSendingLoading(true);

            let actionType = "Approval";
            let actionNotes = notes;

            // Determine action type and notes based on current status
            if (monthlyExpense?.status === 'ReturnedToSupervisor') {
                actionType = `تم التعديل من قبل المشرف ${profile?.name || ''} `;
                actionNotes = notes;
            }

            // First update the status
            await axiosInstance.post(`/api/Expense/${monthlyExpenseId}/status`, {
                monthlyExpensesId: monthlyExpenseId,
                newStatus: 1,
            });

            // Then create an action with dynamic type and notes
            await axiosInstance.post('/api/Actions', {
                actionType: actionType,
                notes: actionNotes,
                profileId: profile?.profileId,
                monthlyExpensesId: monthlyExpenseId
            });

            message.success('تم إرسال المصروف بنجاح إلى منسق المشروع');
            setIsModalVisible(false);
            form.resetFields();
            setNotes('');
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

    const handleCompleteMonthlyExpense = async () => {
        try {
            await completionForm.validateFields();
            
            setCompletingLoading(true);
            
            // Update status to Completed (9)
            await axiosInstance.post(`/api/Expense/${monthlyExpenseId}/status`, {
                monthlyExpensesId: monthlyExpenseId,
                newStatus: 9,
            });

            // Create action with supervisor completion note
            const actionType = `تم اتمام مصروف الشهر من قبل المشرف ${profile?.name || ''}`;
            const actionNotes = notes;

            await axiosInstance.post('/api/Actions', {
                actionType: actionType,
                notes: actionNotes,
                profileId: profile?.profileId,
                monthlyExpensesId: monthlyExpenseId
            });

            message.success('تم اتمام عملية مصاريف الشهر بنجاح');
            setIsCompletionModalVisible(false);
            completionForm.resetFields();
            setNotes('');
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

    useEffect(() => {
        if (monthlyExpenseId) {
            fetchMonthlyExpenseDetails();
            fetchDailyExpenses();
        }
    }, [monthlyExpenseId]);

    const columns = [
        {
            title: 'التاريخ',
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: 'نوع المصروف',
            dataIndex: 'expenseTypeName',
            key: 'expenseTypeName',
        },
        {
            title: 'السعر',
            dataIndex: 'price',
            key: 'price',
            render: (amount) => (
                <span className="monthly-info-value amount">
                    {amount.toLocaleString()} د.ع
                </span>
            ),
        },
        {
            title: 'الكمية',
            dataIndex: 'quantity',
            key: 'quantity',
        },
        {
            title: 'المبلغ الإجمالي',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (amount) => (
                <span className="monthly-info-value amount">
                    {amount.toLocaleString('en-US', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                    })} د.ع
                </span>
            ),
        },
        {
            title: 'ملاحظات',
            dataIndex: 'notes',
            key: 'notes',
            ellipsis: true,
        },
        {
            title: 'الإجراءات',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Link to="/Expensess-view-daily" state={{ dailyExpenseId: record.id }}>
                        <Button type="primary" className="action-button">عرض</Button>
                    </Link>
                </Space>
            ),
        },
    ];

    const MonthlyExpenseInfo = () => {
        if (!monthlyExpense) return null;

        const getStatusClass = (status) => {
            const statusMap = {
                'ReturnedToSupervisor': 'status-returned',
                'Low': 'status-low',
                'RecievedBySupervisor': 'status-received',
                'Completed': 'status-completed'
            };
            return statusMap[status] || '';
        };

        const statusDisplayNames = {
            New: "جديد",
            SentToProjectCoordinator: "تم الإرسال إلى منسق المشروع",
            ReturnedToProjectCoordinator: "تم الإرجاع إلى منسق المشروع",
            SentToManager: "تم الإرسال إلى المدير",
            ReturnedToManager: "تم الإرجاع إلى المدير",
            SentToDirector: "تم الإرسال إلى المدير التنفيذي",
            ReturnedToSupervisor: "تم الإرجاع إلى المشرف",
            RecievedBySupervisor: "تم الاستلام من قبل المشرف",
            SentFromDirector: "تم الموافقة من المدير التنفيذي",
            Completed: "مكتمل",
        };

        return (
            <Card className="monthly-info-card">
                <div className="monthly-info-grid">
                    <div style={{width:"300px"}}>
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
                    <div className='left-content-monthly-expenseview'>
                        <div>
                            <div className="monthly-info-item">
                                <span className="monthly-info-label">حالة الطلب:</span>
                                <span className={`monthly-info-value ${getStatusClass(monthlyExpense.status)}`}>
                                    {statusDisplayNames[monthlyExpense.status] || "غير معروف"}
                                </span>
                            </div>
                            <div className="monthly-info-item">
                              <span className="monthly-info-label">مستوى الإنفاق:</span>
                              <span
                                className="monthly-info-value"
                                style={{
                                  color:
                                    monthlyExpense.thresholdName === "Low"
                                      ? "green"
                                      : monthlyExpense.thresholdName === "Medium"
                                      ? "#ffd700"
                                      : "red", // Default to red for "High"
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
                        <div style={{textAlign:"center"}}>
                            <h2>أنواع المصروفات</h2>
                            <PieChart width={300} height={300}>
                                <Pie
                                    data={expenseTypeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={120}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {expenseTypeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                <Button 
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={() => setIsModalVisible(true)}
                    className="send-button"
                >
                    ارسال الى منسق المشروع بعد التعديل
                </Button>
            );
        }
        
        return null;
    };

    return (
        <div className={`monthly-expense-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`} dir="rtl">
            <div style={{margin:"10px"}}>
                {renderActionButton()}
            </div>
            <Card className="monthly-expense-card">
                <div className="monthly-expense-header">
                    <div className="header-content">
                        <h2 className="monthly-expense-title">تفاصيل المصروف الشهري</h2>
                    </div>
                </div>
                
                <MonthlyExpenseInfo />

                <ConfigProvider direction="rtl">
                    <Table
                        className="expenses-table"
                        dataSource={dailyExpenses}
                        columns={columns}
                        loading={loading}
                        pagination={{
                            pageSize: 5,
                            position: ['bottomCenter'],
                            showSizeChanger: false,
                        }}
                    />
                </ConfigProvider>

                {/* Actions Table Section */}
                {monthlyExpenseId && (
                    <div style={{ marginTop: '20px' }}>
                        <h2 className="monthly-expense-title">سجل الإجراءات</h2>
                        <ActionsTable monthlyExpensesId={monthlyExpenseId} />
                    </div>
                )}
            </Card>

            {/* Send to Coordinator Modal */}
            <Modal
                title="إرسال المصروف الى منسق المشروع"
                open={isModalVisible}
                onOk={() => form.submit()}
                onCancel={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                    setNotes('');
                }}
                confirmLoading={sendingLoading}
                okText="إرسال"
                cancelText="إلغاء"
                dir="rtl"
            >
                <Form
                    form={form}
                    onFinish={handleSendToCoordinator}
                    layout="vertical"
                >
                    <Form.Item
                        name="notes"
                        label="الملاحظات"
                        rules={[
                            {
                                required: true,
                                message: 'الرجاء إدخال الملاحظات',
                            }
                        ]}
                    >
                        <TextArea
                            rows={4}
                            placeholder="أدخل الملاحظات..."
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Completion Modal */}
            <Modal
                title="اتمام عملية مصاريف الشهر"
                open={isCompletionModalVisible}
                onOk={() => completionForm.submit()}
                onCancel={() => {
                    setIsCompletionModalVisible(false);
                    completionForm.resetFields();
                    setNotes('');
                }}
                confirmLoading={completingLoading}
                okText="تأكيد"
                cancelText="إلغاء"
                dir="rtl"
            >
                <Form
                    form={completionForm}
                    onFinish={handleCompleteMonthlyExpense}
                    layout="vertical"
                >
                    <Form.Item
                        name="notes"
                        label="الملاحظات"
                        rules={[
                            {
                                required: true,
                                message: 'الرجاء إدخال الملاحظات',
                            }
                        ]}
                    >
                        <TextArea
                            rows={4}
                            placeholder="أدخل الملاحظات..."
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}