import React, { useState, useEffect } from "react"; // Import React hooks
import { Table, Button, Modal, Form, Input, Select, message, Spin } from "antd"; // Import Ant Design components
import axios from "axios"; // Import Axios for HTTP requests
import Dashboard from "./../../../pages/dashBoard.jsx"; // Import the Dashboard component
import TextFieldForm from "./../../../reusable elements/ReuseAbleTextField.jsx"; // Import a reusable TextFieldForm component
import "./AdminUserManagment.css"; // Import CSS for styling

const { Option } = Select; // Destructure Option for use in Select components

const AdminUserManagment = () => {
  const [userRecords, setUserRecords] = useState([]); // State to store user records
  const [filteredRecords, setFilteredRecords] = useState([]); // State to store filtered user records
  const [governorates, setGovernorates] = useState([]); // State to store governorates
  const [offices, setOffices] = useState([]); // State to store offices
  const [loading, setLoading] = useState(false); // State to track loading status
  const [addModalVisible, setAddModalVisible] = useState(false); // State to control visibility of the add user modal
  const [form] = Form.useForm(); // Ant Design Form instance for managing form inputs

  // Fetch data from APIs when the component mounts
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true); // Set loading to true while fetching data
      try {
        // Fetch offices and governorates in parallel
        const [officesResponse, governoratesResponse] = await Promise.all([
          axios.get("http://localhost:5214/api/office"), // Fetch offices
          axios.get("http://localhost:5214/api/Governorate"), // Fetch governorates
        ]);

        // Update state with fetched data
        setOffices(Array.isArray(officesResponse.data) ? officesResponse.data : []);
        setGovernorates(Array.isArray(governoratesResponse.data) ? governoratesResponse.data : []);
      } catch (error) {
        console.error("Error fetching data:", error); // Log any errors
        message.error("فشل تحميل البيانات"); // Show error message to the user
      } finally {
        setLoading(false); // Set loading to false after data fetching is complete
      }
    };

    fetchInitialData(); // Call the data fetching function
  }, []); // Empty dependency array means this runs only once, after the component mounts

  // Apply filters to the user records based on the provided filters
  const applyFilters = (filters) => {
    const { username, role, governorate, officeName } = filters; // Destructure filters

    // Filter user records based on the provided criteria
    const filtered = userRecords.filter((record) => {
      const matchesUsername =
        !username || record.username.toLowerCase().includes(username.toLowerCase());
      const matchesRole =
        !role || record.role.toLowerCase() === role.toLowerCase();
      const matchesGovernorate =
        !governorate || record.governorate.includes(governorate);
      const matchesOfficeName =
        !officeName || record.officeName.includes(officeName);

      return (
        matchesUsername &&
        matchesRole &&
        matchesGovernorate &&
        matchesOfficeName
      );
    });

    setFilteredRecords(filtered.length > 0 ? filtered : []); // Update filtered records state
  };

  // Reset filters to show all user records
  const resetFilters = () => {
    setFilteredRecords(userRecords); // Reset to all user records
  };

  // Handle adding a new user
  const handleAddUser = async (values) => {
    try {
      // Send a POST request to the API to add the user
      const response = await axios.post("http://localhost:5214/api/account/register", values);
      setUserRecords((prev) => [...prev, response.data]); // Add the new user to the user records
      setFilteredRecords((prev) => [...prev, response.data]); // Add the new user to the filtered records
      message.success("تمت إضافة المستخدم بنجاح"); // Show success message
      setAddModalVisible(false); // Close the modal
      form.resetFields(); // Reset the form fields
    } catch (error) {
      console.error("Error adding user:", error); // Log any errors
      message.error("فشل إضافة المستخدم"); // Show error message to the user
    }
  };

  // Define the columns for the Ant Design Table
  const columns = [
    {
      title: "اسم المستخدم", // Table column header
      dataIndex: "username", // Key to access the username from user records
      key: "username", // Unique key for this column
    },
    {
      title: "الصلاحية", // Table column header
      dataIndex: "role", // Key to access the role from user records
      key: "role", // Unique key for this column
    },
    {
      title: "المحافظة", // Table column header
      dataIndex: "governorate", // Key to access the governorate from user records
      key: "governorate", // Unique key for this column
    },
    {
      title: "اسم المكتب", // Table column header
      dataIndex: "officeName", // Key to access the office name from user records
      key: "officeName", // Unique key for this column
    },
    {
      title: "الإجراءات", // Table column header for actions
      key: "actions", // Unique key for this column
      render: (_, record) => (
        <Button
          type="primary"
          style={{
            backgroundColor: "#1890ff",
            border: "none",
            color: "#fff",
            borderRadius: "4px",
          }}
          onClick={() => console.log("Edit:", record)} // Handle edit action
        >
          تعديل
        </Button>
      ),
    },
  ];

  return (
    <>
      <Dashboard /> {/* Include the Dashboard component */}
      <div className="admin-user-management-container" dir="rtl">
        <h1 className="admin-header">إدارة المستخدمين</h1> {/* Page header */}

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
                  { value: "1", label: "Admin" },
                  { value: "manager", label: "مدير قسم" },
                  { value: "employee", label: "موظف" },
                ],
              },
              {
                name: "governorate",
                label: "المحافظة",
                type: "dropdown",
                options: governorates.map((gov) => ({
                  value: gov.name,
                  label: gov.name,
                })),
              },
              {
                name: "officeName",
                label: "اسم المكتب",
                type: "dropdown",
                options: offices.map((office) => ({
                  value: office.name,
                  label: office.name,
                })),
              },
            ]}
            onFormSubmit={applyFilters} // Call applyFilters on form submission
            onReset={resetFilters} // Call resetFilters on reset
            formClassName="filter-row"
            inputClassName="filter-input"
            dropdownClassName="filter-dropdown"
            fieldWrapperClassName="filter-field-wrapper"
            buttonClassName="filter-button"
          />
        </div>

        {/* Data Table Section */}
        <div className="data-table-container">
          <div className="add-button-container">
            <Button
              type="primary"
              style={{
                marginBottom: "15px",
                backgroundColor: "#1890ff",
                border: "none",
              }}
              onClick={() => setAddModalVisible(true)} // Show add user modal
            >
              + إضافة
            </Button>
          </div>
          <Spin spinning={loading}> {/* Show loading spinner while fetching data */}
            <Table
              dataSource={filteredRecords} // Data for the table
              columns={columns} // Columns for the table
              rowKey="id" // Unique key for rows
              bordered
              pagination={{ pageSize: 5 }} // Pagination settings
            />
          </Spin>
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        title="إضافة مستخدم جديد" // Modal title
        visible={addModalVisible} // Modal visibility
        onCancel={() => setAddModalVisible(false)} // Close modal on cancel
        footer={null} // Remove footer buttons
      >
        <Form form={form} onFinish={handleAddUser} layout="vertical"> {/* Form for adding a new user */}
          <Form.Item
            name="username"
            label="اسم المستخدم"
            rules={[{ required: true, message: "يرجى إدخال اسم المستخدم" }]}
          >
            <Input placeholder="اسم المستخدم" />
          </Form.Item>
          <Form.Item
            name="role"
            label="الصلاحية"
            rules={[{ required: true, message: "يرجى اختيار الصلاحية" }]}
          >
            <Select placeholder="اختر الصلاحية">
              <Option value="1">Admin</Option>
              <Option value="manager">مدير قسم</Option>
              <Option value="employee">موظف</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="governorate"
            label="المحافظة"
            rules={[{ required: true, message: "يرجى اختيار المحافظة" }]}
          >
            <Select placeholder="اختر المحافظة">
              {governorates.map((gov) => (
                <Option key={gov.id} value={gov.name}>
                  {gov.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="officeName"
            label="اسم المكتب"
            rules={[{ required: true, message: "يرجى إدخال اسم المكتب" }]}
          >
            <Select placeholder="اختر المكتب">
              {offices.map((office) => (
                <Option key={office.id} value={office.name}>
                  {office.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="password"
            label="كلمة السر"
            rules={[{ required: true, message: "يرجى إدخال كلمة السر" }]}
          >
            <Input.Password placeholder="كلمة السر" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="تأكيد كلمة السر"
            dependencies={["password"]}
            rules={[
              {
                required: true,
                message: "يرجى تأكيد كلمة السر",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("كلمات السر غير متطابقة!"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="تأكيد كلمة السر" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            إضافة
          </Button>
        </Form>
      </Modal>
    </>
  );
};

export default AdminUserManagment;
