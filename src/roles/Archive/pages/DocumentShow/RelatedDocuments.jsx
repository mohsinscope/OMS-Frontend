/*  RelatedDocumentsWithAttachments.jsx                         */
/*  بطاقات الكتب المرتبطة + مرفقاتها – تبويب «سلسلة الكتب»       */

import React from "react";
import {
  Row,
  Col,
  Card,
  Space,
  Tag,
  Tooltip,
  Typography,
  Divider,
  Avatar,
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
  FileSearchOutlined,
} from "@ant-design/icons";
import moment from "moment";
import MinioImagePreviewer from "./../../../../reusable/MinIoImagePreViewer.jsx";

const { Text, Title } = Typography;

/* ─────────── احتياطيّات ألوان/أيقونات الحالة ─────────── */
const fallbackColor = (d) => {
  if (!d)                return "blue";
  if (d.isUrgent)        return "red";
  if (d.isImportant)     return "orange";
  if (d.isAudited)       return "green";
  return "blue";
};

const fallbackIcon = (d) => {
  if (!d)                return <CalendarOutlined />;
  if (d.isUrgent)        return <ExclamationCircleOutlined />;
  if (d.isImportant)     return <InfoCircleOutlined />;
  if (d.isAudited)       return <CheckCircleOutlined />;
  return <ClockCircleOutlined />;
};

/* ─────────── المكوّن الرئيسي ─────────── */
const RelatedDocumentsWithAttachments = ({
  childDocuments = [],
  DOCUMENT_TYPES = {},
  getStatusColor,
  getStatusIcon,
  navigate,
  /* أبعاد افتراضيّة لمعاينة الصورة */
  previewWidth  = 180,
  previewHeight = 180,
}) => {
  const colorFn = getStatusColor || fallbackColor;
  const iconFn  = getStatusIcon  || fallbackIcon;

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
      {childDocuments.map((child) => (
        <Card 
          key={child.id}
          hoverable
          className="document-row-card"
          style={{ 
            marginBottom: 16, 
            borderRadius: 8,
            boxShadow: "0 3px 10px rgba(0,0,0,0.12)",
            direction: "rtl" // RTL direction for Arabic
          }}
        >
          <Row gutter={24} align="middle">
            {/* Attachment Preview Column (on LEFT in RTL) */}
            <Col xs={8} sm={8} md={6} lg={5}>
              <div style={{ 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center",
                height: "100%"
              }}>
                <MinioImagePreviewer
                  entityType="Document"
                  entityId={child.id}
                  defaultWidth={previewWidth}
                  defaultHeight={previewHeight}
                />
              </div>
            </Col>
            
            {/* Main Content Column (on RIGHT in RTL) */}
            <Col xs={16} sm={16} md={18} lg={19}>
              <Space direction="vertical" size="small" style={{ width: "100%" }}>
                {/* Title and Document Number Row */}
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center"
                }}>
                  <Space>
                    <Text type="secondary">
                      <FileTextOutlined /> رقم الكتاب:
                    </Text>
                    <Text  style={{ 
                      padding: "3px 10px", 
                      borderRadius: 4,
                      backgroundColor: "#f6ffed",
                      border: "1px solid #b7eb8f"
                    }}>
                      #{child.documentNumber}
                    </Text>
                  </Space>
                </div>
                
                {/* Document Subject (renamed from the example) */}
                <div>
                  <Text strong style={{ fontSize: 14, color: "#555" }}>موضوع الكتاب:</Text>
                  <Typography.Paragraph 
                    ellipsis={{ rows: 2 }}
                    style={{ 
                      margin: "4px 0", 
                      fontSize: 15,
                      backgroundColor: "#f9f9f9",
                      padding: "6px 10px",
                      borderRadius: 4
                    }}
                  >
                    {child.title}
                  </Typography.Paragraph>
                </div>

                {/* Document Details (renamed from رأجين ارسال نسخة) */}
                <div>
                  <Text strong style={{ fontSize: 14, color: "#555" }}>تفاصيل الكتاب:</Text>
                  <Typography.Paragraph 
                    ellipsis={{ rows: 1 }}
                      style={{ 
                      margin: "4px 0", 
                      fontSize: 15,
                      backgroundColor: "#f9f9f9",
                      padding: "6px 10px",
                      borderRadius: 4
                    }}
                  >
                    {child.subject || "لا توجد تفاصيل إضافية"}
                  </Typography.Paragraph>
                </div>

                {/* Document Tags */}
                <Space wrap size={8}>
                  <Tag
                    color={DOCUMENT_TYPES[child.documentType]?.color || "default"}
                    style={{ padding: "2px 8px" }}
                  >
                    {DOCUMENT_TYPES[child.documentType]?.name || "غير معروف"}
                  </Tag>

                  {child.isUrgent && (
                    <Tag color="red" icon={<ExclamationCircleOutlined />} style={{ padding: "2px 8px" }}>
                      عاجل
                    </Tag>
                  )}
                  {child.isImportant && (
                    <Tag color="orange" icon={<InfoCircleOutlined />} style={{ padding: "2px 8px" }}>
                      مهم
                    </Tag>
                  )}
                  {child.isNeeded && (
                    <Tag color="blue" icon={<ClockCircleOutlined />} style={{ padding: "2px 8px" }}>
                      مطلوب
                    </Tag>
                  )}
                  {child.isAudited && (
                    <Tag color="green" icon={<CheckCircleOutlined />} style={{ padding: "2px 8px" }}>
                      مدقق
                    </Tag>
                  )}
                </Space>

                {/* Date and Creator */}
                <Space split={<Divider type="vertical" />} size={8} style={{ marginTop: 4 }}>
                  <Space size={4}>
                    <CalendarOutlined />
                    <Text type="secondary">
                      {child.documentDate
                        ? moment(child.documentDate).format("YYYY-MM-DD")
                        : "—"}
                    </Text>
                  </Space>
                  <Space size={4}>
                    <UserOutlined />
                    <Text type="secondary">
                      {child.profileFullName || "—"}
                    </Text>
                  </Space>
                </Space>
              </Space>
            </Col>
          </Row>
          
          {/* Action Buttons - Each takes 50% of width */}
          <div 
            style={{ 
              borderTop: "1px solid #f0f0f0", 
              marginTop: 16, 
              paddingTop: 12,
              display: "flex",
              width: "100%"
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
                borderRadius:"10px",
                marginLeft:"10px"
              }}
              onClick={() => navigate("/ViewArchivePage", { state: { id: child.id } })}
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
                 borderRadius:"10px",
                marginRight:"10px"
              }}
              onClick={() => navigate("/AddArchive", { state: { parentDocumentId: child.id } })}
            >
              رد
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default RelatedDocumentsWithAttachments;