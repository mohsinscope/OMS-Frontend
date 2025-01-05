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
  const { isSidebarCollapsed } = useAuthStore();
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);

  // Fetch profiles with users and roles
  useEffect(() => {
    const fetchProfilesWithUsersAndRoles = async () => {
      console.log("Fetching profiles...");
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
        console.log("Profiles fetched successfully:", response.data);
        setUserRecords(response.data);
        setFilteredRecords(response.data);
      } catch (error) {
        console.error("Error fetching profiles:", error);
        if (error.response?.status === 401) {
          console.log("Unauthorized - attempting token refresh...");
          const newToken = await useAuthStore.getState().refreshAccessToken();
          if (newToken) {
            try {
              const retryResponse = await axios.get(
                `${Url}/api/account/profiles-with-users-and-roles`,
                {
                  headers: {
                    Authorization: `Bearer ${newToken}`,
                  },
                }
              );
              console.log("Retry successful:", retryResponse.data);
              setUserRecords(retryResponse.data);
              setFilteredRecords(retryResponse.data);
            } catch (retryError) {
              console.error("Retry failed:", retryError);
              message.error("Failed to reload data after token refresh.");
            }
          } else {
            console.warn("Token refresh failed or expired.");
            message.error("Session expired. Please log in again.");
          }
        } else {
          message.error("Failed to load data.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfilesWithUsersAndRoles();
  }, [accessToken]);

  // Fetch roles and governorates
  useEffect(() => {
    const fetchInitialData = async () => {
      console.log("Fetching roles and governorates...");
      try {
        const [governoratesResponse, rolesResponse] = await Promise.all([
          axios.get(`${Url}/api/Governorate/dropdown`),
          axios.get(`${Url}/api/profile/all-roles`),
        ]);
        console.log("Governorates:", governoratesResponse.data);
        console.log("Roles:", rolesResponse.data);
        setGovernorates(governoratesResponse.data);
        setRoles(rolesResponse.data);
      } catch (error) {
        console.error("Error fetching roles and governorates:", error);
        message.error("Failed to load dropdown data.");
      }
    };

    fetchInitialData();
  }, []);

  // Fetch offices when governorate changes
  useEffect(() => {
    const fetchOffices = async () => {
      if (selectedGovernorate) {
        console.log(`Fetching offices for governorate: ${selectedGovernorate}`);
        try {
          const response = await axios.get(
            `${Url}/api/Governorate/dropdown/${selectedGovernorate}`
          );
          console.log("Offices:", response.data[0]?.offices || []);
          setOffices(response.data[0]?.offices || []);
        } catch (error) {
          console.error("Error fetching offices:", error);
          message.error("Failed to load offices.");
        }
      } else {
        console.log("No governorate selected, clearing offices.");
        setOffices([]);
      }
    };

    fetchOffices();
  }, [selectedGovernorate]);

  const applyFilters = (filters) => {
    console.log("Applying filters:", filters);
    const { username, role, governorate, officeName } = filters;

    const filtered = userRecords.filter((record) => {
      const matchesUsername =
        !username || record.username.toLowerCase().includes(username.toLowerCase());
      const matchesRole = !role || record.roles.includes(role);
      const matchesGovernorate =
        !governorate || record.governorateName.includes(governorate);
      const matchesOfficeName =
        !officeName || record.officeName.includes(officeName);

      return matchesUsername && matchesRole && matchesGovernorate && matchesOfficeName;
    });

    console.log("Filtered records:", filtered);
    setFilteredRecords(filtered.length > 0 ? filtered : []);
  };

  const resetFilters = () => {
    console.log("Resetting filters.");
    setFilteredRecords(userRecords);
  };

  const handleAddUser = async (values) => {
    console.log("Adding user with values:", values);
    try {
      const payload = {
        userName: values.username,
        password: values.password,
        roles: values.roles,
        fullName: values.fullName,
        position: parseInt(values.position, 10),
        officeId: values.officeName,
        governorateId: values.governorate,
      };

      const response = await axios.post(`${Url}/api/account/register`, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("User added successfully:", response.data);
      setUserRecords((prev) => [...prev, response.data]);
      setFilteredRecords((prev) => [...prev, response.data]);
      message.success("تمت إضافة المستخدم بنجاح!");
      closeAddModal();
    } catch (error) {
      console.error("Error adding user:", error);
      message.error("فشل في إضافة المستخدم.");
    }
  };

  const handleEditUser = (user) => {
    console.log("Editing user:", user);
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
    console.log("Saving edited user with values:", values);
    setLoading(true);
    try {
      const updatedUser = {
        userId: selectedUser.userId,
        userName: selectedUser.username,
        fullName: values.fullName,
        position: values.position,
        officeId: values.officeName,
        governorateId: values.governorate,
        roles: values.roles,
      };

      await axios.put(`${Url}/api/account/${selectedUser.userId}`, updatedUser, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("User updated successfully.");
      message.success("تم تحديث المستخدم بنجاح!");

      const updatedResponse = await axios.get(
        `${Url}/api/account/profiles-with-users-and-roles`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log("Updated user records:", updatedResponse.data);
      setUserRecords(updatedResponse.data);
      setFilteredRecords(updatedResponse.data);
      closeEditModal();
    } catch (error) {
      console.error("Error updating user:", error);
      message.error("فشل في تحديث المستخدم.");
    } finally {
      setLoading(false);
    }
  };

  const closeAddModal = () => {
    console.log("Closing add user modal.");
    setAddModalVisible(false);
    setSelectedGovernorate(null);
    form.resetFields();
  };

  const closeEditModal = () => {
    console.log("Closing edit user modal.");
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

        <div>
          <Form layout="inline" onFinish={applyFilters} onReset={resetFilters}>
            <Form.Item label="اسم المستخدم" name="username">
              <Input placeholder="اسم المستخدم" />
            </Form.Item>

            <Form.Item label="الصلاحيات" name="role">
              <Select placeholder="اختر الصلاحيات" allowClear>
                {roles.map((role) => (
                  <Option key={role} value={role}>
                    {role}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="المحافظة" name="governorate">
              <Select placeholder="اختر المحافظة" allowClear>
                {governorates.map((gov) => (
                  <Option key={gov.id} value={gov.name}>
                    {gov.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="اسم المكتب" name="officeName">
              <Input placeholder="اسم المكتب" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit"style={{ marginLeft: 8,height:"45px",width: "170px" }}>
                بحث
              </Button>
              <Button htmlType="reset" style={{ marginLeft: 8,height:"45px",width: "170px" }}>
                إعادة تعيين
              </Button>
            <Button
            type="primary"
            className="usermanagemenr-adduser"
            style={{
              width: "170px",
              height:"45px",
              backgroundColor: "#04AA6D",
              border: "none",
            }}
            onClick={() => setAddModalVisible(true)}
          >
            إضافة مستخدم +
          </Button>
            </Form.Item>
          </Form>
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
              className="Admin-user-add-model-conatiner-form"
            >
              <h1>اضافة مستخدم جديد</h1>
              <Form.Item
                name="username"
                label="اسم المستخدم"
                rules={[{ required: true, message: "يرجى إدخال اسم المستخدم" }]}
              >
                <Input placeholder="اسم المستخدم" />
              </Form.Item>
              <Form.Item
                name="fullName"
                label="الاسم الكامل"
                rules={[{ required: true, message: "يرجى إدخال الاسم الكامل" }]}
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
                    form.setFieldValue("officeName", undefined);
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
      </div>
    </>
  );
};

export default AdminUserManagment;
