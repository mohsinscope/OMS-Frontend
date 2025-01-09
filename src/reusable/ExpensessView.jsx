// ExpensesView.jsx
import React, { useState } from "react";
import { Table, Empty, Modal, Button, Image } from "antd";
import { useLocation } from "react-router-dom";
import html2pdf from 'html2pdf.js';
import "./styles/ExpensessView.css";
import Dashboard from "./../pages/dashBoard.jsx";
import useAuthStore from "./../store/store.js";

export default function ExpensesView() {
  const { isSidebarCollapsed } = useAuthStore();
  const location = useLocation();
  const expense = location.state?.expense;
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Add show details handler
  const handleShowDetails = (record) => {
    setSelectedItem(record);
    setIsModalVisible(true);
  };

  // Add modal close handler
  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedItem(null);
  };  

  const handlePrint = async () => {
    try {
      const element = document.createElement('div');
      element.dir = 'rtl';
      element.style.fontFamily = 'Arial, sans-serif';
      element.innerHTML = `
        <div style="padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="font-size: 20px; margin: 0; margin-bottom: 5px;">تقرير المصروفات</h1>
            <div style="text-align: left; margin-top: 10px;">التاريخ: ${expense?.generalInfo?.["تاريخ"]}</div>
          </div>
  
          <!-- First Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">الرقم التسلسلي</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">اسم المشرف</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">المحافظة</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">المكتب</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">مبلغ النثرية</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">مجموع الصرفيات</th>
              <th style="border: 1px solid #000; padding: 8px; text-align: center;">الباقي</th>
            </tr>
            <tr>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${expense?.generalInfo?.["الرقم التسلسلي"] || ""}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${expense?.generalInfo?.["اسم المشرف"] || ""}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${expense?.generalInfo?.["المحافظة"] || ""}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${expense?.generalInfo?.["المكتب"] || ""}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${expense?.generalInfo?.["مبلغ النثرية"] ? `IQD${expense.generalInfo["مبلغ النثرية"]}` : ""}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${expense?.generalInfo?.["مجموع الصرفيات"] ? `IQD${expense.generalInfo["مجموع الصرفيات"]}` : ""}</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${expense?.generalInfo?.["الباقي"] ? `IQD${expense.generalInfo["الباقي"]}` : ""}</td>
            </tr>
          </table>
  
          <!-- Second Table -->
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
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item["السعر"] ? `IQD${item["السعر"]}` : ""}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item["المجموع"] ? `IQD${item["المجموع"]}` : item["السعر"] ? `IQD${item["السعر"]}` : ""}</td>
                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${item["ملاحظات"] || ""}</td>
              </tr>
            `).join('')}
          </table>
  
          <!-- Images Section -->
          ${expense?.items?.map(item => 
            item.image ? `
              <div style="margin-top: 20px; text-align: center;">
                <img src="${item.image}" alt="مصروف الصورة" style="max-width: 80%; height: auto; margin-top: 10px;" />
              </div>
            ` : ''
          ).join('')}
        </div>
      `;
  
      const opt = {
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
      alert("حدث خطأ أثناء إنشاء ملف PDF. يرجى المحاولة مرة أخرى.");
    }
  };

  return (
    <>
      <Dashboard />
      <div
        dir="rtl"
        className={`supervisor-expenses-history-page ${
          isSidebarCollapsed ? "sidebar-collapsed" : "supervisor-expenses-history-page"
        }`}
      >
        <h1 className="expensess-date">
          صرفيات {expense?.generalInfo?.["اسم المكتب"]} بتاريخ {expense?.generalInfo?.["التاريخ"]}
        </h1>

        {/* General Details Table */}
        <Table
          className="expense-details-table"
          columns={[
            { 
              title: "الرقم التسلسلي",
              dataIndex: "الرقم التسلسلي",
              align: "center"
            },
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
              title: "عرض",
              key: "action",
              align: "center",
              render: (_, record) => (
                <Button type="link" onClick={() => handleShowDetails(record)}>
                  عرض
                </Button>
              ),
            }
          ]}
          dataSource={[expense?.generalInfo]}
          bordered
          pagination={false}
          locale={{ emptyText: "لا توجد بيانات" }}
        />

        <button className="expenssses-print-button" onClick={handlePrint}>
          طباعة
        </button>

        <hr />

        {/* Expense Items Table */}
        <Table
          className="expense-items-table"
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
              render: (text) => `IQD${text}`
            },
            { 
              title: "المجموع",
              dataIndex: "المجموع",
              align: "center",
              render: (text, record) => `IQD${record.المجموع || record.السعر}`
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
                <Button type="link" onClick={() => handleShowDetails(record)}>
                  عرض
                </Button>
              ),
            }
          ]}
          dataSource={expense?.items}
          bordered
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: "لا توجد عناصر للصرف." }}
        />

        {/* Details Modal */}
        <Modal
          title="تفاصيل المصروف"
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
                  { title: "القيمة", dataIndex: "value", align: "right" }
                ]}
                dataSource={Object.entries(selectedItem).map(([key, value]) => ({
                  key,
                  field: key,
                  value: typeof value === 'number' ? `IQD${value}` : value
                }))}
                pagination={false}
                bordered
              />
              
              {/* Image Display Section */}
              {selectedItem.image ? (
                <div className="image-container" style={{ marginTop: "20px" }}>
                  <p>الصورة:</p>
                  <hr style={{ marginBottom: "10px", marginTop: "10px" }} />
                  <Image
                    src={selectedItem.image}
                    alt="تفاصيل الصورة"
                    style={{ maxWidth: "100%", height: "auto" }}
                  />
                </div>
              ) : (
                <div style={{ marginTop: "20px", textAlign: "center" }}>
                  <p>لا توجد صورة لعرضها</p>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </>
  );
}