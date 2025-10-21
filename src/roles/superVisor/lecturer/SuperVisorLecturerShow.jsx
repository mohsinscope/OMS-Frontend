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
  Skeleton, // 1) Import Skeleton from antd
} from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { UploadOutlined } from "@ant-design/icons";
import axiosInstance from "./../../../intercepters/axiosInstance.js";
import ImagePreviewer from "./../../../reusable/ImagePreViewer.jsx";
import "./LecturerShow.css";
import useAuthStore from "./../../../store/store";
import Url from "./../../../store/url.js";
import Lele from "./../../../reusable elements/icons.jsx";
import dayjs from "dayjs";

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
const mapTypeNamesToIds = (names = [], types = []) => {
  const wanted = new Set(names.map((n) => String(n).trim()));
  return (types || [])
    .filter((t) => wanted.has(String(t.name).trim()))
    .map((t) => String(t.id));
};
  const fetchCompanies = async () => {
    try {
      const response = await axiosInstance.get(`${Url}/api/Company`);
      setCompanies(response.data);
      return response.data; // <-- ensure caller can use the fresh list
    } catch (error) {
      message.error("فشل في جلب بيانات الشركات");
      return [];
    }
  };

  const fetchLectureDetails = async (companiesList = companies) => {
    try {
      const response = await axiosInstance.get(`${Url}/api/Lecture/${lectureId}`);
      const lecture = response.data;
      setLectureData(lecture);

      // Store initial values
      setInitialCompanyId(lecture.companyId);


      // Preload lecture types
     const pool = (companiesList?.length ? companiesList : companies) || [];
   const selectedCompany = pool.find((c) => String(c.id) === String(lecture.companyId));
      if (selectedCompany) {
        setLectureTypes(selectedCompany.lectureTypes || []);
      }

      // Set form values
      form.setFieldsValue({
        ...lecture,
     date: dayjs(lecture.date),
     companyId: lecture.companyId,
     lectureTypeIds: typeIds,
      });
    } catch (error) {
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
     const companiesList = await fetchCompanies();
 await fetchLectureDetails(companiesList);

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
const companyIdWatch = Form.useWatch('companyId', form);
  const handleCompanyChange = (value) => {
    const selectedCompany = companies.find((c) => String(c.id) === String(value));
    setLectureTypes(selectedCompany?.lectureTypes || []);

       // Now map names -> ids safely
   const typeIds = mapTypeNamesToIds(
     Array.isArray(lecture.lectureTypeNames) ? lecture.lectureTypeNames : [],
     selectedCompany?.lectureTypes || []
   );
   setInitialLectureTypeIds(typeIds);
    form.setFieldValue("lectureTypeIds", []);
  };

// before: (file) => { … }
// after:
const handleImageUpload = async (files) => {
  if (!files || files.length === 0) {
    return message.error("يرجى اختيار صورة واحدة على الأقل");
  }

  const formData = new FormData();
  files.forEach(f => formData.append("files", f));
  formData.append("entityType", "Lecture");

  try {
    await axiosInstance.put(
      `${Url}/api/attachment/${lectureId}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    message.success("تم تحديث الصور بنجاح");
    await fetchLectureImages();
  } catch (err) {
    console.error("Lecture image upload failed:", err.response?.data || err);
    message.error("حدث خطأ أثناء تعديل الصور");
  }
};


  const handleSaveEdit = async (values) => {
    try {
      const updatedValues = {
        id: lectureId,
        title: values.title,
        // Convert the string date to a Date object and then call toISOString()
        date: values.date?.toDate().toISOString(),
        note: values.note || "",
        officeId: lectureData.officeId,
        governorateId: lectureData.governorateId,
        profileId: lectureData.profileId,
        companyId: values.companyId,
        lectureTypeIds: Array.isArray(values.lectureTypeIds)
          ? values.lectureTypeIds
          : [values.lectureTypeIds], // Ensure it's always an array
      };

      await axiosInstance.put(`${Url}/api/Lecture/${lectureId}`, updatedValues);
      message.success("تم تحديث المحضر بنجاح");
      setEditModalVisible(false);
      await fetchLectureDetails(); // Refresh lecture details after update
    } catch (error) {
      console.error("Error updating lecture:", error);
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

  return (
    <div
      className={`supervisor-passport-damage-show-container ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl"
    >
      {/* 2) Conditionally render Skeleton or the main content */}
      {loading ? (
        <Skeleton active paragraph={{ rows: 12 }} />
      ) : lectureData ? (
        <>
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
                  className="delete-button-passport"
                >
                  حذف <Lele type="delete" />
                </Button>
              )}
              {hasUpdatePermission && (
                <Button
                  onClick={() => {
                    // Reset company and lecture type to their initial values
        // Pre-fill every field in the form
   const selectedCompany = companies.find(c => String(c.id) === String(initialCompanyId));
   setLectureTypes(selectedCompany?.lectureTypes || []);
        const mappedIds = mapTypeNamesToIds(
       lectureData.lectureTypeNames,
       selectedCompany?.lectureTypes || []
    );

   form.setFieldsValue({
     title:         lectureData.title,
     date:          dayjs(lectureData.date),
     companyId:     initialCompanyId,
     lectureTypeIds: mappedIds,
     note:          lectureData.note || "",
   });

   setEditModalVisible(true);
                  }}
                  className="edit-button-passport"
                >
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
                  value={dayjs(lectureData.date).format("YYYY-MM-DD")}
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
              <div className="details-row">
                <span className="details-label">الملاحظات:</span>
                <textarea
                  className="textarea-value"
                  value={lectureData.note || "لا توجد ملاحظات"}
                  disabled
                />
              </div>
            </div>

            <div className="image-container">
              {images.length > 0 && (
                <div className="image-preview-container">
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
              footer={null}
            >
              <h1>تعديل المحضر</h1>
              <Form
                form={form}
                onFinish={handleSaveEdit}
                layout="vertical"
                className="dammaged-passport-container-edit-modal"
                initialValues={{
                  ...lectureData,
                  date: dayjs(lectureData?.date),
               
                }}
              >
                <Form.Item
                  name="title"
                  label="عنوان المحضر"
                  rules={[{ required: true, message: "يرجى إدخال عنوان المحضر" }]}
                >
                  <Input placeholder="عنوان المحضر" />
                </Form.Item>

        <Form.Item
  name="date"
  label="التاريخ"
  rules={[{ required: true, message: "يرجى إدخال التاريخ" }]}
>
  <DatePicker style={{ width: '100%' }} />
</Form.Item>

                <Form.Item
                  name="companyId"
                  label="الشركة"
                  rules={[{ required: true, message: "يرجى اختيار الشركة" }]}
                >
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
                  rules={[{ required: true, message: "يرجى اختيار نوع المحضر" }]}
                >
                  <Select
                    mode="multiple"
                    placeholder="اختر نوع المحضر"
                    disabled={!companyIdWatch}
                    onChange={(value) => form.setFieldsValue({ lectureTypeIds: (value || []).map(String) })}
                    allowClear
                  >
                   {lectureTypes.map((type) => (
   <Select.Option key={String(type.id)} value={String(type.id)}>
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
                  }}
                >
                  <Button
                    style={{ margin: "20px 0px", backgroundColor: "#efb034" }}
                    type="primary"
                    icon={<UploadOutlined />}
                  >
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
              <p>هل أنت متأكد أنك تريد حذف هذا المحضر؟</p>
            </Modal>
          </ConfigProvider>
        </>
      ) : (
        // 3) Fallback if lectureData is null after loading finishes
        <div className="loading">جاري التحميل...</div>
      )}
    </div>
  );
};

export default LecturerShow;
