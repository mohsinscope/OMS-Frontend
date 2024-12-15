import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  ConfigProvider,
  Select,
  message,
  Spin,
} from "antd";
import axios from "axios";
import Dashboard from "./../../../pages/dashBoard.jsx";
import TextFieldForm from "./../../../reusable elements/ReuseAbleTextField.jsx";
import "./AdminUserManagment.css";
import useAuthStore from "./../../../store/store.js";

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
  const { isSidebarCollapsed } = useAuthStore();
  // Fetch profiles with users and roles
  useEffect(() => {
    const fetchProfilesWithUsersAndRoles = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          "http://localhost:5214/api/account/profiles-with-users-and-roles",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        setUserRecords(response.data);
        setFilteredRecords(response.data);
      } catch (error) {
        console.error("Error fetching profiles:", error);
        message.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfilesWithUsersAndRoles();
  }, [accessToken]);

  // Fetch data for dropdowns
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [officesResponse, governoratesResponse] = await Promise.all([
          axios.get("http://localhost:5214/api/office"),
          axios.get("http://localhost:5214/api/Governorate"),
        ]);
        setOffices(officesResponse.data);
        setGovernorates(governoratesResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        message.error("Failed to load dropdown data");
      }
    };
    fetchInitialData();
  }, []);

  const applyFilters = (filters) => {
    const { username, role, governorate, officeName } = filters;

    const filtered = userRecords.filter((record) => {
      const matchesUsername =
        !username ||
        record.username.toLowerCase().includes(username.toLowerCase());
      const matchesRole = !role || record.roles.includes(role);
      const matchesGovernorate =
        !governorate || record.governorateName.includes(governorate);
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
        position: parseInt(values.position, 10),
        officeId: parseInt(values.officeName, 10),
        governorateId: parseInt(values.governorate, 10),
      };

      const response = await axios.post(
        "http://localhost:5214/api/account/register",
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setUserRecords((prev) => [...prev, response.data]);
      setFilteredRecords((prev) => [...prev, response.data]);
      message.success("User added successfully!");
      setAddModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error(
        "Error adding user:",
        error.response?.data || error.message
      );
      message.error("Failed to add user");
    }
  };

  const columns = [
    {
      title: "اسم المستخدم",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "الصلاحيات",
      dataIndex: "roles",
      key: "roles",
      render: (roles) => roles.join(", "),
    },
    {
      title: "الاسم الكامل",
      dataIndex: "fullName",
      key: "fullName",
    },
    {
      title: "المحافظة",
      dataIndex: "governorateName",
      key: "governorateName",
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
          onClick={() => console.log("Edit:", record)}>
          تعديل
        </Button>
      ),
    },
  ];

  return (
    <>
      <Dashboard />

      <div
        className={`admin-user-management-container ${
          isSidebarCollapsed
            ? "sidebar-collapsed"
            : "admin-user-management-container"
        }`}
        dir="rtl">
        <h1 className="admin-header">إدارة المستخدمين</h1>

        {/* Filter Section */}
        <div className="filter-section">
          <TextFieldForm
            fields={[
              { name: "username", label: "اسم المستخدم", type: "text" },
              {
                name: "role",
                label: "الصلاحيات",
                type: "dropdown",
                options: [
                  { value: "Supervisor", label: "مشرف" },
                  { value: "Manager", label: "مدير" },
                  { value: "Employee", label: "موظف" },
                ],
              },
              {
                name: "governorate",
                label: "المحافظة",
                type: "text",
              },
              {
                name: "officeName",
                label: "اسم المكتب",
                type: "text",
              },
            ]}
            onFormSubmit={applyFilters}
            onReset={resetFilters}
            formClassName="filter-row"
            inputClassName="filter-input"
            dropdownClassName="filter-dropdown"
            fieldWrapperClassName="filter-field-wrapper"
            buttonClassName="filter-button"
          />
        </div>

        {/* Add Button */}
        <Button
          type="primary"
          style={{
            marginBottom: "15px",
            backgroundColor: "#1890ff",
            border: "none",
          }}
          onClick={() => setAddModalVisible(true)}>
          + إضافة
        </Button>

        {/* Data Table Section */}
        <div className="data-table-container">
          <Spin spinning={loading}>
            <Table
              dataSource={filteredRecords}
              columns={columns}
              rowKey="userId"
              bordered
              pagination={{ pageSize: 5 }}
            />
          </Spin>
        </div>

        {/* Add User Modal */}
        <ConfigProvider direction="rtl">
          <Modal
            title="إضافة مستخدم جديد"
            open={addModalVisible}
            onCancel={() => setAddModalVisible(false)}
            footer={null}>
            <Form form={form} onFinish={handleAddUser} layout="vertical">
              <Form.Item
                name="username"
                label="اسم المستخدم"
                rules={[
                  { required: true, message: "يرجى إدخال اسم المستخدم" },
                ]}>
                <Input placeholder="اسم المستخدم" />
              </Form.Item>
              <Form.Item
                name="fullName"
                label="الاسم الكامل"
                rules={[
                  { required: true, message: "يرجى إدخال الاسم الكامل" },
                ]}>
                <Input placeholder="الاسم الكامل" />
              </Form.Item>
              <Form.Item
                name="role"
                label="الصلاحية"
                rules={[{ required: true, message: "يرجى اختيار الصلاحية" }]}>
                <Select placeholder="اختر الصلاحية">
                  <Option value="Supervisor">مشرف</Option>
                  <Option value="Manager">مدير</Option>
                  <Option value="Employee">موظف</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="position"
                label="المنصب"
                rules={[{ required: true, message: "يرجى اختيار المنصب" }]}>
                <Select placeholder="اختر المنصب">
                  <Option value={1}>مدير</Option>
                  <Option value={2}>مشرف</Option>
                  <Option value={3}>موظف</Option>
                  <Option value={4}>مساعد</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="governorate"
                label="المحافظة"
                rules={[{ required: true, message: "يرجى اختيار المحافظة" }]}>
                <Select placeholder="اختر المحافظة">
                  {governorates.map((gov) => (
                    <Option key={gov.id} value={gov.id}>
                      {gov.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="officeName"
                label="اسم المكتب"
                rules={[{ required: true, message: "يرجى اختيار اسم المكتب" }]}>
                <Select placeholder="اختر المكتب">
                  {offices.map((office) => (
                    <Option key={office.id} value={office.id}>
                      {office.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="password"
                label="كلمة السر"
                rules={[{ required: true, message: "يرجى إدخال كلمة السر" }]}>
                <Input.Password placeholder="كلمة السر" />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="تأكيد كلمة السر"
                dependencies={["password"]}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("كلمات السر غير متطابقة!")
                      );
                    },
                  }),
                ]}>
                <Input.Password placeholder="تأكيد كلمة السر" />
              </Form.Item>
              <Button type="primary" htmlType="submit" block>
                إضافة
              </Button>
            </Form>
          </Modal>
        </ConfigProvider>
      </div>
    </>
  );
};

export default AdminUserManagment;
