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
import dayjs from 'dayjs';

const { Dragger } = Upload;

const SuperVisorDammagePassportAdd = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [fileList, setFileList] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  // Loading / submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Data arrays
  const [damagedTypes, setDamagedTypes] = useState([]);
  const [governorates, setGovernorates] = useState([]);
  const [offices, setOffices] = useState([]);

  // Auth-related
  const { accessToken, profile, roles, isSidebarCollapsed } = useAuthStore();
  const { profileId, governorateId, officeId } = profile || {};

  const isSupervisor =
    roles.includes("Supervisor") || roles === "I.T" || roles === "MainSupervisor";
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);

  // -----------------------------
  // 1) Fetch initial data
  // -----------------------------
  useEffect(() => {
    // Pre-fill form if Supervisor
    if (isSupervisor && profile) {
      form.setFieldsValue({
        governorateId: governorateId,
        officeId: officeId,
      });
    }

    const fetchInitialData = async () => {
      try {
        const [damagedTypesResponse, governoratesResponse] = await Promise.all([
          axiosInstance.get(`${Url}/api/damagedtype/all/?PageNumber=1&PageSize=1000`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }),
          axiosInstance.get(`${Url}/api/Governorate/dropdown`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }),
        ]);

        // Set damaged types
        if (Array.isArray(damagedTypesResponse.data)) {
          setDamagedTypes(
            damagedTypesResponse.data.map((type) => ({
              value: type.id,
              label: type.name,
            }))
          );
        } else {
          message.error("فشل تحميل أنواع التلف بسبب خطأ في البيانات");
        }

        // Set governorates
        if (Array.isArray(governoratesResponse.data)) {
          setGovernorates(governoratesResponse.data);
        } else {
          message.error("فشل تحميل المحافظات بسبب خطأ في البيانات");
        }

        // If Supervisor, set selectedGovernorate + fetch offices
        if (isSupervisor) {
          setSelectedGovernorate(governorateId);
          await fetchOffices(governorateId);
          setSelectedOffice(officeId);
        }
      } catch (error) {
        console.error("Error in fetchInitialData:", error);
        message.error("حدث خطأ أثناء جلب البيانات الأولية");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [isSupervisor, profile, governorateId, officeId, accessToken, form]);

  // -----------------------------
  // 2) Fetch offices per governorate
  // -----------------------------
  const fetchOffices = async (govId) => {
    if (!govId) {
      setOffices([]);
      setSelectedOffice(null);
      return;
    }

    try {
      const response = await axiosInstance.get(
        `${Url}/api/Governorate/dropdown/${govId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
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
      }
      if (isSupervisor) {
        setSelectedOffice(officeId);
      }
    } catch (error) {
      message.error("فشل تحميل المكاتب");
    }
  };

  // -----------------------------
  // 3) Handle form submission (Multipart)
  // -----------------------------
  const handleFormSubmit = async (values) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Build a FormData object to send everything in one request
      const formData = new FormData();

      // Add text fields
      formData.append("PassportNumber", values.passportNumber);
      formData.append(
        "Date",
        values.date
          ? values.date.format("YYYY-MM-DDTHH:mm:ss.SSSZ")
          : moment().format("YYYY-MM-DDTHH:mm:ss.SSSZ")
      );
      formData.append("DamagedTypeId", values.damagedTypeId);
      formData.append("OfficeId", isSupervisor ? officeId : selectedOffice);
      formData.append("GovernorateId", isSupervisor ? governorateId : selectedGovernorate);
      formData.append("ProfileId", profileId);
      formData.append("Note", values.note || "لا يوجد");

      // Add files (the API expects "File" as key for each file)
      fileList.forEach((file) => {
        formData.append("File", file.originFileObj || file);
      });

      // Send as multipart/form-data to DamagedPassport endpoint
      await axiosInstance.post(`${Url}/api/DamagedPassport`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      message.success("تم إرسال البيانات والمرفقات بنجاح");
      navigate(-1);
    } catch (error) {
      console.error("Error creating DamagedPassport:", error);
      message.error("حدث خطأ أثناء إرسال البيانات أو المرفقات");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -----------------------------
  // 4) Handle Governorate selection
  // -----------------------------
  const handleGovernorateChange = async (value) => {
    setSelectedGovernorate(value);
    setSelectedOffice(null);
    form.setFieldsValue({ officeId: undefined }); // reset office
    await fetchOffices(value);
  };

  // -----------------------------
  // 5) File changes & scanning
  // -----------------------------
  const handleFileChange = (info) => {
    const updatedFiles = info.fileList;
    setFileList(updatedFiles);

    const newPreviews = updatedFiles.map((file) =>
      file.originFileObj ? URL.createObjectURL(file.originFileObj) : null
    );
    setPreviewUrls(newPreviews);
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

      // Ensure we don't add a duplicate
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
            }}
          >
            <p>يرجى ربط الماسح الضوئي أو تنزيل الخدمة من الرابط التالي:</p>
            <a
              href="http://oms-cdn.scopesky.iq/services/ScannerPolaris_WinSetup.msi"
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

  // -----------------------------
  // 6) Navigation
  // -----------------------------
  const handleBack = () => {
    navigate(-1);
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div
      className={`supervisor-damaged-passport-add-container ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl"
    >
      <h1 className="SuperVisor-title-container">إضافة جواز تالف</h1>

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : (
        <div className="add-details-container" style={{ width: "100%" }}>
          <Form
            form={form}
            onFinish={handleFormSubmit}
            layout="vertical"
            style={{ direction: "rtl" }}
          >
            {/* Form Fields Section */}
            <div className="add-damagedpassport-section-container">
              <div className="add-passport-fields-container">
                {/* Governorate */}
                <Form.Item
                  name="governorateId"
                  label="اسم المحافظة"
                  rules={[
                    { required: true, message: "يرجى اختيار المحافظة" },
                  ]}
                >
                  <Select
                    placeholder="اختر المحافظة"
                    disabled={isSupervisor}
                    style={{ width: "267px", height: "45px" }}
                    value={selectedGovernorate || undefined}
                    onChange={handleGovernorateChange}
                  >
                    {governorates.map((gov) => (
                      <Select.Option key={gov.id} value={gov.id}>
                        {gov.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                {/* Office */}
                <Form.Item
                  name="officeId"
                  label="اسم المكتب"
                  rules={[{ required: true, message: "يرجى اختيار المكتب" }]}
                >
                  <Select
                    placeholder="اختر المكتب"
                    style={{ width: "267px", height: "45px" }}
                    disabled={isSupervisor || !selectedGovernorate}
                    value={selectedOffice || undefined}
                    onChange={(value) => setSelectedOffice(value)}
                    options={offices}
                  />
                </Form.Item>

                {/* Passport Number */}
                <Form.Item
                  name="passportNumber"
                  label="رقم الجواز"
                  rules={[
                    { required: true, message: "يرجى إدخال رقم الجواز" },
                    {
                      pattern:
                        profile.officeName === "الكرادة"
                          ? /^[BRVK][0-9]{8}$/
                          : /^[B][0-9]{8}$/,
                      message:
                        profile.officeName === "الكرادة"
                          ? "يجب أن يبدأ بحرف B أو R أو V أو K ويتبعه 8 أرقام"
                          : "يجب أن يبدأ بحرف B ويتبعه 8 أرقام",
                    },
                  ]}
                  initialValue="B"
                >
                  <Input
                    dir="ltr"
                    placeholder="أدخل رقم الجواز"
                    maxLength={9}
                    minLength={9}
                    onChange={(e) => {
                      let value = e.target.value.toUpperCase(); // Convert input to uppercase
                      if (profile.officeName === "الكرادة") {
                        if (!/^[BRVK]/.test(value)) {
                          value = "B" + value.replace(/[^0-9]/g, "");
                        } else {
                          value = value[0] + value.slice(1).replace(/[^0-9]/g, "");
                        }
                      } else {
                        if (!value.startsWith("B")) {
                          value = "B" + value.replace(/[^0-9]/g, "");
                        } else {
                          value = "B" + value.slice(1).replace(/[^0-9]/g, "");
                        }
                      }
                      e.target.value = value;
                    }}
                  />
                </Form.Item>

                {/* Damaged Type */}
                <Form.Item
                  name="damagedTypeId"
                  label="سبب التلف"
                  rules={[{ required: true, message: "يرجى اختيار سبب التلف" }]}
                >
                  <Select
                    placeholder="اختر سبب التلف"
                    style={{ width: "267px", height: "45px" }}
                    options={damagedTypes}
                    allowClear
                  />
                </Form.Item>

                {/* Date */}
                <Form.Item
                  name="date"
                  label="تاريخ التلف"
                  rules={[{ required: true, message: "يرجى اختيار تاريخ التلف" }]}
                >
                  <DatePicker
  placeholder="اختر تاريخ التلف"
  style={{ width: "267px", height: "45px" }}
  format="YYYY-MM-DD" // displays the full date including year
  // Disable dates not in the current year or not in the current month.
  disabledDate={(current) =>
    current &&
    (current.year() !== dayjs().year() ||
     current.month() !== dayjs().month())
  }
  // Set the default picker view to the current date.
  defaultPickerValue={dayjs()}
  // When the user selects a date, ensure the year remains the current one.
  onChange={(date, dateString) => {
    if (date) {
      const currentYear = dayjs().year();
      // Since dayjs objects are immutable, create a new object with the updated year.
      if (date.year() !== currentYear) {
        date = date.set('year', currentYear);
        // Optionally update the form's value if you're using Form.useForm():
        // form.setFieldsValue({ date: date });
      }
    }
  }}
/>
                </Form.Item>

                {/* Note */}
                <Form.Item name="note" label="ملاحظات" initialValue="">
                  <Input.TextArea
                  rows={3}
                    placeholder="أدخل الملاحظات"
                    style={{ width: "450px", maxHeight: "350px" }}
                  />
                </Form.Item>
              </div>

              {/* Image Upload / Scan Section */}
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
                      beforeUpload={(file) => {
                        // Prevent PDF files
                        if (file.type === "application/pdf") {
                          message.error("لا يمكن تحميل ملفات PDF.");
                          return Upload.LIST_IGNORE;
                        }
                        // Prevent auto-upload
                        return false;
                      }}
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

              {/* Form Actions */}
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
        </div>
      )}
    </div>
  );
};

export default SuperVisorDammagePassportAdd;
