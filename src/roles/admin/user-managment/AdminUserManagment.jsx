import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Form,
  Input,
  Select,
  message,
  Spin,
  ConfigProvider,
  Modal
} from "antd";
import axiosInstance from './../../../intercepters/axiosInstance.js';
import Dashboard from "./../../../pages/dashBoard.jsx";
import "./AdminUserManagment.css";
import useAuthStore from "./../../../store/store.js";
import Url from "./../../../store/url.js";

const { Option } = Select;

const AddUserModal = ({ 
  visible, 
  onCancel, 
  onFinish, 
  form, 
  roles, 
  governorates, 
  offices, 
  selectedGovernorate, 
  onGovernorateChange 
}) => {
  return (
    <Modal
      title="إضافة مستخدم جديد"
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Form
        form={form}
        onFinish={onFinish}
        layout="vertical"
        dir="rtl"
      >
        <Form.Item
          name="username"
          label="اسم المستخدم"
          rules={[{ required: true, message: 'الرجاء إدخال اسم المستخدم' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="password"
          label="كلمة المرور"
          rules={[{ required: true, message: 'الرجاء إدخال كلمة المرور' }]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          name="fullName"
          label="الاسم الكامل"
          rules={[{ required: true, message: 'الرجاء إدخال الاسم الكامل' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="roles"
          label="الصلاحيات"
          rules={[{ required: true, message: 'الرجاء اختيار الصلاحيات' }]}
        >
          <Select mode="multiple">
            {roles.map(role => (
              <Option key={role} value={role}>{role}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="position"
          label="المنصب"
          rules={[{ required: true, message: 'الرجاء إدخال المنصب' }]}
        >
          <Input type="number" />
        </Form.Item>

        <Form.Item
          name="governorate"
          label="المحافظة"
          rules={[{ required: true, message: 'الرجاء اختيار المحافظة' }]}
        >
          <Select onChange={onGovernorateChange}>
            {governorates.map(gov => (
              <Option key={gov.id} value={gov.id}>{gov.name}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="officeName"
          label="اسم المكتب"
          rules={[{ required: true, message: 'الرجاء اختيار المكتب' }]}
        >
          <Select disabled={!selectedGovernorate}>
            {offices.map(office => (
              <Option key={office.id} value={office.id}>{office.name}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            إضافة
          </Button>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            إلغاء
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

const EditUserModal = ({
  visible,
  onCancel,
  onFinish,
  form,
  roles,
  governorates,
  offices,
  selectedGovernorate,
  setSelectedGovernorate,
  selectedUser
}) => {
  return (
    <Modal
      title="تعديل المستخدم"
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Form
        form={form}
        onFinish={onFinish}
        layout="vertical"
        dir="rtl"
        initialValues={selectedUser}
      >
        <Form.Item
          name="fullName"
          label="الاسم الكامل"
          rules={[{ required: true, message: 'الرجاء إدخال الاسم الكامل' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="roles"
          label="الصلاحيات"
          rules={[{ required: true, message: 'الرجاء اختيار الصلاحيات' }]}
        >
          <Select mode="multiple">
            {roles.map(role => (
              <Option key={role} value={role}>{role}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="position"
          label="المنصب"
          rules={[{ required: true, message: 'الرجاء إدخال المنصب' }]}
        >
          <Input type="number" />
        </Form.Item>

        <Form.Item
          name="governorate"
          label="المحافظة"
          rules={[{ required: true, message: 'الرجاء اختيار المحافظة' }]}
        >
          <Select onChange={setSelectedGovernorate}>
            {governorates.map(gov => (
              <Option key={gov.id} value={gov.id}>{gov.name}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="officeName"
          label="اسم المكتب"
          rules={[{ required: true, message: 'الرجاء اختيار المكتب' }]}
        >
          <Select disabled={!selectedGovernorate}>
            {offices.map(office => (
              <Option key={office.id} value={office.id}>{office.name}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            حفظ التغييرات
          </Button>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            إلغاء
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

const AdminUserManagment = () => {
  const [userRecords, setUserRecords] = useState([]);
  const [roles, setRoles] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [filterForm] = Form.useForm();
  const [form] = Form.useForm();
  const { accessToken } = useAuthStore();
  const { searchVisible } = useAuthStore();
  const { isSidebarCollapsed } = useAuthStore();
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const fetchOffices = async (governorateId) => {
    if (governorateId) {
      try {
        const response = await axiosInstance.get(`${Url}/api/Governorate/dropdown/${governorateId}`);
        if (response.data && response.data[0] && Array.isArray(response.data[0].offices)) {
          setOffices(response.data[0].offices);
        } else {
          setOffices([]);
        }
      } catch (error) {
        console.error("Error fetching offices:", error);
        message.error("Failed to load offices");
        setOffices([]);
      }
    } else {
      setOffices([]);
    }
  };

  const handleGovernorateChange = async (value) => {
    setSelectedGovernorate(value);
    filterForm.setFieldValue('officeName', undefined);
    if (value) {
      await fetchOffices(value);
    }
  };

  const fetchUserData = async (pageNumber = 1, pageSize = 10, filters = {}) => {
    setLoading(true);
    try {
      const payload = {
        fullName: filters.fullName || "",
        officeId: filters.officeId || null,
        governorateId: filters.governorateId || null,
        roles: filters.roles || [],
        paginationParams: {
          pageNumber: pageNumber,
          pageSize: pageSize
        }
      };

      const response = await axiosInstance.post(
        `${Url}/api/profile/search`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setUserRecords(Array.isArray(response.data) ? response.data : response.data.items || []);
      
      const paginationHeader = response.headers["pagination"];
      if (paginationHeader) {
        const paginationInfo = JSON.parse(paginationHeader);
        setPagination({
          ...pagination,
          total: paginationInfo.totalItems
        });
      } else {
        setPagination({
          ...pagination,
          total: Array.isArray(response.data) ? response.data.length : (response.data.totalCount || response.data.items?.length || 0)
        });
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
      message.error("Failed to load data");
      setUserRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData(1, 10, { roles: [] });
  }, []);

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
        console.error("Error fetching initial data:", error);
        message.error("Failed to load dropdown data");
      }
    };
    fetchInitialData();
  }, []);

  const handleTableChange = (pagination, filters) => {
    fetchUserData(pagination.current, pagination.pageSize, {
      roles: []
    });
  };

  const handleFilterSubmit = (values) => {
    fetchUserData(1, pagination.pageSize, {
      fullName: values.username || "",
      officeId: values.officeName || null,
      governorateId: values.governorate || null,
      roles: values.role ? [values.role] : []
    });
  };

  const resetFilters = () => {
    filterForm.resetFields();
    fetchUserData(1, pagination.pageSize, { roles: [] });
  };

  const handleAddUser = async (values) => {
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

      await axiosInstance.post(`${Url}/api/account/register`, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      message.success("تمت إضافة المستخدم بنجاح!");
      closeAddModal();
      fetchUserData(pagination.current, pagination.pageSize, { roles: [] });
    } catch (error) {
      console.error("Error adding user:", error);
      message.error("فشل في إضافة المستخدم");
    }
  };

  const handleEditUser = async (user) => {
    setSelectedUser(user);
    setSelectedGovernorate(user.governorateId);
    await fetchOffices(user.governorateId);
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
      closeEditModal();
      fetchUserData(pagination.current, pagination.pageSize, { roles: [] });
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
    setOffices([]);
    form.resetFields();
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setSelectedGovernorate(null);
    setOffices([]);
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
          onClick={() => handleEditUser(record)}
          className="actions-button-usermanagement"
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
          isSidebarCollapsed ? "sidebar-collapsed" : ""
        }`}
        dir="rtl"
      >
        <h1 className="admin-header">إدارة المستخدمين</h1>

        <div
          className={`filter-section ${
            searchVisible ? "animate-show" : "animate-hide"
          }`}
        >
          <Form
            form={filterForm}
            layout="horizontal"
            onFinish={handleFilterSubmit}
            className="filter-form"
          >
            <Form.Item name="username" label="اسم المستخدم">
              <Input className="filter-input" />
            </Form.Item>

            <Form.Item name="role" label="الصلاحيات">
              <Select className="filter-dropdown" allowClear>
                {roles.map((role) => (
                  <Option key={role} value={role}>{role}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="governorate" label="المحافظة">
              <Select 
                className="filter-dropdown" 
                onChange={handleGovernorateChange}
                allowClear
              >
                {governorates.map((gov) => (
                  <Option key={gov.id} value={gov.id}>{gov.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="officeName" label="اسم المكتب">
              <Select 
                className="filter-dropdown"
                disabled={!selectedGovernorate}
                allowClear
              >
                {offices.map((office) => (
                  <Option key={office.id} value={office.id}>{office.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className="filter-button">
                بحث
              </Button>
              <Button onClick={resetFilters} className="filter-button" style={{ marginRight: '8px' }}>
                إعادة تعيين
              </Button>
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
            </Form.Item>
          </Form>
        </div>


        <div className="data-table-container">
          <Spin spinning={loading}>
            <Table
              dataSource={userRecords}
              columns={columns}
              rowKey="userId"
              bordered
              pagination={{
                ...pagination,
                position: ["bottomCenter"]
              }}              
              onChange={handleTableChange}
            />
          </Spin>
        </div>

        {/* Add User Modal */}
        <AddUserModal 
          visible={addModalVisible}
          onCancel={closeAddModal}
          onFinish={handleAddUser}
          form={form}
          roles={roles}
          governorates={governorates}
          offices={offices}
          selectedGovernorate={selectedGovernorate}
          onGovernorateChange={handleGovernorateChange}
        />

        {/* Edit User Modal */}
        <EditUserModal
          visible={editModalVisible}
          onCancel={closeEditModal}
          onFinish={handleSaveEdit}
          form={form}
          roles={roles}
          governorates={governorates}
          offices={offices}
          selectedGovernorate={selectedGovernorate}
          setSelectedGovernorate={handleGovernorateChange}
          selectedUser={selectedUser}
        />
      </div>
    </>
  );
};

export default AdminUserManagment;