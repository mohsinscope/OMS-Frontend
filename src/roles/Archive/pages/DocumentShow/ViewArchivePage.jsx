// src/pages/archive/DocumentShow.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
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
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  MailOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import moment from "moment";
import axiosInstance from './../../../../intercepters/axiosInstance.js';
import Url from './../../../../store/url.js';

import useAuthStore from './../../../../store/store.js';
import Lele from './../../../../reusable elements/icons.jsx';
import DocumentDetails from './DocumentDetails.jsx';
import DocumentAttachments from './DocumentAttachments.jsx';
import RelatedDocuments from './RelatedDocuments.jsx';
import DeleteButton from './../../../../reusable elements/buttons/DeleteButton.jsx';
import AuditButton from './../../../../reusable elements/buttons/AuditButton.jsx';
const { Title, Text } = Typography;

/* ثابتـات */
export const DOCUMENT_TYPES = {
  1: { name: "وارد",  color: "blue"  },
  2: { name: "صادر", color: "green" },
};

export const RESPONSE_TYPES = {
  1: { name: "اجابة وارد",   color: "cyan"   },
  2: { name: "تأكيد وارد",   color: "purple" },
  3: { name: "وارد جديد",    color: "red"    },
  4: { name: "اجابة وارد",   color: "blue"   },
  5: { name: "تأكيد صادر",   color: "pink"   },
  6: { name: "صادر جديد",    color: "green"  },
};

const DocumentShow = () => {
  const { isSidebarCollapsed, permissions } = useAuthStore();
  const hasUpdatePermission = permissions.includes("Du");
  const hasDeletePermission = permissions.includes("Dd");

  const location   = useLocation();
  const navigate   = useNavigate();
  const documentId = location.state?.id;

  /* ========== State ========== */
  const [documentData,      setDocumentData]      = useState(null);
  const [images,            setImages]            = useState([]);
  const [loading,           setLoading]           = useState(false);
  const [activeTabKey,      setActiveTabKey]      = useState("details");
  const [editModalVisible,  setEditModalVisible]  = useState(false);

  /* attachment state */
  const [attachmentFile,        setAttachmentFile]   = useState(null);
  const [selectedAttachmentId,  setSelectedAttachmentId] = useState("");
  const [uploadLoading,         setUploadLoading]    = useState(false);
  const [uploadProgress,        setUploadProgress]   = useState(0);

  /* ---------- helpers ---------- */
  const showValue = useCallback((v) => (v || v === 0 ? v : "لا يوجد"), []);
  const getStatusColor = useCallback((d) => {
    if (!d) return "blue";
    if (d.isUrgent)   return "red";
    if (d.isImportant)return "orange";
    if (d.isAudited)  return "green";
    return "blue";
  }, []);
  const getStatusIcon = useCallback((d) => {
    if (!d) return <FileTextOutlined />;
    if (d.isUrgent)   return <ExclamationCircleOutlined />;
    if (d.isImportant)return <InfoCircleOutlined />;
    if (d.isAudited)  return <CheckCircleOutlined />;
    return <FileTextOutlined />;
  }, []);

  /* ---------- API Calls ---------- */
  const fetchDocumentDetails = useCallback(async () => {
    const { data } = await axiosInstance.get(`${Url}/api/Document/${documentId}`);
    setDocumentData(data);
    return data;
  }, [documentId]);

  const fetchImages = useCallback(async () => {
    const { data } = await axiosInstance.get(`${Url}/api/Attachment/Document/${documentId}`);
    setImages(data.map((x) => ({ id: x.id, url: x.filePath })));
  }, [documentId]);

  useEffect(() => {
    if (!documentId) {
      message.error("معرف المستند غير موجود");
      navigate(-1);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        await fetchDocumentDetails();
        await fetchImages();
      } catch {
        message.error("خطأ أثناء تحميل البيانات");
      } finally {
        setLoading(false);
      }
    })();
  }, [documentId, fetchDocumentDetails, fetchImages, navigate]);

  /* ---------- Navigation helpers ---------- */
  const navigateToReply = () =>
    navigate("/AddArchive", { state: { parentDocumentId: documentId } });

  const navigateToParentDocument = () =>
    documentData?.parentDocumentId &&
    navigate("/ViewArchivePage", { state: { id: documentData.parentDocumentId } });

  /* ---------- Attachment handlers ---------- */
  const handleBeforeUpload = (file) => {
    if (file.type === "application/pdf") {
      message.error("لا يمكن تحميل ملفات PDF.");
      return Upload.LIST_IGNORE;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("يجب أن يكون حجم الملف أقل من 5 ميجابايت!");
      return Upload.LIST_IGNORE;
    }
    setAttachmentFile(file);
    return false;
  };

  const uploadOrReplace = async (method /* 'post' | 'put' */) => {
    if (!attachmentFile) return;
    setUploadLoading(true);
    setUploadProgress(0);
    try {
      const fd = new FormData();
      fd.append("entityId", documentId);
      fd.append("entityType", "Document");
      fd.append("file", attachmentFile);

      const url =
        method === "post"
          ? `${Url}/api/attachment`
          : `${Url}/api/attachment/${selectedAttachmentId}`;

      await axiosInstance[method](url, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) =>
          setUploadProgress(Math.round((e.loaded * 100) / e.total)),
      });

      message.success("تم تحديث المرفقات بنجاح");
      setAttachmentFile(null);
      setSelectedAttachmentId("");
      await fetchImages();
    } catch {
      message.error("خطأ في رفع المرفق");
    } finally {
      setUploadLoading(false);
    }
  };

  /* ---------- Tabs ---------- */
  const tabList = [
    { key: "details",         tab: "معلومات المستند" },
    { key: "attachments",     tab: `المرفقات (${images.length})` },
    { key: "childDocuments",  tab: `المستندات المرتبطة (${documentData?.childDocuments?.length || 0})` },
  ];

  const contentMap = {
    details: (
      <DocumentDetails
        documentData={documentData}
        DOCUMENT_TYPES={DOCUMENT_TYPES}
        RESPONSE_TYPES={RESPONSE_TYPES}
        navigateToParentDocument={navigateToParentDocument}
        showValue={showValue}
      />
    ),

    attachments: (
      <DocumentAttachments
        images={images}
        hasUpdatePermission={hasUpdatePermission}
        attachmentFile={attachmentFile}
        selectedAttachmentId={selectedAttachmentId}
        uploadLoading={uploadLoading}
        uploadProgress={uploadProgress}
        /* handlers */
        handleBeforeUpload={handleBeforeUpload}
        handleReplaceImage={() => uploadOrReplace("put")}
        handleAddNewImage={() => uploadOrReplace("post")}
        setAttachmentFile={setAttachmentFile}
        setSelectedAttachmentId={setSelectedAttachmentId}
      />
    ),

    childDocuments: (
      <RelatedDocuments
        childDocuments={documentData?.childDocuments}
        DOCUMENT_TYPES={DOCUMENT_TYPES}
        getStatusColor={getStatusColor}
        getStatusIcon={getStatusIcon}
        navigate={navigate}
      />
    ),
  };

  /* ---------- Render ---------- */
  return (
    <ConfigProvider direction="rtl">
      <div
        className={`document-show-container ${
          isSidebarCollapsed ? "sidebar-collapsed" : ""
        }`}
        style={{ padding: 20 }}
      >
        {loading ? (
          <Skeleton active paragraph={{ rows: 12 }} />
        ) : documentData ? (
          <>
            {/* Header */}
            <div
              className={`header-section-of-avrhcive-page ${
                isSidebarCollapsed ? "header-section-of-avrhcive-page-sidebar-collapsed" : ""
              }`}
            >
              <Space align="center">
                <Avatar
                  size={48}
                  style={{
                    backgroundColor: getStatusColor(documentData),
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  icon={getStatusIcon(documentData)}
                />
                <div>
                  <Title level={3} style={{ margin: 0 }}>
                    {documentData.title}
                  </Title>
                  <Text type="secondary">#{documentData.documentNumber}</Text>
                </div>
              </Space>

              <Space wrap>
                <Button onClick={() => navigate(-1)} icon={<Lele type="back" />}>
                  الرجوع
                </Button>

                {hasDeletePermission && (
                  <DeleteButton
                    documentId={documentId}
                    onDeleteSuccess={() => navigate(-1)}
                    buttonProps={{ danger: true }}
                  />
                )}

                <AuditButton
                  documentId={documentId}
                  onAuditSuccess={() => window.location.reload()}
                />

                {hasUpdatePermission && (
                  <Button
                    type="primary"
                    icon={<Lele type="edit" />}
                    onClick={() => setEditModalVisible(true)}
                  >
                    تعديل
                  </Button>
                )}

                <Button type="default" icon={<MailOutlined />} onClick={navigateToReply}>
                  رد
                </Button>
              </Space>
            </div>

            {/* Tabs */}
            <Card
              style={{ width: "100%", marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
              tabList={tabList}
              activeTabKey={activeTabKey}
              onTabChange={setActiveTabKey}
              tabBarExtraContent={
                activeTabKey === "childDocuments" && (
                  <Button type="link" icon={<PaperClipOutlined />} onClick={navigateToReply}>
                    إضافة مستند مرتبط
                  </Button>
                )
              }
            >
              {contentMap[activeTabKey]}
            </Card>

            {/* --- Modal التعديل (يمكنك إبقاء النموذج القديم أو توليد Form جديد) --- */}
            <Modal
              title="تعديل المستند"
              open={editModalVisible}
              onCancel={() => setEditModalVisible(false)}
              footer={null}
              width={800}
              destroyOnClose
            >
              {/* ضع نموذج التعديل هنا أو استورده كمكوّن منفصل لاحقًا */}
              قيد التطوير...
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
