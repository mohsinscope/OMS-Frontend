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
  Space,
} from "antd";
import { PlusOutlined, MinusCircleOutlined, MinusOutlined, DeleteOutlined } from '@ant-design/icons';
import axiosInstance from "./../../../intercepters/axiosInstance.js";
import useAuthStore from "../../../store/store";
import ImagePreviewer from "./../../../reusable/ImagePreViewer.jsx";
import "./../lecturer/SuperVisorLecturerAdd.css";
import { MinusCircleIcon, MinusIcon, RecycleIcon, RemoveFormatting } from "lucide-react";

const { Dragger } = Upload;

export default function ExpensessAddDaily() {
  const navigate = useNavigate();
  const location = useLocation();
  const monthlyExpenseId = location.state?.monthlyExpenseId;
  const totalMonthlyAmount = location.state?.totalMonthlyAmount;
  console.log("totalMonthlyAmount", totalMonthlyAmount);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [hasSubExpenses, setHasSubExpenses] = useState(false);
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

  // Office Budget
  const [officeBudget, setOfficeBudget] = useState();

  // Fetch office budget
  const fetchOfficeBudget = async () => {
    try {
      const response = await axiosInstance.get(`/api/office/${profile?.officeId}`);
      setOfficeBudget(response.data.budget);
    } catch (error) {
      console.error("Error fetching office budget:", error);
      message.error("حدث خطأ في جلب ميزانية المكتب");
    }
  };

  useEffect(() => {
    fetchOfficeBudget();
  }, [profile?.officeId]);

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
        monthlyExpensesId: monthlyExpenseId
      };

      // Add sub-expenses if they exist
      if (hasSubExpenses && values.subExpenses) {
        payload.subExpenses = values.subExpenses.map(sub => ({
          price: sub.price,
          quantity: sub.quantity,
          notes: sub.notes || "لا يوجد",
          expenseTypeId: sub.expenseTypeId
        }));
      }

      // Calculate total amount including sub-expenses
      const mainTotal = values.price * values.quantity;
      const subTotal = hasSubExpenses ? 
        values.subExpenses?.reduce((sum, sub) => sum + (sub.price * sub.quantity), 0) || 0 : 0;
      const totalAmount = mainTotal + subTotal;

      // Check budget
      if (totalAmount + totalMonthlyAmount > officeBudget) {
        message.error("الميزانية غير كافية");
        message.info(`الميزانية المتبقية ${officeBudget - totalMonthlyAmount}`);
        setIsSubmitting(false);
        return;
      }

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
      message.error(error.message || "حدث خطأ أثناء إرسال البيانات أو المرفقات");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (info) => {
    // Filter out PDF files
    const updatedFiles = info.fileList.filter((file) => {
      if (file.type === "application/pdf" || file.name?.endsWith(".pdf")) {
        message.error("تحميل ملفات PDF غير مسموح به. يرجى تحميل صورة بدلاً من ذلك.");
        return false;
      }
      return true;
    });

    setFileList(updatedFiles);

    // Generate new previews directly from updatedFiles
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

      const scannedFile = new File([blob], `scanned-expense-${Date.now()}.jpeg`, {
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

  const toggleSubExpenses = () => {
    Modal.confirm({
      title: "تأكيد",
      content: hasSubExpenses
        ? "هل أنت متأكد أنك تريد إلغاء المصاريف الفرعية؟"
        : "هل تريد إضافة المصاريف الفرعية؟",
      okText: "نعم",
      cancelText: "إلغاء",
      onOk: () => {
        const newState = !hasSubExpenses;
        setHasSubExpenses(newState);
        
        if (newState) {
          form.setFieldsValue({ subExpenses: [{}] });
        } else {
          form.setFieldsValue({ subExpenses: undefined });
        }
      },
    });
  };

  return (
    <div
      className={`supervisor-damaged-passport-add-container ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl"
    >
      <div className="title-container">
        <h1>إضافة مصروف يومي جديد</h1>
        <Form
          form={form}
          onFinish={handleFormSubmit}
          layout="vertical"
          onValuesChange={(changedValues, allValues) => {
            const { price, quantity, subExpenses } = allValues;
            let total = 0;
            
            if (price !== undefined && quantity !== undefined) {
              total += price * quantity;
            }

            if (hasSubExpenses && subExpenses) {
              const subTotal = subExpenses.reduce((sum, sub) => {
                if (sub?.price && sub?.quantity) {
                  return sum + (sub.price * sub.quantity);
                }
                return sum;
              }, 0);
              total += subTotal;
            }

            form.setFieldsValue({ totalamount: total });
          }}
        >
          <div className="form-item-damaged-device-container">
            <Form.Item
              name="expenseTypeId"
              label="نوع المصروف"
              rules={[{ required: true, message: "يرجى اختيار نوع المصروف" }]}
            >
              <Select
                placeholder="اختر نوع المصروف"
                style={{ width: "267px", height: "45px" }}
              >
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
              rules={[{ required: true, message: "يرجى إدخال السعر" }]}
            >
              <InputNumber
                placeholder="أدخل السعر"
                min={0}
                style={{ width: "100%", height: "45px" }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => value.replace(/,\s?/g, "")}
              />
            </Form.Item>

            <Form.Item
              name="quantity"
              label="الكمية"
              rules={[{ required: true, message: "يرجى إدخال الكمية" }]}
            >
              <InputNumber
                placeholder="أدخل الكمية"
                min={1}
                style={{ width: "100%", height: "45px" }}
              />
            </Form.Item>

            <Form.Item name="totalamount" label="المجموع الكلي">
              <InputNumber
                readOnly
                style={{ width: "100%", height: "45px" }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => value.replace(/,\s?/g, "")}
              />
            </Form.Item>

            <Form.Item
              name="date"
              label="التاريخ"
              rules={[{ required: true, message: "يرجى اختيار التاريخ" }]}
            >
              <DatePicker
                style={{ width: "100%", height: "45px" }}
                disabledDate={(current) => {
                  const now = new Date();
                  return (
                    current &&
                    (current.month() !== now.getMonth() ||
                      current.year() !== now.getFullYear())
                  );
                }}
              />
            </Form.Item>

            <Form.Item name="notes" label="ملاحظات" initialValue="لا يوجد">
              <Input.TextArea rows={4} style={{ width: "100%", height: "45px" }} />
            </Form.Item>
          </div>

          {/* Sub-expenses section */}
          <div style={{ marginTop: "20px" }}>
            <Button 
              type="dashed"
              onClick={toggleSubExpenses}
              icon={hasSubExpenses? <DeleteOutlined style={{color:"red"}}/>:<PlusOutlined />}
              style={hasSubExpenses?{ marginBottom: "16px" ,color:"red"}:{marginBottom:"16" , color:"green"}}
            >
              {hasSubExpenses ? "حذف جميع المصاريف الفرعية" : "إضافة مصاريف فرعية"}
            </Button>

            {hasSubExpenses && (
              <Form.List name="subExpenses">
              {(fields, { add, remove }) => (
                <div className="form-item-damaged-device-container" >
                  {fields.map((field, index) => (
                    <Card
                      key={field.key}
                      title={`مصروف فرعي ${index + 1}`}
                      extra={
                        <MinusCircleOutlined 
              onClick={() => {
                Modal.confirm({
                  title: "تأكيد",
                  content: fields.length === 1
                    ? "هل أنت متأكد أنك تريد إلغاء جميع المصاريف الفرعية؟"
                    : "هل أنت متأكد أنك تريد حذف هذا المصروف الفرعي؟",
                  okText: "نعم",
                  cancelText: "إلغاء",
                  onOk: () => {
                    if (fields.length === 1) {
                      setHasSubExpenses(false);
                      form.setFieldsValue({ subExpenses: undefined });
                    } else {
                      remove(field.name);
                    }
                  },
                });
              }}
              style={{ color: '#ff4d4f' }}
            />
                      }
                      style={{ marginBottom: "16px" ,boxShadow:" rgba(0, 0, 0, 0.08) 0px 4px 12px"}}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'expenseTypeId']}
                          label="نوع المصروف"
                          rules={[{ required: true, message: 'يرجى اختيار نوع المصروف' }]}
                        >
                          <Select placeholder="اختر نوع المصروف">
                            {expenseTypes.map((type) => (
                              <Select.Option key={type.id} value={type.id}>
                                {type.name}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                        
                        <Form.Item
                          {...field}
                          name={[field.name, 'price']}
                          label="السعر"
                          rules={[{ required: true, message: 'يرجى إدخال السعر' }]}
                        >
                          <InputNumber
                            placeholder="أدخل السعر"
                            style={{ width: '100%' }}
                            min={0}
                            formatter={(value) =>
                              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                            }
                            parser={(value) => value.replace(/,\s?/g, '')}
                          />
                        </Form.Item>
            
                        <Form.Item
                          {...field}
                          name={[field.name, 'quantity']}
                          label="الكمية"
                          min={1}
                          rules={[{ required: true, message: 'يرجى إدخال الكمية' }]}
                        >
                          <InputNumber
                            placeholder="أدخل الكمية"
                            style={{ width: '100%' }}
                            min={1}
                          />
                        </Form.Item>
            
                        {/* -- Display the computed total for this sub-expense -- */}
                        <Form.Item
                          label="المجموع الفرعي"
                          // We re-render this Form.Item whenever these fields change:
                          dependencies={[
                            ['subExpenses', field.name, 'price'],
                            ['subExpenses', field.name, 'quantity'],
                          ]}
                          // The render prop receives form methods (like getFieldValue)
                        >
                          {({ getFieldValue }) => {
                            const price =
                              getFieldValue(['subExpenses', field.name, 'price']) || 0;
                            const quantity =
                              getFieldValue(['subExpenses', field.name, 'quantity']) || 0;
                            const subtotal = price * quantity;
            
                            return (
                              <InputNumber
                                readOnly
                                style={{ width: '100%' }}
                                value={subtotal}
                                formatter={(value) =>
                                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                }
                                parser={(value) => value.replace(/,\s?/g, '')}
                              />
                            );
                          }}
                        </Form.Item>
            
                        <Form.Item
                          {...field}
                          name={[field.name, 'notes']}
                          label="ملاحظات"
                        >
                          <Input.TextArea rows={2} />
                        </Form.Item>
                      </Space>
                    </Card>
                  ))}
                  
                  <Button
                  style={hasSubExpenses?{width:"fit-content",borderRadius:"10px"}:{}}
                  className="back-button"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    إضافة مصروف فرعي آخر
                  </Button>
                </div>
              )}
            </Form.List>
            
            )}
          </div>

          <h2 className="SuperVisor-Lecturer-title-conatiner">
            إضافة صورة المصروف
          </h2>
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
              disabled={isSubmitting}
              className="add-back-button"
            >
              رجوع
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}