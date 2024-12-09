    import React, { useState } from "react";
    import { useLocation, useNavigate } from "react-router-dom";
    import { Table, Checkbox, Button, Modal, InputNumber, message } from "antd";
    import TextFields from "./../../../reusable elements/ReuseAbleTextField.jsx"; // Your reusable component
    import "./editAttendence.css"; // Styling

    export default function EditAttendence() {
    const location = useLocation();
    const navigate = useNavigate();
    const dataFromPreviousPage = location.state?.data || {}; // Data from the previous page
    const [editedData, setEditedData] = useState({ ...dataFromPreviousPage }); // Editable state
    const [modalVisible, setModalVisible] = useState(false);
    const [modalAction, setModalAction] = useState("");

    // Handle updates in form fields
    const handleFieldChange = (field, value, category, index) => {
        if (category) {
        // Update nested arrays like passportEmployees or companyEmployees
        const updatedArray = [...editedData[category]];
        updatedArray[index] = { ...updatedArray[index], value };
        setEditedData({ ...editedData, [category]: updatedArray });
        } else {
        // Update top-level fields
        setEditedData({ ...editedData, [field]: value });
        }
    };

    // Save edited data
    const handleSave = () => {
        message.success("تم حفظ التعديلات بنجاح");
        navigate("/supervisor/Attendance", { state: { updatedData: editedData } });
    };

    // Reset to original data
    const handleReset = () => {
        setEditedData({ ...dataFromPreviousPage });
        message.success("تمت إعادة التعيين بنجاح");
    };

    // Handle modal actions
    const handleModalConfirm = () => {
        if (modalAction === "reset") {
        handleReset();
        } else if (modalAction === "save") {
        handleSave();
        }
        setModalVisible(false);
    };

    // Define form fields
    const fields = [
        {
        name: "date",
        label: "التاريخ",
        placeholder: "اختر التاريخ",
        type: "date",
        value: editedData.date,
        onChange: (e) => handleFieldChange("date", e.target.value),
        },
        {
        name: "workShift",
        label: "نوع الدوام",
        placeholder: "نوع الدوام",
        type: "dropdown",
        options: [
            { value: "صباحي", label: "صباحي" },
            { value: "مسائي", label: "مسائي" },
        ],
        value: editedData.workShift,
        onChange: (e) => handleFieldChange("workShift", e.target.value),
        },
    ];

    // Define table columns for company attendance
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
        render: (_, record, index) => (
            <Checkbox
            checked={record.attended}
            onChange={(e) =>
                handleFieldChange("attended", e.target.checked, "attendanceTable", index)
            }
            />
        ),
        },
    ];

    return (
        <div className="edit-attendance-container" dir="rtl">
        {/* Section: Edit Basic Details */}
        <h2>تعديل الحضور</h2>
        <TextFields
            fields={fields}
            formClassName="edit-attendance-form"
            inputClassName="edit-attendance-input"
            dropdownClassName="edit-attendance-dropdown"
            hideButtons={true} // Hide buttons if not needed
        />

        {/* Passport Employees Section */}
        <h3>حضور موظفي الجوازات</h3>
        <div className="passport-attendance-container">
            {editedData.passportEmployees &&
            editedData.passportEmployees.map((employee, index) => (
                <div key={index} className="edit-attendance-field">
                <h4>{employee.title}</h4>
                <InputNumber
                    min={0}
                    value={employee.value}
                    onChange={(value) =>
                    handleFieldChange("value", value, "passportEmployees", index)
                    }
                />
                </div>
            ))}
        </div>

        {/* Company Attendance Section */}
        <h3>حضور موظفي الشركة</h3>
        <Table
            dataSource={editedData.attendanceTable || []}
            columns={tableColumns}
            rowKey="id"
            pagination={false}
            bordered
        />

        {/* Buttons Section */}
        <div className="edit-attendance-buttons">
            <Button
            type="default"
            danger
            onClick={() => {
                setModalAction("reset");
                setModalVisible(true);
            }}
            >
            إعادة التعيين
            </Button>
            <Button
            type="primary"
            onClick={() => {
                setModalAction("save");
                setModalVisible(true);
            }}
            >
            حفظ التعديلات
            </Button>
        </div>

        {/* Confirmation Modal */}
        <Modal
            title="تأكيد العملية"
            visible={modalVisible}
            onOk={handleModalConfirm}
            onCancel={() => setModalVisible(false)}
            okText="نعم"
            cancelText="إلغاء"
        >
            <p>
            {modalAction === "reset"
                ? "هل أنت متأكد من إعادة التعيين؟"
                : "هل أنت متأكد من حفظ التعديلات؟"}
            </p>
        </Modal>
        </div>
    );
    }
