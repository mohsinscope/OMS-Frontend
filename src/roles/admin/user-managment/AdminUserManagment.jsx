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

const { Option } = Select;

const AdminUserManagment = () => {
  const [userRecords, setUserRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false); // State for Edit Modal
  const [form] = Form.useForm();
  const { accessToken } = useAuthStore(); // Access token from Zustand store
  const { searchVisible, toggleSearch } = useAuthStore(); // search visibility state from store
  const { isSidebarCollapsed } = useAuthStore(); // Access sidebar collapse state
  const [selectedUser, setSelectedUser] = useState(null); // State for selected user to edit

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

  const handleEditUser = (user) => {
    setSelectedUser(user); // Set selected user to be edited
    form.setFieldsValue({
      username: user.username,
      fullName: user.fullName,
      role: user.roles.join(", "), // Handle the roles if it's an array
      position: user.position,
      governorate: user.governorateId,
      officeName: user.officeId, // Use correct field names based on your form
    });
    setEditModalVisible(true); // Open the modal to edit the user
  };

  const handleSaveEdit = async (values) => {
    const updatedUser = {
      ProfileId: selectedUser.id, // Ensure the ProfileId is included
      FullName: values.fullName, // Full Name from form
      Position: values.position, // Position from form
      OfficeId: values.officeName, // Office selected from the form
      GovernorateId: values.governorate, // Governorate selected from the form
    };
    console.log(updatedUser); // Log to see the object being sent in the PUT request

    setLoading(true);
    try {
      // PUT request to update the user
      await axios.put(
        `http://localhost:5214/api/account/${selectedUser.id}`,
        updatedUser,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      message.success("User updated successfully!");

      // Fetch the updated list
      const updatedResponse = await axios.get(
        "http://localhost:5214/api/account/profiles-with-users-and-roles",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setUserRecords(updatedResponse.data);
      setFilteredRecords(updatedResponse.data);
      setEditModalVisible(false); // Close the modal
    } catch (error) {
      console.error("Error updating user:", error);
      message.error("Failed to update user");
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
          onClick={() => handleEditUser(record)} // Open modal to edit the user
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
        {/* Filter Section */}
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
          {/* Add Button */}
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

        {/* Data Table Section */}
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
            onCancel={() => setAddModalVisible(false)}
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

        {/* Edit User Modal */}
        <ConfigProvider direction="rtl">
          <Modal
            className="model-container"
            open={editModalVisible}
            onCancel={() => setEditModalVisible(false)}
            footer={null}>
            <h1>تعديل المستخدم</h1>
            <Form
              form={form}
              onFinish={handleSaveEdit}
              layout="vertical"
              className="Admin-user-add-model-conatiner-form">
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
                  <Option value="Supervisor">مشرف</Option>
                  <Option value="Manager">مدير</Option>
                  <Option value="Employee">موظف</Option>
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
