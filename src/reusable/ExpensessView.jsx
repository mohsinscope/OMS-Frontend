import React, { useState, useEffect } from "react";
import {
  Table,
  ConfigProvider,
  Modal,
  Button,
  Image,
  message,
  Input,
  Form,
  Skeleton,
  Spin,
  Tooltip,
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
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ExpensessViewActionsTable from "./ExpensessViewActionsTable";

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
  [Status.SentFromDirector]: "تم الموافقة من قبل المدير التنفيذي",
  [Status.Completed]: "مكتمل",
};

export default function ExpensesView() {
  const { isSidebarCollapsed, accessToken, profile } = useAuthStore();
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
  // Check if user is accountant
  const isAccountant = profile?.position?.toLowerCase()?.includes("accontnt");

  // Helper functions for status transitions
  const getNextStatus = (currentStatus, position) => {
    position = position?.toLowerCase();
    if (currentStatus === "SentFromDirector") {
      return Status.RecievedBySupervisor;
    } else if (currentStatus === "SentToProjectCoordinator") {
      return Status.SentToManager;
    } else if (currentStatus === "SentToManager") {
      return Status.SentToDirector;
    } else if (currentStatus === "SentToDirector") {
      return Status.SentFromDirector;
    } else if (currentStatus === "RecievedBySupervisor") {
      return Status.Completed;
    }
    console.warn(`Unexpected position: ${position} or status: ${currentStatus}`);
    return currentStatus;
  };

  const getRejectionStatus = (currentStatus, position) => {
    position = position?.toLowerCase();
    if (position?.includes("coordinator")) {
      return Status.ReturnedToSupervisor;
    } else if (position?.includes("manager")) {
      return Status.ReturnedToProjectCoordinator;
    } else if (position?.includes("director")) {
      return Status.ReturnedToManager;
    }
    return currentStatus;
  };

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
      await form.validateFields();
      if (!profile.profileId) {
        message.error("لم يتم العثور على معلومات المستخدم");
        return;
      }
      try {
        setIsSubmitting(true);
        const currentStatus = expense?.generalInfo?.["الحالة"];
        const newStatus =
          actionType === "Approval"
            ? getNextStatus(currentStatus, profile?.position)
            : getRejectionStatus(currentStatus, profile?.position);
        const dynamicActionType =
          actionType === "Approval"
            ? `تمت الموافقة من ${profile?.position || ""} ${profile?.fullName || ""}`
            : `تم الارجاع من ${profile?.position || ""} ${profile?.fullName || ""}`;
        // Call the Actions endpoint
        await axiosInstance.post(
          `${Url}/api/Actions`,
          {
            actionType: dynamicActionType,
            notes: actionNote,
            profileId: profile.profileId,
            monthlyExpensesId: expenseId,
          },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        // Update the expense status
        await axiosInstance.post(
          `${Url}/api/Expense/${expenseId}/status`,
          { monthlyExpensesId: expenseId, newStatus: newStatus },
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        message.success(
          `تم ${actionType === "Approval" ? "الموافقة" : "الإرجاع"} بنجاح`
        );
        handleModalCancel();
        navigate(-1);
      } catch (error) {
        console.error(`Error processing ${actionType}:`, error);
        message.error(
          `حدث خطأ أثناء ${actionType === "Approval" ? "الموافقة" : "الإرجاع"}`
        );
      } finally {
        setIsSubmitting(false);
      }
    } catch (validationError) {
      console.error("Validation error:", validationError);
    }
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
        // Two parallel API calls: one for general expense info and one for daily expenses
        const expensePromise = axiosInstance.get(`${Url}/api/Expense/${expenseId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const dailyExpensesPromise = axiosInstance.get(
          `${Url}/api/Expense/${expenseId}/daily-expenses`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const [expenseResponse, dailyExpensesResponse] = await Promise.all([
          expensePromise,
          dailyExpensesPromise,
        ]);
        if (!isMounted) return;
        // Fetch office budget using officeId from expenseResponse
        const officeId = expenseResponse.data.officeId;
        const officeResponse = await axiosInstance.get(`${Url}/api/office/${officeId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const officeBudget = officeResponse.data.budget;
        // Process regular expense items (if any)
        const regularItems =
          expenseResponse.data.expenseItems?.map((item, index) => ({
            تسلسل: index + 1,
            التاريخ: new Date(item.date).toLocaleDateString(),
            "نوع المصروف": item.description,
            الكمية: item.quantity,
            السعر: item.unitPrice,
            المجموع: item.totalAmount,
            ملاحظات: item.notes,
            image: item.receiptImage,
            type: "regular",
          })) || [];
        // Process daily expense items and include sub-expenses (if available)
        const dailyItems = dailyExpensesResponse.data.map((item, index) => {
          const mainItem = {
            تسلسل: regularItems.length + index + 1,
            التاريخ: new Date(item.expenseDate).toLocaleDateString(),
            "نوع المصروف": item.expenseTypeName,
            الكمية: item.quantity,
            السعر: item.price,
            المجموع: item.amount,
            ملاحظات: item.notes,
            id: item.id,
            type: "daily",
          };
          if (item.subExpenses && item.subExpenses.length > 0) {
            mainItem.children = item.subExpenses.map((sub, subIndex) => ({
              تسلسل: `${regularItems.length + index + 1}.${subIndex + 1}`,
              التاريخ: new Date(sub.expenseDate).toLocaleDateString(),
              "نوع المصروف": sub.expenseTypeName,
              الكمية: sub.quantity,
              السعر: sub.price,
              المجموع: sub.amount,
              ملاحظات: sub.notes,
              id: sub.id,
              type: "sub-daily",
              isSubExpense: true,
              parentId: item.id,
            }));
          }
          return mainItem;
        });
        // Combine and sort all items by date (descending)
        const allItems = [...regularItems, ...dailyItems].sort(
          (a, b) => new Date(b.التاريخ) - new Date(a.التاريخ)
        );
        // Calculate remaining amount
        const remainingAmount = officeBudget - expenseResponse.data.totalAmount;
        if (!isMounted) return;
        setExpense({
          generalInfo: {
            "الرقم التسلسلي": expenseResponse.data.id,
            "اسم المشرف": expenseResponse.data.profileFullName,
            المحافظة: expenseResponse.data.governorateName,
            المكتب: expenseResponse.data.officeName,
            "مبلغ النثرية": officeBudget,
            "مجموع الصرفيات": expenseResponse.data.totalAmount,
            المتبقي: remainingAmount,
            التاريخ: new Date(expenseResponse.data.dateCreated).toLocaleDateString(),
            الحالة: expenseResponse.data.status,
          },
          items: allItems,
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
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("تقرير المصاريف", {
        properties: { rtl: true },
      });
      // Add Supervisor Info Row
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
        `IQD ${Number(expense?.generalInfo?.["المتبقي"] || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}`,
        `IQD ${Number(expense?.generalInfo?.["مجموع الصرفيات"] || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}`,
        `IQD ${Number(expense?.generalInfo?.["مبلغ النثرية"] || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}`,
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
      // Add Header Row for expense items
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
      // Add Data Rows
      expense?.items?.forEach((item, index) => {
        const row = worksheet.addRow([
          item["ملاحظات"] || "",
          `IQD ${Number(item["المجموع"] || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}`,
          `IQD ${Number(item["السعر"] || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}`,
          item["الكمية"] || "",
          item["نوع المصروف"] || "",
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
      // Set Column Widths
      worksheet.columns = [
        { width: 30 }, // ملاحظات
        { width: 30 }, // المجموع
        { width: 30 }, // سعر المفرد
        { width: 30 }, // العدد
        { width: 30 }, // البند
        { width: 25 }, // التاريخ
        { width: 20 }, // تسلسل
      ];
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), "تقرير_المصروفات.xlsx");
      message.success("تم تصدير التقرير بنجاح");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      message.error("حدث خطأ أثناء تصدير التقرير");
    }
  };

  // Function to generate and download a PDF file using html2pdf.js
  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const element = document.createElement("div");
      element.dir = "rtl";
      element.style.fontFamily = "Arial, sans-serif";
      // (For brevity, the HTML content below is a sample.
      // You can modify it to include your complete report content.)
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
                <td>${expense?.generalInfo?.["مبلغ النثرية"] || ""}</td>
                <td>${expense?.generalInfo?.["مجموع الصرفيات"] || ""}</td>
                <td>${expense?.generalInfo?.["المتبقي"] || ""}</td>
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
              ${expense?.items
                ?.map(
                  (item, index) => `
                <tr>
                  <td>${item.تسلسل}</td>
                  <td>${item.التاريخ}</td>
                  <td>${item.isSubExpense ? "↳ " : ""}${item["نوع المصروف"]}</td>
                  <td>${item["الكمية"]}</td>
                  <td>${item["السعر"]}</td>
                  <td>${item["المجموع"]}</td>
                  <td>${item["ملاحظات"]}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
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
      html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error("حدث خطأ أثناء إنشاء ملف PDF");
    } finally {
      setIsPrinting(false);
    }
  };

  // Define columns for the expense items table with expandable rows for sub-expenses
  const expenseItemsColumns = [
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
      render: (text, record) => (
        <span
          style={{
            paddingRight: record.isSubExpense ? "20px" : "0",
            color: record.isSubExpense ? "#1890ff" : "inherit",
            display: "flex",
            alignItems: "center",
          }}
        >
          {record.isSubExpense && <span style={{ marginLeft: "8px" }}>↳</span>}
          {text}
        </span>
      ),
    },
    {
      title: "العدد",
      dataIndex: "الكمية",
      align: "center",
    },
    {
      title: "سعر المفرد",
      dataIndex: "السعر",
      align: "center",
      render: (text) =>
        `IQD ${Number(text).toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}`,
    },
    {
      title: "المجموع",
      dataIndex: "المجموع",
      align: "center",
      render: (text) =>
        `IQD ${Number(text).toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}`,
    },
    {
      title: "ملاحظات",
      dataIndex: "ملاحظات",
      align: "center",
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

  console.log(expense);

  return (
    <>
      <Dashboard />
      <div
        dir="rtl"
        className={`supervisor-expenses-request-page ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}
        style={{ padding: "24px" }}
      >
        <h1 className="expensess-date">
          صرفيات {expense?.generalInfo?.["المكتب"]} بتاريخ{" "}
          {expense?.generalInfo?.["التاريخ"]}
        </h1>

        {/* Action Buttons */}
        {profile?.position?.toLowerCase()?.includes("supervisor") ? null : (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "20px",
              width: "100%",
            }}
          >
            <Button
              type="primary"
              style={{ padding: "20px 30px" }}
              onClick={() => handleActionClick("Approval")}
              disabled={
                !profile.profileId ||
                expense?.generalInfo?.["الحالة"] === Status.Completed
              }
            >
              موافقة
            </Button>
            {expense?.generalInfo?.["الحالة"] === "SentFromDirector" ? null : (
              <Button
                danger
                type="primary"
                style={{ padding: "20px 40px" }}
                onClick={() => handleActionClick("Return")}
                disabled={!profile.profileId}
              >
                ارجاع
              </Button>
            )}
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

        {/* Combined Expense Items Table with expandable rows for sub-expenses */}
        <ConfigProvider direction="rtl">
          <Table
            className="expense-items-table"
            loading={isLoading}
            columns={expenseItemsColumns}
            dataSource={expense?.items}
            bordered
            pagination={{ pageSize: 5, position: ["bottomCenter"] }}
            locale={{ emptyText: "لا توجد عناصر للصرف." }}
            expandable={{ defaultExpandAllRows: true, expandRowByClick: true }}
            summary={(pageData) => {
              const total = pageData.reduce((sum, item) => sum + item.المجموع, 0);
              return (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={5} align="center">
                      المجموع الكلي
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="center">
                      IQD{" "}
                      {Number(total).toLocaleString(undefined, {
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

        <ExpensessViewActionsTable monthlyExpensesId={expenseId} />
      </div>
    </>
  );
}
