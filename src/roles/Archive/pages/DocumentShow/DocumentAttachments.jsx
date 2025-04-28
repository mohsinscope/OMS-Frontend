// src/components/archive/DocumentAttachments.jsx
import React from "react";
import {
  Upload,
  Button,
  Space,
  Empty,
  Progress,
  Alert,
} from "antd";
import {
  UploadOutlined,
  CloudUploadOutlined,
} from "@ant-design/icons";
import ImagePreviewer from './../../../../reusable/ImagePreViewer.jsx';
const DocumentAttachments = ({
  images,
  hasUpdatePermission,
  attachmentFile,
  selectedAttachmentId,
  uploadLoading,
  uploadProgress,
  /* handlers */
  handleBeforeUpload,
  handleReplaceImage,
  handleAddNewImage,
  setAttachmentFile,
  setSelectedAttachmentId,
}) => (
  <div className="document-attachments">
    {images.length ? (
      <div className="image-preview-container">
        <ImagePreviewer
          uploadedImages={images.map((img) => img.url)}
          defaultWidth={600}
          defaultHeight={450}
          onImageSelect={(idx) => setSelectedAttachmentId(images[idx].id)}
        />

        {hasUpdatePermission && (
          <Space direction="vertical" style={{ marginTop: 16, width: "100%" }}>
            <Space wrap>
              <Upload
                beforeUpload={handleBeforeUpload}
                accept="image/*"
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />}>
                  اختيار صورة {selectedAttachmentId ? "للاستبدال" : "جديدة"}
                </Button>
              </Upload>

              {attachmentFile && (
                <>
                  {selectedAttachmentId ? (
                    <Button
                      type="primary"
                      icon={<CloudUploadOutlined />}
                      loading={uploadLoading}
                      onClick={handleReplaceImage}
                    >
                      استبدال الصورة المحددة
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      icon={<CloudUploadOutlined />}
                      loading={uploadLoading}
                      onClick={handleAddNewImage}
                    >
                      إضافة صورة جديدة
                    </Button>
                  )}
                  <Button
                    disabled={uploadLoading}
                    onClick={() => setAttachmentFile(null)}
                  >
                    إلغاء
                  </Button>
                </>
              )}
            </Space>

            {uploadLoading && (
              <Progress percent={uploadProgress} status="active" />
            )}

            {attachmentFile && (
              <Alert
                type="info"
                showIcon
                message={`الملف المحدد: ${attachmentFile.name} (${(
                  attachmentFile.size / 1024
                ).toFixed(2)} كيلوبايت)`}
              />
            )}

            {selectedAttachmentId && (
              <Alert
                type="warning"
                showIcon
                message="تم تحديد صورة للاستبدال. اختر صورة جديدة ثم اضغط على زر الاستبدال."
              />
            )}
          </Space>
        )}
      </div>
    ) : (
      <Empty
        description="لا توجد مرفقات لهذا المستند"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      >
        {hasUpdatePermission && (
          <Space direction="vertical" style={{ marginTop: 16 }}>
            <Upload
              beforeUpload={handleBeforeUpload}
              accept="image/*"
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} type="primary">
                إضافة صورة جديدة
              </Button>
            </Upload>

            {attachmentFile && (
              <>
                <Button
                  type="primary"
                  loading={uploadLoading}
                  onClick={handleAddNewImage}
                >
                  تأكيد الإضافة
                </Button>
                {uploadLoading && (
                  <Progress percent={uploadProgress} status="active" />
                )}
                <Alert
                  type="info"
                  showIcon
                  message={`الملف المحدد: ${attachmentFile.name} (${(
                    attachmentFile.size / 1024
                  ).toFixed(2)} كيلوبايت)`}
                />
              </>
            )}
          </Space>
        )}
      </Empty>
    )}
  </div>
);

export default DocumentAttachments;
