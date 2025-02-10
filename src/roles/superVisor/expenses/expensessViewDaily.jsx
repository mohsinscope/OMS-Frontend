import { useState, useEffect } from "react";
import {
  Spin,
  message,
  Modal,
  Form,
  Input,
  Button,
  ConfigProvider,
  Select,
  InputNumber,
  Upload,
  Skeleton,
  Table, // Import Table from antd
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "./../../../intercepters/axiosInstance.js";
import useAuthStore from "./../../../store/store";
import Url from "./../../../store/url.js";
import ImagePreviewer from "./../../../reusable/ImagePreViewer.jsx";
import moment from "moment";

const ExpensessView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Retrieve IDs and status from location state or URL query params
  const dailyExpenseId = location.state?.dailyExpenseId;
  const subExpenseId = location.state?.subExpenseId;
  const expenseId = dailyExpenseId || new URLSearchParams(location.search).get("id");
  const status = location.state?.status;

  // Local state declarations
  const [imageData, setImageData] = useState({
    imageId: "",
    entityId: "",
    entityType: "Expense",
  });
  const [images, setImages] = useState([]);
  const [expenseData, setExpenseData] = useState(null);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Loading state for details
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [form] = Form.useForm();

  const { isSidebarCollapsed, permissions, profile } = useAuthStore();
  const hasUpdatePermission = permissions.includes("EXu");
  const hasDeletePermission = permissions.includes("EXd");
  const canPerformActions = () =>
    hasUpdatePermission &&
    hasDeletePermission &&
    ["New", "ReturnedToSupervisor"].includes(status);

  // Fetch expense types
  const fetchExpenseTypes = async () => {
    try {
      const response = await axiosInstance.get("/api/ExpenseType");
      setExpenseTypes(response.data || []);
    } catch (error) {
      message.error("فشل في جلب أنواع المصروفات");
    }
  };

  // Fetch expense details
  const fetchExpenseDetails = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/api/Expense/dailyexpenses/${expenseId}`);
      const expense = response.data;
      if (!expense) throw new Error("No expense data found");

      setExpenseData(expense);
      form.setFieldsValue({
        ...expense,
        date: moment(expense.expenseDate),
        expenseTypeId: expense.expenseTypeId,
        price: expense.price,
        quantity: expense.quantity,
        amount: expense.amount,
        notes: expense.notes,
      });
    } catch (error) {
      console.error("Error fetching expense details:", error);
      message.error("حدث خطأ أثناء جلب تفاصيل المصروف");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch images using the provided ID (parent or expense ID)
  const fetchExpensesImages = async (idToUse) => {
    if (!idToUse) {
      console.error("No ID provided for fetching images.");
      return;
    }
    try {
      const response = await axiosInstance.get(`${Url}/api/Attachment/Expense/${idToUse}`);
      const imageUrls = response.data.map((image) => ({
        url: image.filePath,
        id: image.id,
      }));
      setImages(imageUrls);
    } catch (error) {
      console.error("Error fetching images:", error);
      message.error("حدث خطأ أثناء جلب صور المصروف");
    }
  };

  // Combined effect: Log debug info and fetch images when expenseData is available.
  useEffect(() => {
    if (expenseData) {
      console.log("Monthly Status:", expenseData.monthlyStatus);
      console.log("Has Update Permission:", hasUpdatePermission);
      console.log("Has Delete Permission:", hasDeletePermission);
      console.log("Can Perform Actions:", canPerformActions());
      
      // Use parentExpenseId if available; otherwise, fall back to expenseData.id or expenseId
      const idForImages = expenseData.parentExpenseId || expenseData.id || expenseId;
      if (idForImages) {
        fetchExpensesImages(idForImages);
      } else {
        console.error("No valid ID found for fetching images");
      }
    }
  }, [expenseData, expenseId, hasUpdatePermission, hasDeletePermission]);

  // Initialization effect: Check for expenseId and fetch types & details
  useEffect(() => {
    if (!expenseId) {
      message.error("معرف المصروف غير موجود");
      setTimeout(() => {
        navigate("/Expensess", { replace: true });
      }, 1500);
      return;
    }
    const initializeData = async () => {
      setLoading(true);
      try {
        await fetchExpenseTypes();
        await fetchExpenseDetails();
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }, [expenseId, navigate]);

  // Handle image upload (use parentExpenseId if available)
  const handleImageUpload = async (file) => {
    if (!imageData.imageId) {
      message.error("لم يتم تحديد الصورة");
      return;
    }
    try {
      const idForUpload = expenseData.parentExpenseId || expenseId;
      const formData = new FormData();
      formData.append("entityId", idForUpload);
      formData.append("entityType", "Expense");
      formData.append("file", file);

      const response = await axiosInstance.put(
        `${Url}/api/attachment/${imageData.imageId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      message.success("تم تحديث الصورة بنجاح");
      fetchExpensesImages(idForUpload);
    } catch (error) {
      console.error("Error during image upload:", error);
      message.error("حدث خطأ أثناء تعديل الصورة");
    }
  };

  const handleEditClick = () => {
    form.setFieldsValue({
      expenseTypeId: expenseData.expenseTypeId,
      date: moment(expenseData.expenseDate).format("YYYY-MM-DD"),
      price: expenseData.price,
      quantity: expenseData.quantity,
      notes: expenseData.notes,
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async (values) => {
    try {
      const expenseDate = moment(values.date).isValid()
        ? moment(values.date).startOf("day").toISOString()
        : moment().startOf("day").toISOString();
      const updatedValues = {
        id: expenseId,
        expenseDate,
        price: values.price,
        quantity: values.quantity,
        amount: values.price * values.quantity,
        notes: values.notes || "",
        expenseTypeId: values.expenseTypeId,
        officeId: expenseData.officeId,
        governorateId: expenseData.governorateId,
        profileId: expenseData.profileId,
      };
      const response = await axiosInstance.put(`/api/Expense/${expenseId}`, updatedValues);
      console.log("API Response:", response.data);
      message.success("تم تحديث المصروف بنجاح");
      setEditModalVisible(false);
      await fetchExpenseDetails();
    } catch (error) {
      console.error("Error updating expense:", error);
      message.error("حدث خطأ أثناء تعديل المصروف");
    }
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/api/Expense/${expenseId}`);
      message.success("تم حذف المصروف بنجاح");
      setDeleteModalVisible(false);
      navigate(-1);
    } catch (error) {
      message.error("حدث خطأ أثناء حذف المصروف");
    }
  };

  // Define columns for the subexpenses table
  const subExpensesColumns = [
    {
      title: "رقم",
      key: "index",
      render: (text, record, index) => index + 1,
      width: 50,
    },
    {
      title: "نوع المصروف الفرعي",
      dataIndex: "expenseTypeName",
      key: "expenseTypeName",
      width: 150,
    },
    {
      title: "السعر",
      dataIndex: "price",
      key: "price",
      width: 100,
      render: (price) => (price ? price.toLocaleString() + " د.ع" : ""),
    },
    {
      title: "الكمية",
      dataIndex: "quantity",
      key: "quantity",
      width: 80,
    },
    {
      title: "المبلغ الإجمالي",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      render: (amount) => (amount ? amount.toLocaleString() + " د.ع" : ""),
    },
    {
      title: "الملاحظات",
      dataIndex: "notes",
      key: "notes",
      width: 200,
    },
    {
      title: "التاريخ",
      dataIndex: "expenseDate",
      key: "expenseDate",
      width: 120,
      render: (date) => moment(date).format("YYYY-MM-DD"),
    },
  ];

  if (loading) {
    return (
      <div className="loading supervisor-passport-damage-show-container" dir="rtl">
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (!expenseData) {
    return <div className="loading">جاري التحميل...</div>;
  }

  return (
    <div
      className={`supervisor-passport-damage-show-container ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}
      dir="rtl"
    >
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : (
        <>
          <div className="title-container">
          <h1 style={{ color: "#000", fontSize: "24px" }}>
            تفاصيل المصروف
            {expenseData.subExpenses && expenseData.subExpenses.length > 0 && (
              <>
              
             - <span style={{ color: "blue", marginLeft: "8px" }}>  مصروف متعدد </span>
              </>
            )}
          </h1>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", gap: "20px" }}>
              <Button
                type="primary"
                style={{ padding: "20px 30px", backgroundColor: "#efb034" }}
                onClick={() => navigate(-1)}
              >
                الرجوع
              </Button>
              {canPerformActions() && (
                <>
                  <Button type="primary" style={{ padding: "20px 30px" }} onClick={handleEditClick}>
                    تعديل
                  </Button>
                  <Button danger type="primary" style={{ padding: "20px 40px" }} onClick={handleDelete}>
                    حذف
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="details-container-Lecture">
            <div className="details-lecture-container">
              <div className="details-row">
                <span className="details-label">نوع المصروف:</span>
                <input className="details-value" value={expenseData.expenseTypeName} disabled />
              </div>
              <div className="details-row">
                <span className="details-label">السعر:</span>
                <input className="details-value" value={`${expenseData.price.toLocaleString()} د.ع`} disabled />
              </div>
              <div className="details-row">
                <span className="details-label">الكمية:</span>
                <input className="details-value" value={expenseData.quantity} disabled />
              </div>
              <div className="details-row">
                <span className="details-label">المبلغ الإجمالي:</span>
                <input className="details-value" value={`${expenseData.amount.toLocaleString()} د.ع`} disabled />
              </div>
              <div className="details-row">
                <span className="details-label">التاريخ:</span>
                <input
                  className="details-value"
                  value={moment(expenseData.expenseDate).format("YYYY-MM-DD")}
                  disabled
                />
              </div>
              <div className="details-row">
                <span className="details-label">الملاحظات:</span>
                <textarea className="textarea-value" value={expenseData.notes || "لا توجد ملاحظات"} disabled />
              </div>
            </div>

            <div className="image-container">
              {images.length > 0 && (
                <div className="image-preview-container">
                  <span className="note-details-label">صورة المصروف:</span>
                  <ImagePreviewer
                    uploadedImages={images.map((img) => img.url)}
                    defaultWidth={600}
                    defaultHeight={"fit-content"}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Conditionally render the subexpenses table if there are subexpenses */}
          {expenseData.subExpenses && expenseData.subExpenses.length > 0 && (
            <div
              className="subexpenses-table-container"
              style={{
                width:"100%",
                marginTop: "20px",
                backgroundColor: "#fff",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <h2 style={{ textAlign: "center", marginBottom: "20px" }}>تفاصيل المصروفات الفرعية</h2>
              <Table
                dataSource={expenseData.subExpenses}
                columns={subExpensesColumns}
                rowKey="id"
                pagination={false}
                bordered
              />
            </div>
          )}
        </>
      )}

      <ConfigProvider direction="rtl">
        <Modal
          className="model-container"
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          footer={null}
        >
          <h1>تعديل المصروف</h1>
          <Form
            form={form}
            onFinish={handleSaveEdit}
            layout="vertical"
            className="dammaged-passport-container-edit-modal"
          >
            <Form.Item
              name="expenseTypeId"
              label="نوع المصروف"
              rules={[{ required: true, message: "يرجى اختيار نوع المصروف" }]}
            >
              <Select placeholder="اختر نوع المصروف">
                {expenseTypes.map((type) => (
                  <Select.Option key={type.id} value={type.id}>
                    {type.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="date" label="التاريخ" rules={[{ required: true, message: "يرجى إدخال التاريخ" }]}>
              <input
                className="custom-date-input"
                placeholder="التاريخ"
                type="date"
                value={form.getFieldValue("date")}
                onChange={(e) => form.setFieldsValue({ date: e.target.value })}
              />
            </Form.Item>
            <Form.Item name="price" label="السعر" rules={[{ required: true, message: "يرجى إدخال السعر" }]}>
              <InputNumber
                min={0}
                style={{ width: "100%" }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              />
            </Form.Item>
            <Form.Item name="quantity" label="الكمية" rules={[{ required: true, message: "يرجى إدخال الكمية" }]}>
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="notes" label="الملاحظات">
              <Input.TextArea rows={4} placeholder="أدخل الملاحظات" />
            </Form.Item>
            <Upload
              beforeUpload={(file) => {
                if (file.type === "application/pdf" || file.name?.endsWith(".pdf")) {
                  message.error("تحميل ملفات PDF غير مسموح به. يرجى تحميل صورة بدلاً من ذلك.");
                  return Upload.LIST_IGNORE;
                }
                handleImageUpload(file);
                return false;
              }}
            >
              <Button style={{ margin: "20px 0px", backgroundColor: "#efb034" }} type="primary" icon={<UploadOutlined />}>
                استبدال الصورة
              </Button>
            </Upload>
            {images.length > 0 && (
              <>
                <span className="note-details-label">صور المحضر:</span>
                <ImagePreviewer
                  uploadedImages={images.map((img) => img.url)}
                  onImageSelect={(index) => {
                    const selectedImage = images[index];
                    if (selectedImage) {
                      setImageData({
                        imageId: selectedImage.id,
                        entityId: expenseId,
                        entityType: "Expense",
                      });
                    }
                  }}
                  defaultWidth="100%"
                  defaultHeight={300}
                />
              </>
            )}
            <Button type="primary" htmlType="submit" block className="submit-button">
              حفظ التعديلات
            </Button>
          </Form>
        </Modal>

        <Modal
          title="تأكيد الحذف"
          open={deleteModalVisible}
          onOk={handleDelete}
          onCancel={() => setDeleteModalVisible(false)}
          okText="حذف"
          cancelText="إلغاء"
        >
          <p>هل أنت متأكد أنك تريد حذف هذا المصروف؟</p>
        </Modal>
      </ConfigProvider>
    </div>
  );
};

export default ExpensessView;
