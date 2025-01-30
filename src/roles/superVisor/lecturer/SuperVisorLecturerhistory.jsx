import { useState, useEffect, useCallback } from "react";
import {
  Table,
  message,
  Button,
  ConfigProvider,
  DatePicker,
  Select,
  Input,
  Skeleton,
} from "antd";
import { Link } from "react-router-dom";
import "./SuperVisorLecturerhistory.css";
import useAuthStore from "./../../../store/store";
import axiosInstance from "./../../../intercepters/axiosInstance.js";
import Url from "./../../../store/url.js";

const SuperVisorLecturerhistory = () => {
  const {
    isSidebarCollapsed,
    accessToken,
    profile,
    searchVisible,
    roles,
    permissions,
  } = useAuthStore();
  const hasCreatePermission = permissions.includes("Lc");
  const isSupervisor =  roles.includes("Supervisor")  || (roles == "I.T");
  const [lectures, setLectures] = useState([]);
  const [totalLectures, setTotalLectures] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [governorates, setGovernorates] = useState([]);
  const [offices, setOffices] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [lectureTypeNames, setlectureTypeNames] = useState([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    startDate: null,
    endDate: null,
    companyId: null,
    lectureTypeIds: [],
  });
  const [isLoading, setIsLoading] = useState(true); // Loading state

  const formatToISO = (date) => {
    if (!date) return null;
    return date.toISOString();
  };

  const fetchLectures = async (payload) => {
    try {
      setIsLoading(true); // Start loading
      const response = await axiosInstance.post(
        `${Url}/api/Lecture/search`,
        {
          title: payload.title || "",
          officeId: payload.officeId || null,
          governorateId: payload.governorateId || null,
          startDate: payload.startDate || null,
          endDate: payload.endDate || null,
          companyId: payload.companyId || null,
          lectureTypeIds: payload.lectureTypeIds || [],
          PaginationParams: {
            PageNumber: payload.PaginationParams.PageNumber,
            PageSize: payload.PaginationParams.PageSize,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.data) {
        setLectures(response.data);
        const paginationHeader = response.headers["pagination"];
        if (paginationHeader) {
          const paginationInfo = JSON.parse(paginationHeader);
          setTotalLectures(paginationInfo.totalItems);
        } else {
          setTotalLectures(response.data.length);
        }
      }
    } catch (error) {
      message.error(
        `حدث خطأ أثناء جلب المحاضر: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  const handleSearch = async (page = 1) => {
    const payload = {
      title: formData.title || "",
      officeId: isSupervisor ? profile.officeId : selectedOffice || null,
      governorateId: isSupervisor
        ? profile.governorateId
        : selectedGovernorate || null,
      startDate: formData.startDate ? formatToISO(formData.startDate) : null,
      endDate: formData.endDate ? formatToISO(formData.endDate) : null,
      companyId: formData.companyId || null,
      lectureTypeIds: formData.lectureTypeIds || [],
      PaginationParams: {
        PageNumber: page,
        PageSize: pageSize,
      },
    };

    await fetchLectures(payload);
  };

  const handleDateChange = (date, dateType) => {
    setFormData((prev) => ({
      ...prev,
      [dateType]: date,
    }));
  };

  const fetchGovernorates = useCallback(async () => {
    try {
      const response = await axiosInstance.get(
        `${Url}/api/Governorate/dropdown`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setGovernorates(response.data);

      if (isSupervisor) {
        setSelectedGovernorate(profile.governorateId);
        await fetchOffices(profile.governorateId);
      }
    } catch (error) {
      message.error("حدث خطأ أثناء جلب بيانات المحافظات");
    }
  }, [accessToken, isSupervisor, profile]);

  const fetchCompanies = async () => {
    try {
      const response = await axiosInstance.get(`${Url}/api/Company`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setCompanies(response.data);
      setlectureTypeNames([]);
      setFormData((prev) => ({
        ...prev,
        companyId: null,
        lectureTypeIds: [],
      }));
    } catch (error) {
      message.error("حدث خطأ أثناء جلب بيانات الشركات");
    }
  };

  const handleCompanyChange = (companyId) => {
    setFormData((prev) => ({
      ...prev,
      companyId,
      lectureTypeIds: [],
    }));

    const selectedCompany = companies.find(
      (company) => company.id === companyId
    );
    if (selectedCompany) {
      setlectureTypeNames(selectedCompany.lectureTypes || []);
    } else {
      setlectureTypeNames([]);
    }
  };

  const fetchOffices = async (governorateId) => {
    if (!governorateId) {
      setOffices([]);
      setSelectedOffice(null);
      return;
    }

    try {
      const response = await axiosInstance.get(
        `${Url}/api/Governorate/dropdown/${governorateId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (response.data && response.data[0] && response.data[0].offices) {
        setOffices(response.data[0].offices);

        if (isSupervisor) {
          setSelectedOffice(profile.officeId);
        }
      }
    } catch (error) {
      message.error("حدث خطأ أثناء جلب بيانات المكاتب");
    }
  };

  useEffect(() => {
    const initialPayload = {
      title: "",
      officeId: isSupervisor ? profile.officeId : null,
      governorateId: isSupervisor ? profile.governorateId : null,
      startDate: null,
      endDate: null,
      companyId: null,
      lectureTypeIds: [],
      PaginationParams: {
        PageNumber: 1,
        PageSize: pageSize,
      },
    };

    fetchLectures(initialPayload);
  }, [isSupervisor, profile.officeId, profile.governorateId]);

  useEffect(() => {
    fetchGovernorates();
    fetchCompanies();
  }, [fetchGovernorates]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    handleSearch(page);
  };

  const handleGovernorateChange = async (value) => {
    setSelectedGovernorate(value);
    setSelectedOffice(null);
    await fetchOffices(value);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  const handleInputChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      title: value,
    }));
  };

  const handleReset = async () => {
    setFormData({
      title: "",
      startDate: null,
      endDate: null,
      companyId: null,
      lectureTypeIds: [],
    });
    setCurrentPage(1);

    if (!isSupervisor) {
      setSelectedGovernorate(null);
      setSelectedOffice(null);
      setOffices([]);
    }

    const payload = {
      title: "",
      officeId: isSupervisor ? profile.officeId : null,
      governorateId: isSupervisor ? profile.governorateId : null,
      startDate: null,
      endDate: null,
      companyId: null,
      lectureTypeIds: [],
      PaginationParams: {
        PageNumber: 1,
        PageSize: pageSize,
      },
    };

    await fetchLectures(payload);
    message.success("تم إعادة تعيين الفلاتر بنجاح");
  };

  const columns = [
    {
      title: "عنوان المحضر",
      dataIndex: "title",
      key: "title",
      className: "table-column-Lecturer-address",
    },
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
      className: "table-column-date",
      render: (text) => {
        const date = new Date(text);
        return isNaN(date.getTime())
          ? "تاريخ غير صالح"
          : date.toLocaleDateString("en-CA");
      },
    },
    {
      title: "المكتب",
      dataIndex: "officeName",
      key: "officeName",
      className: "table-column-Lecturer-address",
    },
    {
      title: "المحافظة",
      dataIndex: "governorateName",
      key: "governorateName",
      className: "table-column-Lecturer-address",
    },
    {
      title: "اسم الشركة",
      dataIndex: "companyName",
      key: "companyName",
      className: "table-column-Lecturer-address",
    },
    {
      title: "التفاصيل",
      key: "details",
      className: "table-column-details",
      render: (_, record) => (
        <Link
          to="/supervisor/lecturer/history/LecturerShow"
          state={{ id: record.id }}
          className="supervisor-Lectur-details-link">
          عرض
        </Link>
      ),
    },
  ];

  return (
    <div
      className={`supervisor-passport-dameged-page ${
        isSidebarCollapsed ? "sidebar-collapsed" : ""
      }`}
      dir="rtl">
      <h1 className="supervisor-passport-dameged-title">المحاضر</h1>

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 10 }} /> // Skeleton loading effect
      ) : (
        <>
          <div
            className={`supervisor-passport-dameged-filters ${
              searchVisible ? "animate-show" : "animate-hide"
            }`}>
            <form onSubmit={handleFormSubmit} className="supervisor-passport-dameged-form">
              <div className="filter-field">
                <label htmlFor="governorate" className="supervisor-Lectur-label">
                  المحافظة
                </label>
                <Select
                  id="governorate"
                  value={selectedGovernorate || undefined}
                  onChange={handleGovernorateChange}
                  disabled={isSupervisor}
                  className="supervisor-Lectur-select"
                  placeholder="اختر المحافظة">
                  {governorates.map((gov) => (
                    <Select.Option key={gov.id} value={gov.id}>
                      {gov.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div className="filter-field">
                <label htmlFor="office" className="supervisor-Lectur-label">
                  اسم المكتب
                </label>
                <Select
                  id="office"
                  value={selectedOffice || undefined}
                  onChange={(value) => setSelectedOffice(value)}
                  disabled={isSupervisor || !selectedGovernorate}
                  className="supervisor-Lectur-select">
                  {offices.map((office) => (
                    <Select.Option key={office.id} value={office.id}>
                      {office.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div className="filter-field">
                <label htmlFor="company" className="supervisor-Lectur-label">
                  الشركة
                </label>
                <Select
                  id="company"
                  value={formData.companyId || undefined}
                  onChange={handleCompanyChange}
                  className="supervisor-Lectur-select">
                  {companies.map((company) => (
                    <Select.Option key={company.id} value={company.id}>
                      {company.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div className="filter-field">
                <label htmlFor="title" className="supervisor-Lectur-label">
                  عنوان المحضر
                </label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="supervisor-Lectur-input"
                />
              </div>

              <div className="filter-field">
                <label>نوع المحضر</label>
                <Select
                  id="lectureTypeIds"
                  mode="multiple"
                  value={formData.lectureTypeIds}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, lectureTypeIds: value }))
                  }
                  className="filter-dropdown"
                  style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {lectureTypeNames.map((type) => (
                    <Select.Option key={type.id} value={type.id}>
                      {type.name}
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div className="supervisor-Lectur-field-wrapper">
                <label htmlFor="startDate" className="supervisor-Lectur-label">
                  التاريخ
                </label>
                <DatePicker
                  id="startDate"
                  placeholder="اختر التاريخ"
                  onChange={(date) => handleDateChange(date, "startDate")}
                  value={formData.startDate}
                  className="supervisor-passport-dameged-input"
                />
              </div>

              <div className="supervisor-Lectur-buttons">
                <Button
                  htmlType="submit"
                  className="supervisor-passport-dameged-button">
                  ابحث
                </Button>
                <Button onClick={handleReset} className="supervisor-passport-dameged-button">
                  إعادة تعيين
                </Button>
              </div>

              {hasCreatePermission && (
                <Link to="/supervisor/lecturerAdd/supervisorlecturerAdd">
                  <Button type="primary" className="supervisor-passport-dameged-add-button">
                    اضافة محضر جديد +
                  </Button>
                </Link>
              )}
            </form>
          </div>

          <div className="supervisor-Lectur-table-container">
            <ConfigProvider direction="rtl">
              <Table
                dataSource={lectures}
                columns={columns}
                rowKey="id"
                bordered
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  total: totalLectures,
                  position: ["bottomCenter"],
                  onChange: handlePageChange,
                }}
                locale={{ emptyText: "لا توجد بيانات" }}
                className="supervisor-Lectur-table"
              />
            </ConfigProvider>
          </div>
        </>
      )}
    </div>
  );
};

export default SuperVisorLecturerhistory;