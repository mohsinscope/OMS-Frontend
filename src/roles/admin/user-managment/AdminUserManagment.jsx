import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, message, Spin } from "antd";
import axios from "axios";
import Dashboard from "./../../../pages/dashBoard.jsx";
import TextFieldForm from "./../../../reusable elements/ReuseAbleTextField.jsx";
import "./AdminUserManagment.css";
import useAuthStore from './../../../store/store.js';
const { Option } = Select;

const AdminUserManagment = () => {
  const [userRecords, setUserRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { accessToken } = useAuthStore(); // Access token from Zustand store

  // Fetch data from APIs
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [officesResponse, governoratesResponse] = await Promise.all([
          axios.get("http://localhost:5214/api/office"),
          axios.get("http://localhost:5214/api/Governorate"),
        ]);

        setOffices(Array.isArray(officesResponse.data) ? officesResponse.data : []);
        setGovernorates(Array.isArray(governoratesResponse.data) ? governoratesResponse.data : []);
      } catch (error) {
        console.error("Error fetching data:", error);
        message.error("فشل تحميل البيانات");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const applyFilters = (filters) => {
    const { username, role, governorate, officeName } = filters;

    const filtered = userRecords.filter((record) => {
      const matchesUsername =
        !username || record.username.toLowerCase().includes(username.toLowerCase());
      const matchesRole =
        !role || record.role.toLowerCase() === role.toLowerCase();
      const matchesGovernorate =
        !governorate || record.governorate.includes(governorate);
      const matchesOfficeName =
        !officeName || record.officeName.includes(officeName);

      return (
        matchesUsername &&
        matchesRole &&
        matchesGovernorate &&
        matchesOfficeName
      );
    });

    setFilteredRecords(filtered.length > 0 ? filtered : []);
  };

  const resetFilters = () => {
    setFilteredRecords(userRecords);
  };

  const handleAddUser = async (values) => {
    try {
      const payload = {
        userName: values.username,
        password: values.password,
        roles: [values.role],
        fullName: values.fullName,
        // modify it to take a value from input of postion
        position: 1,
        officeId: parseInt(values.officeName, 10),
        governorateId: parseInt(values.governorate, 10),
      };

      console.log("Payload being sent:", payload); // Debugging payload

      const response = await axios.post(
        "http://localhost:5214/api/account/register",
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`, // Include token in headers
          },
        }
      );

      setUserRecords((prev) => [...prev, response.data]);
      setFilteredRecords((prev) => [...prev, response.data]);

      message.success("تمت إضافة المستخدم بنجاح");
      setAddModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Error adding user:", error.response?.data || error.message);
      message.error("فشل إضافة المستخدم");
    }
  };

  const columns = [
    {
      title: "اسم المستخدم",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "الصلاحية",
      dataIndex: "role",
      key: "role",
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
      title: "الإجراءات",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          style={{
            backgroundColor: "#1890ff",
            border: "none",
            color: "#fff",
            borderRadius: "4px",
          }}
          onClick={() => console.log("Edit:", record)}
        >
          تعديل
        </Button>
      ),
    },
  ];

  return (
    <>
      <Dashboard />
      <div className="admin-user-management-container" dir="rtl">
        <h1 className="admin-header">إدارة المستخدمين</h1>

        <div className="filter-section">
          <TextFieldForm
            fields={[
              { name: "username", label: "اسم المستخدم", type: "text" },
              { name: "role", label: "الصلاحية", type: "dropdown", options: [{ value: "Supervisor", label: "مشرف" }, { value: "Manager", label: "مدير" }, { value: "Employee", label: "موظف" }] },
              { name: "governorate", label: "المحافظة", type: "dropdown", options: governorates.map((gov) => ({ value: gov.id, label: gov.name })) },
              { name: "officeName", label: "اسم المكتب", type: "dropdown", options: offices.map((office) => ({ value: office.id, label: office.name })) },
            ]}
            onFormSubmit={applyFilters}
            onReset={resetFilters}
          />
        </div>

        <div className="data-table-container">
          <Button
            type="primary"
            style={{
              marginBottom: "15px",
              backgroundColor: "#1890ff",
              border: "none",
            }}
            onClick={() => setAddModalVisible(true)}
          >
            + إضافة
          </Button>
          <Spin spinning={loading}>
            <Table
              dataSource={filteredRecords}
              columns={columns}
              rowKey="id"
              bordered
              pagination={{ pageSize: 5 }}
            />
          </Spin>
        </div>
      </div>

      <Modal
        title="إضافة مستخدم جديد"
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAddUser} layout="vertical">
          <Form.Item name="username" label="اسم المستخدم" rules={[{ required: true, message: "يرجى إدخال اسم المستخدم" }]}>
            <Input placeholder="اسم المستخدم" />
          </Form.Item>
          <Form.Item name="fullName" label="الاسم الكامل" rules={[{ required: true, message: "يرجى إدخال الاسم الكامل" }]}>
            <Input placeholder="الاسم الكامل" />
          </Form.Item>
          <Form.Item name="role" label="الصلاحية" rules={[{ required: true, message: "يرجى اختيار الصلاحية" }]}>
            <Select placeholder="اختر الصلاحية">
              <Option value="Supervisor">مشرف</Option>
              <Option value="Manager">مدير</Option>
              <Option value="Employee">موظف</Option>
            </Select>
          </Form.Item>
          <Form.Item name="position" label="المنصب" rules={[{ required: true, message: "يرجى إدخال المنصب" }]}>
            <Input placeholder="المنصب" value={1} />
          </Form.Item>
          <Form.Item name="governorate" label="المحافظة" rules={[{ required: true, message: "يرجى اختيار المحافظة" }]}>
            <Select placeholder="اختر المحافظة">
              {governorates.map((gov) => (
                <Option key={gov.id} value={gov.id}>
                  {gov.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="officeName" label="اسم المكتب" rules={[{ required: true, message: "يرجى إدخال اسم المكتب" }]}>
            <Select placeholder="اختر المكتب">
              {offices.map((office) => (
                <Option key={office.id} value={office.id}>
                  {office.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="password" label="كلمة السر" rules={[{ required: true, message: "يرجى إدخال كلمة السر" }]}>
            <Input.Password placeholder="كلمة السر" />
          </Form.Item>
          <Form.Item name="confirmPassword" label="تأكيد كلمة السر" dependencies={["password"]} rules={[({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue("password") === value) { return Promise.resolve(); } return Promise.reject(new Error("كلمات السر غير متطابقة!")); }, }),]}>
            <Input.Password placeholder="تأكيد كلمة السر" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            إضافة
          </Button>
        </Form>
      </Modal>
    </>
  );
};

export default AdminUserManagment;
