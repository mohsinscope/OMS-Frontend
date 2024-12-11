import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Modal, Button, Form, Input, DatePicker, message } from "antd";
import TextFieldForm from "../../../reusable elements/ReuseAbleTextField.jsx";
import "./superVisorDeviceShow.css";

const SuperVisorDeviceShow = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state?.data || {}; // Retrieve data from the previous page
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editedData, setEditedData] = useState({ ...data }); // Store editable data
  const [form] = Form.useForm();

  // Handle Back Button
  const handleBack = () => {
    navigate(-1); // Go back to the previous page
  };

  // Handle Edit Button
  const handleEditClick = () => {
    setIsModalVisible(true);
    form.setFieldsValue(editedData); // Populate form with existing data
  };

  // Handle Modal Cancel
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // Handle Form Submit
  const handleFormSubmit = (values) => {
    const updatedData = {
      ...editedData,
      ...values,
      date: values.date?.format("YYYY-MM-DD") || editedData.date,
    };
    setEditedData(updatedData);
    message.success("تم تحديث البيانات بنجاح");
    setIsModalVisible(false);
    console.log("Updated Data:", updatedData); // Replace with API call to save changes
  };

  // Define the fields for TextFieldForm
  const fields = [
    {
      name: "deviceNumber",
      label: "رقم الجهاز",
      type: "text",
      value: editedData.deviceNumber || "غير متوفر",
      disabled: true,
    },
    {
      name: "issueReason",
      label: "سبب العطل",
      type: "text",
      value: editedData.issueReason || "غير متوفر",
      disabled: true,
    },
    {
      name: "date",
      label: "التاريخ",
      type: "date",
      value: editedData.date || "غير متوفر",
      disabled: true,
    },
    {
      name: "notes",
      label: "الملاحظات",
      type: "textarea",
      value: editedData.notes || "لا توجد ملاحظات",
      disabled: true,
    },
  ];

  return (
    <div className="supervisor-device-show-container" dir="rtl">
      <h1>عرض الجهاز</h1>

      <div className="device-details-container">
        {/* Text Form for Fields */}
        <div className="device-details-fields">
          <TextFieldForm
            fields={fields}
            formClassName="device-details-form"
            inputClassName="device-details-input"
            fieldWrapperClassName="device-field-wrapper"
            textareaClassName="device-notes-field"
            hideButtons={true} // Hide buttons if not needed
          />
        </div>

        {/* Display Device Image */}
        <div className="device-image-container">
          <button className="edit-button" onClick={handleEditClick}>
            التعديل
          </button>
          <img
            src={editedData.image || "/placeholder.jpg"} // Default placeholder if no image is provided
            alt="صورة الجهاز"
            className="device-preview-image"
          />
          <p className="device-image-caption">اضغط للتكبير</p>
        </div>
      </div>

      {/* Back Button */}
      <div className="device-back-button-container">
        <Button onClick={handleBack} className="device-back-button">
          الرجوع
        </Button>
      </div>

      {/* Edit Modal */}
      <Modal
        title="تعديل بيانات الجهاز"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
        style={{ direction: "rtl" }}
      >
        <Form
          form={form}
          onFinish={handleFormSubmit}
          layout="vertical"
          style={{ direction: "rtl" }}
        >
          <Form.Item
            name="deviceNumber"
            label="رقم الجهاز"
            rules={[{ required: true, message: "يرجى إدخال رقم الجهاز" }]}
          >
            <Input style={{ padding: "10px" }} />
          </Form.Item>
          <Form.Item
            name="issueReason"
            label="سبب العطل"
            rules={[{ required: true, message: "يرجى إدخال سبب العطل" }]}
          >
            <Input style={{ padding: "10px" }} />
          </Form.Item>
          <Form.Item
            name="date"
            label="التاريخ"
            rules={[{ required: true, message: "يرجى إدخال التاريخ" }]}
          >
            <DatePicker format="YYYY-MM-DD" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="notes" label="الملاحظات">
            <Input.TextArea rows={4} style={{ padding: "20px" }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            حفظ التعديلات
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default SuperVisorDeviceShow;
