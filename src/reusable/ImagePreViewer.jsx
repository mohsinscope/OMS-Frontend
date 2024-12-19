import React, { useState, useEffect } from "react";
import { Image, Button } from "antd"; // Importing Ant Design components
import { LeftOutlined, RightOutlined, DeleteOutlined } from "@ant-design/icons"; // Icons for controls
import "./styles/imagePreViewer.css";

export default function ImagePreviewer({ uploadedImages, onDeleteImage }) {
  const [currentIndex, setCurrentIndex] = useState(0); // State to track the currently displayed image index

  useEffect(() => {
    // Reset the index if uploaded images change
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

  const handleDelete = () => {
    if (uploadedImages && uploadedImages.length > 0) {
      onDeleteImage(currentIndex); // Call the parent delete function with the current index
      // Adjust the index if it's out of bounds after deletion
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : 0));
    }
  };

  if (!uploadedImages || uploadedImages.length === 0) {
    return <p></p>; // Show a message if no images are available
  }

  return (
    <div className="image-previewer-container">
      <div className="image-display">
        <Image
          width={800}
          height={400}
          src={uploadedImages[currentIndex]}
          alt={`Image ${currentIndex + 1}`}
          className="image-preview-item"
        />
      </div>

      <div className="image-pagination-controls">
        <Button
          icon={<LeftOutlined />}
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="pagination-button previous-button">
          السابق
        </Button>
        <span className="pagination-info">
          {currentIndex + 1} / {uploadedImages.length}
        </span>
        <Button
          icon={<RightOutlined />}
          onClick={handleNext}
          disabled={currentIndex === uploadedImages.length - 1}
          className="pagination-button next-button">
          التالي
        </Button>
      </div>

      <div className="image-delete-button-container">
        <Button
          icon={<DeleteOutlined />}
          onClick={handleDelete}
          danger
          className="delete-button">
          حذف
        </Button>
      </div>
    </div>
  );
}
