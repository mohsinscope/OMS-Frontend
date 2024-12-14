import React, { useState, useEffect } from "react";
import { Table, Modal, message, ConfigProvider, Button } from "antd";
import { Link } from "react-router-dom";
import useAuthStore from "./../../../store/store";
import TextFields from "./../../../reusable elements/ReuseAbleTextField.jsx";
import "./ManagerAttendenceHistory.css";
import attendanceDataJSON from "./../../../data/ManagerAttendence.json";

export default function ManagerAttendenceHistory() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [filters, setFilters] = useState({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { isSidebarCollapsed } = useAuthStore();

  useEffect(() => {
    try {
      const combinedData = [
        {
          id: 1,
          governorate: "بغداد",
          officeName: "مكتب الكرادة",
          date: attendanceDataJSON.date,
          totalPassportAttendance: attendanceDataJSON.totalPassportAttendance,
          totalCompanyAttendance: attendanceDataJSON.totalCompanyAttendance,
          companyEmployees: [
            { id: 1, name: "أحمد سعيد", role: "موظف IT", attended: true },
            { id: 2, name: "سعيد أحمد", role: "موظف خدمة", attended: false },
          ],
        },
        ...attendanceDataJSON.additionalAttendance.map((item, index) => ({
          id: index + 2,
          ...item,
        })),
      ];
      setAttendanceData(combinedData);
      setFilteredData(combinedData); // Initialize filtered data
    } catch (error) {
      console.error("Error loading attendance data:", error);
    }
  }, []);

  const fields = [
    {
      name: "governorate",
      label: "المحافظة",
      placeholder: "",
      type: "text",
      disabled: false,
    },
    {
      name: "office",
      label: "اسم المكتب",
      placeholder: "",
      type: "text",
      disabled: false,
    },
    {
      name: "date",
      label: "التاريخ",
      placeholder: "اختر التاريخ",
      type: "date",
    },
  ];

  const handleSearch = (formData) => {
    const filtered = attendanceData.filter((item) => {
      const matchesGovernorate = formData.governorate
        ? item.governorate === formData.governorate
        : true;
      const matchesOffice = formData.office
        ? item.officeName === formData.office
        : true;
      const matchesDate = formData.date ? item.date === formData.date : true;

      return matchesGovernorate && matchesOffice && matchesDate;
    });

    if (filtered.length > 0) {
      setFilteredData(filtered);
    } else {
      setFilteredData([]);
      setIsModalVisible(true);
    }
  };

  const handleReset = () => {
    setFilters({});
    setFilteredData(attendanceData);
    message.info("تمت إعادة تعيين الفلاتر");
  };

  const columns = [
    {
      title: "تسلسل",
      dataIndex: "id",
      key: "id",
      align: "center",
    },
    {
      title: "المحافظة",
      dataIndex: "governorate",
      key: "governorate",
      align: "center",
    },
    {
      title: "المكتب",
      dataIndex: "officeName",
      key: "officeName",
      align: "center",
    },
    {
      title: "عدد موظفي الجوازات",
      dataIndex: "totalPassportAttendance",
      key: "totalPassportAttendance",
      align: "center",
    },
    {
      title: "عدد موظفي الشركة",
      dataIndex: "totalCompanyAttendance",
      key: "totalCompanyAttendance",
      align: "center",
    },
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
      align: "center",
    },
    {
      title: "عرض",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Link
          to={{
            pathname: "/manager/attendence/view",
          }}
          state={{ data: record }} // Pass selected record data
        >
          <Button type="primary" size="middle">
            عرض
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div
      className={`manager-attendance-history-container ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl"
    >
      <div className="header-section">
        <h1 className="page-title">نظام إدارة المكاتب - سجل الحضور</h1>
      </div>

      <div className="filter-section">
        <TextFields
          fields={fields}
          onFormSubmit={handleSearch}
          onReset={handleReset}
          formClassName="attendance-form"
          inputClassName="attendance-input"
          dropdownClassName="attendance-dropdown"
          fieldWrapperClassName="attendance-field-wrapper"
          buttonClassName="attendance-button"
        />
      </div>

      <div className="table-section">
        <ConfigProvider direction="rtl">
          <Table
            dataSource={filteredData}
            columns={columns}
            rowKey="id"
            bordered
            pagination={{
              pageSize: 5,
              position: ["bottomCenter"],
            }}
          />
        </ConfigProvider>
      </div>

      <Modal
        title="تنبيه"
        visible={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        okText="حسناً"
        cancelText="إغلاق"
      >
        <p>لا يوجد تطابق للفلاتر</p>
      </Modal>
    </div>
  );
}
