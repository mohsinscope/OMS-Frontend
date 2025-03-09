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
import { PlusOutlined } from "@ant-design/icons";

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
  
    if (currentStatus === "SentFromDirector" && position?.includes("projectcoordinator")) {
      return Status.RecievedBySupervisor;
    } else if (currentStatus === "SentToProjectCoordinator" && position?.includes("projectcoordinator")) {
      return Status.SentToManager;
    } else if (currentStatus === "ReturnedToProjectCoordinator" && position?.includes("projectcoordinator")) {
      return Status.SentToManager;
    } else if (currentStatus === "SentToManager" && position?.includes("manager")) {
      return Status.SentToDirector;
    } else if (currentStatus === "ReturnedToManager" && position?.includes("manager")) {
      return Status.SentToDirector;
    } else if (currentStatus === "SentToDirector" && position?.includes("director")) {
      return Status.SentFromDirector;
    } else if (currentStatus === "RecievedBySupervisor") {
      return Status.Completed;
    }
  
    console.warn(`Unexpected position: ${position} or status: ${currentStatus}`);
    return currentStatus;
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
    else if (currentStatus === "SentToDirector" && position?.includes("director"))  {
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
          const mainItem = {
            key: `daily-${item.id}`,
            تسلسل: regularItems.length + index + 1,
            التاريخ: new Date(item.expenseDate).toLocaleDateString(),
            "نوع المصروف": item.expenseTypeName,
            الكمية: item.quantity,
            السعر: item.price,
            المجموع: item.amount,
            ملاحظات: item.notes,
            id: item.id,
            type: "daily",
            isSubExpense: false,
          };
  
          if (item.subExpenses && item.subExpenses.length > 0) {
            mainItem.children = item.subExpenses.map((sub, subIndex) => ({
              key: `subexpense-${sub.id}`,
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
            }));
          }
  
          return mainItem;
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
            // Use our computed finalTotal
            "مجموع الصرفيات": finalTotal,
            // Use our computed remaining
            المتبقي: remainingAmount,
            التاريخ: new Date(expenseResponse.data.dateCreated).toLocaleDateString(),
            الحالة: expenseResponse.data.status,
          },
          items: allItems, // keep hierarchical for the table
          flattenedItems: flattenedAllItems, // for PDF/Excel usage
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
  
      worksheet.addRow([]); // empty row
  
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
  
      // Capture the starting row number for the flattened items
      const itemsStartRow = headerRow.number + 1;
  
      // 3) Insert each flattened item as a row with correct numbering
      let mainIndex = 0;
      let subIndex = 0;
      let lastMainIndex = 0;
  
      flattened.forEach((item, index) => {
        if (!item.isSubExpense) {
          // It's a main expense
          mainIndex++;
          subIndex = 0;
          lastMainIndex = mainIndex;
        } else {
          // It's a sub-expense
          subIndex++;
        }
        // If you need 1 and 1.1 indexing use this
        // const rowIndex = item.isSubExpense ? `${lastMainIndex}.${subIndex}` : mainIndex;
  
        const row = worksheet.addRow([
          item["ملاحظات"] || "",
          Number(item["المجموع"] || 0),
          Number(item["السعر"] || 0),
          item["الكمية"] || "",
          (item.isSubExpense ? "↲ " : "") + item["نوع المصروف"],
          item["التاريخ"] || "",
          // rowIndex,
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
          // Alternate row color
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: index % 2 === 0 ? "FFF5F5F5" : "FFFFFFFF" },
          };
        });
      });
  
      // 4) Add a summary row under the table
      const summaryRowIndex = worksheet.lastRow.number + 1;
      const summaryRow = worksheet.addRow([]);
      // Place the label in the first cell (you can change this as needed)
      summaryRow.getCell(1).value = "المجموع الكامل للصرفيات";
      // In the next cell (column B), add the formula to sum the "المجموع" column.
      // Adjust the range based on your table rows.
      summaryRow.getCell(2).value = {
        formula: `SUM(B${itemsStartRow}:B${worksheet.lastRow.number - 1})`,
        result: 0,
      };
  
      // Style the summary row cells
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
  
      // 5) Set column widths
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
        .replace(/\//g, "-"); // Format: YYYY-MM-DD
      const fileName = `تقرير_المصاريف_${formattedDate}.xlsx`;
      // 6) Output the file
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
    // List of CORS proxies to try
    const proxyUrls = [
      (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
      (url) =>
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      (url) => `https://proxy.cors.sh/${url}`,
      (url) => `https://cors-anywhere.herokuapp.com/${url}`,
    ];
    // Try each proxy until one works
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
              const base64String = canvas.toDataURL("image/jpeg", 0.8); // Reduced quality for better performance
              resolve(base64String);
            } catch (error) {
              console.warn(`Proxy ${proxyIndex + 1} failed, trying next...`);
              resolve(fetchImageWithProxy(url, proxyIndex + 1));
            }
          };
          img.onerror = () => {
            console.warn(`Proxy ${proxyIndex + 1} failed, trying next...`);
            resolve(fetchImageWithProxy(url, proxyIndex + 1));
          };
          img.src = proxyUrl;
        });
      } catch (error) {
        console.warn(`Proxy ${proxyIndex + 1} failed, trying next...`);
        return fetchImageWithProxy(url, proxyIndex + 1);
      }
    };
    // Fetch images for daily expenses
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
            // Fetch and convert images to Base64 with proxy
            const imagesWithBase64 = await Promise.all(
              imageUrls.map(async (url) => {
                try {
                  return await fetchImageWithProxy(url);
                } catch (error) {
                  console.error(
                    `Failed to fetch image after all proxies: ${url}`
                  );
                  return null;
                }
              })
            );
            return { ...item, images: imagesWithBase64.filter(Boolean) };
          } catch (error) {
            console.error(
              `Error fetching images for daily expense ${item.id}:`,
              error
            );
            return { ...item, images: [] };
          }
        });
      return Promise.all(imagePromises);
    };
    // Get items with images
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
      <!-- Images Section -->
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
  // Define columns for the expense items table with expandable rows for sub-expenses
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
    rowKey="key"
    className="expense-items-table"
    loading={isLoading}
    columns={expenseItemsColumns}
    dataSource={expense?.items}
    bordered
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
    pagination={{ pageSize: 5, position: ["bottomCenter"] }}
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

        <ExpensessViewActionsTable monthlyExpensesId={expenseId} />
      </div>
    </>
  );
}
