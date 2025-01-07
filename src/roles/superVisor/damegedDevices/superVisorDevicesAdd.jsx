import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  message,
  Upload,
  Modal,
} from "antd";
import axiosInstance from './../../../intercepters/axiosInstance.js';
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
  const [isScanning, setIsScanning] = useState(false);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [damagedTypes, setDamagedTypes] = useState([]);
  const { accessToken, profile } = useAuthStore();
  const { profileId, governorateId, officeId } = profile || {};
  const { isSidebarCollapsed } = useAuthStore();

  useEffect(() => {
    const fetchDeviceTypes = async () => {
      try {
        const response = await axiosInstance.get(`${Url}/api/devicetype`, {
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
        const response = await axiosInstance.get(`${Url}/api/damageddevicetype/all`, {
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

  const rollbackDamagedDevice = async (entityId) => {
    try {
      await axiosInstance.delete(`${Url}/api/DamagedDevice/${entityId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log("Damaged device rolled back successfully.");
    } catch (error) {
      console.error("Failed to rollback damaged device:", error);
    }
  };

  const attachFiles = async (entityId) => {
    for (const file of fileList) {
      const formData = new FormData();
      formData.append("file", file.originFileObj);
      formData.append("entityId", entityId);
      formData.append("EntityType", "DamagedDevice");

      try {
        await axiosInstance.post(`${Url}/api/Attachment/add-attachment`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${accessToken}`,
          },
        });
      } catch (error) {
        throw new Error("فشل في إرفاق الملفات.");
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
        note: values.note ? values.note : "لا يوجد",
        officeId,
        governorateId,
        profileId,
      };

      const response = await axiosInstance.post(`${Url}/api/DamagedDevice`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const entityId = response.data?.id || response.data;
      if (!entityId) throw new Error("فشل في استرداد معرف الكيان.");

      try {
        if (fileList.length > 0) {
          await attachFiles(entityId);
          message.success("تم إرسال البيانات والمرفقات بنجاح");
        } else {
          message.success("تم إرسال البيانات بنجاح بدون مرفقات");
        }
        navigate(-1);
      } catch (attachmentError) {
        await rollbackDamagedDevice(entityId); // Rollback damaged device on attachment failure
        throw new Error(
          "فشل في إرفاق الملفات. تم إلغاء إنشاء الجهاز التالف لضمان سلامة البيانات."
        );
      }
    } catch (error) {
      message.error(
        error.message || "حدث خطأ أثناء إرسال البيانات أو المرفقات"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (info) => {
    const updatedFiles = info.fileList.filter((file) => {
      return true;
    });

    const uniqueFiles = updatedFiles.filter(
      (newFile) =>
        !fileList.some(
          (existingFile) =>
            existingFile.name === newFile.name &&
            existingFile.lastModified === newFile.lastModified
        )
    );

    const newPreviews = uniqueFiles.map((file) =>
      file.originFileObj ? URL.createObjectURL(file.originFileObj) : null
    );

    setPreviewUrls((prev) => [...prev, ...newPreviews]);
    setFileList((prev) => [...prev, ...uniqueFiles]);
  };

  const handleDeleteImage = (index) => {
    setPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setFileList((prev) => prev.filter((_, i) => i !== index));
  };

  const onScanHandler = async () => {
    if (isScanning) return;
    setIsScanning(true);

    try {
      const response = await axiosInstance.get(
        `http://localhost:11234/api/ScanApi/ScannerPrint`,
        {
          responseType: "json",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const base64Data = response.data?.Data;
      if (!base64Data) {
        throw new Error("لم يتم استلام بيانات من الماسح الضوئي.");
      }

      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(
        (res) => res.blob()
      );

      const scannedFile = new File([blob], `scanned-image-${Date.now()}.jpeg`, {
        type: "image/jpeg",
      });

      if (
        !fileList.some((existingFile) => existingFile.name === scannedFile.name)
      ) {
        const scannedPreviewUrl = URL.createObjectURL(blob);

        setFileList((prev) => [
          ...prev,
          {
            uid: `scanned-${Date.now()}`,
            name: scannedFile.name,
            status: "done",
            originFileObj: scannedFile,
          },
        ]);

        setPreviewUrls((prev) => [...prev, scannedPreviewUrl]);

        message.success("تم إضافة الصورة الممسوحة بنجاح!");
      } else {
        message.info("تم بالفعل إضافة هذه الصورة.");
      }
    } catch (error) {
      Modal.error({
        title: "خطأ",
        content: (
          <div
            style={{
              direction: "rtl",
              padding: "10px",
              fontSize: "15px",
              fontWeight: "bold",
              textAlign: "center",
              width: "fit-content",
            }}>
            <p>يرجى ربط الماسح الضوئي أو تنزيل الخدمة من الرابط التالي:</p>
            <a
              href="https://cdn-oms.scopesky.org/services/ScannerPolaris_WinSetup.msi"
              target="_blank"
              rel="noopener noreferrer">
              تنزيل الخدمة
            </a>
          </div>
        ),
        okText: "حسنًا",
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div
      className={`supervisor-devices-add-container ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
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
              rules={[{ required: true, message: "يرجى إدخال الرقم التسلسلي" }]}>
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
              value="لا يوجد"
              rules={[{ message: "يرجى إدخال الملاحظات" }]}>
              <Input.TextArea
                placeholder="أدخل الملاحظات"
                defaultValue={"لا يوجد"}
              />
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
                      fileList.length > 0 || previewUrls.length > 0
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error(
                              "يرجى تحميل صورة واحدة على الأقل أو استخدام المسح الضوئي"
                            )
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
                <Button
                  type="primary"
                  onClick={onScanHandler}
                  disabled={isScanning}
                  style={{
                    width: "100%",
                    height: "45px",
                    marginTop: "10px",
                    marginBottom: "10px",
                  }}>
                  {isScanning ? "جاري المسح الضوئي..." : "مسح ضوئي"}
                </Button>
              </Form.Item>
              <ImagePreviewer
                uploadedImages={previewUrls}
                defaultWidth={600}
                defaultHeight={300}
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
