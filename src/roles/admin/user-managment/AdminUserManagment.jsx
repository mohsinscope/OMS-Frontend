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
import axiosInstance from './../../../intercepters/axiosInstance.js';
import Dashboard from "./../../../pages/dashBoard.jsx";
import TextFieldForm from "./../../../reusable elements/ReuseAbleTextField.jsx";
import "./AdminUserManagment.css";
import useAuthStore from "./../../../store/store.js";
import Url from "./../../../store/url.js";

const { Option } = Select;

const AdminUserManagment = () => {
  const [userRecords, setUserRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [roles, setRoles] = useState([]);
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
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);

  // Fetch profiles with users and roles
  useEffect(() => {
    const fetchProfilesWithUsersAndRoles = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(
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

  // Fetch roles and governorates
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [governoratesResponse, rolesResponse] = await Promise.all([
          axiosInstance.get(`${Url}/api/Governorate/dropdown`),
          axiosInstance.get(`${Url}/api/profile/all-roles`),
        ]);
        setGovernorates(governoratesResponse.data);
        setRoles(rolesResponse.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        message.error("Failed to load dropdown data");
      }
    };
    fetchInitialData();
  }, []);

  // Fetch offices when governorate changes
  useEffect(() => {
    const fetchOffices = async () => {
      if (selectedGovernorate) {
        try {
          const response = await axiosInstance.get(`${Url}/api/Governorate/dropdown/${selectedGovernorate}`);
          const officesData = response.data[0]?.offices || [];
          setOffices(officesData);
        } catch (error) {
          console.error("Error fetching offices:", error);
          message.error("Failed to load offices");
        }
      } else {
        setOffices([]);
      }
    };

    fetchOffices();
  }, [selectedGovernorate]);

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
        roles: values.roles,
        fullName: values.fullName,
        position: parseInt(values.position, 10),
        officeId: parseInt(values.officeName, 10),
        governorateId: parseInt(values.governorate, 10),
      };

      const response = await axiosInstance.post(`${Url}/api/account/register`, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setUserRecords((prev) => [...prev, response.data]);
      setFilteredRecords((prev) => [...prev, response.data]);
      message.success("تمت إضافة المستخدم بنجاح!");
      closeAddModal();
    } catch (error) {
      console.error("Error adding user:", error.response?.data || error.message);
      message.error("فشل في إضافة المستخدم");
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setSelectedGovernorate(user.governorateId);
    form.setFieldsValue({
      username: user.username,
      fullName: user.fullName,
      roles: user.roles,
      position: user.position,
      governorate: user.governorateId,
      officeName: user.officeId,
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async (values) => {
    setLoading(true);
    try {
      const updatedUser = {
        userId: selectedUser.userId,
        userName: selectedUser.username,
        fullName: values.fullName,
        position: values.position,
        officeId: values.officeName,
        governorateId: values.governorate,
        roles: values.roles
      };

      await axiosInstance.put(`${Url}/api/account/${selectedUser.userId}`, updatedUser, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
  
      message.success("تم تحديث المستخدم بنجاح!");
  
      const updatedResponse = await axiosInstance.get(
        `${Url}/api/account/profiles-with-users-and-roles`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setUserRecords(updatedResponse.data);
      setFilteredRecords(updatedResponse.data);
      closeEditModal();
    } catch (error) {
      console.error("Error updating user:", error);
      message.error("فشل في تحديث المستخدم");
    } finally {
      setLoading(false);
    }
  };

  const closeAddModal = () => {
    setAddModalVisible(false);
    setSelectedGovernorate(null);
    form.resetFields();
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setSelectedGovernorate(null);
    form.resetFields();
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
          variant="solid"
          className="actions-button-usermanagement"
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
        dir="rtl"
      >
        <h1 className="admin-header">إدارة المستخدمين</h1>

        <div
          className={`filter-section ${
            searchVisible ? "animate-show" : "animate-hide"
          }`}
        >
          <TextFieldForm
            fields={[
              { name: "username", label: "اسم المستخدم", type: "text" },
              {
                name: "role",
                label: "الصلاحيات",
                type: "dropdown",
                options: roles.map((role) => ({ value: role, label: role })),
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
            className="usermanagemenr-adduser"
            style={{
              width: "170px",
              backgroundColor: "#04AA6D",
              border: "none",
            }}
            onClick={() => setAddModalVisible(true)}
          >
            إضافة مستخدم +
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
            onCancel={closeAddModal}
            style={{ top: 10 }}
            footer={null}
          >
            <Form
              form={form}
              onFinish={handleAddUser}
              layout="vertical"
              className="dammaged-passport-container-edit-modal"
            >
              <h1>اضافة مستخدم جديد</h1>
              <Form.Item
                name="username"
                label="اسم المستخدم"
                rules={[
                  { required: true, message: "يرجى إدخال اسم المستخدم" },
                ]}
              >
                <Input placeholder="اسم المستخدم" />
              </Form.Item>
              <Form.Item
                name="fullName"
                label="الاسم الكامل"
                rules={[
                  { required: true, message: "يرجى إدخال الاسم الكامل" },
                ]}
              >
                <Input placeholder="الاسم الكامل" />
              </Form.Item>
              <Form.Item
                name="roles"
                label="الصلاحيات"
                rules={[{ required: true, message: "يرجى اختيار الصلاحيات" }]}
              >
                <Select
                  mode="multiple"
                  placeholder="اختر الصلاحيات"
                  style={{ height: 45 }}
                >
                  {roles.map((role) => (
                    <Option key={role} value={role}>
                      {role}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="position"
                label="المنصب"
                rules={[{ required: true, message: "يرجى اختيار المنصب" }]}
              >
                <Select placeholder="اختر المنصب" style={{ height: 45 }}>
                  <Option value="1">Manager</Option>
                  <Option value="2">Director</Option>
                  <Option value="3">Supervisor</Option>
                  <Option value="4">Accontnt</Option>
                  <Option value="5">FollowUpEmployee</Option>
                  <Option value="6">Reporting Analyst</Option>
                  <Option value="7">Sr.Controller</Option>
                  <Option value="8">Project Coordinator</Option>
                  <Option value="9">Operation Manager</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="governorate"
                label="المحافظة"
                rules={[{ required: true, message: "يرجى اختيار المحافظة" }]}
              >
                <Select 
                  placeholder="اختر المحافظة" 
                  style={{ height: 45 }}
                  onChange={(value) => {
                    setSelectedGovernorate(value);
                    form.setFieldValue('officeName', undefined);
                  }}
                >
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
                rules={[{ required: true, message: "يرجى اختيار اسم المكتب" }]}
              >
                <Select 
                  placeholder="اختر المكتب" 
                  style={{ height: 45 }}
                  disabled={!selectedGovernorate}
                >
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
                    message: "يجب أن تبدأ كلمة السر بحرف كبير ولا تحتوي على أحرف عربية",
                  },
                  { min: 8, message: "كلمة السر يجب أن تكون 8 أحرف على الأقل" },
                ]}
              >
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
                      return Promise.reject(new Error("كلمات السر غير متطابقة!"));
                    },
                  }),
                ]}
              >
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
            onCancel={closeEditModal}
            footer={null}
          >
            <Form
              form={form}
              onFinish={handleSaveEdit}
              layout="vertical"
              className="dammaged-passport-container-edit-modal"
            >
              <h1>تعديل المستخدم</h1>
              <Form.Item
                name="fullName"
                label="الاسم الكامل"
                rules={[
                  { required: true, message: "يرجى إدخال الاسم الكامل" },
                ]}
              >
                <Input placeholder="الاسم الكامل" />
              </Form.Item>
              <Form.Item
                name="roles"
                label="الصلاحيات"
                rules={[{ required: true, message: "يرجى اختيار الصلاحيات" }]}
              >
                <Select
                  mode="multiple"
                  placeholder="اختر الصلاحيات"
                  style={{ height: 45 }}
                >
                  {roles.map((role) => (
                    <Option key={role} value={role}>
                      {role}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="position"
                label="المنصب"
                rules={[{ required: true, message: "يرجى اختيار المنصب" }]}
              >
                <Select placeholder="اختر المنصب" style={{ height: 45 }}>
                  <Option value={1}>Manager</Option>
                  <Option value={2}>Director</Option>
                  <Option value={3}>Supervisor</Option>
                  <Option value={4}>Accontnt</Option>
                  <Option value={5}>FollowUpEmployee</Option>
                  <Option value={6}>Reporting Analyst</Option>
                  <Option value={7}>Sr.Controller</Option>
                  <Option value={8}>Project Coordinator</Option>
                  <Option value={9}>Operation Manager</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="governorate"
                label="المحافظة"
                rules={[{ required: true, message: "يرجى اختيار المحافظة" }]}
              >
                <Select 
                  placeholder="اختر المحافظة" 
                  style={{ height: 45 }}
                  onChange={(value) => {
                    setSelectedGovernorate(value);
                    form.setFieldValue('officeName', undefined);
                  }}
                >
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
                rules={[{ required: true, message: "يرجى اختيار اسم المكتب" }]}
              >
                <Select 
                  placeholder="اختر المكتب" 
                  style={{ height: 45 }}
                  disabled={!selectedGovernorate}
                >
                  {offices.map((office) => (
                    <Option key={office.id} value={office.id}>
                      {office.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <div className="border-t mt-4 pt-4">
                <h3 className="mb-4">اعادة تعيين كلمة السر</h3>
                <Form.Item
                  name="newPassword"
                  label="كلمة السر الجديدة"
                  rules={[
                    {
                      pattern: /^[A-Z][A-Za-z0-9!@#$%^&*()_+\-=\[\]{};:'",.<>?]*$/,
                      message: "يجب أن تبدأ كلمة السر بحرف كبير ولا تحتوي على أحرف عربية",
                    },
                    { min: 8, message: "كلمة السر يجب أن تكون 8 أحرف على الأقل" },
                  ]}
                >
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
                  ]}
                >
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