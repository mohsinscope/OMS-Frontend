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
import AddUserModal from './addUserModal.jsx';
import EditUserModal from './editUserManagment.jsx';

const { Option } = Select;

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
  const [currentFilters, setCurrentFilters] = useState({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    position: ['bottomCenter']
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

  const fetchUserData = async (page = pagination.current, pageSize = pagination.pageSize, filters = currentFilters) => {
    setLoading(true);
    try {
      const payload = {
        fullName: filters.fullName || "",
        officeId: filters.officeId || null,
        governorateId: filters.governorateId || null,
        roles: filters.roles || [],
        paginationParams: {
          pageNumber: page,
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

      const items = Array.isArray(response.data) ? response.data : response.data.items || [];
      setUserRecords(items);
      
      let totalItems = 0;
      const paginationHeader = response.headers["pagination"];
      if (paginationHeader) {
        const paginationInfo = JSON.parse(paginationHeader);
        totalItems = paginationInfo.totalItems;
      } else {
        totalItems = Array.isArray(response.data) ? response.data.length : (response.data.totalCount || response.data.items?.length || 0);
      }

      setPagination(prev => ({
        ...prev,
        current: page,
        pageSize: pageSize,
        total: totalItems
      }));
    } catch (error) {
      console.error("Error fetching profiles:", error);
      message.error("Failed to load data");
      setUserRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData(1, pagination.pageSize, { roles: [] });
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

  const handleTableChange = (paginationParams, filters, sorter) => {
    fetchUserData(paginationParams.current, paginationParams.pageSize, currentFilters);
  };

  const handleFilterSubmit = (values) => {
    const newFilters = {
      fullName: values.fullName || "",
      officeId: values.officeName || null,
      governorateId: values.governorate || null,
      roles: values.role ? [values.role] : []
    };
    setCurrentFilters(newFilters);
    fetchUserData(1, pagination.pageSize, newFilters);
  };

  const resetFilters = () => {
    filterForm.resetFields();
    setCurrentFilters({});
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
      setAddModalVisible(false);
      form.resetFields();
      fetchUserData(pagination.current, pagination.pageSize, currentFilters);
    } catch (error) {
      console.error("Error adding user:", error);
      message.error("فشل في إضافة المستخدم");
    }
  };
  const positionEnums = {
    'Manager': 1,
    'Director': 2,
    'Supervisor': 3,
    'Accontnt': 4,
    'FollowUpEmployee': 5,
    'ReportingAnalyst': 6,
    'Sr.Controller': 7,
    'ProjectCoordinator': 8,
    'OperationManager': 9,
    'IT': 10

  };
  const handleEditUser = async (user) => {
    setSelectedUser(user);
    setSelectedGovernorate(user.governorateId);
    await fetchOffices(user.governorateId);
      // Map the position string to its enum value
      let positionValue = user.position;
      if (typeof user.position === 'string') {
        positionValue = positionEnums[user.position] || user.position;
      }
    form.setFieldsValue({
      username: user.username,
      fullName: user.fullName,
      roles: user.roles,
      position: positionValue,
      governorate: user.governorateId,
      officeName: user.officeId,
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async (values) => {
    setLoading(true);
    try {
      if (!selectedUser || !selectedUser.userId) {
        throw new Error('No user selected');
      }

      const updatedUser = {
        userId: selectedUser.userId,
        userName: selectedUser.username,
        fullName: values.fullName,
        position: parseInt(values.position, 10),
        officeId: values.officeName,
        governorateId: values.governorate,
        roles: values.roles
      };

      if (values.newPassword) {
        updatedUser.newPassword = values.newPassword;
      }

      const response = await axiosInstance.put(
        `${Url}/api/account/${selectedUser.userId}`,
        updatedUser,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        message.success("تم تحديث المستخدم بنجاح!");
        setEditModalVisible(false);
        form.resetFields();
        await fetchUserData(pagination.current, pagination.pageSize, currentFilters);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      message.error(error.response?.data?.message || "فشل في تحديث المستخدم");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const response = await axiosInstance.delete(`${Url}/api/account/${userId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
  
      if (response.status === 200) {
        message.success("تم حذف المستخدم بنجاح!");
        await fetchUserData(pagination.current, pagination.pageSize, currentFilters);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      message.error("فشل في حذف المستخدم");
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            type="primary"
            onClick={() => handleEditUser(record)}
            className="actions-button-usermanagement"
          >
            تعديل
          </Button>
          <Button
            type="primary"
            danger
            onClick={() => {
              Modal.confirm({
                title: 'تأكيد الحذف',
                content: 'هل أنت متأكد أنك تريد حذف هذا المستخدم؟',
                okText: 'نعم',
                cancelText: 'لا',
                onOk: () => handleDeleteUser(record.userId)
              });
            }}
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
      <div
        className={`admin-user-management-container ${
          isSidebarCollapsed ? "admin-user-management-container-sidebar-collapsed" : ""
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
            <Form.Item name="fullName" label="اسم المستخدم">
              <Input />
            </Form.Item>

            <Form.Item name="role" label="الصلاحية">
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
              <Button 
                type="primary" 
                htmlType="submit" 
                className="filter-button"
              >
                بحث
              </Button>
            </Form.Item>

            <Form.Item>
              <Button onClick={resetFilters} className="filter-button">
                إعادة تعيين
              </Button>
            </Form.Item>

            <Form.Item>
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
          <ConfigProvider direction="rtl">
            <Spin spinning={loading}>
              <Table
                dataSource={userRecords}
                columns={columns}
                rowKey="userId"
                bordered
                pagination={pagination}
                onChange={handleTableChange}
              />
            </Spin>
          </ConfigProvider>
        </div>

        <AddUserModal 
          visible={addModalVisible}
          onCancel={() => {
            setAddModalVisible(false);
            form.resetFields();
          }}
          onFinish={handleAddUser}
          form={form}
          roles={roles}
          governorates={governorates}
          offices={offices}
          selectedGovernorate={selectedGovernorate}
          onGovernorateChange={handleGovernorateChange}
        />

        <EditUserModal
          visible={editModalVisible}
          onCancel={() => {
            setEditModalVisible(false);
            form.resetFields();
          }}
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