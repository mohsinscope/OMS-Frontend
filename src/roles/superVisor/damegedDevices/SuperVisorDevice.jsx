import "./SuperVisorDevice.css";
import useAuthStore from "./../../../store/store";
import React, { useState, useEffect } from "react";
import { Table, message, Button } from "antd";
import { Link } from "react-router-dom";
import TextFieldForm from "./../../../reusable elements/ReuseAbleTextField.jsx";
import axios from "axios";
import Url from "./../../../store/url";
import moment from "moment";

export default function SuperVisorDevices() {
  const { isSidebarCollapsed, accessToken, profile } = useAuthStore();
  const [devicesList, setDevicesList] = useState([]);
  const [filterData, setFilterData] = useState({});
  const [loading, setLoading] = useState(true);
  const { searchVisible, toggleSearch } = useAuthStore(); // search visibility state from store

  // Fetch devices for the user's office and filter by profileId
  useEffect(() => {
    const fetchDevices = async () => {
      if (!profile || !profile.officeId) {
        message.error("Office ID is missing from the user profile.");
        return;
      }

      try {
        const response = await axios.get(`${Url}/api/DamagedDevice/office/${profile.officeId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const devices = response.data.filter((device) => device.profileId === profile.profileId);
        setDevicesList(devices);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching devices:", error.response?.data || error.message);
        message.error("حدث خطأ أثناء جلب البيانات");
        setLoading(false);
      }
    };

    fetchDevices();
  }, [accessToken, profile]);

  const fields = [
    {
      name: "سبب التلف",
      label: "سبب التلف",
      placeholder: "",
      type: "dropdown",
      options: [
        { value: "Broken Screen", label: "Broken Screen" },
        { value: "تلف مصنعي", label: "تلف مصنعي" },
      ],
    },
    {
      name: "نوع الجهاز",
      label: "نوع الجهاز",
      placeholder: "",
      type: "dropdown",
      options: [
        { value: "Smartphone", label: "Smartphone" },
        { value: "Scanner", label: "Scanner" },
      ],
    },
    {
      name: "date",
      label: "التاريخ",
      placeholder: "",
      type: "date",
    },
  ];

  const handleFilterSubmit = (formData) => {
    setFilterData(formData);

    // Filter the devices based on the form data
    const filteredDevices = devicesList.filter((device) => {
      const matchesReason =
        !formData["سبب التلف"] ||
        device.damagedDeviceTypesName === formData["سبب التلف"];
      const matchesType =
        !formData["نوع الجهاز"] ||
        device.deviceTypeName === formData["نوع الجهاز"];
      const matchesDate =
        !formData["التاريخ"] ||
        device.date.startsWith(formData["التاريخ"]);

      return matchesReason && matchesType && matchesDate;
    });

    if (filteredDevices.length === 0) {
      message.warning("لا توجد نتائج تطابق الفلاتر المحددة");
    }

    setDevicesList(filteredDevices);
  };

  const handleReset = () => {
    setFilterData({});
    setLoading(true);
    // Reload devices from the API
    const fetchDevices = async () => {
      if (!profile || !profile.officeId) {
        message.error("Office ID is missing from the user profile.");
        return;
      }

      try {
        const response = await axios.get(`${Url}/api/DamagedDevice/office/${profile.officeId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const devices = response.data.filter((device) => device.profileId === profile.profileId);
        setDevicesList(devices);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching devices:", error.response?.data || error.message);
        message.error("حدث خطأ أثناء جلب البيانات");
        setLoading(false);
      }
    };

    fetchDevices();
    message.success("تم إعادة تعيين الفلاتر بنجاح");
  };

  const columns = [
    {
      title: "نوع الجهاز",
      dataIndex: "deviceTypeName",
      key: "deviceTypeName",
      className: "table-column-device-type",
    },
    {
      title: "سبب التلف",
      dataIndex: "damagedDeviceTypesName",
      key: "damagedDeviceTypesName",
      className: "table-column-damage-reason",
    },
    {
      title: "التاريخ",
      dataIndex: "date",
      key: "date",
      className: "table-column-date",
      render: (text) => moment(text).format("YYYY-MM-DD"), // Format the date using moment
    },
    {
      title: "التفاصيل",
      key: "details",
      className: "table-column-details",
      render: (_, record) => (
        <Link
          to="/supervisor/damegedDevices/show"
          state={{ device: record }}
          className="supervisor-devices-dameged-details-link"
        >
          عرض
        </Link>
      ),
    },
  ];

  return (
    <div
      className={`supervisor-devices-dameged-page ${
        isSidebarCollapsed
          ? "sidebar-collapsed"
          : "supervisor-devices-dameged-page"
      }`}
      dir="rtl"
    >
      <h1 className="supervisor-devices-dameged-title">الأجهزة التالفة</h1>
      <div
        className={`supervisor-devices-dameged-filters ${
          searchVisible ? "animate-show" : "animate-hide"
        }`}
      >
        <TextFieldForm
          fields={fields}
          onFormSubmit={handleFilterSubmit}
          onReset={handleReset}
          formClassName="supervisor-devices-dameged-form"
          inputClassName="supervisor-devices-dameged-input"
          dropdownClassName="supervisor-devices-dameged-dropdown"
          fieldWrapperClassName="supervisor-devices-dameged-field-wrapper"
          buttonClassName="supervisor-devices-dameged-button"
        />
        <Link to="/supervisor/damegedDevices/add">
          <button className="supervisor-passport-dameged-button">
            اضافة جهاز تالف
          </button>
        </Link>
      </div>
      <div className="toggle-search-button">
        <Button type="primary" onClick={toggleSearch}>
          {searchVisible ? " بحث" : " بحث"}
        </Button>
      </div>
      <div className="supervisor-devices-dameged-table-container">
        <Table
          dataSource={devicesList}
          columns={columns}
          rowKey={(record) => record.id} // Unique rowKey based on ID
          bordered
          loading={loading}
          pagination={{
            pageSize: 15,
            position: ["bottomCenter"], // Center the pagination controls
          }}
          locale={{ emptyText: "لا توجد بيانات" }}
          className="supervisor-devices-dameged-table"
        />
      </div>
    </div>
  );
}
