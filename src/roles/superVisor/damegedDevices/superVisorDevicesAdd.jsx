import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, DatePicker, message, Upload } from "antd";
import axios from "axios";
import Url from "./../../../store/url.js";
import useAuthStore from "../../../store/store";
import moment from "moment";
import ImagePreviewer from "./../../../reusable/ImagePreViewer.jsx";
import "./superVisorDevicesAdd.css";

const { Dragger } = Upload;

const SuperVisorDammageDeviceAdd = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]); // State for image previews
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { accessToken, profile } = useAuthStore();
  const { profileId, governorateId, officeId } = profile || {};
  const { isSidebarCollapsed } = useAuthStore(); // Access sidebar collapse state

  const handleBack = () => {
    navigate(-1);
  };

  // Step 1: Send damaged device details first and get entityId
  const sendDeviceDetails = async (payload) => {
    try {
      const response = await axios.post(`${Url}/api/DamagedDevice`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data?.id || response.data;
    } catch (error) {
      throw new Error("Failed to add damaged device.");
    }
  };

  // Step 2: Attach files to the created damaged device entity
  const attachFiles = async (entityId) => {
    for (const file of fileList) {
      const formData = new FormData();
      formData.append("file", file.originFileObj);
      formData.append("entityId", entityId);
      formData.append("EntityType", "DamagedDevice");

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
        serialNumber: values.serialNumber,
        date: values.date
          ? values.date.format("YYYY-MM-DDTHH:mm:ss.SSSZ")
          : moment().format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
        note: values.note || "",
        damagedDeviceTypeId: values.damagedDeviceTypeId,
        deviceTypeId: values.deviceTypeId,
        officeId,
        governorateId,
        profileId,
      };

      console.log("Payload to be sent:", payload);

      // Step 1: Send damaged device data and get the entity ID
      const entityId = await sendDeviceDetails(payload);

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
      className={`supervisor-devices-add-container ${
        isSidebarCollapsed
          ? "sidebar-collapsed"
          : "supervisor-devices-add-container"
      }`}
      dir="rtl">
      <h1 className="SuperVisor-title-container">إضافة جهاز تالف</h1>
      <div className="devices-add-details-container">
        <Form
          form={form}
          onFinish={handleFormSubmit}
          layout="vertical"
          className="devices-add-details-container">
          <div className="devices-add-details-container">
            <Form.Item
              name="serialNumber"
              label="الرقم التسلسلي للجهاز"
              rules={[
                { required: true, message: "يرجى إدخال الرقم التسلسلي" },
              ]}>
              <Input placeholder="أدخل الرقم التسلسلي" />
            </Form.Item>
            <Form.Item
              name="deviceTypeId"
              label="نوع الجهاز"
              rules={[{ required: true, message: "يرجى اختيار نوع الجهاز" }]}>
              <Input placeholder="أدخل نوع الجهاز (رقم)" type="number" />
            </Form.Item>
            <Form.Item
              name="damagedDeviceTypeId"
              label="سبب التلف"
              rules={[{ required: true, message: "يرجى اختيار سبب التلف" }]}>
              <Input placeholder="أدخل سبب التلف (رقم)" type="number" />
            </Form.Item>
            <Form.Item
              name="date"
              label="التاريخ"
              rules={[{ required: true, message: "يرجى اختيار التاريخ" }]}>
              <DatePicker style={{ width: "267px", height: "45px" }} />
            </Form.Item>
            <Form.Item
              name="note"
              label="ملاحظات"
              rules={[{ required: false }]}>
              <Input.TextArea placeholder="أدخل الملاحظات" />
            </Form.Item>
          </div>
          <h1 className="SuperVisor-title-container">
            إضافة صورة الجهاز التالف
          </h1>
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

            <div className="image-previewer-container">
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
        </Form>
      </div>
    </div>
  );
};

export default SuperVisorDammageDeviceAdd;
