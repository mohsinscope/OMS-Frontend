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
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [damagedTypes, setDamagedTypes] = useState([]);
  const { accessToken, profile } = useAuthStore();
  const { profileId, governorateId, officeId } = profile || {};
  const { isSidebarCollapsed } = useAuthStore();

  useEffect(() => {
    const fetchDeviceTypes = async () => {
      try {
        const response = await axios.get(`${Url}/api/devicetype`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setDeviceTypes(
          response.data.map((deviceType) => ({
            value: deviceType.id,
            label: deviceType.name,
          }))
        );
      } catch (error) {
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
        setDamagedTypes(
          response.data.map((damagedType) => ({
            value: damagedType.id,
            label: damagedType.name,
          }))
        );
      } catch (error) {
        message.error("خطأ في جلب أنواع التلف");
      }
    };

    fetchDeviceTypes();
    fetchDamagedTypes();
  }, [accessToken]);

  const handleBack = () => {
    navigate(-1);
  };

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
      const payload = {
        serialNumber: values.serialNumber,
        date: values.date
          ? values.date.format("YYYY-MM-DDTHH:mm:ss.SSSZ")
          : moment().format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
        damagedDeviceTypeId: values.damagedDeviceTypeId,
        deviceTypeId: values.deviceTypeId,
        note: values.note,
        officeId: officeId,
        governorateId: governorateId,
        profileId: profileId,
      };

      const response = await axios.post(`${Url}/api/DamagedDevice`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const entityId = response.data?.id || response.data;
      if (!entityId) throw new Error("Failed to retrieve entity ID.");

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
    setFileList(info.fileList);
    setPreviewUrls(
      info.fileList.map((file) =>
        file.originFileObj ? URL.createObjectURL(file.originFileObj) : null
      )
    );
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
      <div className="superVisor-Add-field-section-container">
        <Form
          form={form}
          onFinish={handleFormSubmit}
          layout="vertical"
          className="superVisor-Add-form-container">
          <div className="form-item-damaged-device-container">
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
                style={{ width: "267px", height: "45px" }}
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
                style={{ width: "267px", height: "45px" }}
                options={deviceTypes}
                placeholder="اختر نوع الجهاز"
                allowClear
              />
            </Form.Item>
            <Form.Item
              name="date"
              label="التاريخ"
              rules={[{ required: true, message: "يرجى اختيار التاريخ" }]}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name="note"
              label="ملاحظات"
              rules={[{ message: "يرجى إدخال الملاحظات" }]}>
              <Input.TextArea placeholder="أدخل الملاحظات" />
            </Form.Item>
          </div>
          <h1 className="SuperVisor-title-container">
            إضافة صورة الجهاز التالف
          </h1>
          <div className="uplaod-item-damaged-device-container">
            <div className="add-image-section-container">
              <Form.Item
                name="uploadedImages"
                rules={[
                  {
                    validator: (_, value) =>
                      fileList && fileList.length > 0
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error("يرجى تحميل صورة واحدة على الأقل")
                          ),
                  },
                ]}>
                <Dragger
                  className="upload-dragger"
                  fileList={fileList}
                  onChange={handleFileChange}
                  beforeUpload={() => false}
                  multiple
                  style={{ width: "500px", height: "200px" }}
                  showUploadList={false}>
                  <p className="ant-upload-drag-icon">📂</p>
                  <p>قم بسحب الملفات أو الضغط هنا لتحميلها</p>
                </Dragger>
              </Form.Item>
              <ImagePreviewer
                uploadedImages={previewUrls}
                defaultWidth={1000}
                defaultHeight={600}
                onDeleteImage={handleDeleteImage}
              />
            </div>
          </div>
          <div className="supervisor-add-damageddevice-button">
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="submit-button">
              حفظ
            </Button>
            <Button
              danger
              onClick={handleBack}
              disabled={isSubmitting}
              className="add-back-button">
              رجوع
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default SuperVisorDammageDeviceAdd;
