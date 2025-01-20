import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Table, Card, ConfigProvider, message, Button, Modal, Input, Space } from 'antd';
import { Link } from 'react-router-dom';
import { SendOutlined, CheckCircleOutlined } from '@ant-design/icons';
import axiosInstance from '../../../intercepters/axiosInstance';
import useAuthStore from '../../../store/store';
import './styles/ExpensessViewMonthly.css';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

const { TextArea } = Input;

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
    const [notes, setNotes] = useState('');
    const [completingLoading, setCompletingLoading] = useState(false);
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
            const typeDistribution = formattedExpenses.reduce((acc, curr) => {
                const type = curr.expenseTypeName;
                if (!acc[type]) acc[type] = 0;
                acc[type] += curr.totalAmount;
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
            setSendingLoading(true);

            let actionType = "Approval";
            let actionNotes = notes || "Approved for processing.";

            // Determine action type and notes based on current status
            if (monthlyExpense?.status === 'ReturnedToSupervisor') {
                actionType = "ResubmitAfterReturn";
                actionNotes = `تم الارسال الى منسق المشروع بعد التعديل من قبل ${profile?.name || ''} ${profile?.position || ''}${notes ? ` - ${notes}` : ''}`;
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
            // Navigate back
            navigate(-1);
            
        } catch (error) {
            console.error('Error sending to coordinator:', error);
            message.error('حدث خطأ في إرسال المصروف');
        } finally {
            setSendingLoading(false);
        }}

    const handleCompleteMonthlyExpense = async () => {
        try {
            setCompletingLoading(true);
            
            // Update status to Completed (9)
            await axiosInstance.post(`/api/Expense/${monthlyExpenseId}/status`, {
                monthlyExpensesId: monthlyExpenseId,
                newStatus: 9,
                notes: "Monthly expenses completed by Supervisor"
            });

            message.success('تم اتمام عملية مصاريف الشهر بنجاح');
            // Navigate back
            navigate(-1);
            
        } catch (error) {
            console.error('Error completing monthly expense:', error);
            message.error('حدث خطأ في اتمام عملية مصاريف الشهر');
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
            SentFromDirector: "تم الموافقة من قبل اسامة",
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
                            <span
                                className={`monthly-info-value ${getStatusClass(monthlyExpense.status)}`}
                            
                            >
                                {statusDisplayNames[monthlyExpense.status] || "غير معروف"}
                            </span>
                        </div>
                        <div className="monthly-info-item">
                            <span className="monthly-info-label">مستوى الإنفاق:</span>
                            <span className="monthly-info-value">{monthlyExpense.thresholdName}</span>
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
                        <div style={{textAlign:"center"}} >
                            <h2> أنواع المصروفات</h2>
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
                    onClick={handleCompleteMonthlyExpense}
                    loading={completingLoading}
                    className="send-button"
                >
                    اتمام عملية مصاريف الشهر
                </Button>
            );
        }
        
        if (monthlyExpense?.status === 'RecievedBySupervisor') {
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
        
        return null; // Do not render the button for other statuses
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
            </Card>
            <ConfigProvider direction="rtl">
            <Modal
                title="إرسال المصروف الى منسق المشروع"
                open={isModalVisible}
                onOk={handleSendToCoordinator}
                onCancel={() => setIsModalVisible(false)}
                confirmLoading={sendingLoading}
                okText="إرسال"
                cancelText="إلغاء"
                dir="rtl"
            >
                <div style={{ marginTop: '16px' }}>
                    <TextArea
                        rows={4}
                        placeholder="أدخل الملاحظات..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>
            </Modal>
            </ConfigProvider>
        </div>
    );
}