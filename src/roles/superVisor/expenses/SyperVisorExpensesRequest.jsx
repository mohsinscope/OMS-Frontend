import React, { useState } from "react";
import { Table, Button, Card, Typography, Space, message } from "antd";
import "./SuperVisorExpinsesRequest.css"; // CSS file for styling
import Dashboard from "./../../../pages/dashBoard.jsx"; // Dashboard component
import TextFieldForm from "./../../../reusable elements/ReuseAbleTextField.jsx"; // Reusable form component
import expensesData from "./../../../data/expensess.json"; // Sample data for expenses
import DeleteConfirmationModal from "./../../../reusable elements/DeletingModal.jsx"; // Reusable delete modal
import EditExpenseModal from './../../../reusable elements/EditModal.jsx';
import useAuthStore from "./../../../store/store"; // Import sidebar state for dynamic class handling
import Icons from './../../../reusable elements/icons.jsx';
const { Title } = Typography; // Typography component from Ant Design

export default function SuperVisorExpensesRequest() {
  const { isSidebarCollapsed } = useAuthStore(); // Access sidebar collapse state

  const [uploadedImages, setUploadedImages] = useState([]); // State to manage uploaded images
  const [dataSource, setDataSource] = useState(expensesData); // State for the table data source
  const [formData, setFormData] = useState({}); // State to manage form data
  const [isEditing, setIsEditing] = useState(false); // Editing modal visibility
  const [editingRecord, setEditingRecord] = useState(null); // Track the record being edited
  const [isDeleting, setIsDeleting] = useState(false); // Deleting modal visibility
  const [deletingRecord, setDeletingRecord] = useState(null); // Track the record being deleted

  const handleEdit = (record) => {
    setEditingRecord({ ...record });
    setIsEditing(true);
  };

  const saveEdit = () => {
    setDataSource((prev) =>
      prev.map((item) =>
        item["الرقم التسلسلي"] === editingRecord["الرقم التسلسلي"]
          ? editingRecord
          : item
      )
    );
    setIsEditing(false);
    setEditingRecord(null);
    message.success("تم تعديل المصروف بنجاح");
  };

  const handleDelete = (record) => {
    setDeletingRecord(record);
    setIsDeleting(true);
  };

  const confirmDelete = () => {
    setDataSource((prev) =>
      prev.filter((item) => item["الرقم التسلسلي"] !== deletingRecord["الرقم التسلسلي"])
    );
    setIsDeleting(false);
    setDeletingRecord(null);
    message.success("تم حذف المصروف بنجاح");
  };
  const fields = [
    {
      name: "governorate",
      label: "المحافظة", // Governorate field
      placeholder: "بغداد",
      type: "text", // Text input
      disabled: true,
    },
    {
      name: "office",
      label: "اسم المكتب", // Office name field
      placeholder: "مكتب فرقد",
      type: "text", // Text input
      disabled: true,
    },
    {
      name: "expenseType",
      label: "نوع المصروف", // Expense type field
      placeholder: "نوع المصروف",
      type: "dropdown", // Dropdown input
      options: [
        { value: "نثرية", label: "نثرية" },
        { value: "Hotel Stay", label: "Hotel Stay" },
      ],
    },
    {
      name: "price",
      label: "السعر", // Price field
      placeholder: "أدخل السعر",
      type: "text", // Text input
    },
    {
      name: "quantity",
      label: "الكمية", // Quantity field
      placeholder: "أدخل الكمية",
      type: "number", // Number input
    },
    {
      name: "date",
      label: "التاريخ", // Date field
      placeholder: "اختر التاريخ",
      type: "date", // Date input
    },
    {
      name: "remarks",
      label: "الملاحظات", // Remarks field
      placeholder: "أدخل الملاحظات",
      type: "textarea", // Textarea input
      rows: 4, // Number of rows
      cols: 50, // Number of columns
    },
  ];


  const columns = [
    { title: "رقم الطلب", dataIndex: "الرقم التسلسلي", key: "id" }, // Request ID
    { title: "التاريخ", dataIndex: "التاريخ", key: "date" }, // Date
    { title: "الحالة", dataIndex: "الحالة", key: "status" }, // Status
    { title: "المبلغ الإجمالي", dataIndex: "الكلفة الكلية", key: "totalAmount" }, // Total amount
    {
      title: "الإجراءات", // Actions column
      key: "actions",
      render: (_, record) => (
        <Space>
          
           <Button danger size="small" onClick={() => handleDelete(record)}>
            حذف
          </Button>
          <Button
            type="primary"
            size="small"
            onClick={() => handleEdit(record)}
          >
            تعديل
          </Button>
         
        </Space>
      ),
    },
  ];

  return (
    <>

      <div       className={`supervisor-expenses-history-page ${
        isSidebarCollapsed ? "sidebar-collapsed" : "supervisor-expenses-history-page"
      }`} dir="rtl">
        {/* Form Section */}
        <Title level={3} className="supervisor-request-title">
          إضافة المصاريف
        </Title>
        <Card className="supervisor-request-form-card">
          <TextFieldForm
            fields={fields}
            formClassName="supervisor-request-form"
            inputClassName="supervisor-request-input"
            dropdownClassName="supervisor-request-dropdown"
            fieldWrapperClassName="supervisor-request-field-wrapper"
            buttonClassName="supervisor-request-button"
            uploadedImages={uploadedImages}
            hideButtons={true}
            showImagePreviewer={true}
          />
          <button className="add-expensses-button" >   إضافة مصروف<Icons type="add" /> </button>
        </Card>

        {/* Table Section */}
        <Title level={3} className="supervisor-request-title-2">
          جدول المصاريف
        </Title>
        <Card className="supervisor-request-table-card">
          <Table
            dataSource={dataSource}
            columns={columns}
            rowKey="الرقم التسلسلي"
            bordered
            pagination={{ pageSize: 5 }}
          />
        </Card>

        {/* Reusable Modals */}
        <EditExpenseModal
          visible={isEditing}
          onCancel={() => setIsEditing(false)}
          onSave={saveEdit}
          editingRecord={editingRecord}
          setEditingRecord={setEditingRecord}
        />

        <DeleteConfirmationModal
          visible={isDeleting}
          onCancel={() => setIsDeleting(false)}
          onConfirm={confirmDelete}
        />
      </div>
    </>
  );
}
