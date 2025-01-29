import { useState, useEffect } from "react";
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
  Skeleton,

} from "antd";
import axiosInstance from "./../../../intercepters/axiosInstance.js";
import Url from "./../../../store/url.js";
import useAuthStore from "../../../store/store";
import moment from "moment";
import ImagePreviewer from "./../../../reusable/ImagePreViewer.jsx";
import "./superVisorDammagePassportAdd.css";

const { Dragger } = Upload;

const SuperVisorDammagePassportAdd = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [damagedTypes, setDamagedTypes] = useState([]);
  const [governate, setGovernate] = useState([]);
  const [offices, setOffices] = useState([]);
  const { isSidebarCollapsed, accessToken, profile, roles } = useAuthStore();
  const { profileId, governorateId, officeId } = profile || {};
  const isSupervisor =  roles.includes("Supervisor") || roles.includes("I.T");
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Loading state for initial data

  useEffect(() => {
    if (isSupervisor && profile) {
      form.setFieldsValue({
        governorateId: governorateId,
        officeId: officeId,
      });
    }

    const fetchGovernorateData = async () => {
      try {
        const response = await axiosInstance.get(`${Url}/api/Governorate/dropdown`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (Array.isArray(response.data)) {
          setGovernate(
            response.data.map((gov) => ({
              value: gov.id,
              label: gov.name,
            }))
          );

          if (isSupervisor) {
            const supervisorGovernorate = response.data.find(
              (gov) => gov.id === governorateId
            );
            if (supervisorGovernorate) {
              setOffices(
                supervisorGovernorate.offices?.map((office) => ({
                  value: office.id,
                  label: office.name,
                })) || []
              );
            }
          }
        } else {
          console.error("Unexpected response format for governorates", response.data);
          message.error("فشل تحميل المحافظات بسبب خطأ في البيانات");
        }
      } catch (error) {
        console.error("Error fetching governorate data:", error);
        message.error("فشل تحميل المحافظات");
      }
    };

    fetchGovernorateData();
  }, [isSupervisor, profile, governorateId, officeId, accessToken]);

  useEffect(() => {
    const fetchDamagedTypes = async () => {
      try {
        const response = await axiosInstance.get(`${Url}/api/damagedtype/all`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (Array.isArray(response.data)) {
          setDamagedTypes(
            response.data.map((type) => ({
              value: type.id,
              label: type.name,
            }))
          );
        } else {
          console.error("Unexpected response format for damaged types", response.data);
          message.error("فشل تحميل أنواع التلف بسبب خطأ في البيانات");
        }
      } catch (error) {
        console.error("Error fetching damaged types:", error);
        message.error("خطأ في جلب أنواع التلف للجوازات");
      } finally {
        setIsLoading(false); // Stop loading after data is fetched
      }
    };

    fetchDamagedTypes();
  }, [accessToken]);

  const fetchOffices = async (governorateId) => {
    if (!governorateId) {
      setOffices([]);
      setSelectedOffice(null);
      return;
    }

    try {
      const response = await axiosInstance.get(
        `${Url}/api/Governorate/dropdown/${governorateId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const governorateData = response.data[0];
      if (governorateData && governorateData.offices) {
        setOffices(
          governorateData.offices.map((office) => ({
            value: office.id,
            label: office.name,
          }))
        );
        if (isSupervisor) {
          setSelectedOffice(officeId);
        }
      }
    } catch (error) {
      message.error("فشل تحميل المكاتب");
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const rollbackDamagedPassport = async (entityId) => {
    try {
      await axiosInstance.delete(`${Url}/api/DamagedPassport/${entityId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      console.error("Failed to rollback damaged passport:", error);
    }
  };

  const attachFiles = async (entityId) => {
    for (const file of fileList) {
      const formData = new FormData();
      formData.append("file", file.originFileObj || file);
      formData.append("entityId", entityId);
      formData.append("EntityType", "DamagedPassport");

      await axiosInstance.post(`${Url}/api/Attachment/add-attachment`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }
  };

  const handleFormSubmit = async (values) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = {
        passportNumber: values.passportNumber,
        date: values.date
          ? values.date.format("YYYY-MM-DDTHH:mm:ss.SSSZ")
          : moment().format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
        damagedTypeId: values.damagedTypeId,
        officeId: isSupervisor ? officeId : values.officeId,
        governorateId: isSupervisor ? governorateId : values.governorateId,
        profileId,
        note: values.note || "",
      };

      const response = await axiosInstance.post(
        `${Url}/api/DamagedPassport`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const entityId = response.data?.id || response.data;
      if (!entityId) throw new Error("Failed to retrieve entity ID.");

      try {
        if (fileList.length > 0) {
          await attachFiles(entityId);
          message.success("تم إرسال البيانات والمرفقات بنجاح");
        } else {
          message.success("تم إرسال البيانات بنجاح بدون مرفقات");
        }
        navigate(-1);
      } catch (attachmentError) {
        await rollbackDamagedPassport(entityId);
        throw new Error(
          "فشل في إرفاق الملفات. تم إلغاء إنشاء الجواز التالف لضمان سلامة البيانات."
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

  const handleGovernorateChange = async (value) => {
    setSelectedGovernorate(value);
    setSelectedOffice(null); // Clear the selected office when governorate changes
    await fetchOffices(value);
  };
  

  const handleFileChange = (info) => {
    const uniqueFiles = info.fileList.filter(
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
            }}
          >
            <p>يرجى ربط الماسح الضوئي أو تنزيل الخدمة من الرابط التالي:</p>
            <a
              href="https://cdn-oms.scopesky.org/services/ScannerPolaris_WinSetup.msi"
              target="_blank"
              rel="noopener noreferrer"
            >
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
      className={`supervisor-damaged-passport-add-container ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl"
    >
      <h1 className="SuperVisor-title-container">إضافة جواز تالف</h1>
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 10 }} /> // Skeleton loading effect
      ): (
      <div className="add-details-container" style={{ width: "100%" }}>
        <Form
          form={form}
          onFinish={handleFormSubmit}
          layout="vertical"
          style={{ direction: "rtl", display: "flex", gap: "30px" }}
        >
          <div className="add-damagedpassport-section-container">
            <div className="add-passport-fields-container">
              <Form.Item
                name="governorateId"
                label="اسم المحافظة"
                rules={[{ required: true, message: "يرجى اختيار المحافظة" }]}
              >
                <Select
                  placeholder="اختر المحافظة"
                  disabled={isSupervisor}
                  style={{ width: "267px", height: "45px" }}
                  options={governate}
                  onChange={handleGovernorateChange}
                />
              </Form.Item>

              <Form.Item
                name="officeId"
                label="اسم المكتب"
                rules={[{ required: true, message: "يرجى اختيار المكتب" }]}
              >
                <Select
                  placeholder="اختر المكتب"
                  style={{ width: "267px", height: "45px" }}
                  disabled={isSupervisor || !selectedGovernorate}
                  value={selectedOffice || "undefined"}
                  onChange={(value) => setSelectedOffice(value)}
                  options={offices}
                />
              </Form.Item>

              <Form.Item
                name="passportNumber"
                label="رقم الجواز"
                rules={[{ required: true, message: "يرجى إدخال رقم الجواز" }]}
              >
                <Input placeholder="أدخل رقم الجواز" />
              </Form.Item>

              <Form.Item
                name="damagedTypeId"
                label="سبب التلف"
                rules={[{ required: true, message: "يرجى إدخال سبب التلف" }]}
              >
                <Select
                  options={damagedTypes}
                  placeholder="اختر سبب التلف"
                  allowClear
                  style={{ width: "267px", height: "45px" }}
                />
              </Form.Item>

              <Form.Item
                name="date"
                label="التاريخ"
                rules={[{ required: true, message: "يرجى اختيار التاريخ" }]}
              >
                <DatePicker
                  placeholder="اختر التاريخ"
                  style={{ width: "267px", height: "45px" }}
                />
              </Form.Item>

              <Form.Item name="note" label="ملاحظات">
                <Input.TextArea
                  placeholder="أدخل الملاحظات"
                  style={{ width: "450px", maxHeight: "650px" }}
                />
              </Form.Item>
            </div>

            <h1 className="SuperVisor-title-container">إضافة صورة الجواز التالف</h1>
            <div className="add-image-section">
              <div className="dragger-container">
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
                  ]}
                >
                  <Dragger
                    fileList={fileList}
                    onChange={handleFileChange}
                    beforeUpload={() => false}
                    multiple
                    showUploadList={false}
                  >
                    <p className="ant-upload-drag-icon">📂</p>
                    <p>قم بسحب الملفات أو الضغط هنا لتحميلها</p>
                  </Dragger>
                  <Button
                    type="primary"
                    style={{
                      width: "100%",
                      height: "45px",
                      marginTop: "10px",
                      marginBottom: "10px",
                    }}
                    onClick={onScanHandler}
                    disabled={isScanning}
                  >
                    {isScanning ? "جاري المسح الضوئي..." : "مسح ضوئي"}
                  </Button>
                </Form.Item>
              </div>
              <div className="image-previewer-container">
                <ImagePreviewer
                  uploadedImages={previewUrls}
                  defaultWidth={600}
                  defaultHeight={300}
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
                disabled={isSubmitting}
              >
                حفظ
              </Button>
              <Button
                danger
                onClick={handleBack}
                className="add-back-button"
                disabled={isSubmitting}
              >
                رجوع
              </Button>
            </div>
          </div>
        </Form>
      </div>)}
    </div>
  );
};

export default SuperVisorDammagePassportAdd;
