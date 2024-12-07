import React, { useState } from "react";
import TextFields from './../../../reusable elements/ReuseAbleTextField.jsx';
import './superVisorAttendeceHistory.css';
export default function SupervisorAttendanceHistory() {
  const [uploadedImages, setUploadedImages] = useState([]); // For handling uploaded images if needed

  const fields = [
    {
      name: "governorate",
      label: "المحافظة",
      placeholder: "بغداد",
      type: "text",
      disabled: true, // Disable the input
    },
    {
      name: "office",
      label: "اسم المكتب",
      placeholder: "مكتب الكرخ",
      type: "text",
      disabled: true, // Disable the input
    },
    {
      name: "date",
      label: "التاريخ",
      placeholder: "اختر التاريخ",
      type: "date",
    },
  ];

  return (
    <>
      <div className="supervisor-attendance-history-main-container" dir="rtl">
        {/* Title Section */}
        <div className="supervisor-attendance-history-title">
          <h1>الحضور</h1>
        </div>

        {/* Input Fields Section */}
        <div className="supervisor-attendance-history-fields">
          <TextFields
            fields={fields}
            formClassName="attendance-form"
            inputClassName="attendance-input"
            dropdownClassName="attendance-dropdown"
            fieldWrapperClassName="attendance-field-wrapper"
            buttonClassName="attendance-button"
            hideButtons={false}
            showImagePreviewer={false}
          />
        </div>

        {/* Attendance Charts Section */}
        <div className="supervisor-attendance-history-charts">
          <div className="supervisor-attendance-chart-box">
            <h2>hi</h2>
          </div>
        </div>
      </div>
    </>
  );
}
