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
  Upload,
} from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { UploadOutlined } from "@ant-design/icons";
import axiosInstance from "./../../../intercepters/axiosInstance.js";
import ImagePreviewer from "./../../../reusable/ImagePreViewer.jsx";
import "./dammagedPasportsShow.css";
import useAuthStore from "../../../store/store";
import Url from "../../../store/url";
import Lele from "./../../../reusable elements/icons.jsx";

const DamagedPassportsShow = () => {
  const [imageData, setImageData] = useState({
    imageId: "",
    entityId: "",
    entityType: "DamagedPassport",
  });
  const location = useLocation();
  const navigate = useNavigate();
  const passportId = location.state?.id;
  const [passportData, setPassportData] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [damagedTypes, setDamagedTypes] = useState([]);
  const [form] = Form.useForm();
  const { isSidebarCollapsed, accessToken, profile, permissions } =
    useAuthStore();
  const { profileId, governorateId, officeId } = profile || {};
  const hasUpdatePermission = permissions.includes("DPu");
  const hasDeletePermission = permissions.includes("DPd");
  const fetchPassportDetails = async () => {
    try {
      const response = await axiosInstance.get(
        `${Url}/api/DamagedPassport/${passportId}`
      );
      const passport = response.data;
      const formattedDate = passport.date
        ? new Date(passport.date).toISOString().split("T")[0]
        : "";
      setPassportData({ ...passport, date: formattedDate });
      form.setFieldsValue({ ...passport, date: formattedDate });
    } catch (error) {
      message.error("حدث خطأ أثناء جلب تفاصيل الجواز.");
    }
  };

  const fetchPassportImages = async () => {
    try {
      const response = await axiosInstance.get(
        `${Url}/api/Attachment/DamagedPassport/${passportId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const imageUrls = response.data.map((image) => ({
        url: image.filePath,
        id: image.id,
      }));
      setImages(imageUrls);
    } catch (error) {
      message.error("حدث خطأ أثناء جلب صور الجواز.");
    }
  };

  const fetchDamagedTypes = async () => {
    try {
      const response = await axiosInstance.get(`${Url}/api/damagedtype/all`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setDamagedTypes(
        response.data.map((type) => ({
          value: type.id,
          label: type.name,
        }))
      );
    } catch (error) {
      message.error("خطأ في جلب أنواع التلف للجوازات.");
    }
  };

  useEffect(() => {
    if (!passportId) {
      message.error("معرف الجواز غير موجود.");
      navigate(-1);
      return;
    }

    setLoading(true);
    Promise.all([
      fetchPassportDetails(),
      fetchPassportImages(),
      fetchDamagedTypes(),
    ]).finally(() => setLoading(false));
  }, [passportId, navigate]);

  const handleImageUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("entityId", imageData.entityId);
      formData.append("entityType", "DamagedPassport");
      formData.append("file", file);

      console.log("Uploading image with data:", imageData);

      await axiosInstance.put(
        `${Url}/api/attachment/${imageData.imageId}`, // Use updated imageId
        formData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      message.success("تم تحديث الصورة بنجاح");
      await fetchPassportImages(); // Refresh images after upload
    } catch (error) {
      console.error("Image upload failed:", error);
      message.error("حدث خطأ أثناء تعديل الصورة");
    }
  };

  const handleSaveEdit = async (values) => {
    try {
      const updatedValues = {
        id: passportId,
        passportNumber: values.passportNumber,
        date: values.date
          ? new Date(values.date).toISOString()
          : passportData.date,
        note: values.notes || "لا يوجد",
        damagedTypeId: values.damagedTypeId,
        governorateId,
        officeId,
        profileId,
      };

      await axiosInstance.put(
        `${Url}/api/DamagedPassport/${passportId}`,
        updatedValues,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      message.success("تم تحديث بيانات الجواز بنجاح");
      setEditModalVisible(false);
      await fetchPassportDetails();
    } catch (error) {
      message.error("حدث خطأ أثناء تعديل بيانات الجواز.");
    }
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`${Url}/api/DamagedPassport/${passportId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      message.success("تم حذف الجواز بنجاح");
      setDeleteModalVisible(false);
      navigate(-1);
    } catch (error) {
      message.error("حدث خطأ أثناء حذف الجواز.");
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!passportData) {
    return <div className="loading">جاري التحميل...</div>;
  }

  return (
    <div
      className={`supervisor-passport-damage-show-container ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl">
      <div className="title-container">
        <h1>تفاصيل الجواز التالف</h1>
        <div className="edit-button-and-delete">
          <Button onClick={() => navigate(-1)} className="back-button">
            <Lele type="back" />
            الرجوع
          </Button>
          {hasDeletePermission && (
            <Button
              onClick={() => setDeleteModalVisible(true)}
              className="delete-button-passport">
              حذف <Lele type="delete" />
            </Button>
          )}
          {hasUpdatePermission && (
            <Button
              onClick={() => setEditModalVisible(true)}
              className="edit-button-passport">
              تعديل <Lele type="edit" />
            </Button>
          )}
        </div>
      </div>

      <div className="details-container-Lecture">
        <div className="details-lecture-container">
          <div className="details-row">
            <span className="details-label">رقم الجواز:</span>
            <input
              className="details-value"
              value={passportData.passportNumber}
              disabled
            />
          </div>
          <div className="details-row">
            <span className="details-label">التاريخ:</span>
            <input
              className="details-value"
              value={new Date(passportData.date).toLocaleDateString("en-CA")}
              disabled
            />
          </div>
          <div className="details-row">
            <span className="details-label">سبب التلف:</span>
            <input
              className="details-value"
              value={passportData.damagedTypeName || "غير محدد"}
              disabled
            />
          </div>
          <div className="details-row">
            <span className="details-label">الملاحظات:</span>
            <textarea
              className="textarea-value"
              value={passportData.note || "لا توجد ملاحظات"}
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

      <div className="dammaged-passport-container-edit-modal">
        <ConfigProvider direction="rtl">
          <Modal
            className="model-container"
            open={editModalVisible}
            onCancel={() => setEditModalVisible(false)}
            footer={null}>
            <h1>تعديل بيانات الجواز</h1>
            <Form
              form={form}
              onFinish={handleSaveEdit}
              layout="vertical"
              className="dammaged-passport-container-edit-modal">
              <Form.Item
                name="passportNumber"
                label="رقم الجواز"
                rules={[{ required: true, message: "يرجى إدخال رقم الجواز" }]}>
                <Input placeholder="رقم الجواز" />
              </Form.Item>
              <Form.Item
                name="damagedTypeId"
                label="سبب التلف"
                rules={[{ required: true, message: "يرجى اختيار سبب التلف" }]}>
                <Select
                  style={{ height: "45px" }}
                  options={damagedTypes}
                  placeholder="اختر سبب التلف"
                  allowClear
                />
              </Form.Item>
              <Form.Item
                name="date"
                label="التاريخ"
                rules={[{ required: true, message: "يرجى إدخال التاريخ" }]}>
                <input placeholder="التاريخ" type="date" />
              </Form.Item>
              <Form.Item
                name="notes"
                label="الملاحظات"
                rules={[{ required: false }]}>
                <Input.TextArea
                  placeholder="أدخل الملاحظات"
                  defaultValue={"لا يوجد"}
                />
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
                  <span className="note-details-label">صور الجواز التالف:</span>
                  <ImagePreviewer
                  className="edit-model-container"
                    uploadedImages={images.map((img) => img.url)}
                    onImageSelect={(index) => {
                      const selectedImage = images[index]; // Correctly map selected index to image data
                      if (selectedImage) {
                        setImageData({
                          imageId: selectedImage.id, // Set the correct imageId
                          entityId: selectedImage.entityId || passportId, // Ensure entityId is set
                          entityType: "DamagedPassport", // Maintain entityType
                        });
                      }
                    }}
                    defaultWidth="100%"
                    defaultHeight={300}
                  />
                </>
              )}
              <Button
                onClick={() => window.location.reload()}
                type="primary"
                htmlType="submit"
                block>
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
            <p>هل أنت متأكد أنك تريد حذف هذا الجواز؟</p>
          </Modal>
        </ConfigProvider>
      </div>
    </div>
  );
};

export default DamagedPassportsShow;
