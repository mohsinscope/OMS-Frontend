/* تبويب المرفقات للقراءة فقط */
import React from "react";
import { Empty } from "antd";
import ImagePreviewer from "../../../../reusable/ImagePreViewer.jsx";

const DocumentAttachments = ({ images }) => (
  <div className="document-attachments">
    {images.length ? (
      <div className="image-preview-container">
        <ImagePreviewer
          uploadedImages={images.map((img) => img.url)}
          defaultWidth={600}
          defaultHeight={450}
          /* لا يوجد تحديد أو استبدال */
        />
      </div>
    ) : (
      <Empty
        description="لا توجد مرفقات لهذا الكتاب"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    )}
  </div>
);

export default DocumentAttachments;
