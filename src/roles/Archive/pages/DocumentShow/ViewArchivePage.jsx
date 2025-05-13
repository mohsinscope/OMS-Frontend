/*  عرض مستند + تعديل + حذف + مرفقات  */
import { useState, useEffect, useCallback, useMemo  } from "react";
import {
  Skeleton,
  message,
  Modal,
  Button,
  ConfigProvider,
  Space,
  Avatar,
  Card,
  Typography,
  Progress,
  Select, 
} from "antd";
import {
  FileTextOutlined,
    CheckCircleOutlined,    // for the audit button
  CloseCircleOutlined,    // for the unaudit button,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  MailOutlined,
  DeleteOutlined,
  TagOutlined, 
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";

import axiosInstance from "../../../../intercepters/axiosInstance";
import Url           from "../../../../store/url";
import "./../../styles/viewArchiveStyle.css";

import useAuthStore  from "../../../../store/store";
import Lele          from "../../../../reusable elements/icons";
import DocumentDetails     from "./DocumentDetails";
import DocumentAttachments from "./DocumentAttachments";   // ← لا تغيّر المسار
import RelatedDocuments    from "./RelatedDocuments";
import AuditButton         from "../../../../reusable elements/buttons/AuditButton";
import EditDocumentForm    from "./actions/EditDocumentForm.jsx";
import DocumentHistory     from "./DocumentActionsHistory.jsx";

const { Title, Text } = Typography;

/* ثوابت مبسّطة */
export const DOCUMENT_TYPES = {
  1: { name: "وارد",  color: "blue"  },
  2: { name: "صادر",  color: "green" },
};
export const RESPONSE_TYPES = {
  1: { name: "اجابة وارد"  },
  2: { name: "تأكيد وارد"  },
  3: { name: "وارد جديد"   },
  4: { name: "اجابة صادر"  },
  5: { name: "تأكيد صادر"  },
  6: { name: "صادر جديد"   },
};

/* helper لعرض "لا يوجد" */
const showValue = (v) => (v || v === 0 ? v : "لم يتم التحديد");

const DocumentShow = () => {
  /* ───── معلومات المستخدم من الـ store ───── */
  const { isSidebarCollapsed, permissions, profile ,roles } = useAuthStore();
  const currentProfileId = profile?.profileId;
  const isManager = roles.includes("manager");
 

  const hasDeletePermission = permissions.includes("DOCd");   // صلاحية الحذف
  const hasUpdatePermission = permissions.includes("DOCu");   // صلاحية التعديل
  const hasAuditPermission  = permissions.includes("DOCAudit");

  /* ───── React‑router ───── */
  const { state } = useLocation();
  const navigate  = useNavigate();
  const documentId = state?.id;

  /* ───── حالة الصفحة ───── */
  const [documentData, setDocumentData] = useState(null);

  // احتفظنا بالمصفوفة فقط لحساب العدد وللحصول على المرفق الرئيسى عند التعديل
  const [images, setImages] = useState([]);                    // *** CHANGED ***
  const [loading,      setLoading]      = useState(false);
  const [activeTabKey, setActiveTabKey] = useState("details");

  const [tagModalVisible, setTagModalVisible] = useState(false);
  const [tags, setTags] = useState([]);                  // all available tags
  const [selectedTagIds, setSelectedTagIds] = useState([]); // what user picks

  /* ───── نافذة التعديل ───── */
  const [editModalVisible, setEditModalVisible] = useState(false);


  useEffect(() => {
  setActiveTabKey("details");
}, [documentId]);
  /* ───── helpers للألوان/الأيقونات ───── */
  const statusColor = useCallback(
    (d) =>
      !d
        ? "blue"
        : d.isUrgent
        ? "red"
        : d.isImportant
        ? "orange"
        : d.isAudited
        ? "green"
        : "blue",
    []
  );
  const statusIcon = useCallback(
    (d) =>
      !d ? (
        <FileTextOutlined />
      ) : d.isUrgent ? (
        <ExclamationCircleOutlined />
      ) : d.isImportant ? (
        <InfoCircleOutlined />
      ) : d.isAudited ? (
        <CheckCircleOutlined />
      ) : (
        <FileTextOutlined />
      ),
    []
  );

  /* ───── API calls ───── */
const fetchDetails = async () => {
  
 const { data: { data: doc } } =
   await axiosInstance.get(`${Url}/api/Document/${documentId}?depth=1000`);
  setDocumentData(doc);
};

  console.log(documentData)

  // استبدلنا مسار MinIO الجديد ليعيد روابط موقّعة *** CHANGED ***
  const fetchImages = async () => {
    const { data } = await axiosInstance.get(
      `${Url}/api/Document/${documentId}/attachment-urls`
    );
    setImages(data); // data = [{id,url}, …]
  };
const totalDescendants = useMemo(() => {
  const countDeep = (docs = []) =>
    docs.reduce(
      (sum, d) => sum + 1 + countDeep(d.childDocuments || []),
      0
    );
  return countDeep(documentData?.childDocuments || []);
}, [documentData]);
  // ── load all tags from server ──
const fetchTags = async () => {
  const { data } = await axiosInstance.get(`${Url}/api/Tags`);
  setTags(data);
};
const handleUnaudit = () =>
  Modal.confirm({
    title: "تأكيد إلغاء التدقيق",
    content: "هل تريد إلغاء تدقيق هذا الكتاب؟",
    okText: "نعم",
    cancelText: "إلغاء",
    
    // Force RTL for modal content
    modalRender: (modal) => <div dir="rtl">{modal}</div>,
    
    // Add this to position buttons on the right
    okButtonProps: { style: { float: 'right', marginLeft: 8 } },
    cancelButtonProps: { style: { float: 'right' } },
    
    onOk: async () => {
      try {
        await axiosInstance.post(
          `${Url}/api/Document/${documentId}/unaudit`,
          { profileId: currentProfileId }
        );
        message.success("تم إلغاء التدقيق");
        await fetchDetails();
      } catch (e) {
        message.error(e.response?.data?.message || "فشل إلغاء التدقيق");
      }
    },
  });

  // ── send selected tag IDs to the backend ──
const handleAddTags = async () => {
  // 1) build form data
  const payload = new FormData();
  selectedTagIds.forEach(id => payload.append("TagIds", id));
  payload.append("profileId", currentProfileId);      // ← add this line
  payload.append("DocumentId", documentId);  


  // 2) PATCH as form-data
  await axiosInstance.put(
    `${Url}/api/Document/${documentId}`,
    payload,
    {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );
 
  message.success("تم إضافة الوسوم");
  await fetchDetails();
  setTagModalVisible(false);
};
  /* ───── تحميل مبدئى ───── */
  useEffect(() => {
    if (!documentId) {
      message.error("معرّف الكتاب غير متوفر");
      navigate(-1);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        await Promise.all([fetchDetails(), fetchImages()]);
      } catch {
        message.error("فشل تحميل البيانات");
      } finally {
        setLoading(false);
      }
    })();
  }, [documentId, navigate]);

  /* ───── حذف الكتاب ───── */
  const handleDelete = () =>
    Modal.confirm({
      title  : "تأكيد الحذف",
      content: "هل تريد حذف هذا الكتاب نهائيًا؟",
      okType : "danger",
      okText : "حذف",
      cancelText: "إلغاء",
      onOk: async () => {
        try {
          await axiosInstance.delete(`${Url}/api/Document/${documentId}`);
          message.success("تم الحذف");
          navigate(-1);
        } catch (e) {
          message.error(e.response?.data?.message || "فشل الحذف");
        }
      },
    });

  /* ───── Tabs ───── */
 const tabList = [
  { key: "details",        tab: "معلومات الكتاب" },
  { key: "attachments",    tab: `المرفقات (${images.length})` },
  { key: "childDocuments", tab: `سلسلة الكتب (${totalDescendants})` },
   { key: "history",        tab: "سجلّ الإجراءات" },
 ];

  /* رابط المرفق الرئيسى (إن وُجد) لتمريره إلى نموذج التعديل */
  const currentImageUrl =
    images.find((x) => x.id === documentData?.mainAttachmentId)?.url ||
    images[0]?.url ||
    "";

  /* ───── الواجهة ───── */
  return (
    <ConfigProvider direction="rtl">
      <div
        id="document-show-page"
        className={`header-section-of-avrhcive-page ${
          isSidebarCollapsed
            ? "header-section-of-avrhcive-page-sidebar-collapsed"
            : ""
        }`}
      >
        {loading ? (
          <Skeleton active paragraph={{ rows: 12 }} />
        ) : documentData ? (
          <>
            {/* ───────── Header ───────── */}
            <div dir="rtl">
              <Space align="center">
                <Avatar
                  size={48}
                  style={{ backgroundColor: statusColor(documentData) }}
                  icon={statusIcon(documentData)}
                />
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    {documentData.title}
                  </Title>
                  <Text type="secondary">#{documentData.documentNumber}</Text>
                </div>
              </Space>

              <Space wrap style={{ marginTop: 12, marginRight: 15 }}>
                <Button onClick={() => navigate(-1)} icon={<Lele type="back" />}>
                  الرجوع
                </Button>

                {hasDeletePermission && (
                  <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                    حذف
                  </Button>
                )}


  {/* ← if NOT audited: show audit button */}
  {!documentData.isAudited && hasAuditPermission && (
          <AuditButton
                
                  documentId={documentId}
                  profileId={currentProfileId}       // ← new
                  onAuditSuccess={fetchDetails}
                  />
  )}

  {/* ← if audited: show unaudit button */}
  {documentData.isAudited && isManager && (
    <Button
      type="default"
      icon={<CloseCircleOutlined />}
      onClick={handleUnaudit}
    >
      إلغاء تدقيق
    </Button>
  )}

                {hasUpdatePermission && (
                  <Button
                    type="default"
                    icon={<Lele type="edit" />}
                    onClick={() => setEditModalVisible(true)}
                  >
                    تعديل
                  </Button>
                )}

                <Button
                  type="dashed"
                  icon={<MailOutlined />}
                  onClick={() =>
                    navigate("/AddArchive", { state: { parentDocumentId: documentId } })
                  }
                >
                  رد
                </Button>
                    <Button
                      icon={<TagOutlined />}
                      onClick={() => {
                        fetchTags();             // load the tag list
                        setTagModalVisible(true);// open the modal
                      }}
                    >
                      اضافة وسوم
                    </Button>


              </Space>
            </div>

            {/* ───────── Tabs ───────── */}
            <Card
              className="doc-show-table"
              style={{ width: "100%", marginTop: 24 }}
              tabList={tabList}
              activeTabKey={activeTabKey}
              onTabChange={setActiveTabKey}
            >
              {activeTabKey === "details" && (
                <DocumentDetails
                  documentData={documentData}
                  DOCUMENT_TYPES={DOCUMENT_TYPES}
                  RESPONSE_TYPES={RESPONSE_TYPES}
                  showValue={showValue}
                />
              )}

           

              {activeTabKey === "childDocuments" && (
                <RelatedDocuments
                  childDocuments={documentData.childDocuments}
                  DOCUMENT_TYPES={DOCUMENT_TYPES}
                  navigate={navigate}
                />
              )}

              {activeTabKey === "history" && (
                <DocumentHistory documentId={documentId} />
              )}
                {activeTabKey === "attachments" && (
                  <DocumentAttachments
                    documentId={documentId}
                    defaultWidth={600}
                    defaultHeight={450}
                  />
                )}
            </Card>

            {/* ───────── Edit Modal ───────── */}
            <Modal
              title="تعديل الكتاب"
              open={editModalVisible}
              onCancel={() => setEditModalVisible(false)}
              footer={null}
              width={900}
              destroyOnClose
              centered
              style={{ marginTop: "100px" }}
            >
              <EditDocumentForm
                initialData={documentData}
                initialImageUrl={currentImageUrl}
                onClose={() => setEditModalVisible(false)}
                onUpdateSuccess={async () => {
                  await fetchDetails();
                  await fetchImages();  // لتحديث عدد المرفقات أيضًا
                  setEditModalVisible(false);
                  message.success("تم التحديث بنجاح");
                }}
              />
            </Modal>
            
          </>
        ) : (
          <Progress type="circle" status="exception" percent={0} />
        )}
        <Modal
  title="اضافة وسوم"
  open={tagModalVisible}
  onCancel={() => setTagModalVisible(false)}
  onOk={handleAddTags}
  destroyOnClose
>
  <Select
    mode="multiple"
    placeholder="اختر الوسوم"
    value={selectedTagIds}
    onChange={setSelectedTagIds}
    style={{ width: "100%" }}
  >
    {tags.map(tag => (
      <Select.Option key={tag.id} value={tag.id}>
        {tag.name}
      </Select.Option>
    ))}
  </Select>
</Modal>

      </div>
    </ConfigProvider>
  );
};

export default DocumentShow;
