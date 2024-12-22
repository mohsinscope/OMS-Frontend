import React, { useState } from "react";
import { Button, Modal, message, Input, DatePicker } from "antd";
import axios from "axios";
import "./superVisorAteensenceAdd.css";
import useAuthStore from "./../../../store/store"; // Import sidebar state for dynamic class handling
import Url from "./../../../store/url.js";

const { TextArea } = Input;

export default function SuperVisorAttendanceAdd() {
  const { isSidebarCollapsed, profile } = useAuthStore(); // Access profile from store
  const [selectedDate, setSelectedDate] = useState(null);
  const [workingHours, setWorkingHours] = useState(1); // Default to "صباحي"
  const [passportAttendance, setPassportAttendance] = useState({
    الاستلام: 0,
    الحسابات: 0,
    الطباعة: 0,
    الجودة: 0,
    التسليم: 0,
  });
  const [notes, setNotes] = useState(""); // Notes for the attendance
  const [modalVisible, setModalVisible] = useState(false);
  const [modalAction, setModalAction] = useState(""); // Track which button is clicked

  // Governorate, Office, and Profile Data
  const governorateId = profile?.governorateId;
  const officeId = profile?.officeId;
  const profileId = profile?.profileId;

  // Handle reset action
  const handleResetAction = () => {
    setPassportAttendance({
      الطباعة: 0,
      الاستلام: 0,
      التسليم: 0,
      الحسابات: 0,
      الجودة: 0,
    });
    setSelectedDate(null); // Reset selected date
    setWorkingHours(1); // Reset to default "صباحي"
    setNotes(""); // Clear notes
    message.success("تمت إعادة التعيين بنجاح"); // Show success message
  };

  // Handle save and send action
  const handleSaveAndSendAction = async () => {
    try {
      const dataToSend = {
        receivingStaff: passportAttendance["الاستلام"],
        accountStaff: passportAttendance["الحسابات"],
        printingStaff: passportAttendance["الطباعة"],
        qualityStaff: passportAttendance["الجودة"],
        deliveryStaff: passportAttendance["التسليم"],
        date: selectedDate ? `${selectedDate}T10:00:00Z` : null,
        note: notes,
        workingHours, // Use selected working hours
        governorateId, // Use governorate ID from profile
        officeId, // Use office ID from profile
        profileId, // Use profile ID from profile
      };

      console.log("Payload to be sent:", dataToSend); // Debugging payload

      // Send POST request to API endpoint
      await axios.post(`${Url}/api/Attendance`, dataToSend);
      message.success("تم حفظ الحضور وإرساله بنجاح");
    } catch (error) {
      console.error("Error saving attendance:", error.response?.data || error);
      message.error("حدث خطأ أثناء حفظ الحضور");
    }
  };

  // Open modal for confirmation
  const showModal = (action) => {
    setModalAction(action);
    setModalVisible(true);
  };

  // Handle modal confirmation
  const handleModalConfirm = () => {
    if (modalAction === "reset") {
      handleResetAction();
    } else if (modalAction === "save") {
      handleSaveAndSendAction();
    }
    setModalVisible(false);
  };

  // Handle modal cancellation
  const handleModalCancel = () => {
    setModalVisible(false);
  };

  return (
    <div
      className={`supervisor-attendence-register-container ${
        isSidebarCollapsed
          ? "sidebar-collapsed"
          : "supervisor-expenses-history-page"
      }`}
      dir="rtl"
    >
      {/* Section: Attendance Details */}
      <h2 style={{ marginTop: "20px" }}>حضور موظفين الجوازات</h2>
      <div className="attendance-input-group">
        {/* Governorate */}
        <div className="attendance-field-wrapper-add">
          <label>اسم المحافظة</label>
          <Input
            className="attendance-input"
            value={profile?.governorateName || "غير معروف"}
            disabled
          />
        </div>

        {/* Office Name */}
        <div className="attendance-field-wrapper-add">
          <label>اسم المكتب</label>
          <Input
            className="attendance-input"
            value={profile?.officeName || "غير معروف"}
            disabled
          />
        </div>

        {/* Work Shift */}
        <div className="attendance-field-wrapper-add">
          <label>نوع الدوام</label>
          <select
            className="attendance-dropdown"
            value={workingHours} // Bind the current value to state
            onChange={(e) => setWorkingHours(Number(e.target.value))}
          >
            <option value={1}>صباحي</option>
            <option value={2}>مسائي</option>
          </select>
        </div>

        {/* Date */}
        <div className="attendance-field-wrapper-add">
          <label>التاريخ</label>
          <DatePicker
            style={{ width: "100%" }}
            onChange={(date, dateString) => setSelectedDate(dateString)}
          />
        </div>

        {/* Passport Attendance */}
        {Object.keys(passportAttendance).map((key) => (
          <div className="attendance-field-wrapper-add" key={key}>
            <label>عدد موظفي {key}</label>
            <Input
              type="number"
              className="attendance-input"
              value={passportAttendance[key]}
              onChange={(e) =>
                setPassportAttendance((prev) => ({
                  ...prev,
                  [key]: Number(e.target.value),
                }))
              }
            />
          </div>
        ))}

        {/* Notes */}
        <div className="attendance-field-wrapper-add">
          <label>ملاحظات</label>
          <TextArea
            rows={4}
            className="attendance-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="attendance-buttons">
        <Button
          type="default"
          danger
          onClick={() => showModal("reset")} // Open confirmation modal for reset
          style={{ margin: "10px" }}
        >
          إعادة التعيين
        </Button>
        <Button
          type="primary"
          onClick={() => showModal("save")} // Open confirmation modal for save
          style={{ margin: "10px" }}
        >
          الحفظ والإرسال
        </Button>
      </div>

      {/* Confirmation Modal */}
      <Modal
        title="تأكيد العملية"
        visible={modalVisible}
        onOk={handleModalConfirm} // Confirm the modal action
        onCancel={handleModalCancel} // Cancel and close modal
        okText="نعم"
        cancelText="الغاء"
      >
        <p>
          {modalAction === "reset"
            ? "هل أنت متأكد من إعادة التعيين؟"
            : "هل أنت متأكد من الحفظ والإرسال؟"}
        </p>
      </Modal>
    </div>
  );
}
