import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Select, message, Spin } from "antd";
import axios from "axios";
import Dashboard from "./../../../pages/dashBoard.jsx";
import TextFieldForm from "./../../../reusable elements/ReuseAbleTextField.jsx";
import "./AdminUserManagment.css";

const { Option } = Select;

const AdminUserManagment = () => {
  const [userRecords, setUserRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  // Fetch user records from the API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/users"); // Replace with your API endpoint
        setUserRecords(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching user data:", error);
        message.error("فشل تحميل بيانات المستخدمين");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const applyFilters = (filters) => {
    const { username, role, governorate, officeName } = filters;

    const filtered = userRecords.filter((record) => {
      const matchesUsername =
        !username ||
        record.username.toLowerCase().includes(username.toLowerCase());
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
    setFilteredRecords([]);
  };

  const handleDelete = (userId) => {
    Modal.confirm({
      title: "تأكيد الحذف",
      content: "هل أنت متأكد أنك تريد حذف هذا المستخدم؟",
      okText: "نعم",
      cancelText: "إلغاء",
      onOk: async () => {
        try {
          await axios.delete(`/api/users/${userId}`); // Replace with your API delete endpoint
          setUserRecords((prev) => prev.filter((user) => user.id !== userId));
          setFilteredRecords((prev) =>
            prev.filter((user) => user.id !== userId)
          );
          message.success("تم حذف المستخدم بنجاح");
        } catch (error) {
          console.error("Error deleting user:", error);
          message.error("فشل حذف المستخدم");
        }
      },
    });
  };

  const handleAddUser = async (values) => {
    try {
      const response = await axios.post("/api/users", values); // Replace with your API add endpoint
      setUserRecords((prev) => [...prev, response.data]);
      setFilteredRecords((prev) => [...prev, response.data]);
      message.success("تمت إضافة المستخدم بنجاح");
      setAddModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Error adding user:", error);
      message.error("فشل إضافة المستخدم");
    }
  };

  const handleEdit = (user) => {
    setEditUser(user);
    editForm.setFieldsValue(user); // Pre-fill the form with the selected user data
    setEditModalVisible(true);
  };

  const handleEditSubmit = async (values) => {
    try {
      const updatedUser = { ...editUser, ...values };
      await axios.put(`/api/users/${editUser.id}`, updatedUser); // Replace with your API update endpoint
      setUserRecords((prev) =>
        prev.map((user) => (user.id === updatedUser.id ? updatedUser : user))
      );
      setFilteredRecords((prev) =>
        prev.map((user) => (user.id === updatedUser.id ? updatedUser : user))
      );
      message.success("تم تحديث المستخدم بنجاح");
      setEditModalVisible(false);
    } catch (error) {
      console.error("Error updating user:", error);
      message.error("فشل تحديث المستخدم");
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
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <Button
            type="primary"
            style={{
              backgroundColor: "#1890ff",
              border: "none",
              color: "#fff",
              borderRadius: "4px",
            }}
            onClick={() => handleEdit(record)}
          >
            تعديل
          </Button>
          <Button
            type="primary"
            danger
            style={{
              backgroundColor: "#ff4d4f",
              border: "none",
              color: "#fff",
              borderRadius: "4px",
            }}
            onClick={() => handleDelete(record.id)}
          >
            حذف
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Dashboard />
      <div className="admin-user-management-container" dir="rtl">
        <h1 className="admin-header">إدارة المستخدمين</h1>

        {/* Filter Section */}
        <div className="filter-section">
          <TextFieldForm
            fields={[
              {
                name: "username",
                label: "اسم المستخدم",
                type: "text",
              },
              {
                name: "role",
                label: "الصلاحية",
                type: "dropdown",
                options: [
                  { value: "admin", label: "مدير" },
                  { value: "manager", label: "مدير قسم" },
                  { value: "employee", label: "موظف" },
                ],
              },
              {
                name: "governorate",
                label: "المحافظة",
                type: "dropdown",
                options: [
                  { value: "بغداد", label: "بغداد" },
                  { value: "نينوى", label: "نينوى" },
                  { value: "البصرة", label: "البصرة" },
                ],
              },
              {
                name: "officeName",
                label: "اسم المكتب",
                type: "dropdown",
                options: [
                  { value: "المكتب الرئيسي", label: "المكتب الرئيسي" },
                  { value: "مكتب الفرع", label: "مكتب الفرع" },
                  { value: "مكتب الجنوب", label: "مكتب الجنوب" },
                ],
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

        {/* Data Table Section */}
        <div className="data-table-container">
          <div className="add-button-container">
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
          </div>
          <Spin spinning={loading}>
            <Table
              dataSource={filteredRecords.length > 0 ? filteredRecords : userRecords}
              columns={columns}
              rowKey="id"
              bordered
              pagination={{ pageSize: 5 }}
            />
          </Spin>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        title="إضافة مستخدم جديد"
        visible={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAddUser} layout="vertical">
          <Form.Item
            name="username"
            label="اسم المستخدم"
            rules={[{ required: true, message: "يرجى إدخال اسم المستخدم" }]}
          >
            <Input placeholder="اسم المستخدم" />
          </Form.Item>
          <Form.Item
            name="role"
            label="الصلاحية"
            rules={[{ required: true, message: "يرجى اختيار الصلاحية" }]}
          >
            <Select placeholder="اختر الصلاحية">
              <Option value="admin">مدير</Option>
              <Option value="manager">مدير قسم</Option>
              <Option value="employee">موظف</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="governorate"
            label="المحافظة"
            rules={[{ required: true, message: "يرجى اختيار المحافظة" }]}
          >
            <Select placeholder="اختر المحافظة">
              <Option value="بغداد">بغداد</Option>
              <Option value="نينوى">نينوى</Option>
              <Option value="البصرة">البصرة</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="officeName"
            label="اسم المكتب"
            rules={[{ required: true, message: "يرجى إدخال اسم المكتب" }]}
          >
            <Input placeholder="اسم المكتب" />
          </Form.Item>
          <Form.Item
            name="password"
            label="كلمة السر"
            rules={[{ required: true, message: "يرجى إدخال كلمة السر" }]}
          >
            <Input.Password placeholder="كلمة السر" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            إضافة
          </Button>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        title="تعديل المستخدم"
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
      >
        <Form form={editForm} onFinish={handleEditSubmit} layout="vertical">
          <Form.Item
            name="username"
            label="اسم المستخدم"
            rules={[{ required: true, message: "يرجى إدخال اسم المستخدم" }]}
          >
            <Input placeholder="اسم المستخدم" />
          </Form.Item>
          <Form.Item
            name="role"
            label="الصلاحية"
            rules={[{ required: true, message: "يرجى اختيار الصلاحية" }]}
          >
            <Select placeholder="اختر الصلاحية">
              <Option value="admin">مدير</Option>
              <Option value="manager">مدير قسم</Option>
              <Option value="employee">موظف</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="governorate"
            label="المحافظة"
            rules={[{ required: true, message: "يرجى اختيار المحافظة" }]}
          >
            <Select placeholder="اختر المحافظة">
              <Option value="بغداد">بغداد</Option>
              <Option value="نينوى">نينوى</Option>
              <Option value="البصرة">البصرة</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="officeName"
            label="اسم المكتب"
            rules={[{ required: true, message: "يرجى إدخال اسم المكتب" }]}
          >
            <Input placeholder="اسم المكتب" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            حفظ التعديلات
          </Button>
        </Form>
      </Modal>
    </>
  );
};

export default AdminUserManagment;
