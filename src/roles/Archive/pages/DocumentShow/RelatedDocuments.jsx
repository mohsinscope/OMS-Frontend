// src/components/archive/RelatedDocuments.jsx
import React from "react";
 import {       Row,
       Col,
       Card,
       Space,
       Tag,
       Tooltip,
       Typography,
       Divider,
       Avatar,
       Empty,
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
  PaperClipOutlined,
} from "@ant-design/icons";
import moment from "moment";

const { Meta, Text, Paragraph } = Typography;

const RelatedDocuments = ({
  childDocuments = [],
  DOCUMENT_TYPES,
  getStatusColor,
  getStatusIcon,
  navigate,
}) => {
  if (!childDocuments.length) {
    return (
      <Empty
        description="لا توجد مستندات مرتبطة"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <Row gutter={[16, 16]}>
      {childDocuments.map((child) => (
        <Col key={child.id} xs={24} sm={24} md={12} lg={8}>
          <Card
            hoverable
            className="document-card"
            actions={[
              <Tooltip title="عرض التفاصيل" key="view">
                <EyeOutlined
                  onClick={() => navigate("/ViewArchivePage", { state: { id: child.id } })}
                />
              </Tooltip>,
              <Tooltip title="إضافة رد" key="reply">
                <MailOutlined
                  onClick={() =>
                    navigate("/AddArchive", { state: { parentDocumentId: child.id } })
                  }
                />
              </Tooltip>,
            ]}
          >
            <Meta
              avatar={
                <Avatar
                  style={{ backgroundColor: getStatusColor(child) }}
                  icon={getStatusIcon(child)}
                />
              }
              title={
                <Space
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <Text strong>{child.title}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    #{child.documentNumber}
                  </Text>
                </Space>
              }
              description={
                <Space direction="vertical" size="small" style={{ width: "100%" }}>
                  <Paragraph ellipsis={{ rows: 2 }}>{child.subject}</Paragraph>

                  <Space wrap size={8}>
                    <Tag
                      color={DOCUMENT_TYPES[child.documentType]?.color || "default"}
                    >
                      {DOCUMENT_TYPES[child.documentType]?.name || "غير معروف"}
                    </Tag>

                    {child.isUrgent   && <Tag color="red"    icon={<ExclamationCircleOutlined />}>عاجل</Tag>}
                    {child.isImportant && <Tag color="orange" icon={<InfoCircleOutlined     />}>مهم</Tag>}
                    {child.isNeeded    && <Tag color="blue"  icon={<ClockCircleOutlined    />}>مطلوب</Tag>}
                    {child.isAudited   && <Tag color="green" icon={<CheckCircleOutlined    />}>مدقق</Tag>}
                  </Space>

                  <Space split={<Divider type="vertical" />} size={0}>
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
                      <Text type="secondary">{child.profileFullName || "—"}</Text>
                    </Space>
                  </Space>
                </Space>
              }
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default RelatedDocuments;
