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
} from "antd";
import { PlusCircleOutlined, CalendarOutlined } from "@ant-design/icons";
import useAuthStore from "../../../store/store";
import axiosInstance from "./../../../intercepters/axiosInstance.js";
import { Link } from "react-router-dom";
import "./styles/SuperVisorExpinsesRequest.css";

export default function SuperVisorExpensesRequest() {
  const { profile, isSidebarCollapsed } = useAuthStore();
  const [currentMonthlyExpenseId, setCurrentMonthlyExpenseId] = useState(null);
  const [canCreateMonthly, setCanCreateMonthly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [currentMonthDailyExpenses, setCurrentMonthDailyExpenses] = useState(
    []
  );
  console.log("currentMonthDailyExpenses = ",currentMonthDailyExpenses)
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [isMonthlyModalVisible, setIsMonthlyModalVisible] = useState(false);
  const [monthlyForm] = Form.useForm();

  const [officeInfo, setOfficeInfo] = useState({
    totalCount: 0,
    totalExpenses: 0,
    date: new Date().toISOString().split("T")[0],
    governorate: profile?.governorateName || "",
    officeName: profile?.officeName || "",
    supervisorName: profile?.fullName || "",
  });

  // Format the date for display
  const arabicMonths = [
    "الواحد", // January
    "الثاني", // February
    "الثالث", // March
    "الرابع", // April
    "الخامس", // May
    "السادس", // June
    "السابع", // July
    "الثامن", // August
    "التاسع", // September
    "العاشر", // October
    "الحادي عشر", // November
    "الثناي عشر", // December
  ];

  // Format the date to extract the month number and Arabic name
  const formattedDate = new Date(officeInfo.date);
  const displayMonthNumber = formattedDate.getMonth() + 1;
  const displayMonthName = arabicMonths[formattedDate.getMonth()];

  // Fetch Expense Types
  const fetchExpenseTypes = async () => {
    try {
      const response = await axiosInstance.get(
        "/api/ExpenseType?PageNumber=1&PageSize=10"
      );
      setExpenseTypes(response.data || []);
      console.log("response.data = ", response.data);
    } catch (error) {
      console.error("Error fetching expense types:", error);
      message.error("حدث خطأ في جلب أنواع المصروفات");
    }
  };

  // Fetch Monthly Expense
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

 // Fetch Daily Expenses
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
        expenseTypeName: expense.expenseTypeName, // Include the expense type name
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

  // Update Office Information
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

  // Initial Data Loading
  useEffect(() => {
    fetchExpenseTypes();
    fetchMonthlyExpense();
  }, []);

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
    // {
    //   title: "نوع المصروف",
    //   dataIndex: "expenseTypeId",
    //   key: "expenseTypeId",
    //   render: (expenseTypeId) => {
    //     console.log(expenseTypeId);
    //     const expenseType = expenseTypes.find(
    //       (type) => type.id === expenseTypeId
    //     );
    //     return expenseType ? expenseType.name : "غير محدد";
    //   },
    // },
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

  const EmptyStateCard = () => (
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
        minHeight: "400px",
        width: "100%",
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
  );

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
        {/* Office Info Card */}
        <Card
          className="office-info-card"
          style={{ width: "25%", flexShrink: 0 }}>
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
              height: "1px", // Ensures consistent thickness
              border: "none", // Removes the default border
              background: "linear-gradient(to right, #e0e0e0, #000, #e0e0e0)", // Adds a gradient effect
              marginBottom: "12px", // Keeps the spacing below
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
                backgroundColor: "",
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

          {!canCreateMonthly && (
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
              <Link to="" state={{ monthlyExpenseId: currentMonthlyExpenseId }}>
                <Button color="default" variant="outlined" block size="large">
                  ارسال
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
              <h1 style={{ marginBottom: "5px" }}>
                المصروفات اليومية للشهر الحالي
              </h1>
              <ConfigProvider direction="rtl">
                <Table
                  dataSource={currentMonthDailyExpenses}
                  columns={columns}
                  loading={loading}
                  rowKey="id"
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
            label="ملاحظات"
            style={{ width: "100%" }}
            rules={[{ required: true, message: "الرجاء إدخال الملاحظات" }]}>
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
              loading={loading}
              block
              size="large">
              إنشاء
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
