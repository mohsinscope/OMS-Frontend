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
  Skeleton,
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
  const [dataFetched, setDataFetched] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [damagedTypes, setDamagedTypes] = useState([]);
  const [form] = Form.useForm();

  // New state variables for governorates and offices
  const [governorateOptions, setGovernorateOptions] = useState([]);
  const [officeOptions, setOfficeOptions] = useState([]);

  const { isSidebarCollapsed, accessToken, profile, permissions, roles } = useAuthStore();
  const { profileId, governorateId, officeId } = profile || {};

  // Determine if the current user is a supervisor.
  const isSupervisor = roles.includes("Supervisor") ||  roles.includes("I.T") ||  roles.includes("MainSupervisor");

  const hasUpdatePermission = permissions.includes("DPu");
  const hasDeletePermission = permissions.includes("DPd");

  // -----------------------------
  // Fetch governorate dropdown options
  // -----------------------------
  const fetchGovernorates = async () => {
    try {
      const response = await axiosInstance.get(`${Url}/api/Governorate/dropdown`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const options = response.data.map(item => ({
        value: item.id,
        label: item.name,
      }));
      setGovernorateOptions(options);
    } catch (error) {
      message.error("حدث خطأ أثناء جلب المحافظات.");
    }
  };

  // -----------------------------
  // Fetch offices for a given governorate
  // -----------------------------
  const fetchOffices = async (govId) => {
    try {
      const response = await axiosInstance.get(`${Url}/api/Governorate/dropdown/${govId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.data && response.data.length > 0) {
        // Assuming the API returns an array with one object having an "offices" array.
        const offices = response.data[0].offices || [];
        const options = offices.map(office => ({
          value: office.id,
          label: office.name,
        }));
        setOfficeOptions(options);
      } else {
        setOfficeOptions([]);
      }
    } catch (error) {
      message.error("حدث خطأ أثناء جلب المكاتب.");
    }
  };

  // -----------------------------
  // Fetch passport details and set initial form values.
  // -----------------------------
  const fetchPassportDetails = async () => {
    try {
      const response = await axiosInstance.get(`${Url}/api/DamagedPassport/${passportId}`);
      const passport = response.data;
      const formattedDate = passport.date
        ? new Date(passport.date).toISOString().split("T")[0]
        : "";
      // Save the passport details and set the initial values for the form.
      setPassportData({ ...passport, date: formattedDate });
      
      // If the user is not a supervisor, set governorate/office values as objects.
      form.setFieldsValue({
        ...passport,
        date: formattedDate,
        notes: passport.note || "",
        governorateId: !isSupervisor
          ? { value: passport.governorateId, label: passport.governorateName }
          : passport.governorateId,
        officeId: !isSupervisor
          ? { value: passport.officeId, label: passport.officeName }
          : passport.officeId,
      });
      
      // If not a supervisor and a governorate exists, fetch its offices.
      if (!isSupervisor && passport.governorateId) {
        await fetchOffices(passport.governorateId);
      }
      return true;
    } catch (error) {
      message.error("حدث خطأ أثناء جلب تفاصيل الجواز.");
      return false;
    }
  };

  const fetchPassportImages = async () => {
    try {
      const response = await axiosInstance.get(
        `${Url}/api/Attachment/DamagedPassport/${passportId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      if (response.data && response.data.length > 0) {
        const imageUrls = response.data.map(image => ({
          url: image.filePath,
          id: image.id,
        }));
        setImages(imageUrls);
      } else {
        setImages([]);
      }
      return true;
    } catch (error) {
      console.error("Error fetching passport images:", error);
      setImages([]);
      return true;
    }
  };

  const fetchDamagedTypes = async () => {
    try {
      const response = await axiosInstance.get(`${Url}/api/damagedtype/all`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setDamagedTypes(
        response.data.map(type => ({
          value: type.id,
          label: type.name,
        }))
      );
      return true;
    } catch (error) {
      message.error("خطأ في جلب أنواع التلف للجوازات.");
      return false;
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      if (!passportId) {
        message.error("معرف الجواز غير موجود.");
        navigate(-1);
        return;
      }
      setLoading(true);
      try {
        // If the user is not a supervisor, fetch governorates.
        if (!isSupervisor) {
          await fetchGovernorates();
        }
        const [detailsSuccess, imagesSuccess, typesSuccess] = await Promise.all([
          fetchPassportDetails(),
          fetchPassportImages(),
          fetchDamagedTypes(),
        ]);
        if (detailsSuccess && imagesSuccess && typesSuccess) {
          setDataFetched(true);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [passportId, navigate, isSupervisor]);

  const handleImageUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("entityId", passportId);
      formData.append("entityType", "DamagedPassport");
      formData.append("file", file);

      if (images.length === 0) {
        await axiosInstance.post(`${Url}/api/attachment/add-attachment`, formData, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        await axiosInstance.put(`${Url}/api/attachment/${imageData.imageId}`, formData, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }
      message.success("تم تحديث الصورة بنجاح");
      await fetchPassportImages();
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
        date: values.date ? new Date(values.date).toISOString() : passportData.date,
        note: values.notes || "لا يوجد",
        damagedTypeId: values.damagedTypeId,
        // For non-supervisors, extract the GUID from the object.
        governorateId: !isSupervisor ? values.governorateId.value : governorateId,
        officeId: !isSupervisor ? values.officeId.value : officeId,
        profileId,
      };

      await axiosInstance.put(`${Url}/api/DamagedPassport/${passportId}`, updatedValues, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      message.success("تم تحديث بيانات الجواز بنجاح");
      setEditModalVisible(false);
      await fetchPassportDetails();
      setDataFetched(true);
    } catch (error) {
      message.error("حدث خطأ أثناء تعديل بيانات الجواز.");
    }
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`${Url}/api/DamagedPassport/${passportId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      message.success("تم حذف الجواز بنجاح");
      setDeleteModalVisible(false);
      navigate(-1);
    } catch (error) {
      message.error("حدث خطأ أثناء حذف الجواز.");
    }
  };

  // When the user selects a different governorate, fetch the corresponding offices.
  const handleGovernorateChange = (selected) => {
    if (selected && selected.value) {
      fetchOffices(selected.value);
      // Reset the office field if the governorate changes.
      form.setFieldsValue({ officeId: null });
    } else {
      setOfficeOptions([]);
      form.setFieldsValue({ officeId: null });
    }
  };

  const isOwnerOrSuperAdmin =
    passportData?.profileId === profileId || roles.includes("SuperAdmin");

  return (
    <div
      className={`supervisor-passport-damage-show-container ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl"
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 12 }} />
      ) : (
        dataFetched &&
        passportData && (
          <>
            <div className="title-container">
              <h1>تفاصيل الجواز التالف</h1>
              <div className="edit-button-and-delete">
                <Button onClick={() => navigate(-1)} className="back-button">
                  <Lele type="back" />
                  الرجوع
                </Button>
                {isOwnerOrSuperAdmin && (
                  <>
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
                  </>
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
                  <span className="details-label">تاريخ التلف:</span>
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
                  <span className="details-label">اسم المحافظة:</span>
                  <input
                    className="details-value"
                    value={passportData.governorateName || "غير محدد"}
                    disabled
                  />
                </div>
                <div className="details-row">
                  <span className="details-label">اسم المكتب:</span>
                  <input
                    className="details-value"
                    value={passportData.officeName || "غير محدد"}
                    disabled
                  />
                </div>
                <div className="details-row">
                  <span className="details-label">اسم المستخدم:</span>
                  <input
                    className="details-value"
                    value={passportData.profileFullName || "غير محدد"}
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

            {/* Edit Modal */}
            <div className="dammaged-passport-container-edit-modal">
              <ConfigProvider direction="rtl">
                <Modal
                  className="model-container"
                  open={editModalVisible}
                  onCancel={() => setEditModalVisible(false)}
                  footer={null}
                >
                  <h1>تعديل بيانات الجواز</h1>
                  <Form
                    form={form}
                    onFinish={handleSaveEdit}
                    layout="vertical"
                    className="dammaged-passport-container-edit-modal"
                  >
                    <Form.Item
                      name="passportNumber"
                      label="رقم الجواز"
                      rules={[{ required: true, message: "يرجى إدخال رقم الجواز" }]}
                    >
                      <Input placeholder="رقم الجواز" />
                    </Form.Item>
                    <Form.Item
                      name="damagedTypeId"
                      label="سبب التلف"
                      rules={[{ required: true, message: "يرجى اختيار سبب التلف" }]}
                    >
                      <Select
                        style={{ height: "45px" }}
                        options={damagedTypes}
                        placeholder="اختر سبب التلف"
                        allowClear
                      />
                    </Form.Item>

                    {/* Only show these two fields if the user is NOT a supervisor */}
                    {!isSupervisor && (
                      <>
                        <Form.Item
                          name="governorateId"
                          label="المحافظة"
                          rules={[{ required: true, message: "يرجى اختيار المحافظة" }]}
                        >
                          <Select
                            placeholder="اختر المحافظة"
                            options={governorateOptions}
                            labelInValue
                            onChange={handleGovernorateChange}
                          />
                        </Form.Item>
                        <Form.Item
                          name="officeId"
                          label="المكتب"
                          rules={[{ required: true, message: "يرجى اختيار المكتب" }]}
                        >
                          <Select
                            placeholder="اختر المكتب"
                            options={officeOptions}
                            labelInValue
                          />
                        </Form.Item>
                      </>
                    )}

                    <Form.Item
                      name="date"
                      label="تاريخ التلف"
                      rules={[{ required: true, message: "يرجى إدخال التاريخ" }]}
                    >
                      <input placeholder="تاريخ التلف" type="date" />
                    </Form.Item>
                    <Form.Item name="notes" label="الملاحظات">
                      <Input.TextArea placeholder="أدخل الملاحظات" defaultValue="لا يوجد" />
                    </Form.Item>
                    <Upload
                      beforeUpload={(file) => {
                        // Reject PDF files.
                        if (file.type === "application/pdf") {
                          message.error("لا يمكن تحميل ملفات PDF.");
                          return Upload.LIST_IGNORE;
                        }
                        // Proceed with image upload.
                        handleImageUpload(file);
                        return false; // Prevent automatic upload.
                      }}
                    >
                      <Button
                        style={{ margin: "20px 0px", backgroundColor: "#efb034" }}
                        type="primary"
                        icon={<UploadOutlined />}
                      >
                        {images.length > 0 ? "استبدال الصورة" : "إضافة مرفق"}
                      </Button>
                    </Upload>
                    {images.length > 0 && (
                      <>
                        <span className="note-details-label">صور الجواز التالف:</span>
                        <ImagePreviewer
                          className="edit-model-container"
                          uploadedImages={images.map((img) => img.url)}
                          onImageSelect={(index) => {
                            const selectedImage = images[index];
                            if (selectedImage) {
                              setImageData({
                                imageId: selectedImage.id,
                                entityId: passportId,
                                entityType: "DamagedPassport",
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
                  <p>هل أنت متأكد أنك تريد حذف هذا الجواز؟</p>
                </Modal>
              </ConfigProvider>
            </div>
          </>
        )
      )}
    </div>
  );
};

export default DamagedPassportsShow;
