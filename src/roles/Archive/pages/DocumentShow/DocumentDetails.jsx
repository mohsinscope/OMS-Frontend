// src/components/archive/DocumentDetails.jsx
import React, { useMemo } from "react";
import {
  Space,
  Descriptions,
  Tag,
  Badge,
  Avatar,
  Alert,
  Button,
} from "antd";
import {
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  LinkOutlined,
  UserOutlined,
} from "@ant-design/icons";
import moment from "moment";

const DocumentDetails = ({
  documentData,
  DOCUMENT_TYPES,
  RESPONSE_TYPES,
  navigateToParentDocument,
  showValue,
}) => {
  /* شارات الحالة */
  const statusBadges = useMemo(() => (
    <Space wrap>
      {documentData.isUrgent   && <Tag color="red"    icon={<ExclamationCircleOutlined />}>عاجل</Tag>}
      {documentData.isImportant && <Tag color="orange" icon={<InfoCircleOutlined     />}>مهم</Tag>}
      {documentData.isNeeded    && <Tag color="blue"  icon={<ClockCircleOutlined    />}>مطلوب</Tag>}
      {documentData.isAudited   && <Tag color="green" icon={<CheckCircleOutlined    />}>مدقق</Tag>}
    </Space>
  ), [documentData]);

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <div style={{ display: "flex", marginBottom: 16 }}>
        <Badge
          status={
            documentData.isUrgent   ? "error"   :
            documentData.isImportant? "warning" :
            documentData.isAudited ? "success"  : "default"
          }
        />
        {statusBadges}
      </div>

      <Descriptions
        bordered
        column={{ xxl: 3, xl: 3, lg: 3, md: 3, sm: 2, xs: 1 }}
        size="small"
      >
        <Descriptions.Item label="رقم المستند">
          {showValue(documentData.documentNumber)}
        </Descriptions.Item>

        <Descriptions.Item label="نوع المستند">
          <Tag color={DOCUMENT_TYPES[documentData.documentType]?.color || "default"}>
            {DOCUMENT_TYPES[documentData.documentType]?.name || "غير معروف"}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="نوع الرد">
          <Tag color={RESPONSE_TYPES[documentData.responseType]?.color || "default"}>
            {RESPONSE_TYPES[documentData.responseType]?.name || "غير معروف"}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="الموضوع" span={3}>
          {showValue(documentData.subject)}
        </Descriptions.Item>

        <Descriptions.Item label="الوزارة" span={3}>
          {showValue(documentData.ministryName)}
        </Descriptions.Item>

        <Descriptions.Item label="الجهة" span={2}>
          {showValue(documentData.partyName)}
          {documentData.partyIsOfficial && (
            <Tag color="blue" style={{ marginRight: 8 }}>جهة رسمية</Tag>
          )}
        </Descriptions.Item>

        <Descriptions.Item label="يتطلب رد">
          {documentData.isRequiresReply
            ? <Badge status="processing" text="نعم" />
            : <Badge status="default"    text="لا"  />
          }
        </Descriptions.Item>

        <Descriptions.Item label="تم الرد">
          {documentData.isReplied
            ? <Badge status="success" text="نعم" />
            : <Badge status="default" text="لا"   />
          }
        </Descriptions.Item>

        <Descriptions.Item label="مدقق">
          {documentData.isAudited
            ? <Badge status="success" text="نعم" />
            : <Badge status="default" text="لا"   />
          }
        </Descriptions.Item>

        <Descriptions.Item label="تاريخ المستند">
          <ClockCircleOutlined style={{ marginLeft: 4 }} />
          {documentData.documentDate
            ? moment(documentData.documentDate).format("YYYY-MM-DD")
            : "لا يوجد"}
        </Descriptions.Item>

        <Descriptions.Item label="تاريخ الإنشاء" span={2}>
          <ClockCircleOutlined style={{ marginLeft: 4 }} />
          {documentData.dateCreated
            ? moment(documentData.dateCreated).format("YYYY-MM-DD HH:mm")
            : "لا يوجد"}
        </Descriptions.Item>

        <Descriptions.Item label="المستخدم" span={3}>
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            {showValue(documentData.profileFullName)}
          </Space>
        </Descriptions.Item>

        {documentData.notes && (
          <Descriptions.Item label="ملاحظات" span={3}>
            {documentData.notes}
          </Descriptions.Item>
        )}
      </Descriptions>

      {documentData.parentDocumentId && (
        <Alert
          type="info"
          showIcon
          icon={<LinkOutlined />}
          style={{ marginTop: 16 }}
          message={
            <>
              هذا المستند مرتبط بمستند آخر.&nbsp;
              <Button type="link" onClick={navigateToParentDocument}>
                عرض المستند الأصلي
              </Button>
            </>
          }
        />
      )}
    </Space>
  );
};

export default DocumentDetails;
