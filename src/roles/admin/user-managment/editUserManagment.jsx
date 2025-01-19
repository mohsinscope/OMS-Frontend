import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, ConfigProvider, message } from 'antd';
import axiosInstance from './../../../intercepters/axiosInstance.js';
import Url from './../../../store/url.js';
import useAuthStore from './../../../store/store.js';
const { Option } = Select;

const PasswordResetModal = ({ visible, onCancel, userId }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      await axiosInstance.post(`${Url}/api/account/reset-password`, {
        userId: userId,
        newPassword: values.newPassword
      });
      
      message.success('تم تغيير كلمة السر بنجاح');
      form.resetFields();
      onCancel();
    } catch (error) {
      console.error('Error resetting password:', error);
      message.error('فشل في تغيير كلمة السر');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      className="model-container"
      open={visible}
      onCancel={onCancel}
      footer={null}
    >
      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
        className="dammaged-passport-container-edit-modal"
      >
        <h1>اعادة تعيين كلمة السر</h1>
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

        <Button type="primary" htmlType="submit" block loading={loading}>
          حفظ كلمة السر الجديدة
        </Button>
      </Form>
    </Modal>
  );
};

const PermissionsModal = ({ visible, onCancel, userId, currentPermissions }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`${Url}/api/Permission/all-permissions`);
        setPermissions(response.data);
        setSelectedPermissions(currentPermissions);
      } catch (error) {
        console.error('Error fetching permissions:', error);
        message.error('فشل في جلب الصلاحيات');
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      fetchPermissions();
    }
  }, [visible, currentPermissions]);

  const handleEditPermissions = async () => {
    try {
      if (!selectedPermissions.length) {
        message.warning('الرجاء اختيار الصلاحيات أولاً');
        return;
      }

      setLoading(true);
      await axiosInstance.post(
        `${Url}/api/Permission/89a9a617-8929-47c7-bdba-3aee6dd735ab/permissions`,
        selectedPermissions
      );
      message.success('تم تحديث الصلاحيات بنجاح');
      onCancel();
    } catch (error) {
      console.error('Error updating permissions:', error);
      message.error('فشل في تحديث الصلاحيات');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPermissions = async () => {
    try {
      if (!selectedPermissions.length) {
        message.warning('الرجاء اختيار الصلاحيات أولاً');
        return;
      }

      setLoading(true);
      await axiosInstance.post(
        `${Url}/api/Permission/cc7b7aa8-cc02-43ca-86b8-ab98f093e5d0/add-permissions`,
        selectedPermissions
      );
      message.success('تم إضافة الصلاحيات بنجاح');
      onCancel();
    } catch (error) {
      console.error('Error adding permissions:', error);
      message.error('فشل في إضافة الصلاحيات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      className="model-container"
      open={visible}
      onCancel={onCancel}
      footer={null}
    >
      <div className="dammaged-passport-container-edit-modal">
        <h1>إدارة الصلاحيات</h1>
        <Form form={form} layout="vertical">
          <Form.Item
            label="الصلاحيات"
            rules={[{ required: true, message: 'الرجاء اختيار الصلاحيات' }]}
          >
            <Select
              mode="multiple"
              placeholder="اختر الصلاحيات"
              style={{ width: '100%' }}
              loading={loading}
              value={selectedPermissions}
              onChange={setSelectedPermissions}
            >
              {permissions.map((permission) => (
                <Option key={permission} value={permission}>
                  {permission}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div className="flex gap-2">
            <Button 
              type="primary"
              onClick={handleEditPermissions}
              loading={loading}
              block
            >
              تعديل الصلاحيات
            </Button>
            <Button 
              onClick={handleAddPermissions}
              loading={loading}
              block
            >
              اضافة صلاحيات
            </Button>
          </div>
        </Form>
      </div>
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
  selectedUser,
}) => {
  const userRoles = useAuthStore((state) => state.roles);
  const isSuperAdmin = userRoles.includes('SuperAdmin');
  
  const [isPasswordResetVisible, setIsPasswordResetVisible] = useState(false);
  const [isPermissionsModalVisible, setIsPermissionsModalVisible] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  useEffect(() => {
    const fetchUserPermissions = async () => {
      if (!selectedUser?.userId) return;
      
      try {
        setLoadingPermissions(true);
        const response = await axiosInstance.get(`${Url}/api/Permission/${selectedUser.userId}/permissions`);
        
        // Set the roles and permissions in their respective fields
        form.setFieldsValue({
          roles: response.data.roles || [],
          permissions: Object.keys(response.data.permissions || {})
        });
        
        // Update the selected permissions state
        const permissionsArray = Object.keys(response.data.permissions || {});
        setSelectedPermissions(permissionsArray);
      } catch (error) {
        console.error('Error fetching user permissions:', error);
        message.error('فشل في جلب صلاحيات المستخدم');
      } finally {
        setLoadingPermissions(false);
      }
    };

    if (visible && selectedUser) {
      fetchUserPermissions();
    }
  }, [visible, selectedUser, form]);

  const handleFinish = async (values) => {
    try {
      await onFinish(values);
      message.success('تم تحديث المستخدم بنجاح');
    } catch (error) {
      console.error('Error updating user:', error);
      message.error('فشل في تحديث المستخدم');
    }
  };

  return (
    <ConfigProvider direction="rtl">
      <Modal
        className="model-container"
        open={visible}
        onCancel={onCancel}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleFinish}
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
              style={{ width: '100%' }}
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
            <Select placeholder="اختر المنصب" style={{ width: '100%' }}>
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
              style={{ width: '100%' }}
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
              style={{ width: '100%' }}
              disabled={!selectedGovernorate}
            >
              {offices.map((office) => (
                <Option key={office.id} value={office.id}>
                  {office.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div className="border-t mt-4 pt-4 flex gap-2">
            <Button 
              type="default" 
              onClick={() => setIsPasswordResetVisible(true)}
              style={{ flex: 1 }}
            >
              اعادة تعيين كلمة السر
            </Button>
            {isSuperAdmin && (
              <Button 
                type="default" 
                onClick={() => setIsPermissionsModalVisible(true)}
                style={{ flex: 1 }}
              >
                تعديل الصلاحيات
              </Button>
            )}
          </div>

          <Button type="primary" htmlType="submit" block className="mt-4">
            حفظ التعديلات
          </Button>
        </Form>
      </Modal>

      <PasswordResetModal
        visible={isPasswordResetVisible}
        onCancel={() => setIsPasswordResetVisible(false)}
        userId={selectedUser?.userId}
      />

      <PermissionsModal
        visible={isPermissionsModalVisible}
        onCancel={() => setIsPermissionsModalVisible(false)}
        userId={selectedUser?.userId}
        currentPermissions={selectedPermissions}
      />
    </ConfigProvider>
  );
};

export default EditUserModal;