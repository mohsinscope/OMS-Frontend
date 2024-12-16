import React, { useState } from "react";
import "./ListOfValueAdmin.css";
import Icons from "./../../../reusable elements/icons.jsx";
import listOfValuesData from "./../../../data/ListOfValueAdmin.json";
import { Table, Modal, Form, Input, Button, message,ConfigProvider } from "antd"; // Import Ant Design components
import axios from "axios"; // Import Axios for API calls
import Url from "./../../../store/url.js"; // Base API URL

export default function ListOfValueAdmin() {
  const { ListOfValues } = listOfValuesData; // Destructure the JSON data

  // State for selected data
  const [selectedData, setSelectedData] = useState([]); // Stores table data
  const [loading, setLoading] = useState(false); // Controls the loading spinner
  const [columns, setColumns] = useState([]); // Stores table columns dynamically
  const [isModalOpen, setIsModalOpen] = useState(false); // Controls modal visibility
  const [selectedEndpoint, setSelectedEndpoint] = useState(""); // Stores selected API endpoint
  const [formFields, setFormFields] = useState([]); // Stores form fields dynamically
  const [form] = Form.useForm(); // Ant Design form instance

  // Map label or path to API endpoint and table columns
  const endpointConfig = {
    "/admin/add-office": {
      endpoint: "/api/office", // API endpoint for offices
      columns: [
        { title: "اسم المكتب", dataIndex: "name", key: "name" },
        { title: "الكود", dataIndex: "code", key: "code" },
        { title: "موظفو الاستلام", dataIndex: "receivingStaff", key: "receivingStaff" },
        { title: "موظفو الحسابات", dataIndex: "accountStaff", key: "accountStaff" },
        { title: "موظفو الطباعة", dataIndex: "printingStaff", key: "printingStaff" },
        { title: "موظفو الجودة", dataIndex: "qualityStaff", key: "qualityStaff" },
        { title: "موظفو التوصيل", dataIndex: "deliveryStaff", key: "deliveryStaff" },
        { title: "المحافظة", dataIndex: "governorateId", key: "governorateId" },
      ],
      formFields: [
        { name: "name", label: "اسم المكتب", type: "text" },
        { name: "code", label: "الكود", type: "number" },
        { name: "receivingStaff", label: "موظفو الاستلام", type: "number" },
        { name: "accountStaff", label: "موظفو الحسابات", type: "number" },
        { name: "printingStaff", label: "موظفو الطباعة", type: "number" },
        { name: "qualityStaff", label: "موظفو الجودة", type: "number" },
        { name: "deliveryStaff", label: "موظفو التوصيل", type: "number" },
        { name: "governorateId", label: "المحافظة", type: "number" },
      ],
    },
    "/admin/add-governorate": {
      endpoint: "/api/Governorate", // API endpoint for governorates
      columns: [
        { title: "اسم المحافظة", dataIndex: "name", key: "name" },
        { title: "الكود", dataIndex: "code", key: "code" },
      ],
      formFields: [
        { name: "name", label: "اسم المحافظة", type: "text" },
        { name: "code", label: "الكود", type: "text" },
      ],
    },
    "/admin/device-types": {
      endpoint: "/api/DamagedDevice",
      columns: [
        { title: "رقم الجهاز", dataIndex: "serialNumber", key: "serialNumber" },
        { title: "التاريخ", dataIndex: "date", key: "date" },
        { title: "نوع الجهاز", dataIndex: "deviceTypeName", key: "deviceTypeName" },
        { title: "اسم المكتب", dataIndex: "officeName", key: "officeName" },
        { title: "المحافظة", dataIndex: "governorateName", key: "governorateName" },
      ],
      formFields: [
        { name: "serialNumber", label: "رقم الجهاز", type: "text" },
        { name: "date", label: "التاريخ", type: "date" },
        { name: "deviceTypeId", label: "نوع الجهاز", type: "number" },
        { name: "officeId", label: "اسم المكتب", type: "number" },
        { name: "governorateId", label: "المحافظة", type: "number" },
      ],
    },
  };

  // Configure Axios instance
  const api = axios.create({
    baseURL: Url, // Base URL for API
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`, // Include JWT token
    },
  });

  // Handle sidebar item click
  const handleItemClick = async (item) => {
    const config = endpointConfig[item.path]; // Get configuration for the selected item
    if (!config) {
      console.error("No endpoint configuration found for this item.");
      return;
    }

    setSelectedEndpoint(config.endpoint); // Set the selected API endpoint
    setColumns(config.columns); // Set table columns
    setFormFields(config.formFields); // Set form fields
    setLoading(true); // Show loading spinner
    try {
      const response = await api.get(config.endpoint); // Fetch data from the endpoint
      setSelectedData(response.data); // Populate the table with data
    } catch (error) {
      console.error("Error fetching data:", error);
      setSelectedData([]); // Clear table if an error occurs
    } finally {
      setLoading(false); // Hide loading spinner
    }
  };

  const handleFormSubmit = async (values) => {
    setLoading(true); // Show loading spinner
    try {
      // Submit data
      await api.post(selectedEndpoint, values);
  
      message.success("تمت الإضافة بنجاح!"); // Success message
      setIsModalOpen(false); // Close modal
      form.resetFields(); // Reset form fields
  
      // Refresh table data
      const updatedResponse = await api.get(selectedEndpoint);
      setSelectedData(updatedResponse.data);
    } catch (error) {
      console.error("Error adding new entry:", error); // Log error
      message.error("حدث خطأ أثناء الإضافة."); // Error message
    } finally {
      setLoading(false); // Hide loading spinner
    }
  };

  return (
    <>
        <div className="list-of-value-container" dir="rtl">
          <div className="list-of-value-bar">
            <ul className="list-of-value-items">
              {ListOfValues.map((item, index) => (
                <li
                  key={index}
                  className="list-of-value-item"
                  onClick={() => handleItemClick(item)} // Handle item click
                  style={{ cursor: "pointer", }}
                >
                  <a className="list-of-value-link">
                    <Icons type={item.icon} />
                    <span>{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

        <div className="list-of-value-details-section-left">
          <div className="top-list-of-value-details-section-left">
            <h2>تفاصيل القيمة</h2>
            <Button
              type="primary"
              onClick={() => setIsModalOpen(true)} // Open the modal
            >
              إضافة <Icons type="add" />
            </Button>
          </div>
          <div className="table-list-of-value-bottom">
          <ConfigProvider direction="rtl">
            <Table
              columns={columns} // Dynamic columns
              dataSource={selectedData} // Data for the table
              loading={loading} // Loading spinner
              pagination={{
                pageSize: 5,
                position: ["bottomCenter"],
              }}
              bordered
            />
             </ConfigProvider>
          </div>
        </div>
      </div>

      {/* Modal for adding a new entry */}

      <ConfigProvider direction="rtl">
      <Modal
        title="إضافة قيمة جديدة"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)} // Close the modal
        footer={null}
      >
        <Form form={form} onFinish={handleFormSubmit}>
          {formFields.map((field) => (
            <Form.Item
              key={field.name}
              name={field.name}
              label={field.label}
              rules={[{ required: true, message: `يرجى إدخال ${field.label}` }]}
            >
              <Input type={field.type} />
            </Form.Item>
          ))}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              إضافة
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      </ConfigProvider>
    </>
  );
}
