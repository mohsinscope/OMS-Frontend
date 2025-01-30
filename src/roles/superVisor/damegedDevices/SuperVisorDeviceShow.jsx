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
  Skeleton, // Import Skeleton
} from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { UploadOutlined } from "@ant-design/icons";
import axiosInstance from "../../../intercepters/axiosInstance.js";
import ImagePreviewer from "../../../reusable/ImagePreViewer.jsx";
import "../lecturer/LecturerShow.css";
import useAuthStore from "../../../store/store";
import Url from "../../../store/url.js";
import Lele from "../../../reusable elements/icons.jsx";

const SuperVisorDeviceShow = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const deviceId = location.state?.id;

  const [deviceData, setDeviceData] = useState(null);
  const [images, setImages] = useState([]);
  const [imagesData, setImagesData] = useState([]);
  const [imageData, setImageData] = useState({
    imageId: "",
    entityId: "",
    entityType: "DamagedDevice",
  });
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [damagedTypes, setDamagedTypes] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [form] = Form.useForm();

  const { isSidebarCollapsed, accessToken, profile, permissions } = useAuthStore();
  const { profileId, governorateId, officeId } = profile || {};

  const hasUpdatePermission = permissions.includes("DDu");
  const hasDeletePermission = permissions.includes("DDd");

  const fetchData = async () => {
    if (!deviceId || !accessToken) return;

    setLoading(true);

    try {
      const [
        deviceResponse,
        imagesResponse,
        damagedTypesResponse,
        deviceTypesResponse,
      ] = await Promise.all([
        axiosInstance.get(`${Url}/api/DamagedDevice/${deviceId}`),
        axiosInstance.get(`${Url}/api/Attachment/DamagedDevice/${deviceId}`),
        axiosInstance.get(`${Url}/api/damageddevicetype/all`),
        axiosInstance.get(`${Url}/api/devicetype`),
      ]);

      const device = deviceResponse.data;
      const formattedDate = device.date
        ? new Date(device.date).toISOString().split("T")[0]
        : "";

      setDeviceData({ ...device, date: formattedDate });
      form.setFieldsValue({ ...device, date: formattedDate });

      const fetchedImages = imagesResponse.data;
      setImagesData(fetchedImages);
      setImages(fetchedImages.map((image) => image.filePath));

      // If no imageId is selected yet but images exist, pick the first image by default
      if (!imageData.imageId && fetchedImages.length > 0) {
        setImageData({
          imageId: fetchedImages[0].id,
          entityId: deviceId,
          entityType: "DamagedDevice",
        });
      }

      setDamagedTypes(
        damagedTypesResponse.data.map((type) => ({
          value: type.id,
          label: type.name,
        }))
      );

      setDeviceTypes(
        deviceTypesResponse.data.map((type) => ({
          value: type.id,
          label: type.name,
        }))
      );
    } catch (error) {
      message.error("حدث خطأ أثناء تحميل البيانات");
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  const handleImageUpload = async (file) => {
    if (!imageData.imageId) {
      message.error("لم يتم العثور على معرف الصورة");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("entityId", deviceId);
      formData.append("entityType", "DamagedDevice");
      formData.append("file", file);

      await axiosInstance.put(`${Url}/api/attachment/${imageData.imageId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      message.success("تم تحديث الصورة بنجاح");
      // Re-fetch the images to update the modal
      await fetchData();
    } catch (error) {
      console.error("Error uploading image:", error);
      message.error("حدث خطأ أثناء تعديل الصورة");
    }
  };

  const handleSaveEdit = async (values) => {
    try {
      const updatedValues = {
        id: deviceId,
        serialNumber: values.serialNumber,
        date: values.date ? new Date(values.date).toISOString() : deviceData.date,
        damagedDeviceTypeId: values.damagedDeviceTypeId,
        deviceTypeId: values.deviceTypeId,
        note: values.note || "",
        officeId,
        governorateId,
        profileId,
      };

      await axiosInstance.put(`${Url}/api/DamagedDevice/${deviceId}`, updatedValues);

      message.success("تم تحديث بيانات الجهاز بنجاح");
      setEditModalVisible(false);
      await fetchData();
    } catch (error) {
      console.error("Error saving edit:", error);
      message.error("حدث خطأ أثناء تعديل بيانات الجهاز");
    }
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`${Url}/api/DamagedDevice/${deviceId}`);
      message.success("تم حذف الجهاز بنجاح");
      setDeleteModalVisible(false);
      navigate(-1);
    } catch (error) {
      console.error("Error deleting device:", error);
      message.error("حدث خطأ أثناء حذف الجهاز");
    }
  };

  return (
    <div
      className={`supervisor-lecture-show-container ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl"
    >
      {loading ? (
        // Show a skeleton while loading
        <Skeleton active paragraph={{ rows: 12 }} />
      ) : deviceData ? (
        <>
          <div className="title-container">
            <h1>تفاصيل الجهاز</h1>
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
                  onClick={() => setEditModalVisible(true)}
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
                <span className="details-label">الرقم التسلسلي:</span>
                <input
                  className="details-value"
                  value={deviceData.serialNumber}
                  readOnly
                />
              </div>
              <div className="details-row">
                <span className="details-label">التاريخ:</span>
                <input className="details-value" value={deviceData.date} readOnly />
              </div>
              <div className="details-row">
                <span className="details-label">نوع الجهاز:</span>
                <input
                  className="details-value"
                  value={deviceData.deviceTypeName}
                  readOnly
                />
              </div>
              <div className="details-row">
                <span className="details-label">نوع الضرر:</span>
                <input
                  className="details-value"
                  value={
                    damagedTypes.find((type) => type.value === deviceData.damagedDeviceTypeId)
                      ?.label || "غير معروف"
                  }
                  readOnly
                />
              </div>
              <div className="details-row">
                <span className="details-label">المكتب:</span>
                <input
                  className="details-value"
                  value={deviceData.officeName}
                  readOnly
                />
              </div>
              <div className="details-row">
                <span className="details-label">الملاحظات:</span>
                <textarea
                  className="textarea-value"
                  value={deviceData.note || "لا توجد ملاحظات"}
                  readOnly
                />
              </div>
            </div>

            <div className="image-lecture-container">
              {images.length > 0 && (
                <div className="image-device-preview-container">
                  <span className="note-details-label">صور الجهاز:</span>
                  <ImagePreviewer
                    uploadedImages={images}
                    onImageSelect={(index) => {
                      const selectedImage = imagesData[index];
                      if (selectedImage && selectedImage.id !== imageData.imageId) {
                        setImageData({
                          imageId: selectedImage.id,
                          entityId: selectedImage.entityId,
                          entityType: "DamagedDevice",
                        });
                      }
                    }}
                    defaultWidth={600}
                    defaultHeight={300}
                  />
                </div>
              )}
            </div>
          </div>

          <ConfigProvider direction="rtl">
            {/* Edit Modal */}
            <Modal
              title="تعديل بيانات الجهاز"
              open={editModalVisible}
              onCancel={() => setEditModalVisible(false)}
              footer={null}
              className="model-container"
            >
              <Form
                form={form}
                onFinish={handleSaveEdit}
                layout="vertical"
                className="dammaged-passport-container-edit-modal"
              >
                <Form.Item
                  name="serialNumber"
                  label="الرقم التسلسلي"
                  rules={[{ required: true, message: "يرجى إدخال الرقم التسلسلي" }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="deviceTypeId"
                  label="نوع الجهاز"
                  rules={[{ required: true, message: "يرجى اختيار نوع الجهاز" }]}
                >
                  <Select options={deviceTypes} />
                </Form.Item>

                <Form.Item
                  name="damagedDeviceTypeId"
                  label="نوع الضرر"
                  rules={[{ required: true, message: "يرجى اختيار نوع الضرر" }]}
                >
                  <Select options={damagedTypes} />
                </Form.Item>

                <Form.Item
                  name="date"
                  label="التاريخ"
                  rules={[{ required: true, message: "يرجى إدخال التاريخ" }]}
                >
                  <Input type="date" />
                </Form.Item>

                <Form.Item name="note" label="الملاحظات">
                  <Input.TextArea />
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
                    <span className="note-details-label">صور الجهاز:</span>
                    <ImagePreviewer
                      uploadedImages={images}
                      onImageSelect={(index) => {
                        const selectedImage = imagesData[index];
                        if (selectedImage && selectedImage.id !== imageData.imageId) {
                          setImageData({
                            imageId: selectedImage.id,
                            entityId: selectedImage.entityId,
                            entityType: "DamagedDevice",
                          });
                        }
                      }}
                      defaultWidth="100%"
                      defaultHeight={300}
                    />
                  </>
                )}

                <Button type="primary" htmlType="submit" block>
                  حفظ التعديلات
                </Button>
              </Form>
            </Modal>

            {/* Delete Modal */}
            <Modal
              title="تأكيد الحذف"
              open={deleteModalVisible}
              onOk={handleDelete}
              onCancel={() => setDeleteModalVisible(false)}
              okText="حذف"
              cancelText="إلغاء"
            >
              <p>هل أنت متأكد أنك تريد حذف هذا الجهاز؟</p>
            </Modal>
          </ConfigProvider>
        </>
      ) : (
        // Fallback if deviceData is null after loading completes
        <div className="loading">جاري التحميل...</div>
      )}
    </div>
  );
};

export default SuperVisorDeviceShow;
