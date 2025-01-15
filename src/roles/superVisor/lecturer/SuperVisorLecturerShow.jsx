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
  Upload,
} from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { UploadOutlined } from "@ant-design/icons";
import axiosInstance from "./../../../intercepters/axiosInstance.js";
import ImagePreviewer from "./../../../reusable/ImagePreViewer.jsx";
import "./LecturerShow.css";
import useAuthStore from "./../../../store/store";
import Url from "./../../../store/url.js";
import Lele from "./../../../reusable elements/icons.jsx";
import moment from "moment";

const LecturerShow = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const lectureId = location.state?.id;

  const [imageData, setImageData] = useState({
    imageId: "",
    entityId: "",
    entityType: "Lecture",
  });
  const [lectureData, setLectureData] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [lectureTypes, setLectureTypes] = useState([]);
  const [initialCompanyId, setInitialCompanyId] = useState(null);
  const [initialLectureTypeIds, setInitialLectureTypeIds] = useState(null);
  const [form] = Form.useForm();

  const { isSidebarCollapsed, permissions } = useAuthStore();
  const hasUpdatePermission = permissions.includes("Lu");
  const hasDeletePermission = permissions.includes("Ld");

  const fetchCompanies = async () => {
    try {
      const response = await axiosInstance.get(`${Url}/api/Company`);
      setCompanies(response.data);
    } catch (error) {
      message.error("فشل في جلب بيانات الشركات");
    }
  };

  const fetchLectureDetails = async () => {
    try {
      const response = await axiosInstance.get(
        `${Url}/api/Lecture/${lectureId}`
      );
      const lecture = response.data;
      setLectureData(lecture);

      // Store initial values
      setInitialCompanyId(lecture.companyId);
      setInitialLectureTypeIds(lecture.lectureTypeIds);

      // Preload lecture types
      const selectedCompany = companies.find((c) => c.id === lecture.companyId);
      if (selectedCompany) {
        setLectureTypes(selectedCompany.lectureTypes || []);
      }

      // Set form values
      form.setFieldsValue({
        ...lecture,
        date: moment(lecture.date),
        companyId: lecture.companyId,
        lectureTypeIds: lecture.lectureTypeIds,
      });
    } catch (error) {
      message.error("حدث خطأ أثناء جلب تفاصيل المحضر");
    }
  };

  const fetchLectureImages = async () => {
    try {
      const response = await axiosInstance.get(
        `${Url}/api/Attachment/Lecture/${lectureId}`
      );
      const imageUrls = response.data.map((image) => ({
        url: image.filePath,
        id: image.id,
      }));
      setImages(imageUrls);
    } catch (error) {
      message.error("حدث خطأ أثناء جلب صور المحضر");
    }
  };

  useEffect(() => {
    if (!lectureId) {
      message.error("معرف المحضر غير موجود");
      navigate(-1);
      return;
    }

    const initializeData = async () => {
      setLoading(true);

      try {
        // Fetch companies first
        await fetchCompanies();

        // Fetch lecture details after companies are loaded
        await fetchLectureDetails();

        // Finally, fetch images
        await fetchLectureImages();
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [lectureId, navigate]);

  const handleCompanyChange = (value) => {
    const selectedCompany = companies.find((c) => c.id === value);
    setLectureTypes(selectedCompany?.lectureTypes || []);
    form.setFieldValue("lectureTypeIds", undefined);
  };

  const handleImageUpload = async (file) => {
    if (!imageData.imageId) {
      message.error("لم يتم تحديد الصورة");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("entityId", lectureId);
      formData.append("entityType", "Lecture");
      formData.append("file", file);

      await axiosInstance.put(
        `${Url}/api/attachment/${imageData.imageId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      message.success("تم تحديث الصورة بنجاح");
      await fetchLectureImages();
    } catch (error) {
      message.error("حدث خطأ أثناء تعديل الصورة");
    }
  };

  const handleSaveEdit = async (values) => {
    try {
      const updatedValues = {
        id: lectureId,
        title: values.title,
        date: values.date.toISOString(),
        note: values.note || "",
        officeId: lectureData.officeId,
        governorateId: lectureData.governorateId,
        profileId: lectureData.profileId,
        companyId: values.companyId,
        lectureTypeIds: values.lectureTypeIds, // Multiple lecture type IDs
      };

      await axiosInstance.put(`${Url}/api/Lecture/${lectureId}`, updatedValues);
      message.success("تم تحديث المحضر بنجاح");
      setEditModalVisible(false);
      await fetchLectureDetails();
    } catch (error) {
      message.error("حدث خطأ أثناء تعديل المحضر");
    }
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`${Url}/api/Lecture/${lectureId}`);
      message.success("تم حذف المحضر بنجاح");
      setDeleteModalVisible(false);
      navigate(-1);
    } catch (error) {
      message.error("حدث خطأ أثناء حذف المحضر");
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!lectureData) {
    return <div className="loading">جاري التحميل...</div>;
  }

  return (
    <div
      className={`supervisor-lecture-show-container ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl">
      <div className="title-container">
        <h1>تفاصيل المحضر</h1>
        <div className="edit-button-and-delete">
          <Button onClick={() => navigate(-1)} className="back-button">
            <Lele type="back" />
            الرجوع
          </Button>
          {hasDeletePermission && (
            <Button
              onClick={() => setDeleteModalVisible(true)}
              className="delete-button-lecture">
              حذف <Lele type="delete" />
            </Button>
          )}
          {hasUpdatePermission && (
            <Button
              onClick={() => {
                // Reset company and lecture type to their initial values
                form.setFieldsValue({
                  companyId: initialCompanyId,
                  lectureTypeIds: initialLectureTypeIds,
                });

                // Preload lecture types based on the initial company
                const selectedCompany = companies.find(
                  (c) => c.id === initialCompanyId
                );
                setLectureTypes(selectedCompany?.lectureTypes || []);

                // Open the edit modal
                setEditModalVisible(true);
              }}
              className="edit-button-lecture">
              تعديل <Lele type="edit" />
            </Button>
          )}
        </div>
      </div>

      <div className="details-container-Lecture">
        <div className="details-lecture-container">
          <div className="details-row">
            <span className="details-label">عنوان المحضر:</span>
            <input
              className="details-value"
              value={lectureData.title}
              disabled
            />
          </div>
          <div className="details-row">
            <span className="details-label">التاريخ:</span>
            <input
              className="details-value"
              value={moment(lectureData.date).format("YYYY-MM-DD ")}
              disabled
            />
          </div>
          <div className="details-row">
            <span className="details-label">المكتب:</span>
            <input
              className="details-value"
              value={lectureData.officeName}
              disabled
            />
          </div>
          <div className="details-row">
            <span className="details-label">المحافظة:</span>
            <input
              className="details-value"
              value={lectureData.governorateName}
              disabled
            />
          </div>
          <div className="details-row">
            <span className="details-label">اسم الشركة:</span>
            <input
              className="details-value"
              value={lectureData.companyName}
              disabled
            />
          </div>
          <div className="details-row">
            <span className="details-label">نوع المحضر:</span>
            <input
              className="details-value"
              value={lectureData.lectureTypeNames?.join(", ")}
              disabled
            />
          </div>
          <div className="note-details-value">
            <span className="details-label">الملاحظات:</span>
            <textarea
              className="textarea-value"
              value={lectureData.note || "لا توجد ملاحظات"}
              disabled
            />
          </div>
        </div>
        <div className="image-lecture-container">
          {images.length > 0 && (
            <div className="image-lecture-preview-container">
              <span className="note-details-label">صور المحضر:</span>
              <ImagePreviewer
                uploadedImages={images.map((img) => img.url)}
                defaultWidth={600}
                defaultHeight={300}
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
          <h1>تعديل المحضر</h1>
          <Form
            form={form}
            onFinish={handleSaveEdit}
            layout="vertical"
            className="dammaged-passport-container-edit-modal"
            initialValues={{
              ...lectureData,
              date: moment(lectureData?.date),
            }}>
            <Form.Item
              name="title"
              label="عنوان المحضر"
              rules={[{ required: true, message: "يرجى إدخال عنوان المحضر" }]}>
              <Input placeholder="عنوان المحضر" />
            </Form.Item>

            <Form.Item
              name="date"
              label="التاريخ"
              rules={[{ required: true, message: "يرجى إدخال التاريخ" }]}>
              <Input type="date" />
            </Form.Item>

            <Form.Item
              name="companyId"
              label="الشركة"
              rules={[{ required: true, message: "يرجى اختيار الشركة" }]}>
              <Select placeholder="اختر الشركة" onChange={handleCompanyChange}>
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
              rules={[{ required: true, message: "يرجى اختيار نوع المحضر" }]}>
              <Select
                mode="multiple"
                placeholder="اختر نوع المحضر"
                disabled={!form.getFieldValue("companyId")}
                value={form.getFieldValue("lectureTypeIds") || []}
                onChange={(value) => form.setFieldValue("lectureTypeIds", value)}>
                {lectureTypes.map((type) => (
                  <Select.Option key={type.id} value={type.id}>
                    {type.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="note" label="الملاحظات">
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
                        entityId: lectureId,
                        entityType: "Lecture",
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
          <p>هل أنت متأكد أنك تريد حذف هذا المحضر؟</p>
        </Modal>
      </ConfigProvider>
    </div>
  );
};

export default LecturerShow;
