import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, DatePicker, message, Upload, Modal } from "antd";
import axios from "axios";
import Url from "./../../../store/url.js";
import useAuthStore from "../../../store/store";
import moment from "moment";
import ImagePreviewer from "./../../../reusable/ImagePreViewer.jsx";
import "./SuperVisorLecturerAdd.css";

const { Dragger } = Upload;

const SuperVisorLecturerAdd = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isSidebarCollapsed } = useAuthStore();
  const { accessToken, profile } = useAuthStore();
  const { profileId, governorateId, officeId } = profile || {};

  const handleBack = () => {
    navigate(-1);
  };

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
      throw new Error("فشل في إرسال بيانات المحضر.");
    }
  };

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
        throw new Error("فشل في إرفاق الملفات.");
      }
    }
  };

  const handleFormSubmit = async (values) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (!profileId || !governorateId || !officeId) {
        throw new Error("تفاصيل المستخدم مفقودة. يرجى تسجيل الدخول مرة أخرى.");
      }

      const payload = {
        title: values.title,
        date: values.date
          ? values.date.format("YYYY-MM-DDTHH:mm:ss.SSSZ")
          : moment().format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
        officeId,
        governorateId,
        profileId,
        note: values.note ? values.note : "لا يوجد",
      };

      const entityId = await sendLectureDetails(payload);

      if (!entityId) {
        throw new Error("فشل في استرداد معرف الكيان من الاستجابة.");
      }

      if (fileList.length > 0) {
        await attachFiles(entityId);
        message.success("تم إرسال البيانات والمرفقات بنجاح.");
      } else {
        message.success("تم إرسال البيانات بنجاح بدون مرفقات.");
      }

      navigate(-1);
    } catch (error) {
      message.error(
        error.message || "حدث خطأ أثناء إرسال البيانات أو المرفقات."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (info) => {
    const updatedFiles = info.fileList.filter((file) => {
      return true;
    });

    // إزالة التكرارات
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
      const response = await axios.get(
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

      // تحقق من عدم تكرار الصورة
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
      className={`supervisor-Lecturer-add-container ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl">
      <h1 className="SuperVisor-Lecturer-title-conatiner">إضافة محضر جديد</h1>
      <div className="add-Lecturer-details-container">
        <Form
          form={form}
          onFinish={handleFormSubmit}
          layout="vertical"
          style={{ direction: "rtl", display: "flex", gap: "30px" }}>
          <div className="add-Lecturer-section-container">
            <div className="add-Lecturer-fields-container">
              <Form.Item
                name="title"
                label="عنوان المحضر"
                rules={[
                  { required: true, message: "يرجى إدخال عنوان المحضر" },
                ]}>
                <Input placeholder="أدخل عنوان المحضر" />
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
                value="لا يوجد"
                rules={[{ message: "يرجى إدخال الملاحظات" }]}>
                <Input.TextArea
                  style={{ height: "150px", width: "600px" }}
                  defaultValue={"لا يوجد"}
                />
              </Form.Item>
            </div>
            <h1 className="SuperVisor-Lecturer-title-conatiner">
              إضافة صورة محضر
            </h1>
            <div className="Lecturer-add-image-section">
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
                    width: "267px",
                    height: "45px",
                    marginTop: "10px",
                    marginBottom: "10px",
                  }}>
                  {isScanning ? "جاري المسح الضوئي..." : "مسح ضوئي"}
                </Button>
              </Form.Item>
              <ImagePreviewer
                uploadedImages={previewUrls}
                defaultWidth={1000}
                defaultHeight={600}
                onDeleteImage={handleDeleteImage}
              />
            </div>
            <div className="Lecturer-image-previewer-section">
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
