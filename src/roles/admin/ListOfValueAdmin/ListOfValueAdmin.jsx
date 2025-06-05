// ListOfValueAdmin.jsx
import React, { useState, useEffect } from "react";
import "./ListOfValueAdmin.css";
import Icons from "./../../../reusable elements/icons.jsx";
import {
  Table,
  Modal,
  Form,
  Input,
  Button,
  message,
  ConfigProvider,
  Select,
  Space,Tabs 

} from "antd";
import axiosInstance from "./../../../intercepters/axiosInstance.js";
import { getAuthorizedLOVRoutes, LOVConfig } from "./LovConfig.js";
import useAuthStore from "./../../../store/store.js";

export default function ListOfValueAdmin() {
  const { permissions, isSidebarCollapsed  } = useAuthStore();
  const [authorizedMenuItems, setAuthorizedMenuItems] = useState([]);
  const [selectedData, setSelectedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [columns, setColumns] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [formFields, setFormFields] = useState([]);
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [currentPath, setCurrentPath] = useState(null);
  const [currentLabel, setCurrentLabel] = useState("تفاصيل القيمة");
  const [hierarchyConfig, setHierarchyConfig] = useState(null);   // يحتفظ بكامل كائن tabs
const [currentTabKey,    setCurrentTabKey]  = useState(null);   // المفتاح الحالى (ministry, generalDirectorate ...)

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // NEW: State for office search (only used when currentPath === "/admin/add-office")
  const [officeSearch, setOfficeSearch] = useState({
    GovernorateId: null,
    Name: "",
    Code: null,
    IsEmbassy: null,
  });

  // Set authorized menu items based on the permissions from the auth store
  useEffect(() => {
    if (Array.isArray(permissions)) {
      const authorizedRoutes = getAuthorizedLOVRoutes(permissions);
      setAuthorizedMenuItems(authorizedRoutes);
    }
  }, [permissions]);

  // Transform the fetched data based on the current path
  const transformData = (data) => {
    if (currentPath === "/admin/lecture-types") {
      return data.map((item) => ({
        ...item,
        key: item.id,
        id: item.id,
        name: item.name,
        companyName: item.companyName,
      }));
    }
    if (currentPath === "/admin/add-office") {
      return data.map((item) => ({
        ...item,
        key: item.officeId || item.id,
        id: item.officeId || item.id,
      }));
    }
    return data.map((item) => ({
      ...item,
      key: item.id?.toString() || Math.random().toString(),
    }));
  };

  // Fetch data from the API based on the current configuration endpoint
  const fetchData = async (endpoint, page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `${endpoint}?PageNumber=${page}&PageSize=${pageSize}`
      );
      let formattedData = transformData(response.data);
      setSelectedData(formattedData);

      const paginationHeader = response.headers["pagination"];
      if (paginationHeader) {
        const paginationInfo = JSON.parse(paginationHeader);
        setPagination({
          current: paginationInfo.currentPage,
          pageSize: paginationInfo.itemsPerPage,
          total: paginationInfo.totalItems,
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("فشل تحميل البيانات");
      setSelectedData([]);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Handle office search using a POST request
  const handleOfficeSearch = async () => {
    // Build payload from officeSearch state (using 50 as page size by default)
    const payload = {
      GovernorateId: officeSearch.GovernorateId || null,
      Name: officeSearch.Name || "",
      Code: officeSearch.Code ? Number(officeSearch.Code) : null,
      IsEmbassy: officeSearch.IsEmbassy,
      PaginationParams: {
        PageNumber: 1,
        PageSize: 10,
      },
    };
    setLoading(true);
    try {
      const response = await axiosInstance.post("/api/office/search", payload);
      let formattedData = transformData(response.data);
      setSelectedData(formattedData);
      const paginationHeader = response.headers["pagination"];
      if (paginationHeader) {
        const paginationInfo = JSON.parse(paginationHeader);
        setPagination({
          current: paginationInfo.currentPage,
          pageSize: paginationInfo.itemsPerPage,
          total: paginationInfo.totalItems,
        });
      }
    } catch (error) {
      console.error("Error searching offices:", error);
      message.error("فشل البحث عن المكاتب");
    } finally {
      setLoading(false);
    }
  };

  // NEW: Reset the office search form and re-fetch data without search filters
  const handleOfficeSearchReset = async () => {
    setOfficeSearch({
      GovernorateId: null,
      Name: "",
      Code: null,
      IsEmbassy: null,
    });
    // Re-fetch the default data using the getEndpoint of the current config
    if (selectedConfig) {
      fetchData(selectedConfig.getEndpoint, 1, pagination.pageSize);
    }
  };

  // Setup columns and form fields (including fetching dropdown options if needed)
  const setupColumnsAndFormFields = async () => {
    if (!selectedConfig) return;

    const updatedFormFields = await Promise.all(
      selectedConfig.formFields.map(async (field) => {
        if (field.type === "dropdown" && field.optionsEndpoint) {
          try {
            const response = await axiosInstance.get(field.optionsEndpoint);
            let options;
            if (
              currentPath === "/admin/lecture-types" &&
              field.name === "companyId"
            ) {
              options = response.data.map((company) => ({
                label: company.name,
                value: company.id,
              }));
            } else {
              options = response.data.map((item) => ({
                label: item.name,
                value: item.id,
              }));
            }
            setDropdownOptions((prev) => ({
              ...prev,
              [field.name]: options,
            }));
            return { ...field, options };
          } catch (error) {
            console.error(`Error fetching options for ${field.name}:`, error);
            message.error(`فشل تحميل الخيارات لـ ${field.label}`);
            return { ...field, options: [] };
          }
        }
        return field;
      })
    );

    const enhancedColumns = [
      ...selectedConfig.columns,
      {
        title: "إجراءات",
        key: "actions",
        render: (_, record) => (
          <Space>
            <Button
              type="primary"
              onClick={() => handleEdit(record)}
              disabled={loading}
            >
              تعديل
            </Button>
            <Button
              danger
              onClick={() => handleDelete(record.id)}
              disabled={loading}
            >
              حذف
            </Button>
          </Space>
        ),
      },
    ];

    setColumns(enhancedColumns);
    setFormFields(updatedFormFields);
  };

  // When a menu item is selected, fetch its configuration and data
  useEffect(() => {
    if (currentPath && selectedConfig) {
      fetchData(
        selectedConfig.getEndpoint,
        pagination.current,
        pagination.pageSize
      );
      setupColumnsAndFormFields();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath, selectedConfig]);

  // Handle clicking a menu item from the sidebar
  const handleItemClick = (item) => {
    if (!Array.isArray(permissions) || !permissions.includes(item.permission)) {
      message.error("ليس لديك صلاحية للوصول إلى هذا القسم");
      return;
    }
    const selected = LOVConfig[item.path];
    if (!selected) { message.error("لم يتم العثور على التكوين المطلوب"); return; }
  
    setCurrentPath(item.path);
    setCurrentLabel(item.label);
  
    // ✦ إذا كانت وزارة – اختَر أول تبويب افتراضياً
    if (item.path === "/admin/ministry-hierarchy") {
      const defaultKey   = "ministry";
      setHierarchyConfig(selected);               // tabs الكامل
      setCurrentTabKey(defaultKey);
      setSelectedConfig(selected.tabs[defaultKey]);
    } else {
      setHierarchyConfig(null);
      setSelectedConfig(selected);
    }
  };

  // Create the payload for POST/PUT requests based on the current path
  const createPayload = (values) => {
    if (selectedConfig?.payload) {
      return selectedConfig.payload({ ...values, id: editingId });
    }
    switch (currentPath) {
      case "/admin/lecture-types":
        return {
          name: values.name,
          companyId: values.companyId,
        };
  
case "/admin/add-office":
  return {
    officeId: editingId || undefined,
    name: values.name,
    code: Number(values.code),
    receivingStaff: Number(values.receivingStaff),
    accountStaff: Number(values.accountStaff),
    printingStaff: Number(values.printingStaff),
    qualityStaff: Number(values.qualityStaff),
    deliveryStaff: Number(values.deliveryStaff),
    governorateId: values.governorateId,
    budget: values.budget ? Number(values.budget) : null,
    isEmbassy: values.isEmbassy,
    isTwoShifts: values.isTwoShifts,     // New field added
    isProjectSite: values.isProjectSite  // New field added
  };
      case "/admin/device-types":
        return {
          id: editingId,
          name: values.name,
          description: values.description,
        };
      case "/admin/report-type":
        return {
          id: editingId, // Ensure the id is included in the payload
          name: values.name,
          description: values.description,
        };
      case "/admin/add-governorate":
        return {
          id: editingId,
          name: values.name,
          code: values.code,
          isCountry: values.isCountry, // New field added
        };
      case "/admin/damage-types":
      case "/admin/passport-dammage-types":
        return {
          id: editingId,
          name: values.name,
          description: values.description,
        };
      case "/admin/companies":
      case "/admin/expensess-types":
        return {
          id: editingId,
          name: values.name,
        };
      case "/admin/thrshhold":
        return {
          id: editingId,
          name: values.name,
          minValue: Number(values.minValue),
          maxValue: Number(values.maxValue),
        };
      case "/admin/email-report":
        return {
          id: editingId, // Include the id here
          fullName: values.fullName,
          email: values.email,
          reportTypeIds: values.reportTypeIds,
        };
      case "/admin/Archive-party":
          return {
              id:         editingId,
              name:       values.name,
              partyType:  values.partyType,
              isOfficial: values.isOfficial,
              projectId:  values.projectId,
            };
      case "/admin/Archive-projects":
        return {
          id: editingId, // Include the id here
          name: values.name,
        };
        case "/admin/document-cc":
  return {
    id: editingId,
    recipientName: values.recipientName,
  };

case "/admin/ministry":
case "/admin/tags":
  return {
    id: editingId,
    name: values.name,
  };
      default:
        return values;
    }
  };

  // Handle adding a new record
  const handleAdd = async (values) => {
    if (!selectedConfig) {
      message.error("الرجاء اختيار نوع البيانات أولاً");
      return;
    }
    setLoading(true);
    try {
      const payload = createPayload(values);
      await axiosInstance.post(selectedConfig.postEndpoint, payload);
      message.success("تمت إضافة البيانات بنجاح");
      setIsModalOpen(false);
      form.resetFields();
      await fetchData(
        selectedConfig.getEndpoint,
        pagination.current,
        pagination.pageSize
      );
    } catch (error) {
      console.error("Error adding record:", error);
      message.error("حدث خطأ أثناء الإضافة");
    } finally {
      setLoading(false);
    }
  };

  // Handle updating an existing record
  const handleUpdate = async (values) => {
    if (!selectedConfig || !editingId) {
      message.error("بيانات التحديث غير مكتملة");
      return;
    }
    setLoading(true);
    try {
      const endpoint = selectedConfig.putEndpoint?.(editingId);
      if (!endpoint) {
        throw new Error("Update endpoint not configured");
      }
      const payload = createPayload(values);
      await axiosInstance.put(endpoint, payload);
      message.success("تم تحديث البيانات بنجاح");
      setIsModalOpen(false);
      form.resetFields();
      await fetchData(
        selectedConfig.getEndpoint,
        pagination.current,
        pagination.pageSize
      );
      setIsEditMode(false);
      setEditingId(null);
    } catch (error) {
      console.error("Error updating record:", error);
      message.error("فشل تحديث السجل");
    } finally {
      setLoading(false);
    }
  };

  // Handle record deletion with a confirmation modal
  const handleDelete = async (id) => {
    if (!id || !selectedConfig) {
      message.error("معرف السجل غير متوفر");
      return;
    }
    Modal.confirm({
      title: "تأكيد الحذف",
      content: "هل أنت متأكد من حذف هذا السجل؟",
      okText: "نعم",
      cancelText: "لا",
      onOk: async () => {
        setLoading(true);
        try {
          const endpoint = selectedConfig.deleteEndpoint?.(id);
          if (!endpoint) {
            throw new Error("Delete endpoint not configured");
          }
          const config =
            currentPath === "/admin/add-office"
              ? { data: { officeId: id } }
              : undefined;
          await axiosInstance.delete(endpoint, config);
          message.success("تم حذف السجل بنجاح");
          await fetchData(
            selectedConfig.getEndpoint,
            pagination.current,
            pagination.pageSize
          );
        } catch (error) {
          console.error("Error deleting record:", error);
          message.error("فشل حذف السجل");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // Populate the form with the selected record’s data for editing
  const handleEdit = (record) => {
    console.log(record)
    if (!record.id) {
      message.error("معرف السجل غير متوفر");
      return;
    }
    let formData;
    switch (currentPath) {
case "/admin/add-office":
  formData = {
    name: record.name,
    code: record.code,
    receivingStaff: record.receivingStaff,
    accountStaff: record.accountStaff,
    printingStaff: record.printingStaff,
    qualityStaff: record.qualityStaff,
    deliveryStaff: record.deliveryStaff,
    governorateId: record.governorateId,
    budget: record.budget,
    isEmbassy: record.isEmbassy,
    isTwoShifts: record.isTwoShifts,     // New field added
    isProjectSite: record.isProjectSite  // New field added
  };
  break;
      case "/admin/add-governorate":
        formData = {
          name: record.name,
          code: record.code,
          isCountry: record.isCountry, // New field added
        };
        break;
      case "/admin/lecture-types":
        formData = {
          name: record.name,
          companyId: record.companyId,
        };
        break;
      case "/admin/thrshhold":
        formData = {
          name: record.name,
          minValue: record.minValue,
          maxValue: record.maxValue,
        };
        break;
      case "/admin/report-type":
        formData = {
          name: record.name,
          description: record.description,
        };
        break;
      case "/admin/email-report":
        formData = {
          fullName: record.fullName,
          email: record.email,
          reportTypeIds: record.reportTypes ? record.reportTypes.map((rt) => rt.id) : [],
        };
      case "/admin/Archive-party":
          formData = {
              name:       record.name,
              partyType:  record.partyType,
              isOfficial: record.isOfficial,
              projectId:  record.projectId,
            };
      case "/admin/Archive-projects":
        formData = {
          id: record.id,
          name: record.name,
          // datecreated: record.datecreated,
        };
        break;
        case "/admin/document-cc":
  formData = { recipientName: record.recipientName };
  break;

case "/admin/ministry":
case "/admin/tags":
  formData = { name: record.name };
  break;
      default:
        formData = {
          name: record.name,
          description: record.description,
        };
        break;
    }
    setIsEditMode(true);
    setEditingId(record.id);
    setIsModalOpen(true);
    form.setFieldsValue(formData);
  };

  // Open the modal for adding a new record
  const handleAddNew = () => {
    if (!selectedConfig) {
      message.error("الرجاء اختيار نوع البيانات أولاً");
      return;
    }
    setIsEditMode(false);
    setEditingId(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  // Render the correct form field based on its type.
  // Note: For dropdown fields, we now support an optional "mode" property.
  const renderFormField = (field) => {
    switch (field.type) {
      case "dropdown":
        // Use field.options if available (already fetched) or fallback to dropdownOptions
        const mode = field.mode || undefined;
        if (field.options) {
          return (
            <Select
              mode={mode}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              placeholder={`اختر ${field.label}`}
            >
              {field.options.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          );
        }
        const options = dropdownOptions[field.name] || [];
        return (
          <Select
            mode={mode}
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            placeholder={`اختر ${field.label}`}
            notFoundContent={options.length === 0 ? "لا توجد خيارات" : null}
          >
            {options.map((option) => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        );
      case "date":
        return (
          <Input
            type="date"
            placeholder={field.placeholder || `اختر ${field.label}`}
          />
        );
      case "number":
        return (
          <Input
            type="number"
            min={field.min}
            max={field.max}
            step={field.name === "budget" ? "0.01" : "1"}
            placeholder={field.placeholder || `ادخل ${field.label}`}
            onWheel={(e) => e.target.blur()}
            className="remove-arrows"
          />
        );
      default:
        return (
          <Input
            type={field.type || "text"}
            placeholder={field.placeholder || `ادخل ${field.label}`}
            maxLength={field.maxLength}
          />
        );
    }
  };

  return (
    <div className={`list-of-value-container ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`} dir="rtl">
      <div className="list-of-value-bar">
        <ul className="list-of-value-items">
          {authorizedMenuItems.map((item, index) => (
            <li
              key={index}
              className={`list-of-value-item ${currentPath === item.path ? "active" : ""}`}
              onClick={() => handleItemClick(item)}
            >
              <a className="list-of-value-link">
                <Icons type={item.icon} />
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="list-of-value-details-section-left">
        <div className="top-list-of-value-details-section-left">
          <h2>{currentLabel}</h2>
          <Button
            type="primary"
            onClick={handleAddNew}
            disabled={!selectedConfig || loading}
            className="attendance-add-button"
          >
            إضافة <Icons type="add" />
          </Button>
        </div>
        {/* NEW: Office search form inserted inside the details container */}
        {currentPath === "/admin/add-office" && (
          <div className="office-search-form" style={{ margin: "20px 0", padding: "10px", border: "1px solid #ddd" }}>
            <form className="supervisor-passport-dameged-form">
            <div className="filter-field">
            <label>اسم المكتب:</label>
                <Input
                  placeholder="ادخل اسم المكتب"
                  value={officeSearch.Name}
                  onChange={(e) =>
                    setOfficeSearch({ ...officeSearch, Name: e.target.value })
                  }
                />
                </div>
                <div className="filter-field">
              <label>الكود:</label>
                <Input
                  placeholder="ادخل الكود"
                  value={officeSearch.Code || ""}
                  onChange={(e) =>
                    setOfficeSearch({ ...officeSearch, Code: e.target.value })
                  }
                />
              </div>
              <div className="filter-field">
                <label>المحافظة</label>
                <Select
                  className="filter-dropdown"
                  placeholder="اختر المحافظة"
                  value={officeSearch.GovernorateId}
                  onChange={(value) =>
                    setOfficeSearch({ ...officeSearch, GovernorateId: value })
                  }
                  style={{ width: 150 }}
                >
                  <Select.Option value={null}>الكل</Select.Option>
                  {(dropdownOptions["governorateId"] || []).map((option) => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
              </div>
              <div className="filter-field" >
                <label >سفارة:</label>
                <Select
                  className="filter-dropdown"
                  placeholder="الكل"
                  value={officeSearch.IsEmbassy}
                  onChange={(value) =>
                    setOfficeSearch({ ...officeSearch, IsEmbassy: value })
                  }
                  style={{ width: "120px" }}
                >
                  <Select.Option value={null}>الكل</Select.Option>
                  <Select.Option value={true}>نعم</Select.Option>
                  <Select.Option value={false}>لا</Select.Option>
                </Select>
              </div>
              <div className="filter-field">
                <Button type="primary"  onClick={handleOfficeSearch} className="supervisor-passport-dameged-button">
                  بحث
                </Button>
              </div>
              <div className="filter-field">
                <Button type="primary" onClick={handleOfficeSearchReset} className="supervisor-passport-dameged-button">إعادة تعيين</Button>
              </div>
            </form>
          </div>
        )}
        <ConfigProvider direction="rtl">
        {currentPath === "/admin/ministry-hierarchy" && hierarchyConfig && (
  <Tabs
  
    activeKey={currentTabKey}
    /* هنا نضع onChange مع فحص الصلاحية */
    onChange={(key) => {
      const tab = hierarchyConfig.tabs[key];

      // ↳ فحص الصلاحية قبل التبديل
      if (
        Array.isArray(permissions) &&
        tab.permission &&                       // إن حُدِّدَت صلاحية
        !permissions.includes(tab.permission)  // والمستخدم لا يملكها
      ) {
        message.error("ليس لديك صلاحية لهذا القسم");
        return;                                // أوقف التبديل
      }

      // ↳ السماح بالتبديل
      setCurrentTabKey(key);
      setSelectedConfig(tab);
      setCurrentLabel(tab.label);
    }}
    style={{ marginBottom: 24 }}
  >
    {Object.entries(hierarchyConfig.tabs).map(([key, tab]) => (
      <Tabs.TabPane key={key} tab={tab.label} />
    ))}
  </Tabs>
)}
          <Table
            columns={columns}
            dataSource={selectedData}
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              position: ["bottomCenter"],
              showTotal: (total) => `إجمالي السجلات: ${total}`,
              onChange: (page, pageSize) => {
                fetchData(selectedConfig.getEndpoint, page, pageSize);
              },
              onShowSizeChange: (current, size) => {
                fetchData(selectedConfig.getEndpoint, 1, size);
              },
            }}
            bordered
            locale={{ emptyText: "لا توجد بيانات" }}
          />
        </ConfigProvider>
      </div>

      <ConfigProvider direction="rtl">
        <Modal
          title={isEditMode ? "تعديل القيمة" : "إضافة قيمة جديدة"}
          open={isModalOpen}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingId(null);
            setIsEditMode(false);
            form.resetFields();
          }}
          footer={null}
          maskClosable={false}
        >
          <Form
            form={form}
            className="dammaged-passport-container-edit-modal"
            onFinish={isEditMode ? handleUpdate : handleAdd}
            layout="vertical"
          >
            {formFields.map((field) => (
              <Form.Item
                key={field.name}
                name={field.name}
                label={field.label}
                style={{ marginTop: "20px" }}
                rules={[
                  {
                    required: true,
                    message: `الرجاء إدخال ${field.label}`,
                  },
                ]}
              >
                {renderFormField(field)}
              </Form.Item>
            ))}
            <Form.Item style={{ marginTop: "20px" }}>
              <Space style={{ justifyContent: "flex-end", width: "100%" }}>
                <Button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                    setIsEditMode(false);
                    form.resetFields();
                  }}
                >
                  إلغاء
                </Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {isEditMode ? "تحديث" : "إضافة"}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </ConfigProvider>
    </div>
  );
}
