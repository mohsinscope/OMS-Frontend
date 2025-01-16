import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  DatePicker,
  message,
  Upload,
  Modal,
  InputNumber,
  Select,
  Card,
  Typography,
} from "antd";
import axiosInstance from "./../../../intercepters/axiosInstance.js";
import useAuthStore from "../../../store/store";
import moment from "moment";
import ImagePreviewer from "./../../../reusable/ImagePreViewer.jsx";
import "./../lecturer/SuperVisorLecturerAdd.css";

const { Dragger } = Upload;
const { Title } = Typography;

export default function ExpensessAddDaily() {
  const navigate = useNavigate();
  const location = useLocation();
  const monthlyExpenseId = location.state?.monthlyExpenseId;

  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const { profile, isSidebarCollapsed } = useAuthStore();
  const {
    profileId,
    governorateId,
    officeId,
    governorateName,
    officeName,
    name: supervisorName,
  } = profile || {};

  const [officeInfo] = useState({
    totalCount: 0,
    totalExpenses: 0,
    date: new Date().toISOString().split("T")[0],
    governorate: governorateName || "",
    officeName: officeName || "",
    supervisorName: supervisorName || "",
  });

  useEffect(() => {
    if (!monthlyExpenseId) {
      message.error("لم يتم العثور على معرف المصروف الشهري");
      navigate(-1);
      return;
    }
    fetchExpenseTypes();
  }, [monthlyExpenseId]);

  const fetchExpenseTypes = async () => {
    try {
      const response = await axiosInstance.get(
        "/api/ExpenseType?PageNumber=1&PageSize=100"
      );
      setExpenseTypes(response.data || []);
    } catch (error) {
      console.error("Error fetching expense types:", error);
      message.error("فشل في جلب أنواع المصروفات");
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const attachFiles = async (entityId) => {
    for (const file of fileList) {
      const formData = new FormData();
      formData.append("file", file.originFileObj);
      formData.append("entityId", entityId);
      formData.append("EntityType", "Expense");

      try {
        await axiosInstance.post("/api/Attachment/add-attachment", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } catch (error) {
        throw new Error("فشل في إرفاق الملفات");
      }
    }
  };

  const rollbackExpense = async (entityId) => {
    try {
      await axiosInstance.delete(`/api/Expense/${entityId}`);
    } catch (error) {
      console.error("Failed to rollback expense record:", error);
    }
  };

  const handleFormSubmit = async (values) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (!profileId || !governorateId || !officeId) {
        throw new Error("تفاصيل المستخدم مفقودة. يرجى تسجيل الدخول مرة أخرى.");
      }

      if (!monthlyExpenseId) {
        throw new Error("لم يتم العثور على معرف المصروف الشهري");
      }

      const payload = {
        price: values.price,
        quantity: values.quantity,
        notes: values.notes || "لا يوجد",
        expenseDate: values.date.format("YYYY-MM-DDTHH:mm:ss"),
        expenseTypeId: values.expenseTypeId,
      };

      const response = await axiosInstance.post(
        `/api/Expense/${monthlyExpenseId}/daily-expenses`,
        payload
      );
      const entityId = response.data?.id;

      if (!entityId) {
        throw new Error("فشل في استرداد معرف الكيان من الاستجابة");
      }

      try {
        if (fileList.length > 0) {
          await attachFiles(entityId);
          message.success("تم إرسال البيانات والمرفقات بنجاح");
        } else {
          message.success("تم إرسال البيانات بنجاح بدون مرفقات");
        }
        navigate(-1);
      } catch (attachmentError) {
        await rollbackExpense(entityId);
        throw new Error("فشل في إرفاق الملفات.");
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
          },
        }
      );

      const base64Data = response.data?.Data;
      if (!base64Data) {
        throw new Error("لم يتم استلام بيانات من الماسح الضوئي");
      }

      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(
        (res) => res.blob()
      );

      const scannedFile = new File(
        [blob],
        `scanned-expense-${Date.now()}.jpeg`,
        {
          type: "image/jpeg",
        }
      );

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
        message.info("تم بالفعل إضافة هذه الصورة");
      }
    } catch (error) {
      Modal.error({
        title: "خطأ",
        content: (
          <div className="expense-scanner-error">
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
      className={`expense-add-daily-container ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl">
      <div className="supervisor-Lecturer-add-container">
        <h1 className="SuperVisor-Lecturer-title-conatiner">
          إضافة مصروف يومي جديد
        </h1>
        <Form
          form={form}
          onFinish={handleFormSubmit}
          layout="vertical"
          onValuesChange={(changedValues, allValues) => {
            const { price, quantity } = allValues;
            if (price !== undefined && quantity !== undefined) {
              const total = price * quantity;
              form.setFieldsValue({ totalamount: total });
            }
          }}>
          <div className="add-Lecturer-section-container">
            <div className="add-Lecturer-fields-container">
              <Form.Item
                name="expenseTypeId"
                label="نوع المصروف"
                rules={[
                  { required: true, message: "يرجى اختيار نوع المصروف" },
                ]}>
                <Select
                  placeholder="اختر نوع المصروف"
                  style={{ width: "267px", height: "45px" }}>
                  {expenseTypes.map((type) => (
                    <Select.Option key={type.id} value={type.id}>
                      {type.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
  name="price"
  label="السعر"
  rules={[{ required: true, message: "يرجى إدخال السعر" }]}>
  <InputNumber
    placeholder="أدخل السعر"
    min={0}
    style={{ width: "267px", height: "45px" }}
    formatter={(value) =>
      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    }
    parser={(value) => value.replace(/,\s?/g, "")}
  />
</Form.Item>


              <Form.Item
                name="quantity"
                label="الكمية"
                rules={[{ required: true, message: "يرجى إدخال الكمية" }]}>
                <InputNumber
                  placeholder="أدخل الكمية"
                  min={1}
                  style={{ width: "100%", height: "45px" }}
                />
              </Form.Item>
              <Form.Item name="totalamount" label="المجموع الكلي">
  <InputNumber
    readOnly
    style={{ width: "267px", height: "45px" }}
    formatter={(value) =>
      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    }
    parser={(value) => value.replace(/,\s?/g, "")}
  />
</Form.Item>


              <Form.Item
  name="date"
  label="التاريخ"
  rules={[{ required: true, message: "يرجى اختيار التاريخ" }]}>
  <DatePicker
    style={{ width: "267px", height: "45px" }}
    disabledDate={(current) => {
      // Disable dates outside the current month
      const now = new Date();
      return (
        current &&
        (current.month() !== now.getMonth() || current.year() !== now.getFullYear())
      );
    }}
  />
</Form.Item>

              <Form.Item name="notes" label="ملاحظات" initialValue="لا يوجد">
                <Input.TextArea
                  rows={4}
                  style={{ width: "267px", height: "45px" }}
                />
              </Form.Item>
            </div>
          </div>

          <h2 className="SuperVisor-Lecturer-title-conatiner">
            إضافة صورة المصروف
          </h2>
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
                style={{ width: "500px", height: "200px" }}>
                <p className="ant-upload-drag-icon">📂</p>
                <p>قم بسحب الملفات أو الضغط هنا لتحميلها</p>
              </Dragger>

              <Button
                type="primary"
                onClick={onScanHandler}
                disabled={isScanning}
                block
                style={{ marginTop: "16px" }}>
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
          <div
            className="Lecturer-image-previewer-section"
            style={{ width: "100%" }}>
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
              disabled={isSubmitting}
              className="add-back-button">
              رجوع
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
