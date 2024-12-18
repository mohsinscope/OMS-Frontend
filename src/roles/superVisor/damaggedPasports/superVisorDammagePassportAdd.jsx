import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, DatePicker, message, Upload } from "antd";
import axios from "axios";
import Url from "./../../../store/url.js";
import useAuthStore from "../../../store/store"; // Import the store
import moment from "moment";

const { Dragger } = Upload;

const SuperVisorDammagePassportAdd = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]); // File list for attachments
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Access the accessToken from the store
  const { accessToken } = useAuthStore();

  // Static values for officeId, governorateId, and profileId
  const staticOfficeId = 1;
  const staticGovernorateId = 1;
  const staticProfileId = 2;

  // Handle Back Button
  const handleBack = () => {
    navigate(-1);
  };

  // Function to attach files
  const attachFiles = async (entityId) => {
    for (const file of fileList) {
      const formData = new FormData();
      formData.append("file", file.originFileObj);
      formData.append("entityId", entityId);
      formData.append("EntityType", "DamagedPassport"); // Entity type

      try {
        console.log("Sending Attachment Payload:", formData);
        const response = await axios.post(`${Url}/api/Attachment/add-attachment`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${accessToken}`,
          },
        });
        console.log("Attachment Response:", response.data);
      } catch (error) {
        console.error("Attachment Error Details:", error.response?.data || error.message);
        throw new Error("Failed to attach files. Operation aborted.");
      }
    }
  };

  // Handle Form Submit
  const handleFormSubmit = async (values) => {
    if (isSubmitting) return; // Prevent duplicate submissions
    setIsSubmitting(true);

    try {
      // Step 1: Create Damaged Passport
      const payload = {
        passportNumber: values.passportNumber, // رقم الجواز
        date: values.date
          ? values.date.format("YYYY-MM-DDTHH:mm:ss.SSSZ")
          : moment().format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
        damagedTypeId: values.damagedTypeId, // Numeric value for damage type
        officeId: staticOfficeId,
        governorateId: staticGovernorateId,
        profileId: staticProfileId,
      };

      console.log("Submitting Damaged Passport Payload:", payload);

      const damagedPassportResponse = await axios.post(`${Url}/api/DamagedPassport`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("Damaged Passport Response:", damagedPassportResponse);

      // Extract entityId from the response
      const entityId = damagedPassportResponse.data?.id || damagedPassportResponse.data;

      if (!entityId) {
        console.error("DamagedPassport response does not contain 'id'. Full response:", damagedPassportResponse.data);
        throw new Error("Failed to retrieve entity ID from the response.");
      }

      console.log("Entity ID:", entityId);

      // Step 2: Attach Images
      if (fileList.length > 0) {
        try {
          await attachFiles(entityId);
          message.success("تم إرسال البيانات والمرفقات بنجاح");
        } catch (attachmentError) {
          console.error("Attachment Error:", attachmentError);
          throw new Error("Failed to attach files. Operation aborted.");
        }
      } else {
        message.success("تم إرسال البيانات بنجاح بدون مرفقات");
      }

      navigate(-1); // Redirect back after successful submission
    } catch (error) {
      console.error("Submission Error:", error);
      message.error(error.message || "حدث خطأ أثناء إرسال البيانات أو المرفقات");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="supervisor-damaged-passport-add-container" dir="rtl">
      <h1>إضافة جواز تالف</h1>
      <div className="add-details-container">
        <Form
          form={form}
          onFinish={handleFormSubmit}
          layout="vertical"
          style={{ direction: "rtl" }}
        >
          {/* Passport Number */}
          <Form.Item
            name="passportNumber"
            label="رقم الجواز"
            rules={[{ required: true, message: "يرجى إدخال رقم الجواز" }]}
          >
            <Input placeholder="أدخل رقم الجواز" />
          </Form.Item>

          {/* Damage Type ID */}
          <Form.Item
            name="damagedTypeId"
            label="سبب التلف"
            rules={[{ required: true, message: "يرجى إدخال سبب التلف كرقم" }]}
          >
            <Input placeholder="أدخل سبب التلف (رقم)" type="number" />
          </Form.Item>

          {/* Date */}
          <Form.Item
            name="date"
            label="التاريخ"
            rules={[{ required: true, message: "يرجى اختيار التاريخ" }]}
          >
            <DatePicker placeholder="اختر التاريخ" style={{ width: "100%" }} />
          </Form.Item>

          {/* File Uploader for Attachments */}
          <Dragger
            fileList={fileList}
            onChange={(info) => setFileList(info.fileList)}
            beforeUpload={() => false} // Prevent automatic upload
            multiple
          >
            <p className="ant-upload-drag-icon">📂</p>
            <p>قم بسحب الملفات أو الضغط هنا لتحميلها</p>
          </Dragger>

          {/* Action Buttons */}
          <div className="image-previewer-section">
            <Button
              type="primary"
              htmlType="submit"
              className="submit-button"
              loading={isSubmitting}
              disabled={isSubmitting}
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
