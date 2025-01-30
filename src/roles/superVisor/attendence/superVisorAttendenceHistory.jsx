import { useState, useEffect } from "react";
import { Table, Button, Modal, message, DatePicker, ConfigProvider, Select, Skeleton } from "antd";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "./../../../store/store";
import usePermissionsStore from "./../../../store/permissionsStore";
import axiosInstance from "./../../../intercepters/axiosInstance.js";
import "./superVisorAttendeceHistory.css";
import Url from "./../../../store/url.js";

export default function SupervisorAttendanceHistory() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [workingHours, setWorkingHours] = useState(3);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [governorates, setGovernorates] = useState([]);
  const [offices, setOffices] = useState([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;

  const { isSidebarCollapsed, profile, roles, searchVisible, accessToken } = useAuthStore();
  const { hasAnyPermission } = usePermissionsStore();
  const hasCreatePermission = hasAnyPermission("create");
  const navigate = useNavigate();
  
  const isSupervisor =  roles.includes("Supervisor") || (roles == "I.T");
  const userGovernorateId = profile?.governorateId;
  const userOfficeId = profile?.officeId;

  const formatDateForAPI = (date) => {
    if (!date) return null;
    const formattedDate = new Date(date);
    formattedDate.setUTCHours(14, 0, 0, 0);
    return formattedDate.toISOString();
  };

  const fetchOffices = async (governorateId) => {
    if (!governorateId) {
      setOffices([]);
      setSelectedOffice(null);
      return;
    }

    try {
      const response = await axiosInstance.get(`${Url}/api/Governorate/dropdown/${governorateId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.data?.[0]?.offices) {
        setOffices(response.data[0].offices);
        if (isSupervisor && profile?.officeId) {
          setSelectedOffice(profile.officeId);
        }
      }
    } catch (error) {
      message.error("حدث خطأ أثناء جلب بيانات المكاتب");
    }
  };

  const fetchGovernorates = async () => {
    try {
      const response = await axiosInstance.get(`${Url}/api/Governorate/dropdown`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setGovernorates(response.data);

      if (isSupervisor && profile?.governorateId) {
        setSelectedGovernorate(profile.governorateId);
        await fetchOffices(profile.governorateId);
      }
    } catch (error) {
      message.error("حدث خطأ أثناء جلب بيانات المحافظات");
    }
  };

  const fetchAttendanceData = async (pageNumber = 1) => {
    try {
      setIsLoading(true);
      const searchBody = {
        workingHours,
        officeId: isSupervisor ? userOfficeId : selectedOffice,
        governorateId: isSupervisor ? userGovernorateId : selectedGovernorate,
        startDate: startDate ? formatDateForAPI(startDate) : null,
        endDate: endDate ? formatDateForAPI(endDate) : null,
        PaginationParams: {
          PageNumber: pageNumber,
          PageSize: pageSize,
        },
      };

      const response = await axiosInstance.post(`${Url}/api/Attendance/search`, searchBody, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const paginationHeader = response.headers["pagination"];
      if (paginationHeader) {
        const paginationInfo = JSON.parse(paginationHeader);
        setTotalRecords(paginationInfo.totalItems);
      } else {
        setTotalRecords(response.data.length);
      }

      const formattedData = response.data.map((item) => ({
        id: item.id,
        date: new Date(item.date).toLocaleDateString("en-CA"),
        time: new Date(item.dateCreated).toLocaleString("ar", {
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",
        }),
        totalStaff:
          item.receivingStaff +
          item.accountStaff +
          item.printingStaff +
          item.qualityStaff +
          item.deliveryStaff,
        shift: item.workingHours === 1 ? "صباحي" : item.workingHours === 2 ? "مسائي" : "الكل",
        governorateName: item.governorateName || "غير معروف",
        officeName: item.officeName || "غير معروف",
      }));

      setAttendanceData(formattedData);

      if (response.data.length === 0) {
        setIsModalVisible(true);
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      message.error("حدث خطأ أثناء جلب البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGovernorateChange = (value) => {
    setSelectedGovernorate(value);
    fetchOffices(value);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAttendanceData(1);
  };

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setWorkingHours(3);
    if (!isSupervisor) {
      setSelectedGovernorate(null);
      setSelectedOffice(null);
    }
    setCurrentPage(1);
    fetchAttendanceData(1);
    message.success("تمت إعادة التعيين بنجاح");
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchAttendanceData(page);
  };

  const handleView = (record) => {
    navigate("/attendance/view", { state: { id: record.id } });
  };

  useEffect(() => {
    const initData = async () => {
      await fetchGovernorates();
      await fetchAttendanceData(1);
    };

    initData();
  }, []);

  const columns = [
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "الوقت",
      dataIndex: "time",
      key: "time",
    },
    {
      title: "المحافظة",
      dataIndex: "governorateName",
      key: "governorateName",
    },
    {
      title: "المكتب",
      dataIndex: "officeName",
      key: "officeName",
    },
    {
      title: "عدد الموظفين الكلي",
      dataIndex: "totalStaff",
      key: "totalStaff",
    },
    {
      title: "الحضور",
      dataIndex: "shift",
      key: "shift",
    },
    {
      title: "الإجراءات",
      key: "actions",
      render: (_, record) => (
        <Button type="primary" style={{height:"40px",width:"fit-content"}} onClick={() => handleView(record)}>
          عرض
        </Button>
      ),
    },
  ];

  return (
    <div className={`supervisor-attendance-history-main-container ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`} dir="rtl">
      <div className="supervisor-attendance-history-title">
        <h1>الحضور</h1>
      </div>

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : (
        <>
          <div className={`supervisor-attendance-history-fields ${searchVisible ? "animate-show" : "animate-hide"}`}>
            <div className="filter-row">
              <label>المحافظة</label>
              <Select
                className="html-dropdown"
                value={isSupervisor ? userGovernorateId : selectedGovernorate}
                onChange={handleGovernorateChange}
                disabled={isSupervisor}>
                <Select.Option value=""></Select.Option>
                {governorates.map((gov) => (
                  <Select.Option key={gov.id} value={gov.id}>
                    {gov.name}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div className="filter-row">
              <label>المكتب</label>
              <Select
                className="html-dropdown"
                value={isSupervisor ? userOfficeId : selectedOffice}
                onChange={(value) => setSelectedOffice(value)}
                disabled={isSupervisor || !selectedGovernorate}>
                <Select.Option value=""></Select.Option>
                {offices.map((office) => (
                  <Select.Option key={office.id} value={office.id}>
                    {office.name}
                  </Select.Option>
                ))}
              </Select>
            </div>

            <div className="filter-row">
              <label>التاريخ من</label>
              <DatePicker
                placeholder="التاريخ من"
                onChange={(date) => setStartDate(date)}
                value={startDate}
                style={{ width: "100%" }}
              />
            </div>

            <div className="filter-row">
              <label>التاريخ إلى</label>
              <DatePicker
                placeholder="التاريخ إلى"
                onChange={(date) => setEndDate(date)}
                value={endDate}
                style={{ width: "100%" }}
              />
            </div>

            <div className="attendance-dropdown-wrapper">
              <label>نوع الدوام</label>
              <Select
                className="html-dropdown"
                value={workingHours}
                onChange={(value) => setWorkingHours(value)}>
                <Select.Option value={3}>الكل</Select.Option>
                <Select.Option value={1}>صباحي</Select.Option>
                <Select.Option value={2}>مسائي</Select.Option>
              </Select>
            </div>

            <Button
              className="supervisor-passport-dameged-button"
              onClick={handleSearch}
              loading={isLoading}>
              البحث
            </Button>

            <Button
              className="supervisor-passport-dameged-button"
              onClick={handleReset}
              disabled={isLoading}>
              إعادة التعيين
            </Button>

            {hasCreatePermission && (
              <Link to="AttendenceAdd">
                <Button
                  className="attendance-add-button"
                  disabled={isLoading}
                  type="primary">
                  اضافة حضور +
                </Button>
              </Link>
            )}
          </div>

          <div className="supervisor-attendance-history-table">
            <ConfigProvider direction="rtl">
              <Table
                dataSource={attendanceData}
                columns={columns}
                rowKey={(record) => record.id}
                bordered
                pagination={{
                  position: ["bottomCenter"],
                  current: currentPage,
                  pageSize: pageSize,
                  total: totalRecords,
                  onChange: handlePageChange,
                  showSizeChanger: false,
                }}
                loading={isLoading}
              />
            </ConfigProvider>
          </div>
        </>
      )}

      <Modal
        title="تنبيه"
        open={isModalVisible}
        onOk={() => setIsModalVisible(false)}
        onCancel={() => setIsModalVisible(false)}
        okText="حسناً"
        cancelText="إغلاق">
        <p>لا يوجد تطابق للفلاتر</p>
      </Modal>
    </div>
  );
}