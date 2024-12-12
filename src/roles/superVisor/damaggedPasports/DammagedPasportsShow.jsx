import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Modal, Button, Form, Input, DatePicker, message } from "antd";
import TextFieldForm from "../../../reusable elements/ReuseAbleTextField.jsx";
import "./dammagedPasportsShow.css";
import ImagePreviewer from "./../../../reusable/ImagePreViewer.jsx";
const DammagedPasportsShow = () => {
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
      name: "passportNumber",
      label: "رقم الجواز",
      type: "text",
      value: editedData.passportNumber || "غير متوفر",
      disabled: true,
    },
    {
      name: "damageReason",
      label: "سبب التلف",
      type: "text",
      value: editedData.damageReason || "غير متوفر",
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
    <div className="supervisor-passport-damage-show-container" dir="rtl">
      <h1>الجواز التالف</h1>

      <div className="details-container">
        {/* Text Form for Fields */}
        <div className="details-fields">
          <TextFieldForm
            fields={fields}
            formClassName="passport-details-form"
            inputClassName="passport-details-input"
            fieldWrapperClassName="passport-field-wrapper"
            textareaClassName="passport-notes-field"
            hideButtons={true} // Hide buttons if not needed
          />
        </div>

        {/* Display Passport Image */}
        <div className="image-container">
          <button className="edit-button" onClick={handleEditClick}>
            التعديل
          </button>
          <img
            src={editedData.image || "/placeholder.jpg"} // Default placeholder if no image is provided
            alt="صورة الجواز التالف"
            className="preview-image"
          />
          <p className="image-caption">اضغط للتكبير</p>
        </div>
      </div>

      {/* Back Button */}
      <div className="back-button-container">
        <button onClick={handleBack} className="back-button">
          الرجوع
        </button>
      </div>

      {/* Edit Modal */}
      <Modal
        title="تعديل الجواز التالف"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
        style={{ direction: "rtl" }}>
        <Form
          form={form}
          onFinish={handleFormSubmit}
          layout="vertical"
          style={{ direction: "rtl" }}>
          <Form.Item
            name="passportNumber"
            label="رقم الجواز"
            rules={[{ required: true, message: "يرجى إدخال رقم الجواز" }]}>
            <Input style={{ padding: "10px" }} />
          </Form.Item>
          <Form.Item
            name="damageReason"
            label="سبب التلف"
            rules={[{ required: true, message: "يرجى إدخال سبب التلف" }]}>
            <Input style={{ padding: "10px" }} />
          </Form.Item>
          <Form.Item
            name="date"
            label="التاريخ"
            rules={[{ required: true, message: "يرجى إدخال التاريخ" }]}>
            <DatePicker format="YYYY-MM-DD" style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="notes" label="الملاحظات">
            <Input.TextArea rows={4} style={{ padding: "20px" }} />
          </Form.Item>

          {/* Image Previewer */}
          <div className="image-previewer-section">
            <h3>المرفقات</h3>
            <ImagePreviewer />
          </div>

          <Button
            style={{ padding: "20px", marginTop: "20px" }}
            type="primary"
            htmlType="submit"
            block>
            حفظ التعديلات
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default DammagedPasportsShow;
