import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, ConfigProvider, message, Checkbox, Space } from 'antd';
import { Check } from 'lucide-react';
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

const PermissionsModal = ({ visible, onCancel, userId }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [allPermissions, setAllPermissions] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [userRoles, setUserRoles] = useState([]);

  // Fetch all available permissions
  useEffect(() => {
    const fetchAllPermissions = async () => {
      try {
        const response = await axiosInstance.get(`${Url}/api/Permission/all-permissions`);
        setAllPermissions(response.data);
      } catch (error) {
        console.error('Error fetching all permissions:', error);
        message.error('فشل في جلب قائمة الصلاحيات');
      }
    };

    if (visible) {
      fetchAllPermissions();
    }
  }, [visible]);

  // Fetch user's current permissions
  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`${Url}/api/Permission/${userId}/permissions`);
        setUserRoles(response.data.roles || []);
        setUserPermissions(response.data.permissions?.AllPermissions || []);
        setSelectedPermissions(response.data.permissions?.AllPermissions || []);
      } catch (error) {
        console.error('Error fetching user permissions:', error);
        message.error('فشل في جلب صلاحيات المستخدم');
      } finally {
        setLoading(false);
      }
    };

    if (visible && userId) {
      fetchUserPermissions();
    }
  }, [visible, userId]);

  const handlePermissionToggle = (permission) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission);
      }
      return [...prev, permission];
    });
  };

  const handleUpdatePermissions = async () => {
    try {
      setLoading(true);
      await axiosInstance.put(
        `${Url}/api/Permission/${userId}/permissions`,
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
        `${Url}/api/Permission/${userId}/add-permissions`,
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
      title="إدارة الصلاحيات"
      footer={null}
    >
      <div className="space-y-4">
        {/* User Roles Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">الأدوار الحالية</h3>
          <p>{userRoles.length > 0 ? userRoles.join(', ') : 'لا توجد أدوار'}</p>
        </div>

        {/* Permissions Grid */}
        <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto p-4">
          {allPermissions.map((permission) => (
            <div 
              key={permission}
              className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50"
            >
              <Checkbox
                checked={selectedPermissions.includes(permission)}
                onChange={() => handlePermissionToggle(permission)}
              />
              <span className="flex-1">{permission}</span>
              {userPermissions.includes(permission) && (
                <Check className="h-4 w-4 text-green-500" />
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            type="primary"
            onClick={handleUpdatePermissions}
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

  const handleFinish = async (values) => {
    try {
      console.log('Form values being submitted:', values);  // Debug log
      
      // Add validation before submitting
      const requiredFields = ['fullName', 'roles', 'position', 'governorate', 'officeName'];
      const missingFields = requiredFields.filter(field => !values[field]);
      
      if (missingFields.length > 0) {
        console.log('Missing fields:', missingFields); // Debug log
        message.error(`Missing required fields: ${missingFields.join(', ')}`);
        return;
      }
  
      // Add loading state
      form.setFields([{ name: '_loading', value: true }]);
      
      // Call the parent onFinish function
      await onFinish(values);
      
    } catch (error) {
      console.error('Error details:', error); // More detailed error logging
      message.error('فشل في تحديث المستخدم');
    } finally {
      form.setFields([{ name: '_loading', value: false }]);
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
              dropdownMatchSelectWidth={false}
              listHeight={256}
              maxTagCount="responsive"
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
            <Select 
              placeholder="اختر المنصب"
              dropdownMatchSelectWidth={false}
              listHeight={256}
            >
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
              dropdownMatchSelectWidth={false}
              listHeight={256}
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
              dropdownMatchSelectWidth={false}
              listHeight={256}
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
              className="flex-1"
            >
              اعادة تعيين كلمة السر
            </Button>
            {isSuperAdmin && (
              <Button 
                type="default" 
                onClick={() => setIsPermissionsModalVisible(true)}
                className="flex-1"
              >
                الصلاحيات الخاصة
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
      />
    </ConfigProvider>
  );
};

export default EditUserModal;