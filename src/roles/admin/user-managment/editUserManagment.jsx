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
  const [loading, setLoading] = useState(false);

  // ✅ allPermissions is now an array of objects: { permission, description }
  const [allPermissions, setAllPermissions] = useState([]);

  // ✅ userPermissions is an array of strings (permission codes) the user already has
  const [userPermissions, setUserPermissions] = useState([]);

  // ✅ selectedPermissions is a map: { [permissionCode]: description|null }
  const [selectedPermissions, setSelectedPermissions] = useState({});

  // roles from user permissions payload
  const [userRoles, setUserRoles] = useState([]);

  // Helper: build array for API from selectedPermissions map
  const buildPermissionArray = () => {
    const arr = [];
    const keys = Object.keys(selectedPermissions || {});
    for (const key of keys) {
      // Prefer description from selected map; fallback to description from allPermissions; else null
      const fromSelected = selectedPermissions[key];
      const fromAll = allPermissions.find(p => p.permission === key)?.description ?? null;
      arr.push({
        permission: key,
        description: (fromSelected ?? fromAll ?? null) || null,
      });
    }
    return arr;
  };

  // Fetch all available permissions (paged)
  useEffect(() => {
    const fetchAllPermissions = async () => {
      try {
        const response = await axiosInstance.get(
          `${Url}/api/Permission/all-permissions?pageNumber=1&pageSize=100`
        );
        // Expecting: [{ permission: "Ac", description: null }, ...]
        setAllPermissions(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching all permissions:', error);
        message.error('فشل في جلب قائمة الصلاحيات');
      }
    };

    if (visible) {
      fetchAllPermissions();
    }
  }, [visible]);

  // Fetch user's current permissions (new payload shape)
  useEffect(() => {
    const fetchUserPermissions = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`${Url}/api/Permission/${userId}/permissions`);
        // response example:
        // {
        //   "roles": ["Supervisor"],
        //   "permissions": {},
        //   "permissionDetails": [{ permission, description, source }, ...]
        // }
        const roles = response.data?.roles || [];
        const details = response.data?.permissionDetails || [];

        setUserRoles(roles);
        const currentPerms = details.map(d => d.permission);
        setUserPermissions(currentPerms);

        // Seed selected with what user already has (permission -> description)
        const seeded = {};
        details.forEach(d => {
          seeded[d.permission] = d.description ?? null;
        });
        setSelectedPermissions(seeded);
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

  const handlePermissionToggle = (permObj) => {
    const code = permObj.permission;
    setSelectedPermissions(prev => {
      const next = { ...prev };
      if (Object.prototype.hasOwnProperty.call(next, code)) {
        // remove
        delete next[code];
        return next;
      }
      // add with available description (could be null)
      next[code] = permObj.description ?? null;
      return next;
    });
  };

  const handleSavePermissions = async () => {
    try {
      setLoading(true);
      const payload = {
        permissionUpdates: buildPermissionArray()
      };
      await axiosInstance.put(
        `${Url}/api/Permission/${userId}/permissions`,
        payload
      );
      message.success('تم حفظ الصلاحيات بنجاح');
      onCancel();
    } catch (error) {
      console.error('Error updating permissions:', error);
      message.error('فشل في حفظ الصلاحيات');
    } finally {
      setLoading(false);
    }
  };

  const selectedKeys = Object.keys(selectedPermissions || {});

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
          {allPermissions.map((p) => {
            const code = p.permission;
            const isSelected = selectedKeys.includes(code);
            const isOwned = userPermissions.includes(code);

            return (
              <div
                key={code}
                className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50"
              >
                <Checkbox
                  checked={isSelected}
                  onChange={() => handlePermissionToggle(p)}
                />
                <span className="flex-1">
                  {code}
                  {typeof p.description === 'string' && p.description.trim().length > 0
                    ? ` — ${p.description}`
                    : ''}
                </span>
                {isOwned && <Check className="h-4 w-4 text-green-500" />}
              </div>
            );
          })}
        </div>

        {/* Single Save Button (PUT) */}
        <div className="flex gap-2">
          <Button
            type="primary"
            onClick={handleSavePermissions}
            loading={loading}
            block
          >
            حفظ الصلاحيات
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
      // Add validation before submitting
      const requiredFields = ['fullName', 'roles', 'position', 'governorate', 'officeName'];
      const missingFields = requiredFields.filter(field => !values[field]);

      if (missingFields.length > 0) {
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
              <Option value={10}>IT</Option>
              <Option value={11}>Expense Auditer</Option>
              <Option value={12}>Expense Manager</Option>
              <Option value={13}>Expense General Manager</Option>
              <Option value={14}>Document Auditer</Option>

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
              style={{margin:"10px 0"}}
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
