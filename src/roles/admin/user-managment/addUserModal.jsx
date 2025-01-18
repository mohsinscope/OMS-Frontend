import React from 'react';
import { Modal, Form, Input, Select, Button, ConfigProvider } from 'antd';

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
    <ConfigProvider direction="rtl">
      <Modal
        className="model-container"
        open={visible}
        onCancel={onCancel}
        style={{ top: 10 }}
        footer={null}
      >
        <Form
          form={form}
          onFinish={onFinish}
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
              <Option value={1}>Manager</Option>
              <Option value={2}>Director</Option>
              <Option value={3}>Supervisor</Option>
              <Option value={4}>Accountant</Option>
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
              onChange={onGovernorateChange}
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
  );
};

export default AddUserModal;