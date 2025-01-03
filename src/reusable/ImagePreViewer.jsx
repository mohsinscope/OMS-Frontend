import React, { useState, useEffect } from "react";
import { Image, Button, Modal, ConfigProvider, Tooltip } from "antd";
import { LeftOutlined, RightOutlined, DeleteOutlined, LinkOutlined } from "@ant-design/icons";
import "./styles/imagePreViewer.css";
import unamed from './../assets/unnamed.png';

export default function ImagePreviewer({
  uploadedImages, // Array of URLs or File objects
  onDeleteImage,
  defaultWidth = 400,
  defaultHeight = 200,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
  }, [uploadedImages]);

  const handleNext = () => {
    if (currentIndex < uploadedImages.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const showDeleteConfirm = () => {
    setIsDeleteConfirmVisible(true);
  };

  const handleDeleteConfirm = () => {
    if (onDeleteImage) {
      onDeleteImage(currentIndex);
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : 0));
    }
    setIsDeleteConfirmVisible(false);
  };

  const handleDeleteCancel = () => {
    setIsDeleteConfirmVisible(false);
  };

  const formatImageUrl = (url) => {
    if (!url) return '';

    // Handle local file objects
    if (url instanceof File) {
      return URL.createObjectURL(url);
    }

    // Handle Base64 or blob URLs
    if (url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }

    // Handle remote database URLs
    return url.match(/^https?:\/\//) ? url : `https://cdn-oms.scopesky.org/${url}`;
  };

  const isPDF = (url) => {
    if (!url) return false;

    // Handle local file object
    if (url instanceof File) {
      return url.type === "application/pdf";
    }

    // Handle Base64 or blob URLs
    if (url.startsWith("data:")) {
      return url.includes("application/pdf");
    }

    // Normalize URL for comparison
    const lowercaseUrl = url.toLowerCase();

    // Check if the file name ends with ".pdf"
    if (lowercaseUrl.endsWith(".pdf")) return true;

    // Handle query parameters in URLs
    const queryIndex = lowercaseUrl.indexOf("?");
    const cleanUrl = queryIndex > -1 ? lowercaseUrl.substring(0, queryIndex) : lowercaseUrl;

    const fileExtension = cleanUrl.split(".").pop();
    return fileExtension === "pdf";
  };

  const handleOpenPDF = () => {
    const url = formatImageUrl(uploadedImages[currentIndex]);
    window.open(url, '_blank');
  };

  if (!uploadedImages?.length) {
    return <p>لا توجد صور للعرض</p>;
  }

  const currentUrl = uploadedImages[currentIndex];
  const isCurrentPDF = isPDF(currentUrl);

  return (
    <div className="image-previewer-container">
   
      <div className="image-display">
        {isCurrentPDF ? (<>
                 <div className="pdf-indicator">
          <Tooltip title="فتح PDF">
            <Button
              type="primary"
              icon={<LinkOutlined />}
              onClick={handleOpenPDF}
              className="open-pdf-button"
            >
              فتح الملف
            </Button>
          </Tooltip>
 
            <Image
          width={defaultWidth}
          height={defaultHeight}
          src={formatImageUrl(currentUrl)}
          alt={`File ${currentIndex + 1}`}
          className="image-preview-item"
          style={{ objectFit: "contain" }}
          fallback={unamed}
        />
              </div> </>
        ) : (<>
                 <div className="pdf-indicator">
          <Tooltip title="فتح PDF">
            <Button
              type="primary"
              icon={<LinkOutlined />}
              onClick={handleOpenPDF}
              className="open-pdf-button"
            >
              فتح الملف
            </Button>
          </Tooltip>
 
            <Image
          width={defaultWidth}
          height={defaultHeight}
          src={formatImageUrl(currentUrl)}
          alt={`File ${currentIndex + 1}`}
          className="image-preview-item"
          style={{ objectFit: "contain" }}
          fallback={unamed}
        />
              </div> </>
        )}
      </div>
      <div className="image-pagination-controls">
        <ConfigProvider direction="rtl">
          <Button
            icon={<RightOutlined />}
            onClick={handleNext}
            disabled={currentIndex === uploadedImages.length - 1}
            className="pagination-button next-button"
          >
            التالي
          </Button>
          <span className="pagination-info">
            {currentIndex + 1} / {uploadedImages.length}
          </span>
          <Button
            icon={<LeftOutlined />}
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="pagination-button previous-button"
          >
            السابق
          </Button>
        </ConfigProvider>
      </div>
      {onDeleteImage && (
        <ConfigProvider direction="rtl">
        <div className="image-delete-button-container">
          <Button
            icon={<DeleteOutlined />}
            onClick={showDeleteConfirm}
            danger
            className="delete-button"
          >
            حذف
          </Button>
        </div></ConfigProvider>
      )}
      <ConfigProvider direction="rtl">
      <Modal
        title="تأكيد الحذف"
        visible={isDeleteConfirmVisible}
        onOk={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        okText="نعم"
        cancelText="لا"
      >
        <p>هل أنت متأكد أنك تريد حذف هذه الصورة؟</p>
      </Modal></ConfigProvider>
    </div>
  );
}
