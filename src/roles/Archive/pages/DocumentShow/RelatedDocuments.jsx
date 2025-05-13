/*  RelatedDocumentsWithAttachments.jsx                                   */
/*  بطاقات الكتب المرتبطة + مرفقاتها – تبويب «سلسلة الكتب»               */

import React from "react";
import {
  Row,
  Col,
  Card,
  Space,
  Tag,
  Typography,
  Divider,
  Empty,
  Button,
} from "antd";
import {
  EyeOutlined,
  MailOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import moment from "moment";
import MinioImagePreviewer from "./../../../../reusable/MinIoImagePreViewer.jsx";

const { Text } = Typography;

/* ─────────── احتياطيّات ألوان/أيقونات الحالة ─────────── */
const fallbackColor = (d) => {
  if (!d) return "blue";
  if (d.isUrgent) return "red";
  if (d.isImportant) return "orange";
  if (d.isAudited) return "green";
  return "blue";
};
const fallbackIcon = (d) => {
  if (!d) return <CalendarOutlined />;
  if (d.isUrgent) return <ExclamationCircleOutlined />;
  if (d.isImportant) return <InfoCircleOutlined />;
  if (d.isAudited) return <CheckCircleOutlined />;
  return <ClockCircleOutlined />;
};

/* ─────────── بطاقة مستند واحدة (تُستعمل بشكل تَكراري) ─────────── */
const DocumentCard = ({
  doc,
  level,
  indentSize,
  DOCUMENT_TYPES,
  colorFn,
  iconFn,
  navigate,
  previewWidth,
  previewHeight,
}) => {
  return (
    <>
      <Card
        hoverable
        className="document-row-card"
        style={{
          marginBottom: 16,
          borderRadius: 8,
          boxShadow: "0 3px 10px rgba(0,0,0,0.12)",
          direction: "rtl",
          /* indent nested cards – shift right in RTL using marginRight */
          marginRight: level * indentSize,
        }}
      >
        <Row  align="middle">
          {/* Attachment Preview */}
          <Col xs={8} sm={8} md={6} lg={5} >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <MinioImagePreviewer
                entityType="Document"
                entityId={doc.id}
                defaultWidth={previewWidth}
                defaultHeight={previewHeight}
              />
            </div>
          </Col>

          {/* Main Content */}
          <Col xs={16} sm={16} md={18} lg={19}>
            <Space direction="vertical" size="small" style={{ width: "100%", marginRight:"50px" }}>
              {/* رقم الكتاب */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Space>
                  <Text type="secondary">
                    <FileTextOutlined /> رقم الكتاب:
                  </Text>
                  <Text
                    style={{
                      padding: "3px 10px",
                      borderRadius: 4,
                      backgroundColor: "#f6ffed",
                      border: "1px solid #b7eb8f",
                    }}
                  >
                    {doc.documentNumber}
                  </Text>
                </Space>
              </div>

              {/* موضوع الكتاب */}
              <div>
                <Text strong style={{ fontSize: 14, color: "#555" }}>
                  موضوع الكتاب:
                </Text>
                <Typography.Paragraph
                  ellipsis={{ rows: 2 }}
                  style={{
                    margin: "4px 0",
                    fontSize: 15,
                    backgroundColor: "#f9f9f9",
                    padding: "6px 10px",
                    borderRadius: 4,
                    width:"90%"
                  }}
                >
                  {doc.title}
                </Typography.Paragraph>
              </div>

              {/* تفاصيل الكتاب */}
              <div>
                <Text strong style={{ fontSize: 14, color: "#555" }}>
                  تفاصيل الكتاب:
                </Text>
                <Typography.Paragraph
                  ellipsis={{ rows: 1 }}
                  style={{
                    margin: "4px 0",
                    fontSize: 15,
                    backgroundColor: "#f9f9f9",
                    padding: "6px 10px",
                    borderRadius: 4,
                    width:"90%"
                  }}
                >
                  {doc.subject || "لا توجد تفاصيل إضافية"}
                </Typography.Paragraph>
              </div>

              {/* الوسوم والحالة */}
              <Space wrap size={8}>
                <Tag
                  color={DOCUMENT_TYPES[doc.documentType]?.color || "default"}
                  style={{ padding: "2px 8px" }}
                >
                  {DOCUMENT_TYPES[doc.documentType]?.name || "غير معروف"}
                </Tag>

                {doc.isUrgent && (
                  <Tag
                    color="red"
                    icon={<ExclamationCircleOutlined />}
                    style={{ padding: "2px 8px" }}
                  >
                    عاجل
                  </Tag>
                )}
                {doc.isImportant && (
                  <Tag
                    color="orange"
                    icon={<InfoCircleOutlined />}
                    style={{ padding: "2px 8px" }}
                  >
                    مهم
                  </Tag>
                )}
                {doc.isNeeded && (
                  <Tag
                    color="blue"
                    icon={<ClockCircleOutlined />}
                    style={{ padding: "2px 8px" }}
                  >
                    يستلزم اجراء
                  </Tag>
                )}
                {doc.isAudited && (
                  <Tag
                    color="green"
                    icon={<CheckCircleOutlined />}
                    style={{ padding: "2px 8px" }}
                  >
                    مدقق
                  </Tag>
                )}
              </Space>

              {/* التاريخ والمنشئ */}
              <Space
                split={<Divider type="vertical" />}
                size={8}
                style={{ marginTop: 4 }}
              >
                <Space size={4}>
                  <CalendarOutlined />
                  <Text type="secondary">
                    {doc.documentDate
                      ? moment(doc.documentDate).format("YYYY-MM-DD")
                      : "—"}
                  </Text>
                </Space>
                <Space size={4}>
                  <UserOutlined />
                  <Text type="secondary">{doc.profileFullName || "—"}</Text>
                </Space>
              </Space>
            </Space>
          </Col>
        </Row>

        {/* أزرار الإجراءات */}
        <div
          style={{
            borderTop: "1px solid #f0f0f0",
            marginTop: 16,
            paddingTop: 12,
            display: "flex",
            width: "100%",
          }}
        >
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="large"
            style={{
              width: "50%",
              height: 46,
              fontWeight: "bold",
              borderRadius: "10px",
              marginLeft: "10px",
            }}
            onClick={() => navigate("/ViewArchivePage", { state: { id: doc.id } })}
          >
            عرض
          </Button>

          <Button
            type="primary"
            icon={<MailOutlined />}
            size="large"
            style={{
              width: "50%",
              backgroundColor: "#fa8c16",
              borderColor: "#fa8c16",
              height: 46,
              fontWeight: "bold",
              borderRadius: "10px",
              marginRight: "10px",
            }}
            onClick={() =>
              navigate("/AddArchive", { state: { parentDocumentId: doc.id } })
            }
          >
            رد
          </Button>
        </div>
      </Card>

      {/* رسم الأبناء (إن وُجدت) */}
      {doc.childDocuments?.length > 0 &&
        doc.childDocuments.map((child) => (
          <DocumentCard
            key={child.id}
            doc={child}
            level={level + 1}
            indentSize={indentSize}
            DOCUMENT_TYPES={DOCUMENT_TYPES}
            colorFn={colorFn}
            iconFn={iconFn}
            navigate={navigate}
            previewWidth={previewWidth}
            previewHeight={previewHeight}
          />
        ))}
    </>
  );
};

/* ─────────── المكوّن الرئيسي ─────────── */
const RelatedDocumentsWithAttachments = ({
  childDocuments = [],
  DOCUMENT_TYPES = {},
  getStatusColor,
  getStatusIcon,
  navigate,
  previewWidth = 180,
  previewHeight = 180,
  /* عرض الإزاحة لكل مستوى تعشيش (بالبكسل) */
  indentSize = 24,
}) => {
  const colorFn = getStatusColor || fallbackColor;
  const iconFn = getStatusIcon || fallbackIcon;

  if (!childDocuments.length) {
    return (
      <Empty
        description="لا توجد مستندات مرتبطة"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div className="related-documents-container">
      {childDocuments.map((doc) => (
        <DocumentCard
          key={doc.id}
          doc={doc}
          level={0}
          indentSize={indentSize}
          DOCUMENT_TYPES={DOCUMENT_TYPES}
          colorFn={colorFn}
          iconFn={iconFn}
          navigate={navigate}
          previewWidth={previewWidth}
          previewHeight={previewHeight}
        />
      ))}
    </div>
  );
};

export default RelatedDocumentsWithAttachments;
