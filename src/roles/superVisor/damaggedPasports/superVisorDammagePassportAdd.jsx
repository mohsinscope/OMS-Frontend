// Import necessary React and utility modules
import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // For navigation after form submission
import { Form, Input, Button, DatePicker, message, Upload } from "antd"; // Ant Design components
import axios from "axios"; // HTTP client for API requests
import Url from "./../../../store/url.js"; // Centralized file for storing API base URLs
import useAuthStore from "../../../store/store"; // Authentication store to get accessToken
import moment from "moment"; // For handling date formats

// Ant Design's Dragger component for drag-and-drop file uploads
const { Dragger } = Upload;

// Functional component for the supervisor to add damaged passport records
const SuperVisorDammagePassportAdd = () => {
  const navigate = useNavigate(); // Hook to navigate back after form submission
  const [form] = Form.useForm(); // Ant Design's form hook for form handling
  const [fileList, setFileList] = useState([]); // State to track uploaded files
  const [isSubmitting, setIsSubmitting] = useState(false); // State to track if form submission is in progress

  // Access the accessToken from the authentication store
  const { accessToken } = useAuthStore();

  // Static IDs for office, governorate, and profile (could be replaced with dynamic values)
  const staticOfficeId = 1; // Placeholder office ID
  const staticGovernorateId = 1; // Placeholder governorate ID
  const staticProfileId = 2; // Placeholder profile ID

  // Function to navigate back to the previous page
  const handleBack = () => {
    navigate(-1); // Navigate one step back
  };

  // Function to attach files to the entity (damaged passport record)
  const attachFiles = async (entityId) => {
    for (const file of fileList) {
      // Create a FormData object for file upload
      const formData = new FormData();
      formData.append("file", file.originFileObj); // Attach file
      formData.append("entityId", entityId); // Include entityId from damaged passport API
      formData.append("EntityType", "DamagedPassport"); // Static entity type for damaged passport

      try {
        // Log the payload being sent to the backend
        console.log("Sending Attachment Payload:", formData);

        // Send POST request to the attachment API
        const response = await axios.post(`${Url}/api/Attachment/add-attachment`, formData, {
          headers: {
            "Content-Type": "multipart/form-data", // Ensure the payload is treated as form data
            Authorization: `Bearer ${accessToken}`, // Pass JWT for authentication
          },
        });

        // Log the API response for debugging
        console.log("Attachment Response:", response.data);
      } catch (error) {
        console.error("Attachment Error Details:", error.response?.data || error.message); // Log detailed error
        throw new Error("Failed to attach files. Operation aborted."); // Stop further execution on error
      }
    }
  };

  // Function to handle form submission
  const handleFormSubmit = async (values) => {
    if (isSubmitting) return; // Prevent duplicate submissions
    setIsSubmitting(true); // Set submission state to true

    try {
      // Step 1: Create Damaged Passport Record
      const payload = {
        passportNumber: values.passportNumber, // Passport number from form input
        date: values.date
          ? values.date.format("YYYY-MM-DDTHH:mm:ss.SSSZ") // Convert date to ISO string
          : moment().format("YYYY-MM-DDTHH:mm:ss.SSSZ"), // Default to current date if not provided
        damagedTypeId: values.damagedTypeId, // Damage type ID from form input
        officeId: staticOfficeId, // Static office ID
        governorateId: staticGovernorateId, // Static governorate ID
        profileId: staticProfileId, // Static profile ID
      };

      // Log the payload for debugging
      console.log("Submitting Damaged Passport Payload:", payload);

      // Send POST request to create a damaged passport
      const damagedPassportResponse = await axios.post(`${Url}/api/DamagedPassport`, payload, {
        headers: {
          "Content-Type": "application/json", // Payload is JSON
          Authorization: `Bearer ${accessToken}`, // Include JWT for authentication
        },
      });

      // Log the API response
      console.log("Damaged Passport Response:", damagedPassportResponse);

      // Extract entityId from the response
      const entityId = damagedPassportResponse.data?.id || damagedPassportResponse.data;

      // Validate entityId
      if (!entityId) {
        console.error("DamagedPassport response does not contain 'id'. Full response:", damagedPassportResponse.data);
        throw new Error("Failed to retrieve entity ID from the response.");
      }

      console.log("Entity ID:", entityId); // Log the entity ID for debugging

      // Step 2: Attach Files (if any)
      if (fileList.length > 0) {
        try {
          await attachFiles(entityId); // Attach files using the retrieved entityId
          message.success("تم إرسال البيانات والمرفقات بنجاح"); // Success message
        } catch (attachmentError) {
          console.error("Attachment Error:", attachmentError); // Log error
          throw new Error("Failed to attach files. Operation aborted."); // Abort on failure
        }
      } else {
        message.success("تم إرسال البيانات بنجاح بدون مرفقات"); // Success message without attachments
      }

      navigate(-1); // Navigate back on successful submission
    } catch (error) {
      console.error("Submission Error:", error); // Log submission error
      message.error(error.message || "حدث خطأ أثناء إرسال البيانات أو المرفقات"); // Show error message to user
    } finally {
      setIsSubmitting(false); // Reset submission state
    }
  };

  return (
    <div className="supervisor-damaged-passport-add-container" dir="rtl">
      <h1>إضافة جواز تالف</h1> {/* Title in Arabic */}
      <div className="add-details-container">
        <Form
          form={form} // Attach form instance
          onFinish={handleFormSubmit} // Handle form submission
          layout="vertical" // Vertical form layout
          style={{ direction: "rtl" }} // Right-to-left direction for Arabic
        >
          {/* Passport Number Input */}
          <Form.Item
            name="passportNumber"
            label="رقم الجواز"
            rules={[{ required: true, message: "يرجى إدخال رقم الجواز" }]} // Validation rule
          >
            <Input placeholder="أدخل رقم الجواز" /> {/* Input field for passport number */}
          </Form.Item>

          {/* Damage Type Input */}
          <Form.Item
            name="damagedTypeId"
            label="سبب التلف"
            rules={[{ required: true, message: "يرجى إدخال سبب التلف كرقم" }]} // Validation rule
          >
            <Input placeholder="أدخل سبب التلف (رقم)" type="number" /> {/* Input field for damage type */}
          </Form.Item>

          {/* Date Picker */}
          <Form.Item
            name="date"
            label="التاريخ"
            rules={[{ required: true, message: "يرجى اختيار التاريخ" }]} // Validation rule
          >
            <DatePicker placeholder="اختر التاريخ" style={{ width: "100%" }} /> {/* Date picker */}
          </Form.Item>

          {/* File Uploader */}
          <Dragger
            fileList={fileList} // Track selected files
            onChange={(info) => setFileList(info.fileList)} // Update file list on change
            beforeUpload={() => false} // Prevent automatic upload
            multiple // Allow multiple files
          >
            <p className="ant-upload-drag-icon">📂</p>
            <p>قم بسحب الملفات أو الضغط هنا لتحميلها</p> {/* Instruction in Arabic */}
          </Dragger>

          {/* Action Buttons */}
          <div className="image-previewer-section">
            <Button
              type="primary"
              htmlType="submit"
              className="submit-button"
              loading={isSubmitting} // Show loading spinner while submitting
              disabled={isSubmitting} // Disable button during submission
            >
              الإرسال
            </Button>
            <Button onClick={handleBack} className="add-back-button" disabled={isSubmitting}>
              الرجوع
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default SuperVisorDammagePassportAdd;
