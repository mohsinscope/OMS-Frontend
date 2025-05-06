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
  Typography,
  Tooltip,
} from "antd";
import {
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  LinkOutlined,
  UserOutlined,
  CopyOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import moment            from "moment";
import { useNavigate }    from "react-router-dom";

const { Text } = Typography;
const tagStyle   = { margin: "0 4px 4px 0" };
const badgeStyle = { backgroundColor: "#1890ff", fontSize: 12, marginRight: 4 };

const TagGroup = ({ items, color, icon, emptyText }) =>
  !items?.length ? (
    <Text type="secondary">{emptyText || "لا يوجد"}</Text>
  ) : (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {items.map((x, i) => (
        <Tooltip key={i} >
          <Tag color={color} icon={icon} style={tagStyle}>
            {x.name || x}
          </Tag>
        </Tooltip>
      ))}
    </div>
  );

const DocumentDetails = ({
  documentData,
  DOCUMENT_TYPES,
  RESPONSE_TYPES,
  showValue,
}) => {
  const navigate = useNavigate();

  /* شارات الحالة */
  const statusBadges = useMemo(
    () => (
      <Space wrap>
        {documentData.isUrgent   && <Tag color="red"    icon={<ExclamationCircleOutlined />}>عاجل</Tag>}
        {documentData.isImportant&& <Tag color="orange" icon={<InfoCircleOutlined />}       >مهم</Tag>}
        {documentData.isNeeded   && <Tag color="blue"   icon={<ClockCircleOutlined />}      >مطلوب</Tag>}
        {documentData.isAudited  && <Tag color="green"  icon={<CheckCircleOutlined />}      >مدقق</Tag>}
      </Space>
    ),
    [documentData],
  );

  /* CC و Tags */
  const ccRecipients = useMemo(() => (
    documentData.ccIds?.map((id, i) => ({ id, name: documentData.ccNames[i] })) || []
  ), [documentData.ccIds, documentData.ccNames]);

  const documentTags = useMemo(() => (
    documentData.tagIds?.map((id, i) => ({ id, name: documentData.tagNames[i] })) || []
  ), [documentData.tagIds, documentData.tagNames]);

  /* الانتقال للمستند الأصلي */
  const goToParent = () =>
    navigate("/ViewArchivePage", { state: { id: documentData.parentDocumentId } });

  /* ─── JSX ─── */
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <div style={{ display: "flex", marginBottom: 16 }}>
        <Badge status={
          documentData.isUrgent   ? "error"   :
          documentData.isImportant? "warning" :
          documentData.isAudited  ? "success" : "default"}
        />
        {statusBadges}
      </div>

      <Descriptions bordered column={{ xxl:3,xl:3,lg:3,md:3,sm:2,xs:1 }} size="small">
        {/* بيانات أساسية */}
        <Descriptions.Item label="رقم الكتاب">{showValue(documentData.documentNumber)}</Descriptions.Item>
        <Descriptions.Item label="نوع الكتاب">
          <Tag color={DOCUMENT_TYPES[documentData.documentType]?.color}>
            {DOCUMENT_TYPES[documentData.documentType]?.name || "غير معروف"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="نوع الرد">
          <Tag color={RESPONSE_TYPES[documentData.responseType]?.color}>
            {RESPONSE_TYPES[documentData.responseType]?.name || "غير معروف"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="الموضوع" span={3}>{showValue(documentData.subject)}</Descriptions.Item>

        {/* وزارة / جهة */}
        <Descriptions.Item label="الوزارة">{showValue(documentData.ministryName)}</Descriptions.Item>
        <Descriptions.Item label="الجهة" span={2}>
          <Space>
            {showValue(documentData.partyName)}
            {documentData.partyIsOfficial && <Tag color="blue">جهة رسمية</Tag>}
          </Space>
        </Descriptions.Item>

        {/* أعلام */}
        <Descriptions.Item label="يتطلب رد">
          {documentData.isRequiresReply? <Badge status="processing" text="نعم"/>:<Badge status="default" text="لا"/>}
        </Descriptions.Item>
        <Descriptions.Item label="تم الرد">
          {documentData.isReplied? <Badge status="success" text="نعم"/>:<Badge status="default" text="لا"/>}
        </Descriptions.Item>
        <Descriptions.Item label="مدقق">
          {documentData.isAudited? <Badge status="success" text="نعم"/>:<Badge status="default" text="لا"/>}
        </Descriptions.Item>

        {/* تواريخ */}
        <Descriptions.Item label="تاريخ الكتاب">
          <ClockCircleOutlined style={{ marginLeft:4 }}/>
          {documentData.documentDate? moment(documentData.documentDate).format("YYYY-MM-DD"):"لا يوجد"}
        </Descriptions.Item>
        <Descriptions.Item label="تاريخ الإنشاء">
          <ClockCircleOutlined style={{ marginLeft:4 }}/>
          {documentData.dateCreated? moment(documentData.dateCreated).format("YYYY-MM-DD HH:mm"):"لا يوجد"}
        </Descriptions.Item>

        {/* المستخدم */}
        <Descriptions.Item label="المستخدم">
          <Space><Avatar size="small" icon={<UserOutlined/>}/>{showValue(documentData.profileFullName)}</Space>
        </Descriptions.Item>

        {/* نسخة إلى */}
        <Descriptions.Item
          label={<div style={{display:"flex",alignItems:"center"}}><CopyOutlined/><span style={{marginLeft:5}}>نسخة إلى</span></div>}
          span={3}
        >
          <TagGroup items={ccRecipients} color="cyan" icon={<CopyOutlined/>} emptyText="لا توجد نسخ"/>
        </Descriptions.Item>

        {/* الوسوم */}
        <Descriptions.Item
          label={<div style={{display:"flex",alignItems:"center"}}><TagsOutlined/><span style={{marginLeft:5}}>الوسوم</span></div>}
          span={3}
        >
          <TagGroup items={documentTags} color="purple" icon={<TagsOutlined/>} emptyText="لا توجد وسوم"/>
        </Descriptions.Item>

        {documentData.notes && <Descriptions.Item label="ملاحظات" span={3}>{documentData.notes}</Descriptions.Item>}
      </Descriptions>

      {/* تنبيه الكتاب الأصلي */}
      {documentData.parentDocumentId && (
        <Alert
          type="info"
          showIcon
          icon={<LinkOutlined/>}
          style={{marginTop:16}}
          message={<><span>هذا الكتاب مرتبط بكتاب آخر.&nbsp;</span><Button type="link" onClick={goToParent}>عرض الكتاب الأصلي</Button></>}
        />
      )}
    </Space>
  );
};

export default DocumentDetails;
