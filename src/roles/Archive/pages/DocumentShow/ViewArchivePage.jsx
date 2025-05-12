/*  عرض مستند + تعديل + حذف + مرفقات  */
import { useState, useEffect, useCallback } from "react";
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
} from "antd";
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  MailOutlined,
  DeleteOutlined,
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
  const { isSidebarCollapsed, permissions, profile } = useAuthStore();
  const currentProfileId = profile?.profileId;
  const isSuperAdmin     =
    permissions.includes("SuperAdmin") || profile?.role === "SuperAdmin";

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

  /* ───── نافذة التعديل ───── */
  const [editModalVisible, setEditModalVisible] = useState(false);

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
    const { data } = await axiosInstance.get(`${Url}/api/Document/${documentId}`);
    setDocumentData(data);
  };

  // استبدلنا مسار MinIO الجديد ليعيد روابط موقّعة *** CHANGED ***
  const fetchImages = async () => {
    const { data } = await axiosInstance.get(
      `${Url}/api/Document/${documentId}/attachment-urls`
    );
    setImages(data); // data = [{id,url}, …]
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
    { key: "attachments",    tab: `المرفقات (${images.length})` }, // *** CHANGED ***
    {
      key: "childDocuments",
      tab: `سلسلة الكتب (${documentData?.childDocuments?.length || 0})`,
    },
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

                {hasAuditPermission && (
                  <AuditButton
                    documentId={documentId}
                    onAuditSuccess={fetchDetails}
                  />
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

              {/* ‼️ استبدلنا الاستدعاء ليأخذ معرّف الكتاب فقط ‼️ */    /* CHANGED */}
              {activeTabKey === "attachments" && (
                <DocumentAttachments documentId={documentId} />
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
      </div>
    </ConfigProvider>
  );
};

export default DocumentShow;
