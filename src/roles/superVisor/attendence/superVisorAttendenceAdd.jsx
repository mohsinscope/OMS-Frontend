import React, { useState } from "react";
import { Button, Modal, message, Input, DatePicker } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./superVisorAteensenceAdd.css";
import useAuthStore from "./../../../store/store";
import Url from "./../../../store/url.js";

const { TextArea } = Input;

export default function SuperVisorAttendanceAdd() {
  const navigate = useNavigate();
  const { isSidebarCollapsed, profile } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(null);
  const [workingHours, setWorkingHours] = useState(1);
  const [passportAttendance, setPassportAttendance] = useState({
    الاستلام: 0,
    الحسابات: 0,
    الطباعة: 0,
    الجودة: 0,
    التسليم: 0,
  });
  const [notes, setNotes] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalAction, setModalAction] = useState("");

  const governorateId = profile?.governorateId;
  const officeId = profile?.officeId;
  const profileId = profile?.profileId;

  const handleResetAction = () => {
    setPassportAttendance({
      الطباعة: 0,
      الاستلام: 0,
      التسليم: 0,
      الحسابات: 0,
      الجودة: 0,
    });
    setSelectedDate(null);
    setWorkingHours(1);
    setNotes("");
    message.success("تمت إعادة التعيين بنجاح");
  };

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
        workingHours,
        governorateId,
        officeId,
        profileId,
      };

      console.log("Payload to be sent:", dataToSend);

      await axios.post(`${Url}/api/Attendance`, dataToSend);
      message.success("تم حفظ الحضور وإرساله بنجاح");
      navigate(-1);
    } catch (error) {
      console.error("Error saving attendance:", error.response?.data || error);
      message.error("حدث خطأ أثناء حفظ الحضور");
    }
  };

  const showModal = (action) => {
    setModalAction(action);
    setModalVisible(true);
  };

  const handleModalConfirm = () => {
    if (modalAction === "reset") {
      handleResetAction();
    } else if (modalAction === "save") {
      handleSaveAndSendAction();
    }
    setModalVisible(false);
  };

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
      <h2 style={{ marginTop: "20px" }}>حضور موظفين الجوازات</h2>
      <div className="attendance-input-group">
        <div className="attendance-field-wrapper-add">
          <label>اسم المحافظة</label>
          <Input
            className="attendance-input"
            value={profile?.governorateName || "غير معروف"}
            disabled
          />
        </div>

        <div className="attendance-field-wrapper-add">
          <label>اسم المكتب</label>
          <Input
            className="attendance-input"
            value={profile?.officeName || "غير معروف"}
            disabled
          />
        </div>

        <div className="attendance-field-wrapper-add">
          <label>نوع الدوام</label>
          <select
            className="attendance-dropdown"
            value={workingHours}
            onChange={(e) => setWorkingHours(Number(e.target.value))}
          >
            <option value={1}>صباحي</option>
            <option value={2}>مسائي</option>
          </select>
        </div>

        <div className="attendance-field-wrapper-add">
          <label>التاريخ</label>
          <DatePicker
            style={{ width: "100%" }}
            onChange={(date, dateString) => setSelectedDate(dateString)}
          />
        </div>

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

      <div className="attendance-buttons">
        <Button
          type="default"
          danger
          onClick={() => showModal("reset")}
          style={{ margin: "10px" }}
        >
          إعادة التعيين
        </Button>
        <Button
          type="primary"
          onClick={() => showModal("save")}
          style={{ margin: "10px" }}
        >
          الحفظ والإرسال
        </Button>
      </div>

      <Modal
        title="تأكيد العملية"
        visible={modalVisible}
        onOk={handleModalConfirm}
        onCancel={handleModalCancel}
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