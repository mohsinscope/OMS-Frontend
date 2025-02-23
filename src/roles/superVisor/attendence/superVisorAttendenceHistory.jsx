import { useState, useEffect } from "react";
import { Table, Button, message, DatePicker, ConfigProvider, Select, Skeleton } from "antd";
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
  const [isLoading, setIsLoading] = useState(true);
  const [governorates, setGovernorates] = useState([]);
  const [offices, setOffices] = useState([]);

  // Selected filters:
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);

  // Pagination:
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;

  const { 
    isSidebarCollapsed, 
    profile, 
    roles, 
    searchVisible, 
    accessToken 
  } = useAuthStore();
  const { hasAnyPermission } = usePermissionsStore();
  const hasCreatePermission = hasAnyPermission("create");
  const navigate = useNavigate();

  const isSupervisor =
    roles.includes("Supervisor") || roles === "I.T" || roles === "MainSupervisor";

  const userGovernorateId = profile?.governorateId;
  const userOfficeId = profile?.officeId;

  // --- Utility to format Date for API calls
  const formatDateForAPI = (date) => {
    if (!date) return null;
    const formattedDate = new Date(date);
    // example: just setting it to some hour to standardize
    formattedDate.setUTCHours(14, 0, 0, 0);
    return formattedDate.toISOString();
  };

  // --- Load governorates ONLY
  const fetchGovernorates = async () => {
    try {
      const response = await axiosInstance.get(`${Url}/api/Governorate/dropdown`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setGovernorates(response.data);
    } catch (error) {
      message.error("حدث خطأ أثناء جلب بيانات المحافظات");
    }
  };

  // --- Load offices for a specific governorate
  const fetchOffices = async (governorateId) => {
    if (!governorateId) {
      setOffices([]);
      return;
    }
    try {
      const response = await axiosInstance.get(
        `${Url}/api/Governorate/dropdown/${governorateId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (response.data?.[0]?.offices) {
        setOffices(response.data[0].offices);
      } else {
        setOffices([]);
      }
    } catch (error) {
      message.error("حدث خطأ أثناء جلب بيانات المكاتب");
    }
  };

  // --- Main Attendance fetch
  // NOTE: We can accept the governorate/office as args so that
  //       we always fetch with the correct "latest" values.
  const fetchAttendanceData = async (
    pageNumber = 1,
    govId = null,
    offId = null
  ) => {
    try {
      setIsLoading(true);

      const searchBody = {
        workingHours,
        // If user is supervisor, we might override with userOfficeId;
        // otherwise we use the passed "offId".
        officeId: isSupervisor ? userOfficeId : offId,
        governorateId: isSupervisor ? userGovernorateId : govId,
        startDate: startDate ? formatDateForAPI(startDate) : null,
        endDate: endDate ? formatDateForAPI(endDate) : null,
        PaginationParams: {
          PageNumber: pageNumber,
          PageSize: pageSize,
        },
      };

      const response = await axiosInstance.post(
        `${Url}/api/Attendance/search`,
        searchBody,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const paginationHeader = response.headers["pagination"];
      if (paginationHeader) {
        const paginationInfo = JSON.parse(paginationHeader);
        setTotalRecords(paginationInfo.totalItems);
      } else {
        setTotalRecords(response.data?.length || 0);
      }

      const formattedData = response.data.map((item) => {
        // Convert date/time
        const localDate = new Date(item.date).toLocaleDateString("en-CA"); 
        const localTime = new Date(item.dateCreated).toLocaleString("ar", {
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",
        });
        return {
          id: item.id,
          date: localDate,
          time: localTime,
          totalStaff:
            item.receivingStaff +
            item.accountStaff +
            item.printingStaff +
            item.qualityStaff +
            item.deliveryStaff,
          shift:
            item.workingHours === 1
              ? "صباحي"
              : item.workingHours === 2
              ? "مسائي"
              : "الكل",
          governorateName: item.governorateName || "غير معروف",
          officeName: item.officeName || "غير معروف",
        };
      });

      setAttendanceData(formattedData);

      if (!response.data?.length) {
        message.info("لا يوجد تطابق للفلاتر");
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      message.error("حدث خطأ أثناء جلب البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handle user changes to the governorate <Select>
  const handleGovernorateChange = async (value) => {
    setSelectedGovernorate(value);
    // Once user picks a new governorate, fetch its offices
    await fetchOffices(value);
    // Clear out selected office if the new governorate is different
    setSelectedOffice(null);
  };

  // --- Called when user clicks "بحث"
  const handleSearch = () => {
    // We always jump to page 1 on new search
    setCurrentPage(1);

    // Save to localStorage
    localStorage.setItem(
      "supervisorAttendanceSearchFilters",
      JSON.stringify({
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        workingHours,
        selectedGovernorate,
        selectedOffice,
        currentPage: 1,
      })
    );

    // Now fetch with these filters
    fetchAttendanceData(1, selectedGovernorate, selectedOffice);
  };

  // --- Reset all filters
  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setWorkingHours(3);
    if (!isSupervisor) {
      setSelectedGovernorate(null);
      setSelectedOffice(null);
    }
    setCurrentPage(1);
    localStorage.removeItem("supervisorAttendanceSearchFilters");
    // Re-fetch
    fetchAttendanceData(1, null, null);
    message.success("تمت إعادة التعيين بنجاح");
  };

  // --- When user changes table page
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Update localStorage with new page
    localStorage.setItem(
      "supervisorAttendanceSearchFilters",
      JSON.stringify({
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null,
        workingHours,
        selectedGovernorate,
        selectedOffice,
        currentPage: page,
      })
    );
    fetchAttendanceData(page, selectedGovernorate, selectedOffice);
  };

  // --- "عرض" button to see details
  const handleView = (record) => {
    navigate("/attendance/view", { state: { id: record.id } });
  };

  // --- On mount: load governorates, restore localStorage, fetch data
  useEffect(() => {
    const initData = async () => {
      try {
        // 1) Fetch governorates so the <Select> has them
        await fetchGovernorates();

        // 2) Check localStorage
        let savedFilters = localStorage.getItem("supervisorAttendanceSearchFilters");
        savedFilters = savedFilters ? JSON.parse(savedFilters) : {};

        // Decide governorate and office based on supervisor or savedFilters
        let finalGovId = null;
        let finalOffId = null;

        if (isSupervisor) {
          // Supervisor must see his own governorate/office, ignoring localStorage
          finalGovId = userGovernorateId || null;
          finalOffId = userOfficeId || null;
        } else {
          // Non-supervisor can see saved filter or nothing
          finalGovId = savedFilters.selectedGovernorate || null;
          finalOffId = savedFilters.selectedOffice || null;
        }

        // 3) If we have a governorate, fetch its offices
        if (finalGovId) {
          await fetchOffices(finalGovId);
        }

        // 4) Now set states. 
        setSelectedGovernorate(finalGovId);
        setSelectedOffice(finalOffId);

        // Also restore date/time/workingHours from localStorage
        if (savedFilters?.startDate) setStartDate(new Date(savedFilters.startDate));
        if (savedFilters?.endDate) setEndDate(new Date(savedFilters.endDate));
        if (savedFilters?.workingHours !== undefined) {
          setWorkingHours(savedFilters.workingHours);
        }

        // Pagination
        const pageToUse = savedFilters?.currentPage || 1;
        setCurrentPage(pageToUse);

        // 5) Finally, fetch data with these filters
        await fetchAttendanceData(pageToUse, finalGovId, finalOffId);
      } catch (error) {
        console.error(error);
      }
    };
    initData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Table columns
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
        <Button
          type="primary"
          style={{ height: "40px", width: "fit-content" }}
          onClick={() => handleView(record)}
        >
          عرض
        </Button>
      ),
    },
  ];

  return (
    <div
      className={`supervisor-attendance-history-main-container ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl"
    >
      <h1 className="supervisor-passport-dameged-title">الحضور</h1>

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : (
        <>
          {/* Search Fields */}
          <div
            className={`supervisor-attendance-history-fields ${
              searchVisible ? "animate-show" : "animate-hide"
            }`}
          >
            <div className="filter-row">
              <label>المحافظة</label>
              <Select
                className="html-dropdown"
                value={selectedGovernorate || ""}
                onChange={handleGovernorateChange}
                disabled={isSupervisor} 
              >
                <Select.Option value="">اختيار محافظة</Select.Option>
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
                value={selectedOffice || ""}
                onChange={(value) => setSelectedOffice(value)}
                disabled={isSupervisor || !selectedGovernorate} 
              >
                <Select.Option value="">اختيار مكتب</Select.Option>
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
                onChange={(value) => setWorkingHours(value)}
              >
                <Select.Option value={3}>الكل</Select.Option>
                <Select.Option value={1}>صباحي</Select.Option>
                <Select.Option value={2}>مسائي</Select.Option>
              </Select>
            </div>

            <Button
              className="supervisor-passport-dameged-button"
              onClick={handleSearch}
              loading={isLoading}
            >
              البحث
            </Button>

            <Button
              className="supervisor-passport-dameged-button"
              onClick={handleReset}
              disabled={isLoading}
            >
              إعادة التعيين
            </Button>

            {hasCreatePermission && (
              <Link to="AttendenceAdd">
                <Button
                  className="attendance-add-button"
                  disabled={isLoading}
                  type="primary"
                >
                  اضافة حضور +
                </Button>
              </Link>
            )}
          </div>

          {/* Table */}
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
                  showTotal: (total) => (
                    <span style={{ marginLeft: "8px", fontWeight: "bold" }}>
                      اجمالي السجلات: {total}
                    </span>
                  ),
                }}
                loading={isLoading}
              />
            </ConfigProvider>
          </div>
        </>
      )}
    </div>
  );
}
