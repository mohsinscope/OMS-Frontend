import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  DatePicker,
  message,
  Upload,
  Modal,
  Select,
  Skeleton,
} from "antd";
import axiosInstance from "./../../../intercepters/axiosInstance.js";
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
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [lectureTypeNames, setlectureTypeNames] = useState([]);
  const [governate, setGovernate] = useState([]);
  const [offices, setOffices] = useState([]);
  const { isSidebarCollapsed, accessToken, profile, roles } = useAuthStore();
  const { profileId, governorateId, officeId, officeName } = profile || {};
  const isSupervisor =
    roles.includes("Supervisor") || roles === "I.T" || roles === "MainSupervisor";
  const [isLoading, setIsLoading] = useState(true); // Loading state for initial data

  // Set initial form values for supervisor and fetch data
  useEffect(() => {
    if (isSupervisor && profile) {
      form.setFieldsValue({
        governorateId: governorateId,
        officeId: officeId,
      });
    }

    const fetchInitialData = async () => {
      try {
        const [governorateResponse, companiesResponse] = await Promise.all([
          axiosInstance.get(`${Url}/api/Governorate/dropdown`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }),
          axiosInstance.get(`${Url}/api/Company`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }),
        ]);

        if (Array.isArray(governorateResponse.data)) {
          setGovernate(
            governorateResponse.data.map((gov) => ({
              value: gov.id,
              label: gov.name,
            }))
          );

          if (isSupervisor) {
            const supervisorGovernorate = governorateResponse.data.find(
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
          console.error(
            "Unexpected response format for governorates",
            governorateResponse.data
          );
          message.error("فشل تحميل المحافظات بسبب خطأ في البيانات");
        }

        setCompanies(companiesResponse.data);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        message.error("فشل تحميل البيانات الأولية");
      } finally {
        setIsLoading(false); // Stop loading after data is fetched
      }
    };

    fetchInitialData();
  }, [accessToken, governorateId, profile, isSupervisor, form, officeId]);

  const fetchOffices = async (selectedGovernorateId) => {
    if (!selectedGovernorateId) return;
    try {
      const response = await axiosInstance.get(
        `${Url}/api/Governorate/dropdown/${selectedGovernorateId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (Array.isArray(response.data) && response.data.length > 0) {
        const governorateData = response.data[0];
        setOffices(
          governorateData.offices.map((office) => ({
            value: office.id,
            label: office.name,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching offices:", error);
      message.error("فشل تحميل المكاتب");
    }
  };

  const handleCompanyChange = (companyId) => {
    setSelectedCompany(companyId);
    const company = companies.find((c) => c.id === companyId);
    setlectureTypeNames(company?.lectureTypes || []);
    form.setFieldValue("lectureTypeIds", undefined);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const rollbackLecture = async (entityId) => {
    try {
      await axiosInstance.delete(`${Url}/api/Lecture/${entityId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      console.error("Failed to rollback lecture:", error);
    }
  };

const sendLectureDetails = async (formData) => {
  try {
    const res = await axiosInstance.post(`${Url}/api/Lecture`, formData, {
      headers: {
        // DO NOT set 'Content-Type' here; the browser will add the correct multipart boundary
        Authorization: `Bearer ${accessToken}`,
      },
    });
    // backend likely returns the created entity; adjust if your shape differs
    return res.data?.id || res.data;
  } catch (err) {
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
    if (!profileId || !governorateId || !officeId) {
      throw new Error("تفاصيل المستخدم مفقودة. يرجى تسجيل الدخول مرة أخرى.");
    }

    // ----- Build FormData exactly like Postman -----
    const fd = new FormData();
    fd.append("title", values.title);
    fd.append(
      "date",
      values.date ? values.date.toDate().toISOString() : new Date().toISOString()
    );
    fd.append("note", values.note || "لا يوجد");
    fd.append("officeId", isSupervisor ? String(officeId) : String(values.officeId));
    fd.append(
      "governorateId",
      isSupervisor ? String(governorateId) : String(values.governorateId)
    );
    fd.append("profileId", String(profileId));
    fd.append("companyId", String(selectedCompany));

    // IMPORTANT: multiple field entries, not a JSON array
    (values.lectureTypeIds || []).forEach((id) => {
      fd.append("lectureTypeIds", String(id));
    });

    // Match Postman key name exactly: "File"
    fileList.forEach((f) => {
      // use original file object
      const blob = f.originFileObj || f;
      fd.append("File", blob, f.name || blob.name || `file-${Date.now()}`);
    });

    const entityId = await sendLectureDetails(fd);
    if (!entityId) throw new Error("فشل في استرداد معرف الكيان من الاستجابة.");

    message.success("تم إنشاء المحضر وإرفاق الملفات بنجاح.");
    navigate(-1);
  } catch (error) {
    message.error(error.message || "حدث خطأ أثناء إرسال البيانات.");
  } finally {
    setIsSubmitting(false);
  }
};

  const handleFileChange = (info) => {
    const updatedFiles = info.fileList.filter((file) => {
      if (file.type !== "application/pdf" || !file.name?.endsWith(".pdf")) {
        message.error("PDF يرجى ارفاق الملف بصيغة ");
        return false;
      }
      return true;
      
    });
    // ------------------------
    // OLD logic (commented out)
    /*
    const updatedFiles = info.fileList.filter((file) => true);
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
    */
    // ------------------------

    // NEW (fixed) approach:
    // 1) Directly use info.fileList as the controlled fileList
    setFileList(updatedFiles);

    // 2) Generate preview URLs from the final fileList
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

      if (!fileList.some((existingFile) => existingFile.name === scannedFile.name)) {
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

  return (
    <div
      className={`supervisor-damaged-passport-add-container ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl"
    >
      <h1 className="SuperVisor-title-container">إضافة محضر جديد</h1>
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 10 }} /> // Skeleton loading effect
      ) : (
        <div className="add-Lecturer-details-container">
          <Form
            form={form}
            onFinish={handleFormSubmit}
            layout="vertical"
            style={{ direction: "rtl", display: "flex", gap: "30px" }}
          >
            <div className="add-Lecturer-section-container">
              <div className="add-Lecturer-fields-container">
                <Form.Item
                  name="governorateId"
                  label="اسم المحافظة"
                  initialValue={
                    isSupervisor ? governorateId : governate?.value
                  }
                  rules={[{ required: true, message: "يرجى اختيار المحافظة" }]}
                >
                  <Select
                    placeholder="اختر المحافظة"
                    disabled={isSupervisor}
                    style={{ width: "267px", height: "45px" }}
                    options={
                      isSupervisor
                        ? [
                            {
                              value: governorateId,
                              label: governate.find(
                                (g) => g.value === governorateId
                              )?.label,
                            },
                          ]
                        : governate
                    }
                    onChange={(value) => {
                      if (!isSupervisor) {
                        fetchOffices(value);
                        form.setFieldValue("officeId", undefined);
                      }
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name="officeId"
                  label="اسم المكتب"
                  initialValue={isSupervisor ? officeId : undefined}
                  rules={[{ required: true, message: "يرجى اختيار المكتب" }]}
                >
                  <Select
                    placeholder="اختر المكتب"
                    disabled={isSupervisor}
                    style={{ width: "267px", height: "45px" }}
                    options={
                      isSupervisor
                        ? [
                            {
                              value: officeId,
                              label: officeName,
                            },
                          ]
                        : offices
                    }
                  />
                </Form.Item>

                <Form.Item
                  name="title"
                  label="عنوان المحضر"
                  rules={[
                    { required: true, message: "يرجى إدخال عنوان المحضر" },
                  ]}
                >
                  <Input placeholder="أدخل عنوان المحضر" />
                </Form.Item>

                <Form.Item
                  name="companyId"
                  label="الشركة"
                  rules={[{ required: true, message: "يرجى اختيار الشركة" }]}
                >
                  <Select
                    placeholder="اختر الشركة"
                    style={{ width: "267px", height: "45px" }}
                    onChange={handleCompanyChange}
                  >
                    {companies.map((company) => (
                      <Select.Option key={company.id} value={company.id}>
                        {company.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="lectureTypeIds"
                  label="نوع المحضر"
                  rules={[{ required: true, message: "يرجى اختيار نوع المحضر" }]}
                >
                  <Select
                    mode="multiple"
                    placeholder="اختر نوع المحضر"
                    style={{ width: "267px", height: "fit-content" }}
                    disabled={!selectedCompany || lectureTypeNames.length === 0}
                  >
                    {lectureTypeNames.map((type) => (
                      <Select.Option key={type.id} value={type.id}>
                        {type.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="date"
                  label="التاريخ"
                  rules={[{ required: true, message: "يرجى اختيار التاريخ" }]}
                >
                  <DatePicker style={{ width: "267px", height: "45px" }} />
                </Form.Item>

                <Form.Item
                  name="note"
                  label="ملاحظات"
                  initialValue="لا يوجد"
                  rules={[{ message: "يرجى إدخال الملاحظات" }]}
                >
                  <Input.TextArea style={{ height: "150px", width: "500px" }} />
                </Form.Item>
              </div>

              <h1 className="SuperVisor-Lecturer-title-conatiner">
                إضافة صورة محضر
              </h1>
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
                      className="upload-dragger"
                      // Make Dragger a controlled component
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
                      onClick={onScanHandler}
                      disabled={isScanning}
                      style={{
                        width: "100%",
                        height: "45px",
                        marginTop: "10px",
                        marginBottom: "10px",
                      }}
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
        </div>
      )}
    </div>
  );
};

export default SuperVisorLecturerAdd;
