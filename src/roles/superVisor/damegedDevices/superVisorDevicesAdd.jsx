import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, DatePicker, Select, message, Upload } from "antd";
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
  const [deviceTypes, setDeviceTypes] = useState([]); // State for device types
  const [damagedTypes, setDamagedTypes] = useState([]); // State for damaged device types
  const { accessToken, profile } = useAuthStore();
  const { profileId, governorateId, officeId } = profile || {};
  const { isSidebarCollapsed } = useAuthStore(); // Access sidebar collapse state

  useEffect(() => {
    const fetchDeviceTypes = async () => {
      try {
        const response = await axios.get(`${Url}/api/devicetype`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const options = response.data.map((deviceType) => ({
          value: deviceType.id,
          label: deviceType.name,
        }));
        setDeviceTypes(options);
      } catch (error) {
        console.error("Error fetching device types:", error);
        message.error("خطأ في جلب أنواع الأجهزة");
      }
    };

    const fetchDamagedTypes = async () => {
      try {
        const response = await axios.get(`${Url}/api/damageddevicetype/all`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const options = response.data.map((damagedType) => ({
          value: damagedType.id,
          label: damagedType.name,
        }));
        setDamagedTypes(options);
      } catch (error) {
        console.error("Error fetching damaged device types:", error);
        message.error("خطأ في جلب أنواع التلف");
      }
    };

    fetchDeviceTypes();
    fetchDamagedTypes();
  }, [accessToken]);

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
      // Step 1: Submit the form to create a new damaged device
      const payload = {
        serialNumber: values.serialNumber, // Use serialNumber field
        date: values.date
          ? values.date.format("YYYY-MM-DDTHH:mm:ss.SSSZ") // Format the date
          : moment().format("YYYY-MM-DDTHH:mm:ss.SSSZ"), // Default to current date
        damagedDeviceTypeId: values.damagedTypeId, // Use "damagedTypeId"
        deviceTypeId: values.deviceTypeId, // Use selected deviceTypeId
        officeId: officeId, // Static office ID
        governorateId: governorateId, // Static governorate ID
        profileId: profileId, // Static profile ID
      };

      console.log("Submitting Payload:", payload);

      const damagedDeviceResponse = await axios.post(
        `${Url}/api/DamagedDevice`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`, // Add JWT token
          },
        }
      );

      console.log("Damaged Device Response:", damagedDeviceResponse);

      // Extract entity ID from the response
      const entityId =
        damagedDeviceResponse.data?.id || damagedDeviceResponse.data;

      if (!entityId) {
        console.error(
          "DamagedDevice response does not contain 'id'. Full response:",
          damagedDeviceResponse.data
        );
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
              name="serialNumber"
              label="الرقم التسلسلي"
              rules={[
                { required: true, message: "يرجى إدخال الرقم التسلسلي" },
              ]}>
              <Input placeholder="أدخل الرقم التسلسلي" />
            </Form.Item>
            <Form.Item
              name="damagedDeviceTypeId"
              label="سبب التلف"
              rules={[{ required: true, message: "يرجى اختيار سبب التلف" }]}>
              <Select
                options={damagedTypes}
                placeholder="اختر سبب التلف"
                allowClear
              />
            </Form.Item>
            <Form.Item
              name="deviceTypeId"
              label="نوع الجهاز"
              rules={[{ required: true, message: "يرجى اختيار نوع الجهاز" }]}>
              <Select
                options={deviceTypes}
                placeholder="اختر نوع الجهاز"
                allowClear
              />
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
