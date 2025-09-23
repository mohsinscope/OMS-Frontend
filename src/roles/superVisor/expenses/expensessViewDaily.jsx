import { useState, useEffect, useMemo } from "react";
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
  Table,
} from "antd";
import { UploadOutlined,ArrowRightOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "./../../../intercepters/axiosInstance.js";
import useAuthStore from "./../../../store/store";
import Url from "./../../../store/url.js";
import ImagePreviewer from "./../../../reusable/ImagePreViewer.jsx";
import moment from "moment";

const ExpensessViewDaily   = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentSeq       = location.state?.currentSeq ?? null;
const parentExpenseId  = location.state?.parentExpenseId;
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
const dailyExpensesList =
  location.state?.dailyExpenses ||
  JSON.parse(sessionStorage.getItem("dailyList") || "[]");
const orderedDaily = useMemo(
  () => [...dailyExpensesList].sort((a, b) => a.seqId - b.seqId),
  [dailyExpensesList]
);
const currentIdx  = orderedDaily.findIndex((e) => e.seqId === currentSeq);
const prevExpense = currentIdx > 0 ? orderedDaily[currentIdx - 1] : null;
const nextExpense =
  currentIdx >= 0 && currentIdx < orderedDaily.length - 1
    ? orderedDaily[currentIdx + 1]
    : null;
  const [images, setImages] = useState([]);
  const [expenseData, setExpenseData] = useState(null);
  const [parentExpenseData, setParentExpenseData] = useState(null); // Added for storing parent data
  const [allRelatedExpenses, setAllRelatedExpenses] = useState([]); // Store all related expenses
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Loading state for details
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [form] = Form.useForm();
const [uploadLoading, setUploadLoading] = useState(false);


  const { isSidebarCollapsed, permissions, profile, roles } = useAuthStore();
  const hasUpdatePermission = permissions.includes("EXu");
  const hasDeletePermission = permissions.includes("EXd");
  const canPerformActions = () =>
    hasUpdatePermission &&
    hasDeletePermission &&
    ["New", "ReturnedToSupervisor"].includes(status);

  // Fetch expense types
  const fetchExpenseTypes = async () => {
    try {
      const response = await axiosInstance.get("/api/ExpenseType?PageNumber=1&PageSize=1000");
      setExpenseTypes(response.data || []);
    } catch (error) {
      message.error("فشل في جلب أنواع المصروفات");
    }
  };

  // Fetch parent expense details when viewing a sub-expense
  const fetchParentExpenseDetails = async (parentId) => {
    try {
      const response = await axiosInstance.get(`/api/Expense/dailyexpenses/${parentId}`);
      const parentExpense = response.data;
      if (!parentExpense) throw new Error("No parent expense data found");
      
      setParentExpenseData(parentExpense);
      
      // Prepare all related expenses for display in the table
      const allExpenses = [
        // Include the parent expense with a special flag
        { ...parentExpense, isParent: true },
        // Include all sub-expenses except the current one if viewing a sub-expense
        ...(parentExpense.subExpenses || []).filter(sub => sub.id !== expenseId)
      ];
      
      setAllRelatedExpenses(allExpenses);
      
      // Use parent's images
      fetchExpensesImages(parentId);
      
    } catch (error) {
      console.error("Error fetching parent expense details:", error);
      message.error("حدث خطأ أثناء جلب تفاصيل المصروف الرئيسي");
    }
  };

  // Fetch expense details - modified to handle both parent and sub expenses
  const fetchExpenseDetails = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get(`/api/Expense/dailyexpenses/${expenseId}`);
      const expense = response.data;
      if (!expense) throw new Error("No expense data found");

      setExpenseData(expense);
      
      // Check if this is a sub-expense
      if (expense.parentExpenseId) {
        // If it's a sub-expense, fetch the parent expense
        await fetchParentExpenseDetails(expense.parentExpenseId);
      } else if (expense.subExpenses && expense.subExpenses.length > 0) {
        // If it's a parent expense, set up related expenses
        setAllRelatedExpenses([
          { ...expense, isParent: true },
          ...(expense.subExpenses || [])
        ]);
        // Use this expense's images
        fetchExpensesImages(expense.id);
      } else {
        // Regular expense with no relation
        fetchExpensesImages(expense.id);
      }
      
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

  // Fetch images using the provided ID
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
useEffect(() => {
  if (location.state?.dailyExpenses) {
    sessionStorage.setItem("dailyList", JSON.stringify(location.state.dailyExpenses));
  }
}, [location.state]);
  // Initialize data on component mount
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

// Fixed handleImageUpload function (replace the existing one around line ~139)
const handleImageUpload = async (files) => {
  if (!files || files.length === 0) {
    return message.error("يرجى اختيار صورة واحدة على الأقل");
  }

  // Determine the correct ID to use for upload
  const idForUpload = parentExpenseData?.id || expenseData?.parentExpenseId || expenseId;
  
  if (!idForUpload) {
    return message.error("لا يمكن تحديد معرف المصروف للرفع");
  }

  setUploadLoading(true);
  const formData = new FormData();
  
  // Handle both single file and file array
  const fileArray = Array.isArray(files) ? files : [files];
  fileArray.forEach(file => {
    formData.append("files", file);
  });
  formData.append("entityType", "Expense");

  try {
    const response = await axiosInstance.put(
      `${Url}/api/attachment/${idForUpload}`,
      formData,
      { 
        headers: { 
          "Content-Type": "multipart/form-data" 
        },
        timeout: 30000 // Add timeout
      }
    );
    
    if (response.status === 200 || response.status === 204) {
      message.success("تم تحديث الصور بنجاح");
      // Refresh images after successful upload
      await fetchExpensesImages(idForUpload);
    }
  } catch (err) {
    console.error("Upload error:", err);
    if (err.response?.status === 500) {
    } else if (err.response?.status === 413) {
      message.error("حجم الملف كبير جداً");
    } else {
      message.error("حدث خطأ أثناء تعديل الصور");
    }
  } finally {
    setUploadLoading(false);
  }
};

const isSupervisorOnly = useMemo(() => {
  const normalize = (v) =>
    (typeof v === "string" ? v : v?.name ?? v ?? "")
      .toString()
      .toLowerCase();

  const roleList = (roles || []).map(normalize).filter(Boolean);
  const pos = normalize(profile?.position);

  // Hide for explicit role=supervisor OR position contains supervisor
  return roleList.includes("supervisor") || pos.includes("supervisor");
}, [roles, profile?.position]);

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

  // Define a helper function to calculate overall total, works for both parent and sub-expenses
  const calculateOverallTotal = () => {
    if (parentExpenseData) {
      // If this is a sub-expense, calculate total from parent data
      let total = parentExpenseData.amount || 0;
      if (parentExpenseData.subExpenses && parentExpenseData.subExpenses.length > 0) {
        total += parentExpenseData.subExpenses.reduce((sum, sub) => sum + (sub.amount || 0), 0);
      }
      return total;
    } else if (expenseData) {
      // If this is a parent expense or regular expense
      let total = expenseData.amount || 0;
      if (expenseData.subExpenses && expenseData.subExpenses.length > 0) {
        total += expenseData.subExpenses.reduce((sum, sub) => sum + (sub.amount || 0), 0);
      }
      return total;
    }
    return 0;
  };

  // Check what type of expense it is before showing the appropriate delete modal
  const confirmDelete = () => {
    // Check if this is a main expense with sub-expenses
    if (expenseData.subExpenses && expenseData.subExpenses.length > 0) {
      Modal.confirm({
        title: "تأكيد الحذف",
        content: (
          <p style={{ color: "red", fontWeight: "bold" }}>
            هل انت متاكد من حذف المصروف الرئيسي؟ سوف يتم حذف جميع المصاريف الفرعية معه
          </p>
        ),
        okText: "حذف",
        cancelText: "إلغاء",
        okButtonProps: { danger: true },
        onOk: handleDelete,
      });
    } 
    // Check if this is a sub-expense
    else if (subExpenseId || expenseData.parentExpenseId) {
      Modal.confirm({
        title: "تأكيد الحذف",
        content: (
          <p>
            هل انت متاكد من حذف المصروف الفرعي هذا؟
          </p>
        ),
        okText: "حذف",
        cancelText: "إلغاء",
        okButtonProps: { danger: true },
        onOk: handleDelete,
      });
    } 
    // Regular expense with no sub-expenses and not a sub-expense itself
    else {
      Modal.confirm({
        title: "تأكيد الحذف",
        content: (
          <p>
            هل انت متاكد من حذف هذا المصروف؟
          </p>
        ),
        okText: "حذف",
        cancelText: "إلغاء",
        okButtonProps: { danger: true },
        onOk: handleDelete,
      });
    }
  };

  // Define columns for the expenses table - shows parent and related expenses
  const expensesColumns = [
    {
      title: "رقم",
      key: "index",
      render: (text, record, index) => index + 1,
      width: 50,
    },
    {
      title: "نوع المصروف",
      dataIndex: "expenseTypeName",
      key: "expenseTypeName",
      width: 150,
      render: (text, record) => (
        <span style={record.isParent ? { fontWeight: 'bold', color: 'blue' } : {}}>
          {record.isParent ? `${text} ` : text}
        </span>
      ),
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
// داخل expensesColumns
{
  title: "الإجراءات",
  key: "actions",
  width: 100,
  fixed: "right",
  render: (_, record) =>
    !record.isParent && (              // لا زرّ للمصروف الرئيسى
      <Button
        type="primary"
        onClick={() =>
          navigate("/Expensess-view-daily", {
            state: {
              dailyExpenseId: record.id, // معرّف المصروف الفرعي
              status,                    // ⬅️ الحالة المأخوذة من location.state
            },
          })
        }
      >
        العرض
      </Button>
    ),
},
  ];

  // Determine if we're viewing a parent expense, a sub-expense, or a regular expense
  const isParentExpense = expenseData && expenseData.subExpenses && expenseData.subExpenses.length > 0;
  const isSubExpense = expenseData && expenseData.parentExpenseId;
  
  // Determine which expenses to show in the table
  const expensesToShow = isSubExpense ? allRelatedExpenses : (isParentExpense ? allRelatedExpenses : []);
  
  // Highlight the current expense if it's a sub-expense
  const highlightCurrentSubExpense = () => {
    if (isSubExpense && allRelatedExpenses.length > 0) {
      return allRelatedExpenses.map(expense => ({
        ...expense,
        isCurrentExpense: expense.id === expenseId
      }));
    }
    return expensesToShow;
  };

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
              {isParentExpense && (
                <span style={{ color: "blue", marginRight: "8px" }}> - مصروف متعدد</span>
              )}
              {isSubExpense && (
                <span style={{ color: "green", marginRight: "8px" }}> - مصروف فرعي</span>
              )}
            </h1>
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 20,
    flexWrap: "wrap",
    width:"100%"
  }}
>
  {/* عودة إلى صفحة المصروفات الشهرية — hidden for Supervisor */}
  {!isSupervisorOnly && (
    <Link to="/expenses-view" state={{ expenseId: parentExpenseId }}>
      <Button
        type="primary"
        size="large"
        shape="round"
        style={{ paddingInline: 32, background: "#efb034", borderColor: "#efb034" }}
      >
        عودة
      </Button>
    </Link>
  )}

   {/* أزرار الرجوع / التالى — hidden for Supervisor */}
  {!isSupervisorOnly && (
    <div style={{ display: "flex", gap: 12 }}>
      <Button
        disabled={!prevExpense}
        size="large"
        shape="round"
        icon={<ArrowRightOutlined />}
        style={{ paddingInline: 28 }}
        onClick={() =>
          prevExpense &&
          navigate("/Expensess-view-daily", {
            state: {
              dailyExpenseId: prevExpense.id,
              currentSeq: prevExpense.seqId,
              parentExpenseId,
              status,
              dailyExpenses: orderedDaily,
            },
            replace: true,
          })
        }
      >
        الرجوع
      </Button>

      <Button
        disabled={!nextExpense}
        type="primary"
        size="large"
        shape="round"
        icon={<ArrowLeftOutlined />}
        style={{ paddingInline: 28, display: "flex", flexDirection: "row-reverse" }}
        onClick={() =>
          nextExpense &&
          navigate("/Expensess-view-daily", {
            state: {
              dailyExpenseId: nextExpense.id,
              currentSeq: nextExpense.seqId,
              parentExpenseId,
              status,
              dailyExpenses: orderedDaily,
            },
            replace: true,
          })
        }
      >
        التالى
      </Button>
    </div>
  )}

  {/* edit / delete (unchanged) */}
  {canPerformActions() && (
    <>
      <Button type="primary" style={{ padding: "20px 30px" }} onClick={handleEditClick}>
        تعديل
      </Button>
      <Button danger type="primary" style={{ padding: "20px 40px" }} onClick={confirmDelete}>
        حذف
      </Button>
    </>
  )}
</div>
          </div>

          <div className="details-container-Lecture">
            <div className="details-lecture-container">
              {/* Display all individual fields only when NOT viewing a parent expense with children */}
              {!isParentExpense && (
                <>
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
                </>
              )}
              
              {/* Always show the total amount for parent expenses with children or sub-expenses */}
              {(isParentExpense || isSubExpense) && (
                <div className="details-row">
                  <span className="details-label">
                    المبلغ الإجمالي للمصاريف كلها مع المصاريف الإضافية:
                  </span>
                  <input
                    className="details-value"
                    value={`${calculateOverallTotal().toLocaleString()} د.ع`}
                    disabled
                  />
                </div>
              )}
              
              {/* Always show date and notes regardless of expense type */}
              <div className="details-row">
                <span className="details-label">التاريخ:</span>
                <input
                  className="details-value"
                  value={moment(expenseData.expenseDate).format("YYYY-MM-DD")}
                  disabled
                />
              </div>
         
            </div>

            <div className="image-container">
              {images.length > 0 && (
                <div className="image-preview-container">
                  <span className="note-details-label">صورة المصروف:</span>
                  <ImagePreviewer
                    uploadedImages={images.map((img) => img.url)}
                    defaultWidth={350}
                    defaultHeight={"fit-content"}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Show the related expenses table for both parent and sub expenses */}
          {(isParentExpense || isSubExpense) && expensesToShow.length > 0 && (
            <div
              className="related-expenses-table-container"
              style={{
                width: "100%",
                marginTop: "20px",
                backgroundColor: "#fff",
                padding: "20px",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
                {isSubExpense 
                  ? "جميع المصروفات المرتبطة (الرئيسي والفرعية)" 
                  : "تفاصيل المصروفات الفرعية"
                }
              </h2>
              <Table
                dataSource={highlightCurrentSubExpense()}
                columns={expensesColumns}
                rowKey="id"
                pagination={false}
                bordered
                rowClassName={(record) => record.id === expenseId ? 'highlighted-row' : ''}
              />
              <style jsx>{`
                .highlighted-row {
                  background-color: #f0f8ff;
                  font-weight: bold;
                }
              `}</style>
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
  multiple
  accept="image/*"
  showUploadList={false}
  beforeUpload={(file, fileList) => {
    // Validate file size (e.g., max 5MB per file)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = fileList.filter(f => f.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      message.error("حجم الملف يجب أن يكون أقل من 5 ميجابايت");
      return false;
    }
    
    // Call upload function with all selected files
    handleImageUpload(fileList);
    return false; // Prevent default upload
  }}
  disabled={uploadLoading}
>
  <Button
    style={{ margin: "20px 0", backgroundColor: "#efb034" }}
    type="primary"
    icon={<UploadOutlined />}
    loading={uploadLoading}
    disabled={uploadLoading}
  >
    {uploadLoading ? "جاري الرفع..." : "استبدال الصورة"}
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
                        entityId: isSubExpense && parentExpenseData ? parentExpenseData.id : expenseId,
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

export default ExpensessViewDaily ;