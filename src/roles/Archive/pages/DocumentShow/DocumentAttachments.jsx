/* تبويب المرفقات (قراءة فقط - يجلب من MinIO) */
import React from "react";
import MinioImagePreviewer from './../../../../reusable/MinIoImagePreViewer.jsx';
export default function DocumentAttachments({
  documentId,
  defaultWidth  = 600,
  defaultHeight = 450,
}) {
  if (!documentId) return null; // أمان إضافي

  return (
    <div className="document-attachments">
      <MinioImagePreviewer
        entityType="Document"   // ثابت لأن المكوّن خاص بالكتب
        entityId={documentId}
        defaultWidth={defaultWidth}
        defaultHeight={defaultHeight}
      />
    </div>
  );
}
