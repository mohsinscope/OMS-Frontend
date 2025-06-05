import { useState, useEffect } from "react";
import { Button, Modal, message, Input, DatePicker, Skeleton } from "antd";
import { useNavigate } from "react-router-dom";
import axiosInstance from "./../../../intercepters/axiosInstance.js";
import "./superVisorAteensenceAdd.css";
import useAuthStore from "./../../../store/store";
import Url from "./../../../store/url.js";
import IconName from "./../../../reusable elements/icons.jsx";
import dayjs from "dayjs";

const { TextArea } = Input;

export default function SuperVisorAttendanceAdd() {
  const navigate = useNavigate();
  const { isSidebarCollapsed, profile, accessToken ,isTwoShifts } = useAuthStore();

  // Loading state to control the full-page skeleton
  const [loading, setLoading] = useState(true);

  // Form fields
  // Initialize selectedDate with the current day using dayjs()
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [workingHours, setWorkingHours] = useState(1);
  const [passportAttendance, setPassportAttendance] = useState({
    الاستلام: 0,
    الحسابات: 0,
    الطباعة: 0,
    الجودة: 0,
    التسليم: 0,
  });
  const [employeeNumbers, setEmployeeNumbers] = useState({});
  const [notes, setNotes] = useState("");

  // Modal control
  const [modalVisible, setModalVisible] = useState(false);
  const [modalAction, setModalAction] = useState("");

  // Profile data
  const governorateId = profile?.governorateId;
  const officeId = profile?.officeId;
  const profileId = profile?.profileId;

  // Fetch employee numbers
  useEffect(() => {
    const fetchEmployeeNumbers = async () => {
      try {
        const response = await axiosInstance.get(`${Url}/api/office/${officeId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const data = response.data;
        setEmployeeNumbers({
          الاستلام: data.receivingStaff,
          الحسابات: data.accountStaff,
          الطباعة: data.printingStaff,
          الجودة: data.qualityStaff,
          التسليم: data.deliveryStaff,
        });
      } catch (error) {
        console.error("Error fetching employee numbers:", error);
        message.error("حدث خطأ أثناء جلب بيانات الموظفين");
      } finally {
        // Turn off the loading skeleton
        setLoading(false);
      }
    };

    if (officeId) fetchEmployeeNumbers();
  }, [officeId, accessToken]);

  // Handlers
  const handleInputChange = (key, value) => {
    const parsedValue = Math.max(0, Math.min(value, employeeNumbers[key] || 0));
    setPassportAttendance((prev) => ({
      ...prev,
      [key]: parsedValue,
    }));
  };

  const handleResetAction = () => {
    setPassportAttendance({
      الاستلام: 0,
      الحسابات: 0,
      الطباعة: 0,
      الجودة: 0,
      التسليم: 0,
    });
    setSelectedDate(dayjs()); // Reset to current date
    setWorkingHours(1);
    setNotes("");
    message.success("تمت إعادة التعيين بنجاح");
  };

  const handleSaveAndSendAction = async () => {
    const formattedDate = selectedDate.format("YYYY-MM-DD");

    try {
      const dataToSend = {
        receivingStaff: passportAttendance["الاستلام"],
        accountStaff: passportAttendance["الحسابات"],
        printingStaff: passportAttendance["الطباعة"],
        qualityStaff: passportAttendance["الجودة"],
        deliveryStaff: passportAttendance["التسليم"],
        date: selectedDate ? `${formattedDate}T00:00:00Z` : null,
        note: notes,
        workingHours,
        governorateId,
        officeId,
        profileId,
      };

      await axiosInstance.post(`${Url}/api/Attendance`, dataToSend, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      message.success("تم حفظ الحضور وإرساله بنجاح");
      navigate(-1);
    } catch (error) {
      console.error("Error saving attendance:", error.response?.data || error);
      message.error("حدث خطأ أثناء حفظ الحضور");
    }
  };

  // Modal
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

  // Go back
  const handleBack = () => {
    navigate(-1);
  };

  // ---------------- FULL PAGE SKELETON EXAMPLE ----------------
  if (loading) {
    // While loading, render a full-page skeleton placeholder
    return (
      <div
        className={`supervisor-attendence-register-container ${
          isSidebarCollapsed
            ? "sidebar-collapsed"
            : "supervisor-attendence-register-container"
        }`}
        dir="rtl"
      >
        <Skeleton
          active
          paragraph={{ rows: 12 }}
          style={{ marginTop: 20 }}
        />
      </div>
    );
  }

  // ---------------- RENDER ACTUAL CONTENT ----------------
  return (
    <div
      className={`supervisor-attendence-register-container ${
        isSidebarCollapsed
          ? "sidebar-collapsed"
          : "supervisor-attendence-register-container"
      }`}
      dir="rtl"
    >
      <div className="supervisor-attendence-add-title-content">
        <Button type="primary" style={{ height: "45px" }} onClick={handleBack}>
          <IconName type="back" />
          الرجوع
        </Button>
        <h2>حضور موظفين الجوازات</h2>
      </div>

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
  {isTwoShifts && <option value={2}>مسائي</option>}
          </select>
        </div>

        <div className="attendance-field-wrapper-add">
          <label>التاريخ</label>
          <DatePicker
            style={{ width: "100%" }}
            value={selectedDate}
            onChange={(date, dateString) => setSelectedDate(date)}
            format="YYYY-MM-DD"
          />
        </div>

        {Object.keys(passportAttendance).map((key) => (
          <div className="attendance-field-wrapper-add" key={key}>
            <label>
              عدد موظفي {key}{" "}
              <span style={{ color: "blue", fontSize: "18px" }}>
                {employeeNumbers[key] || 0}
              </span>
            </label>
            <Input
              type="number"
              className="attendance-input"
              value={passportAttendance[key]}
              onChange={(e) => handleInputChange(key, Number(e.target.value))}
              onBlur={(e) => handleInputChange(key, Number(e.target.value))}
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
        open={modalVisible}
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
