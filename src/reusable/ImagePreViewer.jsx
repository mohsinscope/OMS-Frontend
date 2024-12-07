import React, { useState } from "react";
import { Image, Button, Upload } from "antd"; // Importing Ant Design components
import { LeftOutlined, RightOutlined, UploadOutlined } from "@ant-design/icons"; // Icons for controls
import './styles/imagePreViewer.css';

export default function ImagePreviewer() {
  const [uploadedImages, setUploadedImages] = useState([]); // State to store uploaded image URLs
  const [currentIndex, setCurrentIndex] = useState(0); // State to track the currently displayed image index

  // Function to handle image uploads
  const handleImageUpload = ({ file }) => {
    const reader = new FileReader(); // Create a new FileReader to read the file
    reader.onload = (e) => {
      // Once the file is read, update the uploaded images state
      setUploadedImages((prev) => [...prev, e.target.result]);
    };
    reader.readAsDataURL(file); // Read the uploaded file as a data URL
  };

  // Function to go to the next image
  const handleNext = () => {
    if (currentIndex < uploadedImages.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Function to go to the previous image
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Function to delete the current image
  const handleDelete = () => {
    setUploadedImages((prev) =>
      prev.filter((_, index) => index !== currentIndex)
    );

    // Adjust the current index after deletion
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else if (currentIndex === 0 && uploadedImages.length === 1) {
      setCurrentIndex(0); // Reset to 0 if there are no images left
    }
  };

  return (
    <div className="image-previewer-container">
      {/* Label Section */}
      <label className="upload-label">اختر المرفقات</label> {/* Label for image uploader */}

      {/* Upload Section */}
      <div className="upload-section">
        <Upload
          accept="image/*" // Accept only image files
          customRequest={handleImageUpload} // Handle file upload manually
          showUploadList={false} // Hide the default upload list from Ant Design
        >
          <Button icon={<UploadOutlined />} className="upload-button">
            رفع الصور {/* Upload button label */}
          </Button>
        </Upload>
      </div>

      {/* Display Uploaded Image */}
      {uploadedImages.length > 0 && (
        <>
          <div className="image-display">
            <Image
              width={300} // Set the image width
              height={300} // Set the image height
              src={uploadedImages[currentIndex]} // Display the current image
              alt={`Image ${currentIndex + 1}`} // Alt text for accessibility
              className="image-preview-item" // Class for styling
            />
          </div>

          {/* Pagination Controls */}
          <div className="image-pagination-controls">
            <Button
              icon={<LeftOutlined />} // Left arrow icon
              onClick={handlePrevious} // Function to go to the previous image
              disabled={currentIndex === 0} // Disable if on the first image
              className="pagination-button previous-button"
            >
              السابق {/* Label for previous button */}
            </Button>
            <span className="pagination-info">
              {currentIndex + 1} / {uploadedImages.length} {/* Display the current image index */}
            </span>
            <Button
              icon={<RightOutlined />} // Right arrow icon
              onClick={handleNext} // Function to go to the next image
              disabled={currentIndex === uploadedImages.length - 1} // Disable if on the last image
              className="pagination-button next-button"
            >
              التالي {/* Label for next button */}
            </Button>
          </div>

          {/* Delete Button */}
          <div className="delete-button-container">
            <Button
              onClick={handleDelete} // Delete the current image
              danger
              className="delete-button"
            >
              حذف {/* Label for delete button */}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
