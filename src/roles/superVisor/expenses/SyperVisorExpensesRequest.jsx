import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Card,
  Space,
  message,
  Modal,
  Form,
  Input,
  ConfigProvider,
  Collapse,
  Spin,
  Skeleton,
  Tooltip,
} from "antd";
import { PlusCircleOutlined, CalendarOutlined, PlusOutlined  } from "@ant-design/icons";
import useAuthStore from "../../../store/store";
import axiosInstance from "../../../intercepters/axiosInstance.js";
import { Link } from "react-router-dom";
import moment from "moment";
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
  const [isLastMonthLoading, setIsLastMonthLoading] = useState(true);
  const [isEndOfMonth, setIsEndOfMonth] = useState(false);
  const [canSendRequests, setCanSendRequests] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Loading state

  // Initialize officeInfo with the date set to 00:00:00 but only display the date portion ("YYYY-MM-DD")
  const [officeInfo, setOfficeInfo] = useState({
    totalCount: 0,
    totalExpenses: 0,
    date: moment(new Date()).startOf("day").format("YYYY-MM-DD"),
    governorate: profile?.governorateName || "",
    officeName: profile?.officeName || "",
    supervisorName: profile?.fullName || "",
  });

  const arabicMonths = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];

  const formattedDate = new Date(officeInfo.date);
  const displayMonthName = arabicMonths[formattedDate.getMonth()];
  const displayYear = formattedDate.getFullYear();
  const displayMonthYear = `${displayMonthName} - ${displayYear}`;

  // define state to set office budget
  const [officeBudget, setOfficeBudget] = useState();

  // Check if it's the end of month to allow sending requests
  useEffect(() => {
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const daysInMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    ).getDate();

    setIsEndOfMonth(currentDay >= 25 && currentDay <= daysInMonth);
    setCanSendRequests(currentDay >= 25 && currentDay <= daysInMonth);
  }, [officeInfo.date]);

  // Fetch office budget
  const fetchOfficeBudget = async () => {
    try {
      const response = await axiosInstance.get(`/api/office/${profile?.officeId}`);
      setOfficeBudget(response.data.budget);
    } catch (error) {
      console.error("Error fetching office budget:", error);
      message.error("حدث خطأ في جلب ميزانية المكتب");
    }
  };

  const updateOfficeInfo = (expenses) => {
    let totalCount = 0;
    let totalExpenses = 0;
  
    expenses.forEach(expense => {
      // Count and add the parent expense amount
      totalCount += 1;
      totalExpenses += expense.totalAmount;
  
      // If there are sub-expenses, count and add them too
      if (expense.children && expense.children.length > 0) {
        expense.children.forEach(child => {
          totalCount += 1;
          totalExpenses += child.totalAmount;
        });
      }
    });
  
    setOfficeInfo((prev) => ({
      ...prev,
      totalCount,
      totalExpenses,
    }));
  };

  const totalremaining = officeBudget - officeInfo.totalExpenses;
  const halfBudget = officeBudget / 2;
  // If remaining is more than half, make it green; otherwise red
  const remainColor = totalremaining > halfBudget ? "#02aa0a" : "red";

  const fetchLastMonthExpense = async () => {
    if (!profile?.officeId) {
      setIsLastMonthLoading(false);
      return;
    }

    try {
      setIsLastMonthLoading(true);
      const response = await axiosInstance.post("/api/Expense/search-last-month", {
        officeId: profile?.officeId,
      });

      if (response.data && response.data.length > 0) {
        setLastMonthExpense(response.data[0]);
      } else {
        setLastMonthExpense(null);
      }
    } catch (error) {
      console.error("Error fetching last month expense:", error);
      message.error("حدث خطأ في جلب بيانات الشهر السابق");
      setLastMonthExpense(null);
    } finally {
      setIsLastMonthLoading(false);
    }
  };

  // Format date for display without the hours
  const formatDate = (dateString) => {
    return moment(dateString).startOf("day").format("YYYY-MM-DD");
  };

  const getStatusColor = (status) => {
    const statusColors = {
      Pending: "#ffa940",
      SentToProjectCoordinator: "#1890ff",
      Approved: "#52c41a",
      Rejected: "#ff4d4f",
      ReturnedToSupervisor: "#faad14",
    };
    return statusColors[status] || "#000000";
  };

  const fetchMonthlyExpense = async () => {
    setIsLoading(true); // Start loading

    try {
      const payload = {
        officeId: profile?.officeId,
        governorateId: profile?.governorateId,
        profileId: profile?.profileId,
        statuses: [0],
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
        // Set dateCreated with hours removed
        const dateCreated = moment(currentExpense.dateCreated)
          .startOf("day")
          .format("YYYY-MM-DD");

        setOfficeInfo((prev) => ({ ...prev, date: dateCreated }));
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
    } finally {
      // Ensure budget is fetched after monthly expenses
      fetchOfficeBudget();
      setIsLoading(false); // Stop loading
    }
  };

  const fetchDailyExpenses = async (monthlyExpenseId) => {
    if (!monthlyExpenseId) return;
  
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/Expense/${monthlyExpenseId}/daily-expenses`);
  
      if (response.data && response.data.length > 0) {
        const formattedDailyExpenses = response.data.map((expense) => {
          // Format main expense with date (without hours)
          const mainExpense = {
            key: expense.id,
            id: expense.id,
            date: moment(expense.expenseDate)
              .startOf("day")
              .format("YYYY-MM-DD"),
            price: expense.price,
            quantity: expense.quantity,
            totalAmount: expense.amount,
            notes: expense.notes,
            expenseTypeName: expense.expenseTypeName,
            isSubExpense: false,
          };
  
          // Format sub-expenses if they exist
          if (expense.subExpenses && expense.subExpenses.length > 0) {
            mainExpense.children = expense.subExpenses.map((sub) => ({
              key: sub.id,
              id: sub.id,
              date: moment(sub.expenseDate)
                .startOf("day")
                .format("YYYY-MM-DD"),
              price: sub.price,
              quantity: sub.quantity,
              totalAmount: sub.amount,
              notes: sub.notes,
              expenseTypeName: sub.expenseTypeName,
              isSubExpense: true,
              parentId: expense.id,
            }));
          }
  
          return mainExpense;
        });
  
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

  const handleCreateMonthlyExpense = async () => {
    try {
      setLoading(true);
      const payload = {
        totalAmount: 0,
        status: 0,
        officeId: profile?.officeId,
        governorateId: profile?.governorateId,
        profileId: profile?.profileId,
      };

      const response = await axiosInstance.post("/api/Expense/MonthlyExpenses", payload);

      if (response.data) {
        const monthlyExpensesId = response.data.id;

        const actionPayload = {
          actionType: "تم انشاء شهر جديد",
          notes: `تم انشاء مصروف شهر جديد من قبل ${profile.fullName}`,
          monthlyExpensesId,
        };

        await axiosInstance.post("/api/Actions", actionPayload);

        message.success("تم إنشاء المصروف الشهري والموافقة عليه بنجاح");
        setCurrentMonthlyExpenseId(monthlyExpensesId);
        setIsMonthlyModalVisible(false);
        monthlyForm.resetFields();
        setCanCreateMonthly(false);
        fetchDailyExpenses(monthlyExpensesId);
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

      const actionPayload = {
        actionType: `تم ارسال الصرفيات من قبل ${profile.position || ""} ${profile.fullName || ""}`,
        notes: values.notes || "",
        monthlyExpensesId: currentMonthlyExpenseId,
      };

      await axiosInstance.post("/api/Actions", actionPayload);

      const statusPayload = {
        monthlyExpensesId: currentMonthlyExpenseId,
        newStatus: 1,
      };

      await axiosInstance.post(`/api/Expense/${currentMonthlyExpenseId}/status`, statusPayload);

      message.success("تم إرسال المصروف الشهرية بنجاح");
      setIsSendModalVisible(false);
      sendForm.resetFields();

      // Reset current monthly data
      setCurrentMonthlyExpenseId(null);
      setCurrentMonthDailyExpenses([]);
      setCanCreateMonthly(true);

      // Refresh last month expense data
      fetchLastMonthExpense();
    } catch (error) {
      console.error("Error sending monthly expense:", error);
      message.error("حدث خطأ في إرسال المصروف الشهرية");
    } finally {
      setSendLoading(false);
    }
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
    SentFromDirector: "تم الموافقة من قبل المدير التنفيذي",
    Completed: "مكتمل",
  };

  // Modify the currentMonthColumns to handle sub-expenses
  const currentMonthColumns = [
    {
      title: "",
      key: "expand",
      width: '50px',
      align: "center",
      render: (_, record) => {
        return record.children ? (
          <div style={{ 
            cursor: 'pointer', 
            color: '#1890ff',
            fontSize: '12px',
            width: '20px',
            margin: '0 auto'
          }}>
           
          </div>
        ) : null;
      }
    },
    {
      title: "نوع المصروف",
      dataIndex: "expenseTypeName",
      key: "expenseTypeName",
      className: "supervisor-expenses-history-table-column",
      render: (text, record) => (
        <span
          style={{
            paddingRight: record.isSubExpense ? "20px" : "0",
            color: record.isSubExpense ? "#1890ff" : "inherit",
            display: "flex",
            alignItems: "center",
          }}
        >
          {record.isSubExpense && <span style={{ marginLeft: "8px" }}>↲</span>}
          {text}
        </span>
      ),
    },
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
        <Link
          to="/Expensess-view-daily"
          state={{
            dailyExpenseId: record.id,
            parentExpenseId: record.parentExpenseId, // Parent ID if available
            isSubExpense: record.parentExpenseId ? true : false,
            status: "New",
          }}
        >
          <Button type="primary" size="large">
            عرض
          </Button>
        </Link>
      ),
    },
  ];
  const lastMonthColumns = [
    {
      title: "المبلغ الإجمالي",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount) => (
        <span style={{ color: "#52c41a" }}>{amount?.toLocaleString()} د.ع</span>
      ),
    },
    {
      title: "حالة الطلب",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span style={{ color: getStatusColor(status) }}>
          {statusDisplayNames[status] || "غير معروف"}
        </span>
      ),
    },
    {
      title: "اسم المكتب",
      dataIndex: "officeName",
      key: "officeName",
    },
    {
      title: "المحافظة",
      dataIndex: "governorateName",
      key: "governorateName",
    },
    {
      title: "اسم المشرف",
      dataIndex: "profileFullName",
      key: "profileFullName",
    },
    {
      title: "مستوى الإنفاق",
      dataIndex: "thresholdName",
      key: "thresholdName",
    },
    {
      title: "تاريخ الإنشاء",
      dataIndex: "dateCreated",
      key: "dateCreated",
      render: (date) => formatDate(date),
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (_, record) => (
        <Link to="/ExpensessViewMonthly" state={{ monthlyExpenseId: record.id }}>
          <Button type="primary" size="large">
            عرض
          </Button>
        </Link>
      ),
    },
  ];

  const EmptyStateCard = () => {
    return (
      <div style={{ width: "100%" }}>
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 10 }} />
        ) : (
          <>
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
              }}
            >
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
                }}
              >
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
                }}
              >
                إنشاء مصروف شهري جديد
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  useEffect(() => {
    // Fetch data if officeId is set
    if (profile?.officeId) {
      fetchLastMonthExpense();
      fetchMonthlyExpense();
    }
  }, [profile?.officeId]);

  useEffect(() => {
    console.log("Last month expense updated:", lastMonthExpense);
  }, [lastMonthExpense]);

  return (
    <div
      className={`supervisor-expenses-request-page ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}
      dir="rtl"
      style={{ padding: "24px" }}
    >
      <div className="this-month-container">
        {!canCreateMonthly ? (
          <Card className="office-info-card" style={{ width: "25%", flexShrink: 0 }}>
            <h1 style={{ marginBottom: "24px", textAlign: "center" }}>معلومات المكتب</h1>
            <h3 style={{ marginBottom: "24px", textAlign: "center" }}>
              صرفيات شهر :{" "}
              <span style={{ color: "#DAA520", fontWeight: "bold" }}>{displayMonthYear}</span>
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
                }}
              >
                <span>المحافظة:</span>
                <strong style={{ color: "#4096ff" }}>{officeInfo.governorate}</strong>
              </div>
              <div
                style={{
                  marginBottom: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>اسم المكتب:</span>
                <strong style={{ color: "#4096ff" }}>{officeInfo.officeName}</strong>
              </div>
              <div
                style={{
                  marginBottom: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>اسم المشرف:</span>
                <strong style={{ color: "#4096ff" }}>{officeInfo.supervisorName}</strong>
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
                  backgroundColor: "rgba(230, 227, 227, 0.5)",
                  padding: "8px",
                  borderRadius: "8px",
                  marginBottom: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>العدد الكلي:</span>
                <strong>{officeInfo.totalCount}</strong>
              </div>
              <div
                style={{
                  backgroundColor: "rgba(230, 227, 227, 0.5)",
                  padding: "8px",
                  borderRadius: "8px",
                  marginBottom: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>النثرية:</span>
                <strong style={{ color: "#02aa0a" }}>{officeBudget?.toLocaleString()} د.ع</strong>
              </div>
              <div
                style={{
                  backgroundColor: "rgba(230, 227, 227, 0.5)",
                  padding: "8px",
                  borderRadius: "8px",
                  marginBottom: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>إجمالي الصرفيات:</span>
                <strong style={{ color: "#02aa0a" }}>{officeInfo.totalExpenses.toLocaleString()} د.ع</strong>
              </div>

              {officeInfo.totalExpenses === 0 ? (
                <div
                  style={{
                    backgroundColor: "rgba(230, 227, 227, 0.5)",
                    padding: "8px",
                    borderRadius: "8px",
                    marginBottom: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>المتبقي:</span>
                  <strong style={{ color: "#DAA520" }}>0 د.ع</strong>
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: "rgba(230, 227, 227, 0.5)",
                    padding: "8px",
                    borderRadius: "8px",
                    marginBottom: "12px",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>المتبقي:</span>
                  <strong style={{ color: remainColor }}>{totalremaining.toLocaleString()} د.ع</strong>
                </div>
              )}

              <div
                style={{
                  marginBottom: "12px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>التاريخ:</span>
                <strong>{officeInfo.date}</strong>
              </div>
            </div>

            <Tooltip
              title={
                officeInfo.totalExpenses >= officeBudget
                  ? "تم الوصول إلى الحد الأقصى للنثرية، لا يمكن إضافة مصروف جديد"
                  : ""
              }
            >
              <span>
                <Link
                  to="/add-daily-expense"
                  state={{
                    monthlyExpenseId: currentMonthlyExpenseId,
                    officeBudget: officeBudget,
                    totalMonthlyAmount: officeInfo.totalExpenses,
                  }}
                  style={{
                    pointerEvents:
                      officeInfo.totalExpenses >= officeBudget ? "none" : "auto",
                  }}
                >
                  <Button
                    type="primary"
                    block
                    size="large"
                    disabled={officeInfo.totalExpenses >= officeBudget}
                  >
                    إضافة مصروف يومي
                  </Button>
                </Link>
              </span>
            </Tooltip>
          </Card>
        ) : null}

        <div style={{ flex: 1 }}>
          {canCreateMonthly ? (
            <EmptyStateCard />
          ) : (
            <>
              <Card className="expenses-table-card" style={{ marginBottom: "24px" }}>
                <div className="this-month-daily-container">
                  <h1 style={{ marginBottom: "5px" }}>المصروفات اليومية للشهر الحالي</h1>
                  <Button
                    type="primary"
                    disabled={!canSendRequests}
                    size="large"
                    onClick={() => setIsSendModalVisible(true)}
                  >
                    ارسال طلبات الشهر الكلية
                  </Button>
                </div>

                <ConfigProvider direction="rtl">
                  <Table
                    dataSource={currentMonthDailyExpenses}
                    columns={currentMonthColumns}
                    loading={loading}
                    rowKey="id"
                    pagination={{
                      pageSize: 5,
                      position: ["bottomCenter"],
                      showSizeChanger: false,
                    }}
               expandable={{
                      defaultExpandAllRows: false,
                      expandRowByClick: false,
                      expandIcon: ({ expanded, onExpand, record }) =>
                        record.children ? (
                          <PlusOutlined
                            style={{
                              cursor: "pointer",
                              color: "#1890ff",
                              fontSize: "22px",
                              transform: expanded ? "rotate(45deg)" : "rotate(0deg)",
                              transition: "transform 0.2s",
                              margin: "0 auto",
                            }}
                            onClick={(e) => onExpand(record, e)}
                          />
                        ) : null,
                    }}
                    style={{ marginTop: "5px" }}
                  />
                </ConfigProvider>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Last Month Expense Section */}
      {isLastMonthLoading ? (
        <Collapse
          style={{
            background: "#fff",
            borderRadius: "8px",
            marginTop: "24px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Collapse.Panel
            key="1"
            header={
              <h2
                style={{
                  margin: 0,
                  textAlign: "center",
                  color: "#1f2937",
                  fontSize: "18px",
                  fontWeight: "bold",
                }}
              >
                جاري تحميل بيانات الشهر السابق...
              </h2>
            }
          >
            <div style={{ padding: "20px", textAlign: "center" }}>
              <Spin size="large" />
            </div>
          </Collapse.Panel>
        </Collapse>
      ) : (
        lastMonthExpense && (
          <Collapse
            style={{
              background: "#fff",
              borderRadius: "8px",
              marginTop: "24px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Collapse.Panel
              key="1"
              header={
                <h2
                  style={{
                    margin: 0,
                    textAlign: "center",
                    color: "#1f2937",
                    fontSize: "18px",
                    fontWeight: "bold",
                  }}
                >
                  مصروفات الشهر السابق -{" "}
                  {statusDisplayNames[lastMonthExpense?.status] || "غير معروف"}
                </h2>
              }
            >
              <ConfigProvider direction="rtl">
                <Table
                  dataSource={[{ key: "1", ...lastMonthExpense }]}
                  columns={lastMonthColumns}
                  pagination={false}
                  bordered
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                />
              </ConfigProvider>
            </Collapse.Panel>
          </Collapse>
        )
      )}

      {/* Monthly Expense Modal */}
      <Modal
        title="إنشاء مصروف شهري"
        open={isMonthlyModalVisible}
        onCancel={() => {
          setIsMonthlyModalVisible(false);
          monthlyForm.resetFields();
        }}
        footer={null}
        style={{ direction: "rtl" }}
      >
        <Form
          form={monthlyForm}
          onFinish={handleCreateMonthlyExpense}
          layout="vertical"
          className="new-expensess-monthly"
          style={{ marginTop: "10px" }}
        >
          <Form.Item name="notes" label="هل انت متأكد من انشاء مصروف لهذا الشهر" style={{ width: "100%" }} />
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              إنشاء
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Send Monthly Expense Modal */}
      <Modal
        title="إرسال المصروف الشهري"
        open={isSendModalVisible}
        onCancel={() => {
          setIsSendModalVisible(false);
          sendForm.resetFields();
        }}
        footer={null}
        style={{ direction: "rtl" }}
      >
        <Form form={sendForm} onFinish={handleSendMonthlyExpense} layout="vertical" style={{ marginTop: "10px" }}>
          <span style={{ color: "red" }}>
            * يرجى التاكد من ادخال جميع المصاريف اليومية الخاصة بهذا الشهر قبل الارسال
          </span>
          <Form.Item name="notes" label="ملاحظات" style={{ width: "100%" }}>
            <Input.TextArea rows={4} placeholder="أدخل الملاحظات" style={{ resize: "none", marginBottom: "20px" }} required />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={sendLoading} block size="large">
              إرسال
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
