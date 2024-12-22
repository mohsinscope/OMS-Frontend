import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Spin, message } from "antd";
import axios from "axios";
import ImagePreviewer from "./../../../reusable/ImagePreViewer.jsx";
import "./LecturerShow.css";
import useAuthStore from "./../../../store/store";
import Url from "./../../../store/url.js";

const LecturerShow = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const lectureId = location.state?.id; // Retrieve the selected lecture ID
  const [lectureData, setLectureData] = useState(null); // State to store fetched lecture data
  const [images, setImages] = useState([]); // State to store fetched images
  const [loading, setLoading] = useState(false); // Loading state
  const { isSidebarCollapsed, accessToken } = useAuthStore(); // Access sidebar collapse state

  useEffect(() => {
    if (!lectureId) {
      message.error("معرف المحضر غير موجود.");
      navigate(-1); // Redirect if ID is missing
      return;
    }

    const fetchLectureDetails = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${Url}/api/Lecture/${lectureId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        setLectureData(response.data);
      } catch (error) {
        message.error(
          `حدث خطأ أثناء جلب تفاصيل المحضر: ${
            error.response?.data?.message || error.message
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchLectureImages = async () => {
      try {
        const response = await axios.get(
          `${Url}/api/Attachment/Lecture/${lectureId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const imageUrls = response.data.map((image) => image.filePath);
        //to print the width and hieght of the image
        console.log("imageUrls", imageUrls);
        setImages(imageUrls);
      } catch (error) {
        message.error(
          `حدث خطأ أثناء جلب صور المحضر: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    };

    fetchLectureDetails();
    fetchLectureImages();
  }, [lectureId, accessToken, navigate]);

  const handleBack = () => {
    navigate(-1); // Go back to the previous page
  };

  if (loading) {
    return (
      <div className="loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!lectureData) {
    return <div className="loading">جاري التحميل...</div>;
  }

  return (
    <div
      className={`supervisor-lecture-show-container ${
        isSidebarCollapsed
          ? "sidebar-collapsed"
          : "supervisor-lecture-show-container"
      }`}
      dir="rtl">
      <div className="title-container">
        <h1>تفاصيل المحضر</h1>
      </div>

      <div className="details-container-Lecture">
        <div className="details-lecture-container">
          <div className="details-row">
            <span className="details-label">عنوان المحضر:</span>
            <input
              className="details-value"
              value={lectureData.title}
              disabled></input>
          </div>
          <div className="details-row">
            <span className="details-label">التاريخ:</span>
            <input
              className="details-value"
              value={new Date(lectureData.date).toLocaleDateString("ar-EG")}
              disabled></input>
          </div>
          <div className="details-row">
            <span className="details-label">المكتب:</span>
            <input
              className="details-value"
              value={lectureData.officeName}
              disabled></input>
          </div>
          <div className="details-row">
            <span className="details-label">المحافظة:</span>
            <input
              className="details-value"
              value={lectureData.governorateName}
              disabled></input>
          </div>
          <div className="details-row">
            <span className="details-label">اسم الملف الشخصي:</span>
            <input
              className="details-value"
              value={lectureData.profileFullName}
              disabled></input>
          </div>
        </div>
        <div className="image-lecture-container">
          {images.length > 0 && (
            <div className="image-lecture-preview-container">
              <span className="details-label">صورة المحضر:</span>
              <ImagePreviewer
                uploadedImages={images}
                defaultWidth={800}
                defaultHeight={520}
              />
            </div>
          )}
        </div>
      </div>

      <div className="back-button-container">
        <button onClick={handleBack} className="back-button">
          الرجوع
        </button>
      </div>
    </div>
  );
};

export default LecturerShow;
