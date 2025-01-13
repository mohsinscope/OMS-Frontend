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
  InputNumber
} from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "./../../../intercepters/axiosInstance.js";
import useAuthStore from "./../../../store/store";
import Lele from "./../../../reusable elements/icons.jsx";
import moment from "moment";
import './styles/expensessView.css';
const ExpensessView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dailyExpenseId = location.state?.dailyExpenseId;
  // If dailyExpenseId is not available in state, try to get it from the URL params
  const expenseId = dailyExpenseId || new URLSearchParams(location.search).get('id');

  const [expenseData, setExpenseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [form] = Form.useForm();

  const { isSidebarCollapsed, permissions } = useAuthStore();
  const hasUpdatePermission = permissions.includes("Eu"); // Replace with actual permission code
  const hasDeletePermission = permissions.includes("Ed"); // Replace with actual permission code

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
      const response = await axiosInstance.get(`/api/Expense/${expenseId}`);
      const expense = response.data;
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

  return (
    <div
      className={`supervisor-expense-show-container ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl">
      <div className="title-container">
        <h1>تفاصيل المصروف</h1>
        <div className="edit-button-and-delete">
          <Button onClick={() => navigate(-1)} className="back-button">
            <Lele type="back" />
            الرجوع
          </Button>
          {hasDeletePermission && (
            <Button
              onClick={() => setDeleteModalVisible(true)}
              className="delete-button-expense">
              حذف <Lele type="delete" />
            </Button>
          )}
          {hasUpdatePermission && (
            <Button
              onClick={() => setEditModalVisible(true)}
              className="edit-button-expense">
              تعديل <Lele type="edit" />
            </Button>
          )}
        </div>
      </div>

      <div className="details-container-expense">
        <div className="details-expense-container">
          <div className="details-row">
            <span className="details-label">نوع المصروف:</span>
            <input
              className="details-value"
              value={expenseData.expenseTypeName}
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
              value={expenseData.officeName}
              disabled
            />
          </div>
          <div className="details-row">
            <span className="details-label">المحافظة:</span>
            <input
              className="details-value"
              value={expenseData.governorateName}
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
            className="expense-edit-modal">
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