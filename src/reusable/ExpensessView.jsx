import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  ConfigProvider,
  Modal,
  Button,
  Image,
  message,
  Input,
  Form,
  Select,
  InputNumber,
  DatePicker,
} from "antd";
import { useLocation, useNavigate, Link } from "react-router-dom";
import html2pdf from "html2pdf.js";
import "./styles/ExpensessView.css";
import Dashboard from "./../pages/dashBoard.jsx";
import useAuthStore from "./../store/store.js";
import axiosInstance from "./../intercepters/axiosInstance";
import Url from "./../store/url";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Icons from "./../reusable elements/icons.jsx";
import ExpensessViewActionsTable from "./ExpensessViewActionsTable";
import { PlusOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

/* ====================== Action Logs (NEW workflow) ====================== */
const ActionLogsTable = ({ expenseId, isNewWorkflow }) => {
  const [actionLogs, setActionLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const { accessToken } = useAuthStore();

  const actorMap = {
    1: "المشرف (Supervisor)",
    2: "منسق المشروع (Project Coordinator)",
    3: "مدقق الحسابات (Expense Auditer)",
    4: "المدير (Manager)",
    5: "المدير التنفيذي (Director)",
    6: "مدير الحسابات (Expense Manager)",
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

  const fetchActionLogs = async (page = 1) => {
    if (!expenseId || !isNewWorkflow) return;
    try {
      setIsLoading(true);
      const res = await axiosInstance.get(
        `${Url}/api/MonthlyExpensesWorkflow/${expenseId}/action-logs`,
        {
          params: { PageNumber: page, PageSize: pageSize },
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (res.data) {
        setActionLogs(res.data.items || []);
        setTotal(res.data.total || 0);
      }
    } catch (e) {
      console.error("Error fetching action logs:", e);
      message.error("حدث خطأ في جلب سجل الإجراءات");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActionLogs(currentPage);
  }, [expenseId, isNewWorkflow, currentPage]);

  if (!isNewWorkflow) return null;

  const describeLog = (log) => {
    const from = stageMap[log.fromStage] || log.fromStage || "غير معلوم";
    const to = stageMap[log.toStage] || log.toStage || "غير معلوم";
    const actor = actorMap[log.actor] || stageMap[log.actor] || "غير معلوم";
    // Action types (server enum):
    // 0 Send, 1 Return, 2 Resend, 3 Complete, 4 Cancel
    switch (Number(log.actionType)) {
      case 0:
        return `تم الإرسال من ${from} إلى ${to}`;
      case 1:
        return `تم الإرجاع من ${from} إلى ${to}`;
      case 2:
        return `تم إعادة الإرسال من ${from} إلى ${to}`;
      case 3:
        return `في الأخير تم الإكمال من قبل ${actor}`;
      case 4:
        return `تم الإلغاء من قبل ${actor}`;
      default:
        return `إجراء غير معروف من ${from}${to ? ` إلى ${to}` : ""}`;
    }
  };

  const columns = [
    {
      title: "التاريخ والوقت",
      dataIndex: "performedAtUtc",
      key: "performedAtUtc",
      render: (date) => dayjs(date).format("YYYY-MM-DD HH:mm"),
      width: 170,
    },
    {
      title: "التفاصيل",
      key: "details",
      render: (_, record) => describeLog(record),
    },
    { title: "الملاحظات", dataIndex: "comment", key: "comment", ellipsis: true, width: 700 },
  ];

  return (
    <div style={{ marginTop: 24 }}>
      <h2 style={{ marginBottom: 16 }}>سجل الإجراءات (النظام الجديد)</h2>
      <ConfigProvider direction="rtl">
        <Table
          loading={isLoading}
          columns={columns}
          dataSource={actionLogs}
          rowKey="id"
          bordered
          pagination={{
            current: currentPage,
            pageSize,
            total,
            onChange: (p) => setCurrentPage(p),
            position: ["bottomCenter"],
            showTotal: (t) => `إجمالي السجلات: ${t}`,
          }}
          locale={{ emptyText: "لا توجد سجلات" }}
          scroll={{ x: 800 }}
        />
      </ConfigProvider>
    </div>
  );
};

/* ====================== Status (OLD workflow) ====================== */
const Status = {
  New: 0,
  SentToProjectCoordinator: 1,
  ReturnedToProjectCoordinator: 2,
  SentToManager: 3,
  ReturnedToManager: 4,
  SentToDirector: 5,
  ReturnedToSupervisor: 7,
  RecievedBySupervisor: 8,
  Completed: 9,
  SentFromDirector: 10,
  ReturnedToExpendeAuditer: 11,
  SentToExpenseManager: 12,
  ReturnedToExpenseManager: 13,
  SentToExpenseGeneralManager: 14,
};

const StatusKeyByValue = Object.fromEntries(
  Object.entries(Status).map(([k, v]) => [v, k])
);

const statusMap = {
  [Status.New]: "جديد",
  [Status.SentToProjectCoordinator]: "تم الإرسال إلى منسق المشروع",
  [Status.ReturnedToProjectCoordinator]: "تم الإرجاع إلى منسق المشروع",
  [Status.SentToManager]: "تم الإرسال إلى المدير",
  [Status.ReturnedToManager]: "تم الإرجاع إلى المدير",
  [Status.SentToDirector]: "تم الإرسال إلى المدير التنفيذي",
  [Status.ReturnedToSupervisor]: "تم الإرجاع إلى المشرف",
  [Status.RecievedBySupervisor]: "تم الاستلام من قبل المشرف",
  [Status.SentFromDirector]: "تم الارسال الى مدقق الحسابات",
  [Status.Completed]: "مكتمل",
  [Status.ReturnedToExpendeAuditer]: "تم الارجاع لمدقق الحسابات",
  [Status.SentToExpenseManager]: "تم الارسال لمدير الحسابات",
  [Status.ReturnedToExpenseManager]: "تم الارجاع لمدير الحسابات",
  [Status.SentToExpenseGeneralManager]: "تم الارسال الى مدير ادارة الحسابات",
};

/* ====================== Arabic months ====================== */
const arabicMonths = [
  { value: 1, label: "يناير - الشهر الأول", nameEn: "January" },
  { value: 2, label: "فبراير - الشهر الثاني", nameEn: "February" },
  { value: 3, label: "مارس - الشهر الثالث", nameEn: "March" },
  { value: 4, label: "أبريل - الشهر الرابع", nameEn: "April" },
  { value: 5, label: "مايو - الشهر الخامس", nameEn: "May" },
  { value: 6, label: "يونيو - الشهر السادس", nameEn: "June" },
  { value: 7, label: "يوليو - الشهر السابع", nameEn: "July" },
  { value: 8, label: "أغسطس - الشهر الثامن", nameEn: "August" },
  { value: 9, label: "سبتمبر - الشهر التاسع", nameEn: "September" },
  { value: 10, label: "أكتوبر - الشهر العاشر", nameEn: "October" },
  { value: 11, label: "نوفمبر - الشهر الحادي عشر", nameEn: "November" },
  { value: 12, label: "ديسمبر - الشهر الثاني عشر", nameEn: "December" },
];

const shouldUseNewWorkflow = (dateString) => {
  // Use NEW workflow only if date is after 2025-10-02
  const expenseDate = dayjs(dateString);
  const cutoffDate = dayjs("2025-10-02");
  return expenseDate.isAfter(cutoffDate);
};

const getArabicMonthDisplay = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const monthNumber = date.getMonth() + 1;
  const year = date.getFullYear();
  const arabicMonth = arabicMonths.find((m) => m.value === monthNumber);
  return arabicMonth ? `${arabicMonth.label} ${year}` : dateString;
};

/* ====================== Component ====================== */
export default function ExpensesView() {
  const { isSidebarCollapsed, accessToken, profile, roles } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const expenseId =
    location.state?.expense?.id ||
    location.state?.expenseId ||
    new URLSearchParams(location.search).get("id");

  const [expense, setExpense] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false); // keep only this one
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [actionNote, setActionNote] = useState("");
  const [form] = Form.useForm();
  const [isPrinting, setIsPrinting] = useState(false);

  // Admin Modal
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [adminForm] = Form.useForm();
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Pagination in table
  const saved = JSON.parse(localStorage.getItem("expensesPagination") || "{}");
  const [currentPage, setCurrentPage] = useState(saved.page || 1);
  const [pageSize, setPageSize] = useState(saved.pageSize || 5);

  const [dailyExpensesList, setDailyExpensesList] = useState([]);

  // NEW workflow state
  const [wfActor, setWfActor] = useState(null);
  const [wfActions, setWfActions] = useState([]);

  const hasAdminPermission = useMemo(() => {
    const userRoles = roles || [];
    return userRoles.some(
      (role) =>
        role?.toLowerCase() === "superadmin" || role?.toLowerCase() === "admin"
    );
  }, [roles]);

  // Role flags
  const pos = (profile?.position || "").toLowerCase();
  const isSupervisorActor = pos.includes("supervisor");
  const isProjectCoordinatorActor =
    pos.includes("projectcoordinator") || pos.includes("srcontroller");
  const isExpenseAuditerActor = pos.includes("expenseauditer");
  const isManagerActor = pos.includes("manager");
  const isDirectorActor = pos.includes("director");
  const isExpenseManagerActor = pos.includes("expensemanager");
  console.log(pos)
  const actorCandidates = useMemo(() => {
    const list = [];
    if (isSupervisorActor) list.push("Supervisor");
    if (isProjectCoordinatorActor) list.push("ProjectCoordinator");
    if (isExpenseAuditerActor) list.push("ExpenseAuditer");
    if (isManagerActor) list.push("Manager");
    if (isDirectorActor) list.push("Director");
    if (isExpenseManagerActor) list.push("ExpenseManager");
    return list;
  }, [pos]);

  // Flatten helper
  function flattenItems(items) {
    const result = [];
    items.forEach((item) => {
      result.push(item);
      if (item.children?.length) result.push(...item.children);
    });
    return result;
  }

  // NEW workflow actor codes
  const EXPENSE_ACTOR_CODE = {
    Supervisor: 1,
    ProjectCoordinator: 2,
    ExpenseAuditer: 3,
    Manager: 4,
    Director: 5,
    ExpenseManager: 6,
  };

  // ===================== UPDATED pickWfAction =====================
// Prefer "resend" or "complete" for Approval; otherwise any "send.*". For Return: "return.*"
  const pickWfAction = (actions, kind /* 'Approval' | 'Return' */) => {
    const codeOf = (a) => (a?.actionInfo?.code || a?.code || "").toLowerCase();
    const typeOf = (a) => Number(a?.actionInfo?.id ?? a?.actionType);

    if (kind === "Approval") {
     const resend = actions.find((a) => codeOf(a) === "resend" || typeOf(a) === 2);
     if (resend) return resend;
     const complete = actions.find((a) => codeOf(a) === "complete" || typeOf(a) === 3);
     if (complete) return complete
      const send = actions.find((a) => codeOf(a).startsWith("send"));
      if (send) return send;
      return null;
    }
    return actions.find((a) => codeOf(a).startsWith("return")) || null;
  };

  // ======== OLD WORKFLOW transition helpers (accept numeric/string) ========
  const getNextStatus = (currentStatus, position) => {
    const statusKey =
      typeof currentStatus === "number"
        ? StatusKeyByValue[currentStatus]
        : currentStatus;
    const p = (position || "").toLowerCase();

    if (statusKey === "SentFromDirector" && p.includes("expenseauditer"))
      return Status.SentToExpenseManager;

    if (
      (statusKey === "SentToProjectCoordinator" && p.includes("projectcoordinator")) ||
      (statusKey === "SentToProjectCoordinator" && p.includes("srcontroller"))
    )
      return Status.SentToManager;

    if (
      (statusKey === "ReturnedToProjectCoordinator" && p.includes("projectcoordinator")) ||
      (statusKey === "ReturnedToProjectCoordinator" && p.includes("srcontroller"))
    )
      return Status.SentToManager;

    if (statusKey === "SentToManager" && p.includes("manager"))
      return Status.SentToDirector;

    if (statusKey === "ReturnedToManager" && p.includes("manager"))
      return Status.SentToDirector;

    if (statusKey === "SentToDirector" && p.includes("director"))
      return Status.SentFromDirector;

    if (
      statusKey === "SentToExpenseGeneralManager" &&
      p.includes("expensegeneralmanager")
    )
      return Status.RecievedBySupervisor;

    if (statusKey === "ReturnedToExpendeAuditer" && p.includes("expenseauditer"))
      return Status.SentToExpenseGeneralManager;

    if (statusKey === "SentToExpenseManager" && p.includes("expensemanager"))
      return Status.SentToExpenseGeneralManager;

    if (statusKey === "ReturnedToExpenseManager" && p.includes("expensemanager"))
      return Status.SentToExpenseGeneralManager;

    if (statusKey === "RecievedBySupervisor" && p.includes("supervisor"))
      return Status.Completed;

    return null;
  };

  const getRejectionStatus = (currentStatus, position) => {
    const statusKey =
      typeof currentStatus === "number"
        ? StatusKeyByValue[currentStatus]
        : currentStatus;
    const p = (position || "").toLowerCase();

    if (
      (statusKey === "SentToProjectCoordinator" && p.includes("projectcoordinator")) ||
      (statusKey === "SentToProjectCoordinator" && p.includes("srcontroller"))
    )
      return Status.ReturnedToSupervisor;

    if (
      (statusKey === "ReturnedToProjectCoordinator" && p.includes("projectcoordinator")) ||
      (statusKey === "ReturnedToProjectCoordinator" && p.includes("srcontroller"))
    )
      return Status.ReturnedToSupervisor;

    if (statusKey === "SentToManager" && p.includes("manager"))
      return Status.ReturnedToProjectCoordinator;

    if (statusKey === "ReturnedToManager" && p.includes("manager"))
      return Status.ReturnedToProjectCoordinator;

    if (statusKey === "SentFromDirector" && p.includes("expenseauditer"))
      return Status.ReturnedToProjectCoordinator;

    if (statusKey === "ReturnedToExpendeAuditer" && p.includes("expenseauditer"))
      return Status.ReturnedToProjectCoordinator;

    if (statusKey === "SentToExpenseManager" && p.includes("expensemanager"))
      return Status.ReturnedToExpendeAuditer;

    if (statusKey === "ReturnedToExpenseManager" && p.includes("expensemanager"))
      return Status.ReturnedToExpendeAuditer;

    if (statusKey === "SentToDirector" && p.includes("director"))
      return Status.ReturnedToManager;

    if (
      statusKey === "SentToExpenseGeneralManager" &&
      p.includes("expensegeneralmanager")
    )
      return Status.ReturnedToExpenseManager;

    return null;
  };

  // ======== Admin modal handlers ========
  const handleAdminClick = () => {
    setAdminModalVisible(true);
    const expenseDate = expense?.generalInfo?.rawDate
      ? dayjs(expense.generalInfo.rawDate)
      : dayjs();
    adminForm.setFieldsValue({
      status: expense?.generalInfo?.["الحالة"] ?? Status.New,
      dateCreated: expenseDate,
    });
  };

  const handleAdminCancel = () => {
    setAdminModalVisible(false);
    adminForm.resetFields();
  };

  const isNewWorkflowActive = useMemo(() => {
    const d = expense?.generalInfo?.rawDate;
    if (!d) return false;
    return shouldUseNewWorkflow(d);
  }, [expense?.generalInfo?.rawDate]);

  const handleAdminSubmit = async () => {
    try {
      const values = await adminForm.validateFields();
      setIsAdjusting(true);

      const initialValues = {
        status: expense?.generalInfo?.["الحالة"] ?? Status.New,
        totalAmountAdjustment: expense?.generalInfo?.["مجموع الصرفيات"] ?? 0,
        dateCreated: expense?.generalInfo?.rawDate
          ? dayjs(expense.generalInfo.rawDate)
          : dayjs(),
      };

      const requestBody = {};

      if (values.status !== initialValues.status) {
        const statusValue = Number(values.status);
        if (isNaN(statusValue)) {
          message.error("حالة غير صالحة");
          return;
        }
        requestBody.status = statusValue;
      }

      if (
        values.totalAmountAdjustment !== undefined &&
        values.totalAmountAdjustment !== initialValues.totalAmountAdjustment
      ) {
        requestBody.totalAmountAdjustment = parseFloat(
          values.totalAmountAdjustment
        );
      }

      if (values.dateCreated && dayjs.isDayjs(values.dateCreated)) {
        const selectedDate = values.dateCreated.format("YYYY-MM-DD");
        const initialDate = initialValues.dateCreated.format("YYYY-MM-DD");
        if (selectedDate !== initialDate) {
          requestBody.dateCreated = values.dateCreated
            .hour(0)
            .minute(0)
            .second(0)
            .toISOString();
        }
      }

      if (Object.keys(requestBody).length === 0) {
        message.warning("لم يتم تغيير أي بيانات");
        return;
      }

      await axiosInstance.patch(`${Url}/api/Expense/${expenseId}`, requestBody, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      message.success("تم تحديث المصروف بنجاح");
      handleAdminCancel();
    } catch (error) {
      if (error.response?.status === 401) {
        message.error("انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى");
        return;
      } else if (error.response?.status === 403) {
        message.error("ليس لديك صلاحية لتنفيذ هذا الإجراء");
        return;
      } else if (error.response?.status === 409) {
        message.error("هنالك مصروف شهري بنفس هذا التاريخ");
        return;
      }
      message.error("فشل تحديث المصروف");
    } finally {
      setIsAdjusting(false);
    }
  };

  // ======== Approve/Return permissions ========
  const currentStatus = expense?.generalInfo?.["الحالة"];
  const userPosition = profile?.position || "";

  const canApprove = useMemo(() => {
    if (!profile?.profileId || currentStatus == null) return false;
    if (!isNewWorkflowActive) {
      return getNextStatus(currentStatus, userPosition) !== null;
    }
    return wfActions.some((a) => {
      const code = (a?.actionInfo?.code || a?.code || "").toLowerCase();
      const type = Number(a?.actionInfo?.id ?? a?.actionType);
      return code === "resend" || type === 2 || code === "complete" || type === 3 || code.startsWith("send");
    });
  }, [
    profile?.profileId,
    currentStatus,
    userPosition,
    isNewWorkflowActive,
    wfActions,
  ]);

  const canReturn = useMemo(() => {
    if (!profile?.profileId || currentStatus == null) return false;
    if (!isNewWorkflowActive) {
      return getRejectionStatus(currentStatus, userPosition) !== null;
    }
    return wfActions.some((a) =>
      (a?.actionInfo?.code || a?.code || "")
        .toLowerCase()
        .startsWith("return")
    );
  }, [
    profile?.profileId,
    currentStatus,
    userPosition,
    isNewWorkflowActive,
    wfActions,
  ]);

  const handleActionClick = (type) => {
    setActionType(type);
    setActionModalVisible(true);
    form.resetFields();
  };

  const handleModalCancel = () => {
    setActionModalVisible(false);
    setActionType(null);
    setActionNote("");
    form.resetFields();
  };

  // ======== SUBMIT ACTION (NEW + OLD workflows) ========
 const handleActionSubmit = async () => {
  try {
    const { notes } = await form.validateFields();
    if (!profile?.profileId) {
      message.error("لم يتم العثور على معلومات المستخدم");
      return;
    }

    setIsSubmitting(true);

    // ---------- NEW WORKFLOW (after 2025-10-02) ----------
    if (isNewWorkflowActive) {
      // 1) اختر الإجراء المسموح (من منطقك الحالي)
      const chosen = pickWfAction(wfActions, actionType /* 'Approval' | 'Return' */);
      if (!chosen) {
        message.error("لا توجد عملية مناسبة متاحة لهذا الدور.");
        return;
      }

      const actorId = EXPENSE_ACTOR_CODE[wfActor];
      if (!actorId) {
        message.error("تعذر تحديد الممثل (Actor) للإجراء.");
        return;
      }

      const numericActionType = Number(chosen.actionType ?? chosen.actionInfo?.id);
      const code = (chosen?.actionInfo?.code || chosen?.code || "").toLowerCase();
      const isResendOrComplete =
        code === "resend" || numericActionType === 2 ||
        code === "complete" || numericActionType === 3;

      // 2) الـ payload الافتراضي (كما كان)
      let payload = {
        actor: actorId,
        actionType: numericActionType,
        to: isResendOrComplete ? null : (chosen.to ?? chosen.toInfo?.id ?? null),
        comment: notes,
        PerformedByUserId: profile.profileId,
      };

      // 3) شرطك الخاص:
      //    - فقط إذا كان المستخدم ProjectCoordinator/SrController
      //    - وهناك pendingResendTarget صالح
      //    - وضغط على "موافقة" (Approval)
      const isProjectCoordinator =
        (profile?.position || "").toLowerCase().includes("projectcoordinator") ||
        (profile?.position || "").toLowerCase().includes("srcontroller");

      const prtRaw = expense?.generalInfo?.pendingResendTarget;
      const prt = prtRaw == null ? null : Number(prtRaw);

      if (isProjectCoordinator && actionType === "Approval" && Number.isFinite(prt)) {
        payload = {
          actor: 2,          // ثابت
          actionType: 0,     // ثابت (Send)
          to: prt,           // 4 أو 5 ... حسب قيمة الـ API
          comment: notes,
          PerformedByUserId: profile.profileId,
        };
      }

      await axiosInstance.put(
        `${Url}/api/MonthlyExpensesWorkflow/${expenseId}/actions`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      message.success(
        `تم ${actionType === "Approval" ? "الموافقة" : "الإرجاع"} بنجاح (النظام الجديد)`
      );
      handleModalCancel();
      navigate("/supervisor/Expensess", { replace: true });
      return;
    }

    // ---------- OLD WORKFLOW (on/before 2025-10-02) ----------
    const _getStatusFn = actionType === "Approval" ? getNextStatus : getRejectionStatus;
    const newStatus = _getStatusFn(currentStatus, userPosition);

    if (newStatus === null) {
      message.error("لا يمكنك تنفيذ هذا الإجراء على هذه الحالة.");
      return;
    }
    if (newStatus === currentStatus) {
      message.warning("الحالة الحالية لا تسمح بهذا الإجراء.");
      return;
    }

    const dynamicActionType =
      actionType === "Approval"
        ? `تمت الموافقة من ${profile.position || ""} ${profile.fullName || ""}`
        : `تم الارجاع من ${profile.position || ""} ${profile.fullName || ""}`;

    await axiosInstance.post(
      `${Url}/api/Actions`,
      {
        actionType: dynamicActionType,
        notes,
        profileId: profile.profileId,
        monthlyExpensesId: expenseId,
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    await axiosInstance.post(
      `${Url}/api/Expense/${expenseId}/status`,
      { monthlyExpensesId: expenseId, newStatus },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    message.success(
      `تم ${actionType === "Approval" ? "الموافقة" : "الإرجاع"} بنجاح (النظام القديم)`
    );
    handleModalCancel();
    navigate("/supervisor/Expensess", { replace: true });
  } catch (err) {
    console.error("Error in handleActionSubmit:", err);
    message.error(
      `حدث خطأ أثناء ${actionType === "Approval" ? "الموافقة" : "الإرجاع"}`
    );
  } finally {
    setIsSubmitting(false);
  }
};


  // ======== Table pagination state persist ========
  const handleTableChange = (pagination) => {
    const { current, pageSize } = pagination;
    setCurrentPage(current);
    setPageSize(pageSize);
    localStorage.setItem(
      "expensesPagination",
      JSON.stringify({ page: current, pageSize })
    );
  };

  // ======== Fetch daily expense details ========
  const fetchDailyExpenseDetails = async (id) => {
    try {
      setIsLoadingDetails(true);
      const response = await axiosInstance.get(
        `${Url}/api/Expense/dailyexpenses/${id}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return {
        تسلسل: "-",
        التاريخ: new Date(response.data.expenseDate).toLocaleDateString(),
        "نوع المصروف": response.data.expenseTypeName,
        الكمية: response.data.quantity,
        السعر: response.data.price,
        المجموع: response.data.amount,
        ملاحظات: response.data.notes,
        id: response.data.id,
        type: "daily",
      };
    } catch (error) {
      console.error("Error fetching daily expense details:", error);
      message.error("حدث خطأ أثناء جلب تفاصيل المصروف اليومي");
      return null;
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleShowDetails = async (record) => {
    if (record.type === "daily") {
      const details = await fetchDailyExpenseDetails(record.id);
      if (details) {
        setSelectedItem(details);
        setIsModalVisible(true);
      }
    } else {
      if (record.image) {
        try {
          const response = await axiosInstance.get(
            `${Url}/api/attachment/${record.image}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              responseType: "blob",
            }
          );
          const imageUrl = URL.createObjectURL(response.data);
          setSelectedItem({ ...record, imageUrl });
        } catch (error) {
          console.error("Error fetching image:", error);
          message.error("حدث خطأ أثناء جلب الصورة");
          setSelectedItem(record);
        }
      } else {
        setSelectedItem(record);
      }
      setIsModalVisible(true);
    }
  };

  const handleModalClose = () => {
    if (selectedItem?.imageUrl) URL.revokeObjectURL(selectedItem.imageUrl);
    setIsModalVisible(false);
    setSelectedItem(null);
  };

  // ======== NEW workflow: load allowed actions for the first actor with actions ========
  useEffect(() => {
    if (!isNewWorkflowActive || !expenseId || actorCandidates.length === 0)
      return;

    let cancelled = false;
    (async () => {
      for (const actor of actorCandidates) {
        try {
          const res = await axiosInstance.get(
            `${Url}/api/MonthlyExpensesWorkflow/${expenseId}/actions`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
              params: { actor: EXPENSE_ACTOR_CODE[actor] ?? actor },
            }
          );
          const actions = res?.data?.actionsView || res?.data?.actions || [];
          if (cancelled) return;

          if (actions.length > 0) {
            setWfActor(actor);
            setWfActions(actions);
            return;
          }

          if (actor === actorCandidates[actorCandidates.length - 1]) {
            setWfActor(actor);
            setWfActions(actions);
          }
        } catch {
          // try next actor silently
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isNewWorkflowActive, expenseId, actorCandidates, accessToken]);

  // ======== Load expense & items ========
  useEffect(() => {
    let isMounted = true;

    const fetchAllExpenseData = async () => {
      if (!expenseId) {
        message.error("لم يتم العثور على معرف المصروف");
        navigate("/expenses-history");
        return;
      }

      try {
        setIsLoading(true);

        const expensePromise = axiosInstance.get(
          `${Url}/api/Expense/${expenseId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const dailyExpensesPromise = axiosInstance.get(
          `${Url}/api/Expense/${expenseId}/daily-expenses`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const [expenseResponse, dailyExpensesResponse] = await Promise.all([
          expensePromise,
          dailyExpensesPromise,
        ]);

        if (!isMounted) return;

        const officeId = expenseResponse.data.officeId;
        const officeResponse = await axiosInstance.get(
          `${Url}/api/office/${officeId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const officeBudget = officeResponse.data.budget;

        const regularItems =
          expenseResponse.data.expenseItems?.map((item, index) => ({
            key: `regular-${item.id ?? index}`,
            تسلسل: index + 1,
            التاريخ: new Date(item.date).toLocaleDateString(),
            "نوع المصروف": item.description,
            الكمية: item.quantity,
            السعر: item.unitPrice,
            المجموع: item.totalAmount,
            ملاحظات: item.notes,
            image: item.receiptImage,
            type: "regular",
            isSubExpense: false,
          })) || [];

        const dailyItems = dailyExpensesResponse.data.map((item, idx) => {
          const hasSubExpenses = item.subExpenses?.length > 0;

          const totalQty =
            (Number(item.quantity) || 0) +
            (item.subExpenses?.reduce(
              (s, sub) => s + (Number(sub.quantity) || 0),
              0
            ) || 0);

          const totalAmt =
            (Number(item.amount) || 0) +
            (item.subExpenses?.reduce(
              (s, sub) => s + (Number(sub.amount) || 0),
              0
            ) || 0);

          return {
            key: `daily-${item.id}`,
            seqId: idx + 1,
            تسلسل: idx + 1,
            التاريخ: new Date(item.expenseDate).toLocaleDateString(),
            "نوع المصروف": hasSubExpenses ? "مستلزمات مكتب" : item.expenseTypeName,
            الكمية: totalQty,
            السعر: hasSubExpenses ? "------" : item.price,
            المجموع: totalAmt,
            ملاحظات: hasSubExpenses ? "لا يوجد" : item.notes,
            id: item.id,
            type: "daily",
          };
        });

        setDailyExpensesList(dailyItems);

        const allItems = [...regularItems, ...dailyItems].sort(
          (a, b) => new Date(b.التاريخ) - new Date(a.التاريخ)
        );

        const flattenedAllItems = flattenItems(allItems);
        const finalTotal = flattenedAllItems.reduce(
          (sum, item) => sum + (item.المجموع || 0),
          0
        );
        const remainingAmount = officeBudget - finalTotal;

        if (!isMounted) return;

     setExpense({
  generalInfo: {
    "الرقم التسلسلي": expenseResponse.data.id,
    "اسم المشرف": expenseResponse.data.profileFullName,
    المحافظة: expenseResponse.data.governorateName,
    المكتب: expenseResponse.data.officeName,
    "مبلغ النثرية": officeBudget,
    "مجموع الصرفيات": finalTotal,
    المتبقي: remainingAmount,
    التاريخ: new Date(expenseResponse.data.dateCreated).toLocaleDateString(),
    الحالة: expenseResponse.data.status,
    rawDate: expenseResponse.data.dateCreated,
    pendingResendTarget: expenseResponse.data.pendingResendTarget, // ⬅️ الجديد
  },
  items: allItems,
  flattenedItems: flattenedAllItems,
});
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching expense data:", error);
          message.error("حدث خطأ أثناء جلب البيانات");
          navigate("/expenses-history");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchAllExpenseData();
    return () => {
      isMounted = false;
    };
  }, [expenseId, accessToken, navigate]);

  /* ====================== Export: Excel ====================== */
  const handleExportToExcel = async () => {
    try {
      if (!expense) {
        message.error("لا توجد بيانات لتصديرها");
        return;
      }
      const flattened = expense?.flattenedItems || [];
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("تقرير المصاريف", {
        properties: { rtl: true },
      });

      const supervisorRow = worksheet.addRow([
        "الحالة",
        "المتبقي",
        "مجموع الصرفيات",
        "مبلغ النثرية",
        "المكتب",
        "المحافظة",
        "اسم المشرف",
      ]);
      supervisorRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4CAF50" } };
        cell.border = {
          top: { style: "thin" }, bottom: { style: "thin" },
          left: { style: "thin" }, right: { style: "thin" },
        };
      });

      const supervisorDataRow = worksheet.addRow([
        statusMap[expense?.generalInfo?.["الحالة"]] || "N/A",
        Number(expense?.generalInfo?.["المتبقي"] ?? 0),
        Number(expense?.generalInfo?.["مجموع الصرفيات"] ?? 0),
        Number(expense?.generalInfo?.["مبلغ النثرية"] ?? 0),
        expense?.generalInfo?.["المكتب"] || "N/A",
        expense?.generalInfo?.["المحافظة"] || "N/A",
        expense?.generalInfo?.["اسم المشرف"] || "N/A",
      ]);
      supervisorDataRow.eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" }, bottom: { style: "thin" },
          left: { style: "thin" }, right: { style: "thin" },
        };
      });

      worksheet.addRow([]);

      const headers = ["ملاحظات", "المجموع", "سعر المفرد", "العدد", "البند", "التاريخ", "ت"];
      const headerRow = worksheet.addRow(headers);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF9C27B0" } };
        cell.border = {
          top: { style: "thin" }, bottom: { style: "thin" },
          left: { style: "thin" }, right: { style: "thin" },
        };
      });

      const itemsStartRow = headerRow.number + 1;

      flattened.forEach((item, index) => {
        const row = worksheet.addRow([
          item["ملاحظات"] || "",
          Number(item["المجموع"] || 0),
          Number(item["السعر"] || 0),
          item["الكمية"] || "",
          (item.isSubExpense ? "↲ " : "") + item["نوع المصروف"],
          item["التاريخ"] || "",
          index + 1,
        ]);
        row.eachCell((cell) => {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = {
            top: { style: "thin" }, bottom: { style: "thin" },
            left: { style: "thin" }, right: { style: "thin" },
          };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: index % 2 === 0 ? "FFF5F5F5" : "FFFFFFFF" },
          };
        });
      });

      const summaryRow = worksheet.addRow([]);
      summaryRow.getCell(1).value = "المجموع الكامل للصرفيات";
      summaryRow.getCell(2).value = {
        formula: `SUM(B${itemsStartRow}:B${worksheet.lastRow.number - 1})`,
        result: 0,
      };
      summaryRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FF000000" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD3D3D3" } };
        cell.border = {
          top: { style: "thin" }, bottom: { style: "thin" },
          left: { style: "thin" }, right: { style: "thin" },
        };
      });

      worksheet.columns = [
        { width: 30 }, { width: 30 }, { width: 30 },
        { width: 30 }, { width: 30 }, { width: 25 }, { width: 20 },
      ];

      const now = new Date();
      const formattedDate = now
        .toLocaleDateString("en-GB", {
          year: "numeric", month: "2-digit", day: "2-digit",
        })
        .replace(/\//g, "-");
      const fileName = `تقرير_${formattedDate}.xlsx`;

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), fileName);
      message.success(`تم تصدير التقرير بنجاح: ${fileName}`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      message.error("حدث خطأ أثناء تصدير التقرير");
    }
  };

  /* ====================== Export: PDF ====================== */
  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const flattened = expense?.flattenedItems || [];
      const element = document.createElement("div");
      element.dir = "rtl";
      element.style.fontFamily = "Arial, sans-serif";

      const proxyUrls = [
        (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
        (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        (url) => `https://proxy.cors.sh/${url}`,
        (url) => `https://cors-anywhere.herokuapp.com/${url}`,
      ];

      const fetchImageWithProxy = async (url, proxyIndex = 0) => {
        if (proxyIndex >= proxyUrls.length) throw new Error("All proxies failed");
        try {
          const proxyUrl = proxyUrls[proxyIndex](url);
          const img = document.createElement("img");
          img.crossOrigin = "anonymous";
          return new Promise((resolve) => {
            img.onload = () => {
              try {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL("image/jpeg", 0.8));
              } catch {
                resolve(fetchImageWithProxy(url, proxyIndex + 1));
              }
            };
            img.onerror = () => resolve(fetchImageWithProxy(url, proxyIndex + 1));
            img.src = proxyUrl;
          });
        } catch {
          return fetchImageWithProxy(url, proxyIndex + 1);
        }
      };

      const fetchImages = async (items) => {
        const imagePromises = items
          .filter((item) => item.type === "daily")
          .map(async (item) => {
            try {
              const response = await axiosInstance.get(
                `/api/Attachment/Expense/${item.id}`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
              );
              const imageUrls =
                response.data?.map(
                  (a) => `http://oms-cdn.scopesky.iq/${a.filePath}`
                ) || [];
              const imagesWithBase64 = await Promise.all(
                imageUrls.map(async (url) => {
                  try {
                    return await fetchImageWithProxy(url);
                  } catch {
                    return null;
                  }
                })
              );
              return { ...item, images: imagesWithBase64.filter(Boolean) };
            } catch (error) {
              console.error(`Error fetching images for expense ${item.id}:`, error);
              return { ...item, images: [] };
            }
          });
        return Promise.all(imagePromises);
      };

      const itemsWithImages = await fetchImages(expense?.items || []);

      element.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <h1>تقرير المصاريف</h1>
          <p>التاريخ: ${expense?.generalInfo?.["التاريخ"] || ""}</p>
          <table border="1" style="width:100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th>اسم المشرف</th>
                <th>المحافظة</th>
                <th>المكتب</th>
                <th>مبلغ النثرية</th>
                <th>مجموع الصرفيات</th>
                <th>المتبقي</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${expense?.generalInfo?.["اسم المشرف"] || ""}</td>
                <td>${expense?.generalInfo?.["المحافظة"] || ""}</td>
                <td>${expense?.generalInfo?.["المكتب"] || ""}</td>
                <td>${expense?.generalInfo?.["مبلغ النثرية"] || 0}</td>
                <td>${expense?.generalInfo?.["مجموع الصرفيات"] || 0}</td>
                <td>${expense?.generalInfo?.["المتبقي"] || 0}</td>
              </tr>
            </tbody>
          </table>
          <br/>
          <h2>العناصر</h2>
          <table border="1" style="width:100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th>ت</th>
                <th>تاريخ</th>
                <th>البند</th>
                <th>العدد</th>
                <th>سعر المفرد</th>
                <th>المجموع</th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              ${flattened
                .map(
                  (item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.التاريخ}</td>
                  <td>${item.isSubExpense ? "↳ " : ""}${item["نوع المصروف"] ?? ""}</td>
                  <td>${item["الكمية"] ?? ""}</td>
                  <td>${item["السعر"] ?? 0}</td>
                  <td>${item["المجموع"] ?? 0}</td>
                  <td>${item["ملاحظات"] ?? ""}</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
        <div style="margin-top: 40px; text-align: center; page-break-before: always;">
          <h2 style="font-size: 20px; color: #000; margin-bottom: 20px;">صور المصروفات</h2>
          ${itemsWithImages
            .filter((it) => it.images && it.images.length > 0)
            .map((it) =>
              it.images
                .map(
                  (base64) => `
                  <div style="page-break-before: always; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center;">
                    <img src="${base64}" alt="Expense Image" style="max-width: 100%; max-height: 100%; object-fit: contain; margin-bottom: 20px;" />
                  </div>`
                )
                .join("")
            )
            .join("")}
        </div>
      `;

      const opt = {
        margin: 2,
        filename: "تقرير_المصاريف.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: "cm", format: "a4", orientation: "portrait" },
      };

      await html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error("حدث خطأ أثناء إنشاء ملف PDF");
    } finally {
      setIsPrinting(false);
    }
  };

  /* ====================== Columns ====================== */
  const expenseItemsColumns = [
    {
      title: "",
      key: "expand",
      width: "50px",
      align: "center",
      render: (_, record) =>
        record.children ? (
          <div
            style={{
              cursor: "pointer",
              color: "#1890ff",
              fontSize: "12px",
              width: "20px",
              margin: "0 auto",
            }}
          />
        ) : null,
    },
    { title: "ت", dataIndex: "تسلسل", align: "center" },
    { title: "تاريخ", dataIndex: "التاريخ", align: "center" },
    {
      title: "البند",
      dataIndex: "نوع المصروف",
      align: "center",
      render: (text, record) => {
        const displayText =
          record.children && record.children.length > 0
            ? "مستلزمات مكتب"
            : text;
        return (
          <span
            style={{
              paddingRight: record.isSubExpense ? "20px" : 0,
              color: record.isSubExpense ? "#1890ff" : "inherit",
              display: "flex",
              alignItems: "center",
            }}
          >
            {record.isSubExpense && (
              <span style={{ marginLeft: 8 }}>↳</span>
            )}
            {displayText}
          </span>
        );
      },
    },
    {
      title: "العدد",
      dataIndex: "الكمية",
      align: "center",
      render: (text, record) => {
        const parentQuantity = Number(text) || 0;
        const childrenQuantity =
          record.children && record.children.length > 0
            ? record.children.reduce(
                (sum, child) => sum + (Number(child["الكمية"]) || 0),
                0
              )
            : 0;
        return parentQuantity + childrenQuantity;
      },
    },
    {
      title: "سعر المفرد",
      dataIndex: "السعر",
      align: "center",
      render: (value, record) => {
        if (record.isSubExpense || value === "------") return "------";
        const numericVal = Number(value);
        if (isNaN(numericVal)) return "------";
        return `IQD ${numericVal.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}`;
      },
    },
    {
      title: "المجموع",
      dataIndex: "المجموع",
      align: "center",
      render: (text, record) => {
        const parentAmount = Number(text) || 0;
        const childrenAmount = record.children
          ? record.children.reduce(
              (sum, child) => sum + (Number(child.المجموع) || 0),
              0
            )
          : 0;
        const total = parentAmount + childrenAmount;
        return `IQD ${total.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}`;
      },
    },
    {
      title: "ملاحظات",
      dataIndex: "ملاحظات",
      align: "center",
      render: (text, record) =>
        record.children && record.children.length > 0 ? "لا يوجد" : text,
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (_, record) => (
        <Link
          key={`action-${record.seqId}`}
          to="/Expensess-view-daily"
          state={{
            currentSeq: record.seqId,
            dailyExpenseId: record.id,
            status: expense?.generalInfo?.["الحالة"],
            parentExpenseId: expenseId,
            dailyExpenses: dailyExpensesList,
          }}
        >
          <Button type="primary" size="large" loading={isLoadingDetails}>
            عرض
          </Button>
        </Link>
      ),
    },
  ];

  // ======== Header title ========
const getHeaderTitle = () => {
  const officeName = expense?.generalInfo?.["المكتب"] || "";
  const rawDate = expense?.generalInfo?.rawDate;

  if (rawDate) {
    const arabicMonth = getArabicMonthDisplay(rawDate); // ✅ correct var name
    const workflowIndicator = shouldUseNewWorkflow(rawDate) ? " (النظام الجديد)" : "";
    return `صرفيات ${officeName} - ${arabicMonth}${workflowIndicator}`;
  }

  return `صرفيات ${officeName} بتاريخ ${expense?.generalInfo?.["التاريخ"] || ""}`;
};

  // ======== Admin button ========
  const AdminButton = () => {
    if (!hasAdminPermission) return null;
    return (
      <Button
        type="primary"
        style={{ padding: "20px 30px", backgroundColor: "#722ed1", borderColor: "#722ed1" }}
        onClick={handleAdminClick}
        icon={<PlusOutlined />}
      >
        تعديل المصروف (مدير)
      </Button>
    );
  };

  // ======== SuperAdmin adjustment ========
  const isSuperAdminOnly = useMemo(
    () => (roles || []).some((r) => r?.toLowerCase() === "superadmin"),
    [roles]
  );
  const [adjValue, setAdjValue] = useState(null);
  const [adjLoading, setAdjLoading] = useState(false);

  const handleAdjustTotalAmount = async () => {
    if (adjValue === null || adjValue === "" || isNaN(adjValue)) {
      return message.error("الرجاء إدخال قيمة صحيحة (يمكن أن تكون سالبة)");
    }
    try {
      setAdjLoading(true);
      await axiosInstance.patch(
        `${Url}/api/Expense/${expenseId}`,
        { totalAmountAdjustment: Number(adjValue) },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      message.success("تم تعديل قيمة المجموع (الإضافة/الخصم) بنجاح");
    } catch (e) {
      if (e?.response?.status === 401) message.error("انتهت صلاحية الجلسة");
      else if (e?.response?.status === 403) message.error("ليس لديك صلاحية");
      else message.error("فشل تعديل المجموع");
    } finally {
      setAdjLoading(false);
    }
  };

  /* ====================== Render ====================== */
  return (
    <>
      <Dashboard />
      <div
        dir="rtl"
        className={`supervisor-expenses-request-page ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}
        style={{ padding: 24 }}
      >
        <h1 className="expensess-date">{getHeaderTitle()}</h1>

        {/* Action Buttons */}
        {(isNewWorkflowActive || !pos.includes("supervisor")) && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 20,
              width: "100%",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              {canApprove && (
                <Button
                  type="primary"
                  style={{ padding: "20px 30px" }}
                  onClick={() => handleActionClick("Approval")}
                >
                  موافقة
                </Button>
              )}

              {canReturn && (
                <Button
                  danger
                  type="primary"
                  style={{ padding: "20px 40px" }}
                  onClick={() => handleActionClick("Return")}
                >
                  ارجاع
                </Button>
              )}

              {isSuperAdminOnly && (
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <InputNumber
                    style={{ width: 240, height: 42 }}
                    placeholder="قيمة التعديل (مثال: -84000)"
                    value={adjValue}
                    onChange={setAdjValue}
                    step={1000}
                    controls
                  />
                  <Button
                    style={{ width: 240, height: 42 }}
                    type="primary"
                    loading={adjLoading}
                    onClick={handleAdjustTotalAmount}
                  >
                    حفظ تعديل المجموع
                  </Button>
                </div>
              )}
            </div>

            <AdminButton />
          </div>
        )}

        {/* General Details */}
        <Table
          className="expense-details-table"
          loading={isLoading}
          columns={[
            { title: "اسم المشرف", dataIndex: "اسم المشرف", align: "center" },
            { title: "المحافظة", dataIndex: "المحافظة", align: "center" },
            { title: "المكتب", dataIndex: "المكتب", align: "center" },
            {
              title: "مبلغ النثرية",
              dataIndex: "مبلغ النثرية",
              align: "center",
              render: (t) => `IQD ${Number(t).toLocaleString()}`,
            },
            {
              title: "مجموع الصرفيات",
              dataIndex: "مجموع الصرفيات",
              align: "center",
              render: (t) => `IQD ${Number(t).toLocaleString()}`,
            },
            {
              title: "المتبقي",
              dataIndex: "المتبقي",
              align: "center",
              render: (t) => `IQD ${Number(t).toLocaleString()}`,
            },
            {
              title: "الحالة",
              dataIndex: "الحالة",
              align: "center",
              render: (status) => {
                const statusCode =
                  typeof status === "string" ? Status[status] : status;
                return statusMap[statusCode] || status;
              },
            },
          ]}
          dataSource={[expense?.generalInfo]}
          bordered
          pagination={false}
          locale={{ emptyText: "لا توجد بيانات" }}
        />

        {/* Export Buttons */}
        <div
          className="supervisor-device-filter-buttons"
          style={{ marginTop: 20, marginBottom: 20 }}
        >
          <button
            className="modern-button pdf-button"
            onClick={handlePrint}
            disabled={isPrinting}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 24px", borderRadius: 8 }}
          >
            {isPrinting ? (
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="spinner" /> جاري التنزيل...
              </span>
            ) : (
              <>
                انشاء ملف PDF
                <Icons type="pdf" />
              </>
            )}
          </button>

          <button
            className="modern-button excel-button"
            onClick={handleExportToExcel}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 24px", borderRadius: 8 }}
          >
            انشاء ملف Excel
            <Icons type="excel" />
          </button>
        </div>

        <hr />

        {/* Items Table */}
        <ConfigProvider direction="rtl">
          <Table
            rowKey="key"
            className="expense-items-table"
            loading={isLoading}
            columns={expenseItemsColumns}
            dataSource={expense?.items}
            bordered
            pagination={{
              current: currentPage,
              pageSize,
              showSizeChanger: true,
              pageSizeOptions: ["5", "10", "20", "50"],
              position: ["bottomCenter"],
            }}
            onChange={handleTableChange}
            locale={{ emptyText: "لا توجد عناصر للصرف." }}
            summary={() => {
              const totalExpenses =
                expense?.generalInfo?.["مجموع الصرفيات"] || 0;
              return (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={5} align="center">
                      المجموع الكلي
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="center">
                      IQD{" "}
                      {Number(totalExpenses).toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} colSpan={2} />
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
          />
        </ConfigProvider>

        {/* Details Modal */}
        <Modal
          title={`تفاصيل المصروف ${selectedItem?.type === "daily" ? "اليومي" : ""}`}
          open={isModalVisible}
          onCancel={handleModalClose}
          footer={[<Button key="close" onClick={handleModalClose}>إغلاق</Button>]}
          width={800}
          style={{ direction: "rtl" }}
        >
          {selectedItem && (
            <div className="expense-details">
              <Table
                columns={[
                  { title: "الحقل", dataIndex: "field", align: "right" },
                  {
                    title: "القيمة",
                    dataIndex: "value",
                    align: "right",
                    render: (text, record) => {
                      if (record.field === "image" || record.field === "imageUrl") return null;
                      if (record.field === "السعر" || record.field === "المجموع")
                        return typeof text === "number" ? `IQD${text.toFixed(2)}` : text;
                      if (record.field === "type")
                        return text === "daily" ? "مصروف يومي" : "مصروف عادي";
                      return text;
                    },
                  },
                ]}
                dataSource={Object.entries(selectedItem)
                  .filter(([key]) => !["image", "imageUrl"].includes(key))
                  .map(([key, value]) => ({ key, field: key, value }))}
                pagination={false}
                bordered
              />

              {selectedItem.type === "regular" && selectedItem.imageUrl && (
                <div className="image-container" style={{ marginTop: 20 }}>
                  <p>الصورة:</p>
                  <hr style={{ marginBottom: 10, marginTop: 10 }} />
                  <Image
                    src={selectedItem.imageUrl}
                    alt="تفاصيل الصورة"
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Action Modal */}
        <Modal
          style={{ direction: "rtl" }}
          title={actionType === "Approval" ? "تأكيد الموافقة" : "تأكيد الإرجاع"}
          open={actionModalVisible}
          onCancel={handleModalCancel}
          footer={[
            <Button key="cancel" onClick={handleModalCancel}>إلغاء</Button>,
            <Button key="submit" type="primary" loading={isSubmitting} onClick={handleActionSubmit}>
              تأكيد
            </Button>,
          ]}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label="الملاحظات"
              name="notes"
              rules={[{ required: true, message: "الرجاء إدخال الملاحظات" }]}
            >
              <Input.TextArea
                rows={4}
                style={{ minWidth: 460 }}
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="أدخل الملاحظات هنا..."
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* Admin Modal */}
        <Modal
          title="تعديل المصروف - صلاحية الإدارة"
          open={adminModalVisible}
          onCancel={handleAdminCancel}
          footer={[
            <Button key="cancel" onClick={handleAdminCancel}>إلغاء</Button>,
            <Button
              key="submit"
              type="primary"
              loading={isAdjusting}
              onClick={handleAdminSubmit}
              style={{ backgroundColor: "#722ed1", borderColor: "#722ed1" }}
            >
              تحديث المصروف
            </Button>,
          ]}
          width={600}
          style={{ direction: "rtl" }}
        >
          <Form form={adminForm} layout="vertical" style={{ marginTop: 20 }}>
            <Form.Item
              label="الحالة"
              name="status"
              rules={[{ required: true, message: "الرجاء اختيار الحالة" }]}
            >
              <Select placeholder="اختر الحالة">
                {Object.entries(statusMap).map(([key, value]) => (
                  <Select.Option key={key} value={Number(key)}>
                    {value}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="تاريخ الإنشاء"
              name="dateCreated"
              rules={[{ required: true, message: "الرجاء اختيار التاريخ" }]}
            >
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" placeholder="اختر التاريخ" />
            </Form.Item>
          </Form>
        </Modal>

        {/* Logs/Actions Table based on workflow */}
        {isNewWorkflowActive ? (
          <ActionLogsTable expenseId={expenseId} isNewWorkflow={isNewWorkflowActive} />
        ) : (
          <ExpensessViewActionsTable monthlyExpensesId={expenseId} />
        )}
      </div>
    </>
  );
}
