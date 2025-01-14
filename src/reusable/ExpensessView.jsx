import React, { useState, useEffect } from "react";
import { Table, Empty, Modal, Button, Image, message, Input, Form } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import html2pdf from 'html2pdf.js';
import "./styles/ExpensessView.css";
import Dashboard from "./../pages/dashBoard.jsx";
import useAuthStore from "./../store/store.js";
import axiosInstance from "./../intercepters/axiosInstance";
import Url from "./../store/url";

// Status Enum
const Status = {
  New: 0,
  SentToProjectCoordinator: 1,
  ReturnedToProjectCoordinator: 2,
  SentToManager: 3,
  ReturnedToManager: 4,
  SentToDirector: 5,
  SentToAccountant: 6,
  ReturnedToSupervisor: 7,
  RecievedBySupervisor: 8,
  Completed: 9
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

  const getNextStatus = () => {
    const position = profile?.position?.toLowerCase();
    
    if (position?.includes('coordinator')) {
      return Status.SentToManager;
    } else if (position?.includes('manager')) {
      return Status.SentToDirector;
    } else if (position?.includes('director')) {
      return Status.SentToAccountant;
    } else if (position?.includes('accountant')) {
      return Status.Completed;
    }
    return Status.New;
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
        
        // Submit the action
        await axiosInstance.post(`${Url}/api/Actions`, {
          actionType: actionType,
          notes: actionNote,
          profileId: profile.profileId,
          monthlyExpensesId: expenseId
        }, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        // Update status if approval
        if (actionType === "Approval") {
          const nextStatus = getNextStatus();
          await axiosInstance.post(`${Url}/api/Expense/${expenseId}/status`, {
            monthlyExpensesId: expenseId,
            newStatus: nextStatus
          }, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
        }
        
        message.success(`تم ${actionType === "Approval" ? "الموافقة" : "الإرجاع"} بنجاح`);
        handleModalCancel();
        navigate('/expenses-history');
      } catch (error) {
        console.error(`Error processing ${actionType}:`, error);
        message.error(`حدث خطأ أثناء ${actionType === "Approval" ? "الموافقة" : "الإرجاع"}`);
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
      const response = await axiosInstance.get(`${Url}/api/Expense/dailyexpenses/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
  
      // Map the response data to match the expected structure
      return {
        تسلسل: "-", // Sequence is not provided in the response, defaulted to "-"
        التاريخ: new Date(response.data.expenseDate).toLocaleDateString(), // Convert expenseDate to localized format
        "نوع المصروف": response.data.expenseTypeName, // Use expenseTypeName
        الكمية: response.data.quantity, // Use quantity
        السعر: response.data.price, // Use price
        المجموع: response.data.amount, // Use amount
        ملاحظات: response.data.notes, // Use notes
        id: response.data.id, // Use id
        type: "daily", // Mark as daily type
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
    if (record.type === 'daily') {
      const details = await fetchDailyExpenseDetails(record.id);
      if (details) {
        setSelectedItem(details);
        setIsModalVisible(true);
      }
    } else {
      setSelectedItem(record);
      setIsModalVisible(true);
    }
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedItem(null);
  };

  useEffect(() => {
    const fetchAllExpenseData = async () => {
      if (!expenseId) {
        message.error("لم يتم العثور على معرف المصروف");
        navigate('/expenses-history');
        return;
      }
    
      try {
        setIsLoading(true);
    
        const [expenseResponse, dailyExpensesResponse] = await Promise.all([
          axiosInstance.get(`${Url}/api/Expense/${expenseId}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axiosInstance.get(`${Url}/api/Expense/${expenseId}/daily-expenses`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);
    
        console.log("Expense Response:", expenseResponse.data);
        console.log("Daily Expenses Response:", dailyExpensesResponse.data);
    
        const dailyExpenses = Array.isArray(dailyExpensesResponse.data) 
        ? dailyExpensesResponse.data 
        : dailyExpensesResponse.data.dailyExpenses || [];
              console.log("Processed Daily Expenses:", dailyExpenses);
    
        const regularItems = expenseResponse.data.expenseItems?.map((item, index) => ({
          تسلسل: index + 1,
          التاريخ: new Date(item.date).toLocaleDateString(),
          "نوع المصروف": item.description,
          الكمية: item.quantity,
          السعر: item.unitPrice,
          المجموع: item.totalAmount,
          ملاحظات: item.notes,
          image: item.receiptImage,
          type: 'regular',
        })) || [];
    
        console.log("Processed Regular Items:", regularItems);
    
        const dailyItems = dailyExpensesResponse.data.map((item, index) => ({
          تسلسل: index + 1, // Sequential number
          التاريخ: new Date(item.expenseDate).toLocaleDateString(), // Convert expenseDate to a readable date
          "نوع المصروف": item.expenseTypeName, // Map expenseTypeName
          الكمية: item.quantity, // Map quantity
          السعر: item.price, // Map price
          المجموع: item.amount, // Map amount
          ملاحظات: item.notes, // Map notes
          id: item.id, // Map ID
          type: 'daily', // Assign type as 'daily'
        }));
        console.log("Mapped Daily Items:", dailyItems);
        
    
        const allItems = [...regularItems, ...dailyItems].sort(
          (a, b) => new Date(b.التاريخ) - new Date(a.التاريخ),
        );
    
        console.log("Final Items:", allItems);
    
        setExpense({
          generalInfo: {
            "الرقم التسلسلي": expenseResponse.data.id,
            "اسم المشرف": expenseResponse.data.profileFullName,
            "المحافظة": expenseResponse.data.governorateName,
            "المكتب": expenseResponse.data.officeName,
            "مبلغ النثرية": expenseResponse.data.totalAmount,
            "مجموع الصرفيات": expenseResponse.data.totalAmount,
            "الباقي": 0,
            "التاريخ": new Date(expenseResponse.data.dateCreated).toLocaleDateString(),
            "الحالة": expenseResponse.data.status,
          },
          items: allItems,
        });
        console.log("Updated Expense State:", allItems);
      } catch (error) {
        console.error("Error fetching expense data:", error);
        message.error("حدث خطأ أثناء جلب البيانات");
        navigate('/expenses-history');
      } finally {
        setIsLoading(false);
      }
    };
    
    

    fetchAllExpenseData();
  }, [expenseId, accessToken, navigate]);

  const handlePrint = async () => {
    try {
      const element = document.createElement('div');
      element.dir = 'rtl';
      element.style.fontFamily = 'Arial, sans-serif';
      element.innerHTML = `
        <div style="padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="font-size: 20px; margin: 0; margin-bottom: 5px;">تقرير المصروفات</h1>
            <div style="text-align: left; margin-top: 10px;">التاريخ: ${expense?.generalInfo?.["التاريخ"]}</div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">اسم المشرف</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">المحافظة</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">المكتب</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">مبلغ النثرية</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">مجموع الصرفيات</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">الباقي</th>
            </tr>
            <tr>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${expense?.generalInfo?.["اسم المشرف"] || ""}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${expense?.generalInfo?.["المحافظة"] || ""}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${expense?.generalInfo?.["المكتب"] || ""}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${expense?.generalInfo?.["مبلغ النثرية"] ? `IQD${expense.generalInfo["مبلغ النثرية"]}` : ""}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${expense?.generalInfo?.["مجموع الصرفيات"] ? `IQD${expense.generalInfo["مجموع الصرفيات"]}` : ""}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${expense?.generalInfo?.["الباقي"] ? `IQD${expense.generalInfo["الباقي"]}` : ""}</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">ت</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">تاريخ</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">البند</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">العدد</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">سعر المفرد</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">المجموع</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">ملاحظات</th>
            </tr>
            ${expense?.items?.map(item => `
              <tr>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item["تسلسل"] || ""}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item["التاريخ"] || ""}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item["نوع المصروف"] || ""}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item["الكمية"] || ""}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item["السعر"] ? `IQD${typeof item["السعر"] === 'number' ? item["السعر"].toFixed(2) : item["السعر"]}` : ""}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item["المجموع"] ? `IQD${typeof item["المجموع"] === 'number' ? item["المجموع"].toFixed(2) : item["المجموع"]}` : ""}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item["ملاحظات"] || ""}</td>
              </tr>
            `).join('')}
          </table>

          ${expense?.items?.filter(item => item.type === 'regular' && item.image)?.map(item => `
            <div style="margin-top: 20px; text-align: center;">
              <img src="${item.image}" alt="مصروف الصورة" style="max-width: 80%; height: auto; margin-top: 10px;" />
            </div>
          `).join('')}
        </div>
      `;const opt = {
        margin: 1,
        filename: 'تقرير_المصروفات.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true
        },
        jsPDF: { 
          unit: 'cm', 
          format: 'a4', 
          orientation: 'portrait'
        }
      };

      html2pdf().from(element).set(opt).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
      message.error("حدث خطأ أثناء إنشاء ملف PDF");
    }
  };

  return (
    <>
      <Dashboard />
      <div
        dir="rtl"
        className={`supervisor-expenses-history-page ${
          isSidebarCollapsed ? "sidebar-collapsed" : ""
        }`}
      >
        <h1 className="expensess-date">
          صرفيات {expense?.generalInfo?.["المكتب"]} بتاريخ {expense?.generalInfo?.["التاريخ"]}
        </h1>

        {/* Action Buttons */}
        <div style={{display:"flex", justifyContent:"space-between", marginBottom: "20px"}}>
          <Button 
            type="primary"
            onClick={() => handleActionClick("Approval")}
            disabled={!profile.profileId}
          >
            موافقة
          </Button>
          <Button 
            danger
            onClick={() => handleActionClick("Return")}
            disabled={!profile.profileId}
          >
            ارجاع
          </Button>
        </div>

        {/* General Details Table */}
        <Table
          className="expense-details-table"
          loading={isLoading}
          columns={[
            { 
              title: "اسم المشرف",
              dataIndex: "اسم المشرف",
              align: "center"
            },
            { 
              title: "المحافظة",
              dataIndex: "المحافظة",
              align: "center"
            },
            { 
              title: "المكتب",
              dataIndex: "المكتب",
              align: "center"
            },
            { 
              title: "مبلغ النثرية",
              dataIndex: "مبلغ النثرية",
              align: "center",
              render: (text) => `IQD${text}`
            },
            { 
              title: "مجموع الصرفيات",
              dataIndex: "مجموع الصرفيات",
              align: "center",
              render: (text) => `IQD${text}`
            },
            { 
              title: "الباقي",
              dataIndex: "الباقي",
              align: "center",
              render: (text) => `IQD${text}`
            },
            {
              title: "الحالة",
              dataIndex: "الحالة",
              align: "center"
            }
          ]}
          dataSource={[expense?.generalInfo]}
          bordered
          pagination={false}
          locale={{ emptyText: "لا توجد بيانات" }}
        />

        <Button className="expenssses-print-button" onClick={handlePrint}>
          طباعة
        </Button>

        <hr />

        {/* Combined Expense Items Table */}
        <Table
          className="expense-items-table"
          loading={isLoading}
          columns={[
            { 
              title: "ت",
              dataIndex: "تسلسل",
              align: "center"
            },
            { 
              title: "تاريخ",
              dataIndex: "التاريخ",
              align: "center"
            },
            { 
              title: "البند",
              dataIndex: "نوع المصروف",
              align: "center"
            },
            { 
              title: "العدد",
              dataIndex: "الكمية",
              align: "center"
            },
            { 
              title: "سعر المفرد",
              dataIndex: "السعر",
              align: "center",
              render: (text) => `IQD${typeof text === 'number' ? text.toFixed(2) : text}`
            },
            { 
              title: "المجموع",
              dataIndex: "المجموع",
              align: "center",
              render: (text) => `IQD${typeof text === 'number' ? text.toFixed(2) : text}`
            },
            { 
              title: "ملاحظات",
              dataIndex: "ملاحظات",
              align: "center"
            },
            {
              title: "عرض",
              key: "action",
              align: "center",
              render: (_, record) => (
                <Button 
                  type="link" 
                  onClick={() => handleShowDetails(record)}
                  loading={isLoadingDetails}
                >
                  عرض
                </Button>
              ),
            }
          ]}
          dataSource={expense?.items}
          bordered
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: "لا توجد عناصر للصرف." }}
          summary={(pageData) => {
            const total = pageData.reduce((sum, item) => sum + item.المجموع, 0);
            return (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5} align="center">
                    المجموع الكلي
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="center">
                    IQD{total.toFixed(2)}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} colSpan={2} />
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />

        {/* Details Modal */}
        <Modal
          title={`تفاصيل المصروف ${selectedItem?.type === 'daily' ? 'اليومي' : ''}`}
          open={isModalVisible}
          onCancel={handleModalClose}
          footer={[
            <Button key="close" onClick={handleModalClose}>
              إغلاق
            </Button>
          ]}
          width={800}
          style={{ direction: 'rtl' }}
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
                      if (record.field === "image") return null;
                      if (record.field === "السعر" || record.field === "المجموع") {
                        return typeof text === 'number' ? `IQD${text.toFixed(2)}` : text;
                      }
                      if (record.field === "type") {
                        return text === 'daily' ? "مصروف يومي" : "مصروف عادي";
                      }
                      return text;
                    }
                  }
                ]}
                dataSource={Object.entries(selectedItem)
                  .filter(([key]) => !['image', 'id'].includes(key))
                  .map(([key, value]) => ({
                    key,
                    field: key,
                    value: value
                  }))}
                pagination={false}
                bordered
              />
              
              {selectedItem.type === 'regular' && selectedItem.image && (
                <div className="image-container" style={{ marginTop: "20px" }}>
                  <p>الصورة:</p>
                  <hr style={{ marginBottom: "10px", marginTop: "10px" }} />
                  <Image
                    src={selectedItem.image}
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
          title={actionType === "Approval" ? "تأكيد الموافقة" : "تأكيد الإرجاع"}
          open={actionModalVisible}
          onCancel={handleModalCancel}
          footer={[
            <Button key="cancel" onClick={handleModalCancel}>
              إلغاء
            </Button>,
            <Button
              key="submit"
              type={actionType === "Approval" ? "primary" : "danger"}
              loading={isSubmitting}
              onClick={handleActionSubmit}
            >
              تأكيد
            </Button>
          ]}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label="الملاحظات"
              name="notes"
              rules={[{ required: true, message: 'الرجاء إدخال الملاحظات' }]}
            >
              <Input.TextArea
                rows={4}
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="أدخل الملاحظات هنا..."
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </>
  );
}