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
} from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import "./styles/ExpensessView.css";
import Dashboard from "./../pages/dashBoard.jsx";
import useAuthStore from "./../store/store.js";
import axiosInstance from "./../intercepters/axiosInstance";
import Url from "./../store/url";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Icons from "./../reusable elements/icons.jsx";
import { Link } from "react-router-dom";
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
/*   SentToAccountant: 6,
*/  ReturnedToSupervisor: 7,
  RecievedBySupervisor: 8,
  Completed: 9,
  SentFromDirector:10,
};

const statusMap = {
  [Status.New]: "جديد",
  [Status.SentToProjectCoordinator]: "تم الإرسال إلى منسق المشروع",
  [Status.ReturnedToProjectCoordinator]: "تم الإرجاع إلى منسق المشروع",
  [Status.SentToManager]: "تم الإرسال إلى المدير",
  [Status.ReturnedToManager]: "تم الإرجاع إلى المدير",
  [Status.SentToDirector]: "تم الإرسال إلى المدير التنفيذي",
/*   [Status.SentToAccountant]: "تم الإرسال إلى المحاسب",
*/ 
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

  const getNextStatus = (currentStatus, position) => {
    position = position?.toLowerCase();  // This line exists
  
    if (currentStatus === "SentFromDirector") {
      return Status.RecievedBySupervisor;
    } else if (currentStatus === "SentToProjectCoordinator" ) {
      return Status.SentToManager;
    } else if(currentStatus === "SentToManager" ) {
      return Status.SentToDirector;
    } else if (currentStatus === "SentToDirector" ) {
      return Status.SentFromDirector;
    } else if (currentStatus === "RecievedBySupervisor") {
      return Status.Completed;
    }
  
    console.warn(
      `Unexpected position: ${position} or status: ${currentStatus}`
    );
    return currentStatus; // Default fallback to prevent invalid transitions
  };
  
  const getRejectionStatus = (currentStatus, position) => {
    position = position?.toLowerCase();  // This line exists

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
        console.log('Current Status before update:', currentStatus);
        
        const newStatus = actionType === "Approval"
          ? getNextStatus(currentStatus, profile?.position)
          : getRejectionStatus(currentStatus, profile?.position);
        
        console.log('New Status to be sent:', newStatus);
        console.log('Profile Position:', profile?.position);
        console.log('Action Type:', actionType);
  
        // Dynamic actionType
        const dynamicActionType = actionType === "Approval" 
          ? `تمت الموافقة من ${profile?.position || ""} ${profile?.fullName || ""}`
          : `تم الارجاع من ${profile?.position || ""} ${profile?.fullName || ""}`;    
  
        console.log('Making Actions API call...');
        // Call the Actions endpoint
        const actionResponse = await axiosInstance.post(
          `${Url}/api/Actions`,
          {
            actionType: dynamicActionType,
            notes: actionNote,
            profileId: profile.profileId,
            monthlyExpensesId: expenseId,
          },
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        console.log('Actions API Response:', actionResponse);
  
        console.log('Making Status Update API call...');
        // Update the expense status
        const statusResponse = await axiosInstance.post(
          `${Url}/api/Expense/${expenseId}/status`,
          {
            monthlyExpensesId: expenseId,
            newStatus: newStatus,
          },
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        console.log('Status Update API Response:', statusResponse);
  
        message.success(
          `تم ${actionType === "Approval" ? "الموافقة" : "الإرجاع"} بنجاح`
        );
        handleModalCancel();
        navigate(-1);
      } catch (error) {
        console.error(`Error processing ${actionType}:`, error);
        console.error('Error response:', error.response?.data);  // Log detailed error response
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
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
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



      // If there's an image ID, fetch the image
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

          // Create URL for the image blob
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
  
        // Create an array of all required API calls
        const expensePromise = axiosInstance.get(`${Url}/api/Expense/${expenseId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
  
        const dailyExpensesPromise = axiosInstance.get(`${Url}/api/Expense/${expenseId}/daily-expenses`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
  
        // Wait for both initial requests to complete
        const [expenseResponse, dailyExpensesResponse] = await Promise.all([
          expensePromise,
          dailyExpensesPromise
        ]);
  
        // Only proceed if component is still mounted
        if (!isMounted) return;
  
        // Extract officeId and fetch office budget
        const officeId = expenseResponse.data.officeId;
        const officeResponse = await axiosInstance.get(`${Url}/api/office/${officeId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
  
        if (!isMounted) return;
  
        const officeBudget = officeResponse.data.budget;
  
        // Process regular expense items
        const regularItems = expenseResponse.data.expenseItems?.map((item, index) => ({
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
  
        // Process daily expense items
        const dailyItems = dailyExpensesResponse.data.map((item, index) => ({
          تسلسل: regularItems.length + index + 1,
          التاريخ: new Date(item.expenseDate).toLocaleDateString(),
          "نوع المصروف": item.expenseTypeName,
          الكمية: item.quantity,
          السعر: item.price,
          المجموع: item.amount,
          ملاحظات: item.notes,
          id: item.id,
          type: "daily",
        }));
  
        // Combine and sort all items by date
        const allItems = [...regularItems, ...dailyItems].sort(
          (a, b) => new Date(b.التاريخ) - new Date(a.التاريخ)
        );
  
        // Calculate remaining amount
        const remainingAmount = officeBudget - expenseResponse.data.totalAmount;
  
        if (!isMounted) return;
  
        // Set the final expense state
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
  
    // Call the fetch function
    fetchAllExpenseData();
  
    // Cleanup function to prevent memory leaks and state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [expenseId, accessToken, navigate]);

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
        `IQD ${Number(expense?.generalInfo?.["المتبقي"] || 0).toLocaleString(
          undefined,
          { minimumFractionDigits: 0 }
        )}`,
        `IQD ${Number(
          expense?.generalInfo?.["مجموع الصرفيات"] || 0
        ).toLocaleString(undefined, { minimumFractionDigits: 0 })}`,
        `IQD ${Number(
          expense?.generalInfo?.["مبلغ النثرية"] || 0
        ).toLocaleString(undefined, { minimumFractionDigits: 0 })}`,
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

      // Add Header Row
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
          `IQD ${Number(item["المجموع"] || 0).toLocaleString(undefined, {
            minimumFractionDigits: 0,
          })}`,
          `IQD ${Number(item["السعر"] || 0).toLocaleString(undefined, {
            minimumFractionDigits: 0,
          })}`,
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
        { width: 15 }, // المجموع
        { width: 15 }, // سعر المفرد
        { width: 10 }, // العدد
        { width: 30 }, // البند
        { width: 15 }, // التاريخ
        { width: 10 }, // تسلسل
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), "تقرير_المصروفات.xlsx");
      message.success("تم تصدير التقرير بنجاح");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      message.error("حدث خطأ أثناء تصدير التقرير");
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const element = document.createElement("div");
      element.dir = "rtl";
      element.style.fontFamily = "Arial, sans-serif";
  
      // List of CORS proxies to try
      const proxyUrls = [
        (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
        (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
        (url) => `https://proxy.cors.sh/${url}`,
        (url) => `https://cors-anywhere.herokuapp.com/${url}`
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
                    `https://cdn-oms.scopesky.org${attachment.filePath}`
                ) || [];
  
              // Fetch and convert images to Base64 with proxy
              const imagesWithBase64 = await Promise.all(
                imageUrls.map(async (url) => {
                  try {
                    return await fetchImageWithProxy(url);
                  } catch (error) {
                    console.error(`Failed to fetch image after all proxies: ${url}`);
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
  
      // Build the HTML for the PDF
      element.innerHTML = `
  <div style="padding: 20px; font-family: Arial, sans-serif; border-radius: 12px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); background: #f0f0f0;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="font-size: 24px; color: #000; margin: 0;">تقرير المصاريف</h1>
      <div style="margin-top: 10px; font-size: 16px; color: #555;">التاريخ: ${
        expense?.generalInfo?.["التاريخ"] || ""
      }</div>
    </div>

    <!-- General Info Table -->
    <table style="background: #fff; width: 100%; border-collapse: collapse; margin-bottom: 30px;">
      <thead>
        <tr style="background: linear-gradient(90deg, #FFD700, #FFA500); color: rgb(0, 0, 0);">
          <th style="padding: 12px; text-align: center; font-size: 14px; border: 1px solid #ddd;">اسم المشرف</th>
          <th style="padding: 12px; text-align: center; font-size: 14px; border: 1px solid #ddd;">المحافظة</th>
          <th style="padding: 12px; text-align: center; font-size: 14px; border: 1px solid #ddd;">المكتب</th>
          <th style="padding: 12px; text-align: center; font-size: 14px; border: 1px solid #ddd;">مبلغ النثرية</th>
          <th style="padding: 12px; text-align: center; font-size: 14px; border: 1px solid #ddd;">مجموع الصرفيات</th>
          <th style="padding: 12px; text-align: center; font-size: 14px; border: 1px solid #ddd;">المتبقي</th>
        </tr>
      </thead>
      <tbody>
        <tr style="background: #f9f9f9; color: #000;">
          <td style="padding: 12px; text-align: center; font-size: 14px; border: 1px solid #ddd;">${
            expense?.generalInfo?.["اسم المشرف"] || ""
          }</td>
          <td style="padding: 12px; text-align: center; font-size: 14px; border: 1px solid #ddd;">${
            expense?.generalInfo?.["المحافظة"] || ""
          }</td>
          <td style="padding: 12px; text-align: center; font-size: 14px; border: 1px solid #ddd;">${
            expense?.generalInfo?.["المكتب"] || ""
          }</td>
          <td style="padding: 12px; text-align: center; font-size: 14px; border: 1px solid #ddd;">
  ${
    expense?.generalInfo?.["مبلغ النثرية"]
      ? `IQD ${expense.generalInfo["مبلغ النثرية"].toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}`
      : ""
  }</td>
          <td style="padding: 12px; text-align: center; font-size: 14px; border: 1px solid #ddd;">
  ${
    expense?.generalInfo?.["مجموع الصرفيات"]
      ? `IQD ${expense.generalInfo["مجموع الصرفيات"].toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        })}`
      : ""
  }</td>
          <td style="padding: 12px; text-align: center; font-size: 14px; border: 1px solid #ddd;">
  ${
    expense?.generalInfo?.["المتبقي"]
      ? `IQD ${expense.generalInfo["المتبقي"].toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : ""
  }</td>
        </tr>
      </tbody>
    </table>

    <!-- Expense Items Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background: linear-gradient(90deg, #f44336, #e57373); color: rgb(0, 0, 0);">
          <th style="padding: 12px; text-align: center; font-size: 14px; border: 1px solid #ddd;">ت</th>
          <th style="padding: 12px; text-align: center; font-size: 14px; border: 1px solid #ddd;">تاريخ</th>
          <th style="padding: 12px; text-align: center; font-size: 14px; border: 1px solid #ddd;">البند</th>
          <th style="padding: 12px; text-align: center; font-size: 14px; border: 1px solid #ddd;">العدد</th>
          <th style="padding: 12px; text-align: center; font-size: 14px; border: 1px solid #ddd;">سعر المفرد</th>
          <th style="padding: 12px; text-align: center; font-size: 14px; border: 1px solid #ddd;">المجموع</th>
          <th style="padding: 12px; text-align: center; font-size: 14px; border: 1px solid #ddd;">ملاحظات</th>
        </tr>
      </thead>
      <tbody>
        ${itemsWithImages
          .map(
            (item, index) => `
          <tr style="background: ${
            index % 2 === 0 ? "#f9f9f9" : "#ffffff"
          }; color: #000;">
            <td style="padding: 12px; text-align: center; font-size: 14px; border: 1px solid #ddd;">${
              index + 1
            }</td>
            <td style="padding: 12px; text-align: center; font-size: 14px; border: 1px solid #ddd;">${
              item["التاريخ"] || ""
            }</td>
            <td style="padding: 12px; text-align: center; font-size: 14px; border: 1px solid #ddd;">${
              item["نوع المصروف"] || ""
            }</td>
            <td style="padding: 12px; text-align: center; font-size: 14px; border: 1px solid #ddd;">${
              item["الكمية"] || ""
            }</td>
            <td style="padding: 12px; text-align: center; font-size: 14px; border: 1px solid #ddd;">${
              item["السعر"]
                ? `IQD ${item["السعر"].toLocaleString()}`
                : ""
            }</td>
            <td style="padding: 12px; text-align: center; font-size: 14px; border: 1px solid #ddd;">${
              item["المجموع"]
                ? `IQD ${item["المجموع"].toLocaleString()}`
                : ""
            }</td>
            <td style="padding: 12px; text-align: center; font-size: 14px; border: 1px solid #ddd;">${
              item["ملاحظات"] || ""
            }</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>

    <!-- Images Section -->
    <div style="margin-top: 40px; text-align: center;">
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
        jsPDF: {
          unit: "cm",
          format: "a4",
          orientation: "portrait", // Changed from "landscape" to "portrait"
        }
        
      };
  
      html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error("حدث خطأ أثناء إنشاء ملف PDF");
    }finally {
      setIsPrinting(false); // Reset loading state
    }
  };
  

  
  console.log(expense)

  return (
    <>
      <Dashboard />
      <div
        dir="rtl"
        className={`supervisor-expenses-history-page ${
          isSidebarCollapsed ? "sidebar-collapsed" : ""
        }`}>
        <h1 className="expensess-date">
          صرفيات {expense?.generalInfo?.["المكتب"]} بتاريخ{" "}
          {expense?.generalInfo?.["التاريخ"]}
        </h1>

        {/* Action Buttons */}
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
                // Handle both string and numeric status values
                const statusCode = typeof status === 'string' ? Status[status] : status;
                return statusMap[statusCode] || status;
              },
            },
          ]}
          dataSource={[expense?.generalInfo]}
          bordered
          pagination={false}
          locale={{ emptyText: "لا توجد بيانات" }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "centers",
            marginBottom: "20px",
            gap: "10px",
          }}>
          {/* Export to PDF Button */}
          <div>
      {/* Your existing content... */}
      <button
        className="modern-button pdf-button"
        onClick={handlePrint}
        disabled={isPrinting} // Disable button during loading
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 24px",
          borderRadius: "8px",
        }}
      >
        {isPrinting ? (
          <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="spinner"></span> جاري التنزيل...
          </span>
        ) : (
          <>
            انشاء ملف PDF
            <Icons type="pdf" />
          </>
        )}
      </button>
    </div>

          {/* Export to Excel Button */}
          <button
            className="modern-button excel-button"
            onClick={handleExportToExcel}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 24px",
              borderRadius: "8px",
            }}>
            انشاء ملف Excel
            <Icons type="excel" />
          </button>
        </div>

        <hr />

        {/* Combined Expense Items Table */}
        <ConfigProvider direction="rtl">
          <Table
            className="expense-items-table"
            loading={isLoading}
            columns={[
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
                    minimumFractionDigits: 2,
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
                    }}>
                    <Button type="primary" size="large" loading={isLoadingDetails}>
                      عرض
                    </Button>
                  </Link>
                ),
              }
            ]}
            dataSource={expense?.items}
            bordered={true}

            pagination={{ pageSize: 5, position: ["bottomCenter"] }}
            locale={{ emptyText: "لا توجد عناصر للصرف." }}
            summary={(pageData) => {
              const total = pageData.reduce(
                (sum, item) => sum + item.المجموع,
                0
              );
              return (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={5} align="center">
                      المجموع الكلي
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="center">
                      IQD{" "}
                      {Number(total).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
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
          title={`تفاصيل المصروف ${
            selectedItem?.type === "daily" ? "اليومي" : ""
          }`}
          open={isModalVisible}
          onCancel={handleModalClose}
          footer={[
            <Button key="close" onClick={handleModalClose}>
              إغلاق
            </Button>,
          ]}
          width={800}
          style={{ direction: "rtl" }}>
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
                      if (
                        record.field === "image" ||
                        record.field === "imageUrl"
                      )
                        return null;
                      if (
                        record.field === "السعر" ||
                        record.field === "المجموع"
                      ) {
                        return typeof text === "number"
                          ? `IQD${text.toFixed(2)}`
                          : text;
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
            <Button
              key="submit"
              type={actionType === "Approval" ? "primary" : "primary"}
              loading={isSubmitting}
              onClick={handleActionSubmit}>
              تأكيد
            </Button>,
          ]}>
          <Form form={form} layout="vertical">
            <Form.Item
              label="الملاحظات"
              name="notes"
              rules={[{ required: true, message: "الرجاء إدخال الملاحظات" }]}>
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
