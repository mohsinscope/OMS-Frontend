import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, DatePicker, message, Upload } from "antd";
import axios from "axios";
import "./superVisorDammagePassportAdd.css";
import Url from "./../../../store/url.js";
import useAuthStore from "../../../store/store";
import moment from "moment";
import ImagePreviewer from "./../../../reusable/ImagePreViewer.jsx";

const { Dragger } = Upload;

const SuperVisorDammagePassportAdd = () => {
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

  const attachFiles = async (entityId) => {
    for (const file of fileList) {
      const formData = new FormData();
      formData.append("file", file.originFileObj);
      formData.append("entityId", entityId);
      formData.append("EntityType", "DamagedPassport");

      try {
        await axios.post(`${Url}/api/Attachment/add-attachment`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${accessToken}`,
          },
        });
      } catch (error) {
        throw new Error("Failed to attach files. Operation aborted.");
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
        passportNumber: values.passportNumber,
        date: values.date
          ? values.date.format("YYYY-MM-DDTHH:mm:ss.SSSZ")
          : moment().format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
        damagedTypeId: values.damagedTypeId,
        officeId,
        governorateId,
        profileId,
      };

      const damagedPassportResponse = await axios.post(
        `${Url}/api/DamagedPassport`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const entityId =
        damagedPassportResponse.data?.id || damagedPassportResponse.data;

      if (!entityId) {
        throw new Error("Failed to retrieve entity ID from the response.");
      }

      if (fileList.length > 0) {
        try {
          await attachFiles(entityId);
          message.success("تم إرسال البيانات والمرفقات بنجاح");
        } catch (attachmentError) {
          throw new Error("Failed to attach files. Operation aborted.");
        }
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
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index)); // Remove the selected image from preview
    setFileList((prev) => prev.filter((_, i) => i !== index)); // Remove the corresponding file from fileList
  };

  return (
    <div
      className={`supervisor-damaged-passport-add-containe ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl">
      <h1 className="SuperVisor-title-conatiner">إضافة جواز تالف</h1>
      <div className="add-details-container">
        <Form
          form={form}
          onFinish={handleFormSubmit}
          layout="vertical"
          style={{ direction: "rtl", display: "flex", gap: "30px" }}>
          <div className="add-damegedpassport-section-container">
            <div className="add-passport-fields-container">
              <Form.Item
                name="passportNumber"
                label="رقم الجواز"
                rules={[{ required: true, message: "يرجى إدخال رقم الجواز" }]}>
                <Input placeholder="أدخل رقم الجواز" />
              </Form.Item>

              <Form.Item
                name="damagedTypeId"
                label="سبب التلف"
                rules={[{ required: true, message: "يرجى إدخال سبب التلف" }]}>
                <Input placeholder="أدخل سبب التلف (رقم)" type="number" />
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
            </div>
            <h1 className="SuperVisor-title-conatiner">
              اضافة صورة الجواز التالف
            </h1>
            <div className="add-image-section">
              <div className="dragger-container">
                <Dragger
                  fileList={fileList}
                  onChange={handleFileChange}
                  beforeUpload={() => false}
                  multiple
                  showUploadList={false} // Hide the default file name/path list
                >
                  <p className="ant-upload-drag-icon">📂</p>
                  <p>قم بسحب الملفات أو الضغط هنا لتحميلها</p>
                </Dragger>
              </div>
              {/* Pass uploaded images to ImagePreviewer */}
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

export default SuperVisorDammagePassportAdd;
