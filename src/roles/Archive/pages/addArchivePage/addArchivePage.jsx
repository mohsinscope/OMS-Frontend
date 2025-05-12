// addArchivePage/AddDocumentPage.jsx
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
  Modal,
  Descriptions,
  Tag,
  Card,
  Empty
} from "antd";
import {
  InboxOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EyeFilled
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import ar_EG from "antd/lib/locale/ar_EG";
import moment from "moment";
import axiosInstance from "./../../../../intercepters/axiosInstance.js";
import PrivatePartySelector from "./components/PrivatePartySelector.jsx";
import OfficialPartySelector from "./components/OfficialPartySelector.jsx";
import useAuthStore from "./../../../../store/store.js";
import ImagePreviewer from "./../../../../reusable/ImagePreViewer.jsx";
import './../../styles/addArchivePage.css';


/*─────────────────── Prefill helper (NEW) ───────────────────*/
const prefillFromParent = (doc, form) => {
  if (!doc) return;

  const values = {
    isOfficialParty: !doc.privatePartyId,
    ministryId:           doc.ministryId,
    generalDirectorateId: doc.generalDirectorateId,
    directorateId:        doc.directorateId,
    departmentId:         doc.departmentId,
    sectionId:            doc.sectionId,
    privatePartyId:       doc.privatePartyId,
  };

  form.setFieldsValue(values);

  /* لاحظ: لم نعد بحاجة لاستدعاء fetch* هنا؛
           OfficialPartySelector يراقب القيم ويجلب القوائم تلقائياً
           عبر useWatch كما عدّلناه سابقاً. */
};
/*────────────────────────────────────────────────────────────*/
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
/*─────────────────────────────────────────────────────────*/

function AddDocumentPage({
  editMode = false,
  confirmMode = false,
  referencedDocument = null,
  initialValues = {},
}) {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const profileId = useAuthStore((s) => s.profile?.profileId);
  const { isSidebarCollapsed, profile } = useAuthStore();
  const isDirector = ["Director", "SuperAdmin"].includes(profile?.position);

  // single modal flag and data
  const [parentDocModalVisible, setParentDocModalVisible] = useState(false);
  const [modalDocumentData, setModalDocumentData] = useState(null);

  // router-state parent
  const [fetchedDocumentData, setFetchedDocumentData] = useState(null);
  const parentDocumentId = location.state?.parentDocumentId ?? null;
  const hasParent = Boolean(parentDocumentId);

  // searched parent
  const [foundParentDocument, setFoundParentDocument] = useState(null);

  // form states
  const [fileList, setFileList] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [projectOptions, setProjectOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [ccOptions, setCcOptions] = useState([]);

  // reply logic
  const [selectedDocumentSide, setSelectedDocumentSide] = useState(initialValues.documentSide || null);
  const [selectedResponseType, setSelectedResponseType] = useState(null);
  const [isReplyDocument, setIsReplyDocument] = useState(false);

  // search input
  const [searchDocumentNumber, setSearchDocumentNumber] = useState("");
  const [searchingDocument, setSearchingDocument] = useState(false);

  // official toggle
 const isOfficial = Form.useWatch("isOfficialParty", form) ?? true;

const needParentSearch =
  isReplyDocument &&          // المستخدم اختار "اجابة صادر/وارد"
  !hasParent &&              // لم يأتِ من زر ردّ (لا parentDocumentId فى الـroute)
  !foundParentDocument;      // ولم يجد مستنداً بالبحث بعد


  /* Fetch static lists */
  useEffect(() => {
    (async () => {
      try {
        const [projects, tags, ccs] = await Promise.all([
          axiosInstance.get("/api/Project?PageNumber=1&PageSize=10000"),
          axiosInstance.get("/api/Tags?PageNumber=1&PageSize=1000"),
          axiosInstance.get("/api/DocumentCC?PageNumber=1&PageSize=1000"),
        ]);
        setProjectOptions(projects.data);
        setTagOptions(tags.data);
        setCcOptions(ccs.data);
      } catch {
        message.error("خطأ فى تحميل القوائم الثابتة");
      }
    })();
  }, []);

  /* Reply flag */
  useEffect(() => {
    setIsReplyDocument(
      selectedResponseType === 1 ||
      selectedResponseType === 4
    );
  }, [selectedResponseType]);

  /* Fetch parent from router */
  useEffect(() => {
    if (!hasParent) return;
    (async () => {
      try {
        const { data } = await axiosInstance.get(`/api/Document/${parentDocumentId}`);
        setFetchedDocumentData(data);
          prefillFromParent(data, form);          // <<– add this line
      } catch {
        message.error("تعذّر جلب بيانات الكتاب الأصلى");
      }
    })();
  }, [hasParent, parentDocumentId]);

  /* Populate in edit-mode */
  useEffect(() => {
    if (!editMode || !initialValues) return;
    setSelectedDocumentSide(initialValues.documentSide);
    form.setFieldsValue({
      ...initialValues,
      date: initialValues.date ? moment(initialValues.date) : null,
    });
    setIsOfficial(initialValues.isOfficialParty);
    if (initialValues.fileUrl) {
      setFileList([{
        uid: "-1",
        name: initialValues.fileName || "Current file",
        status: "done",
        url: initialValues.fileUrl,
      }]);
      if (initialValues.fileType?.startsWith("image/")) {
        setPreviewUrls([initialValues.fileUrl]);
      }
    }
  }, [editMode, initialValues, form]);

  /* Upload config */
    const fileUploadProps = {
    name: "file",
    multiple: true,
    fileList,
    beforeUpload: (file) => {
      const ok =
        ["application/pdf", "image/jpeg", "image/png"].includes(file.type) &&
        file.size / 1024 / 1024 < 10;
      if (!ok) {
        message.error("يُسمح بـ PDF أو JPG/PNG ≤ 10MB");
        return false;
      }
      // always add the File to fileList
      setFileList(prev => [...prev, file]);
      // for PDFs, push the File object itself
      if (file.type === "application/pdf") {
        setPreviewUrls(prev => [...prev, file]);
      } else {
        // for images, push a blob URL
        setPreviewUrls(prev => [...prev, URL.createObjectURL(file)]);
      }
      return false; // prevent auto‐upload
    },
    onRemove: () => {
      setFileList([]);
      setPreviewUrls([]);
    },
  };

  /* Search parent document */
  const handleSearchParentDocument = async () => {
    if (!searchDocumentNumber.trim()) {
      return message.warning("أدخل رقم الكتاب للبحث");
    }
    setSearchingDocument(true);
    try {
      const { data } = await axiosInstance.get(`/api/Document/bynumber/${searchDocumentNumber.trim()}`);
      if (foundParentDocument && foundParentDocument.id === data.id) {
        message.info("الكتاب المرجعي موجود بالفعل");
      } else {
        setFoundParentDocument(data);
        prefillFromParent(data, form);
        message.success(`تم العثور على الكتاب: ${data.title}`);
      }
      setSearchDocumentNumber("");
    } catch {
      setFoundParentDocument(null);
      message.error("لم يتم العثور على الكتاب");
    } finally {
      setSearchingDocument(false);
    }
  };

  /* ─────────────── Submit handler ─────────────── */
const handleSubmit = async () => {
  try {
    const values = await form.validateFields();

    if (!profileId)          return message.error("تعذّر إيجاد المستخدم");
    if (!fileList.length)    return message.error("ارفع ملفًا واحدًا على الأقل");

    const targetDocumentId = foundParentDocument?.id || parentDocumentId;
    const isReplyMode      = !!targetDocumentId;

    if (isReplyDocument && !isReplyMode) {
      return message.error("هذا النوع يتطلّب تحديد الكتاب الأصلى");
    }

    /* ─── Build payload ─── */
    const fd = new FormData();

    // ── shared
    fd.append("Title",            values.title);
    fd.append("ResponseType",     getResponseTypeValue(selectedDocumentSide, values.ResponseType));
    fd.append("IsRequiresReply",  values.isRequiresReply);
    fd.append("IsUrgent",         values.isUrgent);
    fd.append("IsImportant",      values.isImportant);
    fd.append("IsNeeded",         values.isNeeded);
    fd.append("ProjectId",        values.projectId);
    fd.append("Subject",          values.subject);
    fd.append("Notes",            values.notes ?? "");
    fd.append("ProfileId",        profileId);

    /* ⬇⬇  NEW PART — official vs. private payload  ⬇⬇ */
    if (values.isOfficialParty)  {
      // 100 % official – send the full hierarchy
  if (values.ministryId)            fd.append("MinistryId",           values.ministryId);            // ما يزال إلزاميًا
  if (values.generalDirectorateId)  fd.append("GeneralDirectorateId", values.generalDirectorateId);  // اختيارى
  if (values.directorateId)         fd.append("DirectorateId",        values.directorateId);         // اختيارى
  if (values.departmentId)          fd.append("DepartmentId",         values.departmentId);          // اختيارى
  if (values.sectionId)             fd.append("SectionId",            values.sectionId); 
    } else {
      // private party
      fd.append("PrivatePartyId",       values.privatePartyId);
    }
    /* ⬆⬆  END NEW PART ⬆⬆ */

    // ── document‑side specifics
    if (isReplyMode) {
      // … replying to an existing document
      fd.append("ReplyDocumentNumber", values.documentNumber);
      fd.append("ReplyType",           selectedDocumentSide === "صادر" ? "1" : "2");
      fd.append("ReplyDate",           values.date.format("YYYY-MM-DDT00:00:00[Z]"));
      fd.append("ParentDocumentId",    targetDocumentId);
    } else {
      // … brand‑new document
      fd.append("DocumentNumber",  values.documentNumber);
      fd.append("DocumentType",    selectedDocumentSide === "صادر" ? "1" : "2");
      fd.append("DocumentDate",    values.date.format("YYYY-MM-DDT00:00:00[Z]"));
      if (targetDocumentId && !isReplyDocument) {
        fd.append("ParentDocumentId", targetDocumentId);
      }
    }

    // ── arrays (unchanged)
    (values.ccIds  || []).forEach(id => fd.append("CCIds",  id));
    (values.tagIds || []).forEach(id => fd.append("TagIds", id));
    fileList.forEach(f => fd.append("Files", f.originFileObj ?? f, f.name));

    /* ─── Fire request ─── */
    setSubmitting(true);
    const url = isReplyMode
      ? `/api/Document/${targetDocumentId}/reply`
      : "/api/Document";
    await axiosInstance.post(url, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    message.success(isReplyMode ? "تم إرسال الرد" : "تم إضافة الكتاب");
    navigate("/archive");
  } catch (e) {
    const msg =
      e.response?.data?.message ||
      Object.values(e.response?.data?.errors || {}).flat().join(", ") ||
      "خطأ غير معروف";
    message.error(msg);
  } finally {
    setSubmitting(false);
  }
};


  /* Render */
  return (
    <ConfigProvider locale={ar_EG} direction="rtl">
      <Layout
        className={`document-page-layout${isSidebarCollapsed ? " document-page-layout-sidebar-collapsed" : ""}`}
        style={{ background: "none" }}
      >
        <Header className="document-page-header">
          <h1>{editMode ? "تعديل كتاب" : "إضافة كتاب جديد"}</h1>
        </Header>
        <Content className="document-page-content">
          <div className="document-page-container">
            <Row gutter={24}>
              {/* router-state parent */}
              {hasParent && fetchedDocumentData && (
                <Col span={24}>
                  <div className="ref-doc-card">
                    <div className={`doc-type-indicator ${fetchedDocumentData.documentType === 1 ? 'outgoing' : 'incoming'}`}>
                      {fetchedDocumentData.documentType === 1 ? 'صادر' : 'وارد'}
                    </div>
                    <div className="ref-doc-content">
                      <div className="ref-doc-info">
                        <div className="ref-doc-number">{fetchedDocumentData.documentNumber}</div>
                        <div className="ref-doc-title">{fetchedDocumentData.title}</div>
                        <div className="ref-doc-project">{fetchedDocumentData.projectName || 'غير محدد'}</div>
                      </div>
                      <div className="ref-doc-actions">
                        <Button
                          type="primary"
                          icon={<EyeFilled />}
                          onClick={() => {
                            setModalDocumentData(fetchedDocumentData);
                            setParentDocModalVisible(true);
                          }}
                        >
                          التفاصيل
                        </Button>
                      </div>
                    </div>
                  </div>
                </Col>
              )}

              {/* searched parent */}
              {foundParentDocument && isReplyDocument && (
                <Col span={24}>
                  <div className="ref-doc-card">
                    <div className={`doc-type-indicator ${foundParentDocument.documentType === 1 ? 'outgoing' : 'incoming'}`}>
                      {foundParentDocument.documentType === 1 ? 'صادر' : 'وارد'}
                    </div>
                    <div className="ref-doc-content">
                      <div className="ref-doc-info">
                        <div className="ref-doc-number">{foundParentDocument.documentNumber}</div>
                        <div className="ref-doc-title">{foundParentDocument.title}</div>
                        <div className="ref-doc-project">{foundParentDocument.projectName || 'غير محدد'}</div>
                      </div>
                      <div className="ref-doc-actions">
                        <Button
                          type="primary"
                          icon={<EyeFilled />}
                          onClick={() => {
                            setModalDocumentData(foundParentDocument);
                            setParentDocModalVisible(true);
                          }}
                        >
                          التفاصيل
                        </Button>
                        {!hasParent && (
                          <Button
                            type="dashed"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              setFoundParentDocument(null);
                              message.info("تم حذف الكتاب المرجعي");
                            }}
                          >
                            حذف
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Col>
              )}

              {/* unified modal */}
         {/* Unified Parent-Doc Modal */}
<Modal
  open={parentDocModalVisible}
  onCancel={() => setParentDocModalVisible(false)}
  width={800}
  centered
  className="ref-doc-modal"
  style={{ marginTop: "100px" }}
  title={
    modalDocumentData && (
      <div className="modal-title-container">
        <div className={`modal-doc-type ${modalDocumentData.documentType === 1 ? 'outgoing' : 'incoming'}`}>
          {modalDocumentData.documentType === 1 ? 'صادر' : 'وارد'}
        </div>
        <span className="modal-title">تفاصيل الكتاب</span>
      </div>
    )
  }
  footer={[
    <Button key="close" type="primary" size="large" onClick={() => setParentDocModalVisible(false)}>
      <CheckCircleOutlined style={{ marginLeft: 8 }} />
      موافق
    </Button>
  ]}
>
  {modalDocumentData ? (
    <div className="modal-content">
      {/* Header Info */}
      <div className="doc-header-info">
        <div className="doc-main-info">
          <h2 className="doc-title">{modalDocumentData.title}</h2>
          <div className="doc-number-container">
            <div className="info-label">رقم الكتاب:</div>
            <div className="info-value doc-number">{modalDocumentData.documentNumber}</div>
          </div>
        </div>
      </div>

      {/* Main Info Section */}
      <div className="info-section">
        <h3 className="section-title">المعلومات الأساسية</h3>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-label">المشروع</div>
            <div className="info-value">{modalDocumentData.projectName || 'غير محدد'}</div>
          </div>
          <div className="info-item">
            <div className="info-label">الجهة</div>
            <div className="info-value">
              {modalDocumentData.privatePartyName ||
               modalDocumentData.sectionName ||
               'غير محدد'}
            </div>
          </div>
          <div className="info-item">
            <div className="info-label">تاريخ الكتاب</div>
            <div className="info-value">
              {new Date(modalDocumentData.documentDate).toLocaleDateString("ar-EG")}
            </div>
          </div>
          <div className="info-item">
            <div className="info-label">تم إنشاؤه بواسطة</div>
            <div className="info-value">{modalDocumentData.profileFullName || 'غير محدد'}</div>
          </div>
          <div className="info-item">
            <div className="info-label">نوع الرد</div>
            <div className="info-value">
              {modalDocumentData.responseType === 1 ? 'اجابة وارد' :
               modalDocumentData.responseType === 2 ? 'تأكيد وارد' :
               modalDocumentData.responseType === 3 ? 'وارد جديد' :
               modalDocumentData.responseType === 4 ? 'اجابة صادر' :
               modalDocumentData.responseType === 5 ? 'تأكيد صادر' :
               modalDocumentData.responseType === 6 ? 'صادر جديد' :
               'غير محدد'}
            </div>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="content-section">
        <h3 className="section-title">محتوى المستند</h3>
        <div className="content-container">
          <div className="content-box">
            <div className="content-label">الموضوع</div>
            <div className="content-text">{modalDocumentData.subject}</div>
          </div>
          {modalDocumentData.notes && (
            <div className="content-box">
              <div className="content-label">ملاحظات</div>
              <div className="content-text">{modalDocumentData.notes}</div>
            </div>
          )}
        </div>
      </div>

      {/* Attributes */}
      <div className="attributes-section">
        <h3 className="section-title">سمات المستند</h3>
        <div className="attributes-container">
          <div className={`attribute-item ${modalDocumentData.isUrgent ? 'active' : ''}`}>
            <div className="attribute-status"></div>
            <div className="attribute-label">{modalDocumentData.isUrgent ? 'عاجل' : 'غير عاجل'}</div>
          </div>
          <div className={`attribute-item ${modalDocumentData.isImportant ? 'active' : ''}`}>
            <div className="attribute-status"></div>
            <div className="attribute-label">{modalDocumentData.isImportant ? 'مهم' : 'غير مهم'}</div>
          </div>
          <div className={`attribute-item ${modalDocumentData.isRequiresReply ? 'active' : ''}`}>
            <div className="attribute-status"></div>
            <div className="attribute-label">{modalDocumentData.isRequiresReply ? 'يتطلب رد' : 'لا يتطلب رد'}</div>
          </div>
          <div className={`attribute-item ${modalDocumentData.isNeeded ? 'active' : ''}`}>
            <div className="attribute-status"></div>
            <div className="attribute-label">{modalDocumentData.isNeeded ? 'يستلزم إجراء' : 'لا يستلزم إجراء'}</div>
          </div>
          <div className={`attribute-item ${modalDocumentData.isReplied ? 'active' : ''}`}>
            <div className="attribute-status"></div>
            <div className="attribute-label">{modalDocumentData.isReplied ? 'تم الرد' : 'لم يتم الرد'}</div>
          </div>
        </div>
      </div>

      {/* CC Recipients */}
      {modalDocumentData.ccNames?.length > 0 && (
        <div className="cc-section">
          <h3 className="section-title">نسخة إلى</h3>
          <div className="cc-container">
            {modalDocumentData.ccNames.map((name, i) => (
              <Tag key={i} className="cc-tag">{name}</Tag>
            ))}
          </div>
        </div>
      )}

      {/* Child Documents */}
      {modalDocumentData.childDocuments?.length > 0 && (
        <div className="children-section">
          <h3 className="section-title">
            المستندات المرتبطة ({modalDocumentData.childDocuments.length})
          </h3>
          <div className="children-container">
            {modalDocumentData.childDocuments.map((child, i) => (
              <div className="child-doc-item" key={i}>
                <div className={`child-type ${child.documentType === 1 ? 'outgoing' : 'incoming'}`}>
                  {child.documentType === 1 ? 'صادر' : 'وارد'}
                </div>
                <div className="child-info">
                  <div className="child-number">رقم: {child.documentNumber}</div>
                  <div className="child-title">{child.title}</div>
                  <div className="child-date">
                    تاريخ: {new Date(child.documentDate).toLocaleDateString("ar-EG")}
                  </div>
                </div>
                <div className="child-attributes">
                  {child.isUrgent && <Tag className="attrib-tag">عاجل</Tag>}
                  {child.isImportant && <Tag className="attrib-tag">مهم</Tag>}
                  {child.isRequiresReply && <Tag className="attrib-tag">يتطلب رد</Tag>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  ) : (
    <Empty description="لا توجد بيانات متاحة" />
  )}
</Modal>


              {/* the rest of your form */}
              <Col span={24}>
                <Form form={form} layout="vertical" labelAlign="right" preserve={false}>
                  {/* official/private toggle */}
                  <Row gutter={16}>
                    <Col span={4}>
                      <Form.Item
                        name="isOfficialParty"
                        label="هل الجهة رسمية؟"
                        initialValue={isOfficial}
                        rules={[{ required: true, message: "اختر" }]}
                      >
                        <Select
                       onChange={(val) => {
                          form.resetFields([
                            "ministryId","generalDirectorateId","directorateId",
                            "departmentId","sectionId","privatePartyId"
                          ]);
                        }}
                        >
                          <Option value={true}>رسمية</Option>
                          <Option value={false}>غير رسمية</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={20}>
                       <OfficialPartySelector
                          key={isOfficial ? "official" : "private"}
                          disabled={!isOfficial}
                        />
                    </Col>
                    <Col span={4}>
                       <PrivatePartySelector
                          disabled={isOfficial}
                        />
                    </Col>
                  </Row>

                 {/* ==== نوع الكتاب / خياراته / البحث عن الأصل ==== */}
                 <Divider orientation="left">تصنيف الكتاب</Divider>
                  <Row gutter={16}>
                    <Col span={4}>
                      <Form.Item
                        name="documentSide" label="نوع الكتاب"
                        rules={[{ required: true, message: "اختر" }]}
                      >
                        <Select onChange={(v) => {
                          setSelectedDocumentSide(v);
                          form.setFieldsValue({ ResponseType: undefined });
                          setSelectedResponseType(null);
                        }}>
                          <Option value="صادر">صادر</Option>
                          <Option value="وارد">وارد</Option>
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col span={4}>
                      <Form.Item
                        name="ResponseType" label="خيارات الكتاب"
                        rules={[{ required: true, message: "اختر" }]}
                      >
                        <Select
                          disabled={!selectedDocumentSide}
                          onChange={(opt) => {
                            setSelectedResponseType(
                              getResponseTypeValue(selectedDocumentSide, opt)
                            );
                            form.setFieldsValue({ ResponseType: opt });
                          }}
                        >
                          {(getDocumentOptionChoices(selectedDocumentSide) || []).map((o) => (
                            <Option key={o}>{o}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    {needParentSearch && (
                      <Col span={8}>
                        <Form.Item label="بحث عن الكتاب الأصلى">
                          <Input.Group compact>
                            <Input
                              style={{ width: "80%" }}
                              placeholder="رقم الكتاب"
                              value={searchDocumentNumber}
                              onChange={(e) => setSearchDocumentNumber(e.target.value)}
                              onPressEnter={handleSearchParentDocument}
                            />
                            <Button
                              type="primary" icon={<SearchOutlined />}
                              loading={searchingDocument}
                              onClick={handleSearchParentDocument}
                              style={{height:"45px"}}
                            >
                              بحث
                            </Button>
                          </Input.Group>
                        </Form.Item>
                      </Col>
                    )}
                  </Row>

                  {/* ==== رقم/عنوان/CC/تاريخ ==== */}
                  <Divider orientation="left">تفاصيل أساسية</Divider>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Form.Item
                        name="documentNumber" label="رقم الكتاب"
                        rules={[{ required: true, message: "أدخل الرقم" }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>

                    <Col span={6}>
                      <Form.Item
                        name="title" label="الموضوع"
                        rules={[{ required: true, message: "أدخل العنوان" }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>

                    <Col span={6}>
                      <Form.Item name="ccIds" label="نسخة منه إلى">
                        <Select
                          mode="multiple" allowClear showSearch
                          maxTagCount="responsive"
                          filterOption={(i, o) => o.children.toLowerCase().includes(i.toLowerCase())}
                        >
                          {ccOptions.map((cc) => (
                            <Option key={cc.id} value={cc.id}>{cc.recipientName}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col span={6}>
                      <Form.Item
                        name="date" label="تاريخ الكتاب"
                        rules={[{ required: true, message: "اختر التاريخ" }]}
                      >
                        <DatePicker style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item
                          name="projectId"
                          label="المشروع"
                          rules={[{ required: true, message: "اختر المشروع" }]}
                        >
                          <Select
                            showSearch
                            placeholder="اختر المشروع"
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                              option.children.toLowerCase().includes(input.toLowerCase())
                            }
                          >
                            {projectOptions.map((p) => (
                              <Option key={p.id} value={p.id}>{p.name}</Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>

                  </Row>

                  {/* ==== سمات الكتاب ==== */}
                  <Divider orientation="left">سمات الكتاب</Divider>
                  <Row gutter={16}>
                    {["isRequiresReply","isUrgent","isImportant","isNeeded"].map((field, idx) => (
                      <Col span={4} key={field}>
                        <Form.Item
                          name={field}
                          label={["يتطلب رد؟","عاجل؟","مهم؟","يستلزم إجراء؟"][idx]}
                          initialValue={false}
                          rules={[{ required: true, message: "اختر" }]}
                        >
                          <Select>
                            <Option value={true}>نعم</Option>
                            <Option value={false}>لا</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    ))}

                    {isDirector && (
                      <Col span={6}>
                        <Form.Item name="tagIds" label="الوسوم">
                          <Select
                            mode="multiple" allowClear showSearch
                            filterOption={(i, o) => o.children.toLowerCase().includes(i.toLowerCase())}
                          >
                            {tagOptions.map((t) => (
                              <Option key={t.id} value={t.id}>{t.name}</Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    )}
                  </Row>

                  {/* ==== الموضوع / الملاحظات ==== */}
                  <Divider orientation="left">تفاصيل الكتاب والملاحظات</Divider>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="subject" label="تفاصيل الكتاب"
                        rules={[{ required: true, message: "أدخل التفاصيل" }]}
                      >
                        <TextArea rows={4} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="notes" label="ملاحظات">
                        <TextArea rows={4} />
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* ==== المرفقات ==== */}
                  <Divider orientation="left">المرفقات</Divider>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="attachment">
                        <Dragger {...fileUploadProps}>
                          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                          <p className="ant-upload-text">انقر أو اسحب ملفًا هنا</p>
                          <p className="ant-upload-hint">PDF أو JPG/PNG بحد أقصى 10MB</p>
                        </Dragger>
                      </Form.Item>
                    </Col>
                    {previewUrls.length > 0 && (
                      <Col span={12}>
                        <ImagePreviewer
                          uploadedImages={previewUrls}
                          defaultWidth={600}
                          defaultHeight={300}
                          onDeleteImage={(idx) => {
                            setPreviewUrls(p => p.filter((_, i) => i !== idx));
                            setFileList  (p => p.filter((_, i) => i !== idx));
                          }}
                        />
                      </Col>
                    )}
                  </Row>

                </Form>
              </Col>
            </Row>
          </div>

          {/* action buttons */}
          <div className="form-actions">
            <Button
              type="primary"
              size="large"
              icon={<CheckCircleOutlined />}
              onClick={handleSubmit}
              loading={submitting}
            >
              {editMode ? "حفظ التغييرات" : "حفظ"}
            </Button>
            <Button
              danger
              size="large"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/archive")}
              style={{ marginInlineStart: 8 }}
            >
              العودة
            </Button>
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

export default AddDocumentPage;
