import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, message } from "antd";
import TextFieldForm from "../../../reusable elements/ReuseAbleTextField.jsx";
import ImagePreviewer from "../../../reusable/ImagePreViewer"; // Import your image previewer component
import "./superVisorDammagePassportAdd.css";
import axios from "axios";
import useAuthStore from "./../../../store/store"; // Import sidebar state for dynamic class handling
const SuperVisorDammagePassportAdd = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { isSidebarCollapsed } = useAuthStore(); // Access sidebar collapse state
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
      await axios.post("/api/damaged-passports", payload); // Replace with your API endpoint
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
      name: "passportNumber",
      label: "رقم الجواز",
      type: "text",
      placeholder: "",
      rules: [{ required: true, message: "يرجى إدخال رقم الجواز" }],
    },
    {
      name: "damageReason",
      label: "سبب التلف",
      type: "text",
      placeholder: "",
      rules: [{ required: true, message: "يرجى إدخال سبب التلف" }],
    },
    {
      name: "date",
      label: "التاريخ",
      type: "date",
      placeholder: "",
      style: { width: "100%" }, // Full width for the date picker
      rules: [{ required: true, message: "يرجى اختيار التاريخ" }],
    },
    {
      name: "notes",
      label: "الملاحظات",
      type: "textarea",
      placeholder: "",
      rows: 4,
    },
  ];

  return (
    <div
      className={`supervisor-damaged-passport-add-container ${
        isSidebarCollapsed
          ? "sidebar-collapsed"
          : "supervisor-damaged-passport-add-container"
      }`}
      dir="rtl">
      <h1>إضافة جواز تالف</h1>
      <div className="add-details-container">
        <div>
          {/* Reusable TextFieldForm for Input Fields */}
          <Form
            form={form}
            onFinish={handleFormSubmit}
            layout="vertical"
            style={{ direction: "rtl" }}>
            <TextFieldForm
              fields={fields}
              formClassName="passport-details-form"
              inputClassName="passport-details-input"
              fieldWrapperClassName="passport-field-wrapper"
              textareaClassName="passport-notes-field"
              hideButtons={true} // Hide default buttons from TextFieldForm
            />
          </Form>
        </div>

        {/* Back Button */}
        <div className="image-previewer-section">
          {/* Image Uploader Section */}
          <div>
            <ImagePreviewer />
          </div>
        </div>
      </div>
      <div className="image-previewer-section">
        <Button type="primary" htmlType="submit" className="submit-button">
          الإرسال
        </Button>
        <Button onClick={handleBack} className="add-back-button">
          الرجوع
        </Button>
      </div>
    </div>
  );
};

export default SuperVisorDammagePassportAdd;
