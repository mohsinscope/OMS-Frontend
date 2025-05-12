// src/reusable/MinioImagePreviewer.jsx
import React, { useState, useEffect } from "react";
import { Spin, Empty, message } from "antd";
import axiosInstance from "../intercepters/axiosInstance.js";
import ImagePreviewer from "./ImagePreViewer.jsx";     // ← مسار المكوّن الحالى

export default function MinioImagePreviewer({
  entityType,           // مثال: "Document"
  entityId,             // مثال: "b458ae94‑f356‑418c‑ba0a‑116a917ecb56"
  defaultWidth = 400,
  defaultHeight = 200,
}) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ─────────── تحميل الروابط ─────────── */
  useEffect(() => {
    if (!entityType || !entityId) return;

    const fetchAttachments = async () => {
      setLoading(true);
      try {
        const { data } = await axiosInstance.get(
          `/api/${entityType}/${entityId}/attachment-urls`
        );
        setAttachments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        message.error("فشل تحميل المرفقات");
      } finally {
        setLoading(false);
      }
    };

    fetchAttachments();
  }, [entityType, entityId]);

  /* ─────────── واجهة المستخدم ─────────── */
  if (loading) return <Spin size="large" />;

  if (!attachments.length) {
    return (
      <Empty
        description="لا توجد مرفقات"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <ImagePreviewer
      uploadedImages={attachments.map((a) => a.url)}
      defaultWidth={defaultWidth}
      defaultHeight={defaultHeight}
      /* لا يوجد حذف هنا لأن التبويب للقراءة فقط
         أضِف onDeleteImage عند الحاجة */
    />
  );
}
