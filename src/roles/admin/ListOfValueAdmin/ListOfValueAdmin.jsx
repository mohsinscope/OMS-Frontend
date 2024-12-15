import React, { useState } from "react";
import "./ListOfValueAdmin.css";
import Icons from "./../../../reusable elements/icons.jsx";
import listOfValuesData from "./../../../data/ListOfValueAdmin.json";
import { Table, Modal, Form, Input, Button, message } from "antd"; // Import Ant Design components
import axios from "axios"; // Import Axios for API calls
import Url from "./../../../store/url.js"; // Base API URL

export default function ListOfValueAdmin() {
  const { ListOfValues } = listOfValuesData; // Destructure the JSON data

  // State for selected data
  const [selectedData, setSelectedData] = useState([]);
  const [loading, setLoading] = useState(false); // Loading state for API calls
  const [columns, setColumns] = useState([]); // Dynamic columns based on endpoint
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal state
  const [selectedEndpoint, setSelectedEndpoint] = useState(""); // Selected API endpoint
  const [formFields, setFormFields] = useState([]); // Dynamic form fields
  const [form] = Form.useForm(); // Ant Design form instance

  // Map label or path to API endpoint and table columns
  const endpointConfig = {
    "/admin/add-office": {
      endpoint: "/api/office",
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
      endpoint: "/api/Governorate",
      columns: [
        { title: "اسم المحافظة", dataIndex: "name", key: "name" },
        { title: "الكود", dataIndex: "code", key: "code" },
      ],
      formFields: [
        { name: "name", label: "اسم المحافظة", type: "text" },
        { name: "code", label: "الكود", type: "text" },
      ],
    },
  };

  // Configure Axios instance
  const api = axios.create({
    baseURL: Url, // Use base URL from `Url.js`
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`, // Retrieve JWT token from localStorage
    },
  });

  // Handle item click
  const handleItemClick = async (item) => {
    const config = endpointConfig[item.path];
    if (!config) {
      console.error("No endpoint configuration found for this item.");
      return;
    }

    setSelectedEndpoint(config.endpoint); // Set the selected endpoint for the modal
    setColumns(config.columns); // Set the table columns
    setFormFields(config.formFields); // Set form fields dynamically
    setLoading(true); // Set loading to true before making the API call
    try {
      // Fetch table data
      const response = await api.get(config.endpoint);
      setSelectedData(response.data); // Set the data received from the API
    } catch (error) {
      console.error("Error fetching data:", error);
      setSelectedData([]); // Clear data if the API call fails
    } finally {
      setLoading(false); // Set loading to false after API call finishes
    }
  };

  // Handle form submission
  const handleFormSubmit = async (values) => {
    setLoading(true); // Set loading to true
    try {
      await api.post(selectedEndpoint, values); // Make a POST request to the selected endpoint
      message.success("تمت الإضافة بنجاح!"); // Success message
      setIsModalOpen(false); // Close the modal
      form.resetFields(); // Reset form fields
      // Refresh the data in the table
      const response = await api.get(selectedEndpoint);
      setSelectedData(response.data);
    } catch (error) {
      console.error("Error adding new entry:", error);
      message.error(
        `حدث خطأ أثناء الإضافة: ${
          error.response?.data?.message || "تفاصيل غير متوفرة"
        }`
      );
    } finally {
      setLoading(false); // Set loading to false
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
                style={{ cursor: "pointer" }} // Add pointer cursor for clickable items
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
              onClick={() => setIsModalOpen(true)} // Open the modal for adding new entry
            >
              إضافة <Icons type="add" />
            </Button>
          </div>
          <div className="table-list-of-value-bottom">
            {/* Render the Ant Design Table */}
            <Table
              columns={columns}
              dataSource={selectedData}
              loading={loading} // Show loading spinner while fetching data
              pagination={true} // Enable pagination
              bordered
            />
          </div>
        </div>
      </div>

      {/* Modal for adding a new entry */}
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
    </>
  );
}
