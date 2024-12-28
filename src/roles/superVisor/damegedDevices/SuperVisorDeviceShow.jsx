import React, { useState, useEffect } from "react";
import {
  Spin,
  message,
  Modal,
  Form,
  Input,
  Button,
  ConfigProvider,
  Select,
} from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import ImagePreviewer from "./../../../reusable/ImagePreViewer.jsx";
import "./../lecturer/LecturerShow.css";
import useAuthStore from "./../../../store/store";
import Url from "./../../../store/url.js";
import Lele from "./../../../reusable elements/icons.jsx";

const SuperVisorDeviceShow = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const deviceId = location.state?.id;
  const [deviceData, setDeviceData] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const [damagedTypes, setDamagedTypes] = useState([]);
  const [damagedDeviceTypes, setDamagedDeviceTypes] = useState([]);
  const [form] = Form.useForm();
  const { isSidebarCollapsed, accessToken } = useAuthStore();

  useEffect(() => {
    if (!deviceId) {
      message.error("معرف الجهاز غير موجود.");
      navigate(-1);
      return;
    }

    const fetchDeviceDetails = async () => {
      setLoading(true);
      try {
        console.log("Fetching device id = ", deviceId);
        const response = await axios.get(
          `${Url}/api/DamagedDevice/${deviceId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        console.log(response);
        const device = response.data;
        const formattedDate = device.date
          ? new Date(device.date).toISOString().slice(0, 19) + "Z"
          : "";
        setDeviceData({ ...device, date: formattedDate });
        form.setFieldsValue({ ...device, date: formattedDate });
      } catch (error) {
        message.error(
          `حدث خطأ أثناء جلب تفاصيل الجهاز: ${
            error.response?.data?.message || error.message
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchDeviceImages = async () => {
      try {
        const response = await axios.get(
          `${Url}/api/Attachment/DamagedDevice/${deviceId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        console.log(response);
        const imageUrls = response.data.map((image) => image.filePath);
        setImages(imageUrls);
      } catch (error) {
        message.error(
          `حدث خطأ أثناء جلب صور الجهاز: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    };

    const fetchDamagedTypes = async () => {
      try {
        const response = await axios.get(`${Url}/api/damageddevicetype/all`, {
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
        message.error("خطأ في جلب أنواع التلف للاجهزة");
      }
    };

    const fetchDamagedDeviceTypes = async () => {
      try {
        const response = await axios.get(`${Url}/api/devicetype`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setDamagedDeviceTypes(
          response.data.map((type) => ({
            value: type.id,
            label: type.name,
          }))
        );
      } catch (error) {
        message.error("خطأ في جلب أنواع التلف للأجهزة");
      }
    };

    fetchDamagedDeviceTypes();
    fetchDamagedTypes();
    fetchDeviceDetails();
    fetchDeviceImages();
  }, [deviceId, accessToken, navigate, form]);

  const handleSaveEdit = async (values) => {
    try {
      const updatedValues = {
        id: deviceId,
        serialNumber: values.serialNumber,
        date: values.date
          ? new Date(values.date).toISOString().slice(0, 19) + "Z"
          : deviceData.date,
        damagedDeviceTypeId: values.damagedDeviceTypeId,
        note: values.note || "",
        deviceTypeId: values.deviceTypeId,
        officeId: deviceData.officeId,
        governorateId: deviceData.governorateId,
        profileId: deviceData.profileId,
      };

      console.log("Sending Updated Values:", updatedValues);

      const response = await axios.put(
        `${Url}/api/DamagedDevice/${deviceId}`,
        updatedValues,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log("Update Response:", response.data);

      message.success("تم تحديث بيانات الجهاز بنجاح");
      setEditModalVisible(false);
      setDeviceData((prev) => ({ ...prev, ...updatedValues }));
    } catch (error) {
      console.error("Error Updating Device Details:", error.response);
      message.error(
        `حدث خطأ أثناء تعديل بيانات الجهاز: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleDelete = async () => {
    console.log("Deleting Device ID:", deviceId);
    try {
      await axios.delete(`${Url}/api/DamagedDevice/${deviceId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      message.success("تم حذف الجهاز بنجاح");
      setDeleteModalVisible(false);
      navigate(-1);
    } catch (error) {
      console.error("Error Deleting Device:", error.response);
      message.error(
        `حدث خطأ أثناء حذف الجهاز: ${
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

  if (!deviceData) {
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
        <h1>تفاصيل الجهاز</h1>
        <div className="edit-button-and-delete">
          <Button onClick={handleBack} className="back-button">
            <Lele type="back" />
            الرجوع
          </Button>
          <Button
            onClick={() => setDeleteModalVisible(true)}
            className="delete-button-lecture">
            حذف <Lele type="delete" />
          </Button>
          <Button
            onClick={() => setEditModalVisible(true)}
            className="edit-button-lecture">
            تعديل <Lele type="edit" />
          </Button>
        </div>
      </div>

      <div className="details-container-Lecture">
        <div className="details-lecture-container">
          <div className="details-row">
            <span className="details-label">الرقم التسلسلي:</span>
            <input
              className="details-value"
              value={deviceData.serialNumber}
              disabled
            />
          </div>
          <div className="details-row">
            <span className="details-label">التاريخ:</span>
            <input
              className="details-value"
              value={new Date(deviceData.date).toLocaleDateString("ar-EG")}
              disabled
            />
          </div>
          <div className="details-row">
            <span className="details-label">نوع الجهاز:</span>
            <input
              className="details-value"
              value={deviceData.deviceTypeName}
              disabled
            />
          </div>
          <div className="details-row">
            <span className="details-label">نوع الضرر:</span>
            <input
              className="details-value"
              value={deviceData.damagedDeviceTypeId}
              disabled
            />
          </div>
          <div className="details-row">
            <span className="details-label">المكتب:</span>
            <input
              className="details-value"
              value={deviceData.officeName}
              disabled
            />
          </div>
          <div className="details-row">
            <span className="details-label">الملاحظات:</span>
            <textarea
              className="textarea-value"
              value={deviceData.note || "لا توجد ملاحظات"}
              disabled
            />
          </div>
        </div>
        <div className="image-lecture-container">
          {images.length > 0 && (
            <div className="image-device-preview-container">
              <span className="note-details-label">صور الجهاز:</span>
              <ImagePreviewer
                uploadedImages={images}
                defaultWidth={1000}
                defaultHeight={600}
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
          <h1>تعديل بيانات الجهاز</h1>
          <Form
            form={form}
            onFinish={handleSaveEdit}
            layout="vertical"
            className="Admin-user-add-model-container-form">
            <Form.Item
              name="serialNumber"
              label="الرقم التسلسلي"
              rules={[
                { required: true, message: "يرجى إدخال الرقم التسلسلي" },
              ]}>
              <Input placeholder="الرقم التسلسلي" />
            </Form.Item>
            <Form.Item
              name="deviceTypeId"
              label="نوع الجهاز"
              rules={[{ required: true, message: "يرجى اختيار نوع الجهاز" }]}>
              <Select
                options={damagedDeviceTypes}
                placeholder="اختر نوع الجهاز"
                allowClear
              />
            </Form.Item>
            <Form.Item
              name="damagedDeviceTypeId"
              label="نوع الضرر"
              rules={[{ required: true, message: "يرجى إدخال نوع الضرر" }]}>
              <Select
                options={damagedTypes}
                placeholder="اختر سبب التلف"
                allowClear
              />
            </Form.Item>
            <Form.Item
              name="date"
              label="التاريخ"
              rules={[{ required: true, message: "يرجى إدخال التاريخ" }]}>
              <Input placeholder="التاريخ" type="datetime-local" />
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
          <p>هل أنت متأكد أنك تريد حذف هذا الجهاز؟</p>
        </Modal>
      </ConfigProvider>
    </div>
  );
};

export default SuperVisorDeviceShow;
