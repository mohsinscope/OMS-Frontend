import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, DatePicker, message, Upload } from "antd";
import axios from "axios";
import Url from "./../../../store/url.js";
import useAuthStore from "../../../store/store";
import moment from "moment";
import ImagePreviewer from "./../../../reusable/ImagePreViewer.jsx";

const { Dragger } = Upload;

const SuperVisorLecturerAdd = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]); // State for image previews
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isSidebarCollapsed } = useAuthStore();
  const { accessToken, profile } = useAuthStore();

  const { profileId, governorateId, officeId } = profile || {};

  const handleBack = () => {
    navigate(-1);
  };

  // Step 1: Send lecture details first and get entityId
  const sendLectureDetails = async (payload) => {
    try {
      const response = await axios.post(`${Url}/api/Lecture`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data?.id || response.data;
    } catch (error) {
      throw new Error("Failed to add lecture.");
    }
  };

  // Step 2: Attach files to the created lecture entity
  const attachFiles = async (entityId) => {
    for (const file of fileList) {
      const formData = new FormData();
      formData.append("file", file.originFileObj);
      formData.append("entityId", entityId);
      formData.append("EntityType", "Lecture");

      try {
        await axios.post(`${Url}/api/Attachment/add-attachment`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${accessToken}`,
          },
        });
      } catch (error) {
        throw new Error("Failed to attach files.");
      }
    }
  };

  const handleFormSubmit = async (values) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (!profileId || !governorateId || !officeId) {
        throw new Error("Missing user profile details. Please log in again.");
      }

      const payload = {
        title: values.title,
        date: values.date
          ? values.date.format("YYYY-MM-DDTHH:mm:ss.SSSZ")
          : moment().format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
        officeId,
        governorateId,
        profileId,
        note: values.note,
      };

      console.log("Payload to be sent:", payload);

      // Step 1: Send lecture data and get the entity ID
      const entityId = await sendLectureDetails(payload);

      if (!entityId) {
        throw new Error("Failed to retrieve entity ID from the response.");
      }

      // Step 2: Attach files if any
      if (fileList.length > 0) {
        await attachFiles(entityId);
        message.success("تم إرسال البيانات والمرفقات بنجاح");
      } else {
        message.success("تم إرسال البيانات بنجاح بدون مرفقات");
      }

      navigate(-1);
    } catch (error) {
      message.error(
        error.message || "حدث خطأ أثناء إرسال البيانات أو المرفقات"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (info) => {
    const updatedFiles = info.fileList;
    setFileList(updatedFiles);

    const previews = updatedFiles.map((file) =>
      file.originFileObj ? URL.createObjectURL(file.originFileObj) : null
    );
    setPreviewUrls(previews);
  };

  const handleDeleteImage = (index) => {
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setFileList((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      className={`supervisor-damaged-passport-add-containe ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl">
      <h1 className="SuperVisor-title-conatiner">إضافة محضر جديد</h1>
      <div className="add-details-container">
        <Form
          form={form}
          onFinish={handleFormSubmit}
          layout="vertical"
          style={{ direction: "rtl", display: "flex", gap: "30px" }}>
          <div className="add-damegedpassport-section-container">
            <div className="add-passport-fields-container">
              <Form.Item
                name="title"
                label="عنولن المحضر"
                rules={[
                  { required: true, message: "يرجى إدخال عنولن المحضر" },
                ]}>
                <Input placeholder="أدخل عنولن المحضر" />
              </Form.Item>
              <Form.Item
                name="date"
                label="التاريخ"
                rules={[{ required: true, message: "يرجى اختيار التاريخ" }]}>
                <DatePicker
                  placeholder="اختر التاريخ"
                  style={{ width: "267px", height: "45px" }}
                />
              </Form.Item>
              <Form.Item
                name="note"
                label="ملاحظات"
                rules={[{ required: true, message: "يرجى إدخال الملاحظات" }]}>
                <Input.TextArea
                  placeholder="أدخل الملاحظات"
                  style={{ height: "150px" }}
                />
              </Form.Item>
            </div>
            <h1 className="SuperVisor-title-conatiner">إضافة صورة محضر</h1>
            <div className="add-image-section">
              <div className="dragger-container">
                <Dragger
                  fileList={fileList}
                  onChange={handleFileChange}
                  beforeUpload={() => false}
                  multiple
                  showUploadList={false}>
                  <p className="ant-upload-drag-icon">📂</p>
                  <p>قم بسحب الملفات أو الضغط هنا لتحميلها</p>
                </Dragger>
              </div>
              <div className="image-preivwer-container">
                <ImagePreviewer
                  uploadedImages={previewUrls}
                  onDeleteImage={handleDeleteImage}
                />
              </div>
            </div>
            <div className="image-previewer-section">
              <Button
                type="primary"
                htmlType="submit"
                className="submit-button"
                loading={isSubmitting}
                disabled={isSubmitting}>
                حفظ
              </Button>
              <Button
                danger
                onClick={handleBack}
                className="add-back-button"
                disabled={isSubmitting}>
                رجوع
              </Button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default SuperVisorLecturerAdd;
