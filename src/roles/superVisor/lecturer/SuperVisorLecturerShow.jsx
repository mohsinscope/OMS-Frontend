import React, { useState, useEffect } from "react";
import {
  Spin,
  message,
  Modal,
  Form,
  Input,
  Button,
  ConfigProvider,
} from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import ImagePreviewer from "./../../../reusable/ImagePreViewer.jsx";
import "./LecturerShow.css";
import useAuthStore from "./../../../store/store";
import Url from "./../../../store/url.js";
import Lele from "./../../../reusable elements/icons.jsx";

const LecturerShow = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const lectureId = location.state?.id;
  const [lectureData, setLectureData] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { isSidebarCollapsed, accessToken, profile, permissions } =
    useAuthStore();
  const { profileId, governorateId, officeId } = profile || {};

  const hasUpdatePermission = permissions.includes("Lu");
  const hasDeletePermission = permissions.includes("Ld");

  useEffect(() => {
    if (!lectureId) {
      message.error("معرف المحضر غير موجود.");
      navigate(-1);
      return;
    }

    const fetchLectureDetails = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${Url}/api/Lecture/${lectureId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const lecture = response.data;
        const formattedDate = new Date(lecture.date).toISOString().slice(0, 16);
        setLectureData({ ...lecture, date: formattedDate });
        form.setFieldsValue({ ...lecture, date: formattedDate });
      } catch (error) {
        message.error(
          `حدث خطأ أثناء جلب تفاصيل المحضر: ${
            error.response?.data?.message || error.message
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchLectureImages = async () => {
      try {
        const response = await axios.get(
          `${Url}/api/Attachment/Lecture/${lectureId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const imageUrls = response.data.map((image) => image.filePath);
        setImages(imageUrls);
      } catch (error) {
        message.error(
          `حدث خطأ أثناء جلب صور المحضر: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    };

    fetchLectureDetails();
    fetchLectureImages();
  }, [lectureId, accessToken, navigate, form]);

  const handleSaveEdit = async (values) => {
    try {
      const updatedValues = {
        ...values,
        id: lectureId,
        profileId,
        governorateId,
        officeId,
        date: new Date(values.date).toISOString(),
      };
      await axios.put(`${Url}/api/Lecture/${lectureId}`, updatedValues, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      message.success("تم تحديث المحضر بنجاح");
      setEditModalVisible(false);
      setLectureData((prev) => ({ ...prev, ...updatedValues }));
    } catch (error) {
      message.error(
        `حدث خطأ أثناء تعديل المحضر: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${Url}/api/Lecture/${lectureId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      message.success("تم حذف المحضر بنجاح");
      setDeleteModalVisible(false);
      navigate(-1); // Redirect after deletion
    } catch (error) {
      message.error(
        `حدث خطأ أثناء حذف المحضر: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleBack = () => {
    navigate(-1);
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
        isSidebarCollapsed
          ? "sidebar-collapsed"
          : "supervisor-lecture-show-container"
      }`}
      dir="rtl">
      <div className="title-container">
        <h1>تفاصيل المحضر</h1>
        <div className="edit-button-and-delete">
          <Button onClick={handleBack} className="back-button">
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
              onClick={() => setEditModalVisible(true)}
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
              value={new Date(lectureData.date).toLocaleDateString("ar-EG")}
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
              <span className="note-details-label">صورة المحضر:</span>
              <ImagePreviewer
                uploadedImages={images}
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
            className="Admin-user-add-model-conatiner-form">
            <Form.Item
              name="title"
              label="عنوان المحضر"
              rules={[{ required: true, message: "يرجى إدخال عنوان المحضر" }]}>
              <input placeholder="عنوان المحضر" />
            </Form.Item>
            <Form.Item
              name="date"
              label="التاريخ"
              rules={[{ required: true, message: "يرجى إدخال التاريخ" }]}>
              <input placeholder="التاريخ" type="date" />
            </Form.Item>
            <Form.Item
              name="note"
              label="الملاحظات"
              rules={[{ required: false }]}>
              <Input.TextArea placeholder="أدخل الملاحظات" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block>
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
