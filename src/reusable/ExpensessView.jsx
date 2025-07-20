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

// Status Enum matching backend exactly
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

// Arabic months mapping with numbers
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

// Helper function to get Arabic month name with number
const getArabicMonthDisplay = (dateString) => {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  const monthNumber = date.getMonth() + 1; // getMonth() returns 0-11, so add 1
  const year = date.getFullYear();
  
  const arabicMonth = arabicMonths.find(month => month.value === monthNumber);
  
  if (arabicMonth) {
    return `${arabicMonth.label} ${year}`;
  }
  
  return dateString; // fallback to original date if month not found
};

export default function ExpensesView() {
  const { isSidebarCollapsed, accessToken, profile, roles } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const expenseId = location.state?.expense?.id;

  const [expense, setExpense] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [actionNote, setActionNote] = useState("");
  const [form] = Form.useForm();
  const [isPrinting, setIsPrinting] = useState(false);

  // Admin Modal States
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [adminForm] = Form.useForm();
  const [isAdjusting, setIsAdjusting] = useState(false);

  const saved = JSON.parse(localStorage.getItem("expensesPagination") || "{}");
  const [currentPage, setCurrentPage] = useState(saved.page || 1);
  const [pageSize, setPageSize] = useState(saved.pageSize || 5);

  // Check if user has SuperAdmin or Admin role
  const hasAdminPermission = useMemo(() => {
    const userRoles = roles || [];
    return userRoles.some(role => 
      role?.toLowerCase() === "superadmin" || role?.toLowerCase() === "admin"
    );
  }, [roles]);

  // Check if user is accountant
  const isAccountant = profile?.position?.toLowerCase()?.includes("accontnt");

  // Flattens top-level items + their children
  function flattenItems(items) {
    const result = [];
    items.forEach((item) => {
      // Push the main item
      result.push(item);
      // If it has children (subExpenses), push them too
      if (item.children && item.children.length > 0) {
        item.children.forEach((subItem) => {
          result.push(subItem);
        });
      }
    });
    return result;
  }

  // Helper functions for status transitions
  const getNextStatus = (currentStatus, position) => {
    // Convert the position string to lowercase for case-insensitive matching.
    position = position?.toLowerCase();

    if (currentStatus === "SentFromDirector" && position?.includes("expenseauditer")) {
      return Status.SentToExpenseManager;
    } 
   
    else if (currentStatus === "SentToProjectCoordinator" && position?.includes("projectcoordinator")) {
      return Status.SentToManager;
    } else if (currentStatus === "ReturnedToProjectCoordinator" && position?.includes("projectcoordinator")) {
      return Status.SentToManager;
    } else if (currentStatus === "SentToManager" && position?.includes("manager")) {
      return Status.SentToDirector;
    } else if (currentStatus === "ReturnedToManager" && position?.includes("manager")) {
      return Status.SentToDirector;
    } else if (currentStatus === "SentToDirector" && position?.includes("director")) {
      return Status.SentFromDirector;
      
    } 
    else if (currentStatus === "SentToExpenseGeneralManager" && position?.includes("expensegeneralmanager")) {
      return Status.RecievedBySupervisor;
    }
    else if (currentStatus === "ReturnedToExpendeAuditer" && position?.includes("expenseauditer")) {
      return Status.SentToExpenseGeneralManager;
    }

    else if (currentStatus === "SentToExpenseManager" && position?.includes("expensemanager")) {
      return Status.SentToExpenseGeneralManager;
      
    } 
     else if (currentStatus === "ReturnedToExpenseManager" && position?.includes("expensemanager")) {
      return Status.SentToExpenseGeneralManager;
      
    } 
    
    else if (currentStatus === "RecievedBySupervisor" && position?.includes("supervisor")) {
      return Status.Completed;
    }
  
    return null;
  };

  const getRejectionStatus = (currentStatus, position) => {
    position = position?.toLowerCase();
    if (currentStatus === "SentToProjectCoordinator" && position?.includes("projectcoordinator")) {
      return Status.ReturnedToSupervisor;
    }else if (currentStatus === "ReturnedToProjectCoordinator" && position?.includes("projectcoordinator")) {
        return Status.ReturnedToSupervisor;
    } else if (currentStatus === "SentToManager" && position?.includes("manager")) {
      return Status.ReturnedToProjectCoordinator;
    } else if (currentStatus === "ReturnedToManager" && position?.includes("manager")) {
      return Status.ReturnedToProjectCoordinator;
    } 
    else if (currentStatus === "SentFromDirector" && position?.includes("expenseauditer")) {
      return Status.ReturnedToProjectCoordinator;
    } 
    else if (currentStatus === "ReturnedToExpendeAuditer" && position?.includes("expenseauditer")) {
      return Status.ReturnedToProjectCoordinator;
    } 
    else if (currentStatus === "SentToExpenseManager" && position?.includes("expensemanager")) {
      return Status.ReturnedToExpendeAuditer;
    } 
    else if (currentStatus === "ReturnedToExpenseManager" && position?.includes("expensemanager")) {
      return Status.ReturnedToExpendeAuditer;
    } 
    else if (currentStatus === "SentToDirector" && position?.includes("director"))  {
      return Status.ReturnedToManager;
    }
    else if (currentStatus === "SentToExpenseGeneralManager" && position?.includes("expensegeneralmanager"))  {
      return Status.ReturnedToExpenseManager;
    }
    
    return null;
  };

  // Admin modal handlers
  const handleAdminClick = () => {
    setAdminModalVisible(true);
    // Pre-fill the form with actual expense data
    
    // Get the actual date from the expense data
    const expenseDate = expense?.generalInfo?.rawDate 
      ? dayjs(expense.generalInfo.rawDate) 
      : dayjs();
    
    adminForm.setFieldsValue({
      status: expense?.generalInfo?.["الحالة"] || Status.New,
      dateCreated: expenseDate, // Use actual expense date
    });
  };

  const handleAdminCancel = () => {
    setAdminModalVisible(false);
    adminForm.resetFields();
  };

  const handleAdminSubmit = async () => {
    try {
      const values = await adminForm.validateFields();
      setIsAdjusting(true);

      // Get initial values to compare what changed
      const initialValues = {
        status: expense?.generalInfo?.["الحالة"] || Status.New,
        totalAmountAdjustment: expense?.generalInfo?.["مجموع الصرفيات"] || 0,
        dateCreated: dayjs(), // Current date as initial
      };

      // Build request body with only changed fields
      const requestBody = {};

      // Check if status changed
      if (values.status !== initialValues.status) {
        const statusValue = Number(values.status);
        if (isNaN(statusValue)) {
          message.error('حالة غير صالحة');
          return;
        }
        requestBody.status = statusValue;
      }

      // Check if total amount changed
      if (values.totalAmountAdjustment !== initialValues.totalAmountAdjustment) {
        requestBody.totalAmountAdjustment = parseFloat(values.totalAmountAdjustment);
      }

      // Check if date changed (compare formatted dates)
      if (values.dateCreated && dayjs.isDayjs(values.dateCreated)) {
        const selectedDate = values.dateCreated.format('YYYY-MM-DD');
        const initialDate = initialValues.dateCreated.format('YYYY-MM-DD');
        
        if (selectedDate !== initialDate) {
          requestBody.dateCreated = values.dateCreated.hour(0).minute(0).second(0).toISOString();
        }
      }

      // Check if anything actually changed
      if (Object.keys(requestBody).length === 0) {
        message.warning('لم يتم تغيير أي بيانات');
        return;
      }

      const response = await axiosInstance.patch(
        `${Url}/api/Expense/${expenseId}`,
        requestBody,
        {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          // Add a flag to prevent interceptor from showing error messages
        }
      ).catch((error) => {
        // 409 error handling here
  if (patchError.response?.status === 409) {
    message.error('هنالك مصروف شهري بنفس هذا التاريخ');
    return;
  }
  throw patchError; // Other errors go to outer catch
      });

      message.success('تم تحديث المصروف بنجاح');
      handleAdminCancel();
      
      // DON'T reload the page, just refetch the data
      // window.location.reload(); // Remove this line
      
    } catch (error) {
      
      // Handle specific authentication errors
      if (error.response?.status === 401) {
        message.error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى');
        // Don't navigate, let the axios interceptor handle it
        return;
      } else if (error.response?.status === 403) {
        message.error('ليس لديك صلاحية لتنفيذ هذا الإجراء');
        return;
      } else if (error.response?.status === 409) {
        message.error("هنالك مصروف شهري بنفس هذا التاريخ");
        return;
      } 
    } finally {
      setIsAdjusting(false);
    }
  };

  const currentStatus = expense?.generalInfo?.["الحالة"];
  const userPosition = profile?.position || "";

  /* can this user legally approve the current status? */
  const canApprove = useMemo(() => {
    if (!profile?.profileId || currentStatus == null) return false;
    return getNextStatus(currentStatus, userPosition) !== null;
  }, [profile?.profileId, currentStatus, userPosition]);

  /* can this user legally return the current status? */
  const canReturn = useMemo(() => {
    if (!profile?.profileId || currentStatus == null) return false;
    return getRejectionStatus(currentStatus, userPosition) !== null;
  }, [profile?.profileId, currentStatus, userPosition]);

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

  const handleActionSubmit = async () => {
    try {
      const { notes } = await form.validateFields();

      if (!profile?.profileId) {
        message.error("لم يتم العثور على معلومات المستخدم");
        return;
      }

      setIsSubmitting(true);

      const currentStatus = expense?.generalInfo?.["الحالة"];
      const getStatusFn = actionType === "Approval" ? getNextStatus : getRejectionStatus;
      const newStatus = getStatusFn(currentStatus, profile?.position);

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
        `تم ${actionType === "Approval" ? "الموافقة" : "الإرجاع"} بنجاح`
      );
      handleModalCancel();
      navigate(-1);
    } catch (err) {
      console.error("Error in handleActionSubmit:", err);
      message.error(
        `حدث خطأ أثناء ${
          actionType === "Approval" ? "الموافقة" : "الإرجاع"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // whenever page or pageSize changes, persist it
  const handleTableChange = (pagination) => {
    const { current, pageSize } = pagination;
    setCurrentPage(current);
    setPageSize(pageSize);
    localStorage.setItem(
      "expensesPagination",
      JSON.stringify({ page: current, pageSize })
    );
  };

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
    if (selectedItem?.imageUrl) {
      URL.revokeObjectURL(selectedItem.imageUrl);
    }
    setIsModalVisible(false);
    setSelectedItem(null);
  };

  // Fetch all expense data and process items—including sub-expenses
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
  
        // 1) Fetch monthly expense info
        const expensePromise = axiosInstance.get(`${Url}/api/Expense/${expenseId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
  
        // 2) Fetch daily expenses
        const dailyExpensesPromise = axiosInstance.get(
          `${Url}/api/Expense/${expenseId}/daily-expenses`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
  
        const [expenseResponse, dailyExpensesResponse] = await Promise.all([
          expensePromise,
          dailyExpensesPromise,
        ]);
  
        if (!isMounted) return;
  
        // 3) Fetch office budget
        const officeId = expenseResponse.data.officeId;
        const officeResponse = await axiosInstance.get(`${Url}/api/office/${officeId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const officeBudget = officeResponse.data.budget;
  
        // 4) Process regular expense items
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
  
        // 5) Process daily expense items (some may have subExpenses)
        const dailyItems = dailyExpensesResponse.data.map((item, index) => {
          const hasSubExpenses = item.subExpenses && item.subExpenses.length > 0;
        
          // Calculate sums if you need to combine parent + sub
          const totalQuantity = hasSubExpenses
            ? Number(item.quantity) +
              item.subExpenses.reduce((acc, sub) => acc + (Number(sub.quantity) || 0), 0)
            : Number(item.quantity) || 0;
        
          const totalAmount = hasSubExpenses
            ? Number(item.amount) +
              item.subExpenses.reduce((acc, sub) => acc + (Number(sub.amount) || 0), 0)
            : Number(item.amount) || 0;
        
          const dailyRow = {
            key: `daily-${item.id}`,
            تسلسل: index + 1,
            التاريخ: new Date(item.expenseDate).toLocaleDateString(),
            "نوع المصروف": hasSubExpenses ? "مستلزمات مكتب" : item.expenseTypeName,
            الكمية: totalQuantity,
            السعر: hasSubExpenses ? "------" : item.price,
            المجموع: totalAmount,
            ملاحظات: hasSubExpenses ? "لا يوجد" : item.notes,
            id: item.id,
            type: "daily",
          };
        
          return dailyRow;
        });
  
        // 6) Combine the two sets & sort by date desc
        const allItems = [...regularItems, ...dailyItems].sort(
          (a, b) => new Date(b.التاريخ) - new Date(a.التاريخ)
        );
  
        // 7) Flatten them all to compute final totals
        const flattenedAllItems = flattenItems(allItems);
  
        // 8) Sum all .المجموع
        const finalTotal = flattenedAllItems.reduce((sum, item) => sum + (item.المجموع || 0), 0);
  
        // 9) Remaining
        const remainingAmount = officeBudget - finalTotal;
  
        // 10) Store in state
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
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
  
    fetchAllExpenseData();
  
    return () => {
      isMounted = false;
    };
  }, [expenseId, accessToken, navigate]);

  // ================= Export Functions =================

  // Function to export to Excel using ExcelJS and file-saver
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
  
      // 1) Add supervisor info row
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
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4CAF50" },
        };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
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
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });
  
      worksheet.addRow([]);
  
      // 2) Add header row for the items
      const headers = [
        "ملاحظات",
        "المجموع",
        "سعر المفرد",
        "العدد",
        "البند",
        "التاريخ",
        "ت",
      ];
      const headerRow = worksheet.addRow(headers);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF9C27B0" },
        };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
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
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
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
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD3D3D3" },
        };
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });
  
      worksheet.columns = [
        { width: 30 }, // ملاحظات
        { width: 30 }, // المجموع
        { width: 30 }, // سعر المفرد
        { width: 30 }, // العدد
        { width: 30 }, // البند
        { width: 25 }, // التاريخ
        { width: 20 }, // ت
      ];
  
      const now = new Date();
      const formattedDate = now
        .toLocaleDateString("en-GB", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
        .replace(/\//g, "-");
      const fileName = `تقرير_المصاريف_${formattedDate}.xlsx`;
      
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), fileName);
      message.success(`تم تصدير التقرير بنجاح: ${fileName}`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      message.error("حدث خطأ أثناء تصدير التقرير");
    }
  };

 // Function to generate and download a PDF
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
      if (proxyIndex >= proxyUrls.length) {
        throw new Error("All proxies failed");
      }
      try {
        const proxyUrl = proxyUrls[proxyIndex](url);
        const img = document.createElement("img");
        img.crossOrigin = "anonymous";
        return new Promise((resolve, reject) => {
          img.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0);
              const base64String = canvas.toDataURL("image/jpeg", 0.8);
              resolve(base64String);
            } catch (error) {
              resolve(fetchImageWithProxy(url, proxyIndex + 1));
            }
          };
          img.onerror = () => {
            resolve(fetchImageWithProxy(url, proxyIndex + 1));
          };
          img.src = proxyUrl;
        });
      } catch (error) {
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
              {
                headers: { Authorization: `Bearer ${accessToken}` },
              }
            );
            const imageUrls =
              response.data?.map(
                (attachment) =>
                  `http://oms-cdn.scopesky.iq/${attachment.filePath}`
              ) || [];

            const imagesWithBase64 = await Promise.all(
              imageUrls.map(async (url) => {
                try {
                  return await fetchImageWithProxy(url);
                } catch (error) {
                  console.error(`Failed to fetch image: ${url}`);
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
              .map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.التاريخ}</td>
                  <td>${item.isSubExpense ? "↳ " : ""}${item["نوع المصروف"] ?? ""}</td>
                  <td>${item["الكمية"] ?? ""}</td>
                  <td>${item["السعر"] ?? 0}</td>
                  <td>${item["المجموع"] ?? 0}</td>
                  <td>${item["ملاحظات"] ?? ""}</td>
                </tr>
              `)
              .join("")}
          </tbody>
        </table>
      </div>
      <div style="margin-top: 40px; text-align: center; page-break-before: always;">
        <h2 style="font-size: 20px; color: #000; margin-bottom: 20px;">صور المصروفات</h2>
        ${itemsWithImages
          .filter((item) => item.images && item.images.length > 0)
          .map((item) =>
            item.images
              .map(
                (base64) =>
                  `<div style="page-break-before: always; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center;">
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
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
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

  // Define columns for the expense items table
  const expenseItemsColumns = [
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
      title: "ت",
      dataIndex: "تسلسل",
      align: "center",
    },
    {
      title: "تاريخ",
      dataIndex: "التاريخ",
      align: "center",
    },
    {
      title: "البند",
      dataIndex: "نوع المصروف",
      align: "center",
      render: (text, record) => {
        const displayText = record.children && record.children.length > 0 ? "مستلزمات مكتب" : text;
        return (
          <span
            style={{
              paddingRight: record.isSubExpense ? "20px" : "0",
              color: record.isSubExpense ? "#1890ff" : "inherit",
              display: "flex",
              alignItems: "center",
            }}
          >
            {record.isSubExpense && <span style={{ marginLeft: "8px" }}>↳</span>}
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
        const childrenQuantity = record.children && record.children.length > 0
          ? record.children.reduce((sum, child) => sum + (Number(child["الكمية"]) || 0), 0)
          : 0;
        const totalQuantity = parentQuantity + childrenQuantity;
        return totalQuantity;
      },
    },
    {
      title: "سعر المفرد",
      dataIndex: "السعر",
      align: "center",
      render: (value, record) => {
        if (record.isSubExpense || value === "------") {
          return "------";
        }
    
        const numericVal = Number(value);
        if (isNaN(numericVal)) {
          return "------";
        }
    
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
          ? record.children.reduce((sum, child) => sum + (Number(child.المجموع) || 0), 0)
          : 0;
        const total = parentAmount + childrenAmount;
        return `IQD ${total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
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
          key={`action-${record.id || record.تسلسل}`}
          to="/Expensess-view-daily"
          state={{
            dailyExpenseId: record.id,
            status: expense?.generalInfo?.["الحالة"],
          }}
        >
          <Button type="primary" size="large" loading={isLoadingDetails}>
            عرض
          </Button>
        </Link>
      ),
    },
  ];

  // Get Arabic month display for header
  const getHeaderTitle = () => {
    const officeName = expense?.generalInfo?.["المكتب"];
    const rawDate = expense?.generalInfo?.rawDate;
    
    if (rawDate) {
      const arabicMonth = getArabicMonthDisplay(rawDate);
      return `صرفيات ${officeName} - ${arabicMonth}`;
    }
    
    return `صرفيات ${officeName} بتاريخ ${expense?.generalInfo?.["التاريخ"]}`;
  };

  // Admin Button Component
  const AdminButton = () => {
    if (!hasAdminPermission) return null;

    return (
      <Button
        type="primary"
        style={{ 
          padding: "20px 30px",
          backgroundColor: "#722ed1",
          borderColor: "#722ed1"
        }}
        onClick={handleAdminClick}
        icon={<PlusOutlined />}
      >
        تعديل المصروف (مدير)
      </Button>
    );
  };

  return (
    <>
      <Dashboard />
      <div
        dir="rtl"
        className={`supervisor-expenses-request-page ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}
        style={{ padding: "24px" }}
      >
        <h1 className="expensess-date">
          {getHeaderTitle()}
        </h1>

        {/* Action Buttons */}
        {profile?.position?.toLowerCase()?.includes("supervisor") || 
               profile?.position === "SrController" ? null : (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "20px",
                    width: "100%",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", gap: "10px" }}>
                    <Button
                      type="primary"
                      style={{ padding: "20px 30px" }}
                      onClick={() => handleActionClick("Approval")}
                      disabled={!canApprove}
                    >
                      موافقة
                    </Button>
                    {expense?.generalInfo?.["الحالة"] === "" ? null : (
                      <Button
                        danger
                        type="primary"
                        style={{ padding: "20px 40px" }}
                        onClick={() => handleActionClick("Return")}
                        disabled={!canReturn}
                      >
                        ارجاع
                      </Button>
                    )}
                  </div>
                  
                  {/* Admin Button */}
                  <AdminButton />
                </div>
              )}

        {/* General Details Table */}
        <Table
          className="expense-details-table"
          loading={isLoading}
          columns={[
            {
              title: "اسم المشرف",
              dataIndex: "اسم المشرف",
              align: "center",
            },
            {
              title: "المحافظة",
              dataIndex: "المحافظة",
              align: "center",
            },
            {
              title: "المكتب",
              dataIndex: "المكتب",
              align: "center",
            },
            {
              title: "مبلغ النثرية",
              dataIndex: "مبلغ النثرية",
              align: "center",
              render: (text) => `IQD ${Number(text).toLocaleString()}`,
            },
            {
              title: "مجموع الصرفيات",
              dataIndex: "مجموع الصرفيات",
              align: "center",
              render: (text) => `IQD ${Number(text).toLocaleString()}`,
            },
            {
              title: "المتبقي",
              dataIndex: "المتبقي",
              align: "center",
              render: (text) => `IQD ${Number(text).toLocaleString()}`,
            },
            {
              title: "الحالة",
              dataIndex: "الحالة",
              align: "center",
              render: (status) => {
                const statusCode = typeof status === "string" ? Status[status] : status;
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
          style={{ marginTop: "20px", marginBottom: "20px" }}
        >
          <button
            className="modern-button pdf-button"
            onClick={handlePrint}
            disabled={isPrinting}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 24px",
              borderRadius: "8px",
            }}
          >
            {isPrinting ? (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span className="spinner"></span> جاري التنزيل...
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
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 24px",
              borderRadius: "8px",
            }}
          >
            انشاء ملف Excel
            <Icons type="excel" />
          </button>
        </div>

        <hr />

        {/* Combined Expense Items Table */}
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
              pageSizeOptions: ["5","10","20","50"],
              position: ["bottomCenter"]
            }}
            onChange={(pagination) => {
              handleTableChange(pagination);
            }}
            locale={{ emptyText: "لا توجد عناصر للصرف." }}
            summary={() => {
              const totalExpenses = expense?.generalInfo?.["مجموع الصرفيات"] || 0;
            
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
          footer={[
            <Button key="close" onClick={handleModalClose}>
              إغلاق
            </Button>,
          ]}
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
                      if (record.field === "image" || record.field === "imageUrl")
                        return null;
                      if (record.field === "السعر" || record.field === "المجموع") {
                        return typeof text === "number" ? `IQD${text.toFixed(2)}` : text;
                      }
                      if (record.field === "type") {
                        return text === "daily" ? "مصروف يومي" : "مصروف عادي";
                      }
                      return text;
                    },
                  },
                ]}
                dataSource={Object.entries(selectedItem)
                  .filter(([key]) => !["image", "imageUrl"].includes(key))
                  .map(([key, value]) => ({
                    key,
                    field: key,
                    value: value,
                  }))}
                pagination={false}
                bordered
              />
              {selectedItem.type === "regular" && selectedItem.imageUrl && (
                <div className="image-container" style={{ marginTop: "20px" }}>
                  <p>الصورة:</p>
                  <hr style={{ marginBottom: "10px", marginTop: "10px" }} />
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
            <Button key="cancel" onClick={handleModalCancel}>
              إلغاء
            </Button>,
            <Button key="submit" type="primary" loading={isSubmitting} onClick={handleActionSubmit}>
              تأكيد
            </Button>,
          ]}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="الملاحظات" name="notes" rules={[{ required: true, message: "الرجاء إدخال الملاحظات" }]}>
              <Input.TextArea
                rows={4}
                style={{ minWidth: "460px" }}
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
            <Button key="cancel" onClick={handleAdminCancel}>
              إلغاء
            </Button>,
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
          <Form 
            form={adminForm} 
            layout="vertical"
            style={{ marginTop: "20px" }}
          >
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
              <DatePicker 
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                placeholder="اختر التاريخ"
              />
            </Form.Item>
          </Form>
        </Modal>

        <ExpensessViewActionsTable monthlyExpensesId={expenseId} />
      </div>
    </>
  );
}