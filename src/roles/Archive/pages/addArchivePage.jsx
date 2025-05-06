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
  Space,
  Tag,
  Card,
  Tooltip,
} from "antd";
import { 
  InboxOutlined, 
  ArrowLeftOutlined, 
  SearchOutlined, 
  LinkOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  EyeFilled,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
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

  const parentDocumentId = location.state?.parentDocumentId ?? null;
  const hasParent = Boolean(parentDocumentId);

  const [fileList, setFileList] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [fetchedDocumentData, setFetchedDocumentData] = useState(null);
  const [searchDocumentNumber, setSearchDocumentNumber] = useState("");
  const [searchingDocument, setSearchingDocument] = useState(false);
  const [foundParentDocument, setFoundParentDocument] = useState(null);
  const [parentDocModalVisible, setParentDocModalVisible] = useState(false);

  const [projectOptions, setProjectOptions] = useState([]);
  const [documentPartyOptions, setDocumentPartyOptions] = useState([]);
  const [ministryOptions, setMinistryOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [ccOptions, setCcOptions] = useState([]);

  const [selectedDocumentSide, setSelectedDocumentSide] = useState(
    initialValues.documentSide || null
  );
  const [selectedResponseType, setSelectedResponseType] = useState(null);
  const [isReplyDocument, setIsReplyDocument] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedIsOfficial, setSelectedIsOfficial] = useState(true);
  const [selectedPartyType, setSelectedPartyType] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  const { isSidebarCollapsed, profile } = useAuthStore();
  const userPosition = profile?.position;
  const isDirector = userPosition === "Director" || userPosition === "SuperAdmin";
  
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

  /* ───────────── check if document is reply type ───────────── */
  useEffect(() => {
    if (selectedResponseType === 1 || selectedResponseType === 4) {
      setIsReplyDocument(true);
    } else {
      setIsReplyDocument(false);
      setFoundParentDocument(null);
    }
  }, [selectedResponseType]);

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

  const handlePartyTypeChange = async (partyType) => {
    setSelectedPartyType(partyType);
    form.setFieldsValue({ PartyId: undefined }); // Clear PartyId when party type changes

    if (selectedProject && selectedIsOfficial !== null) {
      try {
        const response = await axiosInstance.get(
          `/api/DocumentParty/${selectedProject}/${partyType}/${selectedIsOfficial}`
        );
        setDocumentPartyOptions(response.data); // Set the response data to the options
      } catch (error) {
        message.error("خطأ في جلب بيانات الجهات");
      }
    } else {
      message.error("لم يتم تحديد المشروع أو حالة الجهة الرسمية");
    }
  };

  /* ───────────── handle response type change ───────────── */
  const handleResponseTypeChange = (option) => {
    const responseType = getResponseTypeValue(selectedDocumentSide, option);
    setSelectedResponseType(responseType);
    form.setFieldsValue({ ResponseType: option });
  };

  /* ───────────── search for parent document ───────────── */
  const handleSearchParentDocument = async (e) => {
    // Prevent form submission if triggered by Enter key
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    if (!searchDocumentNumber.trim()) {
      message.warning("الرجاء إدخال رقم الكتاب للبحث");
      return;
    }

    setSearchingDocument(true);
    try {
      const response = await axiosInstance.get(`/api/Document/bynumber/${searchDocumentNumber.trim()}`);
      setFoundParentDocument(response.data);
      message.success(`تم العثور على الكتاب: ${response.data.title}`);
    } catch (error) {
      console.error(error);
      message.error("لم يتم العثور على الكتاب بهذا الرقم");
      setFoundParentDocument(null);
    } finally {
      setSearchingDocument(false);
    }
  };

  /* ───────────── view parent document details ───────────── */
  const viewParentDocumentDetails = () => {
    if (foundParentDocument) {
      setParentDocModalVisible(true);
    }
  };

  /* ───────────── confirm selection of parent document ───────────── */
  const confirmParentDocument = () => {
    if (foundParentDocument) {
      message.success(`تم اختيار الكتاب "${foundParentDocument.title}" كمرجع`);
      setParentDocModalVisible(false);
    }
  };

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
  

 /* ───────────── submit logic ───────────── */
 /* ───────────── submit logic (with console logs) ───────────── */
/* ───────────── submit logic (fixed) ───────────── */
const handleSubmit = async () => {
  try {
    /* 1. التحقق من الحقول */
    const values = await form.validateFields();

    if (!profileId) return message.error("تعذّر إيجاد بيانات المستخدم");
    if (!fileList.length) return message.error("ارفع ملفاً واحداً على الأقل");

    /* 2. تحديد وضع الإرسال */
    const targetDocumentId = foundParentDocument?.id || parentDocumentId;
    const isReplyMode      = !!targetDocumentId;

    console.log("🗂️  Mode:", isReplyMode ? "Reply" : "New");

    if (isReplyDocument && !isReplyMode) {
      return message.error("هذا النوع يتطلب تحديد الكتاب الأصلي قبل الإرسال");
    }

    setSubmitting(true);

    /* 3. بناء FormData */
    const fd = new FormData();

    // (أ) الحقول المشتركة
    fd.append("Title",          values.title);
    fd.append("ResponseType",
      getResponseTypeValue(selectedDocumentSide, values.ResponseType));
    fd.append("IsRequiresReply", values.isRequiresReply);
    fd.append("IsUrgent",        values.isUrgent);
    fd.append("IsImportant",     values.isImportant);
    fd.append("IsNeeded",        values.isNeeded);
    fd.append("IsOfficialParty", values.isOfficialParty);
    fd.append("ProjectId",       values.project);
    fd.append("PartyId",         values.PartyId);
    fd.append("ProfileId",       profileId);
    fd.append("MinistryId",      values.isOfficialParty ? values.ministryId : "");
    fd.append("Subject",         values.subject);
    fd.append("Notes",           values.notes ?? "");

    // (ب) الحقول المتغيّرة
    if (isReplyMode) {
      fd.append("ReplyDocumentNumber", values.documentNumber);
      fd.append("ReplyType",           selectedDocumentSide === "صادر" ? 1 : 2);
      fd.append("ReplyDate",
        `${values.date.format("YYYY-MM-DD")}T00:00:00Z`);
      /*  ⬅️ السطر المُضاف */
      fd.append("ParentDocumentId",    targetDocumentId);
    } else {
      fd.append("DocumentNumber", values.documentNumber);
      fd.append("DocumentType",   selectedDocumentSide === "صادر" ? 1 : 2);
      fd.append("DocumentDate",
        `${values.date.format("YYYY-MM-DD")}T00:00:00Z`);

      const parentId = foundParentDocument?.id ?? parentDocumentId ?? "";
      if (parentId) fd.append("ParentDocumentId", parentId);
    }

    // (ج) القوائم المتعددة
    (values.ccIds  || []).forEach(id => fd.append("CCIds",  id));
    (values.tagIds || []).forEach(id => fd.append("TagIds", id));

    // (د) الملفات
    fileList.forEach(f => fd.append("Files", f.originFileObj ?? f, f.name));

    /* طباعة محتويات الـ FormData للتأكد */

    /* 4. تحديد المسار */
    const endpoint = isReplyMode
      ? `/api/Document/${targetDocumentId}/reply`
      : "/api/Document";

    /* 5. الإرسال */
    await axiosInstance.post(endpoint, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    message.success(isReplyMode ? "تم إرسال الردّ بنجاح" : "تم إضافة الكتاب");
    navigate("/archive");
  } catch (e) {
    const msg =
      e.response?.data?.message ||
      Object.values(e.response?.data?.errors || {}).flat().join(", ") ||
      "خطأ غير معروف";
    console.error("❌ Submission error:", msg, e);
    message.error(msg);
  } finally {
    setSubmitting(false);
  }
};

  /* ───────────── render ───────────── */
  return (
    <ConfigProvider locale={ar_EG} direction="rtl">
      <Layout       
        className={`document-page-layout ${
          isSidebarCollapsed ? "document-page-layout-sidebar-collapsed" : "document-page-layout"
        }`} 
        style={{background:"none" }}
      >
        <Header className="document-page-header"  >
          <h1>{editMode ? "تعديل كتاب" : "إضافة كتاب جديد"}</h1>
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

              {foundParentDocument && isReplyDocument && (
                <Col span={24}>
                  <Card 
                    title={<><LinkOutlined /> الكتاب المرجعي (سيتم الرد عليه)</>}
                    style={{ marginBottom: 16, borderColor: '#1890ff' }}
                    
                        
                    extra={
                      <Button
                        type="dashed"
                        
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => setFoundParentDocument(null)}
                      >
                        إلغاء الاختيار
                      </Button>
                    }
                  >
                    <Row gutter={16}>
                      <Col span={12} style={{fontSize:"18px"}}>
                        <p>
                          <strong>رقم الكتاب:</strong> {foundParentDocument.documentNumber}
                        </p>
                        <p>
                          <strong>العنوان:</strong> {foundParentDocument.title}
                        </p>
                        <p>
                          <strong>التاريخ:</strong>{" "}
                          {new Date(foundParentDocument.documentDate).toLocaleDateString("ar-EG")}
                        </p>
                      </Col>
                      <Col span={12}  style={{fontSize:"18px"}}>
                        <p>
                          <strong>الجهة:</strong> {foundParentDocument.partyName}
                        </p>
                        <p>
                          <strong>نوع الكتاب:</strong> {foundParentDocument.documentType === 1 ? "صادر" : "وارد"}
                        </p>
                        <p>
                          <Tag color={foundParentDocument.isUrgent ? "red" : "default"}>
                            {foundParentDocument.isUrgent ? "عاجل" : "غير عاجل"}
                          </Tag>
                          <Tag color={foundParentDocument.isImportant ? "orange" : "default"}>
                            {foundParentDocument.isImportant ? "مهم" : "غير مهم"}
                          </Tag>
                          <Tag color={foundParentDocument.isRequiresReply ? "green" : "default"}>
                            {foundParentDocument.isRequiresReply ? "يتطلب رد" : "لا يتطلب رد"}
                          </Tag>
                        </p>
                      </Col>
                    </Row>
                    <Button 
                      type="primary"
                      size="small"
                      icon={<EyeFilled />}
                      onClick={viewParentDocumentDetails}
                      style={{height:"40px" ,marginTop:"30px"}}
                      
                    >
                      عرض التفاصيل
                    </Button>
                  </Card>
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
                  <Row gutter={16} >
                    <Col xs={24} sm={4} className="margin-bottom">
                      <Form.Item
                        name="isOfficialParty"
                        label="هل الجهة رسمية؟"
                        rules={[{ required: true, message: "اختر" }]}
                        initialValue={selectedIsOfficial}
                      >
                        <Select
                          onChange={(value) => {
                            setSelectedIsOfficial(value); // Update only the official status
                            form.setFieldsValue({
                              PartyId: undefined, // Reset PartyId
                              ministryId: value ? undefined : null, // Reset ministryId if not official
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
                          onChange={(value) => setSelectedProject(value)} // Set selected project
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
                        name="partyType"
                        label="نوع الجهه"
                        rules={[{ required: true, message: "اختر" }]}
                        initialValue={selectedPartyType}
                      >
                        <Select
                          onChange={(value) => {
                            setSelectedPartyType(value);  // Update party type
                            handlePartyTypeChange(value); // Fetch the document party options dynamically
                          }}
                        >
                          <Option value="MainDepartment">مديرية عامة</Option>
                          <Option value="Department">مديرية</Option>
                          <Option value="Section">قسم</Option>
                          <Option value="Directorate">شعبة</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={4}>
                      <Form.Item
                        name="PartyId"
                        label="اسم الجهه"
                        rules={[{ required: true, message: "اختر الجهة" }]}
                      >
                        <Select
                          showSearch
                          filterOption={(i, o) =>
                            o.children.toLowerCase().includes(i.toLowerCase())
                          }
                          disabled={!selectedPartyType || !selectedProject || !selectedIsOfficial}
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
                            setSelectedResponseType(null);
                            setIsReplyDocument(false);
                          }}
                        >
                          <Option value="صادر">صادر</Option>
                          <Option value="وارد">وارد</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16} className="margin-bottom">
                    <Col xs={24} sm={isReplyDocument && !foundParentDocument ? 4 : 4}>
                      <Form.Item
                        name="ResponseType"
                        label="خيارات الكتاب"
                        rules={[{ required: true, message: "اختر خياراً" }]}
                      >
                        <Select 
                          disabled={!selectedDocumentSide}
                          onChange={handleResponseTypeChange}
                        >
                          {(getDocumentOptionChoices(selectedDocumentSide) || []
                          ).map((opt) => (
                            <Option key={opt} value={opt}>
                              {opt}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    {/* Parent Document Search Field - Only show if document is reply type and no parent selected yet */}
                    {isReplyDocument && !foundParentDocument && (
  <Col xs={24} sm={8}  >
    <Form.Item label="بحث عن الكتاب الأصلي للرد عليه">
      <Row gutter={8} align="middle">
        {/* حقل الرقم */}
        <Col flex="auto">
          <Input
            placeholder="أدخل رقم الكتاب للبحث"
            value={searchDocumentNumber}
            onChange={(e) => setSearchDocumentNumber(e.target.value)}
            onPressEnter={handleSearchParentDocument}
          />
        </Col>

        {/* زر البحث */}
        <Col>
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleSearchParentDocument}
            loading={searchingDocument}
            style={{height:"40px"}}
          >
            بحث
          </Button>
        </Col>
      </Row>
    </Form.Item>
  </Col>
)}
                  </Row>

                  {/* ==== صف المشروع/الرقم/العنوان/التاريخ ==== */}
                  <Row gutter={16}>
                    <Col xs={24} sm={6} className="margin-bottom">
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
                          maxTagCount="responsive"                  // automatically collapse based on available width
                          maxTagPlaceholder={omittedValues => `+${omittedValues.length}`}
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
                  <Row gutter={16} className="margin-bottom">
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

                    {isDirector && (
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
                    )}
                  </Row>

                  {/* ==== الموضوع / الملاحظات ==== */}<Row gutter={16}>
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
              icon={<CheckCircleOutlined />}
            >
              {editMode ? "حفظ التغييرات" : "حفظ"}
            </Button>
            <Button
              danger
              onClick={() => navigate("/archive")}
              size="large"
              style={{ marginInlineStart: 8 }}
              icon={<ArrowLeftOutlined />}
            >
              العودة
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

      {/* ==== Modal تفاصيل الكتاب المرجعي ==== */}
      <Modal
        open={parentDocModalVisible}
        title={<><LinkOutlined /> بيانات الكتاب المرجعي</>}
        width={700}
        footer={[
          <Button
            key="confirm"
            type="primary"
            onClick={confirmParentDocument}
            disabled={!foundParentDocument}
            icon={<CheckCircleOutlined />}
          >
            تأكيد الاختيار
          </Button>,
          <Button
            key="close"
            onClick={() => setParentDocModalVisible(false)}
          >
            إغلاق
          </Button>,
        ]}
        onCancel={() => setParentDocModalVisible(false)}
      >
        {foundParentDocument ? (
          <>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="رقم الكتاب" span={1}>
                {foundParentDocument.documentNumber}
              </Descriptions.Item>
              <Descriptions.Item label="نوع الكتاب" span={1}>
                {foundParentDocument.documentType === 1 ? "صادر" : "وارد"}
              </Descriptions.Item>
              <Descriptions.Item label="عنوان الكتاب" span={2}>
                {foundParentDocument.title}
              </Descriptions.Item>
              <Descriptions.Item label="الجهة" span={1}>
                {foundParentDocument.partyName}
              </Descriptions.Item>
              <Descriptions.Item label="التاريخ" span={1}>
                {new Date(foundParentDocument.documentDate).toLocaleDateString("ar-EG")}
              </Descriptions.Item>
              <Descriptions.Item label="الموضوع" span={2}>
                {foundParentDocument.subject}
              </Descriptions.Item>
            </Descriptions>
            
            <Row gutter={16}>
              <Col span={8}>
                <Tag color={foundParentDocument.isUrgent ? "red" : "default"} style={{ marginBottom: 8, padding: '4px 8px' }}>
                  {foundParentDocument.isUrgent ? "عاجل" : "غير عاجل"}
                </Tag>
              </Col>
              <Col span={8}>
                <Tag color={foundParentDocument.isImportant ? "orange" : "default"} style={{ marginBottom: 8, padding: '4px 8px' }}>
                  {foundParentDocument.isImportant ? "مهم" : "غير مهم"}
                </Tag>
              </Col>
              <Col span={8}>
                <Tag color={foundParentDocument.isRequiresReply ? "green" : "default"} style={{ marginBottom: 8, padding: '4px 8px' }}>
                  {foundParentDocument.isRequiresReply ? "يتطلب رد" : "لا يتطلب رد"}
                </Tag>
              </Col>
            </Row>

            {foundParentDocument.ccNames && foundParentDocument.ccNames.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ marginBottom: 8 }}><strong>نسخة منه إلى:</strong></div>
                <div>
                  {foundParentDocument.ccNames.map((name, index) => (
                    <Tag key={index} color="blue" style={{ margin: '0 4px 4px 0' }}>
                      {name}
                    </Tag>
                  ))}
                </div>
              </div>
            )}

            {foundParentDocument.tagNames && foundParentDocument.tagNames.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ marginBottom: 8 }}><strong>الوسوم:</strong></div>
                <div>
                  {foundParentDocument.tagNames.map((name, index) => (
                    <Tag key={index} color="purple" style={{ margin: '0 4px 4px 0' }}>
                      {name}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            لا توجد بيانات متاحة
          </div>
        )}
      </Modal>
    </ConfigProvider>
  );
}

export default AddDocumentPage;