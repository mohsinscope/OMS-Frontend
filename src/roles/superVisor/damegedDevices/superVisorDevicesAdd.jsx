import React from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, message } from "antd";
import TextFieldForm from "../../../reusable elements/ReuseAbleTextField.jsx";
import ImagePreviewer from "../../../reusable/ImagePreViewer"; // Import your image previewer component
import "./superVisorDevicesAdd.css"; // Use unique styles for devices

const SuperVisorDevicesAdd = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Handle Back Button
  const handleBack = () => {
    navigate(-1); // Go back to the previous page
  };

  // Handle Form Submit
  const handleFormSubmit = async (values) => {
    const payload = {
      ...values,
      date: values.date?.format("YYYY-MM-DD"), // Format the date
    };

    try {
      await axios.post("/api/devices", payload); // Replace with your API endpoint
      message.success("تم إرسال البيانات بنجاح");
      navigate(-1); // Navigate back after successful submission
    } catch (error) {
      console.error("Error submitting data:", error);
      message.error("حدث خطأ أثناء إرسال البيانات");
    }
  };

  // Define Fields for Reusable Component
  const fields = [
    {
      name: "deviceNumber",
      label: "رقم الجهاز",
      type: "text",
      placeholder: "أدخل رقم الجهاز",
      rules: [{ required: true, message: "يرجى إدخال رقم الجهاز" }],
    },
    {
      name: "damageReason",
      label: "سبب العطل",
      type: "text",
      placeholder: "أدخل سبب العطل",
      rules: [{ required: true, message: "يرجى إدخال سبب العطل" }],
    },
    {
      name: "date",
      label: "التاريخ",
      type: "date",
      placeholder: "اختر التاريخ",
      style: { width: "100%" }, // Full width for the date picker
      rules: [{ required: true, message: "يرجى اختيار التاريخ" }],
    },
    {
      name: "notes",
      label: "الملاحظات",
      type: "textarea",
      placeholder: "أدخل الملاحظات",
      rows: 4,
    },
  ];

  return (
    <div className="supervisor-devices-add-container" dir="rtl">
      <h1>إضافة جهاز جديد</h1>

      <div className="devices-add-details-container">
        {/* Reusable TextFieldForm for Input Fields */}
        <Form
          form={form}
          onFinish={handleFormSubmit}
          layout="vertical"
          style={{ direction: "rtl" }}
        >
          <TextFieldForm
            fields={fields}
            formClassName="device-details-form"
            inputClassName="device-details-input"
            fieldWrapperClassName="device-field-wrapper"
            textareaClassName="device-notes-field"
            hideButtons={true} // Hide default buttons from TextFieldForm
          />
        </Form>

        {/* Image Uploader Section */}
        <div className="device-image-previewer-section">
          <ImagePreviewer />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="device-action-buttons-container">
        <Button
          type="primary"
          htmlType="submit"
          className="device-submit-button"
        >
          الإرسال
        </Button>
        <Button onClick={handleBack} className="device-back-button">
          الرجوع
        </Button>
      </div>
    </div>
  );
};

export default SuperVisorDevicesAdd;
