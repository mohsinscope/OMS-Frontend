import React, { useState } from "react";
import { DataTable } from "mantine-datatable";
import { Button, Modal } from "@mantine/core";
import Dashboard from "./../../../pages/dashBoard.jsx";
import TextFieldForm from "./../../../reusable elements/ReuseAbleTextField.jsx";
import './adminAttendence.css';

const AdminAttendance = () => {
  // State to hold filtered records based on user inputs
  const [filteredRecords, setFilteredRecords] = useState([]);

  // State to hold the initial attendance records
  const [attendanceRecords] = useState([
    {
      id: "001",
      employeeName: "محمد علي", // Employee name
      position: "مدير", // Position
      date: "2024-11-30", // Date of attendance
      status: "حاضر", // Attendance status
    },
    {
      id: "002",
      employeeName: "أحمد كريم",
      position: "محاسب",
      date: "2024-11-29",
      status: "غائب",
    },
  ]);

  // State to control the visibility of the modal for editing attendance
  const [modalOpened, setModalOpened] = useState(false);

  // State to hold the currently selected attendance record for editing
  const [editAttendance, setEditAttendance] = useState(null);

  // Function to apply filters to attendance records based on user input
  const applyFilters = (filters) => {
    const { governorate, office, fromDate, toDate } = filters;

    // Filter logic based on input fields
    const filtered = attendanceRecords.filter((record) => {
      const matchesGovernorate =
        !governorate || record.employeeName.includes(governorate);
      const matchesOffice = !office || record.position.includes(office);
      const matchesDate =
        (!fromDate || new Date(record.date) >= new Date(fromDate)) &&
        (!toDate || new Date(record.date) <= new Date(toDate));

      return matchesGovernorate && matchesOffice && matchesDate;
    });

    // Update the state with filtered results
    setFilteredRecords(filtered);
  };

  // Function to reset the filters and show all records
  const resetFilters = () => {
    setFilteredRecords([]);
  };

  // Function to handle the edit action
  const handleEdit = (attendance) => {
    setEditAttendance(attendance); // Set the selected record for editing
    setModalOpened(true); // Open the modal
  };

  // Function to handle the delete action
  const handleDelete = (attendanceId) => {
    const confirmed = window.confirm("هل أنت متأكد أنك تريد حذف هذا السجل؟"); // Confirmation dialog
    if (confirmed) {
      // Remove the record with the specified ID
      setFilteredRecords((prev) =>
        prev.filter((attendance) => attendance.id !== attendanceId)
      );
    }
  };

  return (
    <>
      <Dashboard /> {/* Dashboard navigation header */}
      <div className="attendance-container" dir="rtl">
        <h1 className="attendance-header">إدارة الحضور</h1> {/* Page Header */}

        {/* Filters Section */}
        <div className="attendance-filters">
          <TextFieldForm
            fields={[
              {
                name: "governorate",
                label: "المحافظة", // Dropdown for governorate
                type: "dropdown",
                placeholder: "اختر المحافظة",
                options: [
                  { value: "بغداد", label: "بغداد" },
                  { value: "نينوى", label: "نينوى" },
                ],
              },
              {
                name: "office",
                label: "المكتب", // Dropdown for office
                type: "dropdown",
                placeholder: "اختر المكتب",
                options: [
                  { value: "مدير", label: "مدير" },
                  { value: "محاسب", label: "محاسب" },
                ],
              },
              {
                name: "fromDate",
                label: "التاريخ من", // Date input for start date
                type: "date",
                placeholder: "",
              },
              {
                name: "toDate",
                label: "التاريخ إلى", // Date input for end date
                type: "date",
                placeholder: "",
              },
            ]}
            onFormSubmit={applyFilters} // Apply filters on form submit
            onReset={resetFilters} // Reset filters
            formClassName="attendance-filter-form"
            inputClassName="attendance-filter-input"
            dropdownClassName="attendance-filter-dropdown"
            fieldWrapperClassName="attendance-filter-field-wrapper"
            buttonClassName="attendance-filter-button"
          />
        </div>

        {/* Data Table Section */}
        <div className="attendance-data-table-container">
          {/* Add Button */}
          <div className="attendance-add-button-container">
            <button
              type="button"
              className="attendance-add-button"
              onClick={() => console.log("Add button clicked")} // Placeholder for add logic
            >
              + إضافة
            </button>
          </div>

          {/* Display attendance records in a table */}
          <DataTable
            className="attendance-table"
            withTableBorder
            withColumnBorders
            highlightOnHover
            records={filteredRecords.length > 0 ? filteredRecords : attendanceRecords} // Display filtered or all records
            columns={[
              { accessor: "id", title: "تسلسل" }, // Record ID
              { accessor: "employeeName", title: "اسم الموظف" }, // Employee name
              { accessor: "position", title: "الوظيفة" }, // Position
              { accessor: "date", title: "التاريخ" }, // Date
              { accessor: "status", title: "الحالة" }, // Attendance status
              {
                accessor: "actions",
                title: "الإجراءات", // Action buttons
                render: (attendance) => (
                  <div className="attendance-action-buttons">
                    <Button
                      variant="outline"
                      color="blue"
                      size="xs"
                      onClick={() => handleEdit(attendance)} // Edit action
                    >
                      تعديل
                    </Button>
                    <Button
                      variant="outline"
                      color="red"
                      size="xs"
                      onClick={() => handleDelete(attendance.id)} // Delete action
                    >
                      حذف
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Modal for Editing Attendance */}
        <Modal
          opened={modalOpened} // Modal visibility
          onClose={() => setModalOpened(false)} // Close modal
          title="تعديل الحضور"
          centered
        >
          {/* Render edit form inside the modal */}
          {editAttendance && (
            <TextFieldForm
              fields={[
                {
                  name: "employeeName",
                  label: "اسم الموظف",
                  type: "text",
                  placeholder: "اسم الموظف",
                  defaultValue: editAttendance.employeeName,
                },
                {
                  name: "position",
                  label: "الوظيفة",
                  type: "text",
                  placeholder: "الوظيفة",
                  defaultValue: editAttendance.position,
                },
                {
                  name: "date",
                  label: "التاريخ",
                  type: "date",
                  defaultValue: editAttendance.date,
                },
                {
                  name: "status",
                  label: "الحالة",
                  type: "dropdown",
                  options: [
                    { value: "حاضر", label: "حاضر" },
                    { value: "غائب", label: "غائب" },
                  ],
                  defaultValue: editAttendance.status,
                },
              ]}
              onFormSubmit={(updatedFields) =>
                console.log("Updated Fields: ", updatedFields) // Placeholder for update logic
              }
              formClassName="attendance-edit-form"
              inputClassName="attendance-edit-input"
              dropdownClassName="attendance-edit-dropdown"
              fieldWrapperClassName="attendance-edit-field-wrapper"
              buttonClassName="attendance-edit-button"
            />
          )}
        </Modal>
      </div>
    </>
  );
};

export default AdminAttendance;
