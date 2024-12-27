import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Spin,
  ConfigProvider,
} from "antd";
import axios from "axios";
import Dashboard from "./../../../pages/dashBoard.jsx";
import TextFieldForm from "./../../../reusable elements/ReuseAbleTextField.jsx";
import "./AdminUserManagment.css";
import useAuthStore from "./../../../store/store.js";
import Url from './../../../store/url.js';
const { Option } = Select;

const AdminUserManagment = () => {
  const [userRecords, setUserRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { accessToken } = useAuthStore();
  const { searchVisible, toggleSearch } = useAuthStore();
  const { isSidebarCollapsed } = useAuthStore();
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch profiles with users and roles
  useEffect(() => {
    const fetchProfilesWithUsersAndRoles = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${Url}/api/account/profiles-with-users-and-roles`,
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
          axios.get(`${Url}/api/office`),
          axios.get(`${Url}/api/Governorate`),
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
        `${Url}/api/account/register`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setUserRecords((prev) => [...prev, response.data]);
      setFilteredRecords((prev) => [...prev, response.data]);
      message.success("تمت إضافة المستخدم بنجاح!");
      setAddModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error(
        "Error adding user:",
        error.response?.data || error.message
      );
      message.error("فشل في إضافة المستخدم");
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    form.setFieldsValue({
      username: user.username,
      fullName: user.fullName,
      role: user.roles.join(", "),
      position: user.position,
      governorate: user.governorateId,
      officeName: user.officeId,
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async (values) => {
    setLoading(true);
    try {
      // Update user profile
      const updatedUser = {
        ProfileId: selectedUser.id,
        FullName: values.fullName,
        Position: values.position,
        OfficeId: values.officeName,
        GovernorateId: values.governorate,
      };

      await axios.put(
        `${Url}/api/account/${selectedUser.id}`,
        updatedUser,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // If new password is provided, reset password
      if (values.newPassword) {
        await axios.post(
          `${Url}/api/account/reset-password`,
          {
            userId: selectedUser.id,
            newPassword: values.newPassword
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      }

      message.success("تم تحديث المستخدم بنجاح!");

      // Fetch the updated list
      const updatedResponse = await axios.get(
        `${Url}/api/account/profiles-with-users-and-roles`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setUserRecords(updatedResponse.data);
      setFilteredRecords(updatedResponse.data);
      setEditModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Error updating user:", error);
      message.error("فشل في تحديث المستخدم");
    } finally {
      setLoading(false);
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
          onClick={() => handleEditUser(record)}
        >
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
        
        <div
          className={`filter-section ${
            searchVisible ? "animate-show" : "animate-hide"
          }`}>
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

        <div className="toggle-search-button">
          <Button
            type="primary"
            style={{
              backgroundColor: "#1890ff",
              border: "none",
            }}
            onClick={() => setAddModalVisible(true)}>
            + إضافة
          </Button>
          <Button type="primary" onClick={toggleSearch}>
            {searchVisible ? " البحث" : " البحث"}
          </Button>
        </div>

        <div className="data-table-container">
          <Spin spinning={loading}>
            <Table
              dataSource={filteredRecords}
              columns={columns}
              rowKey="userId"
              bordered
              pagination={{ pageSize: 10, position: ["bottomCenter"] }}
            />
          </Spin>
        </div>

        {/* Add User Modal */}
        <ConfigProvider direction="rtl">
          <Modal
            className="model-container"
            open={addModalVisible}
            onCancel={() => {
              setAddModalVisible(false);
              form.resetFields();
            }}
            style={{ top: 10 }}
            footer={null}>
            <Form
              form={form}
              onFinish={handleAddUser}
              layout="vertical"
              className="Admin-user-add-model-conatiner-form">
              <h1>اضافة مستخدم جديد</h1>
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
                <Select placeholder="اختر الصلاحية" style={{ height: 45 }}>
                  <Option value="Supervisor">مشرف</Option>
                  <Option value="Manager">مدير</Option>
                  <Option value="EmployeeOfDamageFollowUp">
                    موظف متابعة التلف
                  </Option>
                  <Option value="FollowUpEmployee">موظف المتابعة</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="position"
                label="المنصب"
                rules={[{ required: true, message: "يرجى اختيار المنصب" }]}>
                <Select placeholder="اختر المنصب" style={{ height: 45 }}>
                  <Option value={2}>مدير</Option>
                  <Option value={3}>مشرف</Option>
                  <Option value={4}>موظف متابعة التلف</Option>
                  <Option value={5}>موظف المتابعة</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="governorate"
                label="المحافظة"
                rules={[{ required: true, message: "يرجى اختيار المحافظة" }]}>
                <Select placeholder="اختر المحافظة" style={{ height: 45 }}>
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
                <Select placeholder="اختر المكتب" style={{ height: 45 }}>
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
                rules={[
                  { required: true, message: "يرجى إدخال كلمة السر" },
                  {
                    pattern: /^[A-Z][A-Za-z0-9!@#$%^&*()_+\-=\[\]{};:'",.<>?]*$/,
                    message: "يجب أن تبدأ كلمة السر بحرف كبير ولا تحتوي على أحرف عربية"
                  },
                  { min: 8, message: "كلمة السر يجب أن تكون 8 أحرف على الأقل" }
                ]}>
                <Input.Password placeholder="كلمة السر" />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="تأكيد كلمة السر"
                dependencies={["password"]}
                rules={[
                  { required: true, message: "يرجى تأكيد كلمة السر" },
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

        {/* Edit User Modal */}
        <ConfigProvider direction="rtl">
          <Modal
            className="model-container"
            open={editModalVisible}
            onCancel={() => {
              setEditModalVisible(false);
              form.resetFields();
            }}
            footer={null}>
            <Form
              form={form}
              onFinish={handleSaveEdit}
              layout="vertical"
              className="Admin-user-add-model-conatiner-form">
              <h1>تعديل المستخدم</h1>
              <Form.Item
                name="fullName"
                label="الاسم الكامل"
                rules={[
                  { required: true, message: "يرجى إدخال الاسم الكامل" },
                ]}>
                <Input placeholder="الاسم الكامل" />
              </Form.Item>
              <Form.Item
                name="position"
                label="المنصب"
                rules={[{ required: true, message: "يرجى اختيار المنصب" }]}>
                <Select placeholder="اختر المنصب" style={{ height: 45 }}>
                  <Option value="2">مدير</Option>
                  <Option value="3">مشرف</Option>
                  <Option value="4">موظف متابعة التلف</Option>
                  <Option value="5">موظف المتابعة</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="governorate"
                label="المحافظة"
                rules={[{ required: true, message: "يرجى اختيار المحافظة" }]}>
                <Select placeholder="اختر المحافظة" style={{ height: 45 }}>
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
                <Select placeholder="اختر المكتب" style={{ height: 45 }}>
                  {offices.map((office) => (
                    <Option key={office.id} value={office.id}>
                      {office.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {/* Password Reset Section */}
              <div className="border-t mt-4 pt-4">
                <h3 className="mb-4">اعادة تعيين كلمة السر</h3>
                <Form.Item
                  name="newPassword"
                  label="كلمة السر الجديدة"
                  rules={[
                    {
                      pattern: /^[A-Z][A-Za-z0-9!@#$%^&*()_+\-=\[\]{};:'",.<>?]*$/,
                      message: "يجب أن تبدأ كلمة السر بحرف كبير ولا تحتوي على أحرف عربية"
                    },
                    { min: 8, message: "كلمة السر يجب أن تكون 8 أحرف على الأقل" }
                  ]}>
                  <Input.Password placeholder="كلمة السر الجديدة" />
                </Form.Item>
                <Form.Item
                  name="confirmNewPassword"
                  label="تأكيد كلمة السر الجديدة"
                  dependencies={["newPassword"]}
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || !getFieldValue("newPassword")) {
                          return Promise.resolve();
                        }
                        if (value === getFieldValue("newPassword")) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error("كلمات السر غير متطابقة!"));
                      },
                    }),
                  ]}>
                  <Input.Password placeholder="تأكيد كلمة السر الجديدة" />
                </Form.Item>
              </div>

              <Button type="primary" htmlType="submit" block>
                حفظ التعديلات
              </Button>
            </Form>
          </Modal>
        </ConfigProvider>
      </div>
    </>
  );
};

export default AdminUserManagment;