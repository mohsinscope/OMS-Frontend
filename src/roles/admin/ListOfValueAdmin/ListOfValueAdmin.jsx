import React, { useState, useEffect } from "react";
import "./ListOfValueAdmin.css";
import Icons from "./../../../reusable elements/icons.jsx";
import listOfValuesData from "./../../../data/ListOfValueAdmin.json";
import {
  Table,
  Modal,
  Form,
  Input,
  Button,
  message,
  ConfigProvider,
  Select,
} from "antd";
import axios from "axios";
import Url from "./../../../store/url.js";

const { Option } = Select;

export default function ListOfValueAdmin() {
  const { ListOfValues } = listOfValuesData;

  // State
  const [selectedData, setSelectedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [formFields, setFormFields] = useState([]);
  const [form] = Form.useForm();
  const [offices, setOffices] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [damagedTypes, setDamagedTypes] = useState([]);


  // Centralized Configuration
  const config = {
    "/admin/add-office": {
      getEndpoint: "/api/office",
      postEndpoint: "/api/office",
      columns: [
        { title: "اسم المكتب", dataIndex: "name", key: "name" },
        { title: "الكود", dataIndex: "code", key: "code" },
        {
          title: "موظفو الاستلام",
          dataIndex: "receivingStaff",
          key: "receivingStaff",
        },
        {
          title: "موظفو الحسابات",
          dataIndex: "accountStaff",
          key: "accountStaff",
        },

        {
          title: "موظفو الطباعة",
          dataIndex: "printingStaff",
          key: "printingStaff",
        },
        {
          title: "موظفوا الجودة",
          dataIndex: "qualityStaff",
          key: "qualityStaff",
        },
        {
          title: "موظفو التوصيل",
          dataIndex: "deliveryStaff",
          key: "deliveryStaff",
        },
      ],
      formFields: [
        { name: "name", label: "اسم المكتب", type: "text" },
        { name: "code", label: "الكود", type: "number" },
        { name: "receivingStaff", label: "موظفو الاستلام", type: "number" },
        { name: "accountStaff", label: "موظفو الحسابات", type: "number" },

        { name: "printingStaff", label: "موظفو الطباعة", type: "number" },
        { name: "qualityStaff", label: "موظفوا الجودة", type: "number" },
        { name: "deliveryStaff", label: "موظفو التوصيل", type: "number" },
        { name: "governorateId", label: "|رقم المحافظة", type: "number" },
      ],
    },
    "/admin/add-governorate": {
      getEndpoint: "/api/Governorate",
      postEndpoint: "/api/Governorate",
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
      getEndpoint: "/api/devicetype",
      postEndpoint: "/api/devicetype",
      columns: [
        { title: "اسم الجهاز", dataIndex: "name", key: "name" },
        { title: "التفاصيل", dataIndex: "description", key: "description" },
      ],
      formFields: [
        { name: "name", label: "اسم الجهاز", type: "text" },
        { name: "description", label: "التفاصيل", type: "text" },
      ],
    },
    "/admin/damage-types": {
      getEndpoint: "/api/damageddevicetype/all",
      postEndpoint: "/api/damageddevicetype/add",
      columns: [
        { title: "اسم تلف الجهاز", dataIndex: "name", key: "name" },
        { title: "التفاصيل", dataIndex: "description", key: "description" },
      ],
      formFields: [
        { name: "name", label: "اسم تلف الجهاز", type: "text" },
        { name: "description", label: "التفاصيل", type: "text" },
      ],
    },
    "/admin/passport-dammage-types": {
      getEndpoint: "/api/damagedtype/all",
      postEndpoint: "/api/damagedtype/add",
      columns: [
        { title: "اسم تلف الجواز", dataIndex: "name", key: "name" },
        { title: "التفاصيل", dataIndex: "description", key: "description" },
      ],
      formFields: [
        { name: "name", label: "اسم تلف الجواز", type: "text" },
        { name: "description", label: "التفاصيل", type: "text" },
      ],
    },
    "/admin/device-dammage-types": {
      getEndpoint: "/api/DamagedDevice",
      postEndpoint: "/api/damagedtype/add",
      columns: [
        { title: "التاريخ", dataIndex: "date", key: "date" },
        {
          title: "اسم الجهاز",
          dataIndex: "deviceTypeName",
          key: "deviceTypeName",
        },
        {
          title: "المحافظة",
          dataIndex: "governorateName",
          key: "governorateName",
        },
        { title: "اسم المكتب", dataIndex: "officeName", key: "officeName" },
        {
          title: "اسم المستخدم",
          dataIndex: "profileFullName",
          key: "profileFullName",
        },
      ],
      formFields: [
        { name: "date", label: "التاريخ", type: "date" },
        { name: "deviceTypeName", label: "اسم الجهاز", type: "dropdown" },

        { name: "governorateName", label: "اسم المحافظة", type: "dropdown" },
        { name: "officeName", label: "اسم المكتب", type: "dropdown" },
        { name: "profileFullName", label: "اسم المستخدم", type: "dropdown" },
      ],
    },
    "/admin/passport-dammage": {
      getEndpoint: "/api/DamagedPassport",
      postEndpoint: "/api/DamagedPassport",
      columns: [
        { title: "التاريخ", dataIndex: "date", key: "date" },
        {
          title: "رقم الجواز",
          dataIndex: "passportNumber",
          key: "passportNumber",
        },
        {
          title: "نوع تلف الجواز",
          dataIndex: "damagedTypeName",
          key: "damagedTypeName",
        },
        {
          title: "المحافظة",
          dataIndex: "governorateName",
          key: "governorateName",
        },
        { title: "اسم المكتب", dataIndex: "officeName", key: "officeName" },
        {
          title: "اسم المستخدم",
          dataIndex: "profileFullName",
          key: "profileFullName",
        },
      ],
      formFields: [
        { name: "date", label: "التاريخ", type: "text" },
        { name: "passportNumber", label: "رقم الجواز", type: "text" },
        { name: "damagedTypeName", label: "نوع تلف الجواز", type: "dropdown" },
        { name: "governorateName", label: "المحافظة", type: "dropdown" },
        { name: "officeName", label: "اسم المكتب", type: "dropdown" },
        { name: "profileFullName", label: "اسم المستخدم", type: "text" },
      ],
    },
  };

  const api = axios.create({
    baseURL: Url,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  // Fetch dropdown data for offices, governorates, and damaged types
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [officesResponse, governoratesResponse, damagedTypesResponse] =
          await Promise.all([
            api.get("/api/office"),
            api.get("/api/Governorate"),
            api.get("/api/damagedtype/all"),
          ]);
        setOffices(officesResponse.data);
        setGovernorates(governoratesResponse.data);
        setDamagedTypes(damagedTypesResponse.data);
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      }
    };
    fetchDropdownData();
  }, []);

  // Handle sidebar click
  const handleItemClick = async (item) => {
    const selected = config[item.path];
    if (!selected) {
      console.error("No configuration found for path:", item.path);
      return;
    }

    setSelectedConfig(selected);
    setColumns(selected.columns);
    setFormFields(selected.formFields);

    setLoading(true);
    try {
      const response = await api.get(selected.getEndpoint);
      setSelectedData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setSelectedData([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleFormSubmit = async (values) => {
    setLoading(true);
    try {
      await api.post(selectedConfig.postEndpoint, values);
      message.success("تمت الإضافة بنجاح!");
      setIsModalOpen(false);
      form.resetFields();

      // Fetch updated data for the table
      const updatedResponse = await api.get(selectedConfig.getEndpoint);
      setSelectedData(updatedResponse.data);
    } catch (error) {
      console.error("Error adding new entry:", error);
      message.error("حدث خطأ أثناء الإضافة");
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
                onClick={() => handleItemClick(item)}>
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
          <ConfigProvider direction="rtl">
            <Table
              columns={columns}
              dataSource={selectedData}
              loading={loading}
              pagination={{ pageSize: 10, position: ["bottomCenter"] }}
              bordered
            />
          </ConfigProvider>
        </div>
      </div>

      {/* Modal */}
      <Modal
        title="إضافة قيمة جديدة"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}>
        <Form form={form} onFinish={handleFormSubmit}>
          {formFields.map((field) => (
            <Form.Item
              key={field.name}
              name={field.name}
              label={field.label}
              rules={[
                { required: true, message: `يرجى إدخال ${field.label}` },
              ]}>
              {field.type === "dropdown" ? (
                <Select placeholder={`اختر ${field.label}`}>
                  {(field.name === "governorateName"
                    ? governorates
                    : field.name === "officeName"
                    ? offices
                    : damagedTypes
                  ).map((option) => (
                    <Option key={option.id} value={option.id}>
                      {option.name}
                    </Option>
                  ))}
                </Select>
              ) : (
                <Input type={field.type} />
              )}
            </Form.Item>
          ))}
          <Button type="primary" htmlType="submit" block>
            إضافة
          </Button>
        </Form>
      </Modal>
    </>
  );
}
