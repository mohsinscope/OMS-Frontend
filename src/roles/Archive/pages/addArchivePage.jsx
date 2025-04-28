// src/pages/archive/AddDocumentPage.jsx
import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  Button,
  message,
  Row,
  Col,
  Divider,
  Layout,
  ConfigProvider,
  Breadcrumb,
  Modal,
  Descriptions,
} from "antd";
import { InboxOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { Link, useNavigate, useLocation } from "react-router-dom";
import ar_EG from "antd/lib/locale/ar_EG";
import axiosInstance from "../../../intercepters/axiosInstance.js";
import moment from "moment";
import "../styles/addArchivePage.css";
import useAuthStore from "../../../store/store.js";
import ImagePreviewer from "../../../reusable/ImagePreViewer.jsx";

const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;
const { Content, Header } = Layout;

/*──────────────────────── helpers ────────────────────────*/
const getResponseTypeValue = (side, option) => {
  if (side === "وارد") {
    if (option === "اجابة صادر") return 4;
    if (option === "تأكيد وارد") return 2;
    if (option === "وارد جديد") return 3;
  } else if (side === "صادر") {
    if (option === "اجابة وارد") return 1;
    if (option === "تأكيد صادر") return 5;
    if (option === "صادر جديد") return 6;
  }
  return null;
};

const getDocumentOptionChoices = (side) => {
  if (side === "صادر") return ["اجابة وارد", "تأكيد صادر", "صادر جديد"];
  if (side === "وارد") return ["اجابة صادر", "تأكيد وارد", "وارد جديد"];
  return [];
};

/*──────────────────────── component ────────────────────────*/
function AddDocumentPage({
  editMode = false,
  confirmMode = false,
  referencedDocument = null,
  initialValues = {},
}) {
  /* ───────────── hooks & selectors ───────────── */
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const profileId = useAuthStore((s) => s.profile?.profileId);

  // مَعرّف الكتاب الأصلى (إذا جئنا من زر "رد")
  const parentDocumentId = location.state?.parentDocumentId ?? null;
  const hasParent = Boolean(parentDocumentId);

  /* ───────────── state ───────────── */
  const [fileList, setFileList] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [fetchedDocumentData, setFetchedDocumentData] = useState(null);

  const [projectOptions, setProjectOptions] = useState([]);
  const [documentPartyOptions, setDocumentPartyOptions] = useState([]);
  const [ministryOptions, setMinistryOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [ccOptions, setCcOptions] = useState([]);

  const [selectedDocumentSide, setSelectedDocumentSide] = useState(
    initialValues.documentSide || null
  );
  const [selectedIsOfficial, setSelectedIsOfficial] = useState(true);
  const [viewModalVisible, setViewModalVisible] = useState(false);

  const { 
    isSidebarCollapsed, 

  } = useAuthStore();
  /* ───────────── fetch static selects ───────────── */
  useEffect(() => {
    (async () => {
      try {
        const [
          projects,
          parties,
          ministries,
          tags,
          ccs,
        ] = await Promise.all([
          axiosInstance.get("/api/Project?PageNumber=1&PageSize=100"),
          axiosInstance.get("/api/DocumentParty?PageNumber=1&PageSize=100"),
          axiosInstance.get("/api/Ministry?PageNumber=1&PageSize=100"),
          axiosInstance.get("/api/Tags?PageNumber=1&PageSize=100"),
          axiosInstance.get("/api/DocumentCC?PageNumber=1&PageSize=100"),
        ]);
        setProjectOptions(projects.data);
        setDocumentPartyOptions(parties.data);
        setMinistryOptions(ministries.data);
        setTagOptions(tags.data);
        setCcOptions(ccs.data);
      } catch (error) {
        console.error(error);
        message.error("حدث خطأ أثناء جلب بيانات القوائم");
      }
    })();
  }, []);

  /* ───────────── fetch parent document (للعرض فقط) ───────────── */
  useEffect(() => {
    if (!hasParent) return;
    (async () => {
      try {
        const data = (
          await axiosInstance.get(`/api/Document/${parentDocumentId}`)
        ).data;
        setFetchedDocumentData(data);
      } catch {
        message.error("تعذّر جلب بيانات الكتاب الأصلي");
      }
    })();
  }, [hasParent, parentDocumentId]);

  /* ───────────── populate form in edit mode ───────────── */
  useEffect(() => {
    if (!editMode || !initialValues) return;

    setSelectedDocumentSide(initialValues.documentSide);
    setSelectedIsOfficial(initialValues.isOfficialParty ?? true);

    if (initialValues.fileUrl) {
      setFileList([
        {
          uid: "-1",
          name: initialValues.fileName || "Current file",
          status: "done",
          url: initialValues.fileUrl,
        },
      ]);
      if (initialValues.fileType?.startsWith("image/")) {
        setPreviewUrls([initialValues.fileUrl]);
      }
    }

    form.setFieldsValue({
      ...initialValues,
      date: initialValues.date ? moment(initialValues.date) : null,
    });
  }, [editMode, initialValues, form]);

  /* ───────────── upload helpers ───────────── */
  const fileUploadProps = {
    name: "file",
    multiple: true,
    fileList,
    beforeUpload: (file) => {
      const ok =
        ["application/pdf", "image/jpeg", "image/png"].includes(file.type) &&
        file.size / 1024 / 1024 < 10;
      if (!ok) {
        message.error("يُسمح بملف PDF أو JPG/PNG أقل من 10 MB");
        return false;
      }
      setFileList((prev) => [...prev, file]);
      if (file.type.startsWith("image/"))
        setPreviewUrls((prev) => [
          ...prev,
          URL.createObjectURL(file.originFileObj ?? file),
        ]);
      return false;
    },
    onRemove: () => {
      setFileList([]);
      setPreviewUrls([]);
    },
  };

  /* ───────────── submit logic ───────────── */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!profileId) {
        message.error("تعذّر إيجاد بيانات المستخدم");
        return;
      }
      if (!fileList.length) {
        return message.error("ارفع ملفاً واحداً على الأقل");
      }

      setSubmitting(true);
      const fd = new FormData();

      fd.append("DocumentNumber", values.documentNumber);
      fd.append("Title", values.title);
      fd.append("DocumentType", selectedDocumentSide === "صادر" ? 1 : 2);
      fd.append(
        "ResponseType",
        getResponseTypeValue(selectedDocumentSide, values.ResponseType)
      );
      fd.append("IsRequiresReply", values.isRequiresReply);
      fd.append("IsUrgent", values.isUrgent);
      fd.append("IsImportant", values.isImportant);
      fd.append("IsNeeded", values.isNeeded);
      fd.append("IsOfficialParty", values.isOfficialParty);
      fd.append("ProjectId", values.project);
      fd.append("PartyId", values.PartyId);
      fd.append("ProfileId", profileId);
      fd.append(
        "MinistryId",
        values.isOfficialParty ? values.ministryId : ""
      );
      fd.append(
        "DocumentDate",
        `${values.date.format("YYYY-MM-DD")}T00:00:00Z`
      );
      fd.append("Subject", values.subject);
      fd.append("Notes", values.notes ?? "");
      if (values.ccIds?.length) fd.append("CCIds", values.ccIds.join(","));
      if (values.tagIds?.length) fd.append("TagIds", values.tagIds.join(","));
      fd.append("ParentDocumentId", parentDocumentId ?? "");

      fileList.forEach((f) =>
        fd.append("Files", f.originFileObj ?? f, f.name)
      );

      await axiosInstance.post("/api/Document", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.success("تم إضافة الكتاب");
      navigate("/archive");
    } catch (e) {
      const msg =
        e.response?.data?.message ||
        Object.values(e.response?.data?.errors || {})
          .flat()
          .join(", ") ||
        "خطأ غير معروف";
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ───────────── render ───────────── */
  return (
    <ConfigProvider locale={ar_EG} direction="rtl">
      <Layout       className={`document-page-layout ${
        isSidebarCollapsed ? "document-page-layout-sidebar-collapsed" : "document-page-layout"
      }`} style={{background:"none"}}>
        <Header className="document-page-header">
          <h1>{editMode ? "تعديل كتاب" : "إضافة كتاب جديد"}</h1>
          <Breadcrumb className="document-breadcrumb">
            <Breadcrumb.Item>
              <Link to="/archive">الأرشيف</Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              {editMode ? "تعديل كتاب" : "إضافة كتاب جديد"}
            </Breadcrumb.Item>
          </Breadcrumb>
        </Header>

        <Content className="document-page-content">
          <div className="document-page-container">
            <Row gutter={24}>
              {hasParent && fetchedDocumentData && (
                <Col span={24}>
                  <div className="referenced-document-info">
                    <Divider>معلومات الكتاب الأصلي</Divider>
                    <p>
                      <strong>رقم الكتاب:</strong>{" "}
                      {fetchedDocumentData.documentNumber}
                    </p>
                    <p>
                      <strong>العنوان:</strong> {fetchedDocumentData.title}
                    </p>
                    <p>
                      <strong>التاريخ:</strong>{" "}
                      {new Date(
                        fetchedDocumentData.documentDate
                      ).toLocaleDateString("ar-EG")}
                    </p>
                    <Button
                      type="default"
                      onClick={() => setViewModalVisible(true)}
                    >
                      عرض التفاصيل
                    </Button>
                  </div>
                </Col>
              )}

              <Col span={24}>
                <Form
                  form={form}
                  layout="vertical"
                  labelAlign="right"
                  preserve={false}
                >
                  {/* ==== صف الرسمية/الوزارة/الجهة وغيرها ==== */}
                  <Row gutter={16}>
                    <Col xs={24} sm={4}>
                      <Form.Item
                        name="isOfficialParty"
                        label="هل الجهة رسمية؟"
                        rules={[{ required: true, message: "اختر" }]}
                        initialValue={true}
                      >
                        <Select
                          onChange={(v) => {
                            setSelectedIsOfficial(v);
                            form.setFieldsValue({
                              PartyId: undefined,
                              ministryId: undefined,
                            });
                          }}
                        >
                          <Option value={true}>رسمية</Option>
                          <Option value={false}>غير رسمية</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    
                    <Col xs={24} sm={4}>
                      <Form.Item
                        name="ministryId"
                        label="الوزارة"
                        rules={
                          selectedIsOfficial
                            ? [{ required: true, message: "اختر الوزارة" }]
                            : []
                        }
                      >
                        <Select
                          disabled={!selectedIsOfficial}
                          showSearch
                          filterOption={(i, o) =>
                            o.children.toLowerCase().includes(i.toLowerCase())
                          }
                        >
                          {ministryOptions.map((m) => (
                            <Option key={m.id} value={m.id}>
                              {m.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={14} sm={4}>
                      <Form.Item
                        name="project"
                        label="المشروع"
                        rules={[{ required: true, message: "اختر" }]}
                      >
                        <Select
                          showSearch
                          filterOption={(i, o) =>
                            o.children.toLowerCase().includes(i.toLowerCase())
                          }
                        >
                          {projectOptions.map((p) => (
                            <Option key={p.id} value={p.id}>
                              {p.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={4}>
                      <Form.Item
                        name="PartyId"
                        label="نوع الجهه"
                        rules={[{ required: true, message: "اختر الجهة" }]}
                      >
                        <Select
                          showSearch
                          filterOption={(i, o) =>
                            o.children.toLowerCase().includes(i.toLowerCase())
                          }
                        >
                          {documentPartyOptions
                            .filter((p) => p.isOfficial === selectedIsOfficial)
                            .map((p) => (
                              <Option key={p.id} value={p.id}>
                                {p.name}
                              </Option>
                            ))}
                        </Select>
                      </Form.Item>
                    </Col>


                    <Col xs={24} sm={4}>
                      <Form.Item
                        name="documentSide"
                        label="نوع الكتاب"
                        rules={[{ required: true, message: "اختر النوع" }]}
                      >
                        <Select
                          onChange={(v) => {
                            setSelectedDocumentSide(v);
                            form.setFieldsValue({ ResponseType: undefined });
                          }}
                        >
                          <Option value="صادر">صادر</Option>
                          <Option value="وارد">وارد</Option>
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={4}>
                      <Form.Item
                        name="ResponseType"
                        label="خيارات الكتاب"
                        rules={[{ required: true, message: "اختر خياراً" }]}
                      >
                        <Select disabled={!selectedDocumentSide}>
                          {(getDocumentOptionChoices(selectedDocumentSide) || []
                          ).map((opt) => (
                            <Option key={opt} value={opt}>
                              {opt}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

           
                  </Row>

                  {/* ==== صف المشروع/الرقم/العنوان/التاريخ ==== */}
                  <Row gutter={16}>
          

                    <Col xs={24} sm={6}>
                      <Form.Item
                        name="documentNumber"
                        label="رقم الكتاب"
                        rules={[{ required: true, message: "أدخل الرقم" }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={6}>
                      <Form.Item
                        name="title"
                        label="عنوان الكتاب"
                        rules={[{ required: true, message: "أدخل العنوان" }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={6}>
                      <Form.Item name="ccIds" label="نسخة منه إلى">
                        <Select
                          mode="multiple"
                          allowClear
                          showSearch
                          filterOption={(i, o) =>
                            o.children.toLowerCase().includes(i.toLowerCase())
                          }
                        >
                          {ccOptions.map((cc) => (
                            <Option key={cc.id} value={cc.id}>
                              {cc.recipientName}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={6}>
                      <Form.Item
                        name="date"
                        label="تاريخ الكتاب"
                        rules={[{ required: true, message: "اختر التاريخ" }]}
                      >
                        <DatePicker style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* ==== صف عاجل/مهم/يستلزم/CC/Tags ==== */}
                  <Row gutter={16}>
                  <Col xs={24} sm={5}>
                      <Form.Item
                        name="isRequiresReply"
                        label="يتطلب رد؟"
                        rules={[{ required: true, message: "اختر" }]}
                        initialValue={false}
                      >
                        <Select>
                          <Option value={true}>نعم</Option>
                          <Option value={false}>لا</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={4}>
                      <Form.Item
                        name="isUrgent"
                        label="عاجل؟"
                        rules={[{ required: true, message: "اختر" }]}
                        initialValue={false}
                      >
                        <Select>
                          <Option value={true}>نعم</Option>
                          <Option value={false}>لا</Option>
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={4}>
                      <Form.Item
                        name="isImportant"
                        label="مهم؟"
                        rules={[{ required: true, message: "اختر" }]}
                        initialValue={false}
                      >
                        <Select>
                          <Option value={true}>نعم</Option>
                          <Option value={false}>لا</Option>
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col xs={24} sm={5}>
                      <Form.Item
                        name="isNeeded"
                        label="يستلزم إجراء؟"
                        rules={[{ required: true, message: "اختر" }]}
                        initialValue={false}
                      >
                        <Select>
                          <Option value={true}>نعم</Option>
                          <Option value={false}>لا</Option>
                        </Select>
                      </Form.Item>
                    </Col>

            

                    <Col xs={24} sm={6}>
                      <Form.Item name="tagIds" label="الوسوم">
                        <Select
                          mode="multiple"
                          allowClear
                          showSearch
                          filterOption={(i, o) =>
                            o.children.toLowerCase().includes(i.toLowerCase())
                          }
                        >
                          {tagOptions.map((t) => (
                            <Option key={t.id} value={t.id}>
                              {t.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* ==== الموضوع / الملاحظات ==== */}
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="subject"
                        label="الموضوع"
                        rules={[{ required: true, message: "أدخل الموضوع" }]}
                      >
                        <TextArea rows={4} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item name="notes" label="ملاحظات">
                        <TextArea rows={4} />
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* ==== المرفقات ==== */}
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Divider>إرفاق ملف</Divider>
                      <Form.Item name="attachment">
                        <Dragger {...fileUploadProps}>
                          <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                          </p>
                          <p className="ant-upload-text">
                            انقر أو اسحب ملف لرفعه هنا
                          </p>
                          <p className="ant-upload-hint">
                            PDF أو JPG/PNG بحد أقصى 10 MB
                          </p>
                        </Dragger>
                      </Form.Item>
                    </Col>

                    {previewUrls.length > 0 && (
                      <Col xs={24} sm={12}>
                        <Divider>معاينة الصورة</Divider>
                        <ImagePreviewer
                          uploadedImages={previewUrls}
                          defaultWidth={600}
                          defaultHeight={300}
                          onDeleteImage={(idx) => {
                            setPreviewUrls((p) =>
                              p.filter((_, i) => i !== idx)
                            );
                            setFileList((p) => p.filter((_, i) => i !== idx));
                          }}
                        />
                      </Col>
                    )}
                  </Row>
                </Form>
              </Col>
            </Row>
          </div>

          {/* ==== أزرار الإجراء ==== */}
          <div className="form-actions">
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={submitting}
              size="large"
            >
              {editMode ? "حفظ التغييرات" : "حفظ"}
            </Button>
            <Button
              danger
              onClick={() => navigate("/archive")}
              size="large"
              style={{ marginInlineStart: 8 }}
            >
              العودة <ArrowLeftOutlined />
            </Button>
          </div>
        </Content>
      </Layout>

      {/* ==== Modal تفاصيل الكتاب الأصلي ==== */}
      <Modal
        open={viewModalVisible}
        title="بيانات الكتاب الأصلي"
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setViewModalVisible(false)}
          >
            اغلاق
          </Button>,
        ]}
        onCancel={() => setViewModalVisible(false)}
      >
        {fetchedDocumentData ? (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="رقم الكتاب">
              {fetchedDocumentData.documentNumber}
            </Descriptions.Item>
            <Descriptions.Item label="عنوان الكتاب">
              {fetchedDocumentData.title}
            </Descriptions.Item>
            <Descriptions.Item label="الموضوع">
              {fetchedDocumentData.subject}
            </Descriptions.Item>
          </Descriptions>
        ) : (
          "لا توجد بيانات"
        )}
      </Modal>
    </ConfigProvider>
  );
}

export default AddDocumentPage;
