import React, { useState } from "react";
import { Table, Checkbox, Button, Modal, message } from "antd";
import axios from "axios"; // For API requests
import TextFields from "./../../../reusable elements/ReuseAbleTextField.jsx"; // Import your TextFields component
import "./superVisorAteensenceAdd.css";
import useAuthStore from "./../../../store/store"; // Import sidebar state for dynamic class handling
export default function SuperVisorAttendanceAdd() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [passportAttendance, setPassportAttendance] = useState({
    الاستلام: 0,
    الحسابات: 0,
    الطباعة: 0,
    الجودة: 0,
    التسليم: 0,
  }); // Dynamic fields for passport employees attendance
  const [tableData, setTableData] = useState([
    { id: "001", name: "أحمد سعد", role: "موظف I.T", attended: true },
    { id: "002", name: "سعد أحمد", role: "مشرف", attended: false },
    { id: "003", name: "محمد علي", role: "موظف حسابات", attended: true },
  ]);
  const { isSidebarCollapsed } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalAction, setModalAction] = useState(""); // Keep track of which button was clicked
  const governorate = "بغداد"; // Example governorate
  const officeName = "مكتب الجوازات"; // Example office name

  const fields = [
    {
      name: "governorate",
      label: "اسم المحافظة",
      placeholder: "بغداد",
      type: "text",
      value: governorate,
      disabled: true,
    },
    {
      name: "officeName",
      label: "اسم المكتب",
      placeholder: "الكرادة",
      type: "text",
      value: officeName,
      disabled: true,
    },{
      name: "workShift",
      label: "نوع الدوام",
      placeholder: "",
      type: "dropdown",
      options: [
        { value: "صباحي", label: "صباحي" },
        { value: "مسائي", label: "مسائي" },
      ],
    },
    {
      name: "date",
      label: "التاريخ",
      placeholder: "اختر التاريخ",
      type: "date", // Use Ant Design's DatePicker
      onChange: (date, dateString) => setSelectedDate(dateString),
    },
    ...Object.keys(passportAttendance).map((key) => ({
      name: key,
      label: `عدد موظفين ${key}`,
      placeholder: "",
      type: "number",
      value: passportAttendance[key],
      onChange: (e) =>
        setPassportAttendance((prev) => ({
          ...prev,
          [key]: Number(e.target.value),
        })),
    })),
    {
      name: "notes",
      label: "ملاحظات",
      placeholder: "",
      type: "textarea",
    },
  ];

  // Handle attendance change in the table
  const handleAttendanceChange = (recordId, checked) => {
    setTableData((prevData) =>
      prevData.map((item) =>
        item.id === recordId ? { ...item, attended: checked } : item
      )
    );
  };

  // Handle reset action
  const handleResetAction = () => {
    setPassportAttendance({
      الطباعة: 0,
      الاستلام: 0,
      التسليم: 0,
      الحسابات: 0,
    });
    setTableData((prevData) =>
      prevData.map((item) => ({ ...item, attended: false }))
    );
    setSelectedDate(null);
    message.success("تمت إعادة التعيين بنجاح");
  };

  // Handle save and send action
  const handleSaveAndSendAction = async () => {
    try {
      const dataToSend = {
        date: selectedDate,
        governorate,
        office: officeName,
        passportAttendance,
        companyAttendance: tableData,
      };

      // Replace this URL with your API endpoint
      await axios.post("https://example.com/api/attendance", dataToSend);
      message.success("تم حفظ الحضور وإرساله بنجاح");
    } catch (error) {
      console.error("Error saving attendance:", error);
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

  const tableColumns = [
    {
      title: "الرقم التسلسلي",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "الاسم",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "الدور الوظيفي",
      dataIndex: "role",
      key: "role",
    },
    {
      title: "الحضور",
      dataIndex: "attended",
      key: "attended",
      render: (_, record) => (
        <Checkbox
          checked={record.attended}
          onChange={(e) => handleAttendanceChange(record.id, e.target.checked)}
        />
      ),
    },
  ];

  return (
    <div
      className={`supervisor-attendence-register-container ${
        isSidebarCollapsed
          ? "sidebar-collapsed"
          : "supervisor-expenses-history-page"
      }`}
      dir="rtl">
      {/* Section: Attendance Details */}
      <h2 style={{ marginTop: "20px" }}>حضور موظفين الجوازات</h2>
      <TextFields
        fields={fields}
        formClassName="attendance-input-group"
        inputClassName="attendance-input"
        dropdownClassName="attendance-dropdown"
        fieldWrapperClassName="attendance-field-wrapper-add"
        buttonClassName="attendance-button"
        hideButtons={true} // Hide buttons if not needed
      />

      {/* Section: Company Employees Attendance */}
      <h2 style={{ marginTop: "20px" }}>حضور موظفين الشركة</h2>
      <Table
        dataSource={tableData}
        columns={tableColumns}
        rowKey="id"
        pagination={{ pageSize: 5 }}
      />

      {/* Buttons */}
      <div className="attendance-buttons">
        <Button
          type="default"
          danger
          onClick={() => showModal("reset")}
          style={{ margin: "10px" }}>
          إعادة التعيين
        </Button>
        <Button
          type="primary"
          onClick={() => showModal("save")}
          style={{ margin: "10px" }}>
          الحفظ والإرسال
        </Button>
      </div>

      {/* Confirmation Modal */}
      <Modal
        title="تأكيد العملية"
        visible={modalVisible}
        onOk={handleModalConfirm}
        onCancel={handleModalCancel}
        okText="نعم"
        cancelText="الغاء">
        <p>
          {modalAction === "reset"
            ? "هل أنت متأكد من إعادة التعيين؟"
            : "هل أنت متأكد من الحفظ والإرسال؟"}
        </p>
      </Modal>
    </div>
  );
}
