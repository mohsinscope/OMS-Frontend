import React, { useState } from "react";
import { Table, Button, Card, Typography, Space, message, Modal, Form, Input, DatePicker } from "antd"; // Import Ant Design components
import "./SuperVisorExpinsesRequest.css"; // CSS file for styling
import expensesData from "./../../../data/expensess.json"; // Sample data for expenses
import useAuthStore from "./../../../store/store"; // Import sidebar state for dynamic class handling
import axios from "axios"; // Import Axios for API requests

const { Title } = Typography; // Typography component from Ant Design

export default function SuperVisorExpensesRequest() {
  const { isSidebarCollapsed } = useAuthStore(); // Access sidebar collapse state

  const [uploadedImages, setUploadedImages] = useState([]); // State to manage uploaded images
  const [dataSource, setDataSource] = useState(expensesData); // State for the table data source
  const [formData, setFormData] = useState({}); // State to manage form data
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal visibility state

  // API URL (Replace this with your actual API endpoint)
  const apiUrl = "https://example.com/api/expenses";

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setFormData({}); // Reset form data when modal is closed
  };

  const handleAddExpense = async (values) => {
    try {
      const newExpense = {
        ...values,
        images: uploadedImages,
        status: "Pending", // Default status
        totalAmount: values.price * values.quantity, // Calculate total amount
      };

      // Send the new expense to the API
      const response = await axios.post(apiUrl, newExpense);

      if (response.status === 201 || response.status === 200) {
        // Update the table with the new expense
        setDataSource((prev) => [...prev, response.data]);
        setUploadedImages([]); // Reset uploaded images
        message.success("تمت إضافة المصروف بنجاح");
        setIsModalVisible(false);
      } else {
        throw new Error("Failed to add expense");
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      message.error("حدث خطأ أثناء إضافة المصروف");
    }
  };

  const generalInfoColumns = [
    { title: "المحافظة", dataIndex: "governorate", key: "governorate" },
    { title: "اسم المكتب", dataIndex: "officeName", key: "officeName" },
    { title: "اسم المشرف", dataIndex: "supervisorName", key: "supervisorName" },
    { title: "سعر الصرف الكلي", dataIndex: "totalExchangeRate", key: "totalExchangeRate" },
    { title: "التاريخ", dataIndex: "date", key: "date" },
  ];

  const expenseColumns = [
    { title: "رقم الطلب", dataIndex: "الرقم التسلسلي", key: "id" }, // Request ID
    { title: "التاريخ", dataIndex: "التاريخ", key: "date" }, // Date
    { title: "الحالة", dataIndex: "الحالة", key: "status" }, // Status
    {
      title: "المبلغ الإجمالي",
      dataIndex: "الكلفة الكلية",
      key: "totalAmount",
    }, // Total amount
    {
      title: "الإجراءات", // Actions column
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button danger size="small">
            حذف
          </Button>
          <Button type="primary" size="small">
            تعديل
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div
      className={`supervisor-expenses-history-page ${
        isSidebarCollapsed
          ? "sidebar-collapsed"
          : "supervisor-expenses-history-page"
      }`}
      dir="rtl">

      {/* General Info Table */}
      <h1 className="supervisor-request-title">معلومات عامة</h1>
      <Card className="supervisor-request-table-card">
        <Table
          dataSource={expensesData.map((expense) => expense.generalInfo)}
          columns={generalInfoColumns}
          rowKey="governorate"
          bordered
          pagination={{ pageSize: 1 }}
        />
      </Card>

      {/* Add Expense Button */}
      <div style={{ marginBottom: "20px", textAlign: "left" }}>
        <Button type="primary" onClick={showModal} style={{padding:"20px"}}>
          اضافة مصروف يومي
        </Button>
      </div>

      {/* Modal for Adding Expense */}
      <Modal
        title="اضافة مصروف يومي"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}>
        <Form
          layout="vertical"
          onFinish={handleAddExpense}
          className="add-expense-form">
          <Form.Item
            label="نوع المصروف"
            name="expenseType"
            rules={[{ required: true, message: "الرجاء اختيار نوع المصروف" }]}
          >
            <Input placeholder="أدخل نوع المصروف" />
          </Form.Item>
          <Form.Item
            label="السعر"
            name="price"
            rules={[{ required: true, message: "الرجاء إدخال السعر" }]}
          >
            <Input placeholder="أدخل السعر" type="number" />
          </Form.Item>
          <Form.Item
            label="الكمية"
            name="quantity"
            rules={[{ required: true, message: "الرجاء إدخال الكمية" }]}
          >
            <Input placeholder="أدخل الكمية" type="number" />
          </Form.Item>
          <Form.Item
            label="التاريخ"
            name="date"
            rules={[{ required: true, message: "الرجاء اختيار التاريخ" }]}
          >
            <DatePicker style={{ width: "100%" }} placeholder="اختر التاريخ" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              إضافة
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Table Section */}
      <h1 className="supervisor-request-title-2">جدول المصاريف</h1>
      <Card className="supervisor-request-table-card">
        <Table
          dataSource={dataSource}
          columns={expenseColumns}
          rowKey="الرقم التسلسلي"
          bordered
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </div>
  );
}
