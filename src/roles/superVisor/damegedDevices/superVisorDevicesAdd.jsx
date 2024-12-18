import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, DatePicker, message, Upload } from "antd";
import axios from "axios";
import Url from "./../../../store/url.js";
import useAuthStore from "../../../store/store"; // Import the store to access JWT
import moment from "moment";

const { Dragger } = Upload;

const SuperVisorDevicesAdd = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]); // State to track uploaded files
  const [isSubmitting, setIsSubmitting] = useState(false); // Submission state tracker

  const { accessToken } = useAuthStore(); // Access JWT token from the store

  // Static IDs for office, governorate, and profile (could be replaced with dynamic values)
  const staticOfficeId = 1; // Placeholder office ID
  const staticGovernorateId = 1; // Placeholder governorate ID
  const staticProfileId = 2; // Placeholder profile ID

  // Function to navigate back
  const handleBack = () => {
    navigate(-1);
  };

  // Function to attach files to the entity
  const attachFiles = async (entityId) => {
    for (const file of fileList) {
      const formData = new FormData();
      formData.append("file", file.originFileObj); // Attach file
      formData.append("entityId", entityId); // Add entity ID from response
      formData.append("EntityType", "DamagedDevice"); // Entity type for devices

      try {
        const response = await axios.post(`${Url}/api/Attachment/add-attachment`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${accessToken}`, // Add JWT token
          },
        });
        console.log("Attachment Response:", response.data);
      } catch (error) {
        console.error("Attachment Error:", error.response?.data || error.message);
        throw new Error("Failed to attach files. Operation aborted.");
      }
    }
  };

  // Function to handle form submission
  const handleFormSubmit = async (values) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Step 1: Submit the form to create a new damaged device
      const payload = {
        deviceNumber: values.deviceNumber, // Device number
        date: values.date
          ? values.date.format("YYYY-MM-DDTHH:mm:ss.SSSZ") // Format the date
          : moment().format("YYYY-MM-DDTHH:mm:ss.SSSZ"), // Default to current date
        damageReason: values.damageReason, // Reason for the damage
        notes: values.notes || "", // Additional notes (optional)
        officeId: staticOfficeId, // Static office ID
        governorateId: staticGovernorateId, // Static governorate ID
        profileId: staticProfileId, // Static profile ID
      };

      console.log("Submitting Payload:", payload);

      const damagedDeviceResponse = await axios.post(`${Url}/api/DamagedDevice`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`, // Add JWT token
        },
      });

      console.log("Damaged Device Response:", damagedDeviceResponse);

      // Extract entity ID from the response
      const entityId = damagedDeviceResponse.data?.id || damagedDeviceResponse.data;

      if (!entityId) {
        console.error("DamagedDevice response does not contain 'id'. Full response:", damagedDeviceResponse.data);
        throw new Error("Failed to retrieve entity ID from the response.");
      }

      console.log("Entity ID:", entityId);

      // Step 2: Attach files if there are any
      if (fileList.length > 0) {
        try {
          await attachFiles(entityId); // Attach files using the retrieved entity ID
          message.success("تم إرسال البيانات والمرفقات بنجاح"); // Success message
        } catch (attachmentError) {
          console.error("Attachment Error:", attachmentError);
          throw new Error("Failed to attach files. Operation aborted.");
        }
      } else {
        message.success("تم إرسال البيانات بنجاح بدون مرفقات"); // Success message if no files
      }

      navigate(-1); // Navigate back on successful submission
    } catch (error) {
      console.error("Submission Error:", error);
      message.error(error.message || "حدث خطأ أثناء إرسال البيانات أو المرفقات"); // Show error message
    } finally {
      setIsSubmitting(false); // Reset submission state
    }
  };

  return (
    <div className="supervisor-devices-add-container" dir="rtl">
      <h1>إضافة جهاز تالف</h1> {/* Page title in Arabic */}
      <div className="devices-add-details-container">
        <Form
          form={form}
          onFinish={handleFormSubmit}
          layout="vertical"
          style={{ direction: "rtl" }}
        >
          {/* Device Number Input */}
          <Form.Item
            name="deviceNumber"
            label="رقم الجهاز"
            rules={[{ required: true, message: "يرجى إدخال رقم الجهاز" }]}
          >
            <Input placeholder="أدخل رقم الجهاز" />
          </Form.Item>

          {/* Damage Reason Input */}
          <Form.Item
            name="damageReason"
            label="سبب العطل"
            rules={[{ required: true, message: "يرجى إدخال سبب العطل" }]}
          >
            <Input placeholder="أدخل سبب العطل" />
          </Form.Item>

          {/* Date Picker */}
          <Form.Item
            name="date"
            label="التاريخ"
            rules={[{ required: true, message: "يرجى اختيار التاريخ" }]}
          >
            <DatePicker placeholder="اختر التاريخ" style={{ width: "100%" }} />
          </Form.Item>

          {/* Notes Input */}
          <Form.Item
            name="notes"
            label="الملاحظات"
            rules={[{ required: false }]} // Notes are optional
          >
            <Input.TextArea placeholder="أدخل الملاحظات" rows={4} />
          </Form.Item>

          {/* File Uploader for Attachments */}
          <Dragger
            fileList={fileList}
            onChange={(info) => setFileList(info.fileList)} // Update file list on change
            beforeUpload={() => false} // Prevent automatic upload
            multiple // Allow multiple file uploads
          >
            <p className="ant-upload-drag-icon">📂</p>
            <p>قم بسحب الملفات أو الضغط هنا لتحميلها</p> {/* Instructions in Arabic */}
          </Dragger>

          {/* Action Buttons */}
          <div className="image-previewer-section">
            <Button
              type="primary"
              htmlType="submit"
              className="submit-button"
              loading={isSubmitting} // Show loading spinner during submission
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

export default SuperVisorDevicesAdd;
