import React, { useState, useEffect } from "react";
import "./ListOfValueAdmin.css";
import Icons from "./../../../reusable elements/icons.jsx";
import listOfValuesData from "./../../../data/ListOfValueAdmin.json";
import { Table, Modal, Form, Input, Button, message, ConfigProvider, Select } from "antd"; // Import Ant Design components
import axios from "axios"; // Import Axios for API calls
import Url from "./../../../store/url.js"; // Base API URL

const { Option } = Select;

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
  const [offices, setOffices] = useState([]); // Stores office names for dropdown
  const [governorates, setGovernorates] = useState([]); // Stores governorate names for dropdown

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
        { name: "governorateId", label: "المحافظة", type: "dropdown" }, // Dropdown for governorates
      ],
    },
    "/admin/device-types": {
      endpoint: "/api/DamagedDevice",
      columns: [
        { title: "رقم الجهاز", dataIndex: "serialNumber", key: "serialNumber" },
        { title: "التاريخ", dataIndex: "date", key: "date" },
        { title: "نوع الجهاز", dataIndex: "deviceTypeId", key: "deviceTypeId" },
        { title: "اسم المكتب", dataIndex: "officeId", key: "officeId" },
        { title: "المحافظة", dataIndex: "governorateId", key: "governorateId" },
      ],
      formFields: [
        { name: "serialNumber", label: "رقم الجهاز", type: "text" },
        { name: "damagedDeviceTypeId", label: "نوع الجهاز", type: "number" },
        { name: "deviceTypeId", label: "رقم نوع الجهاز", type: "number" },
        { name: "officeId", label: "اسم المكتب", type: "dropdown" }, // Dropdown for office names
        { name: "governorateId", label: "المحافظة", type: "dropdown" }, // Dropdown for governorates
        { name: "profileId", label: "الملف الشخصي", type: "number" },
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
  };

  // Configure Axios instance
  const api = axios.create({
    baseURL: Url, // Base API URL
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`, // Include JWT token
    },
  });

  // Fetch office names and governorates for dropdowns
  useEffect(() => {
    const fetchDropdownData = async () => {
      setLoading(true);
      try {
        const [officesResponse, governoratesResponse] = await Promise.all([
          api.get("/api/office"),
          api.get("/api/Governorate"),
        ]);
        setOffices(officesResponse.data);
        setGovernorates(governoratesResponse.data);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDropdownData();
  }, []);

  // Handle sidebar item click
  const handleItemClick = async (item) => {
    const config = endpointConfig[item.path];
    if (!config) {
      console.error("No endpoint configuration found for this item.");
      return;
    }

    setSelectedEndpoint(config.endpoint);
    setColumns(config.columns);
    setFormFields(config.formFields);
    setLoading(true);
    try {
      const response = await api.get(config.endpoint);
      setSelectedData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setSelectedData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (values) => {
    setLoading(true);
    try {
      await api.post(selectedEndpoint, values);
      message.success("تمت الإضافة بنجاح!");
      setIsModalOpen(false);
      form.resetFields();

      const updatedResponse = await api.get(selectedEndpoint);
      setSelectedData(updatedResponse.data);
    } catch (error) {
      console.error("Error adding new entry:", error.response?.data || error.message);
      message.error(`حدث خطأ أثناء الإضافة: ${error.response?.data?.message || "تحقق من البيانات"}`);
    } finally {
      setLoading(false);
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
                onClick={() => handleItemClick(item)}
                style={{ cursor: "pointer" }}
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
            <Button type="primary" onClick={() => setIsModalOpen(true)}>
              إضافة <Icons type="add" />
            </Button>
          </div>
          <div className="table-list-of-value-bottom">
            <ConfigProvider direction="rtl">
              <Table
                columns={columns}
                dataSource={selectedData}
                loading={loading}
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
          onCancel={() => setIsModalOpen(false)}
          footer={null}
        >
          <Form form={form} onFinish={handleFormSubmit}>
            {formFields.map((field) =>
              field.type === "dropdown" ? (
                <Form.Item
                  key={field.name}
                  name={field.name}
                  label={field.label}
                  rules={[{ required: true, message: `يرجى إدخال ${field.label}` }]}
                >
                  <Select placeholder={`اختر ${field.label}`}>
                    {field.name === "officeId"
                      ? offices.map((office) => (
                          <Option key={office.id} value={office.id}>
                            {office.name}
                          </Option>
                        ))
                      : governorates.map((gov) => (
                          <Option key={gov.id} value={gov.id}>
                            {gov.name}
                          </Option>
                        ))}
                  </Select>
                </Form.Item>
              ) : (
                <Form.Item
                  key={field.name}
                  name={field.name}
                  label={field.label}
                  rules={[{ required: true, message: `يرجى إدخال ${field.label}` }]}
                >
                  <Input type={field.type} />
                </Form.Item>
              )
            )}
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
