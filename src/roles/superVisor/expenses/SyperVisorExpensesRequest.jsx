import React, { useState, useEffect } from "react";
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
  ConfigProvider,
  Collapse,
} from "antd";
import { PlusCircleOutlined, CalendarOutlined } from "@ant-design/icons";
import useAuthStore from "../../../store/store";
import axiosInstance from "../../../intercepters/axiosInstance.js";
import { Link } from "react-router-dom";
import "./styles/SuperVisorExpinsesRequest.css";

export default function SuperVisorExpensesRequest() {
  const { profile, isSidebarCollapsed } = useAuthStore();
  const [currentMonthlyExpenseId, setCurrentMonthlyExpenseId] = useState(null);
  const [canCreateMonthly, setCanCreateMonthly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [currentMonthDailyExpenses, setCurrentMonthDailyExpenses] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [isMonthlyModalVisible, setIsMonthlyModalVisible] = useState(false);
  const [monthlyForm] = Form.useForm();
  const [isSendModalVisible, setIsSendModalVisible] = useState(false);
  const [sendForm] = Form.useForm();
  const [sendLoading, setSendLoading] = useState(false);
  const [lastMonthExpense, setLastMonthExpense] = useState(null);

  const [officeInfo, setOfficeInfo] = useState({
    totalCount: 0,
    totalExpenses: 0,
    date: new Date().toISOString().split("T")[0],
    governorate: profile?.governorateName || "",
    officeName: profile?.officeName || "",
    supervisorName: profile?.fullName || "",
  });

  const arabicMonths = [
    "الواحد",
    "الثاني",
    "الثالث",
    "الرابع",
    "الخامس",
    "السادس",
    "السابع",
    "الثامن",
    "التاسع",
    "العاشر",
    "الحادي عشر",
    "الثناي عشر",
  ];

  const formattedDate = new Date(officeInfo.date);
  const displayMonthNumber = formattedDate.getMonth() + 1;
  const displayMonthName = arabicMonths[formattedDate.getMonth()];

  const fetchLastMonthExpense = async () => {
    try {
      const response = await axiosInstance.post("/api/Expense/search-last-month", {
        officeId: profile?.officeId
      });
      setLastMonthExpense(response.data);
    } catch (error) {
      console.error("Error fetching last month expense:", error);
      message.error("حدث خطأ في جلب بيانات الشهر السابق");
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'Pending': '#ffa940',
      'SentToProjectCoordinator': '#1890ff',
      'Approved': '#52c41a',
      'Rejected': '#ff4d4f'
    };
    return statusColors[status] || '#000000';
  };

  const fetchExpenseTypes = async () => {
    try {
      const response = await axiosInstance.get(
        "/api/ExpenseType?PageNumber=1&PageSize=10"
      );
      setExpenseTypes(response.data || []);
    } catch (error) {
      console.error("Error fetching expense types:", error);
      message.error("حدث خطأ في جلب أنواع المصروفات");
    }
  };

  const fetchMonthlyExpense = async () => {
    try {
      const payload = {
        officeId: profile?.officeId,
        governorateId: profile?.governorateId,
        profileId: profile?.profileId,
        status: 0,
        startDate: null,
        endDate: null,
        PaginationParams: {
          PageNumber: 1,
          PageSize: 10,
        },
      };

      const response = await axiosInstance.post("/api/Expense/search", payload);

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
      console.error("Error fetching monthly expenses:", error);
      message.error("حدث خطأ في جلب المصروفات الشهرية");
    }
  };

  const fetchDailyExpenses = async (monthlyExpenseId) => {
    if (!monthlyExpenseId) return;

    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/api/Expense/${monthlyExpenseId}/daily-expenses`
      );

      if (response.data && response.data.length > 0) {
        const formattedDailyExpenses = response.data.map((expense) => ({
          key: expense.id,
          id: expense.id,
          date: new Date(expense.expenseDate).toISOString().split("T")[0],
          price: expense.price,
          quantity: expense.quantity,
          totalAmount: expense.amount,
          notes: expense.notes,
          expenseTypeName: expense.expenseTypeName,
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

  const handleCreateMonthlyExpense = async (values) => {
    try {
      setLoading(true);
      const payload = {
        totalAmount: 0,
        notes: "",
        status: 0,
        officeId: profile?.officeId,
        governorateId: profile?.governorateId,
        profileId: profile?.profileId,
      };

      const response = await axiosInstance.post(
        "/api/Expense/MonthlyExpenses",
        payload
      );

      if (response.data) {
        setCurrentMonthlyExpenseId(response.data.id);
        message.success("تم إنشاء المصروف الشهري بنجاح");
        setIsMonthlyModalVisible(false);
        monthlyForm.resetFields();
        setCanCreateMonthly(false);
        fetchDailyExpenses(response.data.id);
      }
    } catch (error) {
      console.error("Error creating monthly expense:", error);
      message.error("حدث خطأ في إنشاء المصروف الشهري");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMonthlyExpense = async (values) => {
    try {
      setSendLoading(true);
      const payload = {
        monthlyExpensesId: currentMonthlyExpenseId,
        newStatus: 1,
        notes: values.notes || "Monthly expenses marked as completed by the Manager."
      };

      await axiosInstance.post(
        `/api/Expense/${currentMonthlyExpenseId}/status`,
        payload
      );

      message.success("تم إرسال المصروف الشهري بنجاح");
      setIsSendModalVisible(false);
      sendForm.resetFields();
      fetchMonthlyExpense();
    } catch (error) {
      console.error("Error sending monthly expense:", error);
      message.error("حدث خطأ في إرسال المصروف الشهري");
    } finally {
      setSendLoading(false);
    }
  };

  const updateOfficeInfo = (expenses) => {
    const totalExpenses = expenses.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );
    setOfficeInfo((prev) => ({
      ...prev,
      totalCount: expenses.length,
      totalExpenses,
    }));
  };

  const expandedRowRender = () => {
    if (!lastMonthExpense) return null;

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('ar-IQ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    return (
      <div style={{ padding: '20px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '16px', color: '#1890ff' }}>حالة مصروفات الشهر السابق</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <p><strong>المبلغ الإجمالي:</strong> <span style={{ color: '#52c41a' }}>{lastMonthExpense.totalAmount?.toLocaleString()} د.ع</span></p>
            <p><strong>حالة الطلب:</strong> <span style={{ color: getStatusColor(lastMonthExpense.status) }}>{lastMonthExpense.status}</span></p>
            <p><strong>اسم المكتب:</strong> {lastMonthExpense.officeName}</p>
            <p><strong>المحافظة:</strong> {lastMonthExpense.governorateName}</p>
          </div>
          <div>
            <p><strong>اسم المشرف:</strong> {lastMonthExpense.profileFullName}</p>
            <p><strong>مستوى الإنفاق:</strong> {lastMonthExpense.thresholdName}</p>
            <p><strong>تاريخ الإنشاء:</strong> {formatDate(lastMonthExpense.dateCreated)}</p>
            <p><strong>ملاحظات:</strong> {lastMonthExpense.notes}</p>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    fetchExpenseTypes();
    fetchMonthlyExpense();
    if (profile?.officeId) {
      fetchLastMonthExpense();
    }
  }, [profile?.officeId]);

  const columns = [
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "السعر",
      dataIndex: "price",
      key: "price",
      render: (amount) => (
        <span style={{ color: amount > 0 ? "#02aa0a" : "#ff4d4f" }}>
          {amount.toLocaleString()} د.ع
        </span>
      ),
    },
    {
      title: "الكمية",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "المبلغ الإجمالي",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount) => (
        <span style={{ color: amount > 0 ? "#02aa0a" : "#ff4d4f" }}>
          {amount.toLocaleString()} د.ع
        </span>
      ),
    },
    {
      title: "ملاحظات",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (_, record) => (
        <Link to="/Expensess-view-daily" state={{ dailyExpenseId: record.id }}>
          <Button type="primary">عرض</Button>
        </Link>
      ),
    },
  ];

  const EmptyStateCard = () => {
    const { Panel } = Collapse;
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('ar-IQ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const lastMonthColumns = lastMonthExpense ? [
      {
        title: "المبلغ الإجمالي",
        dataIndex: "totalAmount",
        key: "totalAmount",
        render: (text) => <span style={{ color: '#52c41a' }}>{text?.toLocaleString()} د.ع</span>,
        width: "12.5%"
      },
      {
        title: "حالة الطلب",
        dataIndex: "status",
        key: "status",
        render: (text) => <span style={{ color: getStatusColor(text) }}>{text}</span>,
        width: "12.5%"
      },
      {
        title: "اسم المكتب",
        dataIndex: "officeName",
        key: "officeName",
        width: "12.5%"
      },
      {
        title: "المحافظة",
        dataIndex: "governorateName",
        key: "governorateName",
        width: "12.5%"
      },
      {
        title: "اسم المشرف",
        dataIndex: "profileFullName",
        key: "profileFullName",
        width: "12.5%"
      },
      {
        title: "مستوى الإنفاق",
        dataIndex: "thresholdName",
        key: "thresholdName",
        width: "12.5%"
      },
      {
        title: "تاريخ الإنشاء",
        dataIndex: "dateCreated",
        key: "dateCreated",
        render: (text) => formatDate(text),
        width: "12.5%"
      },
      {
        title: "ملاحظات",
        dataIndex: "notes",
        key: "notes",
        width: "12.5%"
      },...(lastMonthExpense.status === 'ReturnedToSupervisor' ? [{
        title: "الإجراءات",
        key: "actions",
        render: (_, record) => (
          <Link to="/ExpensessViewMonthly" state={{ monthlyExpenseId: record.id }}>
            <Button type="primary">عرض</Button>
          </Link>
        ),
        width: "10%"
      }] : [])
    ] : [];

    const getLastMonthData = () => {
      if (!lastMonthExpense) return [];
      return [lastMonthExpense];
    };

    return (
      <div style={{ width: "100%" }}>
        <div
          className="empty-state-container"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px",
            backgroundColor: "#fff",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            minHeight: "200px",
            marginBottom: "24px",
          }}>
          <CalendarOutlined
            style={{
              fontSize: "64px",
              color: "#1890ff",
              marginBottom: "24px",
            }}
          />
          <h1 style={{ marginBottom: "16px", textAlign: "center" }}>
            لا يوجد مصروف شهري للشهر الحالي
          </h1>
          <p
            style={{
              color: "#666",
              marginBottom: "32px",
              textAlign: "center",
              fontSize: "16px",
            }}>
            يمكنك إنشاء مصروف شهري جديد للبدء في تسجيل المصروفات اليومية
          </p>
          <Button
            type="primary"
            size="large"
            icon={<PlusCircleOutlined />}
            onClick={() => setIsMonthlyModalVisible(true)}
            style={{
              height: "48px",
              padding: "0 32px",
              fontSize: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
            إنشاء مصروف شهري جديد
          </Button>
        </div>

        {lastMonthExpense && (
          <Collapse 
            defaultActiveKey={[]} 
            style={{ marginBottom: "24px" }}
          >
            <Panel 
              header={ <>
              
                <span style={{ fontWeight: "bold", fontSize: "16px" }}>
                  عرض مصروفات الشهر السابق
                </span>
                <span style={{color:"blue"}}>  {lastMonthExpense.status}</span>
                </>

              } 
              key="1"
            >
              <Table
                dataSource={getLastMonthData()}
                columns={lastMonthColumns}
                pagination={false}
                bordered
                size="middle"
                scroll={{ x: true }}
                style={{ overflowX: 'auto' }}
              />
            </Panel>
          </Collapse>
        )}
      </div>
    );
  };

  return (
    <div
      className={`supervisor-expenses-history-page ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl"
      style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "24px",
          marginBottom: "24px",
        }}>
        {!canCreateMonthly ? (
          <Card className="office-info-card" style={{ width: "25%", flexShrink: 0 }}>
            <h1 style={{ marginBottom: "24px", textAlign: "center" }}>
              معلومات المكتب
            </h1>
            <h3 style={{ marginBottom: "24px", textAlign: "center" }}>
              صرفيات شهر :{" "}
              <span style={{ color: "#DAA520", fontWeight: "bold" }}>
                {displayMonthName}
              </span>
            </h3>
            <hr
              style={{
                width: "100%",
                height: "1px",
                border: "none",
                background: "linear-gradient(to right, #e0e0e0, #000, #e0e0e0)",
                marginBottom: "12px",
              }}
            />
            <div className="office-info" style={{ fontSize: "18px" }}>
              <div
                style={{
                  marginBottom: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                }}>
                <span>المحافظة:</span>
                <strong style={{ color: "#4096ff" }}>
                  {officeInfo.governorate}
                </strong>
              </div>
              <div
                style={{
                  marginBottom: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                }}>
                <span>اسم المكتب:</span>
                <strong style={{ color: "#4096ff" }}>
                  {officeInfo.officeName}
                </strong>
              </div>
              <div
                style={{
                  marginBottom: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                }}>
                <span>اسم المشرف:</span>
                <strong style={{ color: "#4096ff" }}>
                  {officeInfo.supervisorName}
                </strong>
              </div>
              <div
                style={{
                  height: "1px",
                  backgroundColor: "#E0E0E0",
                  margin: "16px 0",
                }}
              />
              <div
                style={{
                  marginBottom: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                }}>
                <span>العدد الكلي:</span>
                <strong>{officeInfo.totalCount}</strong>
              </div>
              <div
                style={{
                  marginBottom: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                }}>
                <span>إجمالي الصرفيات:</span>
                <strong style={{ color: "#02aa0a" }}>
                  {officeInfo.totalExpenses.toLocaleString()} د.ع
                </strong>
              </div>
              <div
                style={{
                  marginBottom: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                }}>
                <span>التاريخ:</span>
                <strong>{officeInfo.date}</strong>
              </div>
            </div>
            <Space
              direction="vertical"
              style={{ width: "100%", marginTop: "24px" }}>
              <Link
                to="/add-daily-expense"
                state={{ monthlyExpenseId: currentMonthlyExpenseId }}>
                <Button type="primary" block size="large">
                  إضافة مصروف يومي
                </Button>
              </Link>
              <Button
                color="default"
                variant="outlined"
                block
                size="large"
                onClick={() => setIsSendModalVisible(true)}>
                ارسال طلبات الشهر الكلية
              </Button>
            </Space>
          </Card>
        ) : null}

        <div style={{ flex: 1 }}>
          {canCreateMonthly ? (
            <EmptyStateCard />
          ) : (
            <Card className="expenses-table-card">
              <h1 style={{ marginBottom: "5px" }}>
                المصروفات اليومية للشهر الحالي
              </h1>
              <ConfigProvider direction="rtl">
                <Table
                  dataSource={currentMonthDailyExpenses}
                  columns={columns}
                  loading={loading}
                  rowKey="id"
                  expandable={{
                    expandedRowRender,
                    expandRowByClick: true,
                  }}
                  pagination={{
                    pageSize: 5,
                    position: ["bottomCenter"],
                    showSizeChanger: false,
                  }}
                  style={{ marginTop: "5px" }}
                />
              </ConfigProvider>
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
        style={{ direction: "rtl" }}>
        <Form
          form={monthlyForm}
          onFinish={handleCreateMonthlyExpense}
          layout="vertical"
          className="new-expensess-monthly"
          style={{ marginTop: "10px" }}>
          <Form.Item
            name="notes"
            label="هل انت متأكد من انشاء مصروف لهذا الشهر"
            style={{ width: "100%" }}>
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large">
              إنشاء
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Send Modal */}
      <Modal
        title="إرسال المصروف الشهري"
        open={isSendModalVisible}
        onCancel={() => {
          setIsSendModalVisible(false);
          sendForm.resetFields();
        }}
        footer={null}
        style={{ direction: "rtl" }}>
        <Form
          form={sendForm}
          onFinish={handleSendMonthlyExpense}
          layout="vertical"
          style={{ marginTop: "10px" }}>
          <Form.Item
            name="notes"
            label="ملاحظات"
            style={{ width: "100%" }}>
            <Input.TextArea
              rows={4}
              placeholder="أدخل الملاحظات"
              style={{ resize: "none" }}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={sendLoading}
              block
              size="large">
              إرسال
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}