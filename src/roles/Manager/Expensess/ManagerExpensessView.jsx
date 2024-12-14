import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Table, Modal, ConfigProvider } from "antd";
import './styles/ManagerExpensessView.css';
export default function ManagerExpensessView() {
  const location = useLocation();
  const data = location.state?.data; // Retrieve data passed via the "عرض" button

  if (!data) {
    return <div className="manager-expenses-view-error">لم يتم العثور على بيانات الصرفيات</div>;
  }

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalData, setModalData] = useState(null);

  const showDetails = (record) => {
    setModalData(record);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setModalData(null);
  };

  // Define a single-row table structure
  const generalInfoColumns = [
    {
      title: "الكلفة الكلية",
      dataIndex: "totalCost",
      key: "totalCost",
    },
    {
      title: "اسم المكتب",
      dataIndex: "officeName",
      key: "officeName",
    },
    {
      title: "المحافظة",
      dataIndex: "governorate",
      key: "governorate",
    },
    {
      title: "اسم المشرف",
      dataIndex: "supervisorName",
      key: "supervisorName",
    },
    {
      title: "الرقم التسلسلي",
      dataIndex: "serialNumber",
      key: "serialNumber",
    },
  ];

  const generalInfoData = [
    {
      key: "1",
      totalCost: data["الكلفة الكلية"],
      officeName: data["اسم المكتب"],
      governorate: data["المحافظة"],
      supervisorName: "أحمد علي", // Example static data
      serialNumber: data["الرقم التسلسلي"],
    },
  ];

  // Expense Details Table Columns
  const detailsColumns = [
    {
      title: "نوع المصروف",
      dataIndex: "expenseType",
      key: "expenseType",
    },
    {
      title: "الكمية",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "السعر",
      dataIndex: "price",
      key: "price",
    },
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "عرض",
      key: "view",
      render: (_, record) => (
        <button
          style={{
            padding: "5px 10px",
            backgroundColor: "#1890ff",
            border: "none",
            color: "#fff",
            borderRadius: "5px",
            cursor: "pointer",
          }}
          onClick={() => showDetails(record)}
        >
          عرض
        </button>
      ),
    },
  ];

  const detailsData = [
    {
      key: "1",
      expenseType: "نقل",
      quantity: 2,
      price: "50,000",
      date: "2023-09-01",
    },
  ];

  return (
    <ConfigProvider direction="rtl">
    <div className="manager-expenses-view-container" dir="rtl">
      {/* Header Section */}
      <div className="manager-expenses-view-header">
        <h1 className="manager-expenses-view-date">التاريخ : {data["التاريخ"]}</h1>
      </div>

      {/* General Information Table */}
      <Table
        className="manager-expenses-view-general-table"
        dataSource={generalInfoData}
        columns={generalInfoColumns}
        pagination={false}
        bordered
        locale={{ emptyText: "لا توجد بيانات" }}
      />
      <button
       className="manager-expenses-view-print-button"
        onClick={() => console.log("طباعة clicked")}
      >
        طباعة
      </button>
      <hr style={{ width: "100%", marginTop: "10px" }} />

      {/* Expense Details Section */}
      <Table
        className="manager-expenses-view-details-table"
        dataSource={detailsData}
        columns={detailsColumns}
        rowKey="key"
        bordered
        pagination={{
          pageSize: 5,
          position: ["bottomCenter"],
        }}
        
        locale={{ emptyText: "لا توجد بيانات" }}
      />

      {/* Modal for Details */}
      <Modal
        title="تفاصيل المصروف"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        className="manager-expenses-view-modal"
      >
        {modalData && (
          <div>
            <p>
              <strong>نوع المصروف:</strong> {modalData.expenseType}
            </p>
            <p>
              <strong>الكمية:</strong> {modalData.quantity}
            </p>
            <p>
              <strong>السعر:</strong> {modalData.price} دينار
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
