import React, { useState } from "react";
import { DataTable } from "mantine-datatable";
import { Button, Modal } from "@mantine/core";
import Dashboard from "./../../../pages/dashBoard.jsx";
import TextFieldForm from "./../../../reusable elements/ReuseAbleTextField.jsx";
import "./AdminUserManagment.css";

const AdminUserManagment = () => {
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [userRecords, setUserRecords] = useState([
    {
      id: 1,
      username: "mohsen",
      role: "admin",
      governorate: "بغداد",
      officeName: "المكتب الرئيسي",
    },
    {
      id: 2,
      username: "ahmed",
      role: "manager",
      governorate: "نينوى",
      officeName: "مكتب الفرع",
    },
    {
      id: 3,
      username: "zainab",
      role: "employee",
      governorate: "البصرة",
      officeName: "مكتب الجنوب",
    },
  ]);

  const [modalOpened, setModalOpened] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const applyFilters = (filters) => {
    const { username, role, governorate, officeName } = filters;

    const filtered = userRecords.filter((record) => {
      const matchesUsername =
        !username || record.username.toLowerCase().includes(username.toLowerCase());
      const matchesRole = !role || record.role.toLowerCase() === role.toLowerCase();
      const matchesGovernorate =
        !governorate || record.governorate.includes(governorate);
      const matchesOfficeName =
        !officeName || record.officeName.includes(officeName);

      return matchesUsername && matchesRole && matchesGovernorate && matchesOfficeName;
    });

    setFilteredRecords(filtered);
  };

  const resetFilters = () => {
    setFilteredRecords([]);
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setModalOpened(true);
  };

  const handleDelete = (userId) => {
    const confirmed = window.confirm("هل أنت متأكد أنك تريد حذف هذا المستخدم؟");
    if (confirmed) {
      setUserRecords((prev) => prev.filter((user) => user.id !== userId));
      setFilteredRecords((prev) => prev.filter((user) => user.id !== userId));
    }
  };

  const handleEditSubmit = (updatedUser) => {
    setUserRecords((prev) =>
      prev.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    );
    setFilteredRecords((prev) =>
      prev.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    );
    setModalOpened(false);
  };

  return (
    <>
      <Dashboard />
      <div className="admin-user-management-container" dir="rtl">
        <h1 className="admin-header">إدارة المستخدمين</h1>

        {/* Filter Section */}
        <div className="filter-section">
          <TextFieldForm
            fields={[
              {
                name: "username",
                label: "اسم المستخدم",
                type: "text",
              },
              {
                name: "role",
                label: "الصلاحية",
                type: "dropdown",
                options: [
                  { value: "admin", label: "مدير" },
                  { value: "manager", label: "مدير قسم" },
                  { value: "employee", label: "موظف" },
                ],
              },
              {
                name: "governorate",
                label: "المحافظة",
                type: "dropdown",
                options: [
                  { value: "بغداد", label: "بغداد" },
                  { value: "نينوى", label: "نينوى" },
                  { value: "البصرة", label: "البصرة" },
                ],
              },
              {
                name: "officeName",
                label: "اسم المكتب",
                type: "dropdown",
                options: [
                  { value: "المكتب الرئيسي", label: "المكتب الرئيسي" },
                  { value: "مكتب الفرع", label: "مكتب الفرع" },
                  { value: "مكتب الجنوب", label: "مكتب الجنوب" },
                ],
              },
            ]}
            onFormSubmit={applyFilters}
            onReset={resetFilters}
            formClassName="filter-row"
            inputClassName="filter-input"
            dropdownClassName="filter-dropdown"
            fieldWrapperClassName="filter-field-wrapper"
            buttonClassName="filter-button"
          />
        </div>

        {/* Data Table */}
        <div className="data-table-container">
          <div dir="ltr">

              <button
              dir="ltr"
          type="button"
          className="add-button"
          onClick={() => console.log('Add button clicked')} // Replace with actual functionality
        >
          + إ ضافة
        </button>
          </div>
          {filteredRecords.length > 0 || userRecords.length > 0 ? (
            <DataTable
              withTableBorder
              withColumnBorders
              highlightOnHover    
              noRecordsText=""
              records={filteredRecords.length > 0 ? filteredRecords : userRecords}
              key="id"
              columns={[
                { accessor: "username", title: "اسم المستخدم" },
                { accessor: "role", title: "الصلاحية" },
                { accessor: "governorate", title: "المحافظة" },
                { accessor: "officeName", title: "اسم المكتب" },
                {
                  accessor: "actions",
                  title: "الإجراءات",
                  render: (user) => (
                    <div className="action-buttons">
                      <Button
                        variant="outline"
                        color="blue"
                        size="xs"
                        onClick={() => handleEdit(user)}
                      >
                        تعديل
                      </Button>
                      <Button
                        variant="outline"
                        color="red"
                        size="xs"
                        onClick={() => handleDelete(user.id)}
                      >
                        حذف
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          ) : (
            <div className="no-records-text">لا توجد بيانات للعرض</div>
          )}
        </div>

        {/* Modal for Editing User */}
        <Modal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          title="تعديل معلومات المستخدم"
          centered
        >
          {editUser && (
            <TextFieldForm /* overflow disable */
              fields={[
                {
                  name: "username",
                  label: "اسم المستخدم",
                  type: "text",
                  placeholder: "اسم المستخدم",
                  defaultValue: editUser.username,
                },
                {
                  name: "role",
                  label: "الصلاحية",
                  type: "dropdown",
                  options: [
                    { value: "admin", label: "مدير" },
                    { value: "manager", label: "مدير قسم" },
                    { value: "employee", label: "موظف" },
                  ],
                  defaultValue: editUser.role,
                },
                {
                  name: "governorate",
                  label: "المحافظة",
                  type: "dropdown",
                  options: [
                    { value: "بغداد", label: "بغداد" },
                    { value: "نينوى", label: "نينوى" },
                    { value: "البصرة", label: "البصرة" },
                  ],
                  defaultValue: editUser.governorate,
                },
                {
                  name: "officeName",
                  label: "اسم المكتب",
                  type: "dropdown",
                  options: [
                    { value: "المكتب الرئيسي", label: "المكتب الرئيسي" },
                    { value: "مكتب الفرع", label: "مكتب الفرع" },
                    { value: "مكتب الجنوب", label: "مكتب الجنوب" },
                  ],
                  defaultValue: editUser.officeName,
                },
              ]}
              onFormSubmit={(updatedFields) =>
                handleEditSubmit({ ...editUser, ...updatedFields })
              }
              formClassName="edit-form"
              inputClassName="filter-input"
              dropdownClassName="filter-dropdown"
              fieldWrapperClassName="filter-field-wrapper"
              buttonClassName="filter-button"
            />
          )}
        </Modal>
      </div>
    </>
  );
};

export default AdminUserManagment;
