import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Table, Button, Modal, Image, Empty, ConfigProvider } from "antd"; // Importing components from Ant Design
import "./styles/ExpensessView.css";
import Dashboard from "./../pages/dashBoard.jsx";
import useAuthStore from './../store/store.js';
export default function ExpensessView() {
  const { isSidebarCollapsed } = useAuthStore(); // Access sidebar collapse state


  // Fetch data passed from the previous page
  const location = useLocation();
  const expense = location.state?.expense; // Access the expense object from state

  const [selectedItem, setSelectedItem] = useState(null); // For showing item details
  const [isModalVisible, setIsModalVisible] = useState(false); // For modal visibility

  // Return Empty component if no data is passed
  if (!expense) {
    return <Empty description="لا توجد تفاصيل لعرضها. تأكد من تمرير البيانات بشكل صحيح." />;
  }

  // Table columns for general details
  const generalColumns = [
    {
      title: "الكلفة الكلية",
      dataIndex: "الكلفة الكلية",
      key: "الكلفة الكلية",
      align: "center",
    },
    {
      title: "اسم المكتب",
      dataIndex: "اسم المكتب",
      key: "اسم المكتب",
      align: "center",
    },
    {
      title: "المحافظة",
      dataIndex: "المحافظة",
      key: "المحافظة",
      align: "center",
    },
    {
      title: "اسم المشرف",
      dataIndex: "اسم المشرف",
      key: "اسم المشرف",
      align: "center",
    },
    {
      title: "الرقم التسلسلي",
      dataIndex: "الرقم التسلسلي",
      key: "الرقم التسلسلي",
      align: "center",
    },
  ];

  // General details table data
  const generalData = [expense.generalInfo]; // Use generalInfo from the passed expense

  // Table columns for expense items
  const itemColumns = [
    ,
    {
      title: "نوع المصروف",
      dataIndex: "نوع المصروف",
      key: "نوع المصروف",
      align: "center",
    },
    {
      title: "الكمية",
      dataIndex: "الكمية",
      key: "الكمية",
      align: "center",
    },
    {
      title: "السعر",
      dataIndex: "السعر",
      key: "السعر",
      align: "center",
    },
    {
      title: "التاريخ",
      dataIndex: "التاريخ",
      key: "التاريخ",
      align: "center",
    }, {
      title: "عرض",
      key: "عرض",
      align: "center",
      render: (_, record) => (
        <Button
        className="expensses-view-button"
          type="primary"
          onClick={() => {
            setSelectedItem(record); // Set selected item
            setIsModalVisible(true); // Show modal
          }}
        >
          عرض
        </Button>
      ),
    }
  ];

  // Expense items table data
  const itemData = expense.items || []; // Use items from the passed expense

  return (
    <>
      <Dashboard />
      <div dir="rtl"
        className={`supervisor-expenses-history-page ${isSidebarCollapsed
          ? "sidebar-collapsed"
          : "supervisor-expenses-history-page"
          }`}>
        <h1 className="expensess-date">{`التاريخ: ${expense.generalInfo["التاريخ"] || "غير متوفر"}`}</h1>

        {/* General Details Table */}
        <Table
          className="expense-details-table"
          columns={generalColumns}
          dataSource={generalData}
          bordered
          pagination={false}
          locale={{ emptyText: "لا توجد بيانات" }}
        />

        <button className="expenssses-print-button">طباعة</button>
        <hr />

        {/* Expense Items Table */}
        <Table
          className="expense-items-table"
          columns={itemColumns}
          dataSource={itemData}
          bordered
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: "لا توجد عناصر للصرف." }}
        />

        {/* Modal for Item Details */}
        <div >
                  <ConfigProvider direction="rtl">
          <Modal
            width={1500}
            height={300}
            title="تفاصيل المصروف"
            visible={isModalVisible}
            onCancel={() => setIsModalVisible(false)}
            footer={[
              <Button key="close" onClick={() => setIsModalVisible(false)}>
                الخروج
              </Button>,
            ]}
          >
            {selectedItem ? (
              <><div className="ExpensessView-modal-container">
                <div >
                  <div className="input-expenses-view-page-warp-container">
                    <label>نوع المصروف</label>
                    <input type="text" disabled placeholder={`${selectedItem["نوع المصروف"] || "غير متوفر"}`} />
                    <label>السعر</label>
                    <input type="text" disabled placeholder={`${selectedItem["السعر"] || "غير متوفر"}`} />
                  </div>
                  <div className="input-expenses-view-page-warp-container">
                    <label>الكمية</label>
                    <input type="text" disabled placeholder={`${selectedItem["الكمية"] || "غير متوفر"}`} />
                    
                    <label>التاريخ</label>
                    <input type="text" disabled placeholder={`${selectedItem["التاريخ"] || "غير متوفر"}`} />
                  

                  </div>

                </div>
                {selectedItem.image ? (
                  <div className="image-container">
                    <p>الصورة:</p>
                    <hr style={{marginBottom:"10px",marginTop:"10px"}} />
                    <Image
                      src={selectedItem.image}
                      alt="تفاصيل الصورة"
                      style={{ maxWidth: "100%", height: "auto" }}
                    />
                  </div>
                ) : (
                  <p>لا توجد صورة لعرضها</p>
                )}
             </div> </>
            ) : (
              <p>لا توجد بيانات لعرضها</p>
            )}
          </Modal></ConfigProvider>
        </div>

      </div>
    </>
  );
}
