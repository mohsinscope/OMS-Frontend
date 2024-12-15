import React, { useState } from "react";
import { Table, Button, Modal, ConfigProvider } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import "./styles/ManagerExpensessRequistView.css";
import useAuthStore from "./../../../store/store"; // Import sidebar state for dynamic class handling
export default function ManagerExpensessRequistView() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state?.data;
  const { isSidebarCollapsed } = useAuthStore(); // Access sidebar collapse state
  if (!data) {
    return (
      <div className="error-message">لم يتم العثور على بيانات الصرفيات</div>
    );
  }

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalData, setModalData] = useState(null);

  const showModal = (record) => {
    setModalData(record);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setModalData(null);
  };

  const summaryColumns = [
    {
      title: "رقم الطلب",
      dataIndex: "requestNumber",
      key: "requestNumber",
    },
    {
      title: "اسم المشرف",
      dataIndex: "supervisor",
      key: "supervisor",
    },
    {
      title: "المحافظة",
      dataIndex: "governorate",
      key: "governorate",
    },
    {
      title: "اسم المكتب",
      dataIndex: "officeName",
      key: "officeName",
    },
    {
      title: "سعر الصرف الكلي",
      dataIndex: "expense",
      key: "expense",
      render: (expense) => `${expense} دينار`,
    },
  ];

  const summaryData = [
    {
      key: "1",
      requestNumber: data.requestNumber,
      supervisor: data.supervisor,
      governorate: data.governorate,
      officeName: data.officeName,
      expense: data.expense,
    },
  ];

  const columns = [
    {
      title: "نوع المصروف",
      dataIndex: "expenseType",
      key: "expenseType",
    },
    {
      title: "السعر",
      dataIndex: "price",
      key: "price",
      render: (price) => `${price} دينار`,
    },
    {
      title: "الكمية",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          style={{ backgroundColor: "#1890ff", border: "none" }}
          onClick={() => showModal(record)}>
          عرض
        </Button>
      ),
    },
  ];

  const detailedData = [
    {
      key: "1",
      expenseType: "الصيانة",
      price: "1,250,000",
      quantity: 1,
      date: "2024-11-01",
    },
    {
      key: "2",
      expenseType: "الأدوات",
      price: "400,000",
      quantity: 5,
      date: "2024-11-01",
    },
    {
      key: "3",
      expenseType: "الدورات",
      price: "300,000",
      quantity: 8,
      date: "2024-11-01",
    },
    {
      key: "4",
      expenseType: "نوع اخر",
      price: "1,250,000",
      quantity: 1,
      date: "2024-11-01",
    },
    {
      key: "5",
      expenseType: "نوع اخر",
      price: "700,000",
      quantity: 2,
      date: "2024-11-01",
    },
  ];

  return (
    <ConfigProvider direction="rtl">
      <div
        className={`manager-expenses-view-container ${
          isSidebarCollapsed
            ? "sidebar-collapsed"
            : "manager-expenses-view-container"
        }`}
        dir="rtl">
        {/* Header Section */}
        <div className="header-section">
          <Button
            type="primary"
            style={{
              backgroundColor: "#22CCB2",
              color: "#fff",
              border: "none",
              fontWeight: "bold",
              width: "200px",
              height: "45px",
            }}>
            موافقة
          </Button>
          <Button
            type="primary"
            onClick={() => navigate(-1)}
            style={{
              backgroundColor: "#efb034",
              color: "#fff",
              border: "none",
              fontWeight: "bold",
              width: "200px",
              height: "45px",
            }}>
            ارجاع
          </Button>
        </div>

        {/* Summary Table */}
        <Table
          className="summary-table"
          dataSource={summaryData}
          columns={summaryColumns}
          pagination={false}
          bordered
          rowKey="key"
        />

        {/* Expense Items Table */}
        <Table
          className="expense-details-table"
          dataSource={detailedData}
          columns={columns}
          rowKey="key"
          bordered
          pagination={{
            position: ["bottomCenter"], // Center the pagination
          }}
          locale={{ emptyText: "لا توجد بيانات" }}
        />

        {/* Modal for Item Details */}
        <Modal
          title="تفاصيل المصروف"
          visible={isModalVisible}
          onCancel={handleCancel}
          footer={null}
          className="expense-details-modal">
          {modalData && (
            <div>
              <p>
                <strong>نوع المصروف:</strong> {modalData.expenseType}
              </p>
              <p>
                <strong>السعر:</strong> {modalData.price} دينار
              </p>
              <p>
                <strong>الكمية:</strong> {modalData.quantity}
              </p>
              <p>
                <strong>التاريخ:</strong> {modalData.date}
              </p>
            </div>
          )}
        </Modal>
      </div>
    </ConfigProvider>
  );
}
