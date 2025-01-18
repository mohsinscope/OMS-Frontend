import React, { useState } from 'react';
import { Modal, Form, Input, Select, Button, ConfigProvider, message } from 'antd';
import axiosInstance from './../../../intercepters/axiosInstance.js';
import Url from './../../../store/url.js';

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
  const [isPasswordResetVisible, setIsPasswordResetVisible] = useState(false);

  const handleFinish = (values) => {
    onFinish(values);
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
            <Button 
              type="default" 
              onClick={() => setIsPasswordResetVisible(true)}
              style={{ marginBottom: 16 }}
              block
            >
              اعادة تعيين كلمة السر
            </Button>
          </div>

          <Button type="primary" htmlType="submit" block>
            حفظ التعديلات
          </Button>
        </Form>
      </Modal>

      <PasswordResetModal
        visible={isPasswordResetVisible}
        onCancel={() => setIsPasswordResetVisible(false)}
        userId={selectedUser?.userId}
      />
    </ConfigProvider>
  );
};

export default EditUserModal;