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
  Space,
  Tabs,
  Checkbox,
  Divider,
  Tag,
} from "antd";
import axiosInstance from "./../../../intercepters/axiosInstance.js";
import { getAuthorizedLOVRoutes, LOVConfig } from "./LovConfig.js";
import useAuthStore from "./../../../store/store.js";

export default function ListOfValueAdmin() {
  const { permissions, isSidebarCollapsed } = useAuthStore();
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
  const [hierarchyConfig, setHierarchyConfig] = useState(null);
  const [currentTabKey, setCurrentTabKey] = useState(null);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Office search state (for /admin/add-office)
  const [officeSearch, setOfficeSearch] = useState({
    GovernorateId: null,
    Name: "",
    Code: null,
    IsEmbassy: null,
  });

  // ====== Role → Permissions (الصلاحيات للمناصب) state ======
  const isRolePermissionsPage = currentPath === "/admin/permtions";
  const [rpAll, setRpAll] = useState([]);                 // all perms [{permission, description}]
  const [rpSelected, setRpSelected] = useState({});       // { code: description|null }
  const [rolesList, setRolesList] = useState([]);         // ["Admin","Supervisor",...]
  const [selectedRoles, setSelectedRoles] = useState([]); // multi-select roles to apply to

  // helper to build payload array
  const buildRpArray = () =>
    Object.keys(rpSelected).map((code) => {
      const fallbackDesc =
        rpAll.find((p) => p.permission === code)?.description ?? null;
      return { permission: code, description: rpSelected[code] ?? fallbackDesc ?? null };
    });

  useEffect(() => {
    if (Array.isArray(permissions)) {
      const authorizedRoutes = getAuthorizedLOVRoutes(permissions);
      setAuthorizedMenuItems(authorizedRoutes);
    }
  }, [permissions]);

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

  const fetchData = async (endpoint, page = 1, pageSize = 10) => {
    if (!endpoint) return;
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `${endpoint}?PageNumber=${page}&PageSize=${pageSize}`
      );
      const formatted = transformData(response.data);
      setSelectedData(formatted);

      const paginationHeader = response.headers["pagination"];
      if (paginationHeader) {
        const info = JSON.parse(paginationHeader);
        setPagination({
          current: info.currentPage,
          pageSize: info.itemsPerPage,
          total: info.totalItems,
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

  const handleOfficeSearch = async () => {
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
      const formatted = transformData(response.data);
      setSelectedData(formatted);

      const paginationHeader = response.headers["pagination"];
      if (paginationHeader) {
        const info = JSON.parse(paginationHeader);
        setPagination({
          current: info.currentPage,
          pageSize: info.itemsPerPage,
          total: info.totalItems,
        });
      }
    } catch (error) {
      console.error("Error searching offices:", error);
      message.error("فشل البحث عن المكاتب");
    } finally {
      setLoading(false);
    }
  };

  const handleOfficeSearchReset = async () => {
    setOfficeSearch({ GovernorateId: null, Name: "", Code: null, IsEmbassy: null });
    if (selectedConfig) {
      fetchData(selectedConfig.getEndpoint, 1, pagination.pageSize);
    }
  };

  const setupColumnsAndFormFields = async () => {
    if (!selectedConfig) return;

    if (isRolePermissionsPage) {
      setColumns([]);
      setFormFields([]);
      return;
    }

    const updatedFormFields = await Promise.all(
      (selectedConfig.formFields || []).map(async (field) => {
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
            setDropdownOptions((prev) => ({ ...prev, [field.name]: options }));
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
      ...(selectedConfig.columns || []),
      {
        title: "إجراءات",
        key: "actions",
        render: (_, record) => (
          <Space>
            <Button type="primary" onClick={() => handleEdit(record)} disabled={loading}>
              تعديل
            </Button>
            <Button danger onClick={() => handleDelete(record.id)} disabled={loading}>
              حذف
            </Button>
          </Space>
        ),
      },
    ];

    setColumns(enhancedColumns);
    setFormFields(updatedFormFields);
  };

  useEffect(() => {
    if (currentPath && selectedConfig) {
      if (!isRolePermissionsPage) {
        fetchData(selectedConfig.getEndpoint, pagination.current, pagination.pageSize);
      }
      setupColumnsAndFormFields();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath, selectedConfig]);

  const handleItemClick = (item) => {
    if (!Array.isArray(permissions) || !permissions.includes(item.permission)) {
      message.error("ليس لديك صلاحية للوصول إلى هذا القسم");
      return;
    }

    const selected = LOVConfig[item.path];
    if (!selected) {
      message.error("لم يتم العثور على التكوين المطلوب");
      return;
    }

    setCurrentPath(item.path);
    setCurrentLabel(item.label);

    if (item.path === "/admin/ministry-hierarchy") {
      const defaultKey = "ministry";
      setHierarchyConfig(selected);
      setCurrentTabKey(defaultKey);
      setSelectedConfig(selected.tabs[defaultKey]);
    } else {
      setHierarchyConfig(null);
      setSelectedConfig(selected);
    }
  };

  const createPayload = (values) => {
    if (selectedConfig?.payload) return selectedConfig.payload({ ...values, id: editingId });

    switch (currentPath) {
      case "/admin/lecture-types":
        return { name: values.name, companyId: values.companyId };

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
          isTwoShifts: values.isTwoShifts,
          isProjectSite: values.isProjectSite,
        };

      case "/admin/device-types":
        return { id: editingId, name: values.name, description: values.description };

      case "/admin/report-type":
        return { id: editingId, name: values.name, description: values.description };

      case "/admin/add-governorate":
        return { id: editingId, name: values.name, code: values.code, isCountry: values.isCountry };

      case "/admin/damage-types":
      case "/admin/passport-dammage-types":
        return { id: editingId, name: values.name, description: values.description };

      case "/admin/companies":
      case "/admin/expensess-types":
        return { id: editingId, name: values.name };

      case "/admin/thrshhold":
        return { id: editingId, name: values.name, minValue: Number(values.minValue), maxValue: Number(values.maxValue) };

      case "/admin/email-report":
        return { id: editingId, fullName: values.fullName, email: values.email, reportTypeIds: values.reportTypeIds };

      case "/admin/Archive-party":
        return { id: editingId, name: values.name, partyType: values.partyType, isOfficial: values.isOfficial, projectId: values.projectId };

      case "/admin/Archive-projects":
        return { id: editingId, name: values.name };

      case "/admin/document-cc":
        return { id: editingId, recipientName: values.recipientName };

      case "/admin/ministry":
      case "/admin/tags":
        return { id: editingId, name: values.name };

      default:
        return values;
    }
  };

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
      await fetchData(selectedConfig.getEndpoint, pagination.current, pagination.pageSize);
    } catch (error) {
      console.error("Error adding record:", error);
      message.error("حدث خطأ أثناء الإضافة");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (values) => {
    if (!selectedConfig || !editingId) {
      message.error("بيانات التحديث غير مكتملة");
      return;
    }
    setLoading(true);
    try {
      const endpoint = selectedConfig.putEndpoint?.(editingId);
      if (!endpoint) throw new Error("Update endpoint not configured");

      const payload = createPayload(values);
      await axiosInstance.put(endpoint, payload);

      message.success("تم تحديث البيانات بنجاح");
      setIsModalOpen(false);
      form.resetFields();
      await fetchData(selectedConfig.getEndpoint, pagination.current, pagination.pageSize);
      setIsEditMode(false);
      setEditingId(null);
    } catch (error) {
      console.error("Error updating record:", error);
      message.error("فشل تحديث السجل");
    } finally {
      setLoading(false);
    }
  };

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
          if (!endpoint) throw new Error("Delete endpoint not configured");
          const config =
            currentPath === "/admin/add-office" ? { data: { officeId: id } } : undefined;
          await axiosInstance.delete(endpoint, config);
          message.success("تم حذف السجل بنجاح");
          await fetchData(selectedConfig.getEndpoint, pagination.current, pagination.pageSize);
        } catch (error) {
          console.error("Error deleting record:", error);
          message.error("فشل حذف السجل");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleEdit = (record) => {
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
          isTwoShifts: record.isTwoShifts,
          isProjectSite: record.isProjectSite,
        };
        break;

      case "/admin/add-governorate":
        formData = { name: record.name, code: record.code, isCountry: record.isCountry };
        break;

      case "/admin/lecture-types":
        formData = { name: record.name, companyId: record.companyId };
        break;

      case "/admin/thrshhold":
        formData = { name: record.name, minValue: record.minValue, maxValue: record.maxValue };
        break;

      case "/admin/report-type":
        formData = { name: record.name, description: record.description };
        break;

      case "/admin/email-report":
        formData = {
          fullName: record.fullName,
          email: record.email,
          reportTypeIds: record.reportTypes ? record.reportTypes.map((rt) => rt.id) : [],
        };
        break;

      case "/admin/Archive-party":
        formData = {
          name: record.name,
          partyType: record.partyType,
          isOfficial: record.isOfficial,
          projectId: record.projectId,
        };
        break;

      case "/admin/Archive-projects":
        formData = { id: record.id, name: record.name };
        break;

      case "/admin/document-cc":
        formData = { recipientName: record.recipientName };
        break;

      case "/admin/ministry":
      case "/admin/tags":
        formData = { name: record.name };
        break;

      default:
        formData = { name: record.name, description: record.description };
        break;
    }
    setIsEditMode(true);
    setEditingId(record.id);
    setIsModalOpen(true);
    form.setFieldsValue(formData);
  };

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

  const renderFormField = (field) => {
    switch (field.type) {
      case "dropdown": {
        const mode = field.mode || undefined;
        if (field.options) {
          return (
            <Select
              mode={mode}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
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
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
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
      }
      case "date":
        return <Input type="date" placeholder={field.placeholder || `اختر ${field.label}`} />;
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

  // ====== SPECIAL: load all permissions + all roles on entering role-permissions page ======
  useEffect(() => {
    const loadPermsAndRoles = async () => {
      try {
        setLoading(true);
        // all permissions
        const permsRes = await axiosInstance.get(
          `/api/Permission/all-permissions?pageNumber=1&pageSize=100`
        );
        setRpAll(Array.isArray(permsRes.data) ? permsRes.data : []);

        // all roles
        const rolesRes = await axiosInstance.get(`/api/profile/all-roles`);
        const list = Array.isArray(rolesRes.data) ? rolesRes.data : [];
        setRolesList(list);
      } catch (e) {
        console.error(e);
        message.error("فشل تحميل الصلاحيات أو الأدوار");
      } finally {
        setLoading(false);
      }
    };

    if (isRolePermissionsPage) {
      setRpSelected({});
      setSelectedRoles([]);
      loadPermsAndRoles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRolePermissionsPage]);

  const toggleRp = (permObj) => {
    const code = permObj.permission;
    setRpSelected((prev) => {
      const next = { ...prev };
      if (Object.prototype.hasOwnProperty.call(next, code)) {
        delete next[code];
        return next;
      }
      next[code] = permObj.description ?? null;
      return next;
    });
  };

  const setDescFor = (code, value) => {
    setRpSelected((prev) => ({ ...prev, [code]: value }));
  };

  const selectAllRp = () => {
    const map = {};
    rpAll.forEach((p) => (map[p.permission] = p.description ?? null));
    setRpSelected(map);
  };

  const clearAllRpSelections = () => setRpSelected({});

  const saveRolePermissions = async () => {
    if (!selectedRoles.length) {
      message.error("يرجى اختيار دور واحد على الأقل");
      return;
    }
    const payload = { permissionsWithDescriptions: buildRpArray() };
    try {
      setLoading(true);
      await Promise.all(
        selectedRoles.map((role) =>
          axiosInstance.put(`/api/Permission/role/${encodeURIComponent(role)}/permissions`, payload)
        )
      );
      message.success("تم حفظ الصلاحيات على الأدوار المحددة");
    } catch (e) {
      console.error(e);
      message.error("فشل حفظ صلاحيات الأدوار");
    } finally {
      setLoading(false);
    }
  };

  const deleteRolePermissions = async () => {
    if (!selectedRoles.length) {
      message.error("يرجى اختيار دور واحد على الأقل");
      return;
    }
    Modal.confirm({
      title: "حذف صلاحيات الأدوار",
      content: `سيتم حذف جميع صلاحيات: ${selectedRoles.join(", ")}. هل أنت متأكد؟`,
      okText: "نعم",
      cancelText: "لا",
      onOk: async () => {
        try {
          setLoading(true);
          await Promise.all(
            selectedRoles.map((role) =>
              axiosInstance.delete(`/api/Permission/role/${encodeURIComponent(role)}/permissions`)
            )
          );
          message.success("تم حذف صلاحيات الأدوار المحددة");
        } catch (e) {
          console.error(e);
          message.error("فشل حذف صلاحيات الأدوار");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <div className={`list-of-value-container ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`} dir="rtl">
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

          {!isRolePermissionsPage && (
            <Button
              type="primary"
              onClick={handleAddNew}
              disabled={!selectedConfig || loading}
              className="attendance-add-button"
            >
              إضافة <Icons type="add" />
            </Button>
          )}
        </div>

        {/* ====== SPECIAL UI: الصلاحيات للمناصب ====== */}
        {isRolePermissionsPage ? (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: "100%" }} size="large">
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ minWidth: 320, flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 6 }}>اختر الأدوار</label>
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="اختر دوراً أو أكثر"
                    value={selectedRoles}
                    onChange={setSelectedRoles}
                    options={(rolesList || []).map((r) => ({ value: r, label: r }))}
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ flexWrap: "wrap", display: "flex", gap: 6 }}>
                  {selectedRoles.map((r) => (
                    <Tag key={r} color="geekblue">{r}</Tag>
                  ))}
                </div>
                <div style={{ flex: 1, textAlign: "start" }}>
                  <Tag color="blue">PUT /api/Permission/role/&lt;Role&gt;/permissions</Tag>
                  <Tag>DELETE /api/Permission/role/&lt;Role&gt;/permissions</Tag>
                </div>
              </div>

              <Divider style={{ margin: "8px 0" }} />

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button onClick={selectAllRp} disabled={loading}>تحديد كل الصلاحيات</Button>
                <Button onClick={clearAllRpSelections} disabled={loading}>مسح تحديد الصلاحيات</Button>
                <Button type="primary" onClick={saveRolePermissions} loading={loading}>
                  حفظ الصلاحيات على الأدوار المحددة
                </Button>
                <Button danger onClick={deleteRolePermissions} disabled={loading}>
                  حذف صلاحيات الأدوار المحددة
                </Button>
              </div>

              <div style={{ maxHeight: 480, overflowY: "auto", padding: 8, border: "1px solid #eee", borderRadius: 8 }}>
                {rpAll.map((p) => {
                  const code = p.permission;
                  const checked = Object.prototype.hasOwnProperty.call(rpSelected, code);
                  return (
                    <div
                      key={code}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "32px 1fr 320px",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 6px",
                        borderBottom: "1px dashed #efefef",
                      }}
                    >
                      <Checkbox checked={checked} onChange={() => toggleRp(p)} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{code}</div>
                        {p.description ? (
                          <div style={{ color: "#666", fontSize: 12 }}>الوصف الافتراضي: {p.description}</div>
                        ) : (
                          <div style={{ color: "#999", fontSize: 12 }}>لا يوجد وصف افتراضي</div>
                        )}
                      </div>
                      <Input
                        placeholder="وصف مخصص (اختياري)"
                        value={checked ? (rpSelected[code] ?? "") : ""}
                        onChange={(e) => setDescFor(code, e.target.value)}
                        disabled={!checked}
                      />
                    </div>
                  );
                })}
                {rpAll.length === 0 && <div style={{ padding: 12, color: "#999" }}>لا توجد صلاحيات لعرضها</div>}
              </div>
            </Space>
          </div>
        ) : null}

        {/* ====== Ministry hierarchy tabs ====== */}
        <ConfigProvider direction="rtl">
          {currentPath === "/admin/ministry-hierarchy" && hierarchyConfig && (
            <Tabs
              activeKey={currentTabKey}
              onChange={(key) => {
                const tab = hierarchyConfig.tabs[key];
                if (
                  Array.isArray(permissions) &&
                  tab.permission &&
                  !permissions.includes(tab.permission)
                ) {
                  message.error("ليس لديك صلاحية لهذا القسم");
                  return;
                }
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

          {/* ====== Generic Table (hidden on role-permissions page) ====== */}
          {!isRolePermissionsPage && (
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
          )}
        </ConfigProvider>
      </div>

      {/* ====== Generic Add/Edit modal (not used on role-permissions page) ====== */}
      {!isRolePermissionsPage && (
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
                  rules={[{ required: true, message: `الرجاء إدخال ${field.label}` }]}
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
      )}
    </div>
  );
}
