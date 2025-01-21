import { useState, useEffect } from "react";
import {
  Spin,
  message,
  Modal,
  Form,
  Input,
  Button,
  ConfigProvider,
  DatePicker,
  Select,
  InputNumber,
  Upload
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "./../../../intercepters/axiosInstance.js";
import useAuthStore from "./../../../store/store";
import Url from "./../../../store/url.js";
import ImagePreviewer from "./../../../reusable/ImagePreViewer.jsx";
import moment from "moment";
import './../lecturer/LecturerShow.css';
const ExpensessView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dailyExpenseId = location.state?.dailyExpenseId;
  const [imageData, setImageData] = useState({
    imageId: "",
    entityId: "",
    entityType: "Expense",
  });
  // If dailyExpenseId is not available in state, try to get it from the URL params
  const expenseId = dailyExpenseId || new URLSearchParams(location.search).get('id');
  const status = location.state?.status; // Access the passed status

  const [images, setImages] = useState([]);
  const [expenseData, setExpenseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [form] = Form.useForm();
  
  const { isSidebarCollapsed, permissions,profile } = useAuthStore();
   const hasUpdatePermission = permissions.includes("EXu"); 
  const hasDeletePermission = permissions.includes("EXd"); 
  const canPerformActions = () => {
    return (
      hasUpdatePermission &&
      hasDeletePermission &&
      ["New", "ReturnedToSupervisor"].includes(status) // Check the passed status
    );
  };
  /* i dont use it for now  */
  const fetchExpenseTypes = async () => {
    try {
      const response = await axiosInstance.get('/api/ExpenseType');
      setExpenseTypes(response.data || []);
    } catch (error) {
      message.error('فشل في جلب أنواع المصروفات');
    }
  };

  const fetchExpenseDetails = async () => {
    try {
      const response = await axiosInstance.get(`/api/Expense/dailyexpenses/${expenseId}`);
      const expense = response.data;
      console.log("expense",expense)
      setExpenseData(expense);
      form.setFieldsValue({
        ...expense,
        date: moment(expense.expenseDate),
        expenseTypeId: expense.expenseTypeId,
        price: expense.price,
        quantity: expense.quantity,
        amount: expense.amount,
        notes: expense.notes
      });
    } catch (error) {
      message.error('حدث خطأ أثناء جلب تفاصيل المصروف');
    }
  };
  const fetchExpensesImages = async () => {
    try {
      const response = await axiosInstance.get(
        `${Url}/api/Attachment/Expense/${expenseId}`
      );
      console.log("Image API Response:", response.data);
  
      const imageUrls = response.data.map((image) => ({
        url: image.filePath, // Ensure this matches the backend response
        id: image.id,
      }));
  
      setImages(imageUrls); // Update state with new images
      console.log("Updated Images State:", imageUrls);
    } catch (error) {
      console.error("Error fetching images:", error);
      message.error("حدث خطأ أثناء جلب صور المصروف");
    }
  };
  useEffect(() => {
    console.log("Monthly Status:", expenseData?.monthlyStatus);
    console.log("Has Update Permission:", hasUpdatePermission);
    console.log("Has Delete Permission:", hasDeletePermission);
    console.log("Can Perform Actions:", canPerformActions());
  }, [expenseData, hasUpdatePermission, hasDeletePermission]);
  

  useEffect(() => {
    if (!expenseId) {
      message.error('معرف المصروف غير موجود');
      setTimeout(() => {
        navigate('/Expensess', { replace: true });
      }, 1500);
      return;
    }

    const initializeData = async () => {
      setLoading(true);
      try {
        await fetchExpensesImages();
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
  const handleImageUpload = async (file) => {
    if (!imageData.imageId) {
      message.error("لم يتم تحديد الصورة");
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append("entityId", expenseId);
      formData.append("entityType", "Expense");
      formData.append("file", file);
  
      const response = await axiosInstance.put(
        `${Url}/api/attachment/${imageData.imageId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
  
      console.log("Upload Response:", response.data); // Log backend response
      message.success("تم تحديث الصورة بنجاح");
  
      // Refetch images to update the state with the latest data
      await fetchExpensesImages();
    } catch (error) {
      console.error("Error during image upload:", error);
      message.error("حدث خطأ أثناء تعديل الصورة");
    }
  };
  
  const handleSaveEdit = async (values) => {
    try {
      const updatedValues = {
        id: expenseId,
        expenseDate: values.date.toISOString(),
        price: values.price,
        quantity: values.quantity,
        amount: values.price * values.quantity,
        notes: values.notes || "",
        expenseTypeId: values.expenseTypeId,
        officeId: expenseData.officeId,
        governorateId: expenseData.governorateId,
        profileId: expenseData.profileId
      };

      await axiosInstance.put(`/api/Expense/${expenseId}`, updatedValues);
      message.success('تم تحديث المصروف بنجاح');
      setEditModalVisible(false);
      await fetchExpenseDetails();
    } catch (error) {
      message.error('حدث خطأ أثناء تعديل المصروف');
    }
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/api/Expense/${expenseId}`);
      message.success('تم حذف المصروف بنجاح');
      setDeleteModalVisible(false);
      navigate(-1);
    } catch (error) {
      message.error('حدث خطأ أثناء حذف المصروف');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!expenseData) {
    return <div className="loading">جاري التحميل...</div>;
  }
console.log("month" ,expenseData.monthlyStatus)
  return (
    <div
      className={`supervisor-lecture-show-container ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl">
      <div className="title-container">
        <h1>تفاصيل المصروف</h1>
        <div style={{display:"flex", justifyContent:"space-between", marginBottom: "20px",gap:"20px"}}>
        <Button 
              type="primary" 
              style={{padding:"20px 30px",backgroundColor:"#efb034"}} 
              onClick={() => navigate(-1)}
            >
              الرجوع
            </Button>
            {canPerformActions() && (
  <>
    <Button
      type="primary"
      style={{ padding: "20px 30px" }}
      onClick={() => setEditModalVisible(true)}
    >
      تعديل
    </Button>
    <Button
      danger
      type="primary"
      style={{ padding: "20px 40px" }}
      onClick={() => handleDelete()}
    >
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
            <input
              className="details-value"
              value={expenseData.expenseTypeName}
              disabled
            />
          </div>
          
          <div className="details-row">
            <span className="details-label">السعر:</span>
            <input
              className="details-value"
              value={`${expenseData.price.toLocaleString()} د.ع`}
              disabled
            />
          </div>
          <div className="details-row">
            <span className="details-label">الكمية:</span>
            <input
              className="details-value"
              value={expenseData.quantity}
              disabled
            />
          </div>
          <div className="details-row">
            <span className="details-label">المبلغ الإجمالي:</span>
            <input
              className="details-value"
              value={`${expenseData.amount.toLocaleString()} د.ع`}
              disabled
            />
          </div>
          <div className="details-row">
            <span className="details-label">المكتب:</span>
            <input
              className="details-value"
              value={profile.officeName}
              disabled
            />
          </div>
          <div className="details-row">
            <span className="details-label">المحافظة:</span>
            <input
              className="details-value"
              value={profile.governorateName}
              disabled
            />
          </div>
          <div className="details-row">
            <span className="details-label">التاريخ:</span>
            <input
              className="details-value"
              value={moment(expenseData.expenseDate).format("YYYY-MM-DD")}
              disabled
            />
          </div>
          <div className="note-details-value">
            <span className="details-label">الملاحظات:</span>
            <textarea
              className="textarea-value"
              value={expenseData.notes || "لا توجد ملاحظات"}
              disabled
            />
          </div>
          
        </div>
        <div className="image-lecture-container">
                    {images.length > 0 && (
                      <div className="image-lecture-preview-container">
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

      <ConfigProvider direction="rtl">
        <Modal
          className="model-container"
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          footer={null}>
          <h1>تعديل المصروف</h1>
          <Form
            form={form}
            onFinish={handleSaveEdit}
            layout="vertical"
            className="dammaged-passport-container-edit-modal">
            <Form.Item
              name="expenseTypeId"
              label="نوع المصروف"
              rules={[{ required: true, message: "يرجى اختيار نوع المصروف" }]}>
              <Select placeholder="اختر نوع المصروف">
                {expenseTypes.map((type) => (
                  <Select.Option key={type.id} value={type.id}>
                    {type.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="date"
              label="التاريخ"
              rules={[{ required: true, message: "يرجى إدخال التاريخ" }]}>
              <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="price"
              label="السعر"
              rules={[{ required: true, message: "يرجى إدخال السعر" }]}>
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>

            <Form.Item
              name="quantity"
              label="الكمية"
              rules={[{ required: true, message: "يرجى إدخال الكمية" }]}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="notes" label="الملاحظات">
              <Input.TextArea rows={4} placeholder="أدخل الملاحظات" />
            </Form.Item>
            <Upload
              beforeUpload={(file) => {
                handleImageUpload(file);
                return false;
              }}>
              <Button
                style={{ margin: "20px 0px", backgroundColor: "#efb034" }}
                type="primary"
                icon={<UploadOutlined />}>
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
            <Button
              type="primary"
              htmlType="submit"
              block
              className="submit-button">
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
          cancelText="إلغاء">
          <p>هل أنت متأكد أنك تريد حذف هذا المصروف؟</p>
        </Modal>
      </ConfigProvider>
    </div>
  );
};

export default ExpensessView;